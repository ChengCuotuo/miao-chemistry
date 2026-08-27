<template>
	<div class="team-list-container">
		<div class="action-bar">
			<div class="operation-bar">
				<el-space>
					<el-input v-model="searchQuery" placeholder="请输入小组名或成员名搜索" class="search-input" prefix-icon="Search" />
					<el-button type="info" @click="handleReset">重置</el-button>
					<el-button type="success" :icon="Sort" @click="handleSort">调整排序</el-button>
					<el-button type="primary" :icon="Plus" @click="handleAdd">新增小组</el-button>
				</el-space>
			</div>
			<el-space v-if="monitorEnabled">
				<span class="label-text">积分周期：</span>
				<el-select v-model="selectedCycleId" placeholder="请选择周期" style="width: 200px">
					<el-option v-for="cycle in cycleList" :key="cycle.id" :label="cycle.name" :value="cycle.id">
						<span style="float: left">{{ cycle.name }}<span v-if="cycle.startTime" class="cycle-range">（{{
							cycle.startTime }} ~ {{ cycle.endTime }}）</span></span>
						<span style="float: right; font-size: 12px;" :class="cycle.status === 0 ? 'text-success' : 'text-muted'">
							{{ cycle.status === 0 ? '进行中' : '已结束' }}
						</span>
					</el-option>
				</el-select>
				<el-button type="primary" :icon="Plus" @click="handleAddCycle">新增周期</el-button>
				<el-button v-if="currentCycle" :icon="Edit" circle @click="handleEditCycle" />
				<el-button v-if="currentCycle && currentCycle.status === 0" type="warning" plain
					@click="handleFinishCycle">结束周期</el-button>
				<el-button v-if="currentCycle && currentCycle.status === 1" type="success" plain
					@click="handleStartCycle">重新开始</el-button>
				<el-button v-if="currentCycle && currentCycle.status === 0" type="danger" :icon="Delete" circle
					@click="handleDeleteCycle" />
			</el-space>
			<!-- 当前周期说明 -->
			<el-alert v-if="currentCycle && monitorEnabled" :closable="false" class="cycle-tip"
				:type="currentCycle.status === 0 ? 'info' : 'warning'" :title="cycleTip" />
		</div>
		<div class="team-list-content">
			<TeamCard v-for="team in teamInfoList || []" :key="team.id" :team="team" @edit="handleEdit"
				@delete="handleDelete" @add-points="handleAddPoints" @subtract-points="handleSubtractPoints"
				@adjust-points="handleAdjustPoints" @view-records="handleViewRecords"
				@member-add-points="handleMemberAddPoints" @member-subtract-points="handleMemberSubtractPoints"
				@member-adjust-points="handleMemberAdjustPoints" @member-view-records="handleStudentViewRecords" />
		</div>

		<!-- 新增/编辑小组弹窗 -->
		<el-dialog :title="dialogTitle" v-model="dialogVisible" width="800px" :before-close="handleDialogClose">
			<el-form ref="formRef" :model="formData" label-width="80px" class="dialog-form">
				<el-form-item label="序号" prop="id">
					<el-input style="width: 300px;" v-model="formData.id" disabled />
				</el-form-item>
				<el-form-item label="名称" prop="name" :rules="[{ required: true, message: '请输入小组名', trigger: 'blur' }]">
					<el-input style="width: 300px;" v-model="formData.name" placeholder="请输入小组名" />
				</el-form-item>
				<el-form-item label="成员" prop="memberIdList">
					<el-transfer v-model="formData.memberIdList" filterable :filter-method="filterMethod"
						filter-placeholder="请选择小组成员" :data="studentTransferList">
						<template #default="{ option }">
							<span>{{ option.id }} - {{ option.name }}</span>
						</template>
					</el-transfer>
					<div class="form-tip">成员仅用于展示分组构成；成员的加减分只影响个人积分，不影响小组分数</div>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="handleDialogClose">取消</el-button>
				<el-button type="primary" @click="handleSubmit">确定</el-button>
			</template>
		</el-dialog>

		<!-- 按规则调整小组积分弹窗 -->
		<el-dialog title="根据规则调整小组积分" v-model="ruleDialogVisible" width="500px">
			<el-form label-width="100px">
				<el-form-item label="小组名称">
					<el-tag type="info">{{ currentTeam?.name }}</el-tag>
				</el-form-item>
				<el-form-item label="选择规则">
					<el-select v-model="ruleForm.ruleId" placeholder="请选择规则" style="width: 100%" filterable
						:disabled="rules.length === 0">
						<el-option v-for="rule in rules" :key="rule.id"
							:label="`${rule.name} (${rule.points > 0 ? '+' : ''}${rule.points}分)`" :value="rule.id" />
					</el-select>
				</el-form-item>
				<el-form-item label="规则描述">
					<el-input :value="selectedRule?.description || ''" disabled type="textarea" :rows="3" />
				</el-form-item>
				<el-form-item label="记录次数">
					<el-input-number v-model="ruleForm.count" :min="1" :max="99" controls-position="right"
						style="width: 160px" />
					<span class="count-tip">积分 = 规则分值 × 次数</span>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="ruleDialogVisible = false">取消</el-button>
				<el-button type="primary" :disabled="rules.length === 0" @click="handleRuleConfirm">确定</el-button>
			</template>
		</el-dialog>

		<!-- 小组积分记录弹窗 -->
		<el-dialog :title="`小组积分记录 - ${recordTeamName}`" v-model="recordDialogVisible" width="800px">
			<el-table :data="teamRecords" border>
				<el-table-column label="规则名称" prop="rule_name" />
				<el-table-column label="积分变化" width="200">
					<template #default="scope">
						<span :class="scope.row.points > 0 ? 'text-success' : 'text-danger'">
							{{ scope.row.points > 0 ? '+' : '' }}{{ scope.row.points }} 分
						</span>
						<template v-if="scope.row.count > 1">
							<span class="count-badge"> × {{ scope.row.count }} 次</span>
						</template>
					</template>
				</el-table-column>
				<el-table-column v-if="monitorEnabled" label="周期" width="110">
					<template #default="scope">
						<span v-if="getCycleNameByRecord(scope.row)">{{ getCycleNameByRecord(scope.row) }}</span>
						<span v-else class="text-muted">—</span>
					</template>
				</el-table-column>
				<el-table-column label="时间" prop="time" width="180" />
			</el-table>
		</el-dialog>

		<!-- 成员按规则调整弹窗（复用关联分组的规则选择） -->
		<RuleSelectorModal v-model:visible="memberRuleVisible" :rules="rules" :target-name="memberRuleTargetName"
			type="single" @confirm="handleMemberRuleConfirm" />

		<!-- 成员个人积分记录弹窗 -->
		<el-dialog title="学生积分记录" v-model="studentRecordDialogVisible" width="900px">
			<RecordList :student-id="selectedStudentId" />
		</el-dialog>

		<!-- 调整排序弹窗 -->
		<SortModal v-model:visible="sortModalVisible" :defaultGroupList="teamInfoList"
			:defaultOrderByPoints="teamOrderByPoints" @confirm="handleSortConfirm" />

		<!-- 周期新增/编辑弹窗 -->
		<el-dialog :title="isEditCycle ? '编辑周期' : '新增周期'" v-model="cycleDialogVisible" width="440px">
			<el-form ref="cycleFormRef" :model="cycleForm" label-width="90px">
				<el-form-item label="周期名称" prop="name" :rules="[{ required: true, message: '请输入周期名称', trigger: 'blur' }]">
					<el-input v-model="cycleForm.name" placeholder="如：第一周、第二周" />
				</el-form-item>
				<el-form-item label="时间范围" prop="range" :rules="[{ required: true, message: '请选择周期时间范围', trigger: 'change' }]">
					<el-date-picker v-model="cycleForm.range" type="daterange" value-format="YYYY-MM-DD" range-separator="至"
						start-placeholder="开始日期" end-placeholder="结束日期" style="width: 100%" :clearable="true"
						:disabled-date="disabledOverlapDate" />
					<div class="form-tip">时间范围不可与其他周期重叠</div>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="cycleDialogVisible = false">取消</el-button>
				<el-button type="primary" @click="handleCycleSubmit">确定</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { useAppStore } from '../../../store/models/app';
