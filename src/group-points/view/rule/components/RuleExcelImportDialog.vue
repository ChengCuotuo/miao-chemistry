<template>
	<el-dialog title="从 Excel 导入规则" v-model="dialogVisible" width="880px" :before-close="handleClose" destroy-on-close>
		<el-alert type="info" show-icon :closable="false" class="tip-alert">
			<div class="tip-line">表格需包含「分组 / 规则名称 / 积分值 / 适用班级 / 规则描述」五列，表头名称一致即可，列顺序可调整。</div>
			<div class="tip-line">1.分组列留空归入「默认分组」，分组不存在会自动创建；。</div>
			<div class="tip-line">2.积分值留空或填「自定义」表示无分值规则；</div>
			<div class="tip-line">3.适用班级多个用逗号 / 顿号分隔，留空表示所有班级。</div>
			<el-button link type="primary" :icon="Download" @click="downloadTemplate">下载 Excel 模板</el-button>
		</el-alert>

		<FileUpload accept=".xlsx,.xls" :size="1024 * 1024" @change="handleChangeFile" />

		<template v-if="parsedRows.length">
			<el-divider style="margin: 12px 0" />

			<div class="summary">
				<el-space wrap :size="8">
					<el-tag type="primary" effect="dark">{{ fileName }}</el-tag>
					<el-tag type="info">共 {{ parsedRows.length }} 条规则</el-tag>
					<el-tag type="success">{{ groupSummaries.length }} 个分组</el-tag>
					<el-tag :type="newGroupCount ? 'warning' : 'info'">新建分组 {{ newGroupCount }} 个</el-tag>
					<el-tag :type="duplicateCount ? 'warning' : 'info'">重复规则 {{ duplicateCount }} 条</el-tag>
					<el-tag :type="errors.length ? 'danger' : 'info'">异常 {{ errors.length }} 条</el-tag>
				</el-space>
			</div>

			<el-form label-width="90px" class="options">
				<el-form-item label="重复规则">
					<el-radio-group v-model="duplicateStrategy">
						<el-radio value="skip">跳过（保留原有规则）</el-radio>
						<el-radio value="overwrite">覆盖（用表格内容更新）</el-radio>
						<el-radio value="append">新增（保留两条同名规则）</el-radio>
					</el-radio-group>
					<div class="form-tip">同一分组下规则名称相同即视为重复</div>
				</el-form-item>
			</el-form>

			<el-table :data="previewRows" border size="small" max-height="320">
				<el-table-column type="index" label="#" width="50" align="center" />
				<el-table-column label="分组" width="150" show-overflow-tooltip>
					<template #default="{ row }">
						<span>{{ row.groupName || DEFAULT_RULE_GROUP_NAME }}</span>
						<el-tag v-if="row.groupIsNew" size="small" type="warning" effect="plain">新建</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="name" label="规则名称" min-width="140" show-overflow-tooltip />
				<el-table-column label="积分值" width="110" align="center">
					<template #default="{ row }">
						<el-tag :type="pointsTagType(row.points)" effect="plain">{{ pointsText(row.points) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="适用班级" min-width="160" show-overflow-tooltip>
					<template #default="{ row }">
						<span v-if="!row.gradeNames.length" class="text-gray">所有班级</span>
						<span v-else>{{ row.gradeNames.join('、') }}</span>
						<el-tag v-if="row.unknownGrades.length" size="small" type="danger" effect="plain">
							未识别：{{ row.unknownGrades.join('、') }}
						</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="description" label="规则描述" min-width="180" show-overflow-tooltip />
				<el-table-column label="状态" width="110" align="center">
					<template #default="{ row }">
						<el-tag v-if="row.duplicated" :type="duplicateTagType" effect="plain" size="small">{{ duplicateTagText }}</el-tag>
						<el-tag v-else type="success" effect="plain" size="small">新增</el-tag>
					</template>
				</el-table-column>
			</el-table>

			<el-alert v-if="errors.length" type="warning" show-icon :closable="false" class="error-alert">
				<template #title>有 {{ errors.length }} 处需要留意</template>
				<div v-for="(err, index) in errors.slice(0, 8)" :key="index" class="error-line">
					第 {{ err.row }} 行：{{ err.message }}
				</div>
				<div v-if="errors.length > 8" class="error-line">仅展示前 8 条…</div>
			</el-alert>
		</template>

		<template #footer>
			<el-space>
				<el-button @click="handleClose">取消</el-button>
				<el-button type="primary" :disabled="!parsedRows.length" :loading="importing" @click="handleSubmit">
					确认导入
				</el-button>
			</el-space>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Download } from '@element-plus/icons-vue';
import FileUpload from '../../../components/file-upload.vue';
import { useAppStore } from '../../../store/models/app';
import { useRule } from '../../../database/utils/useRule';
import type { RuleImportItem, RuleImportDuplicateStrategy } from '../../../database/utils/useRule';
import { DEFAULT_RULE_GROUP_NAME } from '../../../database';
import {
	parseRuleExcel, resolveGradeNames, buildRuleTemplateWorkbook, downloadWorkbook,
	RULE_EXCEL_TEMPLATE_FILENAME,
} from '../../../database/utils/ruleExcel';
import type { RuleExcelRow } from '../../../database/utils/ruleExcel';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ 'update:visible': [value: boolean]; 'success': [] }>();

const appStore = useAppStore();
const { importRules } = useRule();

const dialogVisible = ref(false);
const importing = ref(false);
const fileName = ref('');
const parsedRows = ref<RuleExcelRow[]>([]);
const errors = ref<{ row: number; message: string }[]>([]);
const duplicateStrategy = ref<RuleImportDuplicateStrategy>('skip');

const gradeList = computed(() => (appStore.database.gradeList || []).filter(grade => grade.delete === 0));

