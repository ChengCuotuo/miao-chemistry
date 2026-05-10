import { defineStore } from "pinia";
import { DatabaseInfoType } from "../../database";

interface AppState {
	isCollapse: boolean,
	database: DatabaseInfoType,
	activeGrade?: DatabaseInfoType['gradeList'][0],
}

export const useAppStore = defineStore('app', {
	state: (): AppState => ({
		isCollapse: false,
		database: {
			gradeList: [],
			ruleList: [],
			prizeList: [],
		},
		activeGrade: {} as DatabaseInfoType['gradeList'][0],
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
	}
})