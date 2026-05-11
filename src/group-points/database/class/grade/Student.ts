export class Student {
	id: string;
	name: string;
	points: number;

	constructor(params: { id: string, name: string, points: number }) {
		this.id = params.id;
		this.name = params.name;
		this.points = params.points;
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			points: this.points,
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}