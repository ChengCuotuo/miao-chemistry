import { saveGradeInfo } from "..";
import { useAppStore } from "../../store/models/app";
import { MonitorAccount } from "../class";
import md5 from 'blueimp-md5';

// 班委账号：管理班级维度下的班委账号，校验登录
export const useMonitorAccount = () => {
	const appStore = useAppStore();

	// 获取当前班级班委账号列表
	const getMonitorAccountList = () => {
		return appStore.activeGrade?.gradeInfo?.monitorAccountList || [];
	}

	// 新增班委账号
	const createMonitorAccount = async (name: string, password: string) => {
		try {
			if (!appStore.activeGrade) return { success: false, message: '暂无班级信息' };
			const list = appStore.activeGrade.gradeInfo.monitorAccountList;
			if (list.some(item => item.name === name)) {
				return { success: false, message: '账号名已存在' };
			}
			const index = appStore.activeGrade.gradeInfo.indexMap.monitorAccount ?? 0;
			const account = new MonitorAccount({ id: `${index}`, name, password: md5(password) });
			list.push(account);
			appStore.activeGrade.gradeInfo.indexMap.monitorAccount = index + 1;
			await saveGradeInfo(appStore.activeGrade.id, JSON.stringify(appStore.activeGrade));
			return { success: true, message: '账号已创建' };
		} catch (error) {
			console.error('创建班委账号出错:', error);
			return { success: false, message: '操作失败，请重试' };
		}
	}

	// 修改班委账号密码
	const updateMonitorAccountPassword = async (id: string, password: string) => {
		try {
			if (!appStore.activeGrade) return { success: false, message: '暂无班级信息' };
			const account = appStore.activeGrade.gradeInfo.monitorAccountList.find(item => item.id === id);
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
		try {
			if (!appStore.activeGrade) return { success: false, message: '暂无班级信息' };
			appStore.activeGrade.gradeInfo.monitorAccountList = appStore.activeGrade.gradeInfo.monitorAccountList.filter(item => item.id !== id);
			await saveGradeInfo(appStore.activeGrade.id, JSON.stringify(appStore.activeGrade));
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
		createMonitorAccount,
		updateMonitorAccountPassword,
		deleteMonitorAccount,
		verifyMonitorAccount,
	}
}
