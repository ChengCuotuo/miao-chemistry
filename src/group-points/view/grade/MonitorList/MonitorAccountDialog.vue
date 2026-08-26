<template>
	<el-dialog :title="title" v-model="dialogVisible" width="520px" :before-close="handleClose" append-to-body>
		<el-form ref="formRef" :model="form" label-width="90px">
			<el-form-item label="账号名" prop="name" :rules="[{ required: true, message: '请输入账号名', trigger: 'blur' }]">
				<el-input v-model="form.name" placeholder="请输入班委账号名" :disabled="mode === 'edit'" />
			</el-form-item>
			<el-form-item label="密码" prop="password" :rules="[{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 4, message: '密码至少 4 位', trigger: 'blur' }]">
				<el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
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
import { ElMessage, type FormInstance } from 'element-plus';

const props = defineProps<{
	visible: boolean;
	mode: 'add' | 'edit';
	account?: { id: string, name: string, password: string };
}>();

const emit = defineEmits<{
	(e: 'update:visible', value: boolean): void;
	(e: 'confirm', payload: { name: string, password: string }): void;
}>();

const dialogVisible = computed({
	get: () => props.visible,
	set: (v) => emit('update:visible', v),
});

const title = computed(() => (props.mode === 'add' ? '新增班委账号' : '修改班委密码'));

const formRef = ref<FormInstance>();
const form = reactive({ name: '', password: '' });

watch(() => props.visible, (v) => {
	if (v) {
		form.name = props.mode === 'edit' && props.account ? props.account.name : '';
		form.password = '';
	}
});

const handleClose = () => {
	dialogVisible.value = false;
};

const handleSubmit = () => {
	formRef.value?.validate((valid) => {
		if (valid) {
			emit('confirm', { name: form.name, password: form.password });
			dialogVisible.value = false;
		}
	});
};
</script>
