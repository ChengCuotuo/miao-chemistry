import { defineStore } from "pinia";
import { DatabaseInfoType } from "../../database";

interface AppState {
	isCollapse: boolean,
	database: DatabaseInfoType,
	activeGrade?: DatabaseInfoType['gradeList'][0],
	// 当前进入班级的角色：teacher 管理员 / monitor 班委（登录后权限与管理员一致，仅用于身份标识）
	currentRole: 'teacher' | 'monitor',
	// 当前登录的班委账号（角色为 monitor 时有值，用于身份标识与记录留痕）
	currentMonitor?: { id: string, name: string },
	// 班委退出登录信号：置 true 后 App.vue 切回锁屏并复位
	needLock: boolean,
}

export const useAppStore = defineStore('app', {
	state: (): AppState => ({
		isCollapse: false,
		database: {
			gradeList: [],
			ruleList: [],
			ruleGroupList: [],
			prizeList: [],
			basicConfig: {} as DatabaseInfoType['basicConfig'],
			password: '',
		},
		activeGrade: undefined,
		currentRole: 'teacher',
		currentMonitor: undefined,
		needLock: false,
	}),
	getters: {
		getIsCollapse: (state: AppState) => state.isCollapse,
		getDatabase: (state: AppState) => state.database,
		getActiveGrade: (state: AppState) => state.activeGrade,
	},
	actions: {
		setIsCollapse(isCollapse: boolean) {
			this.isCollapse = isCollapse;
		},
		setDatabase(database: DatabaseInfoType) {
			this.database = database;
		},
		setActiveGrade(activeGrade?: DatabaseInfoType['gradeList'][0]) {
			this.activeGrade = activeGrade;
		},
		setCurrentRole(role: 'teacher' | 'monitor') {
			this.currentRole = role;
		},
		// 以管理员身份进入班级（清空班委会话残留，避免记录人误标）
		enterTeacherSession() {
			this.currentRole = 'teacher';
			this.currentMonitor = undefined;
		},
		// 退出班级会话并回到锁屏（班委退出登录 / 账号被删 / 班委账号被关闭时使用）
		exitSession() {
			this.currentRole = 'teacher';
			this.currentMonitor = undefined;
			this.activeGrade = undefined;
			this.isCollapse = false;
			this.needLock = true;
		},
		// 会话失效检查：当前正是班委会话时退出到锁屏
		// accountId 为空表示「班委账号被整体关闭」；传入时仅当删除的是当前登录账号才退出
		exitMonitorSessionIfCurrent(accountId?: string) {
			if (this.currentRole !== 'monitor') return false;
			if (accountId && this.currentMonitor?.id !== accountId) return false;
			this.exitSession();
			return true;
		},
		setCurrentMonitor(monitor?: { id: string, name: string }) {
			this.currentMonitor = monitor;
		},
		setNeedLock(needLock: boolean) {
			this.needLock = needLock;
		},
	}
})
