<template>
	<el-tree-select v-model="innerValue" :data="treeData" :props="treeProps" node-key="id" check-strictly
		:render-after-expand="false" default-expand-all clearable filterable :disabled="disabled"
		:multiple="multiple" :show-checkbox="multiple" :check-on-click-node="multiple" :collapse-tags="multiple" collapse-tags-tooltip
		:placeholder="placeholder" style="width: 100%" @change="handleChange">
		<!-- 加分项 / 减分项快速过滤，默认全部 -->
		<template v-if="showTypeFilter" #header>
			<div class="rule-type-filter" @click.stop>
				<el-checkbox-group v-model="typeFilter" size="small">
					<el-checkbox value="add">加分项</el-checkbox>
					<el-checkbox value="sub">减分项</el-checkbox>
				</el-checkbox-group>
			</div>
		</template>
		<template #default="{ data }">
			<span class="rule-tree-node" :class="{ 'is-group': data.isGroup }">
				<span class="rule-tree-label">{{ data.label }}</span>
				<span v-if="data.isGroup" class="rule-tree-count">{{ data.children?.length || 0 }} 条</span>
				<span v-else class="rule-tree-points" :class="pointsClass(data.points)">{{ formatRulePoints(data.points) }}</span>
			</span>
		</template>
	</el-tree-select>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Rule, RuleGroup } from '../../database/class';
import { buildRuleTree, formatRulePoints } from '../../database/utils/useRule';

const props = withDefaults(defineProps<{
	// 单选传 string，多选（multiple）传 string[]
	modelValue: string | string[];
	rules: Rule[];
	groups?: RuleGroup[];
	disabled?: boolean;
	placeholder?: string;
	multiple?: boolean;
	// 是否在下拉头部显示「加分项 / 减分项」过滤
	showTypeFilter?: boolean;
}>(), {
	groups: () => [],
	disabled: false,
	placeholder: '请选择规则',
	multiple: false,
	showTypeFilter: true,
});

const emit = defineEmits<{
	(e: 'update:modelValue', value: string | string[]): void;
	(e: 'change', value: string | string[]): void;
}>();

const innerValue = computed({
	get: () => props.modelValue,
	set: (value: string | string[]) => emit('update:modelValue', value),
});

// 分组节点不可选，仅作分组展示
const treeProps = {
	label: 'label',
	children: 'children',
	disabled: 'isGroup',
};

// 类型过滤：add=加分项，sub=减分项；默认全选（全部）
const typeFilter = ref<string[]>(['add', 'sub']);

// 当前已选规则 id（单选/多选统一成数组）
const selectedIds = computed<string[]>(() => {
	if (Array.isArray(props.modelValue)) return props.modelValue;
	return props.modelValue ? [props.modelValue] : [];
});

// 按类型过滤后的规则
const filteredRules = computed<Rule[]>(() => {
	const keepAdd = typeFilter.value.includes('add');
	const keepSub = typeFilter.value.includes('sub');
	return (props.rules || []).filter(rule => {
		// 已选中的规则始终保留，避免回显标签丢失
		if (selectedIds.value.includes(rule.id)) return true;
		// 无分值规则加减均可，不受类型过滤影响
		if (rule.points === null || rule.points === undefined) return true;
		if (rule.points > 0) return keepAdd;
		if (rule.points < 0) return keepSub;
		return true;
	});
});

// 过滤后为空的组不展示，避免下拉里出现空分组
const treeData = computed(() => buildRuleTree(filteredRules.value, props.groups || [])
	.filter(node => (node.children?.length || 0) > 0));

const pointsClass = (points: number | null | undefined) => {
	if (points === null || points === undefined) return 'text-muted';
	return points > 0 ? 'text-success' : points < 0 ? 'text-danger' : 'text-muted';
};

const handleChange = (value: string | string[]) => {
	emit('change', value);
};
</script>

<style scoped>
.rule-type-filter {
	padding: 4px 12px 8px;
	border-bottom: 1px solid var(--el-border-color-lighter);
}

.rule-tree-node {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	width: 100%;
}

.rule-tree-node.is-group {
	font-weight: 600;
	color: var(--el-text-color-regular);
}

.rule-tree-count {
	font-size: 12px;
	font-weight: 400;
	color: var(--el-text-color-secondary);
}

.rule-tree-points {
	font-size: 12px;
	font-weight: 400;
}

.text-success {
	color: #67c23a;
}

.text-danger {
	color: #f56c6c;
}

.text-muted {
	color: #909399;
}
</style>
