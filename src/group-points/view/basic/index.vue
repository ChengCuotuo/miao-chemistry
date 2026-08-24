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
		<el-divider border-style="dashed" style="margin: 14px 0;" />
		<div class="module-setting">
			<div class="module-setting-title">班级管理模块展示设置：</div>
			<el-space style="margin-top: 10px;">
				<span>分组管理：</span>
				<el-switch v-model="basicConfig.moduleVisibility.groupManage" @change="handleModuleChange" />
			</el-space>
			<el-space style="margin-top: 10px;">
				<span>积分管理：</span>
				<el-switch v-model="basicConfig.moduleVisibility.pointsManage" @change="handleModuleChange" />
			</el-space>
			<el-space style="margin-top: 10px;">
				<span>积分兑换：</span>
				<el-switch v-model="basicConfig.moduleVisibility.pointsExchange" @change="handleModuleChange" />
			</el-space>
		</div>
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
import { ElMessage } from 'element-plus';
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

// 模块可见性切换（防抖持久化）
const handleModuleChange = () => {
	// 清除之前的定时器
	if (debounceTimer) {
		clearTimeout(debounceTimer)
	}

	// 防抖处理，延迟300ms执行
	debounceTimer = setTimeout(async () => {
		await updateBasicConfig({ ...basicConfig })
		ElMessage.success('设置已保存')
	}, 300)
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

.module-setting {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
}

.module-setting-title {
	font-weight: bold;
}
</style>