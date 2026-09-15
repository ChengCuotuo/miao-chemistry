import { useAppStore } from "../../store/models/app";
import { getAccountVisibleTabs } from "../class";

// 班委账号的权限判定与「只读」闸门
// 说明：这是本地桌面应用，权限用于防止误操作/误删，不作为安全边界（运行时仍可被调试工具绕过）
export const usePermission = () => {
	const appStore = useAppStore();

	// 当前是否为班委会话（班委登录后为只读身份）
	const isMonitorSession = () => appStore.currentRole === 'monitor';

	// 当前会话是否只读
	const isReadOnlySession = () => isMonitorSession();

	// 写操作闸门：只读会话下返回提示文案，可写时返回 null（各写函数入口统一调用）
	const writeDeniedMessage = () => isReadOnlySession() ? '班委账号为只读权限，无法执行该操作' : null;

	// 当前班委会话被授权的可见模块；管理员返回 null 表示不受账号授权限制
	const currentMonitorTabs = (): string[] | null => {
		if (!isMonitorSession()) return null;
		const account = (appStore.activeGrade?.gradeInfo?.monitorAccountList || [])
			.find(item => item.id === appStore.currentMonitor?.id);
		return getAccountVisibleTabs(account) as string[];
	};

	// 某个班级页标签对当前会话是否可见
	const canSeeTab = (tab: string) => {
		const tabs = currentMonitorTabs();
		return tabs === null ? true : tabs.includes(tab);
	};

	return {
		isMonitorSession,
		isReadOnlySession,
		writeDeniedMessage,
		currentMonitorTabs,
		canSeeTab,
	}
}
