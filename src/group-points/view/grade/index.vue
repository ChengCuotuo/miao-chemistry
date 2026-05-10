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
				<el-tab-pane label="分组管理" name="group">分组管理</el-tab-pane>
				<el-tab-pane label="学生管理" name="student">学生管理</el-tab-pane>
			</el-tabs>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAppStore } from '../../store/models/app';
import { Back } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { TabsPaneContext } from 'element-plus';

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
}

.header-content {
	display: flex;
	align-items: center;
	justify-content: space-between;
}
</style>