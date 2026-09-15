<template>
	<el-dialog :title="title" v-model="dialogVisible" width="560px" :before-close="handleClose" append-to-body>
		<el-form ref="formRef" :model="form" label-width="90px">
			<el-form-item label="账号名" prop="name" :rules="[{ required: true, message: '请输入账号名', trigger: 'blur' }]">
				<el-input v-model="form.name" placeholder="请输入班委账号名" />
			</el-form-item>
			<el-form-item label="密码" prop="password" :rules="passwordRules">
				<el-input v-model="form.password" type="password" show-password
					:placeholder="mode === 'add' ? '请输入密码' : '留空则不修改密码'" />
			</el-form-item>
			<el-form-item label="可见模块">
				<div class="tab-scope">
					<el-checkbox-group v-model="form.visibleTabs">
						<el-tooltip v-for="item in tabOptions" :key="item.key" :content="item.tip" placement="top"
							:disabled="!item.tip">
							<el-checkbox :value="item.key" :disabled="item.disabled">{{ item.label }}</el-checkbox>
						</el-tooltip>
					</el-checkbox-group>
					<div class="tab-tip">
						班委账号为<strong>只读权限</strong>：只能查看勾选的模块，不能修改任何数据。
						「周期记分」「积分兑换」以及全局设置不参与授权。
					</div>
					<div class="tab-tip" v-if="!form.visibleTabs.length">
						未勾选任何模块时，登录后按默认「仅学生管理」处理
					</div>
				</div>
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="handleClose">取消</el-button>
			<el-button type="primary" @click="handleSubmit">确定</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { useAppStore } from '../../../store/models/app';
import { MONITOR_TAB_KEYS, DEFAULT_MONITOR_TABS, MONITOR_TAB_LABELS, getAccountVisibleTabs, type MonitorTabKey } from '../../../database/class';

const props = defineProps<{
	visible: boolean;
	mode: 'add' | 'edit';
	account?: { id: string, name: string, password: string, visibleTabs?: string[] };
}>();

const emit = defineEmits<{
	(e: 'update:visible', value: boolean): void;
	(e: 'confirm', payload: { name: string, password: string, visibleTabs: MonitorTabKey[] }): void;
}>();

const appStore = useAppStore();

const dialogVisible = computed({
	get: () => props.visible,
	set: (v) => emit('update:visible', v),
});

const title = computed(() => (props.mode === 'add' ? '新增班委账号' : '编辑班委账号'));

const formRef = ref<FormInstance>();
const form = reactive<{ name: string, password: string, visibleTabs: MonitorTabKey[] }>({
	name: '', password: '', visibleTabs: [...DEFAULT_MONITOR_TABS],
});

// 编辑态密码可留空（表示不改）；新增态必填
const passwordRules = computed<FormRules['password']>(() => props.mode === 'add'
	? [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 4, message: '密码至少 4 位', trigger: 'blur' }]
	: [{ min: 4, message: '密码至少 4 位', trigger: 'blur' }]);

// 可授权的模块（只读浏览类），并标注全局开关未开启的模块
const tabOptions = computed(() => {
	const visibility = appStore.database.basicConfig?.moduleVisibility;
	const monitorModuleOn = visibility?.monitorManage ?? true;
	return MONITOR_TAB_KEYS.map((key) => {
		let disabled = false;
		let tip = '';
		if (key === 'group' && !(visibility?.groupManage ?? false)) {
			disabled = true; tip = '管理员已在基础设置中关闭「关联分组」模块';
		}
		if (key === 'team' && !(visibility?.teamManage ?? true)) {
			disabled = true; tip = '管理员已在基础设置中关闭「独立分组」模块';
		}
		if (key === 'record' && !(visibility?.pointsManage ?? true)) {
			disabled = true; tip = '管理员已在基础设置中关闭「积分记录」模块';
		}
		if (key === 'analysis' && !(monitorModuleOn && (visibility?.analysisManage ?? true))) {
			disabled = true; tip = '数据分析依赖「周期记分」模块，当前不可用';
		}
		if (key === 'student' && !(visibility?.studentManage ?? true)) {
			disabled = true; tip = '管理员已在基础设置中关闭「学生管理」模块';
		}
		return { key, label: MONITOR_TAB_LABELS[key], disabled, tip };
	});
});

watch(() => props.visible, (v) => {
	if (v) {
		form.name = props.account?.name || '';
		form.password = '';
		form.visibleTabs = props.mode === 'edit'
			? getAccountVisibleTabs(props.account)
			: [...DEFAULT_MONITOR_TABS];
	}
});

const handleClose = () => {
	dialogVisible.value = false;
};

const handleSubmit = () => {
	formRef.value?.validate((valid) => {
		if (valid) {
			emit('confirm', {
				name: form.name.trim(),
				password: form.password,
				visibleTabs: [...form.visibleTabs],
			});
			dialogVisible.value = false;
		}
	});
};
</script>

<style scoped>
.tab-scope {
	width: 100%;
}

.tab-scope :deep(.el-checkbox) {
	margin-right: 16px;
}

.tab-tip {
	font-size: 12px;
	color: #909399;
	line-height: 1.6;
	margin-top: 4px;
}
</style>
