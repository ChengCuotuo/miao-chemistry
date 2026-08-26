<template>
	<div class="monitor-list-container">
		<!-- 顶部：周期选择与管理 -->
		<div class="action-bar">
			<el-space>
				<span class="label-text">积分周期：</span>
				<el-select v-model="selectedCycleId" placeholder="请选择周期" style="width: 200px">
					<el-option v-for="cycle in cycleList" :key="cycle.id" :label="cycle.name" :value="cycle.id">
						<span style="float: left">{{ cycle.name }}<span v-if="cycle.startTime" class="cycle-range">（{{ cycle.startTime }} ~ {{ cycle.endTime }}）</span></span>
						<span style="float: right; font-size: 12px;" :class="cycle.status === 0 ? 'text-success' : 'text-muted'">
							{{ cycle.status === 0 ? '进行中' : '已结束' }}
						</span>
					</el-option>
				</el-select>
				<el-button v-if="!isMonitor" type="primary" :icon="Plus" @click="handleAddCycle">新增周期</el-button>
				<el-button v-if="!isMonitor && currentCycle" :icon="Edit" circle @click="handleEditCycle" />
				<el-button v-if="!isMonitor && currentCycle && currentCycle.status === 0" type="warning" plain @click="handleFinishCycle">结束周期</el-button>
				<el-button v-if="!isMonitor && currentCycle && currentCycle.status === 1" type="success" plain @click="handleStartCycle">重新开始</el-button>
				<el-button v-if="!isMonitor && currentCycle && currentCycle.status === 0" type="danger" :icon="Delete" circle @click="handleDeleteCycle" />
			</el-space>
			<el-space>
				<el-button :icon="Document" @click="handleViewRecords">周期记录</el-button>
				<el-button v-if="!isMonitor" :icon="UserFilled" type="success" @click="handleManageAccounts">班委账号</el-button>
			</el-space>
		</div>

		<div v-if="cycleList.length === 0" class="empty-wrap">
			<el-empty :description="isMonitor ? '暂无进行中的周期' : '暂无周期，请先新增周期（如：第一周、第二周）'" />
		</div>

		<template v-else>
			<!-- 当前周期说明 -->
			<el-alert v-if="currentCycle" :closable="false" class="cycle-tip"
				:type="currentCycle.status === 0 ? 'info' : 'warning'"
				:title="cycleTip" />

			<!-- 内容区：按组记录 + 按学生记录 -->
			<div class="content-area">
				<!-- 左侧：按组记录 -->
				<div class="group-section" v-if="moduleVisibility.groupManage">
					<div class="section-title">按组记录</div>
					<div class="group-list">
						<el-collapse v-model="expandedGroups">
							<el-collapse-item v-for="group in groupInfoList" :key="group.id" :name="group.id">
								<template #title>
									<div class="group-header">
										<span class="group-name">{{ group.name }}</span>
										<el-tag size="small" type="info">{{ group.studentList.length }} 人</el-tag>
										<el-button style="margin-left: auto;" type="warning" size="small" :icon="Ticket"
											:disabled="!canRecord" @click.stop="handleGroupRecord(group)">记分</el-button>
									</div>
								</template>
								<div class="member-tags">
									<el-tag v-for="stu in group.studentList" :key="stu.id" class="member-tag"
										:type="stu.points >= 0 ? 'success' : 'danger'" size="small">
										{{ stu.name }} {{ stu.points }}
									</el-tag>
								</div>
							</el-collapse-item>
						</el-collapse>
						<el-empty v-if="groupInfoList.length === 0" description="暂无小组，展开分组管理中创建" :image-size="60" />
					</div>
				</div>

				<!-- 右侧：按学生记录 -->
				<div class="student-section">
					<div class="section-title">按学生记录</div>
					<div class="student-toolbar">
						<el-input v-model="searchQuery" placeholder="搜索学生姓名/ID" clearable :prefix-icon="Search" class="search-input" />
						<el-button type="warning" :icon="Ticket" :disabled="!canRecord || !selectedStudentIds.length"
							@click="handleStudentRecord">记分</el-button>
						<el-button v-if="selectedStudentIds.length" type="info" @click="clearSelection">取消选择({{ selectedStudentIds.length }})</el-button>
					</div>
				<div class="table-wrap">
					<el-table ref="studentTableRef" :data="pagedStudents" border height="100%" @selection-change="handleSelectionChange">
						<el-table-column type="selection" width="45" />
						<el-table-column prop="id" label="ID" width="60" align="center" />
						<el-table-column prop="name" label="姓名" min-width="100" align="center" />
						<el-table-column prop="points" label="积分" min-width="80" align="center" sortable>
							<template #default="scope">
								<span :class="scope.row.points >= 0 ? 'text-success' : 'text-danger'">{{ scope.row.points }}</span>
							</template>
						</el-table-column>
						<el-table-column label="操作" min-width="100" align="center">
							<template #default="scope">
								<el-button size="small" type="warning" :icon="Ticket" circle :disabled="!canRecord" @click="handleSingleRecord(scope.row)" />
								<el-button size="small" type="info" :icon="View" circle @click="handleViewDetail(scope.row)" />
							</template>
						</el-table-column>
					</el-table>
				</div>
				<div class="pagination">
						<el-pagination @size-change="handleSizeChange" @current-change="handlePageChange"
							:current-page="currentPage" :page-sizes="[10, 30, 60]" :page-size="pageSize"
							layout="total, sizes, prev, pager, next" :total="filteredStudents.length" />
					</div>
				</div>
			</div>
		</template>

		<!-- 周期新增/编辑弹窗 -->
		<el-dialog :title="isEditCycle ? '编辑周期' : '新增周期'" v-model="cycleDialogVisible" width="440px">
			<el-form ref="cycleFormRef" :model="cycleForm" label-width="90px">
				<el-form-item label="周期名称" prop="name" :rules="[{ required: true, message: '请输入周期名称', trigger: 'blur' }]">
					<el-input v-model="cycleForm.name" placeholder="如：第一周、第二周" />
				</el-form-item>
				<el-form-item label="时间范围" prop="range" :rules="[{ required: true, message: '请选择周期时间范围', trigger: 'change' }]">
					<el-date-picker v-model="cycleForm.range" type="daterange" value-format="YYYY-MM-DD"
						range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期"
						style="width: 100%" :clearable="true" :disabled-date="disabledOverlapDate" />
					<div class="form-tip">时间范围不可与其他周期重叠</div>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="cycleDialogVisible = false">取消</el-button>
				<el-button type="primary" @click="handleCycleSubmit">确定</el-button>
			</template>
		</el-dialog>

		<!-- 规则记分弹窗（单个 / 多选 / 按组共用） -->
		<MonitorRecordModal :visible="recordModalVisible" :cycle="currentCycle" :rules="rules" :target-name="recordTarget.name"
			:student-count="recordTarget.students.length" :group-id="recordTarget.groupId || ''"
			@update:visible="handleModalVisibleChange" @confirm="handleRecordConfirm" />

		<!-- 周期记录弹窗：destroy-on-close 保证每次打开都用最新数据重新渲染 -->
		<el-dialog :title="`${currentCycle?.name || ''} - 周期记录`" v-model="recordDialogVisible" width="950px" destroy-on-close>
			<RecordList v-if="recordDialogVisible" :key="currentCycle?.id" :cycle-id="currentCycle?.id" />
		</el-dialog>

		<!-- 学生周期详情弹窗：统计当前周期内每种规则的记分次数 -->
		<el-dialog :title="`${detailStudent?.name || ''} - 周期规则统计`" v-model="detailDialogVisible" width="560px">
			<el-alert v-if="currentCycle" :closable="false" type="info" class="detail-tip"
				:title="`${currentCycle.name}${currentCycle.startTime ? `（${currentCycle.startTime} ~ ${currentCycle.endTime}）` : ''}`" />
			<el-table :data="detailStats" border max-height="420" size="small">
				<el-table-column prop="ruleName" label="规则名称" min-width="160" show-overflow-tooltip />
				<el-table-column prop="count" label="次数" width="70" align="center" sortable />
				<el-table-column label="积分合计" width="100" align="center" sortable prop="points">
					<template #default="scope">
						<span :class="scope.row.points > 0 ? 'text-success' : scope.row.points < 0 ? 'text-danger' : 'text-muted'">
							{{ scope.row.points > 0 ? '+' : '' }}{{ scope.row.points }}
						</span>
					</template>
				</el-table-column>
			</el-table>
			<el-empty v-if="detailStats.length === 0" description="当前周期暂无规则记录" :image-size="60" />
		</el-dialog>

		<!-- 班委账号管理弹窗（仅教师） -->
		<el-dialog title="班委账号管理" v-model="accountDialogVisible" width="600px" destroy-on-close>
			<div class="account-toolbar">
				<el-button type="primary" :icon="Plus" size="small" @click="handleAddAccount">新增账号</el-button>
			</div>
			<el-table :data="accountList" border size="small" max-height="360">
				<el-table-column prop="name" label="账号名" min-width="120" />
				<el-table-column label="操作" width="160" align="center">
					<template #default="scope">
						<el-button size="small" type="warning" text @click="handleResetAccountPassword(scope.row)">改密码</el-button>
						<el-button size="small" type="danger" text @click="handleDeleteAccount(scope.row)">删除</el-button>
					</template>
				</el-table-column>
			</el-table>
			<el-empty v-if="accountList.length === 0" description="暂无班委账号，请先新增" :image-size="60" />
		</el-dialog>

		<MonitorAccountDialog v-model:visible="accountFormVisible" :mode="accountFormMode"
			:account="accountFormTarget" @confirm="handleAccountConfirm" />
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAppStore } from '../../../store/models/app';
import { useMonitorCycle } from '../../../database/utils/useMonitorCycle';
import { useRule } from '../../../database/utils/useRule';
import { ElMessage, ElMessageBox, dayjs, type FormInstance } from 'element-plus';
import { Plus, Edit, Delete, Ticket, Search, Document, View, UserFilled } from '@element-plus/icons-vue';
import { Student } from '../../../database/class';
import { useMonitorAccount } from '../../../database/utils/useMonitorAccount';
import MonitorRecordModal from './MonitorRecordModal.vue';
import MonitorAccountDialog from './MonitorAccountDialog.vue';
import RecordList from '../RecordList/index.vue';

