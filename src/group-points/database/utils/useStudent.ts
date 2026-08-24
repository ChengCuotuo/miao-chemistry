import { useAppStore } from "../../store/models/app";
import { Student } from "../class";
import { useGrade } from "./useGrade";

export const useStudent = () => {
	const appStore = useAppStore();
	const { updateGradeInfoById } = useGrade();
	const activeGrade = appStore.activeGrade;

	// 创建学生
	const createStudent = async (name: string, points: number = 0) => {
		try {
			if (!activeGrade) {
				console.error('当前没有选中的班级');
				return false;
			}

			const studentIndex = activeGrade.gradeInfo.indexMap.student || 0;
			const student = new Student({
				id: `${studentIndex}`,
				name,
				points
			});

			activeGrade.gradeInfo.studentList.push(student);
			activeGrade.gradeInfo.indexMap.student++;

			// 更新班级信息到文件
			await updateGradeInfoById(activeGrade.id, activeGrade);
			return true;
		} catch (error) {
			console.error('创建学生出错:', error);
			return false;
		}
	};

	// 删除学生
	const deleteStudent = async (studentId: string) => {
		try {
			if (!activeGrade) {
				console.error('当前没有选中的班级');
				return false;
			}

			const index = activeGrade.gradeInfo.studentList.findIndex(item => item.id === studentId);
			if (index === -1) {
				console.error('学生不存在:', studentId);
				return false;
			}

			// 删除学生
			activeGrade.gradeInfo.studentList.splice(index, 1);
			// 删除学生组中的学生
			activeGrade.gradeInfo.studentGroupList = activeGrade.gradeInfo.studentGroupList.filter(item => item.student_id !== studentId);
			// 删除 ruleRecord 中的学生记录
			activeGrade.gradeInfo.recordList = activeGrade.gradeInfo.recordList.filter(item => item.stu_id !== studentId);

			// 更新班级信息到文件
			await updateGradeInfoById(activeGrade.id, activeGrade);
			return true;
		} catch (error) {
			console.error('删除学生出错:', error);
			return false;
		}
	};

	// 更新学生
	const updateStudent = async (params: { studentId: string, name: string, points: number }, updateStore: boolean = true) => {
		const { studentId, name, points } = params;
		try {
			if (!activeGrade) {
				console.error('当前没有选中的班级');
				return false;
			}

			const student = activeGrade.gradeInfo.studentList.find(item => item.id === studentId);
			if (!student) {
				console.error('学生不存在:', studentId);
				return false;
			}

			student.name = name;
			student.points = points;
			if (updateStore) {
				// 更新班级信息到文件
				await updateGradeInfoById(activeGrade.id, activeGrade);
			}
			return true;
		} catch (error) {
			console.error('更新学生出错:', error);
			return false;
		}
	};

	// 批量更新全部学生积分（mode: set 全量设置 / add 全量加 / sub 全量减）
	const batchUpdatePoints = async (mode: 'set' | 'add' | 'sub', value: number) => {
		try {
			if (!activeGrade) {
				console.error('当前没有选中的班级');
				return false;
			}

			const list = activeGrade.gradeInfo.studentList;
			if (!list || list.length === 0) {
				console.error('当前班级没有学生');
				return false;
			}

			list.forEach(student => {
				if (mode === 'set') {
					student.points = value;
				} else if (mode === 'add') {
					student.points = student.points + value;
				} else {
					student.points = student.points - value;
				}
			});

			// 更新班级信息到文件
			await updateGradeInfoById(activeGrade.id, activeGrade);
			return true;
		} catch (error) {
			console.error('批量更新积分出错:', error);
			return false;
		}
	};

	// 获取学生列表
	const getStudentList = () => {
		if (!activeGrade) {
			return [];
		}
		return activeGrade.gradeInfo.studentList || [];
	};

	// 获取学生索引
	const getStudentIndex = () => {
		if (!activeGrade) {
			return 0;
		}
		return activeGrade.gradeInfo.indexMap.student || 0;
	};

	return {
		createStudent,
		deleteStudent,
		updateStudent,
		batchUpdatePoints,
		getStudentList,
		getStudentIndex
	};
};