import { Plus, Edit, Delete, Sort } from '@element-plus/icons-vue';
import { Team, TeamRecord, Student, RuleRecord, Rule } from '../../../database/class';
import { dayjs, ElMessage, ElMessageBox, FormInstance } from 'element-plus';
import { useGrade } from '../../../database/utils/useGrade';
import { useRule } from '../../../database/utils/useRule';
import { useMonitorCycle } from '../../../database/utils/useMonitorCycle';
import TeamCard from './TeamCard.vue';
import SortModal from '../GroupList/SortModal.vue';
import RuleSelectorModal from '../GroupList/RuleSelectorModal.vue';
import RecordList from '../RecordList/index.vue';

export interface TeamInfo {
	id: string;
	name: string;
	points: number;
	order: number;
	memberIdList: string[];
	memberList: Student[];
}

const formRef = ref<FormInstance>();
const { updateGradeInfoById } = useGrade();
const { getRuleList } = useRule();
const {
	getMonitorCycleList, createMonitorCycle, updateMonitorCycle,
	startMonitorCycle, finishMonitorCycle, deleteMonitorCycle, autoFinishExpiredCycles,
} = useMonitorCycle();

const appStore = useAppStore();
const searchQuery = ref('');
const isEdit = ref(false);
const curTeamStuIds = ref<string[]>([]);
const dialogVisible = ref(false);

