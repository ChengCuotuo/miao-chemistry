import {
	Grade,
	Rule,
	Prize,
	RuleRecord,
	Group,
	Student,
	StudentGroup,
	MonitorCycle,
	MonitorAccount
} from './class';
import { Basic } from './class/main/Basic';
import ruleConfigJson from './defaultRule.json';
import md5 from 'blueimp-md5'
import { generateRandom6Digit } from './utils';
import dayjs from 'dayjs';

export interface DatabaseInfoType {
	gradeList: {
		gradeInfo: {
			groupList: Group[];
			studentList: Student[];
			studentGroupList: StudentGroup[];
			recordList: RuleRecord[];
			monitorCycleList: MonitorCycle[];
			monitorAccountList: MonitorAccount[];
			indexMap: {
				group: number,
				student: number,
				record: number,
				monitorCycle: number,
				monitorAccount: number,
			},
			gradeConfig: {
				orderByPoints: number,
			}
		};
		id: string;
		name: string;
		delete: number;
	}[];
	ruleList: Rule[];
	prizeList: Prize[];
	basicConfig: Basic;
	password: string;
}
export const curWindow = window as any;

//相当于做了分表，根据班级进行分表
// grade 表，存储了有哪些班级，班级名称 + 班级 id
// grade-{id} 存储了班级的配置信息，包括分组、学生、学生分组

export const DEFAULT_TABLE_NAME = {
	grade: 'grade',
	rule: 'rule',
	prize: 'prize',
	basic: 'basic',
}

export const BUILD_TYPE = {
	trial: 'trial',
	official: 'official',
}

export const GroupPointsConfig = {
	database: "group-points", // 数据库路径
	statics: "statics", // 静态资源路径
	defaultTables: [ // 默认配置（全局数据）
		DEFAULT_TABLE_NAME.grade, // 年级配置
		DEFAULT_TABLE_NAME.prize, // 奖励配置
	],
	suffix: '.json', // 文件后缀
	downloadSuffix: '.miao', // 下载文件后缀
	prizePrefix: '_prize_', // prize 前缀
};

