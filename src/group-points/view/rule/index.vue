<template>
	<div class="rule-list-container">
		<!-- 搜索和新增区域 -->
		<div class="search-bar">
			<el-space>
				<el-input v-model="searchQuery" placeholder="请输入规则名称搜索" class="search-input" prefix-icon="Search" clearable />
				<el-select v-model="ruleType" placeholder="请选择规则类型" class="search-input" clearable>
					<el-option label="加分规则" value="add" />
					<el-option label="减分规则" value="subtract" />
					<el-option label="自定义分值规则" value="none" />
				</el-select>
				<el-select v-model="selectedGrade" placeholder="请选择适用班级" class="search-input" clearable>
					<el-option label="所有班级" value="" />
					<el-option v-for="grade in gradeList" :key="grade.id" :label="grade.name" :value="grade.id" />
				</el-select>
				<el-button type="info" @click="handleReset">重置</el-button>
			</el-space>
			<el-space>
				<el-button :icon="FolderAdd" @click="handleAddGroup">新增分组</el-button>
				<el-button type="primary" :icon="Plus" @click="handleAdd">新增规则</el-button>
				<el-dropdown trigger="click" @command="handleImportCommand">
					<el-button type="success" :icon="Upload">导入<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
					<template #dropdown>
						<el-dropdown-menu>
							<el-dropdown-item command="excel" :icon="Grid">从 Excel 导入规则（支持分组）</el-dropdown-item>
							<el-dropdown-item command="backup" :icon="Document">导入备份文件（.miao）</el-dropdown-item>
						</el-dropdown-menu>
					</template>
				</el-dropdown>
				<el-dropdown trigger="click" @command="handleExportCommand">
					<el-button type="warning" :icon="Download">导出<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
					<template #dropdown>
						<el-dropdown-menu>
							<el-dropdown-item command="excel" :icon="Grid">导出 Excel（可编辑后回导）</el-dropdown-item>
							<el-dropdown-item command="backup" :icon="Document">导出备份文件（.miao）</el-dropdown-item>
						</el-dropdown-menu>
					</template>
				</el-dropdown>
				<el-tooltip :disabled="!clearDisabled" content="当前只有默认分组与内置规则，无需清空" placement="top">
					<span>
						<el-button type="danger" plain :icon="DeleteFilled" :disabled="clearDisabled" @click="handleClearAll">一键清空</el-button>
					</span>
				</el-tooltip>
			</el-space>
		</div>

		<!-- 规则树（最多两层：分组 → 规则） -->
		<div class="table-wrap">
			<el-table :data="tableData" border row-key="rowKey" :tree-props="{ children: 'children' }" :indent="20">
				<el-table-column label="名称" min-width="240" fixed="left">
					<template #default="{ row }">
						<span v-if="row.type === 'group'" class="group-name">
							<el-icon class="group-icon"><FolderOpened /></el-icon>
							{{ row.name }}
							<el-tag size="small" type="info" effect="plain">{{ row.children?.length || 0 }} 条规则</el-tag>
						</span>
						<span v-else class="rule-name">
							{{ row.name }}
							<el-tag v-if="isSystemRule(row.id)" size="small" type="info" effect="plain">系统</el-tag>
						</span>
					</template>
				</el-table-column>
				<el-table-column label="积分值" width="120" align="center">
					<template #default="{ row }">
						<el-tag v-if="row.type === 'rule'" :type="getPointsTagType(row.points)" size="large">{{ pointsText(row.points) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column v-if="isFiltering" label="所属分组" width="140" align="center" show-overflow-tooltip>
					<template #default="{ row }">
						<span v-if="row.type === 'rule'" class="text-gray">{{ groupName(row.group_id) }}</span>
					</template>
				</el-table-column>
				<el-table-column label="适用班级" width="150" align="center" show-overflow-tooltip>
					<template #default="{ row }">
						<template v-if="row.type === 'rule'">
							<span v-if="!row.allow_grades || row.allow_grades.length === 0" class="text-gray">所有班级</span>
							<span v-else>{{ row.allow_grades.map((gradeId: string) => gradeList.find((grade) => grade.id === gradeId)?.name || gradeId).join(', ') }}</span>
						</template>
					</template>
				</el-table-column>
				<el-table-column label="规则描述" min-width="220" show-overflow-tooltip>
					<template #default="{ row }">
						<span v-if="row.type === 'rule'">{{ row.description }}</span>
					</template>
				</el-table-column>
				<el-table-column label="操作" width="300" align="center" fixed="right">
					<template #default="{ row }">
						<template v-if="row.type === 'group'">
							<el-button size="small" text type="primary" :icon="Plus" @click="handleAddRuleToGroup(row)">新增规则</el-button>
							<el-button size="small" text :icon="Edit" @click="handleEditGroup(row)">重命名</el-button>
							<el-button size="small" text type="danger" :icon="Delete" :disabled="row.id === DEFAULT_RULE_GROUP_ID"
								@click="handleDeleteGroup(row)">删除</el-button>
						</template>
						<template v-else>
							<el-button size="small" text :icon="Edit" @click="handleEdit(row)">编辑</el-button>
							<el-tooltip v-if="isSystemRule(row.id)" content="系统内置规则，不可删除" placement="top">
								<span class="disabled-delete">
									<el-button size="small" text type="danger" :icon="Delete" disabled>删除</el-button>
								</span>
							</el-tooltip>
							<el-button v-else size="small" text type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
						</template>
					</template>
				</el-table-column>
			</el-table>
		</div>

		<!-- Excel 导入规则弹窗 -->
		<RuleExcelImportDialog v-model:visible="excelImportVisible" @success="handleExcelImportSuccess" />

		<!-- 新增/编辑规则弹窗 -->
		<el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" :before-close="handleDialogClose">
			<el-form ref="formRef" :model="formData" label-width="120px" class="dialog-form">
				<el-form-item label="序号" prop="id" v-if="isEdit">
					<el-input v-model="formData.id" disabled />
				</el-form-item>
				<el-form-item label="所属分组" prop="group_id" :rules="[{ required: true, message: '请选择所属分组', trigger: 'change' }]">
					<el-select v-model="formData.group_id" placeholder="请选择所属分组" style="width: 100%">
						<el-option v-for="group in ruleGroups" :key="group.id" :label="group.name" :value="group.id" />
					</el-select>
				</el-form-item>
				<el-form-item label="规则名称" prop="name" :rules="[{ required: true, message: '请输入规则名称', trigger: 'blur' }]">
					<el-input v-model="formData.name" placeholder="请输入规则名称" />
				</el-form-item>
				<el-form-item label="自定义分值规则">
					<el-switch v-model="formData.noPoints" />
					<div class="form-tip">开启后该规则不设固定分值，使用时需先指定分值才会生效</div>
				</el-form-item>
				<el-form-item label="积分值" prop="points" v-if="!formData.noPoints"
					:rules="[{ required: true, message: '请输入积分值', trigger: 'blur' }]">
					<el-input-number v-model="formData.points" controls-position="right" style="width: 100%" />
					<div class="form-tip">正数加分，负数减分</div>
				</el-form-item>
				<el-form-item label="适用班级" prop="allow_grades">
					<el-select v-model="formData.allow_grades" multiple placeholder="请选择适用班级（留空表示所有班级）" style="width: 100%">
						<el-option v-for="grade in gradeList" :key="grade.id" :label="grade.name" :value="grade.id" />
					</el-select>
				</el-form-item>
				<el-form-item label="规则描述" prop="description">
					<el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入规则描述" />
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="handleDialogClose">取消</el-button>
				<el-button type="primary" @click="handleSubmit">确定</el-button>
			</template>
		</el-dialog>

		<!-- 新增/编辑分组弹窗 -->
		<el-dialog :title="groupDialogTitle" v-model="groupDialogVisible" width="420px" :before-close="handleGroupDialogClose">
			<el-form ref="groupFormRef" :model="groupForm" label-width="80px">
				<el-form-item label="分组名称" prop="name" :rules="[{ required: true, message: '请输入分组名称', trigger: 'blur' }]">
					<el-input v-model="groupForm.name" placeholder="如：课堂表现、作业、纪律" maxlength="20" show-word-limit />
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="handleGroupDialogClose">取消</el-button>
				<el-button type="primary" @click="handleGroupSubmit">确定</el-button>
			</template>
		</el-dialog>

		<!-- 删除规则确认弹窗 -->
		<el-dialog title="确认删除" v-model="deleteConfirmVisible" width="300px">
			<span>确定要删除规则"{{ deleteRuleRef?.name }}"吗？</span>
			<template #footer>
				<el-button @click="deleteConfirmVisible = false">取消</el-button>
				<el-button type="danger" @click="confirmDelete">确定删除</el-button>
			</template>
		</el-dialog>

		<!-- 删除分组确认弹窗 -->
		<el-dialog title="确认删除分组" v-model="deleteGroupConfirmVisible" width="360px">
			<span>确定要删除分组"{{ deleteGroupRef?.name }}"吗？</span>
			<div class="form-tip">组内 {{ deleteGroupRef?.children?.length || 0 }} 条规则将移动到「{{ DEFAULT_RULE_GROUP_NAME }}」</div>
			<template #footer>
				<el-button @click="deleteGroupConfirmVisible = false">取消</el-button>
				<el-button type="danger" @click="confirmDeleteGroup">确定删除</el-button>
			</template>
		</el-dialog>

		<!-- 一键清空规则确认弹窗 -->
		<el-dialog title="一键清空规则" v-model="clearConfirmVisible" width="560px" :before-close="handleClearDialogClose">
			<el-alert type="error" show-icon :closable="false" title="该操作不可撤销，请先确认已备份">
				<div class="clear-alert-line">将删除除「主动加分」「主动减分」之外的全部规则，并删除「{{ DEFAULT_RULE_GROUP_NAME }}」之外的全部分组。</div>
			</el-alert>

			<div class="clear-summary">
				<div class="clear-row"><span>当前</span><b>{{ ruleGroups.length }} 个分组、{{ rules.length }} 条规则</b></div>
				<div class="clear-row"><span>本次删除</span><b class="danger-text">{{ clearStats.rules }} 条规则、{{ clearStats.groups }} 个分组</b></div>
				<div class="clear-row"><span>保留</span><b>「{{ DEFAULT_RULE_GROUP_NAME }}」+ 主动加分、主动减分（共 {{ clearStats.keep }} 条）</b></div>
			</div>

			<div class="clear-impact">
				<div class="clear-impact-title">清空后会带来这些问题</div>
				<ul>
					<li><strong>规则不可恢复</strong>：如需保留，请先「导出备份文件」或「导出 Excel」再执行。</li>
					<li><strong>历史积分记录不会丢失</strong>，但记录中引用的已删除规则，其规则名会显示为「主动执行」，在规则筛选树里归入「其他」，无法再按原规则名筛选。</li>
					<li><strong>记分入口只剩两条规则</strong>：学生 / 小组按规则调整积分、周期记分等处的规则列表只剩「主动加分 / 主动减分」，需重新录入规则才能按原方式记分。</li>
					<li><strong>数据分析会失真</strong>：行为画像（规则维度）、规则健康度（规则库维度）等按规则统计的图表，清空后只剩这两条规则的数据。</li>
					<li><strong>分组结构需重建</strong>：「{{ DEFAULT_RULE_GROUP_NAME }}」之外的分类分组会一并删除，不保留分组名。</li>
				</ul>
			</div>

			<el-checkbox v-model="clearAcknowledged" class="clear-check">
				我已了解上述影响，确认清空（保留默认分组与内置规则）
			</el-checkbox>

			<template #footer>
				<el-button @click="handleClearDialogClose">取消</el-button>
				<el-button type="danger" :disabled="!clearAcknowledged" :loading="clearing" @click="confirmClear">确认清空</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Plus, Edit, Delete, DeleteFilled, Upload, Download, FolderOpened, FolderAdd, ArrowDown, Grid, Document } from '@element-plus/icons-vue';
import type { FormInstance } from 'element-plus';
import { ElMessage } from 'element-plus';
import { useAppStore } from '../../store/models/app';
import { Rule, RuleGroup } from '../../database/class';
import { useRule } from '../../database/utils/useRule';
import { GroupPointsConfig, DEFAULT_TABLE_NAME, DEFAULT_RULE_GROUP_ID, DEFAULT_RULE_GROUP_NAME, saveRuleConfig, curWindow, isSystemRule } from '../../database';
import { buildRuleWorkbook, downloadWorkbook, RULE_EXCEL_EXPORT_FILENAME } from '../../database/utils/ruleExcel';
import RuleExcelImportDialog from './components/RuleExcelImportDialog.vue';
import { openFile } from '../../utils';

const {
	createRule, deleteRule, updateRule, getRuleList, getRuleGroupList, getRuleById,
	createRuleGroup, updateRuleGroup, deleteRuleGroup, clearRules,
} = useRule();

const appStore = useAppStore();
// 规则列表（响应式，随 store 变化自动刷新）
const rules = computed<Rule[]>(() => getRuleList() || []);

// 搜索筛选
const searchQuery = ref('');
const ruleType = ref('');
const selectedGrade = ref('');

// 弹窗相关
const dialogVisible = ref(false);
const deleteConfirmVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const deleteRuleRef = ref<Rule | null>(null);

// 分组弹窗相关
const groupDialogVisible = ref(false);
const isEditGroup = ref(false);
const groupFormRef = ref<FormInstance>();
const groupForm = ref<{ id: string, name: string }>({ id: '', name: '' });
const deleteGroupConfirmVisible = ref(false);
const deleteGroupRef = ref<TableGroupRow | null>(null);

// 表单数据
const formData = ref<{ id: string, name: string, description: string, points: number | null, allow_grades: string[], group_id: string, noPoints: boolean }>({
	id: '',
	name: '',
	description: '',
	points: 0,
	allow_grades: [],
	group_id: DEFAULT_RULE_GROUP_ID,
	noPoints: false,
});

// 班级列表
const gradeList = computed(() => appStore.database.gradeList.filter(grade => grade.delete === 0));
// 分组列表
const ruleGroups = computed<RuleGroup[]>(() => getRuleGroupList());

const dialogTitle = computed(() => (isEdit.value ? '编辑规则' : '新增规则'));
const groupDialogTitle = computed(() => (isEditGroup.value ? '编辑分组' : '新增分组'));

// ---------- 树形表格数据 ----------
interface TableRuleRow {
	rowKey: string;
	type: 'rule';
	id: string;
	name: string;
	description: string;
	points: number | null;
	allow_grades: string[];
	group_id: string;
	order: number;
}
interface TableGroupRow {
	rowKey: string;
	type: 'group';
	id: string;
	name: string;
	order: number;
	children?: TableRuleRow[];
}

const toRuleRow = (rule: Rule): TableRuleRow => ({
	rowKey: `rule:${rule.id}`,
	type: 'rule',
	id: rule.id,
	name: rule.name,
	description: rule.description,
	points: rule.points,
	allow_grades: rule.allow_grades || [],
	group_id: rule.group_id,
	order: rule.order ?? 0,
});

const isFiltering = computed(() => !!(searchQuery.value || ruleType.value || selectedGrade.value));

const groupName = (groupId: string) => ruleGroups.value.find(g => g.id === groupId)?.name || DEFAULT_RULE_GROUP_NAME;

// 是否命中筛选条件
const matchRule = (rule: Rule) => {
	const query = searchQuery.value.trim().toLowerCase();
	const includeName = !query || rule.name.toLowerCase().includes(query);
	const sameType = !ruleType.value
		? true
		: ruleType.value === 'add' ? (rule.points ?? 0) > 0
			: ruleType.value === 'subtract' ? (rule.points ?? 0) < 0
				: ruleType.value === 'none' ? (rule.points === null || rule.points === undefined)
					: true;
	const matchGrade = !selectedGrade.value
		|| (!rule.allow_grades || rule.allow_grades.length === 0)
		|| rule.allow_grades.includes(selectedGrade.value);
	return includeName && sameType && matchGrade;
};

// 树形结构：分组 → 规则
const treeRows = computed<TableGroupRow[]>(() => {
	const list = rules.value;
	return ruleGroups.value.map(group => {
		const children = list
			.filter(rule => rule.group_id === group.id)
			.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
			.map(toRuleRow);
		return {
			rowKey: `group:${group.id}`,
			type: 'group' as const,
			id: group.id,
			name: group.name,
			order: group.order,
			// 无子规则时不渲染展开箭头
			children: children.length ? children : undefined,
		};
	});
});

// 筛选模式：扁平展示命中规则的列表
const filteredRows = computed<TableRuleRow[]>(() => {
	return rules.value.filter(matchRule).map(toRuleRow);
});

const tableData = computed(() => (isFiltering.value ? filteredRows.value : treeRows.value));

// ---------- 搜索 ----------
const handleReset = () => {
	searchQuery.value = '';
	ruleType.value = '';
	selectedGrade.value = '';
};

// ---------- 规则新增/编辑 ----------
const handleAdd = () => {
	isEdit.value = false;
	formData.value = { id: '', name: '', description: '', points: 0, allow_grades: [], group_id: ruleGroups.value[0]?.id || DEFAULT_RULE_GROUP_ID, noPoints: false };
	dialogVisible.value = true;
};

// 从分组行直接新增规则
const handleAddRuleToGroup = (group: TableGroupRow) => {
	isEdit.value = false;
	formData.value = { id: '', name: '', description: '', points: 0, allow_grades: [], group_id: group.id, noPoints: false };
	dialogVisible.value = true;
};

const handleEdit = (row: TableRuleRow) => {
	isEdit.value = true;
	formData.value = {
		id: row.id,
		name: row.name,
		description: row.description,
		points: row.points ?? 0,
		allow_grades: [...(row.allow_grades || [])],
		group_id: row.group_id,
		noPoints: row.points === null || row.points === undefined,
	};
	dialogVisible.value = true;
};

const handleDelete = (row: TableRuleRow) => {
	if (isSystemRule(row.id)) {
		ElMessage.warning('系统内置规则不可删除');
		return;
	}
	deleteRuleRef.value = getRuleById(row.id) || null;
	deleteConfirmVisible.value = true;
};

const confirmDelete = async () => {
	if (deleteRuleRef.value) {
		const res = await deleteRule(deleteRuleRef.value.id);
		if (res) {
			ElMessage.success('删除成功');
		} else if (isSystemRule(deleteRuleRef.value.id)) {
			ElMessage.warning('系统内置规则不可删除');
		}
	}
	deleteConfirmVisible.value = false;
	deleteRuleRef.value = null;
};

const handleSubmit = async () => {
	formRef.value?.validate(async (valid) => {
		if (!valid) return;
		const { name, description, points, allow_grades, group_id, noPoints } = formData.value;
		const finalPoints = noPoints ? null : points;
		let res;
		if (isEdit.value) {
			res = await updateRule(formData.value.id, name, description, finalPoints, allow_grades || [], group_id);
		} else {
			res = await createRule(name, description, finalPoints, allow_grades || [], group_id);
		}
		if (res) {
			dialogVisible.value = false;
			formRef.value?.resetFields();
			ElMessage.success(isEdit.value ? '规则已更新' : '规则已创建');
		}
	});
};

const handleDialogClose = () => {
	dialogVisible.value = false;
	formRef.value?.resetFields();
};

// ---------- 分组新增/编辑/删除 ----------
const handleAddGroup = () => {
	isEditGroup.value = false;
	groupForm.value = { id: '', name: '' };
	groupDialogVisible.value = true;
};

const handleEditGroup = (row: TableGroupRow) => {
	isEditGroup.value = true;
	groupForm.value = { id: row.id, name: row.name };
	groupDialogVisible.value = true;
};

const handleGroupSubmit = async () => {
	groupFormRef.value?.validate(async (valid) => {
		if (!valid) return;
		const { id, name } = groupForm.value;
		const res = id ? await updateRuleGroup(id, name) : await createRuleGroup(name);
		if (res) {
			groupDialogVisible.value = false;
			groupFormRef.value?.resetFields();
			ElMessage.success(id ? '分组已更新' : '分组已创建');
		}
	});
};

const handleGroupDialogClose = () => {
	groupDialogVisible.value = false;
	groupFormRef.value?.resetFields();
};

const handleDeleteGroup = (row: TableGroupRow) => {
	deleteGroupRef.value = row;
	deleteGroupConfirmVisible.value = true;
};

const confirmDeleteGroup = async () => {
	if (deleteGroupRef.value) {
		const res = await deleteRuleGroup(deleteGroupRef.value.id);
		if (res) {
			ElMessage.success('分组已删除，组内规则已移至默认分组');
		} else {
			ElMessage.error('默认分组不可删除');
		}
	}
	deleteGroupConfirmVisible.value = false;
	deleteGroupRef.value = null;
};

// ---------- 一键清空 ----------
const clearConfirmVisible = ref(false);
const clearAcknowledged = ref(false);
const clearing = ref(false);

// 待删除的规则（系统内置规则会被保留）与分组（默认分组会被保留）
const clearStats = computed(() => ({
	rules: rules.value.filter(rule => !isSystemRule(rule.id)).length,
	groups: ruleGroups.value.filter(group => group.id !== DEFAULT_RULE_GROUP_ID).length,
	keep: rules.value.filter(rule => isSystemRule(rule.id)).length || 2,
}));

// 只剩默认分组与内置规则时，清空没有意义
const clearDisabled = computed(() => clearStats.value.rules === 0 && clearStats.value.groups === 0);

const handleClearAll = () => {
	clearAcknowledged.value = false;
	clearConfirmVisible.value = true;
};

const handleClearDialogClose = () => {
	clearConfirmVisible.value = false;
	clearAcknowledged.value = false;
};

const confirmClear = async () => {
	clearing.value = true;
	try {
		const result = await clearRules();
		ElMessage.success(`已清空 ${result.removedRules} 条规则、${result.removedGroups} 个分组，保留 ${result.kept} 条内置规则`);
		handleClearDialogClose();
	} finally {
		clearing.value = false;
	}
};

// ---------- 展示辅助 ----------
const pointsText = (points: number | null) => {
	if (points === null || points === undefined) return '自定义分值';
	return `${points} 分`;
};

const getPointsTagType = (points: number | null) => {
	if (points === null || points === undefined) return 'warning';
	if (points > 0) return 'success';
	if (points < 0) return 'danger';
	return 'info';
};

// ---------- 导入 / 导出 ----------

// Excel 导入弹窗
const excelImportVisible = ref(false);

const handleImportCommand = (command: string) => {
	if (command === 'excel') {
		excelImportVisible.value = true;
		return;
	}
	handleImport();
};

// store 已更新，列表自动刷新，仅需提示
const handleExcelImportSuccess = () => {
	ElMessage.success('规则列表已更新');
};

const handleExportCommand = (command: string) => {
	if (command === 'excel') {
		handleExportExcel();
		return;
	}
	handleExport();
};

// 导出 Excel：分组 + 规则一张表，可直接编辑后再用「从 Excel 导入」回导
const handleExportExcel = () => {
	try {
		const workbook = buildRuleWorkbook(ruleGroups.value, rules.value, gradeList.value);
		downloadWorkbook(workbook, RULE_EXCEL_EXPORT_FILENAME);
		ElMessage.success('已导出 Excel，编辑后可通过「导入 → 从 Excel 导入规则」回导');
	} catch (error) {
		console.error('导出 Excel 失败:', error);
		ElMessage.error('导出 Excel 失败');
	}
};

// 导入备份文件（.miao，旧版扁平数组 / 新版 { groups, rules } 均兼容）
const handleImport = async () => {
	const info = await openFile([GroupPointsConfig.downloadSuffix]);
	if (!info) return;
	const text = new TextDecoder().decode(info.content);
	// decryptContent 可能已返回解析后的对象（decryptJSON），也可能返回字符串，两种都兼容
	const decrypted = await curWindow.electronAPI.decryptContent(text);
	const parsed = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;

	let importRules: Partial<Rule>[] = [];
	if (Array.isArray(parsed)) {
		// 兼容旧版导出文件：扁平规则数组，导入默认分组
		importRules = parsed;
	} else {
		// 新格式：先补建分组（已存在的同 id 分组跳过）
		const existingIds = new Set((appStore.database.ruleGroupList || []).map(g => g.id));
		for (const group of (parsed?.groups || [])) {
			if (!group?.id || existingIds.has(group.id)) continue;
			appStore.database.ruleGroupList.push(new RuleGroup({ id: group.id, name: group.name || '导入分组', order: group.order ?? 0 }));
			existingIds.add(group.id);
		}
		importRules = parsed?.rules || [];
	}

	let successCount = 0;
	let failCount = 0;
	for (const rule of importRules) {
		if (!rule?.name) { failCount++; continue; }
		// 系统内置规则（主动加分 / 主动减分）由应用自动保证存在，导入时跳过，避免重复
		if (isSystemRule(rule.id)) continue;
		const groupId = rule.group_id && (appStore.database.ruleGroupList || []).some(g => g.id === rule.group_id)
			? rule.group_id : DEFAULT_RULE_GROUP_ID;
		const res = await createRule(
			rule.name,
			rule.description || '',
			rule.points ?? null,
			rule.allow_grades || [],
			groupId,
		);
		if (res) successCount++; else failCount++;
	}

	if (successCount > 0) {
		ElMessage.success(`成功导入 ${successCount} 条规则`);
	}
	if (failCount > 0) {
		ElMessage.error(`导入失败 ${failCount} 条规则`);
	}
};

const handleExport = async () => {
	// 导出前确保最新配置已落盘
	await saveRuleConfig(appStore.database.ruleGroupList, appStore.database.ruleList);
	const filePath = await curWindow.electronAPI.loadFilePath({
		mainPath: GroupPointsConfig.database,
		fileName: `${DEFAULT_TABLE_NAME.rule}${GroupPointsConfig.suffix}`
	});
	await curWindow.electronAPI.downloadFile({ filePath, fileName: `${DEFAULT_TABLE_NAME.rule}${GroupPointsConfig.downloadSuffix}` });
	ElMessage.success('导出规则成功');
};
</script>

<style scoped>
.rule-list-container {
	width: calc(100% - 20px);
	height: calc(100% - 20px);
	display: flex;
	flex-direction: column;
	background: #fff;
	padding: 10px;
}

.search-bar {
	display: flex;
	justify-content: space-between;
	flex-wrap: wrap;
	align-items: center;
	margin-bottom: 20px;
	gap: 10px;
}

.search-input {
	width: 200px;
}

.table-wrap {
	flex: 1;
	min-height: 0;
	overflow: auto;
}

.dialog-form {
	padding-top: 10px;
}

.group-name {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-weight: 600;
}

.group-icon {
	color: var(--el-color-primary);
}

.rule-name {
	padding-left: 4px;
	display: inline-flex;
	align-items: center;
	gap: 6px;
}

.disabled-delete {
	display: inline-block;
	cursor: not-allowed;
}

.text-gray {
	color: #909399;
}

.form-tip {
	font-size: 12px;
	color: #909399;
	line-height: 1.4;
	width: 100%;
}

/* ---- 一键清空弹窗 ---- */
.clear-alert-line {
	line-height: 1.6;
}

.clear-summary {
	margin: 16px 0;
	border: 1px solid var(--el-border-color-lighter);
	border-radius: 4px;
	overflow: hidden;
}

.clear-row {
	display: flex;
	align-items: baseline;
	gap: 12px;
	padding: 8px 12px;
	font-size: 13px;
}

.clear-row + .clear-row {
	border-top: 1px solid var(--el-border-color-lighter);
}

.clear-row span {
	width: 56px;
	flex: none;
	color: #909399;
}

.clear-row b {
	font-weight: 600;
	line-height: 1.5;
}

.danger-text {
	color: var(--el-color-danger);
}

.clear-impact-title {
	font-size: 13px;
	font-weight: 600;
	margin-bottom: 6px;
}

.clear-impact ul {
	margin: 0;
	padding-left: 18px;
	color: #606266;
	font-size: 13px;
	line-height: 1.7;
}

.clear-impact li + li {
	margin-top: 4px;
}

.clear-check {
	margin-top: 14px;
}
</style>
