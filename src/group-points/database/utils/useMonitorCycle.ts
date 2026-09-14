import { saveGradeInfo } from "..";
import { useAppStore } from "../../store/models/app";
import {
	MonitorCycle, RuleRecord, Student,
	RECORD_STATUS, OPERATOR_ROLE, isPendingRecord, isApprovedRecord,
} from "../class";
import { dayjs } from "element-plus";

// 记录条数上限（与原有逻辑一致）
const MAX_RECORDS = 1000;
// 待审批记录积压上限：超过则拒绝新提交，避免列表无上限增长
const MAX_PENDING_RECORDS = 1000;
// 教师（管理员）在记录里的展示名
const TEACHER_NAME = '管理员';

// 裁剪记录列表：保留最近 MAX_RECORDS 条，但「待审批」记录一律不裁剪
// （否则班委刚提交、还没审批的记录会被裁掉，审批请求凭空消失）
const trimRecordList = (list: RuleRecord[]): RuleRecord[] => {
	if (list.length <= MAX_RECORDS) return list;
	const pending = list.filter(item => isPendingRecord(item));
	const others = list.filter(item => !isPendingRecord(item));
	const keepOthers = pending.length >= MAX_RECORDS ? [] : others.slice(-(MAX_RECORDS - pending.length));
	const keep = new Set<RuleRecord>([...pending, ...keepOthers]);
	return list.filter(item => keep.has(item));
};

