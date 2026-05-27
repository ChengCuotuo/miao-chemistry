<template>
	<div class="global-setting-container">
		<el-row>
			<el-col :span="24">
				<el-space>
					<span>步长设置：</span>
					<el-input-number
						v-model="basicConfig.step"
						:min="1"
						:max="10"
						controls-position="right"
						@change="handleChangeStep"
					/>
				</el-space>
			</el-col>
		</el-row>
	</div>
</template>

<script setup lang="ts">
import { useAppStore } from '../../store/models/app';
import { useBasic } from '../../database/utils/useBasic';

const { updateBasicConfig } = useBasic()

const appStore = useAppStore()
const basicConfig = appStore.database.basicConfig

// 防抖定时器
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const handleChangeStep = (val: number) => {
	// 清除之前的定时器
	if (debounceTimer) {
		clearTimeout(debounceTimer)
	}
	
	// 防抖处理，延迟300ms执行
	debounceTimer = setTimeout(async () => {
		await updateBasicConfig(val)
	}, 300)
}
</script>

<style scoped>
.global-setting-container {
	height: calc(100% - 20px);
	width: calc(100% - 20px);
	background-color: #fff;
	padding: 10px;

	display: flex;
	flex-direction: column;
	flex-wrap: wrap;
}
</style>