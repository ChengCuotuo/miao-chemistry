export class StudentGroup {
	id: number;
	student_id: number;
	group_id: number;
	grade_id: number;

	constructor(params: { id: number, student_id: number, group_id: number, grade_id: number }) {
		this.id = params.id;
		this.student_id = params.student_id;
		this.group_id = params.group_id;
		this.grade_id = params.grade_id;
	}

	toJSON() {
		return {
			id: this.id,
			student_id: this.student_id,
			group_id: this.group_id,
			grade_id: this.grade_id,
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}