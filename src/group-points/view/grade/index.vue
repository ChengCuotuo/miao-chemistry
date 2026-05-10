<template>
	<div class="grade-container">
		<div class="header-content">
			<div><el-button type="primary" :icon="Back" circle @click="handleBack"></el-button></div>
			<div style="font-size: 16px; font-weight: bold;">{{ activeGrade?.name }}</div>
			<div></div>
		</div>
		<el-divider border-style="dashed" style="margin: 10px 0;" />
		<div class="main-content">
			
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '../../store/models/app';
import { Back } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const appStore = useAppStore();
const activeGrade = computed(() => appStore.activeGrade);

const handleBack = () => {
	appStore.setIsCollapse(false);
	router.back();
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