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
	}[];
	ruleList: Rule[];
	prizeList: Prize[];
	recordList: Record[];
}

export const curWindow = window as any;

export const GroupPointsConfig = {
	database: "group-points",
	defaultTables: [
		'grade', // 年级配置
		'rule', // 规则配置
		'prize', // 奖励配置
		'record', // 记录配置
	],
	suffix: '.json',
};

export async function loadGroupPointsConfig() {
	try {
		const mainConfig = await curWindow.electronAPI.loadConfigFromFile({
			mainPath: GroupPointsConfig.database,
			fileList: GroupPointsConfig.defaultTables,
			suffix: GroupPointsConfig.suffix,
			defaultContent: '[]'
		});

		const SUFFIX = 'grade'

		const { grade, rule, prize, record } = mainConfig;
		const gradeList: Grade[] = JSON.parse(grade) || [];
		const ruleList: Rule[] = JSON.parse(rule) || [];
		const prizeList: Prize[] = JSON.parse(prize) || [];
		const recordList: Record[] = JSON.parse(record) || [];

		const allGrades = await curWindow.electronAPI.loadConfigFromFile({
			mainPath: GroupPointsConfig.database,
			fileList: gradeList.map((item: any) => `${SUFFIX}-${item.id}`),
			suffix: GroupPointsConfig.suffix,
			defaultContent: '{"groupList": [], "studentList": [], "studentGroupList": []}',
		})

		const data: DatabaseInfoType = {
			gradeList: gradeList.map(grade => ({
				...grade,
				gradeInfo: JSON.parse(allGrades[`${SUFFIX}}-${grade.id}`]) as { groupList: Group[], studentList: Student[], studentGroupList: StudentGroup[] },
			})),
			ruleList,
			prizeList,
			recordList,
		}
		return data
	} catch (error) {
		console.error('读取文件出错:', error);
	}
}