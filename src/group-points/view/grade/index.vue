<template>
	<div class="grade-container">
		<div class="header-content">
			<div>
				<el-button v-if="!isMonitor" type="primary" :icon="Back" circle @click="handleBack"></el-button>
				<el-button v-else type="warning" plain :icon="SwitchButton" @click="handleMonitorLogout">退出登录</el-button>
			</div>
			<div style="font-size: 16px; font-weight: bold;">{{ activeGrade?.name }}<span v-if="isMonitor" class="role-badge">班委</span></div>
			<div></div>
		</div>
		<el-divider border-style="dashed" style="margin: 10px 0;" />
		<div class="main-content">
			<el-tabs v-model="activeName">
				<el-tab-pane v-for="tab in orderedTabs" :key="tab.name" :label="tab.label" :name="tab.name"/>
			</el-tabs>
			<div v-if="activeName === 'student'" class="info-container">
				<StudentList></StudentList>
			</div>
			<div v-if="activeName === 'group'" class="info-container">
				<GroupList></GroupList>
			</div>
			<div v-if="activeName === 'lottery'" class="info-container">
				<LotteryDraw></LotteryDraw>
			</div>
			<div v-if="activeName === 'monitor'" class="info-container">
				<MonitorList></MonitorList>
			</div>
			<div v-if="activeName === 'record'" class="info-container">
				<RecordList></RecordList>
			</div>
			<div v-if="activeName === 'analysis'" class="info-container">
				<AnalysisList></AnalysisList>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAppStore } from '../../store/models/app';
import { Back, SwitchButton } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import StudentList from './StudentList/index.vue';
import GroupList from './GroupList/index.vue';
import LotteryDraw from './LotteryDraw/index.vue';
import RecordList from './RecordList/index.vue';
import MonitorList from './MonitorList/index.vue';
import AnalysisList from './AnalysisList/index.vue';

const router = useRouter();
const appStore = useAppStore();
const activeGrade = computed(() => appStore.activeGrade);

// 模块定义（key 与路由 name 一致）与默认顺序
const TAB_DEFS: Record<string, string> = {
	student: '学生管理',
	group: '分组管理',
	monitor: '周期记分',
	record: '积分记录',
	lottery: '积分兑换',
	analysis: '数据分析',
};
const DEFAULT_TAB_ORDER = ['group', 'student', 'monitor', 'record', 'lottery', 'analysis'];

// 当前角色：班委仅显示「周期记分」tab
const isMonitor = computed(() => appStore.currentRole === 'monitor');

// 各模块可见性
const moduleVisibility = computed(() => appStore.database.basicConfig?.moduleVisibility || {
	groupManage: true,
	pointsManage: true,
	pointsExchange: true,
});
// 各模块可见性统一从 moduleVisibility 读取
const monitorVisible = computed(() => appStore.database.basicConfig?.moduleVisibility?.monitorManage ?? true);
const studentVisible = computed(() => appStore.database.basicConfig?.moduleVisibility?.studentManage ?? true);

const isTabVisible = (name: string): boolean => {
	// 班委角色：仅周期记分 tab 可见
	if (isMonitor.value) return name === 'monitor';
	if (name === 'student') return studentVisible.value;
	if (name === 'monitor') return monitorVisible.value;
	if (name === 'group') return moduleVisibility.value.groupManage;
	if (name === 'record') return moduleVisibility.value.pointsManage;
	if (name === 'lottery') return moduleVisibility.value.pointsExchange;
	if (name === 'analysis') return moduleVisibility.value.analysisManage ?? true;
	return true;
};

// 按 moduleOrder 排序后的可见 tab 列表
const orderedTabs = computed(() => {
	const saved = appStore.database.basicConfig?.moduleOrder;
	const order: string[] = Array.isArray(saved)
		? saved.filter((k: string) => TAB_DEFS[k])
		: DEFAULT_TAB_ORDER;
	// 补齐缺失模块
	const missing = DEFAULT_TAB_ORDER.filter(k => !order.includes(k));
	return [...order, ...missing]
		.filter(name => isTabVisible(name))
		.map(name => ({ name, label: TAB_DEFS[name] }));
});

// 按可见性取第一个可用 tab
const getFirstVisibleName = () => {
	return orderedTabs.value[0]?.name || 'student';
};

const activeName = ref(getFirstVisibleName());

// 配置变化时，若当前 tab 已被隐藏，自动切到第一个可见 tab
watch(() => [appStore.database.basicConfig?.moduleVisibility, appStore.database.basicConfig?.moduleOrder], () => {
	const name = activeName.value;
	if (!orderedTabs.value.some(tab => tab.name === name)) {
		activeName.value = getFirstVisibleName();
	}
}, { deep: true });

const handleBack = () => {
	appStore.setIsCollapse(false);
	appStore.setCurrentRole('teacher');
	router.back();
}

// 班委退出登录：回锁屏
const handleMonitorLogout = () => {
	ElMessageBox.confirm('确认退出班委登录？', '退出登录', {
		type: 'warning', confirmButtonText: '退出', cancelButtonText: '取消',
	}).then(() => {
		appStore.setCurrentRole('teacher');
		appStore.setActiveGrade(undefined);
		appStore.setIsCollapse(false);
		appStore.setNeedLock(true);
	}).catch(() => { });
};

</script>

<style scoped>
.grade-container {
	height: calc(100% - 20px);
	width: calc(100% - 20px);
	background-color: #fff;
	padding: 10px;

	display: flex;
	flex-direction: column;
}

.header-content {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.main-content {
	flex: 1 1;
	min-height: 0;
	overflow: hidden;

	display: flex;
	flex-direction: column;
}

.info-container {
	position: relative;
	flex: 1 1;
	min-height: 0;
	overflow: hidden;
}

.role-badge {
	margin-left: 8px;
	font-size: 12px;
	color: #67c23a;
	border: 1px solid #67c23a;
	border-radius: 4px;
	padding: 1px 6px;
}
</style>