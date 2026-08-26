import { Group } from './Group';
import { RuleRecord } from './RuleRecord';
import { Student } from './Student';
import { StudentGroup } from './StudentGroup';
import { MonitorCycle } from './MonitorCycle';
import { MonitorAccount } from './MonitorAccount';
import { Team } from './Team';
import { TeamRecord } from './TeamRecord';

export class Grade {
	id: string;
	name: string;
	delete: number; // 是否删除标记
	gradeInfo: {
		groupList: Group[];
		studentList: Student[];
		studentGroupList: StudentGroup[];
		recordList: RuleRecord[];
		monitorCycleList: MonitorCycle[];
		monitorAccountList: MonitorAccount[];
		teamList: Team[];
		teamRecordList: TeamRecord[];
		indexMap: {
			group: number,
			student: number,
			record: number,
			monitorCycle: number,
			monitorAccount: number,
			team: number,
			teamRecord: number,
		},
		gradeConfig: {
			orderByPoints: number,
			teamOrderByPoints?: number,
		}
	};

	constructor(grade: {
		id: string;
		name: string;
		delete: number;
		gradeInfo: {
			groupList: Group[];
			studentList: Student[];
			studentGroupList: StudentGroup[];
			recordList: RuleRecord[];
			monitorCycleList?: MonitorCycle[];
			monitorAccountList?: MonitorAccount[];
			teamList?: Team[];
			teamRecordList?: TeamRecord[];
			indexMap: {
				group: number,
				student: number,
				record: number,
				monitorCycle?: number,
				monitorAccount?: number,
				team?: number,
				teamRecord?: number,
			},
			gradeConfig: {
				orderByPoints: number,
				teamOrderByPoints?: number,
			},
		};
	}) {
		this.id = grade.id;
		this.name = grade.name;
		this.delete = grade.delete;
		// 兼容旧数据：班委周期/独立分组字段缺失时补默认值
		this.gradeInfo = {
			...grade.gradeInfo,
			monitorCycleList: grade.gradeInfo.monitorCycleList || [],
			monitorAccountList: grade.gradeInfo.monitorAccountList || [],
			teamList: grade.gradeInfo.teamList || [],
			teamRecordList: grade.gradeInfo.teamRecordList || [],
			indexMap: {
				...grade.gradeInfo.indexMap,
				monitorCycle: grade.gradeInfo.indexMap.monitorCycle ?? 0,
				monitorAccount: grade.gradeInfo.indexMap.monitorAccount ?? 0,
				team: grade.gradeInfo.indexMap.team ?? 0,
				teamRecord: grade.gradeInfo.indexMap.teamRecord ?? 0,
			},
		};
	}
	toJSON() {
		return {
			id: this.id,
			name: this.name,
			delete: this.delete,
			gradeInfo: this.gradeInfo,
		};
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}
