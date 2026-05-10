export class Student {
	id: string;
	name: string;

	constructor(params: { id: string, name: string }) {
		this.id = params.id;
		this.name = params.name;
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