// 班委周期积分：仅允许通过规则调整积分，并记录次数与积分变化
// 审批流程：班委提交 → 待审批（不入账）→ 管理员通过（此刻入账）/ 驳回（不入账）
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

	// 删除周期：撤销该周期内已生效的积分调整（学生/独立小组积分回退），并删除周期及其记录
	// 注意：只回退「已通过」的记录——待审批与已驳回的记录从未计入积分，回退会凭空扣分
	// 已结束周期不允许删除（业务规则下沉到数据层，不由 UI 单独兜底）
	const deleteMonitorCycle = async (id: string) => {
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
			// 1. 按记录回退每个学生的积分（仅已通过的记录曾加分）
			cycleRecords.filter(item => isApprovedRecord(item)).forEach(record => {
				const student = gradeInfo.studentList.find(s => s.id === record.stu_id);
				if (student) {
					student.points = Number(student.points) - record.points;
				}
			});
			// 1.1 按记录回退每个独立小组的积分（独立分组记分由教师操作，无审批，全部视为已生效）
			teamCycleRecords.forEach(record => {
				const team = (gradeInfo.teamList || []).find(t => t.id === record.team_id);
				if (team) {
					team.points = Number(team.points) - record.points;
				}
			});
			// 2. 删除周期与记录（三种状态的记录一并删除）
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
	// submitter: 提交人（班委账号）；不传表示教师本人操作
	// needApproval: 是否进入待审批（由调用方按「审批开关 + 提交人角色」决定）
	const adjustPointsByRule = async (params: {
		cycleId: string, ruleId: string, students: Student[], groupId?: string, count?: number, pointsPerCount?: number,
		submitter?: { id?: string, name?: string }, needApproval?: boolean,
	}) => {
		try {
			if (!appStore.activeGrade) return { success: false, message: '暂无班级信息' };
			const { cycleId, ruleId, students, groupId = '', count = 1, pointsPerCount, submitter, needApproval = false } = params;
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
			const isPending = !!needApproval;

			// 闸门 1：班委提交时「启用班委记分」必须为开启（防止开关关闭后在线的班委继续提交）
			if (submitter && (appStore.database.basicConfig?.monitorAccountEnabled ?? true) === false) {
				return { success: false, message: '管理员已关闭班委记分，无法提交记分' };
			}
			// 闸门 2：班委账号必须仍存在（账号被删除后旧会话不能继续提交）
			if (submitter?.id) {
				const accounts = gradeInfo.monitorAccountList || [];
				const account = accounts.find(item => item.id === submitter.id);
				if (!account) {
					return { success: false, message: '当前班委账号已失效，请退出后重新登录' };
				}
				// 以账号表里的名称为准，避免名称对不上
				submitter.name = account.name;
			}
			// 闸门 3：待审批积压上限（正常使用不会触及，防止异常情况下无限增长）
			if (isPending) {
				const pendingTotal = gradeInfo.recordList.filter(item => item.source === 1 && isPendingRecord(item)).length;
				if (pendingTotal >= MAX_PENDING_RECORDS) {
					return { success: false, message: `待审批记录已达 ${MAX_PENDING_RECORDS} 条，请先审批完成后再提交` };
				}
			}

			// 操作人：有提交人（班委）时为班委，否则为管理员（教师本人记分）
			const operatorId = submitter?.id || '';
			const operatorName = submitter?.name || TEACHER_NAME;
			const operatorRole = submitter ? OPERATOR_ROLE.MONITOR : OPERATOR_ROLE.TEACHER;

			students.forEach(stu => {
				const target = gradeInfo.studentList.find(item => item.id === stu.id);
				if (!target) return;
				const points = perPoints * count;
				// 待审批的记分先不入账，等管理员审批通过时才加
				if (!isPending) {
					target.points = Number(target.points) + points;
				}
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
					status: isPending ? RECORD_STATUS.PENDING : RECORD_STATUS.APPROVED,
					operator_id: operatorId,
					operator_name: operatorName,
					operator_role: operatorRole,
					// 原始提交人：仅班委提交时记录（教师自己记分没有「班委提交人」）
					submitter_id: submitter ? operatorId : '',
					submitter_name: submitter ? operatorName : '',
				});
				gradeInfo.indexMap.record++;
				gradeInfo.recordList.push(record);
			});
			// 仅保留最近1000条记录（待审批记录优先保留，避免审批请求被裁剪）
			gradeInfo.recordList = trimRecordList(gradeInfo.recordList);

			await saveGradeInfo(appStore.activeGrade.id, JSON.stringify(appStore.activeGrade));
			return {
				success: true,
				pendingCount: isPending ? students.length : 0,
				message: isPending
					? `已提交 ${students.length} 条记录，等待管理员审批（尚未计入积分）`
					: `已记录 ${students.length} 人`,
			};
		} catch (error) {
			console.error('周期记分调整出错:', error);
			return { success: false, message: '操作失败，请重试' };
		}
	}

	// ---------- 审批 ----------

	// 周期记录（含各种状态），可按周期与状态过滤
	const getCycleRecords = (cycleId?: string, status?: number) => {
		const list = appStore.activeGrade?.gradeInfo?.recordList || [];
		return list.filter(item => item.source === 1
			&& (!cycleId || item.cycle_id === cycleId)
			&& (status === undefined || item.status === status));
	}

	// 待审批记录
	const getPendingRecords = (cycleId?: string) => getCycleRecords(cycleId)
		.filter(item => isPendingRecord(item));

	// 待审批条数
	const countPendingRecords = (cycleId?: string) => getPendingRecords(cycleId).length;

	// 审批通过：此刻才把积分计入学生，并记录审批时间与操作人
	const approveRecords = async (ids: number[]) => {
		try {
			if (!appStore.activeGrade) return { approved: 0, pointsSum: 0, message: '暂无班级信息' };
			const gradeInfo = appStore.activeGrade.gradeInfo;
			const time = dayjs().format('YYYY-MM-DD HH:mm:ss');
			let approved = 0;
			let pointsSum = 0;
			ids.forEach(id => {
				const record = gradeInfo.recordList.find(item => item.id === id);
				if (!record || !isPendingRecord(record)) return;
				const student = gradeInfo.studentList.find(s => s.id === record.stu_id);
				if (!student) return;
				student.points = Number(student.points) + record.points;
				record.status = RECORD_STATUS.APPROVED;
				record.audit_time = time;
				record.reject_reason = '';
				approved++;
				pointsSum += record.points;
			});
			if (approved > 0) {
				await saveGradeInfo(appStore.activeGrade.id, JSON.stringify(appStore.activeGrade));
			}
			return { approved, pointsSum, message: `已通过 ${approved} 条记录` };
		} catch (error) {
			console.error('审批通过出错:', error);
			return { approved: 0, pointsSum: 0, message: '操作失败，请重试' };
		}
	}

	// 审批驳回：不入账，记录理由（驳回为终态，不可再改、不可撤回）
	const rejectRecords = async (ids: number[], reason = '') => {
		try {
			if (!appStore.activeGrade) return { rejected: 0, message: '暂无班级信息' };
			const gradeInfo = appStore.activeGrade.gradeInfo;
			const time = dayjs().format('YYYY-MM-DD HH:mm:ss');
			const finalReason = (reason || '').trim() || '管理员驳回';
			let rejected = 0;
			ids.forEach(id => {
				const record = gradeInfo.recordList.find(item => item.id === id);
				if (!record || !isPendingRecord(record)) return;
				record.status = RECORD_STATUS.REJECTED;
				record.reject_reason = finalReason;
				record.audit_time = time;
				rejected++;
			});
			if (rejected > 0) {
				await saveGradeInfo(appStore.activeGrade.id, JSON.stringify(appStore.activeGrade));
			}
			return { rejected, message: `已驳回 ${rejected} 条记录` };
		} catch (error) {
			console.error('审批驳回出错:', error);
			return { rejected: 0, message: '操作失败，请重试' };
		}
	}

	// 审批时修改待审批记录：仅待审批可改；修改后「操作人」变为管理员，原始提交班委保留在 submitter_*
	// patch.points 为该条记录修改后的总积分；只改 count 未改 points 时按单次分值等比换算
	const updatePendingRecord = async (
		id: number,
		patch: { stu_id?: string, rule_id?: string, count?: number, points?: number },
		operator?: { id?: string, name?: string },
	) => {
		try {
			if (!appStore.activeGrade) return { success: false, message: '暂无班级信息' };
			const gradeInfo = appStore.activeGrade.gradeInfo;
			const record = gradeInfo.recordList.find(item => item.id === id);
			if (!record) return { success: false, message: '记录不存在' };
			if (!isPendingRecord(record)) return { success: false, message: '仅待审批记录可修改' };

			const prevCount = record.count || 1;
			const prevPoints = Number(record.points) || 0;

			if (patch.stu_id !== undefined && patch.stu_id !== record.stu_id) {
				const student = gradeInfo.studentList.find(s => s.id === patch.stu_id);
				if (!student) return { success: false, message: '学生不存在' };
				record.stu_id = patch.stu_id;
			}
			if (patch.rule_id !== undefined && patch.rule_id) {
				record.rule_id = patch.rule_id;
			}
			if (patch.count !== undefined) {
				record.count = Math.max(1, Math.floor(Number(patch.count) || 1));
			}
			if (patch.points !== undefined) {
				record.points = Number(patch.points) || 0;
			} else if (patch.count !== undefined && record.count !== prevCount) {
				// 只改次数：按原单次分值等比换算
				const perPoints = prevPoints / prevCount;
				record.points = Number((perPoints * record.count).toFixed(2));
			}
			// 管理员改过内容 → 该条记录的操作人变为管理员（原始提交人仍在 submitter_*）
			record.operator_id = operator?.id || '';
			record.operator_name = operator?.name || TEACHER_NAME;
			record.operator_role = OPERATOR_ROLE.TEACHER;

			await saveGradeInfo(appStore.activeGrade.id, JSON.stringify(appStore.activeGrade));
			return { success: true, message: '已修改该条记录（仍为待审批，请选择通过或驳回），操作人已变更为管理员' };
		} catch (error) {
			console.error('修改待审批记录出错:', error);
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
		// 审批
		getCycleRecords,
		getPendingRecords,
		countPendingRecords,
		approveRecords,
		rejectRecords,
		updatePendingRecord,
	}
}
