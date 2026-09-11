// - 规则设置 - rule
//   - id - id
//   - 规则名称 - name
//   - 规则描述 - description
//   - 积分值 - points：number 为固定分值；null 表示「自定义分值规则」（使用时再指定分值）
//   - 适用班级 - allow_grades：空数组表示所有班级通用
//   - 所属分组 - group_id：树形结构第一层分组 id
//   - 排序 - order：分组内排序

export class Rule {
	id: string;
	name: string;
	description: string;
	points: number | null;
	allow_grades: string[];
	group_id: string;
	order: number;

	constructor(params: { id: string, name: string, description?: string, points?: number | null, allow_grades?: string[], group_id?: string, order?: number }) {
		this.id = params.id;
		this.name = params.name;
		this.description = params.description ?? '';
		// null / undefined 均视为自定义分值规则；其余转为数字
		this.points = (params.points === null || params.points === undefined) ? null : Number(params.points);
		this.allow_grades = params.allow_grades ?? [];
		this.group_id = params.group_id ?? '';
		this.order = params.order ?? 0;
	}

	// 是否为自定义分值规则（使用时必须指定分值才生效）
	get isNoPoints(): boolean {
		return this.points === null || this.points === undefined;
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			points: this.points,
			allow_grades: this.allow_grades,
			group_id: this.group_id,
			order: this.order,
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}