const appStore = useAppStore();
const {
	getMonitorCycleList, createMonitorCycle, updateMonitorCycle,
	startMonitorCycle, finishMonitorCycle, deleteMonitorCycle, adjustPointsByRule,
} = useMonitorCycle();
const { getRuleList } = useRule();
const { getMonitorAccountList, createMonitorAccount, updateMonitorAccountPassword, deleteMonitorAccount } = useMonitorAccount();

const rules = computed(() => getRuleList(appStore.activeGrade?.id) || []);
const isMonitor = computed(() => appStore.currentRole === 'monitor');
// 班委仅可见未结束周期；教师可见全部
const allCycleList = computed(() => getMonitorCycleList());
const cycleList = computed(() => isMonitor.value ? allCycleList.value.filter(c => c.status === 0) : allCycleList.value);
const selectedCycleId = ref('');
const currentCycle = computed(() => cycleList.value.find(item => item.id === selectedCycleId.value));

// 默认选中最新周期（或进行中的周期）
const syncSelectedCycle = () => {
	if (!cycleList.value.length) {
		selectedCycleId.value = '';
		return;
	}
	if (cycleList.value.some(item => item.id === selectedCycleId.value)) return;
	const running = cycleList.value.find(item => item.status === 0);
	selectedCycleId.value = (running || cycleList.value[cycleList.value.length - 1]).id;
};
watch(() => cycleList.value.length, () => { syncSelectedCycle(); }, { immediate: true });

