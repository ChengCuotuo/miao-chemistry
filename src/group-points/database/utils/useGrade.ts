import { appendGradeConfig, saveGradeInfo } from "..";
import { useAppStore } from "../../store/models/app";
import { Grade } from "../class"
import { v4 as uuidv4 } from 'uuid';

export const useGrade = () => {
	const appStore = useAppStore();
	const createGrade = async (name: string) => {
		try {
			const uuid = uuidv4() as string
			const grade = new Grade({
				id: uuid,
				name,
				gradeInfo: {
					groupList: [],
					studentList: [],
					studentGroupList: [],
				},
				delete: 0
			})
			appStore.database.gradeList.push(grade);

			// 更新 database.grade 表数据写入文件
			const gradeConfig = appStore.database.gradeList.map(item => ({ id: item.id, name: item.name, delete: item.delete }))
			await appendGradeConfig(JSON.stringify(gradeConfig));
			// 创建 grade-{id} 表
			await saveGradeInfo(uuid, grade.toString());
		} catch (error) {
			console.error('创建班级出错:', error);
			return false
		}
		return true
	}

	const deleteGrade = async (id: string) => {
		try {
			const grade = appStore.database.gradeList.find(item => item.id === id);
			if (!grade) {
				console.error('班级不存在:', id);
				return false
			}
			grade.delete = 1;
			const newGradeList = appStore.database.gradeList.map(item => ({ id: item.id, name: item.name, delete: item.delete }))
			await appendGradeConfig(JSON.stringify(newGradeList));
			return true
		} catch (error) {
			console.error('删除班级出错:', error);
			return false
		}
	}

	const updateGrade = async (id: string, name: string) => {
		try {
			const grade = appStore.database.gradeList.find(item => item.id === id);
			if (!grade) {
				console.error('班级不存在:', id);
				return false
			}
			grade.name = name;
			const newGradeList = appStore.database.gradeList.map(item => ({ id: item.id, name: item.name, delete: item.delete }))
			await appendGradeConfig(JSON.stringify(newGradeList));
			return true
		} catch (error) {
			console.error('更新班级出错:', error);
			return false
		}
	}

	return { createGrade, deleteGrade, updateGrade }
}