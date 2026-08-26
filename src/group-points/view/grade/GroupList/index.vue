<template>
	<div class="group-list-container">
		<div class="action-bar">
			<div class="operation-bar">
				<el-space>
					<el-input v-model="searchQuery" placeholder="请输入小组名或学生名搜索" class="search-input" prefix-icon="Search" />
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
				:type="currentCycle.status === 0 ? 'info' : 'warning'"
				:title="cycleTip" />
		</div>
		<div class="group-list-content">
			<GroupCard v-for="group in groupInfoList || []" :key="group.id" :group="group" @edit="handleEdit"
				@delete="handleDelete" @add-points="handleAddPoints" @subtract-points="handleSubtractPoints"
				@adjust-points="handleAdjustPoints" @mul-add-points="handleMulAddPoints"
				@mul-subtract-points="handleMulSubtractPoints" @mul-adjust-points="handleMulAdjustPoints"
				@view-records="handleViewRecords" />
		</div>

		<el-dialog :title="dialogTitle" v-model="dialogVisible" width="800px" :before-close="handleDialogClose">
			<el-form ref="formRef" :model="formData" label-width="80px" class="dialog-form">
				<el-form-item label="序号" prop="id">
					<el-input style="width: 300px;" v-model="formData.id" disabled />
				</el-form-item>
				<el-form-item label="名称" prop="name" :rules="[{ required: true, message: '请输入小组名', trigger: 'blur' }]">
					<el-input style="width: 300px;" v-model="formData.name" placeholder="请输入小组名" />
				</el-form-item>
				<el-form-item label="成员" prop="studentIdList"
					:rules="[{ required: true, message: '请选择小组成员', trigger: 'blur' }]">
					<el-transfer v-model="formData.studentIdList" filterable :filter-method="filterMethod"
						filter-placeholder="请选择小组成员" :data="studentList">
						<template #default="{ option }">
							<span>{{ option.id }} - {{ option.name }}</span>
						</template>
					</el-transfer>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="handleDialogClose">取消</el-button>
				<el-button type="primary" @click="handleSubmit">确定</el-button>
			</template>
		</el-dialog>

		<!-- 批量加减分弹窗 -->
		<BatchPointsModal v-model:visible="batchPointsVisible" :type="batchPointsType" :group="currentGroup"
			:step="Number(step)" @confirm="handleBatchPointsConfirm" />

		<!-- 规则选择弹窗 -->
		<RuleSelectorModal v-model:visible="ruleSelectorVisible" :rules="rules" :target-name="ruleTargetName"
			:type="ruleSelectorType" @confirm="handleRuleConfirm" />

		<!-- 调整排序弹窗 -->
		<SortModal v-model:visible="sortModalVisible" :defaultGroupList="groupInfoList"
			:defaultOrderByPoints="orderByPoints" @confirm="handleSortConfirm" />

		<!-- 学生记录弹窗 -->
		<el-dialog title="学生积分记录" v-model="recordDialogVisible" width="900px">
			<RecordList :student-id="selectedStudentId" />
		</el-dialog>

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
import { Plus, Sort, Edit, Delete } from '@element-plus/icons-vue';
import { RuleRecord, Student } from '../../../database/class';
import { dayjs, ElMessage, ElMessageBox, FormInstance } from 'element-plus';
import { Group, StudentGroup, Rule } from '../../../database/class';
import { useGrade } from '../../../database/utils/useGrade';
import { useRule } from '../../../database/utils/useRule';
import { useMonitorCycle } from '../../../database/utils/useMonitorCycle';
import GroupCard from './GroupCard.vue';
import BatchPointsModal from './BatchPointsModal.vue';
import RuleSelectorModal from './RuleSelectorModal.vue';
import SortModal from './SortModal.vue';
import RecordList from '../RecordList/index.vue';

export interface GroupInfo {
	id: string,
	name: string,
	points: number,
	order: number,
	studentIdList: string[];
	studentList: Student[];
}

const formRef = ref<FormInstance>();
const { updateGradeInfoById } = useGrade();

const appStore = useAppStore();
// 搜索关键词
const searchQuery = ref('');
const isEdit = ref(false);
const curGroupStuIds = ref<string[]>([]);
const dialogVisible = ref(false);

