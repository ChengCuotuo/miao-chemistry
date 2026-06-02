<template>
	<div class="global-setting-container">
		<el-space>
			<span>设置步长：</span>
			<el-input-number v-model="basicConfig.step" :min="1" :max="10" controls-position="right" style="width: 160px;"
				@change="handleChangeStep" />
		</el-space>
		<el-space style="margin-top: 10px;">
			<span>修改密码：</span>
			<el-input disabled :password="true" v-model="basicConfig.password" type="password" style="width: 160px;" placeholder="请输入密码" />
			<el-button type="primary" text :icon="Edit" @click="showPasswordDialog" />
		</el-space>
	</div>

	<!-- 密码修改弹窗组件 -->
	<PasswordChangeDialog
		v-model:visible="passwordDialogVisible"
		:current-password="basicConfig.password"
		@password-changed="handlePasswordChanged"
	/>
</template>

<script setup lang="ts">
import { useAppStore } from '../../store/models/app';
import { useBasic } from '../../database/utils/useBasic';
import { Edit } from '@element-plus/icons-vue';
import { ref } from 'vue';
import PasswordChangeDialog from './PasswordChangeDialog.vue';
import md5 from 'blueimp-md5'

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
		basicConfig.step = val
		await updateBasicConfig({ ...basicConfig})
	}, 300)
}

// 密码修改相关
const passwordDialogVisible = ref(false)

const showPasswordDialog = () => {
	passwordDialogVisible.value = true
}

const handlePasswordChanged = async (newPassword: string) => {
	basicConfig.password = md5(newPassword)
	await updateBasicConfig({ ...basicConfig })
}
</script>

<style scoped>
.global-setting-container {
	height: calc(100% - 20px);
	width: calc(100% - 20px);
	background-color: #fff;
	padding: 10px;

	font-size: 14px;

	display: flex;
	flex-direction: column;
	flex-wrap: wrap;
}
</style>