import { useAppStore } from "../../store/models/app";
import { Grade } from "../class"
import { v4 as uuidv4 } from 'uuid';

export const useGrade = () => {
	const appStore = useAppStore();
	const createGrade = (name: string) => {
		const grade = new Grade({
			id: uuidv4() as string,
			name,
			gradeInfo: {
				groupList: [],
				studentList: [],
				studentGroupList: [],
			},
		})
		appStore.database.gradeList.push(grade);

		// TODO 数据写入文件
	}

	return { createGrade }
}