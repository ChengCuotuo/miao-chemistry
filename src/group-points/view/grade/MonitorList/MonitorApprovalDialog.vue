<template>
	<el-dialog title="班委记分审批" v-model="dialogVisible" width="1080px" :before-close="handleClose" destroy-on-close>
		<!-- 统计与筛选 -->
		<div class="approval-summary">
			<el-space wrap :size="8">
				<el-tag type="warning" effect="dark">待审批 {{ pendingAllCount }} 条</el-tag>
				<el-tag type="success" effect="plain">已通过 {{ approvedCount }} 条</el-tag>
				<el-tag type="danger" effect="plain">已驳回 {{ rejectedCount }} 条</el-tag>
				<el-tag v-if="selectedIds.length" type="primary" effect="plain">
					已选 {{ selectedIds.length }} 条，合计 {{ selectedPoints > 0 ? '+' : '' }}{{ selectedPoints }} 分
				</el-tag>
			</el-space>
		</div>

		<div class="approval-filter">
			<el-space wrap :size="8">
				<el-select v-model="statusFilter" style="width: 130px">
					<el-option label="待审批" :value="RECORD_STATUS.PENDING" />
					<el-option label="已通过" :value="RECORD_STATUS.APPROVED" />
					<el-option label="已驳回" :value="RECORD_STATUS.REJECTED" />
					<el-option label="全部状态" value="all" />
				</el-select>
				<el-select v-model="cycleFilter" placeholder="全部周期" clearable style="width: 160px">
					<el-option v-for="cycle in cycleList" :key="cycle.id" :label="cycle.name" :value="cycle.id" />
				</el-select>
				<el-select v-model="submitterFilter" placeholder="全部班委" clearable style="width: 150px">
					<el-option v-for="name in submitterOptions" :key="name" :label="name" :value="name" />
				</el-select>
				<el-input v-model="keyword" placeholder="学生姓名 / ID" clearable :prefix-icon="Search" style="width: 180px" />
			</el-space>
			<el-space>
				<el-button type="success" :disabled="!selectedPendingIds.length" @click="handleBulkApprove">
					批量通过
				</el-button>
				<el-button type="danger" plain :disabled="!selectedPendingIds.length" @click="handleBulkReject">
					批量驳回
				</el-button>
			</el-space>
		</div>

		<el-table :data="pagedRows" border size="small" max-height="420" @selection-change="handleSelectionChange">
			<el-table-column type="selection" width="42" :selectable="() => true" />
			<el-table-column label="提交时间" width="150" align="center">
				<template #default="{ row }">
					<span class="time-text">{{ row.time }}</span>
				</template>
			</el-table-column>
			<el-table-column label="周期" width="90" align="center" show-overflow-tooltip>
				<template #default="{ row }">{{ row.cycle_name || '—' }}</template>
			</el-table-column>
			<el-table-column label="原始提交人" width="110" align="center" show-overflow-tooltip>
				<template #default="{ row }">{{ row.submitter_name || '—' }}</template>
			</el-table-column>
			<el-table-column label="操作人" width="130" align="center" show-overflow-tooltip>
				<template #default="{ row }">
					<span>{{ row.operator_name || '—' }}</span>
					<el-tag v-if="isEditedByAdmin(row)" size="small" type="warning" effect="plain">管理员已修改</el-tag>
				</template>
			</el-table-column>
			<el-table-column label="学生" width="100" align="center" show-overflow-tooltip>
				<template #default="{ row }">{{ row.student_name }}</template>
			</el-table-column>
			<el-table-column label="规则" min-width="140" show-overflow-tooltip>
				<template #default="{ row }">{{ row.rule_name }}</template>
			</el-table-column>
			<el-table-column label="次数" width="60" align="center" prop="count" />
			<el-table-column label="单次分值" width="80" align="center">
				<template #default="{ row }">{{ singlePoints(row) }}</template>
			</el-table-column>
			<el-table-column label="合计" width="80" align="center">
				<template #default="{ row }">
					<span :class="row.points >= 0 ? 'text-success' : 'text-danger'">
						{{ row.points > 0 ? '+' : '' }}{{ row.points }}
					</span>
				</template>
			</el-table-column>
			<el-table-column label="状态" width="90" align="center">
				<template #default="{ row }">
					<el-tag size="small" :type="statusTagType(row.status)" effect="plain">{{ statusText(row.status) }}</el-tag>
				</template>
			</el-table-column>
			<el-table-column label="操作" width="170" align="center" fixed="right">
				<template #default="{ row }">
					<template v-if="row.status === RECORD_STATUS.PENDING">
						<el-button size="small" text type="primary" @click="handleEdit(row)">编辑</el-button>
						<el-button size="small" text type="success" @click="handleApprove(row)">通过</el-button>
						<el-button size="small" text type="danger" @click="handleReject(row)">驳回</el-button>
					</template>
					<el-tooltip v-else-if="row.status === RECORD_STATUS.REJECTED && row.reject_reason" placement="top"
						:content="`驳回理由：${row.reject_reason}`">
						<span class="muted-text">查看理由</span>
					</el-tooltip>
					<span v-else class="muted-text">—</span>
				</template>
			</el-table-column>
		</el-table>

		<div class="approval-pagination">
			<el-pagination @size-change="handleSizeChange" @current-change="handlePageChange"
				:current-page="currentPage" :page-sizes="[10, 20, 50]" :page-size="pageSize"
				layout="total, sizes, prev, pager, next" :total="rows.length" />
		</div>

		<!-- 审批时修改（仅待审批）：修改后该条操作人变为管理员 -->
		<el-dialog title="修改待审批记录" v-model="editVisible" width="480px" append-to-body>
			<el-alert type="info" show-icon :closable="false" class="edit-tip"
				title="修改后该条记录的「操作人」将变为管理员，原始提交班委会保留记录" />
			<el-form label-width="90px">
				<el-form-item label="学生">
					<el-select v-model="editForm.stu_id" filterable style="width: 100%">
						<el-option v-for="student in studentList" :key="student.id" :label="`${student.name}（${student.id}）`"
							:value="student.id" />
					</el-select>
				</el-form-item>
				<el-form-item label="规则">
					<RuleTreeSelect v-model="editForm.rule_id" :rules="rules" :groups="groups" placeholder="请选择规则" />
				</el-form-item>
				<el-form-item label="本次分值" v-if="editNeedsPoints">
					<el-input-number v-model="editForm.points" controls-position="right" style="width: 160px" />
					<span class="edit-tip-text">该规则无固定分值，需指定本次分值</span>
				</el-form-item>
				<el-form-item label="记录次数">
					<el-input-number v-model="editForm.count" :min="1" :max="99" controls-position="right" style="width: 160px" />
				</el-form-item>
				<el-form-item label="修改后积分">
					<span class="points-preview" :class="editPreviewPoints >= 0 ? 'text-success' : 'text-danger'">
						{{ editPreviewPoints >= 0 ? '+' : '' }}{{ editPreviewPoints }} 分
					</span>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="editVisible = false">取消</el-button>
				<el-button type="primary" @click="handleSubmitEdit">保存修改</el-button>
			</template>
		</el-dialog>
	</el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { useAppStore } from '../../../store/models/app';
