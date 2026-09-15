<template>
	<el-dialog title="班委账号管理" :model-value="visible" width="640px" destroy-on-close
		@update:model-value="(v: boolean) => emit('update:visible', v)">
		<el-alert :closable="false" class="manage-tip" type="info"
			title="班委账号为只读身份：登录后只能查看被勾选「可见模块」的内容，不能修改任何数据" />
		<div class="account-toolbar">
			<el-button type="primary" :icon="Plus" size="small" @click="handleAddAccount">新增账号</el-button>
		</div>
		<el-table :data="accountList" border size="small" max-height="360">
			<el-table-column prop="name" label="账号名" min-width="110" />
			<el-table-column label="可见模块" min-width="200">
				<template #default="scope">
					<span class="account-tabs">{{ accountTabsText(scope.row) }}</span>
				</template>
			</el-table-column>
			<el-table-column label="操作" width="130" align="center">
				<template #default="scope">
					<el-button size="small" type="warning" text @click="handleEditAccount(scope.row)">编辑</el-button>
					<el-button size="small" type="danger" text @click="handleDeleteAccount(scope.row)">删除</el-button>
				</template>
			</el-table-column>
		</el-table>
		<el-empty v-if="accountList.length === 0" description="暂无班委账号，请先新增" :image-size="60" />

		<!-- 新增 / 编辑账号 -->
		<AccountDialog v-model:visible="accountFormVisible" :mode="accountFormMode"
			:account="accountFormTarget" @confirm="handleAccountConfirm" />
	</el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { getAccountVisibleTabs, MONITOR_TAB_LABELS } from '../../../database/class';
import { useMonitorAccount } from '../../../database/utils/useMonitorAccount';
import AccountDialog from './AccountDialog.vue';

defineProps<{ visible: boolean }>();
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>();

const { getMonitorAccountList, createMonitorAccount, updateMonitorAccount, updateMonitorAccountPassword, deleteMonitorAccount } = useMonitorAccount();

const accountList = computed(() => getMonitorAccountList());

// 账号可见模块的展示文案（旧账号无授权字段时按默认「仅学生管理」）
const accountTabsText = (account: { visibleTabs?: string[] }) =>
	getAccountVisibleTabs(account).map(key => MONITOR_TAB_LABELS[key]).join('、') || '—';

const accountFormVisible = ref(false);
const accountFormMode = ref<'add' | 'edit'>('add');
const accountFormTarget = ref<{ id: string, name: string, password: string, visibleTabs?: string[] } | undefined>(undefined);

const handleAddAccount = () => {
	accountFormMode.value = 'add';
	accountFormTarget.value = undefined;
	accountFormVisible.value = true;
};

const handleEditAccount = (account: { id: string, name: string, password: string, visibleTabs?: string[] }) => {
	accountFormMode.value = 'edit';
	accountFormTarget.value = account;
	accountFormVisible.value = true;
};

const handleDeleteAccount = (account: { id: string, name: string }) => {
	ElMessageBox.confirm(`确认删除班委账号「${account.name}」？`, '删除确认', {
		type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消',
	}).then(async () => {
		const res = await deleteMonitorAccount(account.id);
		ElMessage[res.success ? 'success' : 'warning'](res.message);
	}).catch(() => { });
};

const handleAccountConfirm = async (payload: { name: string, password: string, visibleTabs: string[] }) => {
	if (accountFormMode.value === 'add') {
		const res = await createMonitorAccount(payload.name, payload.password, payload.visibleTabs);
		ElMessage[res.success ? 'success' : 'warning'](res.message);
	} else if (accountFormTarget.value) {
		// 编辑：账号名 / 可见模块必传，密码留空表示不修改
		const res = await updateMonitorAccount(accountFormTarget.value.id, { name: payload.name, visibleTabs: payload.visibleTabs });
		if (!res.success) {
			ElMessage.warning(res.message);
			return;
		}
		if (payload.password) {
			const pwdRes = await updateMonitorAccountPassword(accountFormTarget.value.id, payload.password);
			ElMessage[pwdRes.success ? 'success' : 'warning'](pwdRes.message);
		} else {
			ElMessage.success(res.message);
		}
	}
};
</script>

<style scoped>
.manage-tip {
	margin-bottom: 10px;
}

.account-toolbar {
	display: flex;
	justify-content: flex-end;
	margin-bottom: 10px;
}

.account-tabs {
	font-size: 12px;
	color: #606266;
}
</style>
