import { computed } from "vue";
import { useAppStore } from "../../store/models/app";
import { useGrade } from "./useGrade";

// 默认班级：开启后，软件启动 / 锁屏点击进入都直接进入该班级的班委页面（只读身份）
// 生效条件：班委账号已启用 + 默认班级开关开启 + 所选班级仍然存在（未删除）
export const useDefaultGrade = () => {
	const appStore = useAppStore();
	const { getGradeInfoById } = useGrade();

	// 可作为默认班级的班级（未删除）
	const selectableGrades = computed(() =>
		(appStore.database.gradeList || []).filter(item => item.delete === 0),
	);

	// 默认班级功能当前是否真正生效
	const defaultGradeEnabled = computed(() => {
		const basic = appStore.database.basicConfig;
		if (!basic || basic.monitorAccountEnabled === false) return false;
		if (!basic.defaultGradeEnabled) return false;
		return selectableGrades.value.some(item => item.id === basic.defaultGradeId);
	});

	const defaultGrade = computed(() =>
		selectableGrades.value.find(item => item.id === appStore.database.basicConfig?.defaultGradeId),
	);

	// 指定班级将使用的班委账号（取该班第一个账号；用于设置页提示）
	const resolveDefaultAccount = async (gradeId: string) => {
		if (!gradeId) return undefined;
		const gradeInfo = await getGradeInfoById(gradeId);
		return (gradeInfo?.gradeInfo?.monitorAccountList || [])[0];
	};

	// 进入默认班级的班委会话；成功返回 true（未开启 / 班级无效时返回 false，由调用方继续走原登录流程）
	// 账号策略：优先使用该班第一个班委账号（决定可见模块与记录留痕）；该班无账号时按默认可见模块进入
	const enterDefaultGradeSession = async (): Promise<boolean> => {
		if (!defaultGradeEnabled.value) return false;
		const grade = defaultGrade.value;
		if (!grade) return false;
		const gradeInfo = await getGradeInfoById(grade.id);
		if (!gradeInfo) return false;
		appStore.setActiveGrade(gradeInfo);
		appStore.setCurrentRole('monitor');
		const account = (gradeInfo.gradeInfo?.monitorAccountList || [])[0];
		appStore.setCurrentMonitor(account ? { id: account.id, name: account.name } : undefined);
		appStore.setIsCollapse(true);
		return true;
	};

	return {
		selectableGrades,
		defaultGradeEnabled,
		defaultGrade,
		resolveDefaultAccount,
		enterDefaultGradeSession,
	};
};
