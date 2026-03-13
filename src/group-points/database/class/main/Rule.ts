
// - 规则设置 - rule
//   - id - id
//   - 规则名称 - name
//   - 规则描述 - description
//   - 积分值 - points

export class Rule {
	id: string;
	name: string;
	description: string;
	points: number;
	allow_grades: string[];

	constructor(params: { id: string, name: string, description: string, points: number, allow_grades: string[] }) {
		this.id = params.id;
		this.name = params.name;
		this.description = params.description;
		this.points = params.points;
		this.allow_grades = params.allow_grades;
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			points: this.points,
			allow_grades: this.allow_grades,
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}