const canRecord = computed(() => !!currentCycle.value && currentCycle.value.status === 0 && rules.value.length > 0);

// 模块可见性配置（默认全部展示，兼容旧数据）
const moduleVisibility = computed(() => appStore.database.basicConfig?.moduleVisibility || {
	groupManage: true,
});

const cycleTip = computed(() => {
	const cycle = currentCycle.value;
	if (!cycle) return '';
	const rangeText = cycle.startTime ? `（${cycle.startTime} ~ ${cycle.endTime}）` : '';
	return cycle.status === 0
		? `当前周期「${cycle.name}」进行中${rangeText}，仅可通过规则调整积分`
		: `周期「${cycle.name}」已结束${rangeText}，仅可查看记录，无法再记分`;
});

// ---------- 周期管理 ----------
const cycleDialogVisible = ref(false);
const isEditCycle = ref(false);
const cycleFormRef = ref<FormInstance>();
const cycleForm = ref<{ id: string, name: string, range: [string, string] | string[] | null }>({ id: '', name: '', range: null });

const handleAddCycle = () => {
	isEditCycle.value = false;
	cycleForm.value = { id: '', name: '', range: null };
	cycleDialogVisible.value = true;
};

const handleEditCycle = () => {
	if (!currentCycle.value) return;
	isEditCycle.value = true;
	cycleForm.value = { id: currentCycle.value.id, name: currentCycle.value.name, range: currentCycle.value.startTime && currentCycle.value.endTime ? [currentCycle.value.startTime, currentCycle.value.endTime] : null };
	cycleDialogVisible.value = true;
};

