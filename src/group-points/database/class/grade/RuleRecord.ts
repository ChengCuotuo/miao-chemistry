// - 积分记录 - record
//   - 学生id - student_id
//   - 规则id - rule_id
//   - 记录时间 - time
//   - 来源 - source：0-普通 1-班委周期记录
//   - 周期id - cycle_id：source=1 时有效，记录属于哪个周期
//   - 组id - group_id：source=1 且按组发放时有效，记录是通过哪个组触达该学生的
//   - 单次次数 - count：source=1 时本次记录消耗的次数（同规则多次时 > 1）

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

	constructor(params: { id: number, stu_id: string, rule_id?: string, points?: number, time: string, source?: number, cycle_id?: string, group_id?: string, count?: number }) {
		this.id = params.id;
		this.stu_id = params.stu_id;
		this.rule_id = params?.rule_id || '';
		this.points = params?.points || 0;
		this.time = params.time;
		this.source = params?.source ?? 0;
		this.cycle_id = params?.cycle_id || '';
		this.group_id = params?.group_id || '';
		this.count = params?.count ?? 1;
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
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}
