import { saveRuleConfig, DEFAULT_RULE_GROUP_ID, DEFAULT_RULE_GROUP_NAME, SYSTEM_RULE_IDS, isSystemRule } from "..";
import { useAppStore } from "../../store/models/app";
import { usePermission } from "./usePermission";
import { Rule, RuleGroup } from "../class";
import { v4 as uuidv4 } from 'uuid';

// 树形节点（供 el-tree / el-tree-select 使用）
export interface RuleTreeNode {
	id: string;
	label: string;
	isGroup: boolean;
	points?: number | null;
	children?: RuleTreeNode[];
}

// Excel 批量导入的一行（分组按名称匹配，不存在时自动创建）
export interface RuleImportItem {
	groupName: string;
	name: string;
	points: number | null;
	allow_grades: string[];
	description: string;
}

// 同名规则的处理策略：skip 跳过 / overwrite 覆盖 / append 仍然新增
export type RuleImportDuplicateStrategy = 'skip' | 'overwrite' | 'append';

export interface RuleImportResult {
	groupCreated: number;
	added: number;
	updated: number;
	skipped: number;
	failed: number;
}

// 一键清空结果
export interface ClearRulesResult {
	/** 被删除的规则条数 */
	removedRules: number;
	/** 被删除的分组个数（默认分组除外） */
	removedGroups: number;
	/** 清空后保留的系统规则条数（主动加分 / 主动减分） */
	kept: number;
}

// 判断规则是否为自定义分值规则（points 为 null/undefined）
export const isNoPointsRule = (rule?: Partial<Rule> | null): boolean => {
	return !!rule && (rule.points === null || rule.points === undefined);
};

// 规则的固定分值区间（自定义分值规则返回 null）
export const getRulePoints = (rule?: Partial<Rule> | null): number | null => {
	if (!rule || isNoPointsRule(rule)) return null;
	return Number(rule.points);
};

// 规则分值的展示文案
export const formatRulePoints = (points: number | null | undefined): string => {
	if (points === null || points === undefined) return '自定义分值';
	return `${points > 0 ? '+' : ''}${points} 分`;
};

// 构建「分组 → 规则」两层树（分组节点不可选，仅用于分组展示）
export const buildRuleTree = (rules: Rule[] = [], groups: RuleGroup[] = []): RuleTreeNode[] => {
	const sortedGroups = [...groups].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
	const tree = sortedGroups.map(group => {
		const children = [...rules]
			.filter(rule => rule.group_id === group.id)
			.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
			.map(rule => ({
				id: rule.id,
				label: rule.name,
				isGroup: false,
				points: rule.points,
			} as RuleTreeNode));
		return {
			id: group.id,
			label: group.name,
			isGroup: true,
			children,
		} as RuleTreeNode;
	});
	// 兜底：不属于任何已知分组的规则，挂到「未分组」下，避免数据丢失
	const groupIds = new Set(sortedGroups.map(g => g.id));
	const orphans = rules.filter(rule => !groupIds.has(rule.group_id));
	if (orphans.length) {
		tree.push({
			id: '__ORPHAN__',
			label: '未分组',
			isGroup: true,
			children: orphans
				.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
				.map(rule => ({ id: rule.id, label: rule.name, isGroup: false, points: rule.points })),
		});
	}
	return tree;
};

