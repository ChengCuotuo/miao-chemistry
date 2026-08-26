
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
		// 学生管理
		studentManage: boolean;
		// 周期记分
		monitorManage: boolean;
		// 数据分析
		analysisManage: boolean;
	};
	// 班级页模块展示顺序（tab name 数组）
	moduleOrder: string[];
	// 数据分析各图表可见性
	analysisChartVisibility: {
		trend: boolean;
		rule: boolean;
		ruleHealth: boolean;
		group: boolean;
		student: boolean;
		matrix: boolean;
	};
	// 数据分析各图表展示顺序（key 数组）
	analysisChartOrder: string[];

	constructor(params: { step: number, buildType: string, password: string, firstRun: number, startTime: number, duration: number, moduleVisibility?: Partial<Basic['moduleVisibility']>, moduleOrder?: string[], analysisChartVisibility?: Partial<Basic['analysisChartVisibility']>, analysisChartOrder?: string[] }) {
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
			studentManage: params.moduleVisibility?.studentManage ?? true,
			monitorManage: params.moduleVisibility?.monitorManage ?? true,
			analysisManage: params.moduleVisibility?.analysisManage ?? true,
		};
		this.moduleOrder = params.moduleOrder || [];
		this.analysisChartVisibility = {
			trend: params.analysisChartVisibility?.trend ?? true,
			rule: params.analysisChartVisibility?.rule ?? true,
			ruleHealth: params.analysisChartVisibility?.ruleHealth ?? true,
			group: params.analysisChartVisibility?.group ?? true,
			student: params.analysisChartVisibility?.student ?? true,
			matrix: params.analysisChartVisibility?.matrix ?? true,
		};
		this.analysisChartOrder = params.analysisChartOrder || [];
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