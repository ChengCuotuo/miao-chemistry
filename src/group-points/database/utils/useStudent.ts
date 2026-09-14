import { useAppStore } from "../../store/models/app";
import { Student, RuleRecord, RECORD_STATUS, OPERATOR_ROLE } from "../class";
import { useGrade } from "./useGrade";
import { BATCH_RECORD_PREFIX } from "..";
import { dayjs } from "element-plus";

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
	// 同时写一条汇总记录（不对应单个学生）：记下模式、总变动量、影响人数、操作人与时间，便于追溯
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

			// 先记下原积分，用于算总变动量（set 模式下每个学生的变动量不同）
			const beforePoints = new Map<string, number>();
			list.forEach(student => beforePoints.set(student.id, Number(student.points) || 0));

			list.forEach(student => {
				if (mode === 'set') {
					student.points = value;
				} else if (mode === 'add') {
					student.points = student.points + value;
				} else {
					student.points = student.points - value;
				}
			});

			// 汇总记录：points 记全班总变动量，count 记影响人数
			const totalDelta = list.reduce((acc, student) => {
				const before = beforePoints.get(student.id) ?? 0;
				return acc + ((Number(student.points) || 0) - before);
			}, 0);
			const recordIndex = activeGrade.gradeInfo.indexMap.record ?? 0;
			activeGrade.gradeInfo.recordList.push(new RuleRecord({
				id: recordIndex,
				// 汇总记录不属于任何单个学生，因此 stu_id 留空（学生详情弹窗与删除学生都不会误伤它）
				stu_id: '',
				rule_id: `${BATCH_RECORD_PREFIX}${mode}`,
				points: totalDelta,
				time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
				// source=0：不归属任何周期，也不参与周期删除时的积分回退
				source: 0,
				count: list.length,
				status: RECORD_STATUS.APPROVED,
				// 存本次输入的原始值：设置模式为设置值，加/减模式为增减量（展示与追溯都需要）
				batch_value: Number(value) || 0,
				operator_name: '管理员',
				operator_role: OPERATOR_ROLE.TEACHER,
			}));
			activeGrade.gradeInfo.indexMap.record = recordIndex + 1;

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