const activeGrade = computed(() => appStore.activeGrade);
const studentList = computed(() => {
	// 过滤出没有分入小组的学生
	if (appStore.activeGrade) {
		const { studentList, studentGroupList } = appStore.activeGrade.gradeInfo;
		const studentIds = [...new Set(studentGroupList.map(item => item.student_id))];
		let disabledIds = [...new Set(studentIds)];
		// 编辑的时候可以处理本组中的数据
		if (isEdit.value) {
			disabledIds = studentIds.filter(id => !curGroupStuIds.value.includes(id));
		}
		return (studentList || []).map(stu => ({ ...stu, key: stu.id, disabled: disabledIds.includes(stu.id) }))
	}
});
const groupIndex = computed(() => appStore.activeGrade?.gradeInfo?.indexMap?.group || 0);
const step = computed(() => appStore.database.basicConfig?.step || 0);

const dialogTitle = computed(() => (isEdit.value ? '编辑小组' : '新增小组'));

const cycleTip = computed(() => {
	const cycle = currentCycle.value;
	if (!cycle) return '';
	const rangeText = cycle.startTime ? `（${cycle.startTime} ~ ${cycle.endTime}）` : '';
	return cycle.status === 0
		? `当前周期「${cycle.name}」进行中${rangeText}，仅可通过规则调整积分`
		: `周期「${cycle.name}」已结束${rangeText}，仅可查看记录，无法再记分`;
});

// 批量加减分弹窗相关
const batchPointsVisible = ref(false);
const batchPointsType = ref<'add' | 'subtract'>('add');
const currentGroup = ref<GroupInfo | null>(null);

// 规则选择弹窗相关
const ruleSelectorVisible = ref(false);
const ruleSelectorType = ref<'single' | 'batch'>('single');
const ruleTargetName = ref('');
const currentStudent = ref<Student | null>(null);

// 调整排序弹窗相关
const sortModalVisible = ref(false);
const orderByPoints = ref(0);

// 学生记录弹窗相关
const recordDialogVisible = ref(false);
const selectedStudentId = ref('');

const { getRuleList } = useRule();

const rules = computed(() => getRuleList(appStore.activeGrade?.id) || []);

const formData = ref<GroupInfo>({
	id: '',
	name: '',
	points: 0,
	order: 0,
	studentIdList: [],
	studentList: [],
});

// 组装小组信息
const groupInfoList = computed(() => {
	if (appStore.activeGrade?.gradeInfo) {
		const gradeInfo = appStore.activeGrade.gradeInfo;
		const { groupList, studentList, studentGroupList, gradeConfig } = gradeInfo;
		orderByPoints.value = gradeConfig?.orderByPoints ?? 0;

		// 组装小组信息
		const formattedGroupList = groupList.map(group => {
			const groupId = group.id;
			const groupStuList = studentGroupList.filter(item => item.group_id === groupId)
				.map(item => studentList.find(student => student.id === item.student_id));
			const totalPoints = groupStuList.reduce((acc, cur) => acc + (cur?.points || 0), 0);
			return {
				id: groupId,
				name: group.name,
				points: totalPoints,
				order: group.order,
				studentIdList: groupStuList.map(stu => stu?.id || ''),
				studentList: groupStuList,
			} as GroupInfo;
		})
			.filter(group => {
				const val = searchQuery.value.toLowerCase();
				return group.name.toLowerCase().includes(val) || group.studentList.some(stu => stu.name.toLowerCase().includes(val));
			});

		if (orderByPoints.value === 1) {
			// 默认排序根据总积分 
			return (formattedGroupList || []).sort((a, b) => b.points - a.points);
		}
		// 默认排序根据排序字段 
		return (formattedGroupList || []).sort((a, b) => a.order - b.order);
	}
	return [];
});

// 搜索
const handleReset = () => {
	searchQuery.value = '';
}

const filterMethod = (query: string, item: Student) => {
	return item.name.toLowerCase().includes(query.toLowerCase())
}

// 新增
const handleAdd = () => {
	isEdit.value = false;
	formData.value = { id: `${groupIndex.value}`, name: '', points: 0, order: 0, studentIdList: [], studentList: [] };
	dialogVisible.value = true;
};

// 关闭弹窗
const handleDialogClose = () => {
	isEdit.value = false;
	dialogVisible.value = false;
};

