// - 积分记录 - record
//   - 学生id - student_id
//   - 规则id - rule_id
//   - 记录时间 - time
//   - 来源 - source：0-普通 1-周期记录
//   - 周期id - cycle_id：source=1 时有效，记录属于哪个周期
//   - 组id - group_id：source=1 且按组发放时有效，记录是通过哪个组触达该学生的
//   - 单次次数 - count：source=1 时本次记录消耗的次数（同规则多次时 > 1）
//   - 记录人 - operator_id / operator_name：写入该条记录的操作者（管理员，或已登录的班委账号）
//   - 全量操作输入值 - batch_value：仅全量操作汇总记录使用，存本次操作输入的值（设置模式为设置值，加/减模式为增减量）

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
	operator_id: string;
	operator_name: string;
	batch_value: number | null;

	constructor(params: {
		id: number, stu_id: string, rule_id?: string, points?: number, time: string,
		source?: number, cycle_id?: string, group_id?: string, count?: number,
		operator_id?: string, operator_name?: string,
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
		this.operator_id = params?.operator_id || '';
		this.operator_name = params?.operator_name || '';
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
			operator_id: this.operator_id,
			operator_name: this.operator_name,
			batch_value: this.batch_value,
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}
