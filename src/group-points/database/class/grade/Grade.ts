import { Group } from './Group';
import { Student } from './Student';
import { StudentGroup } from './StudentGroup';

export class Grade {
	id: number;
	name: string;
	gradeInfo: {
		groupList: Group[];
		studentList: Student[];
		studentGroupList: StudentGroup[];
	};

	constructor(grade: {
		id: number;
		name: string;
		gradeInfo: {
			groupList: Group[];
			studentList: Student[];
			studentGroupList: StudentGroup[];
		};
	}) {
		this.id = grade.id;
		this.name = grade.name;
		this.gradeInfo = grade.gradeInfo;
	}
	toJSON() {
		return {
			id: this.id,
			name: this.name,
			gradeInfo: this.gradeInfo,
		};
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}