const handleSubmit = () => {
	formRef.value?.validate(async (valid) => {
		if (valid) {
			const { id, name, studentIdList } = formData.value;
			if (isEdit.value) {
				// 编辑
				if (appStore.activeGrade) {
					// 更新小组信息
					const group = appStore.activeGrade.gradeInfo.groupList.find(item => item.id === id);
					if (group) {
						group.name = name;
					}
					// 更新学生组信息
					const studentGroupList = appStore.activeGrade.gradeInfo.studentGroupList.filter(item => item.group_id !== id);
					studentGroupList.push(...studentIdList.map(stuId => new StudentGroup({ id: `${id}-${stuId}`, group_id: id, student_id: stuId })));
					appStore.activeGrade.gradeInfo.studentGroupList = [...studentGroupList];
				}
			} else {
				// 新增
				const group = new Group({ id, name, order: 0 });
				const studentGroupList = studentIdList.map(stuId => new StudentGroup({ id: `${id}-${stuId}`, group_id: id, student_id: stuId }))
				if (appStore.activeGrade) {
					appStore.activeGrade.gradeInfo.groupList.push(group);
					appStore.activeGrade.gradeInfo.studentGroupList.push(...studentGroupList);
					appStore.activeGrade.gradeInfo.indexMap.group++;
				}
			}

			await handleUpdateGradeInfo();
			dialogVisible.value = false;
		}
	})
}

const handleUpdateGradeInfo = async () => {
	if (activeGrade.value) {
		await updateGradeInfoById(activeGrade.value.id, activeGrade.value);
	}
}

const handleEdit = (group: GroupInfo) => {
	isEdit.value = true;
	formData.value = { ...group };
	curGroupStuIds.value = group.studentIdList;
	dialogVisible.value = true;
};

const handleDelete = (group: Partial<GroupInfo>) => {
	ElMessageBox.confirm('确认删除小组：' + group.name, '删除确认', {
		type: 'warning',
		confirmButtonText: '确认',
		cancelButtonText: '取消',
	}).then(async () => {
		console.log('group:', group, appStore.activeGrade);
		const groupId = group.id || '';
		if (appStore.activeGrade) {
			// 删除小组信息和小组学生关联关系
			const { groupList, studentGroupList } = appStore.activeGrade.gradeInfo;
			appStore.activeGrade.gradeInfo.groupList = groupList.filter(item => item.id !== groupId);
			appStore.activeGrade.gradeInfo.studentGroupList = studentGroupList.filter(item => item.group_id !== groupId);
			await handleUpdateGradeInfo();
			ElMessage({
				type: 'success',
				message: `删除成功`,
			})
		}
	})
};

// ---------- 周期选择（分组管理） ----------
const {
	getMonitorCycleList, createMonitorCycle, updateMonitorCycle,
	startMonitorCycle, finishMonitorCycle, deleteMonitorCycle, autoFinishExpiredCycles,
} = useMonitorCycle();

// 是否开启周期记分
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

const handleRuleRecord = (params: { stu_id: string, points: number, rule_id?: string, count?: number }) => {
	// 记录积分变化
	if (appStore.activeGrade) {
		const { stu_id, points, rule_id, count = 1 } = params;
		const recordIndex = appStore.activeGrade.gradeInfo.indexMap.record;
		// 归入当前选中周期（未开启周期记分时 source=0 普通记录）
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
		// 仅保留最近100条记录
		// TODO 后续确定要不要做数据归档
		appStore.activeGrade.gradeInfo.recordList = appStore.activeGrade.gradeInfo.recordList.slice(-1000);
	}
}

const handleAddPoints = async (student: Student) => {
	if (!canChangePoints.value) { ElMessage.warning('请先选择未结束的积分周期'); return; }
	student.points = Number(student.points) + Number(step.value);
	// 记录积分变化：对应「主动加分」默认规则
	if (appStore.activeGrade) {
		handleRuleRecord({ stu_id: student.id, points: Number(step.value), rule_id: 'ACTIVE_ADD' });
	}
	await handleUpdateGradeInfo();
	ElMessage.success(`已为「${student.name}」加 ${Number(step.value)} 分（将影响小组积分）`);
};

const handleSubtractPoints = async (student: Student) => {
	if (!canChangePoints.value) { ElMessage.warning('请先选择未结束的积分周期'); return; }
	student.points = Number(student.points) - Number(step.value);
	// 记录积分变化：对应「主动减分」默认规则
	if (appStore.activeGrade) {
		handleRuleRecord({ stu_id: student.id, points: -Number(step.value), rule_id: 'ACTIVE_SUB' });
	}
	await handleUpdateGradeInfo();
	ElMessage.success(`已为「${student.name}」减 ${Number(step.value)} 分（将影响小组积分）`);
};

const handleAdjustPoints = (student: Student) => {
	if (!canChangePoints.value) { ElMessage.warning('请先选择未结束的积分周期'); return; }
	ruleSelectorType.value = 'single';
	ruleTargetName.value = student.name;
	currentStudent.value = student;
	ruleSelectorVisible.value = true;
};

