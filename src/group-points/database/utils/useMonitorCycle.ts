import { saveGradeInfo } from "..";
import { useAppStore } from "../../store/models/app";
import { MonitorCycle, RuleRecord, Student } from "../class";
import { dayjs } from "element-plus";

// 班委周期积分：仅允许通过规则调整积分，并记录次数与积分变化
export const useMonitorCycle = () => {
	const appStore = useAppStore();

	// 获取当前班级周期列表
	const getMonitorCycleList = () => {
		return appStore.activeGrade?.gradeInfo?.monitorCycleList || [];
	}

	// 获取周期自增索引
	const getMonitorCycleIndex = () => {
		return appStore.activeGrade?.gradeInfo?.indexMap?.monitorCycle || 0;
	}

	// 新增周期
	const createMonitorCycle = async (name: string, startTime = '', endTime = '') => {
		try {
			if (!appStore.activeGrade) return false;
			const index = getMonitorCycleIndex();
			const cycle = new MonitorCycle({ id: `${index}`, name, startTime, endTime });
			appStore.activeGrade.gradeInfo.monitorCycleList.push(cycle);
			appStore.activeGrade.gradeInfo.indexMap.monitorCycle = index + 1;
			await saveGradeInfo(appStore.activeGrade.id, JSON.stringify(appStore.activeGrade));
			return true;
		} catch (error) {
			console.error('创建周期出错:', error);
			return false;
		}
	}

	// 更新周期（名称/时间范围）
	const updateMonitorCycle = async (id: string, name: string, startTime = '', endTime = '') => {
		try {
			if (!appStore.activeGrade) return false;
			const cycle = appStore.activeGrade.gradeInfo.monitorCycleList.find(item => item.id === id);
			if (!cycle) return false;
			cycle.name = name;
			cycle.startTime = startTime;
			cycle.endTime = endTime;
			await saveGradeInfo(appStore.activeGrade.id, JSON.stringify(appStore.activeGrade));
			return true;
		} catch (error) {
			console.error('更新周期出错:', error);
			return false;
		}
	}

	// 开始周期
	const startMonitorCycle = async (id: string) => {
		try {
			if (!appStore.activeGrade) return false;
			const cycle = appStore.activeGrade.gradeInfo.monitorCycleList.find(item => item.id === id);
			if (!cycle) return false;
			cycle.status = 0;
			await saveGradeInfo(appStore.activeGrade.id, JSON.stringify(appStore.activeGrade));
			return true;
		} catch (error) {
			console.error('开始周期出错:', error);
			return false;
		}
	}

	// 结束周期
	const finishMonitorCycle = async (id: string) => {
		try {
			if (!appStore.activeGrade) return false;
			const cycle = appStore.activeGrade.gradeInfo.monitorCycleList.find(item => item.id === id);
			if (!cycle) return false;
			cycle.status = 1;
			await saveGradeInfo(appStore.activeGrade.id, JSON.stringify(appStore.activeGrade));
			return true;
		} catch (error) {
			console.error('结束周期出错:', error);
			return false;
		}
	}

	// 判断周期是否已过期（当前日期 > 结束时间；无时间范围则永不过期）
	const isCycleExpired = (cycle: { status?: number, startTime?: string, endTime?: string }) => {
		if (cycle.status !== 0) return false;
		if (!cycle.endTime) return false;
		const today = dayjs().format('YYYY-MM-DD');
		return today > cycle.endTime;
	}

	// 判断周期是否尚未开始（当前日期 < 开始时间；无时间范围则不限制）
	const isCycleNotStarted = (cycle: { startTime?: string }) => {
		if (!cycle.startTime) return false;
		const today = dayjs().format('YYYY-MM-DD');
		return today < cycle.startTime;
	}

	// 自动结束已过期的进行中周期（方案 D：进入页面时调用）
	// 返回自动结束的周期数量
	const autoFinishExpiredCycles = async () => {
		try {
			if (!appStore.activeGrade) return 0;
			const cycles = appStore.activeGrade.gradeInfo.monitorCycleList || [];
			const expired = cycles.filter(c => isCycleExpired(c));
			if (expired.length === 0) return 0;
			expired.forEach(c => { c.status = 1; });
			await saveGradeInfo(appStore.activeGrade.id, JSON.stringify(appStore.activeGrade));
			return expired.length;
		} catch (error) {
			console.error('自动结束过期周期出错:', error);
			return 0;
		}
	}

	// 删除周期：撤销该周期内的积分调整（学生积分回退），并删除周期及其记录
	const deleteMonitorCycle = async (id: string) => {
		try {
			if (!appStore.activeGrade) return false;
			const gradeInfo = appStore.activeGrade.gradeInfo;
			const cycleRecords = gradeInfo.recordList.filter(item => item.source === 1 && item.cycle_id === id);
			// 1. 按记录回退每个学生的积分（记录 points 即为该次增减量，减去它即还原）
			cycleRecords.forEach(record => {
				const student = gradeInfo.studentList.find(s => s.id === record.stu_id);
				if (student) {
					student.points = Number(student.points) - record.points;
				}
			});
			// 2. 删除周期与记录
			gradeInfo.monitorCycleList = gradeInfo.monitorCycleList.filter(item => item.id !== id);
			gradeInfo.recordList = gradeInfo.recordList.filter(item => !(item.source === 1 && item.cycle_id === id));
			await saveGradeInfo(appStore.activeGrade.id, JSON.stringify(appStore.activeGrade));
			return true;
		} catch (error) {
			console.error('删除周期出错:', error);
			return false;
		}
	}

	// 通过规则调整学生积分（周期内）—— 周期记分唯一入口
	// group_id: 按组发放时记录组 id；单个发放传 ''
	const adjustPointsByRule = async (params: { cycleId: string, ruleId: string, students: Student[], groupId?: string, count?: number }) => {
		try {
			if (!appStore.activeGrade) return { success: false, message: '暂无班级信息' };
			const { cycleId, ruleId, students, groupId = '', count = 1 } = params;
			const gradeInfo = appStore.activeGrade.gradeInfo;
			const cycle = gradeInfo.monitorCycleList.find(item => item.id === cycleId);
			if (!cycle) return { success: false, message: '周期不存在' };
			if (cycle.status !== 0) return { success: false, message: `周期「${cycle.name}」已结束，无法记录积分` };
			// 时间二次校验：当前日期须在周期时间范围内（无范围则不限制）
			if (cycle.endTime && dayjs().format('YYYY-MM-DD') > cycle.endTime) {
				return { success: false, message: `周期「${cycle.name}」已过期，无法记录积分` };
			}
			if (cycle.startTime && dayjs().format('YYYY-MM-DD') < cycle.startTime) {
				return { success: false, message: `周期「${cycle.name}」尚未开始，无法记录积分` };
			}

			// 规则积分
			const rule = appStore.database.ruleList.find(item => item.id === ruleId);
			if (!rule) return { success: false, message: '规则不存在' };
			const time = dayjs().format('YYYY-MM-DD HH:mm:ss');
			students.forEach(stu => {
				const target = gradeInfo.studentList.find(item => item.id === stu.id);
				if (!target) return;
				const points = rule.points * count;
				target.points = Number(target.points) + points;
				const recordIndex = gradeInfo.indexMap.record;
				const record = new RuleRecord({
					id: recordIndex,
					stu_id: stu.id,
					rule_id: ruleId,
					points,
					time,
					source: 1,
					cycle_id: cycleId,
					group_id: groupId,
					count,
				});
				gradeInfo.indexMap.record++;
				gradeInfo.recordList.push(record);
			});
			// 仅保留最近1000条记录（与现有逻辑一致）
			gradeInfo.recordList = gradeInfo.recordList.slice(-1000);

			await saveGradeInfo(appStore.activeGrade.id, JSON.stringify(appStore.activeGrade));
			return { success: true, message: `已记录 ${students.length} 人` };
		} catch (error) {
			console.error('周期记分调整出错:', error);
			return { success: false, message: '操作失败，请重试' };
		}
	}

	return {
		getMonitorCycleList,
		getMonitorCycleIndex,
		createMonitorCycle,
		updateMonitorCycle,
		startMonitorCycle,
		finishMonitorCycle,
		deleteMonitorCycle,
		adjustPointsByRule,
		isCycleExpired,
		isCycleNotStarted,
		autoFinishExpiredCycles,
	}
}