const activeGrade = computed(() => appStore.activeGrade);
const step = computed(() => appStore.database.basicConfig?.step || 0);
const teamIndex = computed(() => appStore.activeGrade?.gradeInfo?.indexMap?.team || 0);

const dialogTitle = computed(() => (isEdit.value ? '编辑小组' : '新增小组'));

const rules = computed(() => getRuleList(appStore.activeGrade?.id) || []);

// 调整排序弹窗相关
const sortModalVisible = ref(false);
const teamOrderByPoints = ref(0);

const formData = ref<TeamInfo>({
	id: '',
	name: '',
	points: 0,
	order: 0,
	memberIdList: [],
	memberList: [],
});

// 成员穿梭框数据源：已被其他独立小组选择的学生置灰，不可重复选择（编辑时保留本组成员）
const studentTransferList = computed(() => {
	if (!appStore.activeGrade) return [];
	const { studentList, teamList } = appStore.activeGrade.gradeInfo;
	const assignedIds = new Set(teamList.flatMap(item => item.memberIdList));
	return studentList.map(stu => {
		let disabled = assignedIds.has(stu.id);
		if (isEdit.value) {
			disabled = assignedIds.has(stu.id) && !curTeamStuIds.value.includes(stu.id);
		}
		return { ...stu, key: stu.id, disabled };
	});
});

// 组装独立分组信息
const teamInfoList = computed(() => {
	if (appStore.activeGrade?.gradeInfo) {
		const { teamList, studentList } = appStore.activeGrade.gradeInfo;
		teamOrderByPoints.value = appStore.activeGrade.gradeInfo.gradeConfig?.teamOrderByPoints ?? 0;
		const list = teamList.map(team => {
			const memberList = team.memberIdList
				.map(id => studentList.find(student => student.id === id))
				.filter(Boolean) as Student[];
			return {
				id: team.id,
				name: team.name,
				points: team.points,
				order: team.order,
				memberIdList: team.memberIdList,
				memberList,
			} as TeamInfo;
		});
		const val = searchQuery.value.toLowerCase();
		const filtered = list
			.filter(team => team.name.toLowerCase().includes(val)
				|| team.memberList.some(member => member.name.toLowerCase().includes(val)));
		// 根据总积分排序，否则根据排序字段
		if (teamOrderByPoints.value === 1) {
			return filtered.sort((a, b) => b.points - a.points);
		}
		return filtered.sort((a, b) => a.order - b.order);
	}
	return [];
});

