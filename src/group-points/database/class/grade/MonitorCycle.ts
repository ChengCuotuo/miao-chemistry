// - 周期记分周期 - monitor cycle
//   - id - id（使用 indexMap.monitorCycle 自增序号）
//   - 周期名称 - name，如：第一周、第二周
//   - 状态 - status：0-进行中 1-已结束
//   - 开始时间 - startTime：YYYY-MM-DD，空表示未设置
//   - 结束时间 - endTime：YYYY-MM-DD，空表示未设置
//   - limit 已废弃：次数上限控制已取消，仅保留字段兼容旧数据

export class MonitorCycle {
	id: string;
	name: string;
	status: number;
	startTime: string;
	endTime: string;
	limit: number;

	constructor(params: { id: string, name: string, status?: number, startTime?: string, endTime?: string, limit?: number }) {
		this.id = params.id;
		this.name = params.name;
		this.status = params?.status ?? 0;
		this.startTime = params?.startTime || '';
		this.endTime = params?.endTime || '';
		this.limit = params?.limit ?? -1;
	}
	toJSON() {
		return {
			id: this.id,
			name: this.name,
			status: this.status,
			startTime: this.startTime,
			endTime: this.endTime,
			limit: this.limit,
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}
