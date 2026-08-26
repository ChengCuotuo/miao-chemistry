// - 独立分组积分记录 - team record
//   - id - id（使用 indexMap.teamRecord 自增序号）
//   - 小组id - team_id
//   - 规则id - rule_id
//   - 积分变化 - points：小组整体的加减分
//   - 记录时间 - time
//   - 来源 - source：0-普通 1-周期记录
//   - 周期id - cycle_id：source=1 时有效，记录属于哪个周期
//   - 单次次数 - count：本次记录消耗的次数（同规则多次时 > 1）

export class TeamRecord {
	id: number;
	team_id: string;
	rule_id: string;
	points: number;
	time: string;
	source: number;
	cycle_id: string;
	count: number;

	constructor(params: { id: number, team_id: string, rule_id?: string, points?: number, time: string, source?: number, cycle_id?: string, count?: number }) {
		this.id = params.id;
		this.team_id = params.team_id;
		this.rule_id = params?.rule_id || '';
		this.points = params?.points || 0;
		this.time = params.time;
		this.source = params?.source ?? 0;
		this.cycle_id = params?.cycle_id || '';
		this.count = params?.count ?? 1;
	}

	toJSON() {
		return {
			id: this.id,
			team_id: this.team_id,
			rule_id: this.rule_id,
			points: this.points,
			time: this.time,
			source: this.source,
			cycle_id: this.cycle_id,
			count: this.count,
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}