const filterMethod = (query: string, item: Student) => {
	return item.name.toLowerCase().includes(query.toLowerCase());
};

const findTeam = (teamId: string) => {
	return appStore.activeGrade?.gradeInfo.teamList.find(item => item.id === teamId);
};

const handleUpdateGradeInfo = async () => {
	if (activeGrade.value) {
		await updateGradeInfoById(activeGrade.value.id, activeGrade.value);
	}
};

// 记录小组积分变化（归入当前选中周期，未开启周期记分时 source=0 普通记录）
const handleTeamRecord = (params: { team_id: string, points: number, rule_id?: string, count?: number }) => {
	if (appStore.activeGrade) {
		const { team_id, points, rule_id, count = 1 } = params;
		const recordIndex = appStore.activeGrade.gradeInfo.indexMap.teamRecord;
		const cycle = monitorEnabled.value ? currentCycle.value : null;
		const record = new TeamRecord({
			id: recordIndex,
			team_id,
			rule_id,
			points,
			time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
			source: cycle ? 1 : 0,
			cycle_id: cycle ? cycle.id : '',
			count,
		});
		appStore.activeGrade.gradeInfo.indexMap.teamRecord++;
		appStore.activeGrade.gradeInfo.teamRecordList.push(record);
		appStore.activeGrade.gradeInfo.teamRecordList = appStore.activeGrade.gradeInfo.teamRecordList.slice(-1000);
	}
};

// 记录学生积分变化（成员个人积分，写 recordList，与关联分组一致）
const handleStudentRecord = (params: { stu_id: string, points: number, rule_id?: string, count?: number }) => {
	if (appStore.activeGrade) {
		const { stu_id, points, rule_id, count = 1 } = params;
		const recordIndex = appStore.activeGrade.gradeInfo.indexMap.record;
		const cycle = monitorEnabled.value ? currentCycle.value : null;
		const ruleRecord = new RuleRecord({
			id: recordIndex,
			stu_id,
			rule_id,
			points,
			time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
			source: cycle ? 1 : 0,
			cycle_id: cycle ? cycle.id : '',
			count,
		});
		appStore.activeGrade.gradeInfo.indexMap.record++;
		appStore.activeGrade.gradeInfo.recordList.push(ruleRecord);
		appStore.activeGrade.gradeInfo.recordList = appStore.activeGrade.gradeInfo.recordList.slice(-1000);
	}
};

const handleReset = () => {
	searchQuery.value = '';
};

const handleAdd = () => {
	isEdit.value = false;
	curTeamStuIds.value = [];
	formData.value = { id: `${teamIndex.value}`, name: '', points: 0, order: 0, memberIdList: [], memberList: [] };
	dialogVisible.value = true;
};

const handleDialogClose = () => {
	isEdit.value = false;
	dialogVisible.value = false;
};

const handleSubmit = () => {
	formRef.value?.validate(async (valid) => {
		if (valid) {
			const { id, name, memberIdList } = formData.value;
			if (isEdit.value) {
				const team = findTeam(id);
				if (team) {
					team.name = name;
					team.memberIdList = [...memberIdList];
				}
			} else {
				const team = new Team({ id, name, order: 0, points: 0, memberIdList: [...memberIdList] });
				if (appStore.activeGrade) {
					appStore.activeGrade.gradeInfo.teamList.push(team);
					appStore.activeGrade.gradeInfo.indexMap.team++;
				}
			}
			await handleUpdateGradeInfo();
			dialogVisible.value = false;
		}
	});
};

const handleEdit = (team: TeamInfo) => {
	isEdit.value = true;
	formData.value = { ...team, memberIdList: [...team.memberIdList] };
	curTeamStuIds.value = [...team.memberIdList];
	dialogVisible.value = true;
};

