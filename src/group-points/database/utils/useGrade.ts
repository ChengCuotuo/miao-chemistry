import { appendGradeConfig, DatabaseInfoType, loadGradeInfoById, saveGradeInfo } from "..";
import { useAppStore } from "../../store/models/app";
import { Grade } from "../class"
import { v4 as uuidv4 } from 'uuid';

export const useGrade = () => {
	const appStore = useAppStore();

	// 创建班级
	const createGrade = async (name: string) => {
		try {
			const uuid = uuidv4() as string
			const grade = new Grade({
				id: uuid,
				name,
				delete: 0,
				gradeInfo: {
					groupList: [],
					studentList: [],
					studentGroupList: [],
					recordList: [],
					indexMap: {
						group: 0,
						student: 0,
						record: 0,
					},
					gradeConfig: {
						orderByPoints: 0,
					},
				},
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

	// 删除班级
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

	// 更新班级名称
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
			const target = await getGradeInfoById(id);
			if (target) {
				target.name = name;
				await updateGradeInfoById(id, target);
			}
			return true
		} catch (error) {
			console.error('更新班级出错:', error);
			return false
		}
	}

	// 获取班级配置信息
	const getGradeInfoById = async (gradeId: string) => {
		const gradeInfo = await loadGradeInfoById(gradeId);
		const data = JSON.parse(gradeInfo) as Grade
		const target = appStore.database.gradeList.find(item => item.id === gradeId)
		if (!target) {
			console.error('班级不存在:', gradeId);
			return null
		}
		target.gradeInfo = data.gradeInfo;
		target.delete = data.delete;
		target.name = data.name;
		return target as DatabaseInfoType['gradeList'][0]
	}

	// 更新班级配置信息
	const updateGradeInfoById = async (gradeId: string, gradeInfo: DatabaseInfoType['gradeList'][0]) => {
		await saveGradeInfo(gradeId, JSON.stringify(gradeInfo));
	}

	return { createGrade, deleteGrade, updateGrade, getGradeInfoById, updateGradeInfoById }
}