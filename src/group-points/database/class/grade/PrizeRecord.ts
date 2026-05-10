// - 积分记录 - record
//   - id - id
//   - 学生id - student_id
//   - 规则id - rule_id
//   - 积分值 - points
//   - 记录时间 - time

export class PrizeRecord {
	id: string;
	student_id: string;
	student_name: string;
	rule_id: string;
	rule_name: string;
	points: number;
	time: Date;

	constructor(params: { id: string, student_id: string, student_name: string, rule_id: string, rule_name: string, points: number, time: Date }) {
		this.id = params.id;
		this.student_id = params.student_id;
		this.student_name = params.student_name;
		this.rule_id = params.rule_id;
		this.rule_name = params.rule_name;
		this.points = params.points;
		this.time = params.time;
	}
	toJSON() {
		return {
			id: this.id,
			student_id: this.student_id,
			student_name: this.student_name,
			rule_id: this.rule_id,
			points: this.points,
			time: this.time,
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}