<template>
	<div class="group-list-container">
		GroupList
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '../../../store/models/app';
const appStore = useAppStore();

const activeGrade = computed(() => appStore.activeGrade);
const groupIndex = computed(() => activeGrade.value?.gradeInfo?.indexMap?.group || 0);
const groupList = computed(() => activeGrade.value?.gradeInfo?.groupList || []);

</script>

<style scoped>
.group-list-container {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	flex-wrap: wrap;
}
</style>