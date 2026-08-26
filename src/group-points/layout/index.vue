<template>
	<div class="main-container">
		<div class="left" v-if="!isMonitor">
			<Menu style="height: 100%;"></Menu>
		</div>
		<div class="right" :style="rightStyle">
			<div class="content">
				<router-view></router-view>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '../store/models/app';
import Menu from './components/Menu/index.vue'
const appStore = useAppStore();
const isCollapse = computed(() => appStore.isCollapse);
const isMonitor = computed(() => appStore.currentRole === 'monitor');
// 班委角色下左侧菜单隐藏，右侧占满
const rightStyle = computed(() => {
	if (isMonitor.value) return { minWidth: '730px', width: '100%' };
	return { minWidth: '730px', width: isCollapse.value ? 'calc(100% - 64px)' : 'calc(100% - 150px)' };
});
</script>

<style scoped lang="scss">
.main-container {
	position: relative;
	width: 100%;
	height: 100%;
	display: flex;

	.left {
		height: 100%;
	}

	.right {
		height: 100%;

		.header {
			height: 40px;
		}

		.content {
			height: calc(100% - 20px);
			background-color: #f6f7fa;
			padding: 10px;
			overflow-y: auto;
		}
	}
}
</style>