watch(() => props.visible, value => {
	dialogVisible.value = value;
	if (value) reset();
});
watch(dialogVisible, value => emit('update:visible', value));

// ---------- 预览数据 ----------
interface PreviewRow extends RuleExcelRow {
	gradeIds: string[];
	unknownGrades: string[];
	groupIsNew: boolean;
	duplicated: boolean;
}

const existingGroupNames = computed(() => new Set((appStore.database.ruleGroupList || []).map(group => group.name)));

const previewRows = computed<PreviewRow[]>(() => parsedRows.value.map(row => {
	const { ids, unknown } = resolveGradeNames(row.gradeNames, gradeList.value);
	const groupName = row.groupName || DEFAULT_RULE_GROUP_NAME;
	const groupIsNew = !existingGroupNames.value.has(groupName);
	const group = (appStore.database.ruleGroupList || []).find(item => item.name === groupName);
	const duplicated = !!group && (appStore.database.ruleList || []).some(
		rule => rule.group_id === group.id && rule.name === row.name,
	);
	return { ...row, gradeIds: ids, unknownGrades: unknown, groupIsNew, duplicated };
}));

const groupSummaries = computed(() => {
	const map = new Map<string, number>();
	previewRows.value.forEach(row => {
		const name = row.groupName || DEFAULT_RULE_GROUP_NAME;
		map.set(name, (map.get(name) || 0) + 1);
	});
	return [...map.entries()].map(([name, count]) => ({ name, count }));
});

const newGroupCount = computed(() => groupSummaries.value.filter(group => !existingGroupNames.value.has(group.name)).length);
const duplicateCount = computed(() => previewRows.value.filter(row => row.duplicated).length);

// ---------- 解析 ----------
const reset = () => {
	fileName.value = '';
	parsedRows.value = [];
	errors.value = [];
	duplicateStrategy.value = 'skip';
	importing.value = false;
};

const handleChangeFile = (file: any) => {
	const raw = file?.raw;
	if (!raw) return;
	const fileExt = (file.name || '').split('.').pop()?.toLowerCase();
	if (fileExt !== 'xlsx' && fileExt !== 'xls') {
		ElMessage.error('请选择 .xlsx 或 .xls 文件');
		return;
	}
	const reader = new FileReader();
	reader.onload = event => {
		try {
			const data = new Uint8Array(event.target?.result as ArrayBuffer);
			const result = parseRuleExcel(data);
			parsedRows.value = result.rows;
			errors.value = result.errors;
			fileName.value = file.name;
			if (!result.rows.length) {
				ElMessage.warning('未解析到任何规则，请检查表格内容');
			} else {
				ElMessage.success(`已解析 ${result.rows.length} 条规则`);
			}
		} catch (error) {
			console.error('解析 Excel 失败:', error);
			ElMessage.error('Excel 解析失败，请确认文件格式正确');
			reset();
		}
	};
	reader.readAsArrayBuffer(raw);
};

const downloadTemplate = () => {
	try {
		downloadWorkbook(buildRuleTemplateWorkbook(), RULE_EXCEL_TEMPLATE_FILENAME);
		ElMessage.success('模板下载中，请按模板填写后上传');
	} catch (error) {
		console.error('模板下载失败:', error);
		ElMessage.error('模板下载失败');
	}
};

// ---------- 提交 ----------
const handleSubmit = async () => {
	if (!previewRows.value.length) return;
	importing.value = true;
	try {
		const items: RuleImportItem[] = previewRows.value.map(row => ({
			groupName: row.groupName || DEFAULT_RULE_GROUP_NAME,
			name: row.name,
			points: row.points,
			allow_grades: row.gradeIds,
			description: row.description,
		}));
		const result = await importRules(items, duplicateStrategy.value);
		if (!result || (!result.added && !result.updated && !result.groupCreated)) {
			ElMessage.warning('没有可导入的规则');
			return;
		}
		const parts: string[] = [];
		if (result.added) parts.push(`新增 ${result.added} 条`);
		if (result.updated) parts.push(`覆盖 ${result.updated} 条`);
		if (result.skipped) parts.push(`跳过 ${result.skipped} 条`);
		if (result.groupCreated) parts.push(`新建分组 ${result.groupCreated} 个`);
		if (result.failed) parts.push(`失败 ${result.failed} 条`);
		ElMessage.success(`导入完成：${parts.join('，')}`);
		emit('success');
		handleClose();
	} finally {
		importing.value = false;
	}
};

const handleClose = () => {
	dialogVisible.value = false;
};

// ---------- 展示辅助 ----------
const pointsText = (points: number | null) => (points === null || points === undefined ? '自定义' : `${points} 分`);

const pointsTagType = (points: number | null) => {
	if (points === null || points === undefined) return 'warning';
	if (points > 0) return 'success';
	if (points < 0) return 'danger';
	return 'info';
};

const duplicateTagText = computed(() => (
	duplicateStrategy.value === 'skip' ? '重复·跳过' : duplicateStrategy.value === 'overwrite' ? '重复·覆盖' : '重复·新增'
));
const duplicateTagType = computed(() => (duplicateStrategy.value === 'append' ? 'info' : 'warning'));
</script>

<style scoped>
.tip-alert {
	margin-bottom: 12px;
}

.tip-line {
	line-height: 1.6;
}

.summary {
	margin-bottom: 8px;
}

.options {
	margin-bottom: 4px;
}

.error-alert {
	margin-top: 12px;
}

.error-line {
	line-height: 1.6;
	font-size: 12px;
}

.text-gray {
	color: #909399;
}

.form-tip {
	font-size: 12px;
	color: #909399;
	line-height: 1.4;
	width: 100%;
}
</style>
