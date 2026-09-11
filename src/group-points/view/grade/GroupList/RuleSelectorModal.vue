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
				<RuleTreeSelect v-model="form.ruleId" :rules="rules" :groups="groups"
					:disabled="rules.length === 0" placeholder="请选择规则" />
				<div v-if="rules.length === 0" class="form-tip">暂无可用规则，请先在规则设置中添加</div>
			</el-form-item>
			<!-- 自定义分值规则：必须手动指定分值后才生效 -->
			<el-form-item v-if="needsPoints" label="本次分值" prop="points"
				:rules="[{ required: true, message: '该规则无固定分值，请填写本次分值', trigger: 'blur' }]">
				<el-input-number v-model="form.points" controls-position="right" style="width: 160px" placeholder="请输入分值" />
				<span class="count-tip">自定义分值规则需指定分值后才会生效</span>
			</el-form-item>
			<el-form-item label="规则描述">
				<el-input :value="selectedRule?.description" disabled type="textarea" :rows="3" />
			</el-form-item>
			<el-form-item label="记录次数">
				<el-input-number v-model="form.count" :min="1" :max="99" controls-position="right" style="width: 160px" />
				<span class="count-tip">积分 = 规则分值 × 次数</span>
			</el-form-item>
			<el-form-item label="积分变化">
				<span class="points-preview" :class="previewPoints >= 0 ? 'text-success' : 'text-danger'">
					{{ previewPoints >= 0 ? '+' : '' }}{{ previewPoints }} 分 / 人
				</span>
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
import { Rule, RuleGroup } from '../../../database/class';
import { isNoPointsRule, getRulePoints } from '../../../database/utils/useRule';
import RuleTreeSelect from '../../components/RuleTreeSelect.vue';

const props = withDefaults(defineProps<{
	visible: boolean;
	rules: Rule[];
	groups?: RuleGroup[];
	targetName: string;
	type: 'single' | 'batch';
}>(), {
	groups: () => [],
});

const emit = defineEmits<{
	(e: 'update:visible', value: boolean): void;
	(e: 'confirm', rule: Rule, count: number, singlePoints: number): void;
}>();

const visible = computed({
	get: () => props.visible,
	set: (value) => emit('update:visible', value)
});

const formRef = ref<FormInstance>();
const form = ref<{
	ruleId: string;
	points: number | undefined;
	count: number;
}>({
	ruleId: '',
	points: undefined,
	count: 1,
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

// 选中的是否为自定义分值规则：自定义分值时必须手动填写分值
const needsPoints = computed(() => !!selectedRule.value && isNoPointsRule(selectedRule.value));

// 单次分值：有分值规则取固定分值，自定义分值规则取手动输入
const singlePoints = computed(() => {
	if (!selectedRule.value) return 0;
	const fixed = getRulePoints(selectedRule.value);
	if (fixed === null) return Number(form.value.points) || 0;
	return fixed;
});

const previewPoints = computed(() => singlePoints.value * form.value.count);

watch(() => props.visible, (newVal) => {
	if (newVal) {
		form.value.ruleId = '';
		form.value.points = undefined;
		form.value.count = 1;
	}
});

// 切换规则时，自定义分值规则的输入分值重置，避免残留上一次的分值
watch(() => form.value.ruleId, () => {
	form.value.points = undefined;
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
		if (!valid || !selectedRule.value) return;
		// 自定义分值规则：未指定分值不生效
		if (isNoPointsRule(selectedRule.value) && (form.value.points === undefined || form.value.points === null)) {
			ElMessage.warning('该规则无固定分值，请先设置本次分值');
			return;
		}
		emit('confirm', selectedRule.value, form.value.count, singlePoints.value);
		visible.value = false;
	});
};
</script>

<style scoped>
.count-tip {
	margin-left: 10px;
	font-size: 12px;
	color: #909399;
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
