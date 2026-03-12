<template>
	<div style="height: 100%; width: 100%; padding: 10px; display: flex; flex-direction: column; align-items: center;">
		<div :style="{ width: `${widthRef}px` }" style="display: flex; justify-content: space-between;">
			<el-space>
				<div style="min-width: 80px;">计时: {{ timeCount }}s</div>
				<div style="min-width: 80px;">步骤: {{ moveCount }}</div>
			</el-space>
			<el-space>
				<el-button type="default" style="background-color: #72dcf6; color: #fff;" :icon="Back" circle />
				<el-button type="default" style="background-color: #72dcf6; color: #fff;" :icon="Right" circle />
			</el-space>
		</div>
		<div style="border: 1px solid #72dcf6; ">
			<BoxMain ref="boxMainRef" :gameIndex="gameIndex" :onMove="onMove" :onSuccess="onSuccess" :updateWidth="updateWidth"/>
		</div>
	</div>
</template>

<script setup lang="ts">
import {
	Back,
	Right
} from '@element-plus/icons-vue'
import BoxMain from './BoxMain.vue';
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus'

const boxMainRef = ref<typeof BoxMain>();
const gameIndex = ref(0);
const widthRef = ref(0);

const moveCount = ref(0);
const timeCount = ref(0);
const timerRef = ref();

const startTimeCount = () => {
  timeCount.value = 0;
  timerRef.value = setInterval(() => {
    timeCount.value += 1;
  }, 1000);
}

const updateWidth = (width: number) => {
  widthRef.value = width;
}

const onMove = (count: number) => {
  moveCount.value = count;
}

const onSuccess = () => {
	clearInterval(timerRef.value);
  ElMessage.success('恭喜你，游戏完成！');
	gameIndex.value += 1;
	boxMainRef.value?.startGame(gameIndex.value);
	startTimeCount();
}

onMounted(() => {
  startTimeCount();
  boxMainRef.value?.startGame(gameIndex.value);
});
</script>

<style lang="scss" scoped></style>