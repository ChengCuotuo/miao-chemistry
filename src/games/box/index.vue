<template>
	<div style="height: 100%; width: 100%; padding: 10px; display: flex; flex-direction: column; align-items: center;">
		<div :style="{ width: `${widthRef}px` }" style="display: flex; justify-content: space-between;">
			<span></span>
			<el-space>
				<el-button type="default" style="background-color: #72dcf6; color: #fff;" :icon="Back" circle />
				<el-button type="default" style="background-color: #72dcf6; color: #fff;" :icon="Right" circle />
			</el-space>
		</div>
		<div style="border: 1px solid #72dcf6; ">
			<BoxMain ref="boxMainRef" :gameIndex="gameIndex" :onSuccess="onSuccess" :updateWidth="updateWidth"/>
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
const updateWidth = (width: number) => {
  widthRef.value = width;
}

const onSuccess = () => {
  ElMessage.success('恭喜你，游戏完成！');
	gameIndex.value += 1;
	boxMainRef.value?.startGame(gameIndex.value);
}

onMounted(() => {
  boxMainRef.value?.startGame(gameIndex.value);
});
</script>

<style lang="scss" scoped></style>