export async function loadGroupPointsConfig() {
	try {
		// 使用构建时注入的环境变量
		const buildType = import.meta.env.BUILD_TYPE;
		const duration = Number(import.meta.env.DURATION) * 24 * 60 * 60; // 天转换为秒

		let password: string = '';
		if (buildType === BUILD_TYPE.official) {
			password = generateRandom6Digit();
		} else {
			password = '123456';
		}

		const startTime = dayjs().startOf('day').unix();

		// 加载年级和奖励配置
		const mainConfig = await curWindow.electronAPI.loadConfigFromFile({
			mainPath: GroupPointsConfig.database,
			fileList: GroupPointsConfig.defaultTables,
			suffix: GroupPointsConfig.suffix,
			defaultContent: '[]'
		});

		// 加载规则配置
		const ruleConfig = await curWindow.electronAPI.loadFile({
			mainPath: GroupPointsConfig.database,
			fileName: DEFAULT_TABLE_NAME.rule,
			suffix: GroupPointsConfig.suffix,
			defaultContent: JSON.stringify(ruleConfigJson)
		});

		const basicConfig = await curWindow.electronAPI.loadFile({
			mainPath: GroupPointsConfig.database,
			fileName: DEFAULT_TABLE_NAME.basic,
			suffix: GroupPointsConfig.suffix,
			defaultContent: JSON.stringify({ step: "1", buildType, password: md5(password), firstRun: 1, startTime, duration }),
		});

		// 解析信息
		const { grade, prize } = mainConfig;
		const gradeList: Grade[] = JSON.parse(grade) || [];
		const ruleList: Rule[] = JSON.parse(ruleConfig) || [];
		const prizeList: Prize[] = JSON.parse(prize) || [];
		const basicConfigData = JSON.parse(basicConfig) || { step: "1", buildType, password: md5(password), firstRun: 1, startTime, duration };

		// 兼容旧版本配置：模块可见性字段缺失时默认全部展示
		basicConfigData.moduleVisibility = {
			groupManage: basicConfigData.moduleVisibility?.groupManage ?? true,
			pointsManage: basicConfigData.moduleVisibility?.pointsManage ?? true,
			pointsExchange: basicConfigData.moduleVisibility?.pointsExchange ?? true,
			studentManage: basicConfigData.moduleVisibility?.studentManage ?? true,
			analysisManage: basicConfigData.moduleVisibility?.analysisManage ?? true,
		};
		// 兼容旧版本配置：周期记分可见性默认开启；旧版本存在顶层 monitorVisibility 字段的迁入 moduleVisibility.monitorManage
		basicConfigData.moduleVisibility.monitorManage = basicConfigData.moduleVisibility?.monitorManage
			?? (basicConfigData as any).monitorVisibility ?? true;

		// 兼容旧版本配置：数据分析图表可见性/顺序默认全展示
		basicConfigData.analysisChartVisibility = {
			trend: basicConfigData.analysisChartVisibility?.trend ?? true,
			rule: basicConfigData.analysisChartVisibility?.rule ?? true,
			ruleHealth: basicConfigData.analysisChartVisibility?.ruleHealth ?? true,
			group: basicConfigData.analysisChartVisibility?.group ?? true,
			student: basicConfigData.analysisChartVisibility?.student ?? true,
			matrix: basicConfigData.analysisChartVisibility?.matrix ?? true,
		};
		basicConfigData.analysisChartOrder = Array.isArray(basicConfigData.analysisChartOrder)
			? basicConfigData.analysisChartOrder : [];

		// 正式版构建运行时，如果持久化的配置信息还是体验版，则覆盖为正式版
		if (buildType === BUILD_TYPE.official && basicConfigData.buildType !== BUILD_TYPE.official) {
			basicConfigData.buildType = BUILD_TYPE.official;
			await appendBasicConfig(JSON.stringify(basicConfigData));
		}

		const data: DatabaseInfoType = {
			gradeList,
			ruleList,
			prizeList,
			basicConfig: basicConfigData,
			password,
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
			monitorCycleList: [], // 周期记分周期列表
			monitorAccountList: [], // 班委账号列表
			indexMap: { group: 0, student: 0, studentGroup: 0, record: 0, monitorCycle: 0, monitorAccount: 0 }, // 索引映射
			gradeConfig: {
				orderByPoints: 0,
			}
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

export async function appendBasicConfig(content: string) {
	return await curWindow.electronAPI.writeConfigToFile({
		mainPath: GroupPointsConfig.database,
		fileName: DEFAULT_TABLE_NAME.basic,
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

export async function loadImagePath(fileName: string) {
	return await curWindow.electronAPI.loadFilePath({
		mainPath: `${GroupPointsConfig.database}/${GroupPointsConfig.statics}`,
		fileName
	});
}

// 将 Uint8Array 转换为 base64
function uint8ArrayToBase64(bytes: Uint8Array): string {
	const CHUNK_SIZE = 0x8000;
	const chunks: string[] = [];
	for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
		chunks.push(String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE)));
	}
	return btoa(chunks.join(''));
}

// 读取图片文件并返回 Uint8Array
export async function loadImageAsUint8Array(fileName: string): Promise<Uint8Array | null> {
	try {
		const filePath = await loadImagePath(fileName);
		const result = await curWindow.electronAPI.readFullPathFile(filePath);

		if (result && result.content) {
			return new Uint8Array(result.content);
		}
		return null;
	} catch (error) {
		console.error('加载图片失败:', error);
		return null;
	}
}

// 读取图片文件并返回 base64 格式
export async function loadImageAsBase64(fileName: string): Promise<string> {
	try {
		const uint8Array = await loadImageAsUint8Array(fileName);

		if (uint8Array) {
			const base64 = uint8ArrayToBase64(uint8Array);
			const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
			return `data:image/${ext === 'png' ? 'png' : ext === 'gif' ? 'gif' : 'jpeg'};base64,${base64}`;
		}
		return '';
	} catch (error) {
		console.error('加载图片失败:', error);
		return '';
	}
}