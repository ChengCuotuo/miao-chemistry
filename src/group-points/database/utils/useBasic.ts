import { appendBasicConfig } from "..";
import { useAppStore } from "../../store/models/app";
import { Basic } from "../class";

export const useBasic = () => {
	const appStore = useAppStore();

	const updateBasicConfig = async (config: Basic) => {
		appStore.database.basicConfig = config
		await appendBasicConfig(JSON.stringify(appStore.database.basicConfig));
	}

	return {
		updateBasicConfig
	}
}