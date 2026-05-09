<template>
	<div class="grade-list-container">
		<el-card shadow="hover" style="width: 160px; height: 200px;" v-for="grade in gradeList" :key="grade.id"
			@click="handleClick(grade)">
			<div style="height: 100%; width: 100%; display: flex; justify-content: center; align-items: center;">
				<h4>{{ grade.name }}</h4>
			</div>
		</el-card>
		<el-card shadow="hover" style="width: 160px; height: 200px;" @click="handleAddGrade">
			<div style="height: 100%; width: 100%; display: flex; justify-content: center; align-items: center;">
				<el-icon>
					<Plus />
				</el-icon>
			</div>
		</el-card>
	</div>

	<el-dialog v-model="dialogVisible" title="新增班级" width="400px">
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
import { ref, reactive } from 'vue';
import { DatabaseInfoType } from '../database';
import { useAppStore } from '../store/models/app';
import { FormRules, FormInstance, ElMessage } from 'element-plus';
import { useGrade } from '../database/utils/useGrade';

interface RuleForm {
  name: string
}

const appStore = useAppStore();
const { createGrade } = useGrade();
const gradeList = appStore.database.gradeList;

const dialogVisible = ref(false);
const formRef = ref<FormInstance>()
const form = reactive<RuleForm>({
	name: ''
});
const rules = reactive<FormRules<RuleForm>>({
	name: [
		{ required: true, message: '请输入班级名称', trigger: 'blur' }
	]
});

const handleClick = (grade: DatabaseInfoType['gradeList'][0]) => {
	console.log(grade);
}

const handleAddGrade = () => {
	form.name = '';
	dialogVisible.value = true;
}

const handleSubmit = async (formEl: FormInstance | undefined) => {
	if (!formEl) return
	const data = await formEl.validate();
	if (data) {
		const gradeName = form.name;
		const res = await createGrade(gradeName);
		if(res) {
			ElMessage.success('新增班级成功');
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