// 已被其他周期占用的日期区间（用于日期面板禁用）
const occupiedRanges = computed(() => {
	const ranges: { start: string, end: string, id: string }[] = [];
	cycleList.value.forEach(cycle => {
		if (cycle.id === cycleForm.value.id) return;
		if (cycle.startTime && cycle.endTime) ranges.push({ start: cycle.startTime, end: cycle.endTime, id: cycle.id });
	});
	return ranges;
});

// 禁用落在已占用区间内的日期（面板反馈；跨区间选择仍由提交时校验兜底）
const disabledOverlapDate = (date: Date) => {
	const dateStr = dayjs(date).format('YYYY-MM-DD');
	return occupiedRanges.value.some(range => dateStr >= range.start && dateStr <= range.end);
};

// 校验时间范围是否与其他周期重叠（忽略未设置范围的周期和自身）
const checkRangeOverlap = (selfId: string, startTime: string, endTime: string): string | null => {
	if (!startTime || !endTime) return null;
	const conflict = cycleList.value.find(cycle => {
		if (cycle.id === selfId) return false;
		if (!cycle.startTime || !cycle.endTime) return false;
		// 区间相交判定：startA <= endB && startB <= endA
		return startTime <= cycle.endTime && cycle.startTime <= endTime;
	});
	return conflict ? conflict.name : null;
};

const handleCycleSubmit = () => {
	cycleFormRef.value?.validate(async (valid) => {
		if (!valid) return;
		const { id, name, range } = cycleForm.value;
		// 时间范围必填：手动校验（不依赖 el-form 对日期组件的 rules）
		if (!range || !Array.isArray(range) || range.length !== 2 || !range[0] || !range[1]) {
			ElMessage.warning('请选择周期时间范围');
			return;
		}
		const [startTime = '', endTime = ''] = range;
		// 周期时间范围不能重叠
		const overlapCycle = checkRangeOverlap(id, startTime, endTime);
		if (overlapCycle) {
			ElMessage.warning(`时间范围与周期「${overlapCycle}」重叠，请调整`);
			return;
		}
		const res = id ? await updateMonitorCycle(id, name, startTime, endTime) : await createMonitorCycle(name, startTime, endTime);
		if (res) {
			ElMessage.success(id ? '周期已更新' : '周期已创建');
			cycleDialogVisible.value = false;
			syncSelectedCycle();
			if (!id) {
				// 新建后选中新周期
				const list = getMonitorCycleList();
				selectedCycleId.value = list[list.length - 1]?.id || '';
			}
		} else {
			ElMessage.error('操作失败，请重试');
		}
	});
};

const handleFinishCycle = () => {
	if (!currentCycle.value) return;
	ElMessageBox.confirm(`结束后周期「${currentCycle.value.name}」将无法再记录积分，确认结束？`, '结束周期', {
		type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消',
	}).then(async () => {
		if (await finishMonitorCycle(currentCycle.value!.id)) {
			ElMessage.success('周期已结束');
		}
	}).catch(() => { });
};

const handleStartCycle = () => {
	if (!currentCycle.value) return;
	ElMessageBox.confirm(`重新开始周期「${currentCycle.value.name}」后可继续记分（历史记录保留），确认？`, '重新开始', {
		type: 'info', confirmButtonText: '确认', cancelButtonText: '取消',
	}).then(async () => {
		if (await startMonitorCycle(currentCycle.value!.id)) {
			ElMessage.success('周期已重新开始');
		}
	}).catch(() => { });
};

const handleDeleteCycle = () => {
	if (!currentCycle.value) return;
	if (currentCycle.value.status === 1) {
		ElMessage.warning('已结束的周期不允许删除');
		return;
	}
	ElMessageBox.confirm(`删除周期「${currentCycle.value.name}」将同时删除该周期的所有积分记录，并回退学生在周期内被调整的积分，确认删除？`, '删除周期', {
		type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消',
	}).then(async () => {
		if (await deleteMonitorCycle(currentCycle.value!.id)) {
			ElMessage.success('周期已删除');
			selectedCycleId.value = '';
			syncSelectedCycle();
		}
	}).catch(() => { });
};

