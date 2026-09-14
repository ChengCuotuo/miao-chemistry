// - 积分记录 - record
//   - 学生id - student_id
//   - 规则id - rule_id
//   - 记录时间 - time
//   - 来源 - source：0-普通 1-班委周期记录
//   - 周期id - cycle_id：source=1 时有效，记录属于哪个周期
//   - 组id - group_id：source=1 且按组发放时有效，记录是通过哪个组触达该学生的
//   - 单次次数 - count：source=1 时本次记录消耗的次数（同规则多次时 > 1）
//   - 审批状态 - status：0-待审批 1-已通过 2-已驳回；缺失一律视为「已通过」（兼容历史数据与普通记录）
//   - 当前操作人 - operator_id / operator_name / operator_role：默认为提交的班委；管理员审批时修改过内容则改写为管理员
//   - 原始提交人 - submitter_id / submitter_name：始终保留最初提交的班委账号，不因修改而丢失
//   - 审批时间 - audit_time：审批（通过/驳回）时间，待审批为空
//   - 驳回理由 - reject_reason：仅驳回时有值
//   - 全量操作输入值 - batch_value：仅全量操作汇总记录使用，存本次操作输入的值（设置模式为设置值，加/减模式为增减量）

// 审批状态
export const RECORD_STATUS = {
	PENDING: 0, // 待审批
	APPROVED: 1, // 已通过
	REJECTED: 2, // 已驳回
} as const;

// 操作人角色
export const OPERATOR_ROLE = {
	MONITOR: 'monitor', // 班委
	TEACHER: 'teacher', // 管理员（教师）
} as const;

// 状态判定：status 缺失/异常时按「已通过」处理，避免历史数据被误判为待审批
export const getRecordStatus = (record?: { status?: number } | null): number => {
	const status = record?.status;
	if (status === RECORD_STATUS.PENDING || status === RECORD_STATUS.REJECTED) return status;
	return RECORD_STATUS.APPROVED;
};
export const isPendingRecord = (record?: { status?: number } | null) => getRecordStatus(record) === RECORD_STATUS.PENDING;
export const isApprovedRecord = (record?: { status?: number } | null) => getRecordStatus(record) === RECORD_STATUS.APPROVED;
export const isRejectedRecord = (record?: { status?: number } | null) => getRecordStatus(record) === RECORD_STATUS.REJECTED;

export class RuleRecord {
	id: number;
	stu_id: string;
	rule_id: string;
	points: number;
	time: string;
	source: number;
	cycle_id: string;
	group_id: string;
	count: number;
	status: number;
	operator_id: string;
	operator_name: string;
	operator_role: string;
	submitter_id: string;
	submitter_name: string;
	audit_time: string;
	reject_reason: string;
	batch_value: number | null;

	constructor(params: {
		id: number, stu_id: string, rule_id?: string, points?: number, time: string,
		source?: number, cycle_id?: string, group_id?: string, count?: number,
		status?: number, operator_id?: string, operator_name?: string, operator_role?: string,
		submitter_id?: string, submitter_name?: string, audit_time?: string, reject_reason?: string,
		batch_value?: number | null,
	}) {
		this.id = params.id;
		this.stu_id = params.stu_id;
		this.rule_id = params?.rule_id || '';
		this.points = params?.points || 0;
		this.time = params.time;
		this.source = params?.source ?? 0;
		this.cycle_id = params?.cycle_id || '';
		this.group_id = params?.group_id || '';
		this.count = params?.count ?? 1;
		// 未显式传入时按「已通过」处理（历史数据 / 教师直接记分）
		this.status = params?.status ?? RECORD_STATUS.APPROVED;
		this.operator_id = params?.operator_id || '';
		this.operator_name = params?.operator_name || '';
		this.operator_role = params?.operator_role || '';
		this.submitter_id = params?.submitter_id || '';
		this.submitter_name = params?.submitter_name || '';
		this.audit_time = params?.audit_time || '';
		this.reject_reason = params?.reject_reason || '';
		// 仅全量操作汇总记录会传；null 表示未记录输入值
		this.batch_value = (params?.batch_value === null || params?.batch_value === undefined) ? null : Number(params.batch_value);
	}

	toJSON() {
		return {
			id: this.id,
			stu_id: this.stu_id,
			rule_id: this.rule_id,
			points: this.points,
			time: this.time,
			source: this.source,
			cycle_id: this.cycle_id,
			group_id: this.group_id,
			count: this.count,
			status: this.status,
			operator_id: this.operator_id,
			operator_name: this.operator_name,
			operator_role: this.operator_role,
			submitter_id: this.submitter_id,
			submitter_name: this.submitter_name,
			audit_time: this.audit_time,
			reject_reason: this.reject_reason,
			batch_value: this.batch_value,
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}
