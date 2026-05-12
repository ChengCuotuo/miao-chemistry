<template>
	<el-dialog 
		:title="title" 
		v-model="visible" 
		width="500px" 
		:before-close="handleClose"
	>
		<el-form ref="formRef" :model="form" label-width="100px">
			<el-form-item :label="targetLabel">
				<el-tag type="info">{{ targetName }}</el-tag>
			</el-form-item>
			<el-form-item 
				label="选择规则" 
				prop="ruleId" 
				:rules="[{ required: true, message: '请选择规则', trigger: 'change' }]">
				<el-select 
					v-model="form.ruleId" 
					placeholder="请选择规则" 
					style="width: 100%"
					filterable
					:disabled="rules.length === 0"
				>
					<el-option 
						v-for="rule in rules" 
						:key="rule.id" 
						:label="`${rule.name} (${rule.points > 0 ? '+' : ''}${rule.points}分)`" 
						:value="rule.id" 
					/>
				</el-select>
			</el-form-item>
			<el-form-item label="规则描述">
				<el-input :value="selectedRule?.description" disabled type="textarea" :rows="3" />
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="handleClose">取消</el-button>
			<el-button type="primary" @click="handleSubmit" :disabled="rules.length === 0">确定</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElMessage, type FormInstance } from 'element-plus';
import { Rule } from '../../../database/class';

const props = defineProps<{
	visible: boolean;
	rules: Rule[];
	targetName: string;
	type: 'single' | 'batch';
}>();

const emit = defineEmits<{
	(e: 'update:visible', value: boolean): void;
	(e: 'confirm', rule: Rule): void;
}>();

const visible = computed({
	get: () => props.visible,
	set: (value) => emit('update:visible', value)
});

const formRef = ref<FormInstance>();
const form = ref({
	ruleId: ''
});

const title = computed(() => {
	return props.type === 'single' ? '根据规则调整积分' : '批量根据规则调整积分';
});

const targetLabel = computed(() => {
	return props.type === 'single' ? '学生' : '小组';
});

const selectedRule = computed<Rule | undefined>(() => {
	return props.rules.find(rule => rule.id === form.value.ruleId);
});

watch(() => props.visible, (newVal) => {
	if (!newVal) {
		form.value.ruleId = '';
	}
});

const handleClose = () => {
	visible.value = false;
};

const handleSubmit = () => {
	if (props.rules.length === 0) {
			ElMessage.warning('暂无可用规则');
			return;
		}
	formRef.value?.validate((valid) => {
		if (valid && selectedRule.value) {
			emit('confirm', selectedRule.value);
			visible.value = false;
		}
	});
};
</script>