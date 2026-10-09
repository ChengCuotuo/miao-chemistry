import { useAppStore } from "../../store/models/app";
import { saveGradeInfo, isBatchRecord } from "..";
import { BID_RECORD_PREFIX } from "../../view/grade/RecordList/constant";
import { usePermission } from "./usePermission";
import type { RuleRecord, TeamRecord } from "../class";

// 单条积分记录的撤销：把该记录对积分的改动「改回去」，再删掉这条记录
// 说明：不做撤销栈、不做持久化历史——撤销后等同于「这条操作没发生过」
// 不允许撤销的场景：全量操作汇总记录、兑奖记录、已结束周期内的记录、学生已删除的记录
export const useUndo = () => {
	const appStore = useAppStore();
	const { writeDeniedMessage } = usePermission();

	// 记录归属哪个周期：按记录写入时落定的 cycle_id
	const resolveRecordCycle = (record: RuleRecord) => {
		const cycles = appStore.activeGrade?.gradeInfo?.monitorCycleList || [];
		return record.cycle_id ? cycles.find(item => item.id === record.cycle_id) : undefined;
	};

	// 判断记录能否撤销；ok=false 时 reason 用于禁用态提示
	const canUndoRecord = (record: RuleRecord): { ok: boolean; reason: string } => {
		const denied = writeDeniedMessage();
		if (denied) return { ok: false, reason: denied };

		const gradeInfo = appStore.activeGrade?.gradeInfo;
		if (!gradeInfo) return { ok: false, reason: '暂无班级信息' };

		// 全量操作汇总记录：一条记录覆盖全班，无法按人回退
		if (isBatchRecord(record.rule_id)) return { ok: false, reason: '全量操作记录不支持撤销' };
		// 兑奖记录：撤销需同时回退奖品数量，暂不支持
		if (record.rule_id && record.rule_id.startsWith(BID_RECORD_PREFIX)) {
			return { ok: false, reason: '兑奖记录不支持撤销' };
		}
		// 已结束周期内的记录不允许撤销
		const cycle = resolveRecordCycle(record);
		if (cycle && cycle.status === 1) {
			return { ok: false, reason: `周期「${cycle.name}」已结束，不支持撤销` };
		}
		// 学生已删除
		if (!gradeInfo.studentList.some(item => item.id === record.stu_id)) {
			return { ok: false, reason: '学生已删除，无法撤销' };
		}
		return { ok: true, reason: '' };
	};

	// 执行撤销：回退积分 + 删除该条记录 + 落盘
	const undoRecord = async (record: RuleRecord): Promise<{ success: boolean; message: string }> => {
		const check = canUndoRecord(record);
		if (!check.ok) return { success: false, message: check.reason || '该记录不可撤销' };
		try {
			if (!appStore.activeGrade) return { success: false, message: '暂无班级信息' };
			const grade = appStore.activeGrade;
			const gradeInfo = grade.gradeInfo;

			// 1. 回退该记录对积分的改动
			const student = gradeInfo.studentList.find(item => item.id === record.stu_id);
			if (student) {
				student.points = Number(student.points) - Number(record.points);
			}

			// 2. 删除这条记录（按 id 定位：记录列表里展示的是扩展副本，不能按对象引用匹配）
			gradeInfo.recordList = gradeInfo.recordList.filter(item => item.id !== record.id);

			await saveGradeInfo(grade.id, JSON.stringify(grade));
			return { success: true, message: '已撤销该条记录' };
		} catch (error) {
			console.error('撤销记录出错:', error);
			return { success: false, message: '撤销失败，请重试' };
		}
	};

	// ---------- 独立小组记录（TeamRecord）----------
	// 小组记录没有全量/兑奖这类特殊类型，只受「已结束周期」与小组是否存在的限制
	const canUndoTeamRecord = (record: TeamRecord): { ok: boolean; reason: string } => {
		const denied = writeDeniedMessage();
		if (denied) return { ok: false, reason: denied };

		const gradeInfo = appStore.activeGrade?.gradeInfo;
		if (!gradeInfo) return { ok: false, reason: '暂无班级信息' };

		const cycle = resolveRecordCycle(record as unknown as RuleRecord);
		if (cycle && cycle.status === 1) {
			return { ok: false, reason: `周期「${cycle.name}」已结束，不支持撤销` };
		}
		if (!(gradeInfo.teamList || []).some(item => item.id === record.team_id)) {
			return { ok: false, reason: '小组已删除，无法撤销' };
		}
		return { ok: true, reason: '' };
	};

	const undoTeamRecord = async (record: TeamRecord): Promise<{ success: boolean; message: string }> => {
		const check = canUndoTeamRecord(record);
		if (!check.ok) return { success: false, message: check.reason || '该记录不可撤销' };
		try {
			if (!appStore.activeGrade) return { success: false, message: '暂无班级信息' };
			const grade = appStore.activeGrade;
			const gradeInfo = grade.gradeInfo;

			const team = (gradeInfo.teamList || []).find(item => item.id === record.team_id);
			if (team) {
				team.points = Number(team.points) - Number(record.points);
			}
			gradeInfo.teamRecordList = (gradeInfo.teamRecordList || []).filter(item => item.id !== record.id);

			await saveGradeInfo(grade.id, JSON.stringify(grade));
			return { success: true, message: '已撤销该条记录' };
		} catch (error) {
			console.error('撤销小组记录出错:', error);
			return { success: false, message: '撤销失败，请重试' };
		}
	};

	return { canUndoRecord, undoRecord, canUndoTeamRecord, undoTeamRecord };
};
