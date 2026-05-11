<template>
	<div class="group-list-container">
		<div class="action-bar">
			 <el-input v-model="searchQuery" placeholder="请输入小组名或学生名搜索" class="search-input" prefix-icon="Search"/>
			<el-button type="primary" :icon="Plus" @click="handleAdd">新增小组</el-button>
		</div>
		<div class="group-list-content">
			<GroupCard v-for="group in groupInfoList || []" :key="group.id" :group="group" @edit="handleEdit"
				@delete="handleDelete" @add-points="handleAddPoints" @subtract-points="handleSubtractPoints" />
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
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAppStore } from '../../../store/models/app';
import { Plus } from '@element-plus/icons-vue';
import { Student } from '../../../database/class';
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus';
import { Group, StudentGroup } from '../../../database/class';
import { useGrade } from '../../../database/utils/useGrade';
import GroupCard from './GroupCard.vue';

export interface GroupInfo {
	id: string,
	name: string,
	points: number,
	studentIdList: string[];
	studentList: Student[];
}

const formRef = ref<FormInstance>();
const { updateGradeInfoById } = useGrade();

const appStore = useAppStore();
// 搜索关键词
const searchQuery = ref('');

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
		return (studentList || []).map(stu => ({ ...stu, key: stu.id, disabled: studentIds.includes(stu.id) }))
	}
});
const groupIndex = computed(() => appStore.activeGrade?.gradeInfo?.indexMap?.group || 0);

const isEdit = ref(false);
const curGroupStuIds = ref<string[]>([]);
const dialogVisible = ref(false);
const dialogTitle = computed(() => (isEdit.value ? '编辑小组' : '新增小组'));

const formData = ref<GroupInfo>({
	id: '',
	name: '',
	points: 0,
	studentIdList: [],
	studentList: [],
});

// 组装小组信息
const groupInfoList = computed(() => {
	if (appStore.activeGrade) {
		const gradeInfo = appStore.activeGrade.gradeInfo;
		const { groupList, studentList, studentGroupList } = gradeInfo;
		// 组装小组信息
		return groupList.map(group => {
			const groupId = group.id;
			const groupStuList = studentGroupList.filter(item => item.group_id === groupId)
				.map(item => studentList.find(student => student.id === item.student_id));
			const totalPoints = groupStuList.reduce((acc, cur) => acc + (cur?.points || 0), 0);
			return {
				id: groupId,
				name: group.name,
				points: totalPoints,
				studentIdList: groupStuList.map(stu => stu?.id || ''),
				studentList: groupStuList,
			} as GroupInfo;
		})
		.filter(group => {
			const val = searchQuery.value.toLowerCase();
			return group.name.toLowerCase().includes(val) || group.studentList.some(stu => stu.name.toLowerCase().includes(val));
		})
		.sort((a, b) => b.points - a.points);
	}
	return [];
});

const filterMethod = (query: string, item: Student) => {
	return item.name.toLowerCase().includes(query.toLowerCase())
}

// 新增
const handleAdd = () => {
	isEdit.value = false;
	formData.value = { id: `${groupIndex.value}`, name: '', points: 0, studentIdList: [], studentList: [] };
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
				const group = new Group({ id, name });
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
		if(appStore.activeGrade) {
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

const handleAddPoints = (student: Student) => {
	console.log('增加积分:', student);
};

const handleSubtractPoints = (student: Student) => {
	console.log('减少积分:', student);
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
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
}

.search-input {
	width: 300px;
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