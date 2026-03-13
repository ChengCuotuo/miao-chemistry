export class Student {
	id: number;
	name: string;
	grade_id: number;

	constructor(params: { id: number, name: string, grade_id: number }) {
		this.id = params.id;
		this.name = params.name;
		this.grade_id = params.grade_id;
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			grade_id: this.grade_id,
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}