export const useRule = () => {
	const appStore = useAppStore();
	const { isReadOnlySession } = usePermission();

	// 当前分组列表（按 order 排序）
	const getRuleGroupList = (): RuleGroup[] => {
		return [...(appStore.database.ruleGroupList || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
	};

	// 持久化规则配置（分组 + 规则，新格式；JSON.stringify 会自动调用 toJSON）
	const persist = async () => {
		await saveRuleConfig(appStore.database.ruleGroupList || [], appStore.database.ruleList || []);
	};

	// 将规则数组按「分组顺序 + 组内顺序」重排，保证各处读取顺序一致
	const sortRules = () => {
		const groupOrder = new Map((appStore.database.ruleGroupList || []).map(g => [g.id, g.order ?? 0]));
		appStore.database.ruleList.sort((a, b) => {
			const ga = groupOrder.get(a.group_id) ?? 999;
			const gb = groupOrder.get(b.group_id) ?? 999;
			if (ga !== gb) return ga - gb;
			return (a.order ?? 0) - (b.order ?? 0);
		});
	};

	// 分组内下一个排序值
	const nextRuleOrder = (groupId: string) => {
		const orders = appStore.database.ruleList
			.filter(item => item.group_id === groupId)
			.map(item => item.order ?? 0);
		return orders.length ? Math.max(...orders) + 1 : 0;
	};

	// ---------- 分组 ----------

	// 创建分组
	const createRuleGroup = async (name: string) => {
		if (isReadOnlySession()) return false;
		try {
			if (!appStore.database.ruleGroupList) appStore.database.ruleGroupList = [];
			const orders = appStore.database.ruleGroupList.map(item => item.order ?? 0);
			const order = orders.length ? Math.max(...orders) + 1 : 1;
			const group = new RuleGroup({ id: uuidv4(), name, order });
			appStore.database.ruleGroupList.push(group);
			await persist();
			return true;
		} catch (error) {
			console.error('创建规则分组出错:', error);
			return false;
		}
	}

	// 更新分组名称
	const updateRuleGroup = async (id: string, name: string) => {
		if (isReadOnlySession()) return false;
		try {
			const group = (appStore.database.ruleGroupList || []).find(item => item.id === id);
			if (!group) {
				console.error('规则分组不存在:', id);
				return false;
			}
			group.name = name;
			await persist();
			return true;
		} catch (error) {
			console.error('更新规则分组出错:', error);
			return false;
		}
	}

	// 删除分组：组内规则移动到默认分组后删除（默认分组不可删除）
	const deleteRuleGroup = async (id: string) => {
		if (isReadOnlySession()) return false;
		try {
			if (id === DEFAULT_RULE_GROUP_ID) {
				console.error('默认分组不可删除');
				return false;
			}
			appStore.database.ruleList.forEach(rule => {
				if (rule.group_id === id) rule.group_id = DEFAULT_RULE_GROUP_ID;
			});
			appStore.database.ruleGroupList = (appStore.database.ruleGroupList || []).filter(item => item.id !== id);
			sortRules();
			await persist();
			return true;
		} catch (error) {
			console.error('删除规则分组出错:', error);
			return false;
		}
	}

	// 批量导入（Excel）：按分组名归组，分组不存在时自动创建；同名规则按策略处理
	const importRules = async (
		items: RuleImportItem[],
		strategy: RuleImportDuplicateStrategy = 'skip',
	): Promise<RuleImportResult> => {
		const result: RuleImportResult = { groupCreated: 0, added: 0, updated: 0, skipped: 0, failed: 0 };
		if (isReadOnlySession()) return result;
		try {
			if (!appStore.database.ruleGroupList) appStore.database.ruleGroupList = [];
			if (!appStore.database.ruleList) appStore.database.ruleList = [];
			// 新分组追加在当前最大 order 之后
			const groupOrders = appStore.database.ruleGroupList.map(item => item.order ?? 0);
			let maxGroupOrder = groupOrders.length ? Math.max(...groupOrders) : 0;

			for (const item of items) {
				const ruleName = (item?.name || '').trim();
				if (!ruleName) {
					result.failed++;
					continue;
				}
				const groupName = (item.groupName || '').trim() || DEFAULT_RULE_GROUP_NAME;
				let group = appStore.database.ruleGroupList.find(g => g.name === groupName);
				if (!group) {
					group = new RuleGroup({ id: uuidv4(), name: groupName, order: ++maxGroupOrder });
					appStore.database.ruleGroupList.push(group);
					result.groupCreated++;
				}

				const existing = appStore.database.ruleList.find(
					rule => rule.group_id === group.id && rule.name === ruleName,
				);
				if (existing && strategy === 'skip') {
					result.skipped++;
					continue;
				}
				if (existing && strategy === 'overwrite') {
					existing.description = item.description || '';
					existing.points = item.points ?? null;
					existing.allow_grades = item.allow_grades || [];
					result.updated++;
					continue;
				}
				appStore.database.ruleList.push(new Rule({
					id: uuidv4(),
					name: ruleName,
					description: item.description || '',
					points: item.points ?? null,
					allow_grades: item.allow_grades || [],
					group_id: group.id,
					order: nextRuleOrder(group.id),
				}));
				result.added++;
			}
			sortRules();
			await persist();
			return result;
		} catch (error) {
			console.error('批量导入规则出错:', error);
			return result;
		}
	}

	// ---------- 规则 ----------

	// 一键清空：仅保留默认分组中的系统内置规则（主动加分 / 主动减分），其余规则与分组全部删除
	const clearRules = async (): Promise<ClearRulesResult> => {
		if (isReadOnlySession()) return { removedRules: 0, removedGroups: 0, kept: 0 };
		const rules = appStore.database.ruleList || [];
		const groups = appStore.database.ruleGroupList || [];
		const result: ClearRulesResult = {
			removedRules: rules.filter(rule => !isSystemRule(rule.id)).length,
			removedGroups: groups.filter(group => group.id !== DEFAULT_RULE_GROUP_ID).length,
			kept: 0,
		};
		try {
			// 分组：仅保留默认分组（缺失时补回）
			const defaultGroup = groups.find(group => group.id === DEFAULT_RULE_GROUP_ID)
				|| new RuleGroup({ id: DEFAULT_RULE_GROUP_ID, name: DEFAULT_RULE_GROUP_NAME, order: 0 });
			defaultGroup.name = defaultGroup.name || DEFAULT_RULE_GROUP_NAME;
			defaultGroup.order = 0;
			appStore.database.ruleGroupList = [defaultGroup];

			// 规则：按系统规则顺序保留现对象（保留用户改过的名称与分值），缺失时补建默认值
			const kept: Rule[] = [];
			SYSTEM_RULE_IDS.forEach((id, index) => {
				const found = rules.find(rule => rule.id === id);
				const rule = found || new Rule({
					id,
					name: id === 'ACTIVE_ADD' ? '主动加分' : '主动减分',
					description: id === 'ACTIVE_ADD' ? '默认主动加分规则' : '默认主动减分规则',
					points: id === 'ACTIVE_ADD' ? 1 : -1,
					allow_grades: [],
					group_id: DEFAULT_RULE_GROUP_ID,
					order: index,
				});
				// 系统规则回到默认分组并重排，保证列表顺序稳定
				rule.group_id = DEFAULT_RULE_GROUP_ID;
				rule.order = index;
				kept.push(rule);
			});
			appStore.database.ruleList = kept;
			result.kept = kept.length;
			await persist();
			return result;
		} catch (error) {
			console.error('清空规则出错:', error);
			return result;
		}
	}

	// 创建规则（points 传 null 表示自定义分值规则）
	const createRule = async (name: string, description: string, points: number | null, allow_grades: string[] = [], group_id: string = DEFAULT_RULE_GROUP_ID) => {
		if (isReadOnlySession()) return false;
		try {
			const uuid = uuidv4() as string
			const rule = new Rule({
				id: uuid,
				name,
				description,
				points,
				allow_grades,
				group_id,
				order: nextRuleOrder(group_id),
			})
			appStore.database.ruleList.push(rule);
			sortRules();
			await persist();
			return true
		} catch (error) {
			console.error('创建规则出错:', error);
			return false
		}
	}

	// 删除规则（系统内置规则不可删除）
	const deleteRule = async (id: string) => {
		if (isReadOnlySession()) return false;
		try {
			if (isSystemRule(id)) {
				console.error('系统内置规则不可删除:', id);
				return false
			}
			const index = appStore.database.ruleList.findIndex(item => item.id === id);
			if (index === -1) {
				console.error('规则不存在:', id);
				return false
			}
			appStore.database.ruleList.splice(index, 1);
			await persist();
			return true
		} catch (error) {
			console.error('删除规则出错:', error);
			return false
		}
	}

	// 更新规则（group_id 传入时一并迁移分组）
	const updateRule = async (id: string, name: string, description: string, points: number | null, allow_grades: string[] = [], group_id?: string) => {
		if (isReadOnlySession()) return false;
		try {
			const rule = appStore.database.ruleList.find(item => item.id === id);
			if (!rule) {
				console.error('规则不存在:', id);
				return false
			}
			// 迁移分组时重算组内排序
			if (group_id && group_id !== rule.group_id) {
				rule.order = nextRuleOrder(group_id);
				rule.group_id = group_id;
			}
			rule.name = name;
			rule.description = description;
			rule.points = (points === null || points === undefined) ? null : Number(points);
			rule.allow_grades = allow_grades;
			sortRules();
			await persist();
			return true
		} catch (error) {
			console.error('更新规则出错:', error);
			return false
		}
	}

	// 获取规则列表（可按班级过滤）
	const getRuleList = (gradeId?: string) => {
		return appStore.database.ruleList.filter(item => {
			if (!gradeId) return true;
			return Array.isArray(item?.allow_grades) && item.allow_grades.length > 0
				? item.allow_grades.includes(gradeId || '')
				: true;
		});
	}

	// 获取规则树（分组 → 规则，供树形选择器使用）
	const getRuleTree = (gradeId?: string): RuleTreeNode[] => {
		return buildRuleTree(getRuleList(gradeId), getRuleGroupList());
	}

	// 根据 id 获取规则
	const getRuleById = (id: string) => {
		return appStore.database.ruleList.find(item => item.id === id);
	}

	return {
		// 分组
		getRuleGroupList,
		createRuleGroup,
		updateRuleGroup,
		deleteRuleGroup,
		// 规则
		createRule,
		deleteRule,
		updateRule,
		getRuleList,
		getRuleTree,
		getRuleById,
		importRules,
		clearRules,
	}
}
