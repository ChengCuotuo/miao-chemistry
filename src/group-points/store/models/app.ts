import { defineStore } from "pinia";
import { DatabaseInfoType } from "../../database";

interface AppState {
	isCollapse: boolean,
	database: DatabaseInfoType,
	activeGrade?: DatabaseInfoType['gradeList'][0],
	// 当前进入班级的角色：teacher 教师（完整权限）/ monitor 班委（仅记分）
	currentRole: 'teacher' | 'monitor',
	// 当前登录的班委账号（角色为 monitor 时有值，用于记录提交人）
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
		setCurrentMonitor(monitor?: { id: string, name: string }) {
			this.currentMonitor = monitor;
		},
		setNeedLock(needLock: boolean) {
			this.needLock = needLock;
		},
	}
})
