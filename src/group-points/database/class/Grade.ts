export class Grade {
	id: number;
	name: string;

	constructor(grade: { id: number, name: string }) {
		this.id = grade.id;
		this.name = grade.name;
	}
	toJSON() {
		return {
			id: this.id,
			name: this.name,
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}