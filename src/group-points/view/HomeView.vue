<template>
	<div class="grade-list-container">
		<el-card shadow="hover" style="width: 160px; height: 200px;" v-for="grade in validGradeList" :key="grade.id"
			@click="handleClick(grade)">
			<div style="height: 100%; width: 100%; display: flex; justify-content: center; align-items: center;">
				<h4>{{ grade.name }}</h4>
			</div>
			<template #footer>
				<el-space style="width: 100%; justify-content: space-around; ">
					<el-button type="primary" :icon="Edit" circle @click="handleEditGrade(grade, $event)"/>
					<el-button type="danger" :icon="Delete" circle @click="handleDeleteGrade(grade.id, $event)"/>
				</el-space>
			</template>
		</el-card>
		<el-card shadow="hover" style="width: 160px; height: 200px;" @click="handleAddGrade">
			<div style="height: 100%; width: 100%; display: flex; justify-content: center; align-items: center;">
				<el-icon> <Plus /></el-icon>
			</div>
		</el-card>
	</div>

	<el-dialog v-model="dialogVisible" :title="isEditMode ? '编辑班级' : '新增班级'" width="400px">
		<el-form ref="formRef" :model="form" label-width="80px" :rules="rules">
			<el-form-item label="班级名称" prop="name">
				<el-input v-model="form.name" placeholder="请输入班级名称" />
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="dialogVisible = false">取消</el-button>
			<el-button type="primary" @click="handleSubmit(formRef)">确定</el-button>
			</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { DatabaseInfoType } from '../database';
import { useAppStore } from '../store/models/app';
import { FormRules, FormInstance, ElMessage, ElMessageBox } from 'element-plus';
import { useGrade } from '../database/utils/useGrade';
import { Delete, Edit } from '@element-plus/icons-vue';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

interface RuleForm {
  name: string
}

const appStore = useAppStore();
const router = useRouter();
const { createGrade, deleteGrade, updateGrade, getGradeInfoById } = useGrade();
const gradeList = appStore.database.gradeList;
const validGradeList = computed(() => gradeList.filter(item => item.delete === 0));

const dialogVisible = ref(false);
const isEditMode = ref(false);
const currentEditId = ref('');
const formRef = ref<FormInstance>()
const form = reactive<RuleForm>({
	name: ''
});
const rules = reactive<FormRules<RuleForm>>({
	name: [
		{ required: true, message: '请输入班级名称', trigger: 'blur' }
	]
});

onMounted(() => {
	// 初始化时，将 activeGrade 设置为 undefined
	appStore.setActiveGrade(undefined);
})

const handleClick = async(grade: DatabaseInfoType['gradeList'][0]) => {
	const gradeInfo = await getGradeInfoById(grade.id);
	if (gradeInfo) {
		appStore.setActiveGrade(gradeInfo);
		appStore.setIsCollapse(true);
		router.push({ name: 'grade' });
	}
}

const handleAddGrade = () => {
	isEditMode.value = false;
	form.name = '';
	dialogVisible.value = true;
}

const handleEditGrade = (grade: DatabaseInfoType['gradeList'][0], event: MouseEvent) => {
	event.stopPropagation();
	isEditMode.value = true;
	currentEditId.value = grade.id;
	form.name = grade.name;
	dialogVisible.value = true;
}

const handleDeleteGrade = async (id: string, event: MouseEvent) => {
	event.stopPropagation();
	try {
		await ElMessageBox.confirm('确定要删除该班级吗？', '提示', {
			confirmButtonText: '确定',
			cancelButtonText: '取消',
			type: 'warning'
		});
		
		const res = await deleteGrade(id);
		if (res) {
			ElMessage.success('删除班级成功');
		} else {
			ElMessage.error('删除班级失败');
		}
	} catch (error) {
		console.log('取消删除');
	}
}

const handleSubmit = async (formEl: FormInstance | undefined) => {
	if (!formEl) return
	const data = await formEl.validate();
	if (data) {
		const gradeName = form.name;
		let res;
		
		if (isEditMode.value) {
			res = await updateGrade(currentEditId.value, gradeName);
			if (res) {
				ElMessage.success('编辑班级成功');
			} else {
				ElMessage.error('编辑班级失败');
			}
		} else {
			res = await createGrade(gradeName);
			if (res) {
				ElMessage.success('新增班级成功');
			} else {
				ElMessage.error('新增班级失败');
			}
		}
		
		if (res) {
			dialogVisible.value = false;
		}
	}
}
</script>

<style scoped>
.grade-list-container {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
}
</style>