import { appendGradeConfig, saveGradeInfo } from "..";
import { useAppStore } from "../../store/models/app";
import { Grade } from "../class"
import { v4 as uuidv4 } from 'uuid';

export const useGrade = () => {
	const appStore = useAppStore();
	const createGrade = async (name: string) => {
		const uuid = uuidv4() as string
		const grade = new Grade({
			id: uuid,
			name,
			gradeInfo: {
				groupList: [],
				studentList: [],
				studentGroupList: [],
			},
		})
		appStore.database.gradeList.push(grade);

		// 更新 database.grade 表数据写入文件
		const gradeConfig = appStore.database.gradeList.map(item => ({ id: item.id, name: item.name }))
		await appendGradeConfig(JSON.stringify(gradeConfig));
		// 创建 grade-{id} 表
		await saveGradeInfo(uuid, grade.toString());
		return true
	}

	return { createGrade }
}