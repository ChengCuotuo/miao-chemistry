export class StudentGroup {
	id: string;
	student_id: string;
	group_id: string;

	constructor(params: { id: string, student_id: string, group_id: string }) {
		this.id = params.id;
		this.student_id = params.student_id;
		this.group_id = params.group_id;
	}

	toJSON() {
		return {
			id: this.id,
			student_id: this.student_id,
			group_id: this.group_id,
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}