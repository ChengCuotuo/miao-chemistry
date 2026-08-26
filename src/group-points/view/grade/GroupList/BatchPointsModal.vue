<template>
	<el-dialog 
		:title="title" 
		v-model="visible" 
		width="400px" 
		:before-close="handleClose"
	>
		<el-form ref="formRef" :model="form" label-width="100px">
			<el-form-item label="小组名称">
				<el-tag type="info">{{ group?.name }}</el-tag>
			</el-form-item>
			<el-form-item label="成员数量">
				<el-tag>{{ group?.studentList.length }} 人</el-tag>
			</el-form-item>
			<el-form-item 
				label="记录次数" 
				prop="count" 
				:rules="rules">
				<el-input-number 
					v-model="form.count" 
					:min="1" 
					:max="99"
					:step="1"
					style="width: 100%"
					placeholder="请输入次数"
					controls-position="right"
				/>
				<div class="count-tip">积分 = 规则分值 × 次数（{{ type === 'add' ? '+1' : '-1' }} 分/次）</div>
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="handleClose">取消</el-button>
			<el-button type="primary" @click="handleSubmit">确定</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { FormInstance } from 'element-plus';
import type { GroupInfo } from './index.vue';

const props = defineProps<{
	visible: boolean;
	type: 'add' | 'subtract';
	group: GroupInfo | null;
	step: number;
}>();

const emit = defineEmits<{
	(e: 'update:visible', value: boolean): void;
	(e: 'confirm', count: number): void;
}>();

const visible = computed({
	get: () => props.visible,
	set: (value) => emit('update:visible', value)
});

const formRef = ref<FormInstance>();
const form = ref({
	count: 1,
});

const title = computed(() => {
	return props.type === 'add' ? '批量加分' : '批量减分';
});

const rules = computed(() => {
	return [
		{ required: true, message: '请输入次数', trigger: 'blur' },
		{ type: 'number', min: 1, max: 99, message: '次数范围 1-99', trigger: 'blur' }
	];
});

// 监听 visible 变化，初始化表单
watch(() => props.visible, (newVal) => {
	if (newVal) {
		form.value.count = 1;
	}
});

const handleClose = () => {
	visible.value = false;
};

const handleSubmit = () => {
	formRef.value?.validate((valid) => {
		if (valid) {
			emit('confirm', form.value.count);
			emit('update:visible', false);
		}
	});
};
</script>

<style scoped>
.count-tip {
	font-size: 12px;
	color: #909399;
	line-height: 1.4;
	margin-top: 4px;
	width: 100%;
}
</style>