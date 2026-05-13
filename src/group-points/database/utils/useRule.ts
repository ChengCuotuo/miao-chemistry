import { appendRuleConfig } from "..";
import { useAppStore } from "../../store/models/app";
import { Rule } from "../class"
import { v4 as uuidv4 } from 'uuid';

export const useRule = () => {
	const appStore = useAppStore();

	// 创建规则
	const createRule = async (name: string, description: string, points: number, allow_grades: string[] = []) => {
		try {
			const uuid = uuidv4() as string
			const rule = new Rule({
				id: uuid,
				name,
				description,
				points,
				allow_grades
			})
			appStore.database.ruleList.push(rule);

			// 更新 database.rule 表数据写入文件
			await appendRuleConfig(JSON.stringify(appStore.database.ruleList));
			return true
		} catch (error) {
			console.error('创建规则出错:', error);
			return false
		}
	}

	// 删除规则
	const deleteRule = async (id: string) => {
		try {
			const index = appStore.database.ruleList.findIndex(item => item.id === id);
			if (index === -1) {
				console.error('规则不存在:', id);
				return false
			}
			appStore.database.ruleList.splice(index, 1);
			await appendRuleConfig(JSON.stringify(appStore.database.ruleList));
			return true
		} catch (error) {
			console.error('删除规则出错:', error);
			return false
		}
	}

	// 更新规则
	const updateRule = async (id: string, name: string, description: string, points: number, allow_grades: string[] = []) => {
		try {
			const rule = appStore.database.ruleList.find(item => item.id === id);
			if (!rule) {
				console.error('规则不存在:', id);
				return false
			}
			rule.name = name;
			rule.description = description;
			rule.points = points;
			rule.allow_grades = allow_grades;
			await appendRuleConfig(JSON.stringify(appStore.database.ruleList));
			return true
		} catch (error) {
			console.error('更新规则出错:', error);
			return false
		}
	}

	// 获取规则列表
	const getRuleList = (gradeId?: string) => {
		return appStore.database.ruleList.filter(item => {
			if (!gradeId) return true;
			return Array.isArray(item?.allow_grades) && item.allow_grades.length > 0
				? item.allow_grades.includes(gradeId || '')
				: true;
		});
	}

	return { createRule, deleteRule, updateRule, getRuleList }
}