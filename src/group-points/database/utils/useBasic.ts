import { appendBasicConfig } from "..";
import { useAppStore } from "../../store/models/app";

export const useBasic = () => {
	const appStore = useAppStore();

	const updateBasicConfig = async (step: number) => {
		appStore.database.basicConfig.step = step
		await appendBasicConfig(JSON.stringify(appStore.database.basicConfig));
	}

	return {
		updateBasicConfig
	}
}