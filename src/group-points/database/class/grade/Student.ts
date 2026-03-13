export class Student {
	id: string;
	name: string;
	grade_id: string;

	constructor(params: { id: string, name: string, grade_id: string }) {
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