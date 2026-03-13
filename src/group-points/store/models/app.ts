import { defineStore } from "pinia";
import { DatabaseInfoType } from "../../database";

interface AppState {
	isCollapse: boolean,
	database: DatabaseInfoType,
}

export const useAppStore = defineStore('app', {
	state: (): AppState => ({
		isCollapse: false,
		database: {
			gradeList: [],
			ruleList: [],
			prizeList: [],
			recordList: [],
		},
	}),
	getters: {
		getIsCollapse: (state: AppState) => state.isCollapse,
		getDatabase: (state: AppState) => state.database,
	},
	actions: {
		setIsCollapse(isCollapse: boolean) {
			this.isCollapse = isCollapse;
		},
		setDatabase(database: DatabaseInfoType) {
			this.database = database;
		}
	}
})