import { useMonitorCycle } from '../../../database/utils/useMonitorCycle';
import { useRule, isNoPointsRule, getRulePoints } from '../../../database/utils/useRule';
import { RECORD_STATUS, OPERATOR_ROLE, isPendingRecord } from '../../../database/class';
import RuleTreeSelect from '../../components/RuleTreeSelect.vue';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ 'update:visible': [value: boolean]; 'success': [] }>();

const appStore = useAppStore();
const { getCycleRecords, approveRecords, rejectRecords, updatePendingRecord } = useMonitorCycle();
const { getRuleList, getRuleGroupList } = useRule();

const dialogVisible = ref(false);
const statusFilter = ref<number | 'all'>(RECORD_STATUS.PENDING);
const cycleFilter = ref('');
const submitterFilter = ref('');
const keyword = ref('');
const selectedIds = ref<number[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);

const rules = computed(() => getRuleList(appStore.activeGrade?.id) || []);
const groups = computed(() => getRuleGroupList() || []);
const cycleList = computed(() => appStore.activeGrade?.gradeInfo?.monitorCycleList || []);
const studentList = computed(() => appStore.activeGrade?.gradeInfo?.studentList || []);

watch(() => props.visible, value => {
	dialogVisible.value = value;
	if (value) {
		currentPage.value = 1;
		selectedIds.value = [];
	}
});
watch(dialogVisible, value => emit('update:visible', value));

// ---------- 数据 ----------
interface ApprovalRow {
	id: number;
	time: string;
	cycle_id: string;
	cycle_name: string;
	student_name: string;
	rule_name: string;
	count: number;
	points: number;
	status: number;
	operator_name: string;
	operator_role: string;
	submitter_name: string;
	reject_reason: string;
}

const allRecords = computed(() => getCycleRecords());

