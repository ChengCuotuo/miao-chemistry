// - 班委账号 - monitor account
//   - id - id（自增序号）
//   - 账号名 - name
//   - 密码 - password（md5 存储）
//   - 可见模块 - visibleTabs：该账号登录后可查看的班级页标签（只读）；缺省按「仅学生管理」处理

// 班委账号可授权的班级页标签：只包含「只读浏览」类模块
// （周期记分 / 积分兑换天生是写操作，不参与授权；全局设置页属于跨班级的全局数据，也不在授权范围）
export const MONITOR_TAB_KEYS = ['student', 'group', 'team', 'record', 'analysis'] as const;
export type MonitorTabKey = typeof MONITOR_TAB_KEYS[number];
// 新建账号的默认授权：仅学生管理
export const DEFAULT_MONITOR_TABS: MonitorTabKey[] = ['student'];
// 可授权模块的展示名
export const MONITOR_TAB_LABELS: Record<MonitorTabKey, string> = {
	student: '学生管理',
	group: '关联分组',
	team: '独立分组',
	record: '积分记录',
	analysis: '数据分析',
};

export class MonitorAccount {
	id: string;
	name: string;
	password: string;
	visibleTabs: MonitorTabKey[];

	constructor(params: { id: string, name: string, password: string, visibleTabs?: string[] }) {
		this.id = params.id;
		this.name = params.name;
		this.password = params.password;
		// 未传（含旧数据）时按默认授权；传了则只保留合法模块 key
		this.visibleTabs = Array.isArray(params.visibleTabs)
			? params.visibleTabs.filter((key): key is MonitorTabKey => (MONITOR_TAB_KEYS as readonly string[]).includes(key))
			: [...DEFAULT_MONITOR_TABS];
	}
	toJSON() {
		return {
			id: this.id,
			name: this.name,
			password: this.password,
			visibleTabs: this.visibleTabs,
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}

// 读取账号的可见模块（兼容旧数据：无 visibleTabs 字段 / 空数组 一律按默认「仅学生管理」）
export const getAccountVisibleTabs = (account?: { visibleTabs?: string[] } | null): MonitorTabKey[] => {
	const list = account?.visibleTabs;
	if (!Array.isArray(list) || list.length === 0) return [...DEFAULT_MONITOR_TABS];
	return list.filter((key): key is MonitorTabKey => (MONITOR_TAB_KEYS as readonly string[]).includes(key));
}
