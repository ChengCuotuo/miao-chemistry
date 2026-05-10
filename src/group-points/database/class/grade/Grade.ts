import { Group } from './Group';
import { PrizeRecord } from './PrizeRecord';
import { Student } from './Student';
import { StudentGroup } from './StudentGroup';

export class Grade {
	id: string;
	name: string;
	delete: number; // 是否删除标记
	gradeInfo: {
		groupList: Group[];
		studentList: Student[];
		studentGroupList: StudentGroup[];
		recordList: PrizeRecord[];
	};

	constructor(grade: {
		id: string;
		name: string;
		delete: number;
		gradeInfo: {
			groupList: Group[];
			studentList: Student[];
			studentGroupList: StudentGroup[];
			recordList: PrizeRecord[];
		};
	}) {
		this.id = grade.id;
		this.name = grade.name;
		this.delete = grade.delete;
		this.gradeInfo = grade.gradeInfo;
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
