import {
	Grade,
	Rule,
	Prize,
	PrizeRecord,
	Group,
	Student,
	StudentGroup
} from './class';
import { Basic } from './class/main/Basic';
export interface DatabaseInfoType {
	gradeList: {
		gradeInfo: {
			groupList: Group[];
			studentList: Student[];
			studentGroupList: StudentGroup[];
			recordList: PrizeRecord[];
			indexMap: {
				group: number,
				student: number,
				record: number,
			}
		};
		id: string;
		name: string;
		delete: number;
	}[];
	ruleList: Rule[];
	prizeList: Prize[];
	basicConfig: Basic;
}
export const curWindow = window as any;

//相当于做了分表，根据班级进行分表
// grade 表，存储了有哪些班级，班级名称 + 班级 id
// grade-{id} 存储了班级的配置信息，包括分组、学生、学生分组

const DEFAULT_TABLE_NAME = {
	grade: 'grade',
	rule: 'rule',
	prize: 'prize',
	basic: 'basic',
}
export const GroupPointsConfig = {
	database: "group-points", // 数据库路径
	statics: "statics", // 静态资源路径
	defaultTables: [ // 默认配置（全局数据）
		DEFAULT_TABLE_NAME.grade, // 年级配置
		DEFAULT_TABLE_NAME.rule, // 规则配置
		DEFAULT_TABLE_NAME.prize, // 奖励配置
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

		const basicConfig = await curWindow.electronAPI.loadFile({
			mainPath: GroupPointsConfig.database,
			fileName: DEFAULT_TABLE_NAME.basic,
			suffix: GroupPointsConfig.suffix,
			defaultContent: JSON.stringify({ step: "1" }), // 设置步长为 1
		});

		// 解析信息
		const { grade, rule, prize } = mainConfig;
		const gradeList: Grade[] = JSON.parse(grade) || [];
		const ruleList: Rule[] = JSON.parse(rule) || [];
		const prizeList: Prize[] = JSON.parse(prize) || [];
		const basicConfigData = JSON.parse(basicConfig) || { step: "1" };

		const data: DatabaseInfoType = {
			gradeList,
			ruleList,
			prizeList,
			basicConfig: basicConfigData
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
		defaultContent: JSON.stringify({
			groupList: [], // 分组列表
			studentList: [], // 学生列表
			studentGroupList: [], // 学生分组列表
			recordList: [], // 奖励记录列表
			indexMap: { group: 0, student: 0, studentGroup: 0, record: 0 } // 索引映射
		}),
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

// 保存静态文件
export async function saveStaticFile(fileName: string, content: any) {
	return await curWindow.electronAPI.writeToFile({
		mainPath: `${GroupPointsConfig.database}/${GroupPointsConfig.statics}`,
		fileName,
		content
	});
}

// // 读取静态文件
// export async function loadStaticFile(fileName: string) {
// 	return await curWindow.electronAPI.readFile({
// 		mainPath: `${GroupPointsConfig.database}/${GroupPointsConfig.statics}`,
// 		fileName,
// 	});
// }

export async function loadFilePath(fileName: string) {
	return await curWindow.electronAPI.loadFilePath({
		mainPath: `${GroupPointsConfig.database}/${GroupPointsConfig.statics}`,
		fileName
	});
}

export function getStaticFilePath(filePath: string) {
	return curWindow.electronAPI.loadStaticFileURL(filePath);
}