<template>
	<div style="height: 100%; width: 100%; padding: 10px; display: flex; flex-direction: column; align-items: center;">
		<div :style="{ width: `${widthRef}px` }" style="display: flex; justify-content: space-between;">
			<el-space>
				<div style="min-width: 80px;">计时: {{ timeCount }}s</div>
				<div style="min-width: 80px;">步骤: {{ moveCount }}</div>
			</el-space>
			<el-space>
				<span>第</span>
				<span>{{ gameIndex + 1 }} / {{ gameInfo.length }}</span>
				<span>关</span>
			</el-space>
			<el-space>
				<el-button type="default" style="background-color: #72dcf6; color: #fff;" :icon="Refresh" circle
					@click="onRefresh" />
				<el-button type="default" style="background-color: #72dcf6; color: #fff;" :icon="Back" circle @click="handlePrevious" />
				<el-button type="default" style="background-color: #72dcf6; color: #fff;" :icon="Right" circle @click="handleNext" />
			</el-space>
		</div>
		<div style="border: 1px solid #72dcf6; margin-top: 10px;">
			<BoxMain ref="boxMainRef" :gameIndex="gameIndex" :onMove="onMove" :onSuccess="onSuccess"
				:updateWidth="updateWidth" />
		</div>
	</div>
	<el-dialog v-model="dialogVisible" title="" width="500" 
		:show-close="false" 
		:close-on-click-modal="false"
		:close-on-press-escape="false"
	>
		<span style="font-size: 18px; color: #7ec050;">
			太棒了！恭喜你顺利通关，完成本关挑战！
		</span>
		<template #footer>
			<div class="dialog-footer">
				<el-button type="primary" :icon="Refresh" @click="onRefresh">重玩本关</el-button>
				<el-button type="success" :icon="Right" @click="handleNext">下一关</el-button>
			</div>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import {
	Back,
	Right,
	Refresh
} from '@element-plus/icons-vue'
import BoxMain from './BoxMain.vue';
import { onMounted, ref } from 'vue';
import { gameInfo } from './config';

const boxMainRef = ref<typeof BoxMain>();

const gameIndex = ref(0); // 当前游戏关卡
const widthRef = ref(0); // 游戏宽度

const moveCount = ref(0); // 步数
const timeCount = ref(0); // 时间
const timerRef = ref(); // 定时器

const dialogVisible = ref(false); // 弹窗是否显示

const startTimeCount = () => {
	clearInterval(timerRef.value);
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

const onRefresh = () => {
	dialogVisible.value = false;
	boxMainRef.value?.startGame(gameIndex.value);
	startTimeCount();
}

const onSuccess = () => {
	clearInterval(timerRef.value);
	dialogVisible.value = true;
}

const handlePrevious = () => {
	if(gameIndex.value <= 0) return;

	dialogVisible.value = false;
	gameIndex.value -= 1;
	boxMainRef.value?.startGame(gameIndex.value);
	startTimeCount();
}

const handleNext = () => {
	if(gameIndex.value >= gameInfo.length - 1) return;
	dialogVisible.value = false;
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