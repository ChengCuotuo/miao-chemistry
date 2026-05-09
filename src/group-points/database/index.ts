import {
	Grade,
	Rule,
	Prize,
	Record,
	Group,
	Student,
	StudentGroup
} from './class';
export interface DatabaseInfoType {
	gradeList: {
		gradeInfo: {
			groupList: Group[];
			studentList: Student[];
			studentGroupList: StudentGroup[];
		};
		id: string;
		name: string;
		delete: number;
	}[];
	ruleList: Rule[];
	prizeList: Prize[];
	recordList: Record[];
}
export const curWindow = window as any;

//相当于做了分表，根据班级进行分表
// grade 表，存储了有哪些班级，班级名称 + 班级 id
// grade-{id} 存储了班级的配置信息，包括分组、学生、学生分组

const DEFAULT_TABLE_NAME = {
	grade: 'grade',
	rule: 'rule',
	prize: 'prize',
	record: 'record',
}
export const GroupPointsConfig = {
	database: "group-points", // 数据库路径
	defaultTables: [ // 默认配置（全局数据）
		DEFAULT_TABLE_NAME.grade, // 年级配置
		DEFAULT_TABLE_NAME.rule, // 规则配置
		DEFAULT_TABLE_NAME.prize, // 奖励配置
		DEFAULT_TABLE_NAME.record, // 积分记录
	],
	suffix: '.json', // 文件后缀
};

export async function loadGroupPointsConfig() {
	try {
		// 加载默认配置
		const mainConfig = await curWindow.electronAPI.loadConfigFromFile({
			mainPath: GroupPointsConfig.database,
			fileList: GroupPointsConfig.defaultTables,
			suffix: GroupPointsConfig.suffix,
			defaultContent: '[]'
		});

		// 解析信息
		const { grade, rule, prize, record } = mainConfig;
		const gradeList: Grade[] = JSON.parse(grade) || [];
		const ruleList: Rule[] = JSON.parse(rule) || [];
		const prizeList: Prize[] = JSON.parse(prize) || [];
		const recordList: Record[] = JSON.parse(record) || [];

		// TODO Grade 具体信息，不放到外层加载，放到每个班级的配置文件中加载
		// 加载具体班级配置，根据 gradeList 中的 id 加载对应的配置文件，设置默认信息
		// groupList 分组信息、studentList 学生、studentGroupList 学生分组
		// const allGrades = await curWindow.electronAPI.loadConfigFromFile({
		// 	mainPath: GroupPointsConfig.database,
		// 	fileList: gradeList.map((item: any) => `${DEFAULT_TABLE_NAME.grade}-${item.id}`),
		// 	suffix: GroupPointsConfig.suffix,
		// 	defaultContent: '{"groupList": [], "studentList": [], "studentGroupList": []}',
		// })

		// const data: DatabaseInfoType = {
		// 	gradeList: gradeList.map(grade => ({
		// 		...grade,
		// 		gradeInfo: JSON.parse(allGrades[`${DEFAULT_TABLE_NAME.grade}-${grade.id}`]) as { groupList: Group[], studentList: Student[], studentGroupList: StudentGroup[] },
		// 	})),
		// 	ruleList,
		// 	prizeList,
		// 	recordList,
		// }

		const data: DatabaseInfoType = {
			gradeList,
			ruleList,
			prizeList,
			recordList,
		}
		return data
	} catch (error) {
		console.error('读取文件出错:', error);
	}
}

export async function appendGradeConfig(content: string) {
	return await curWindow.electronAPI.writeConfigToFile({
		mainPath: GroupPointsConfig.database,
		fileName: DEFAULT_TABLE_NAME.grade,
		suffix: GroupPointsConfig.suffix,
		content
	});
}

export async function saveGradeInfo(gradeId: string, content: string) {
	return await curWindow.electronAPI.writeConfigToFile({
		mainPath: GroupPointsConfig.database,
		fileName: `${DEFAULT_TABLE_NAME.grade}-${gradeId}`,
		suffix: GroupPointsConfig.suffix,
		content
	});
}

export async function loadGradeInfoById(gradeId: string) {
	return await curWindow.electronAPI.loadFile({
		mainPath: GroupPointsConfig.database,
		fileName: `${DEFAULT_TABLE_NAME.grade}-${gradeId}`,
		suffix: GroupPointsConfig.suffix,
		defaultContent: '{"groupList": [], "studentList": [], "studentGroupList": []}',
	});
}

export async function appendRuleConfig(content: string) {
	return await curWindow.electronAPI.writeConfigToFile({
		mainPath: GroupPointsConfig.database,
		fileName: DEFAULT_TABLE_NAME.rule,
		suffix: GroupPointsConfig.suffix,
		content
	});
}

export async function appendPrizeConfig(content: string) {
	return await curWindow.electronAPI.writeConfigToFile({
		mainPath: GroupPointsConfig.database,
		fileName: DEFAULT_TABLE_NAME.prize,
		suffix: GroupPointsConfig.suffix,
		content
	});
}