const handleDelete = (team: TeamInfo) => {
	ElMessageBox.confirm(`确认删除小组「${team.name}」？删除后该小组及其积分记录将一并删除，不影响组内成员分数。`, '删除确认', {
		type: 'warning',
		confirmButtonText: '确认',
		cancelButtonText: '取消',
	}).then(async () => {
		const teamId = team.id;
		if (appStore.activeGrade) {
			const { teamList, teamRecordList } = appStore.activeGrade.gradeInfo;
			appStore.activeGrade.gradeInfo.teamList = teamList.filter(item => item.id !== teamId);
			appStore.activeGrade.gradeInfo.teamRecordList = teamRecordList.filter(item => item.team_id !== teamId);
			await handleUpdateGradeInfo();
			ElMessage({ type: 'success', message: '删除成功' });
		}
	}).catch(() => { });
};

// 调整排序
const handleSort = () => {
	sortModalVisible.value = true;
};

const handleSortConfirm = async (params: { orderByPoints: number, groupList: string[] }) => {
	const { orderByPoints: orderByPointsValue, groupList } = params;
	if (appStore.activeGrade) {
		const gradeInfo = appStore.activeGrade.gradeInfo;
		gradeInfo.gradeConfig.teamOrderByPoints = orderByPointsValue;
		teamOrderByPoints.value = orderByPointsValue;
		if (orderByPointsValue === 0) {
			gradeInfo.teamList.forEach(team => {
				team.order = groupList.indexOf(team.id) + 1;
			});
		}
		await handleUpdateGradeInfo();
	}
	ElMessage.success('成功调整排序');
};

// ---------- 周期选择（与关联分组共用同一份周期数据） ----------
const monitorEnabled = computed(() => appStore.database.basicConfig?.moduleVisibility?.monitorManage ?? true);
const cycleList = computed(() => getMonitorCycleList());
const selectedCycleId = ref('');
const currentCycle = computed(() => cycleList.value.find(item => item.id === selectedCycleId.value));

// 默认选中未结束的周期
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

// 进入页面时自动结束已过期的进行中周期
onMounted(async () => {
	const count = await autoFinishExpiredCycles();
	if (count > 0) {
		syncSelectedCycle();
	}
});

const cycleTip = computed(() => {
	const cycle = currentCycle.value;
	if (!cycle) return '';
	const rangeText = cycle.startTime ? `（${cycle.startTime} ~ ${cycle.endTime}）` : '';
	return cycle.status === 0
		? `当前周期「${cycle.name}」进行中${rangeText}`
		: `周期「${cycle.name}」已结束${rangeText}，仅可查看记录，无法再记分`;
});

