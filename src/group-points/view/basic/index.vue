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
			<div class="module-setting-title">班级管理模块展示设置（拖拽调整顺序，开关控制展示）：</div>
			<draggable
				class="module-drag-list"
				item-key="key"
				tag="ul"
				v-model="moduleOrderList"
				:animation="200"
				handle=".drag-handle"
				@end="handleModuleOrderChange"
			>
				<template #item="{ element }">
					<li class="module-drag-item">
						<el-icon class="drag-handle"><Rank /></el-icon>
						<span class="module-name">{{ element.label }}</span>
						<el-switch v-model="element.visible" @change="handleModuleChange" />
					</li>
				</template>
			</draggable>
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
import { Edit, Rank } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { ref } from 'vue';
import draggable from 'vuedraggable';
import PasswordChangeDialog from './PasswordChangeDialog.vue';
import md5 from 'blueimp-md5'

const { updateBasicConfig } = useBasic()

const appStore = useAppStore()
const basicConfig = appStore.database.basicConfig

// 模块定义：key 唯一标识，label 展示名
const MODULE_DEFS: Record<string, string> = {
	student: '学生管理',
	group: '分组管理',
	monitor: '周期记分',
	record: '积分记录',
	lottery: '积分兑换',
	analysis: '数据分析',
};
const DEFAULT_MODULE_ORDER = ['group', 'student', 'monitor', 'record', 'lottery', 'analysis'];

// 模块 key → moduleVisibility 里的真实字段名
const MODULE_VIS_FIELD: Record<string, string> = {
	student: 'studentManage',
	group: 'groupManage',
	monitor: 'monitorManage',
	record: 'pointsManage',
	lottery: 'pointsExchange',
	analysis: 'analysisManage',
};

const getModuleVisible = (key: string): boolean => {
	const vis = basicConfig?.moduleVisibility || { groupManage: true, pointsManage: true, pointsExchange: true, studentManage: true, monitorManage: true, analysisManage: true };
	return vis[MODULE_VIS_FIELD[key] as keyof typeof vis] ?? true;
};

// 拖拽列表数据（顺序 + 可见性快照）
const moduleOrderList = ref<{ key: string, label: string, visible: boolean }[]>(
	(() => {
		const savedOrder: string[] = Array.isArray(basicConfig?.moduleOrder) && basicConfig.moduleOrder.length
			? basicConfig.moduleOrder.filter((k: string) => MODULE_DEFS[k])
			: DEFAULT_MODULE_ORDER;
		// 补齐保存顺序里缺失的模块（新增模块兼容）
		const missing = DEFAULT_MODULE_ORDER.filter(k => !savedOrder.includes(k));
		return [...savedOrder, ...missing].map(key => ({ key, label: MODULE_DEFS[key], visible: getModuleVisible(key) }));
	})()
);

// 拖拽结束：写入新顺序并持久化
const handleModuleOrderChange = () => {
	handleModuleChange();
};

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

// 模块可见性/顺序变更：同步到配置字段（防抖持久化）
const handleModuleChange = () => {
	if (basicConfig) {
		// 初始化兜底
		if (!basicConfig.moduleVisibility) {
			basicConfig.moduleVisibility = { groupManage: true, pointsManage: true, pointsExchange: true, studentManage: true, monitorManage: true, analysisManage: true };
		}
		moduleOrderList.value.forEach(item => {
			// 按映射写入真实字段：groupManage / studentManage / monitorManage / pointsManage / pointsExchange
			const field = MODULE_VIS_FIELD[item.key] as keyof typeof basicConfig.moduleVisibility;
			basicConfig.moduleVisibility[field] = item.visible;
		});
		basicConfig.moduleOrder = moduleOrderList.value.map(item => item.key);
	}

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

.module-drag-list {
	list-style: none;
	padding: 0;
	margin: 10px 0 0;
	width: 340px;
	border: 1px solid #e4e7ed;
	border-radius: 6px;
	background: #fff;
}

.module-drag-item {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 14px;
	border-bottom: 1px solid #ebeef5;
	background: #fff;
}

.module-drag-item:last-child {
	border-bottom: none;
}

.drag-handle {
	cursor: grab;
	color: #909399;
}

.drag-handle:active {
	cursor: grabbing;
}

.module-name {
	flex: 1;
}
</style>
