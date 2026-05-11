<template>
	<div class="student-list-container">
		<!-- 搜索和新增区域 -->
		<div class="search-bar">
			<el-input v-model="searchQuery" placeholder="请输入姓名或ID搜索" class="search-input" prefix-icon="Search"
				@keyup.enter="handleSearch" />
				<!-- TODO 批量处理 -->
			<el-button type="primary" :icon="Plus" @click="handleAdd">新增学生</el-button>
		</div>

		<!-- 学生列表 -->
		<el-table :data="filteredStudents" border>
			<el-table-column prop="id" label="序号" width="100" align="center" />
			<el-table-column prop="name" label="姓名" align="center" />
			<el-table-column prop="points" label="积分" width="100" align="center" />
			<el-table-column label="班级" width="150" align="center">
				<template #default="scope">
					{{ activeGrade?.name || '' }}
				</template>
			</el-table-column>
			<el-table-column label="操作" width="180" align="center">
				<template #default="scope">
					<el-button size="small" text :icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
					<el-button size="small" text type="danger" :icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
				</template>
			</el-table-column>
		</el-table>

		<!-- 分页 -->
		<div class="pagination">
			<el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="currentPage"
				:page-sizes="[5, 10, 20, 50]" :page-size="pageSize" layout="total, sizes, prev, pager, next, jumper"
				:total="students.length" />
		</div>

		<!-- 新增/编辑弹窗 -->
		<el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" :before-close="handleDialogClose">
			<el-form ref="formRef" :model="formData" label-width="80px" class="dialog-form">
				<el-form-item label="序号" prop="id" :rules="[{ required: true, message: '请输入ID', trigger: 'blur' }]">
					<el-input v-model="formData.id" placeholder="请输入ID" disabled />
				</el-form-item>
				<el-form-item label="姓名" prop="name" :rules="[{ required: true, message: '请输入姓名', trigger: 'blur' }]">
					<el-input v-model="formData.name" placeholder="请输入姓名" />
				</el-form-item>
				<el-form-item label="积分" prop="points" :rules="[{ required: true, message: '请输入积分', trigger: 'blur' }]">
					<el-input-number style="width: 100%" v-model="formData.points" placeholder="请输入积分" />
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="handleDialogClose">取消</el-button>
				<el-button type="primary" @click="handleSubmit">确定</el-button>
			</template>
		</el-dialog>

		<!-- 删除确认弹窗 -->
		<el-dialog title="确认删除" v-model="deleteConfirmVisible" width="300px">
			<span>确定要删除学生「{{ deleteStudent?.name }}」吗？</span>
			<template #footer>
				<el-button @click="deleteConfirmVisible = false">取消</el-button>
				<el-button type="danger" @click="confirmDelete">确定删除</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Plus, Edit, Delete, Search } from '@element-plus/icons-vue';
import type { FormInstance } from 'element-plus';
import { useAppStore } from '../../../store/models/app';
import { Student } from '../../../database/class';
import { useGrade } from '../../../database/utils/useGrade';

const { updateGradeInfoById } = useGrade();

const appStore = useAppStore();
const activeGrade = computed(() => appStore.activeGrade);

const students = ref<Student[]>(activeGrade.value?.gradeInfo?.studentList || []);
const studentIndex = computed(() => activeGrade.value?.gradeInfo?.indexMap?.student || 0);

// 搜索关键词
const searchQuery = ref('');

// 分页
const currentPage = ref(1);
const pageSize = ref(5);

// 弹窗相关
const dialogVisible = ref(false);
const deleteConfirmVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const deleteStudent = ref<Student | null>(null);

// 表单数据
const formData = ref<Partial<Student>>({
	id: '',
	name: '',
	points: 0,
});

// 弹窗标题
const dialogTitle = computed(() => (isEdit.value ? '编辑学生' : '新增学生'));

// 过滤后的学生列表
const filteredStudents = computed(() => {
	if (!searchQuery.value) {
		return students.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value);
	}
	const query = searchQuery.value.toLowerCase();
	return students.value.filter(
		(item) =>
			item.name.toLowerCase().includes(query) ||
			item.id.toLowerCase().includes(query)
	).slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value);
});

onMounted(() => {
	window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
	window.removeEventListener('resize', handleResize);
});

const handleResize = () => {
	
}

// 搜索
const handleSearch = () => {
	currentPage.value = 1;
};

// 新增
const handleAdd = () => {
	isEdit.value = false;
	formData.value = { id: `${studentIndex.value}`, name: '', points: 0 };
	dialogVisible.value = true;
};

// 编辑
const handleEdit = (row: Student) => {
	isEdit.value = true;
	formData.value = { ...row };
	dialogVisible.value = true;
};

// 删除确认
const handleDelete = (row: Student) => {
	deleteStudent.value = row;
	deleteConfirmVisible.value = true;
};

// 确认删除
const confirmDelete = async () => {
	if (deleteStudent.value) {
		const index = students.value.findIndex(
			(item) => item.id === deleteStudent.value?.id
		);
		if (index > -1) {
			students.value.splice(index, 1);
			if (appStore.activeGrade) {
				appStore.activeGrade.gradeInfo.studentList = [...students.value];
			}
		}
	}
	await handleUpdateGradeInfo();

	deleteConfirmVisible.value = false;
	deleteStudent.value = null;
};

// 提交表单
const handleSubmit = () => {
	formRef.value?.validate(async (valid) => {
		if (valid) {
			if (isEdit.value) {
				// 编辑
				const index = students.value.findIndex(
					(item) => item.id === formData.value.id
				);
				if (index > -1) {
					if (appStore.activeGrade) {
						students.value[index] = { ...students.value[index], ...formData.value };
						appStore.activeGrade.gradeInfo.studentList = [...students.value];
					}
				}
			} else {
				const newStudent = new Student(formData.value as Student);
				if (appStore.activeGrade) {
					appStore.activeGrade.gradeInfo.studentList.push(newStudent);
					appStore.activeGrade.gradeInfo.indexMap.student++;
				}
			}
			await handleUpdateGradeInfo();
			dialogVisible.value = false;
		}
	});
};

const handleUpdateGradeInfo = async () => {
	if (activeGrade.value) {
		await updateGradeInfoById(activeGrade.value.id, activeGrade.value);
	}
}

// 关闭弹窗
const handleDialogClose = () => {
	dialogVisible.value = false;
	formRef.value?.resetFields();
};

// 分页大小变化
const handleSizeChange = (val: number) => {
	pageSize.value = val;
	currentPage.value = 1;
};

// 当前页变化
const handleCurrentChange = (val: number) => {
	currentPage.value = val;
};
</script>

<style scoped>
.student-list-container {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
}

.search-bar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
}

.search-input {
	width: 300px;
}

.pagination {
	display: flex;
	justify-content: flex-end;
	margin-top: 10px;
}

.dialog-form {
	padding-top: 10px;
}
</style>