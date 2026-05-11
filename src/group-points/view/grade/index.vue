<template>
	<div class="grade-container">
		<div class="header-content">
			<div><el-button type="primary" :icon="Back" circle @click="handleBack"></el-button></div>
			<div style="font-size: 16px; font-weight: bold;">{{ activeGrade?.name }}</div>
			<div></div>
		</div>
		<el-divider border-style="dashed" style="margin: 10px 0;" />
		<div class="main-content">
			<el-tabs v-model="activeName" @tab-click="handleClick">
				<el-tab-pane label="分组管理" name="group"/>
				<el-tab-pane label="学生管理" name="student"/>
			</el-tabs>
			<div v-if="activeName === 'student'" class="info-container">
				<StudentList></StudentList>
			</div>
			<div v-if="activeName === 'group'" class="info-container">
				<GroupList></GroupList>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAppStore } from '../../store/models/app';
import { Back } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { TabsPaneContext } from 'element-plus';
import StudentList from './StudentList/index.vue';
import GroupList from './GroupList/index.vue';

const router = useRouter();
const appStore = useAppStore();
const activeGrade = computed(() => appStore.activeGrade);
const activeName = ref('group')

const handleBack = () => {
	appStore.setIsCollapse(false);
	router.back();
}

const handleClick = (tab: TabsPaneContext) => {
	console.log(tab)
}

</script>

<style scoped>
.grade-container {
	height: 100%;
	width: 100%;
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