const handleMulAddPoints = (group: GroupInfo) => {
	if (!canChangePoints.value) { ElMessage.warning('请先选择未结束的积分周期'); return; }
	batchPointsType.value = 'add';
	currentGroup.value = group;
	batchPointsVisible.value = true;
};

const handleMulSubtractPoints = (group: GroupInfo) => {
	if (!canChangePoints.value) { ElMessage.warning('请先选择未结束的积分周期'); return; }
	batchPointsType.value = 'subtract';
	currentGroup.value = group;
	batchPointsVisible.value = true;
};

const handleBatchPointsConfirm = async (count: number) => {
	if (currentGroup.value) {
		// 批量调整：主动加分(+1)/减分(-1) 规则分值 × 次数
		const batchRuleId = batchPointsType.value === 'add' ? 'ACTIVE_ADD' : 'ACTIVE_SUB';
		const perPoints = batchPointsType.value === 'add' ? 1 : -1;
		const points = perPoints * count;
		currentGroup.value.studentList.forEach(student => {
			student.points = Number(student.points) + points;
			// 记录积分变化
			if (appStore.activeGrade) {
				handleRuleRecord({ stu_id: student.id, points, rule_id: batchRuleId, count });
			}
		});
		await handleUpdateGradeInfo();
		ElMessage.success(
			batchPointsType.value === 'add'
				? `成功为 ${currentGroup.value.studentList.length} 名学生各加 ${points} 分（将影响小组积分）`
				: `成功为 ${currentGroup.value.studentList.length} 名学生各减 ${Math.abs(points)} 分（将影响小组积分）`
		);
		currentGroup.value = null;
	}
};

const handleMulAdjustPoints = (group: GroupInfo) => {
	if (!canChangePoints.value) { ElMessage.warning('请先选择未结束的积分周期'); return; }
	ruleSelectorType.value = 'batch';
	ruleTargetName.value = group.name;
	currentGroup.value = group;
	ruleSelectorVisible.value = true;
};

const handleRuleConfirm = async (rule: Rule, count = 1) => {
	const points = rule.points * count;
	if (ruleSelectorType.value === 'single' && currentStudent.value) {
		// 单个学生调整
		currentStudent.value.points = Number(currentStudent.value.points) + points;
		// 记录积分变化
		if (appStore.activeGrade) {
			handleRuleRecord({ stu_id: currentStudent.value.id, points, rule_id: rule.id, count });
		}

		await handleUpdateGradeInfo();
		ElMessage.success(
			points > 0
				? `${currentStudent.value.name} 加分 ${points} 分（将影响小组积分）`
				: `${currentStudent.value.name} 减分 ${Math.abs(points)} 分（将影响小组积分）`
		);
		currentStudent.value = null;
	} else if (ruleSelectorType.value === 'batch' && currentGroup.value) {
		// 批量调整
		currentGroup.value.studentList.forEach(student => {
			student.points = Number(student.points) + points;
			// 记录积分变化
			if (appStore.activeGrade) {
				handleRuleRecord({ stu_id: student.id, points, rule_id: rule.id, count });
			}
		});
		await handleUpdateGradeInfo();
		ElMessage.success(
			points > 0
				? `成功为 ${currentGroup.value.studentList.length} 名学生各加 ${points} 分（将影响小组积分）`
				: `成功为 ${currentGroup.value.studentList.length} 名学生各减 ${Math.abs(points)} 分（将影响小组积分）`
		);
	}
};

const handleSort = () => {
	sortModalVisible.value = true;
};

const handleViewRecords = (student: Student) => {
	selectedStudentId.value = student.id;
	recordDialogVisible.value = true;
};

const handleSortConfirm = async (prams: { orderByPoints: number, groupList: string[] }) => {
	const { orderByPoints: orderByPointsValue, groupList } = prams;
	if (appStore.activeGrade) {
		const gradeInfo = appStore.activeGrade.gradeInfo;
		gradeInfo.gradeConfig.orderByPoints = orderByPointsValue;
		orderByPoints.value = orderByPointsValue
		if (orderByPointsValue === 0) {
			gradeInfo.groupList.forEach(group => {
				group.order = groupList.indexOf(group.id) + 1;
			});
		}
		await handleUpdateGradeInfo();
	}
	ElMessage.success(`成功调整排序`);
	currentGroup.value = null;
};

</script>

<style scoped>
.group-list-container {
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
}

.text-muted {
	color: #909399;
}

.group-list-content {
	padding: 10px;
	flex: 1 1;
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	overflow-y: auto;
}
</style>