const rows = computed<ApprovalRow[]>(() => {
	const stuName = (id: string) => studentList.value.find(s => s.id === id)?.name || id;
	const ruleName = (id: string) => rules.value.find(r => r.id === id)?.name || '主动执行';
	const cycleName = (id: string) => cycleList.value.find(c => c.id === id)?.name || '';
	const q = keyword.value.trim().toLowerCase();
	return allRecords.value
		.filter(record => statusFilter.value === 'all' || record.status === statusFilter.value)
		.filter(record => !cycleFilter.value || record.cycle_id === cycleFilter.value)
		.filter(record => !submitterFilter.value || record.submitter_name === submitterFilter.value)
		.filter(record => !q
			|| stuName(record.stu_id).toLowerCase().includes(q)
			|| record.stu_id.toLowerCase().includes(q))
		.map(record => ({
			id: record.id,
			time: record.time,
			cycle_id: record.cycle_id,
			cycle_name: cycleName(record.cycle_id),
			student_name: stuName(record.stu_id),
			rule_name: ruleName(record.rule_id),
			count: record.count || 1,
			points: record.points,
			status: record.status,
			operator_name: record.operator_name,
			operator_role: record.operator_role,
			submitter_name: record.submitter_name,
			reject_reason: record.reject_reason,
		}))
		.sort((a, b) => (a.time < b.time ? 1 : a.time > b.time ? -1 : b.id - a.id));
});

const pagedRows = computed(() => {
	const start = (currentPage.value - 1) * pageSize.value;
	return rows.value.slice(start, start + pageSize.value);
});

const submitterOptions = computed(() => {
	const names = new Set<string>();
	allRecords.value.forEach(record => { if (record.submitter_name) names.add(record.submitter_name); });
	return [...names];
});

const pendingAllCount = computed(() => allRecords.value.filter(r => isPendingRecord(r)).length);
const approvedCount = computed(() => allRecords.value.filter(r => r.status === RECORD_STATUS.APPROVED).length);
const rejectedCount = computed(() => allRecords.value.filter(r => r.status === RECORD_STATUS.REJECTED).length);

// 选中项里真正还能审批的（已终态的勾选不参与批量通过/驳回）
const selectedRows = computed(() => rows.value.filter(row => selectedIds.value.includes(row.id)));
const selectedPendingIds = computed(() => selectedRows.value.filter(row => row.status === RECORD_STATUS.PENDING).map(row => row.id));
const selectedPoints = computed(() => selectedRows.value.reduce((acc, row) => acc + row.points, 0));

const isEditedByAdmin = (row: ApprovalRow) => row.operator_role === OPERATOR_ROLE.TEACHER && !!row.submitter_name && row.operator_name === '管理员';

// 周期是否已结束：结束后审批会改动已“结算”周期的成绩，额外提醒一次
const isCycleEnded = (cycleId: string) => cycleList.value.find(c => c.id === cycleId)?.status === 1;

const singlePoints = (row: ApprovalRow) => {
	const count = row.count > 1 ? row.count : 1;
	return Number((row.points / count).toFixed(2));
};

const statusText = (status: number) => status === RECORD_STATUS.PENDING ? '待审批' : status === RECORD_STATUS.REJECTED ? '已驳回' : '已通过';
const statusTagType = (status: number) => status === RECORD_STATUS.PENDING ? 'warning' : status === RECORD_STATUS.REJECTED ? 'danger' : 'success';

const handleSelectionChange = (rowsSelected: ApprovalRow[]) => { selectedIds.value = rowsSelected.map(row => row.id); };
const handleSizeChange = (val: number) => { pageSize.value = val; currentPage.value = 1; };
const handlePageChange = (val: number) => { currentPage.value = val; };

// ---------- 审批动作 ----------
const afterAction = () => {
	emit('success');
};

const handleApprove = (row: ApprovalRow) => {
	const endedTip = isCycleEnded(row.cycle_id)
		? `\n\n注意：周期「${row.cycle_name}」已结束，通过后将改变该周期的积分成绩（若已按周期结算/发奖，结果会前后不一致）。`
		: '';
	ElMessageBox.confirm(
		`通过后将为「${row.student_name}」计入 ${row.points > 0 ? '+' : ''}${row.points} 分（规则：${row.rule_name}），确认通过？${endedTip}`,
		'审批通过',
		{ type: isCycleEnded(row.cycle_id) ? 'warning' : 'info', confirmButtonText: '确认通过', cancelButtonText: '取消' },
	).then(async () => {
		const res = await approveRecords([row.id]);
		ElMessage.success(`${res.message}，积分已入账`);
		afterAction();
	}).catch(() => { });
};

const handleBulkApprove = () => {
	const ids = selectedPendingIds.value;
	if (!ids.length) return;
	const endedCycles = [...new Set(selectedRows.value
		.filter(row => row.status === RECORD_STATUS.PENDING && isCycleEnded(row.cycle_id))
		.map(row => row.cycle_name || '未知周期'))];
	const endedTip = endedCycles.length
		? `\n\n注意：其中包含已结束周期（${endedCycles.join('、')}）的记录，通过后会改变这些周期的积分成绩。`
		: '';
	ElMessageBox.confirm(`确认通过选中的 ${ids.length} 条待审批记录？通过后积分将立即计入学生。${endedTip}`, '批量通过', {
		type: endedCycles.length ? 'warning' : 'info', confirmButtonText: '确认通过', cancelButtonText: '取消',
	}).then(async () => {
		const res = await approveRecords(ids);
		ElMessage.success(`${res.message}，合计 ${res.pointsSum > 0 ? '+' : ''}${res.pointsSum} 分`);
		afterAction();
	}).catch(() => { });
};