// ---------- 分组数据（折叠面板） ----------
// 折叠面板展开状态
const expandedGroups = ref<string[]>([]);

const groupInfoList = computed(() => {
	const gradeInfo = appStore.activeGrade?.gradeInfo;
	if (!gradeInfo) return [];
	const { groupList, studentList, studentGroupList } = gradeInfo;
	return groupList.map(group => {
		const groupStuList = studentGroupList.filter(item => item.group_id === group.id)
			.map(item => studentList.find(student => student.id === item.student_id))
			.filter(Boolean) as Student[];
		return { id: group.id, name: group.name, order: group.order, studentList: groupStuList };
	}).sort((a, b) => a.order - b.order);
});

// ---------- 学生列表 ----------
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const selectedStudentIds = ref<string[]>([]);

const filteredStudents = computed(() => {
	const list = appStore.activeGrade?.gradeInfo?.studentList || [];
	if (!searchQuery.value) return list;
	const q = searchQuery.value.toLowerCase();
	return list.filter(item => item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q));
});

const pagedStudents = computed(() => {
	const start = (currentPage.value - 1) * pageSize.value;
	return filteredStudents.value.slice(start, start + pageSize.value);
});

const handleSizeChange = (val: number) => { pageSize.value = val; currentPage.value = 1; };
const handlePageChange = (val: number) => { currentPage.value = val; };
const handleSelectionChange = (rows: Student[]) => { selectedStudentIds.value = rows.map(item => item.id); };
const studentTableRef = ref();
const clearSelection = () => {
	studentTableRef.value?.clearSelection?.();
	selectedStudentIds.value = [];
};

// ---------- 记分弹窗 ----------
const recordModalVisible = ref(false);
// 记分目标：mode- single 单个 / multiple 多选 / group 按组
const recordTarget = ref<{ mode: 'single' | 'multiple' | 'group', students: Student[], groupId?: string, name: string }>({ mode: 'single', students: [], name: '' });

const handleSingleRecord = (student: Student) => {
	recordTarget.value = { mode: 'single', students: [student], name: student.name };
	recordModalVisible.value = true;
};

const handleStudentRecord = () => {
	const list = (appStore.activeGrade?.gradeInfo?.studentList || []).filter(item => selectedStudentIds.value.includes(item.id));
	if (!list.length) return;
	recordTarget.value = { mode: 'multiple', students: list, name: `选中的 ${list.length} 名学生` };
	recordModalVisible.value = true;
};

const handleGroupRecord = (group: { id: string, name: string, studentList: Student[] }) => {
	if (!group.studentList.length) {
		ElMessage.warning('该小组暂无成员');
		return;
	}
	recordTarget.value = { mode: 'group', students: group.studentList, groupId: group.id, name: group.name };
	recordModalVisible.value = true;
};

const handleModalVisibleChange = (v: boolean) => {
	recordModalVisible.value = v;
};

const handleRecordConfirm = async (payload: { ruleId: string, count: number }) => {
	const target = recordTarget.value;
	if (!currentCycle.value || !target.students.length) return;
	const res = await adjustPointsByRule({
		cycleId: currentCycle.value.id,
		ruleId: payload.ruleId,
		students: target.students,
		groupId: target.groupId || '',
		count: payload.count,
	});
	if (res.success) {
		ElMessage.success(res.message);
	} else {
		ElMessage.warning(res.message);
	}
};

// ---------- 周期记录 ----------
const recordDialogVisible = ref(false);
const handleViewRecords = () => { recordDialogVisible.value = true; };

// ---------- 班委账号管理（仅教师） ----------
const accountDialogVisible = ref(false);
const accountFormVisible = ref(false);
const accountFormMode = ref<'add' | 'edit'>('add');
const accountFormTarget = ref<{ id: string, name: string, password: string } | undefined>(undefined);

const accountList = computed(() => getMonitorAccountList());

const handleManageAccounts = () => {
	accountDialogVisible.value = true;
};

const handleAddAccount = () => {
	accountFormMode.value = 'add';
	accountFormTarget.value = undefined;
	accountFormVisible.value = true;
};

