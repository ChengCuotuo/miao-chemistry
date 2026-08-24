
export class Basic {
	step: number;
	buildType: string;
	// 密码
	password: string;
	firstRun: number;
	startTime: number;
	duration: number;
	// 班级管理页模块可见性配置
	moduleVisibility: {
		// 分组管理
		groupManage: boolean;
		// 积分管理（学生管理）
		pointsManage: boolean;
		// 积分兑换
		pointsExchange: boolean;
	};

	constructor(params: { step: number, buildType: string, password: string, firstRun: number, startTime: number, duration: number, moduleVisibility?: Partial<Basic['moduleVisibility']> }) {
		this.step = params.step;
		this.buildType = params.buildType;
		this.password = params.password;
		this.firstRun = params.firstRun;
		this.startTime = params.startTime;
		this.duration = params.duration;
		this.moduleVisibility = {
			groupManage: params.moduleVisibility?.groupManage ?? true,
			pointsManage: params.moduleVisibility?.pointsManage ?? true,
			pointsExchange: params.moduleVisibility?.pointsExchange ?? true,
		};
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