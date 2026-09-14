<template>
	<el-dialog :title="dialogTitle" :model-value="visible" width="520px" @update:model-value="handleVisibleChange">
		<el-form ref="formRef" :model="form" label-width="100px">
			<el-alert v-if="needApproval" type="warning" show-icon :closable="false" class="approval-tip"
				title="提交后需管理员审批，通过后才会计入学生积分" />
			<el-form-item label="记分对象">
				<el-tag type="info">{{ targetName }}</el-tag>
				<span class="count-text">（{{ studentCount }} 人）</span>
			</el-form-item>
			<el-form-item label="选择规则" prop="ruleId" :rules="[{ required: true, message: '请选择规则', trigger: 'change' }]">
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
				<el-input :value="selectedRule?.description" disabled type="textarea" :rows="2" />
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
			<el-button @click="handleVisibleChange(false)">取消</el-button>
			<el-button type="primary" @click="handleSubmit" :disabled="rules.length === 0 || !selectedRule">
				{{ needApproval ? '提交审批' : '确定' }}
			</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElMessage, type FormInstance } from 'element-plus';
import { MonitorCycle, Rule, RuleGroup } from '../../../database/class';
import { isNoPointsRule, getRulePoints } from '../../../database/utils/useRule';
import { useAppStore } from '../../../store/models/app';
import RuleTreeSelect from '../../components/RuleTreeSelect.vue';

const props = withDefaults(defineProps<{
	visible: boolean;
	cycle?: MonitorCycle;
	rules: Rule[];
	groups?: RuleGroup[];
	targetName: string;
	studentCount: number;
	groupId?: string;
}>(), {
	groups: () => [],
});

const emit = defineEmits<{
	(e: 'update:visible', value: boolean): void;
	(e: 'confirm', payload: { ruleId: string, count: number, points: number }): void;
}>();

const formRef = ref<FormInstance>();
const appStore = useAppStore();
// 班委记分需审批时，提交按钮与提示文案变化
const needApproval = computed(() => appStore.currentRole === 'monitor'
	&& (appStore.database.basicConfig?.monitorAccountEnabled ?? true)
	&& (appStore.database.basicConfig?.monitorApproval ?? true));
const form = ref<{
	ruleId: string;
	points: number | undefined;
	count: number;
}>({ ruleId: '', points: undefined, count: 1 });

const selectedRule = computed(() => props.rules.find(rule => rule.id === form.value.ruleId));

// 自定义分值规则：需要手动指定分值
const needsPoints = computed(() => !!selectedRule.value && isNoPointsRule(selectedRule.value));

// 单次分值：固定分值规则取规则分值，自定义分值规则取输入值
const singlePoints = computed(() => {
	if (!selectedRule.value) return 0;
	const fixed = getRulePoints(selectedRule.value);
	if (fixed === null) return Number(form.value.points) || 0;
	return fixed;
});

// 积分预览：单次分值 × 次数
const previewPoints = computed(() => singlePoints.value * form.value.count);

const dialogTitle = computed(() => needApproval.value ? '周期规则记分（提交审批）' : '周期规则记分');

const handleVisibleChange = (v: boolean) => {
	emit('update:visible', v);
};

watch(() => props.visible, (v) => {
	if (v) {
		form.value.ruleId = '';
		form.value.points = undefined;
		form.value.count = 1;
	}
});

// 切换规则时重置自定义分值输入
watch(() => form.value.ruleId, () => {
	form.value.points = undefined;
});

const handleSubmit = () => {
	formRef.value?.validate((valid) => {
		if (!valid || !selectedRule.value) return;
		if (isNoPointsRule(selectedRule.value) && (form.value.points === undefined || form.value.points === null)) {
			ElMessage.warning('该规则无固定分值，请先设置本次分值');
			return;
		}
		emit('confirm', { ruleId: selectedRule.value.id, count: form.value.count, points: singlePoints.value });
		handleVisibleChange(false);
	});
};
</script>

<style scoped>
.count-tip {
	margin-left: 10px;
	font-size: 12px;
	color: #909399;
}

.approval-tip {
	margin-bottom: 12px;
}

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
