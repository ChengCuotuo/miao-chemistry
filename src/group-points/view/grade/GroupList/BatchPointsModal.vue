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
				label="调整分值" 
				prop="points" 
				:rules="rules">
				<el-input-number 
					v-model="form.points" 
					:min="minValue" 
					:max="maxValue"
					:step="1"
					style="width: 100%"
					placeholder="请输入分值"
				/>
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
	(e: 'confirm', points: number): void;
}>();

const visible = computed({
	get: () => props.visible,
	set: (value) => emit('update:visible', value)
});

const formRef = ref<FormInstance>();
const form = ref({
	points: 0,
});

const title = computed(() => {
	return props.type === 'add' ? '批量加分' : '批量减分';
});

const minValue = computed(() => {
	return props.type === 'add' ? 1 : -9999;
});

const maxValue = computed(() => {
	return props.type === 'add' ? 9999 : -1;
});

const rules = computed(() => {
	if (props.type === 'add') {
		return [
			{ required: true, message: '请输入加分值', trigger: 'blur' },
			{ type: 'number', min: 1, message: '加分值必须为正数', trigger: 'blur' }
		];
	} else {
		return [
			{ required: true, message: '请输入减分值', trigger: 'blur' },
			{ type: 'number', max: -1, message: '减分值必须为负数', trigger: 'blur' }
		];
	}
});

// 监听 visible 变化，初始化表单
watch(() => props.visible, (newVal) => {
	if (newVal && props.group) {
		form.value.points = props.type === 'add' ? props.step : -props.step;
	} else if (!newVal) {
		// 弹窗关闭时重置表单
		form.value.points = 0;
	}
});

const handleClose = () => {
	visible.value = false;
};

const handleSubmit = () => {
	formRef.value?.validate((valid) => {
		if (valid) {
			emit('confirm', form.value.points);
			emit('update:visible', false);
		}
	});
};
</script>