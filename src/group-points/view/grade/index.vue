<template>
	<div class="grade-container">
		<div class="header-content">
			<div><el-button type="primary" :icon="Back" circle @click="handleBack"></el-button></div>
			<div style="font-size: 16px; font-weight: bold;">{{ activeGrade?.name }}</div>
			<div></div>
		</div>
		<el-divider border-style="dashed" style="margin: 10px 0;" />
		<div class="main-content">
			<el-tabs v-model="activeName">
				<el-tab-pane v-if="moduleVisibility.groupManage" label="分组管理" name="group"/>
				<el-tab-pane label="学生管理" name="student"/>
				<el-tab-pane v-if="moduleVisibility.pointsManage" label="积分记录" name="record"/>
				<el-tab-pane v-if="moduleVisibility.pointsExchange" label="积分兑换" name="lottery"/>
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
			<div v-if="activeName === 'record'" class="info-container">
				<RecordList></RecordList>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAppStore } from '../../store/models/app';
import { Back } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import StudentList from './StudentList/index.vue';
import GroupList from './GroupList/index.vue';
import LotteryDraw from './LotteryDraw/index.vue';
import RecordList from './RecordList/index.vue';

const router = useRouter();
const appStore = useAppStore();
const activeGrade = computed(() => appStore.activeGrade);

// 模块可见性配置（默认全部展示，兼容旧数据）
const moduleVisibility = computed(() => appStore.database.basicConfig?.moduleVisibility || {
	groupManage: true,
	pointsManage: true,
	pointsExchange: true,
});

// 按可见性取第一个可用 tab
const getFirstVisibleName = () => {
	if (moduleVisibility.value.groupManage) return 'group';
	if (moduleVisibility.value.pointsManage) return 'record';
	if (moduleVisibility.value.pointsExchange) return 'lottery';
	return 'student';
};

const activeName = ref(getFirstVisibleName());

// 配置变化时，若当前 tab 已被隐藏，自动切到第一个可见 tab
watch(() => appStore.database.basicConfig?.moduleVisibility, () => {
	const name = activeName.value;
	if ((name === 'group' && !moduleVisibility.value.groupManage) ||
		(name === 'student' && !moduleVisibility.value.pointsManage) ||
		(name === 'lottery' && !moduleVisibility.value.pointsExchange)) {
		activeName.value = getFirstVisibleName();
	}
}, { deep: true });

const handleBack = () => {
	appStore.setIsCollapse(false);
	router.back();
}

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
	overflow: hidden;

	display: flex;
	flex-direction: column;
}

.info-container {
	position: relative;
	flex: 1 1;
	overflow: hidden;
}
</style>