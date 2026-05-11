// - 积分记录 - record
//   - id - id
//   - 学生id - student_id
//   - 规则id - rule_id
//   - 积分值 - points
//   - 记录时间 - time

export class PrizeRecord {
	id: string;
	stu_id: string;
	rule_id: string;
	points: number;
	time: Date;

	constructor(params: { id: string, stu_id: string, rule_id: string, points: number, time: Date }) {
		this.id = params.id;
		this.stu_id = params.stu_id;
		this.rule_id = params.rule_id;
		this.points = params.points;
		this.time = params.time;
	}
	toJSON() {
		return {
			id: this.id,
			stu_id: this.stu_id,
			rule_id: this.rule_id,
			points: this.points,
			time: this.time,
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}