import { defineStore } from "pinia";

interface AppState {
	isCollapse: boolean,
}

export const useAppStore = defineStore('app', {
	state: (): AppState => ({
		isCollapse: false,
	}),
	getters: {
		getIsCollapse: (state: AppState) => state.isCollapse,
	},
	actions: {
		setIsCollapse(isCollapse: boolean) {
			this.isCollapse = isCollapse;
		}
	}
})