import { Grade } from "../class"
import { v4 as uuidv4 } from 'uuid';

export const createGrade = (name: string) => {
	const grade = new Grade({
		id: uuidv4() as string,
		name,
		gradeInfo: {
			groupList: [],
			studentList: [],
			studentGroupList: [],
		},
	})
}

export const updateGrade = (grade: Grade) => {
	// 更新班级信息
}