const handleReject = (row: ApprovalRow) => {
	ElMessageBox.prompt(`驳回「${row.student_name}」的这条记录（不会计入积分），请填写驳回理由：`, '审批驳回', {
		confirmButtonText: '确认驳回', cancelButtonText: '取消',
		inputPlaceholder: '如：记错学生 / 分值有误',
		inputValidator: (value: string) => (value && value.trim() ? true : '请填写驳回理由'),
		type: 'warning',
	}).then(async ({ value }) => {
		const res = await rejectRecords([row.id], value);
		ElMessage.success(res.message);
		afterAction();
	}).catch(() => { });
};

const handleBulkReject = () => {
	const ids = selectedPendingIds.value;
	if (!ids.length) return;
	ElMessageBox.prompt(`确认驳回选中的 ${ids.length} 条记录？请填写统一的驳回理由：`, '批量驳回', {
		confirmButtonText: '确认驳回', cancelButtonText: '取消',
		inputPlaceholder: '如：本周期不适用此规则',
		inputValidator: (value: string) => (value && value.trim() ? true : '请填写驳回理由'),
		type: 'warning',
	}).then(async ({ value }) => {
		const res = await rejectRecords(ids, value);
		ElMessage.success(res.message);
		afterAction();
	}).catch(() => { });
};

// ---------- 审批时修改 ----------
const editVisible = ref(false);
const editForm = ref<{ id: number, stu_id: string, rule_id: string, count: number, points: number | undefined }>({
	id: 0, stu_id: '', rule_id: '', count: 1, points: undefined,
});

const editRule = computed(() => rules.value.find(rule => rule.id === editForm.value.rule_id));
const editNeedsPoints = computed(() => !!editRule.value && isNoPointsRule(editRule.value));
const editSinglePoints = computed(() => {
	if (!editRule.value) {
		// 未改规则时沿用该记录原本的单次分值
		const row = rows.value.find(item => item.id === editForm.value.id);
		return row ? singlePoints(row) : 0;
	}
	const fixed = getRulePoints(editRule.value);
	return fixed === null ? Number(editForm.value.points) || 0 : fixed;
});
const editPreviewPoints = computed(() => editSinglePoints.value * editForm.value.count);

const handleEdit = (row: ApprovalRow) => {
	const record = allRecords.value.find(item => item.id === row.id);
	if (!record) return;
	const rule = rules.value.find(item => item.id === record.rule_id);
	editForm.value = {
		id: row.id,
		stu_id: record.stu_id,
		rule_id: record.rule_id,
		count: record.count || 1,
		points: isNoPointsRule(rule) ? singlePoints(row) : undefined,
	};
	editVisible.value = true;
};

const handleSubmitEdit = async () => {
	const form = editForm.value;
	if (!form.stu_id) {
		ElMessage.warning('请选择学生');
		return;
	}
	if (editNeedsPoints.value && (form.points === undefined || form.points === null)) {
		ElMessage.warning('该规则无固定分值，请填写本次分值');
		return;
	}
	const res = await updatePendingRecord(form.id, {
		stu_id: form.stu_id,
		rule_id: form.rule_id,
		count: form.count,
		points: editPreviewPoints.value,
	}, { id: '', name: '管理员' });
	if (res.success) {
		ElMessage.success(res.message);
		editVisible.value = false;
		afterAction();
	} else {
		ElMessage.warning(res.message);
	}
};

const handleClose = () => {
	dialogVisible.value = false;
};
</script>

<style scoped>
.approval-summary {
	margin-bottom: 10px;
}

.approval-filter {
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
	margin-bottom: 10px;
}

.approval-pagination {
	display: flex;
	justify-content: flex-end;
	margin-top: 10px;
}

.time-text {
	font-size: 12px;
	color: #606266;
}

.muted-text {
	color: #909399;
	font-size: 12px;
}

.text-success {
	color: #67c23a;
	font-weight: 600;
}

.text-danger {
	color: #f56c6c;
	font-weight: 600;
}

.points-preview {
	font-size: 16px;
	font-weight: 600;
}

.edit-tip {
	margin-bottom: 12px;
}

.edit-tip-text {
	margin-left: 10px;
	font-size: 12px;
	color: #909399;
}
</style>
