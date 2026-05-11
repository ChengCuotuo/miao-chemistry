
export class Basic {
	step: number;

	constructor(params: { step: number, }) {
		this.step = params.step;
	}

	toJSON() {
		return {
			step: this.step,
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}