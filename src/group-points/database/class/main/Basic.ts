
export class Basic {
	step: number;
	buildType: string;
	// 密码
	password: string;
	firstRun: number;
	startTime: number;

	constructor(params: { step: number, buildType: string, password: string, firstRun: number, startTime: number, }) {
		this.step = params.step;
		this.buildType = params.buildType;
		this.password = params.password;
		this.firstRun = params.firstRun;
		this.startTime = params.startTime;
	}

	toJSON() {
		return {
			step: this.step,
			password: this.password,
			firstRun: this.firstRun,
			startTime: this.startTime,
			buildType: this.buildType,
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}