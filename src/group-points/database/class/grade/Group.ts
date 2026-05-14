export class Group {
	id: string;
	name: string;
	order: number

	constructor(params: { id: string, name: string, order: number }) {
		this.id = params.id;
		this.name = params.name;
		this.order = params.order;
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			order: this.order,
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}