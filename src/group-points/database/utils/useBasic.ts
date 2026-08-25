import { appendBasicConfig } from "..";
import { useAppStore } from "../../store/models/app";
import { Basic } from "../class";

export const useBasic = () => {
	const appStore = useAppStore();

	const updateBasicConfig = async (config: Basic) => {
		appStore.database.basicConfig = config
		// 规整 moduleOrder：确保持久化为纯字符串数组
		const basic = appStore.database.basicConfig as any;
		if (Array.isArray(basic?.moduleOrder)) {
			basic.moduleOrder = basic.moduleOrder.map((k: any) => String(k));
		}
		await appendBasicConfig(JSON.stringify(appStore.database.basicConfig));
	}

	return {
		updateBasicConfig
	}
}