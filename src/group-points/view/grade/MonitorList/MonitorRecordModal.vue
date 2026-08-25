<template>
	<el-dialog :title="dialogTitle" :model-value="visible" width="520px" @update:model-value="handleVisibleChange">
		<el-form ref="formRef" :model="form" label-width="100px">
			<el-form-item label="记分对象">
				<el-tag type="info">{{ targetName }}</el-tag>
				<span class="count-text">（{{ studentCount }} 人）</span>
			</el-form-item>
			<el-form-item label="选择规则" prop="ruleId" :rules="[{ required: true, message: '请选择规则', trigger: 'change' }]">
				<el-select v-model="form.ruleId" placeholder="请选择规则" style="width: 100%" filterable
					:disabled="rules.length === 0">
					<el-option v-for="rule in rules" :key="rule.id"
						:label="`${rule.name} (${rule.points > 0 ? '+' : ''}${rule.points}分)`" :value="rule.id" />
				</el-select>
				<div v-if="rules.length === 0" class="form-tip">暂无可用规则，请先在规则设置中添加</div>
			</el-form-item>
			<el-form-item label="规则描述">
				<el-input :value="selectedRule?.description" disabled type="textarea" :rows="2" />
			</el-form-item>
			<el-form-item label="积分变化">
				<span class="points-preview" :class="previewPoints >= 0 ? 'text-success' : 'text-danger'">
					{{ previewPoints >= 0 ? '+' : '' }}{{ previewPoints }} 分 / 人
				</span>
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="handleVisibleChange(false)">取消</el-button>
			<el-button type="primary" @click="handleSubmit" :disabled="rules.length === 0 || !selectedRule">确定</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { type FormInstance } from 'element-plus';
import { MonitorCycle, Rule } from '../../../database/class';

const props = defineProps<{
	visible: boolean;
	cycle?: MonitorCycle;
	rules: Rule[];
	targetName: string;
	studentCount: number;
	groupId?: string;
}>();

const emit = defineEmits<{
	(e: 'update:visible', value: boolean): void;
	(e: 'confirm', payload: { ruleId: string }): void;
}>();

const formRef = ref<FormInstance>();
const form = ref({ ruleId: '' });

const selectedRule = computed(() => props.rules.find(rule => rule.id === form.value.ruleId));

// 积分预览
const previewPoints = computed(() => selectedRule.value?.points || 0);

const dialogTitle = computed(() => '周期规则记分');

const handleVisibleChange = (v: boolean) => {
	emit('update:visible', v);
};

watch(() => props.visible, (v) => {
	if (v) {
		form.value.ruleId = '';
	}
});

const handleSubmit = () => {
	formRef.value?.validate((valid) => {
		if (valid && selectedRule.value) {
			emit('confirm', { ruleId: selectedRule.value.id });
			handleVisibleChange(false);
		}
	});
};
</script>

<style scoped>
.count-text {
	color: #909399;
	font-size: 12px;
	margin-left: 6px;
}

.form-tip {
	font-size: 12px;
	color: #909399;
	line-height: 1.4;
	margin-top: 4px;
	width: 100%;
}

.points-preview {
	font-size: 16px;
	font-weight: 600;
}

.text-success {
	color: #67c23a;
}

.text-danger {
	color: #f56c6c;
}
</style>
