import { saveGradeInfo } from "..";
import { useAppStore } from "../../store/models/app";
import { MonitorAccount } from "../class";
import { usePermission } from "./usePermission";
import md5 from 'blueimp-md5';

// 班委账号：管理班级维度下的班委账号，校验登录
// 账号登录后为「只读 + 按授权可见模块」身份，因此账号的增删改属于写操作（班委会话下禁止）
export const useMonitorAccount = () => {
	const appStore = useAppStore();
	const { writeDeniedMessage } = usePermission();

	// 获取当前班级班委账号列表
	const getMonitorAccountList = () => {
		return appStore.activeGrade?.gradeInfo?.monitorAccountList || [];
	}

	// 按 id 取账号
	const getMonitorAccountById = (id: string) => {
		return getMonitorAccountList().find(item => item.id === id);
	}

	// 新增班委账号（visibleTabs 不传时按默认「仅学生管理」）
	const createMonitorAccount = async (name: string, password: string, visibleTabs?: string[]) => {
		const denied = writeDeniedMessage();
		if (denied) return { success: false, message: denied };
		try {
			if (!appStore.activeGrade) return { success: false, message: '暂无班级信息' };
			const list = appStore.activeGrade.gradeInfo.monitorAccountList;
			if (list.some(item => item.name === name)) {
				return { success: false, message: '账号名已存在' };
			}
			const index = appStore.activeGrade.gradeInfo.indexMap.monitorAccount ?? 0;
			const account = new MonitorAccount({ id: `${index}`, name, password: md5(password), visibleTabs });
			list.push(account);
			appStore.activeGrade.gradeInfo.indexMap.monitorAccount = index + 1;
			await saveGradeInfo(appStore.activeGrade.id, JSON.stringify(appStore.activeGrade));
			return { success: true, message: '账号已创建' };
		} catch (error) {
			console.error('创建班委账号出错:', error);
			return { success: false, message: '操作失败，请重试' };
		}
	}

	// 修改班委账号信息（账号名 / 可见模块），密码不在这里改
	const updateMonitorAccount = async (id: string, patch: { name?: string, visibleTabs?: string[] }) => {
		const denied = writeDeniedMessage();
		if (denied) return { success: false, message: denied };
		try {
			if (!appStore.activeGrade) return { success: false, message: '暂无班级信息' };
			const account = getMonitorAccountById(id);
			if (!account) return { success: false, message: '账号不存在' };
			if (patch.name !== undefined) {
				const name = patch.name.trim();
				if (!name) return { success: false, message: '账号名不能为空' };
				const duplicated = getMonitorAccountList().some(item => item.id !== id && item.name === name);
				if (duplicated) return { success: false, message: '账号名已存在' };
				account.name = name;
			}
			if (patch.visibleTabs !== undefined) {
				// 走一次规范化：过滤非法模块 key；空数组按默认「仅学生管理」处理
				account.visibleTabs = new MonitorAccount({
					id: account.id, name: account.name, password: account.password, visibleTabs: patch.visibleTabs,
				}).visibleTabs;
			}
			await saveGradeInfo(appStore.activeGrade.id, JSON.stringify(appStore.activeGrade));
			return { success: true, message: '账号已更新' };
		} catch (error) {
			console.error('更新班委账号出错:', error);
			return { success: false, message: '操作失败，请重试' };
		}
	}

	// 修改班委账号密码（管理员重置）
	const updateMonitorAccountPassword = async (id: string, password: string) => {
		const denied = writeDeniedMessage();
		if (denied) return { success: false, message: denied };
		try {
			if (!appStore.activeGrade) return { success: false, message: '暂无班级信息' };
			const account = getMonitorAccountById(id);
			if (!account) return { success: false, message: '账号不存在' };
			account.password = md5(password);
			await saveGradeInfo(appStore.activeGrade.id, JSON.stringify(appStore.activeGrade));
			return { success: true, message: '密码已更新' };
		} catch (error) {
			console.error('更新班委账号出错:', error);
			return { success: false, message: '操作失败，请重试' };
		}
	}

	// 删除班委账号
	const deleteMonitorAccount = async (id: string) => {
		const denied = writeDeniedMessage();
		if (denied) return { success: false, message: denied };
		try {
			if (!appStore.activeGrade) return { success: false, message: '暂无班级信息' };
			appStore.activeGrade.gradeInfo.monitorAccountList = appStore.activeGrade.gradeInfo.monitorAccountList.filter(item => item.id !== id);
			await saveGradeInfo(appStore.activeGrade.id, JSON.stringify(appStore.activeGrade));
			// 删除的正是当前登录账号：会话立即失效，退出到锁屏（避免已删账号继续访问）
			appStore.exitMonitorSessionIfCurrent(id);
			return { success: true, message: '账号已删除' };
		} catch (error) {
			console.error('删除班委账号出错:', error);
			return { success: false, message: '操作失败，请重试' };
		}
	}

	// 校验班委账号（登录）
	const verifyMonitorAccount = (name: string, password: string) => {
		if (!appStore.activeGrade) return { success: false, message: '暂无班级信息' };
		const account = appStore.activeGrade.gradeInfo.monitorAccountList.find(item => item.name === name);
		if (!account) return { success: false, message: '账号不存在' };
		if (account.password !== md5(password)) return { success: false, message: '密码错误' };
		return { success: true, message: '', account };
	}

	return {
		getMonitorAccountList,
		getMonitorAccountById,
		createMonitorAccount,
		updateMonitorAccount,
		updateMonitorAccountPassword,
		deleteMonitorAccount,
		verifyMonitorAccount,
	}
}