// 当前是否可记分：未开启周期记分时恒可记分；开启时需选中未结束且未过期的周期
const canChangePoints = computed(() => {
	if (!monitorEnabled.value) return true;
	const cycle = currentCycle.value;
	if (!cycle || cycle.status !== 0) return false;
	const today = dayjs().format('YYYY-MM-DD');
	if (cycle.endTime && today > cycle.endTime) return false;
	if (cycle.startTime && today < cycle.startTime) return false;
	return true;
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

// 已被其他周期占用的日期区间
const occupiedRanges = computed(() => {
	const ranges: { start: string, end: string, id: string }[] = [];
	cycleList.value.forEach(cycle => {
		if (cycle.id === cycleForm.value.id) return;
		if (cycle.startTime && cycle.endTime) ranges.push({ start: cycle.startTime, end: cycle.endTime, id: cycle.id });
	});
	return ranges;
});

const disabledOverlapDate = (date: Date) => {
	const dateStr = dayjs(date).format('YYYY-MM-DD');
	return occupiedRanges.value.some(range => dateStr >= range.start && dateStr <= range.end);
};

const checkRangeOverlap = (selfId: string, startTime: string, endTime: string): string | null => {
	if (!startTime || !endTime) return null;
	const conflict = cycleList.value.find(cycle => {
		if (cycle.id === selfId) return false;
		if (!cycle.startTime || !cycle.endTime) return false;
		return startTime <= cycle.endTime && cycle.startTime <= endTime;
	});
	return conflict ? conflict.name : null;
};

const handleCycleSubmit = () => {
	cycleFormRef.value?.validate(async (valid) => {
		if (!valid) return;
		const { id, name, range } = cycleForm.value;
		if (!range || !Array.isArray(range) || range.length !== 2 || !range[0] || !range[1]) {
			ElMessage.warning('请选择周期时间范围');
			return;
		}
		const [startTime = '', endTime = ''] = range;
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

const handleAddPoints = async (team: TeamInfo) => {
	if (!canChangePoints.value) { ElMessage.warning('请先选择未结束的积分周期'); return; }
	const target = findTeam(team.id);
	if (!target) return;
	const stepNum = Number(step.value);
	target.points = Number(target.points) + stepNum;
	handleTeamRecord({ team_id: team.id, points: stepNum, rule_id: 'ACTIVE_ADD' });
	await handleUpdateGradeInfo();
	ElMessage.success(`小组「${team.name}」加 ${stepNum} 分（仅影响小组积分，不影响成员）`);
};

const handleSubtractPoints = async (team: TeamInfo) => {
	if (!canChangePoints.value) { ElMessage.warning('请先选择未结束的积分周期'); return; }
	const target = findTeam(team.id);
	if (!target) return;
	const stepNum = Number(step.value);
	target.points = Number(target.points) - stepNum;
	handleTeamRecord({ team_id: team.id, points: -stepNum, rule_id: 'ACTIVE_SUB' });
	await handleUpdateGradeInfo();
	ElMessage.success(`小组「${team.name}」减 ${stepNum} 分（仅影响小组积分，不影响成员）`);
};

// 按规则调整
const ruleDialogVisible = ref(false);
const ruleForm = ref({ ruleId: '', count: 1 });

// 当前选中的规则（用于展示规则描述）
const selectedRule = computed(() => rules.value.find(rule => rule.id === ruleForm.value.ruleId));
const currentTeam = ref<TeamInfo | null>(null);

const handleAdjustPoints = (team: TeamInfo) => {
	if (!canChangePoints.value) { ElMessage.warning('请先选择未结束的积分周期'); return; }
	ruleForm.value = { ruleId: '', count: 1 };
	currentTeam.value = team;
	ruleDialogVisible.value = true;
};

const handleRuleConfirm = async () => {
	if (!currentTeam.value) return;
	const rule = rules.value.find(item => item.id === ruleForm.value.ruleId);
	if (!rule) {
		ElMessage.warning('请选择规则');
		return;
	}
	const target = findTeam(currentTeam.value.id);
	if (!target) return;
	const points = rule.points * ruleForm.value.count;
	target.points = Number(target.points) + points;
	handleTeamRecord({ team_id: target.id, points, rule_id: rule.id, count: ruleForm.value.count });
	await handleUpdateGradeInfo();
	ElMessage.success(points > 0 ? `小组加分 ${points} 分（仅影响小组积分，不影响成员）` : `小组减分 ${Math.abs(points)} 分（仅影响小组积分，不影响成员）`);
	ruleDialogVisible.value = false;
	currentTeam.value = null;
};

// 小组积分记录
const recordDialogVisible = ref(false);
const recordTeamId = ref('');

const recordTeamName = computed(() => {
	const team = appStore.activeGrade?.gradeInfo.teamList.find(item => item.id === recordTeamId.value);
	return team?.name || '';
});

const getRuleName = (ruleId: string) => {
	const rule = appStore.database.ruleList.find(item => item.id === ruleId);
	return rule?.name || '主动执行';
};

// 根据记录反查所属周期名：优先 source=1 的 cycle_id，否则按记录时间匹配周期时间范围
const getCycleNameByRecord = (record: TeamRecord): string => {
	if (record.source === 1 && record.cycle_id) {
		return cycleList.value.find(item => item.id === record.cycle_id)?.name || '';
	}
	if (!record.time) return '';
	const date = record.time.slice(0, 10);
	const cycle = cycleList.value.find(c =>
		c.startTime && c.endTime && date >= c.startTime && date <= c.endTime
	);
	return cycle?.name || '';
};

const teamRecords = computed(() => {
	const list = appStore.activeGrade?.gradeInfo.teamRecordList || [];
	return list
		.filter(record => record.team_id === recordTeamId.value)
		.map(record => ({ ...record, rule_name: getRuleName(record.rule_id) }))
		.reverse();
});

const handleViewRecords = (team: TeamInfo) => {
	recordTeamId.value = team.id;
	recordDialogVisible.value = true;
};

// ---------- 成员个人积分操作（与关联分组一致，只影响个人，不影响小组） ----------
const memberRuleVisible = ref(false);
const memberRuleTargetName = ref('');
const currentStudent = ref<Student | null>(null);

const handleMemberAddPoints = async (student: Student) => {
	if (!canChangePoints.value) { ElMessage.warning('请先选择未结束的积分周期'); return; }
	student.points = Number(student.points) + Number(step.value);
	handleStudentRecord({ stu_id: student.id, points: Number(step.value), rule_id: 'ACTIVE_ADD' });
	await handleUpdateGradeInfo();
	ElMessage.success(`已为「${student.name}」加 ${Number(step.value)} 分（不影响小组积分）`);
};

const handleMemberSubtractPoints = async (student: Student) => {
	if (!canChangePoints.value) { ElMessage.warning('请先选择未结束的积分周期'); return; }
	student.points = Number(student.points) - Number(step.value);
	handleStudentRecord({ stu_id: student.id, points: -Number(step.value), rule_id: 'ACTIVE_SUB' });
	await handleUpdateGradeInfo();
	ElMessage.success(`已为「${student.name}」减 ${Number(step.value)} 分（不影响小组积分）`);
};

const handleMemberAdjustPoints = (student: Student) => {
	if (!canChangePoints.value) { ElMessage.warning('请先选择未结束的积分周期'); return; }
	memberRuleTargetName.value = student.name;
	currentStudent.value = student;
	memberRuleVisible.value = true;
};

const handleMemberRuleConfirm = async (rule: Rule, count = 1) => {
	if (!currentStudent.value) return;
	const points = rule.points * count;
	currentStudent.value.points = Number(currentStudent.value.points) + points;
	handleStudentRecord({ stu_id: currentStudent.value.id, points, rule_id: rule.id, count });
	await handleUpdateGradeInfo();
	ElMessage.success(points > 0 ? `${currentStudent.value.name} 加分 ${points} 分（不影响小组积分）` : `${currentStudent.value.name} 减分 ${Math.abs(points)} 分（不影响小组积分）`);
	currentStudent.value = null;
};

// 成员个人积分记录弹窗
const studentRecordDialogVisible = ref(false);
const selectedStudentId = ref('');

const handleStudentViewRecords = (student: Student) => {
	selectedStudentId.value = student.id;
	studentRecordDialogVisible.value = true;
};
</script>

<style scoped>
.team-list-container {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
}

.action-bar {
	display: flex;
	gap: 10px;
	flex-direction: column;
	margin-bottom: 20px;
}

.operation-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.search-input {
	width: 200px;
}

.label-text {
	font-weight: 600;
}

.cycle-range {
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

.text-success {
	color: #67c23a;
	font-weight: 600;
}

.text-muted {
	color: #909399;
}

.team-list-content {
	padding: 10px;
	flex: 1 1;
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	overflow-y: auto;
}

.count-tip {
	margin-left: 10px;
	font-size: 12px;
	color: #909399;
}

.text-danger {
	color: #f56c6c;
	font-weight: 600;
}

.count-badge {
	color: #909399;
}
</style>
