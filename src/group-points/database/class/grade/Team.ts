// - 独立分组 - team
//   - id - id（使用 indexMap.team 自增序号）
//   - 名称 - name
//   - 排序 - order
//   - 小组分数 - points：独立于组内成员，整体增减不影响组内成员分数
//   - 成员id列表 - memberIdList：仅用于展示分组构成，不参与分数计算

export class Team {
	id: string;
	name: string;
	order: number;
	points: number;
	memberIdList: string[];

	constructor(params: { id: string, name: string, order: number, points?: number, memberIdList?: string[] }) {
		this.id = params.id;
		this.name = params.name;
		this.order = params.order;
		this.points = params?.points ?? 0;
		this.memberIdList = params?.memberIdList ?? [];
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			order: this.order,
			points: this.points,
			memberIdList: this.memberIdList,
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}
