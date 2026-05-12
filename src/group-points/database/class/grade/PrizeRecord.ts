// - 积分记录 - record
//   - id - id
//   - 学生id - student_id
//   - 规则id - rule_id
//   - 记录时间 - time

export class PrizeRecord {
	id: number;
	stu_id: string;
	rule_id: string;
	time: string;

	constructor(params: { id: number, stu_id: string, rule_id: string, time: string }) {
		this.id = params.id;
		this.stu_id = params.stu_id;
		this.rule_id = params.rule_id;
		this.time = params.time;
	}
	toJSON() {
		return {
			id: this.id,
			stu_id: this.stu_id,
			rule_id: this.rule_id,
			time: this.time,
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}