import { saveGradeInfo } from "..";
import { useAppStore } from "../../store/models/app";
import { MonitorCycle, RuleRecord, Student } from "../class";
import { dayjs } from "element-plus";
import { usePermission } from "./usePermission";

// 记录条数上限（与原有逻辑一致）
const MAX_RECORDS = 1000;
// 管理员（教师）在记录里的展示名
const TEACHER_NAME = '管理员';

// 裁剪记录列表：只保留最近 MAX_RECORDS 条
const trimRecordList = (list: RuleRecord[]): RuleRecord[] => {
	if (list.length <= MAX_RECORDS) return list;
	return list.slice(-MAX_RECORDS);
};

// 周期积分：仅允许通过规则调整积分，并记录次数与积分变化
export const useMonitorCycle = () => {
	const appStore = useAppStore();
	const { isReadOnlySession } = usePermission();

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
		if (isReadOnlySession()) return false;
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
		if (isReadOnlySession()) return false;
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
		if (isReadOnlySession()) return false;
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
		if (isReadOnlySession()) return false;
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
		if (isReadOnlySession()) return false;
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

	// 删除周期：撤销该周期内已生效的积分调整（学生/独立小组积分回退），并删除周期及其记录
	// 已结束周期不允许删除（业务规则下沉到数据层，不由 UI 单独兜底）
	const deleteMonitorCycle = async (id: string) => {
		if (isReadOnlySession()) return false;
		try {
			if (!appStore.activeGrade) return false;
			const gradeInfo = appStore.activeGrade.gradeInfo;
			const cycle = gradeInfo.monitorCycleList.find(item => item.id === id);
			if (!cycle) return false;
			if (cycle.status === 1) {
				console.error('已结束的周期不允许删除:', id);
				return false;
			}
			const cycleRecords = gradeInfo.recordList.filter(item => item.source === 1 && item.cycle_id === id);
			const teamCycleRecords = (gradeInfo.teamRecordList || []).filter(item => item.source === 1 && item.cycle_id === id);
			// 1. 按记录回退每个学生的积分
			cycleRecords.forEach(record => {
				const student = gradeInfo.studentList.find(s => s.id === record.stu_id);
				if (student) {
					student.points = Number(student.points) - record.points;
				}
			});
			// 1.1 按记录回退每个独立小组的积分
			teamCycleRecords.forEach(record => {
				const team = (gradeInfo.teamList || []).find(t => t.id === record.team_id);
				if (team) {
					team.points = Number(team.points) - record.points;
				}
			});
			// 2. 删除周期与记录
			gradeInfo.monitorCycleList = gradeInfo.monitorCycleList.filter(item => item.id !== id);
			gradeInfo.recordList = gradeInfo.recordList.filter(item => !(item.source === 1 && item.cycle_id === id));
			gradeInfo.teamRecordList = (gradeInfo.teamRecordList || []).filter(item => !(item.source === 1 && item.cycle_id === id));
			await saveGradeInfo(appStore.activeGrade.id, JSON.stringify(appStore.activeGrade));
			return true;
		} catch (error) {
			console.error('删除周期出错:', error);
			return false;
		}
	}

	// 通过规则调整学生积分（周期内）—— 周期记分唯一入口
	// group_id: 按组发放时记录组 id；单个发放传 ''
	// pointsPerCount: 单次分值覆盖值，自定义分值规则由调用方传入（不传则取规则固定分值）
	// operator: 操作者（已登录的班委账号）；不传表示管理员本人操作
	const adjustPointsByRule = async (params: {
		cycleId: string, ruleId: string, students: Student[], groupId?: string, count?: number, pointsPerCount?: number,
		operator?: { id?: string, name?: string },
	}) => {
		// 只读会话（班委账号）禁止记分
		if (isReadOnlySession()) return { success: false, message: '班委账号为只读权限，无法执行该操作' };
		try {
			if (!appStore.activeGrade) return { success: false, message: '暂无班级信息' };
			const { cycleId, ruleId, students, groupId = '', count = 1, pointsPerCount, operator } = params;
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

			// 规则积分：自定义分值规则必须由调用方指定单次分值，否则不生效
			const rule = appStore.database.ruleList.find(item => item.id === ruleId);
			if (!rule) return { success: false, message: '规则不存在' };
			const isNoPoints = rule.points === null || rule.points === undefined;
			if (isNoPoints && (pointsPerCount === undefined || pointsPerCount === null)) {
				return { success: false, message: '该规则无固定分值，请先设置本次分值' };
			}
			const perPoints = isNoPoints ? Number(pointsPerCount) : Number(rule.points);
			const time = dayjs().format('YYYY-MM-DD HH:mm:ss');

			// 操作者：有登录的班委账号时记账号名，否则记管理员
			const operatorId = operator?.id || '';
			const operatorName = operator?.name || TEACHER_NAME;

			students.forEach(stu => {
				const target = gradeInfo.studentList.find(item => item.id === stu.id);
				if (!target) return;
				const points = perPoints * count;
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
					operator_id: operatorId,
					operator_name: operatorName,
				});
				gradeInfo.indexMap.record++;
				gradeInfo.recordList.push(record);
			});
			// 仅保留最近 1000 条记录
			gradeInfo.recordList = trimRecordList(gradeInfo.recordList);

			await saveGradeInfo(appStore.activeGrade.id, JSON.stringify(appStore.activeGrade));
			return {
				success: true,
				message: `已记录 ${students.length} 人`,
			};
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
