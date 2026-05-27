
export class Basic {
	step: number;
	password: string;

	constructor(params: { step: number, password: string }) {
		this.step = params.step;
		this.password = params.password;
	}

	toJSON() {
		return {
			step: this.step,
			password: this.password,
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}