const handleResetAccountPassword = (account: { id: string, name: string, password: string }) => {
	accountFormMode.value = 'edit';
	accountFormTarget.value = account;
	accountFormVisible.value = true;
};

const handleDeleteAccount = (account: { id: string, name: string }) => {
	ElMessageBox.confirm(`确认删除班委账号「${account.name}」？`, '删除确认', {
		type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消',
	}).then(async () => {
		const res = await deleteMonitorAccount(account.id);
		ElMessage[res.success ? 'success' : 'warning'](res.message);
	}).catch(() => { });
};

const handleAccountConfirm = async (payload: { name: string, password: string }) => {
	if (accountFormMode.value === 'add') {
		const res = await createMonitorAccount(payload.name, payload.password);
		ElMessage[res.success ? 'success' : 'warning'](res.message);
	} else if (accountFormTarget.value) {
		const res = await updateMonitorAccountPassword(accountFormTarget.value.id, payload.password);
		ElMessage[res.success ? 'success' : 'warning'](res.message);
	}
};

// ---------- 学生周期详情 ----------
const detailDialogVisible = ref(false);
const detailStudent = ref<Student | null>(null);

const handleViewDetail = (student: Student) => {
	detailStudent.value = student;
	detailDialogVisible.value = true;
};

// 当前周期内该学生每种规则的记分次数与积分合计（含 0 次规则，便于看全貌；有记录的排前面）
const detailStats = computed(() => {
	if (!currentCycle.value || !detailStudent.value) return [];
	const cycleId = currentCycle.value.id;
	const stuId = detailStudent.value.id;
	const records = (appStore.activeGrade?.gradeInfo?.recordList || []).filter(
		item => item.source === 1 && item.cycle_id === cycleId && item.stu_id === stuId
	);
	return rules.value.map(rule => {
		const ruleRecords = records.filter(item => item.rule_id === rule.id);
		return {
			ruleId: rule.id,
			ruleName: rule.name,
			count: ruleRecords.reduce((acc, cur) => acc + (cur.count || 1), 0),
			points: ruleRecords.reduce((acc, cur) => acc + cur.points, 0),
		};
	}).sort((a, b) => b.count - a.count);
});
</script>

<style scoped>
.monitor-list-container {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.action-bar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
}

.label-text {
	font-weight: 600;
}

.cycle-range {
	font-size: 12px;
	color: #909399;
}

.detail-tip {
	margin-bottom: 10px;
}

.account-toolbar {
	display: flex;
	justify-content: flex-end;
	margin-bottom: 10px;
}

.cycle-tip {
	margin-bottom: 8px;
}

.cycle-tip :deep(.el-alert__title) {
	font-size: 12px;
}

.empty-wrap {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
}

.content-area {
	flex: 1;
	min-height: 0;
	display: flex;
	gap: 14px;
	overflow: hidden;
}

.group-section {
	width: 240px;
	flex: none;
	min-height: 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.section-title {
	font-weight: 600;
	margin-bottom: 8px;
}

.group-list {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding-right: 4px;
}

.group-header {
	display: flex;
	align-items: center;
	gap: 8px;
	width: 100%;
	padding-right: 8px;
}

.group-name {
	font-weight: 600;
}

.member-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	max-height: 180px;
	overflow-y: auto;
	padding: 2px 0 4px;
}

.group-list :deep(.el-collapse) {
	--el-collapse-header-bg-color: transparent;
}

.group-list :deep(.el-collapse-item__header) {
	height: 44px;
	line-height: 44px;
}

.group-list :deep(.el-collapse-item__content) {
	padding-bottom: 10px;
}

.member-tag {
	font-weight: 500;
}

.student-section {
	flex: 1;
	min-width: 0;
	min-height: 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.student-toolbar {
	display: flex;
	gap: 10px;
	margin-bottom: 8px;
}

.search-input {
	width: 200px;
}

.table-wrap {
	flex: 1;
	min-height: 0;
	overflow: hidden;
}

.pagination {
	display: flex;
	justify-content: flex-end;
	margin-top: 8px;
}

.text-success {
	color: #67c23a;
	font-weight: 600;
}

.text-danger {
	color: #f56c6c;
	font-weight: 600;
}

.text-muted {
	color: #909399;
}

.form-tip {
	font-size: 12px;
	color: #909399;
	line-height: 1.4;
	margin-top: 4px;
}
</style>
