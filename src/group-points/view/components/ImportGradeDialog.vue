<template>
	<el-dialog
		v-model="dialogVisible"
		title="导入班级"
		width="400px"
		:before-close="handleClose"
	>
		<el-form ref="formRef" :model="form" label-width="80px" :rules="rules">
			<el-form-item label="班级名称" prop="name">
				<el-input v-model="form.name" placeholder="请输入班级名称" />
			</el-form-item>
			<el-alert
				title="检测到班级名称或ID已存在，已为您生成了新的班级ID"
				type="info"
				show-icon
				:closable="false"
				style="margin-top: 10px;"
			/>
		</el-form>
		<template #footer>
			<el-button @click="handleCancel">取消</el-button>
			<el-button type="primary" @click="handleConfirm(formRef)">确定</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { FormRules, FormInstance, ElMessage } from 'element-plus';
import { GroupPointsConfig, DEFAULT_TABLE_NAME } from '../../database';
import { curWindow } from '../../database';
import { useAppStore } from '../../store/models/app';
import { v4 as uuidv4 } from 'uuid';

interface GradeData {
	id: string;
	name: string;
	delete: number;
	gradeInfo: any;
}

interface RuleForm {
	name: string;
}

const props = defineProps<{
	visible: boolean;
	gradeData: GradeData | null;
}>();

const emit = defineEmits<{
	'update:visible': [value: boolean];
	'success': [];
}>();

const appStore = useAppStore();
const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const form = reactive<RuleForm>({
	name: ''
});
const rules = reactive<FormRules<RuleForm>>({
	name: [
		{ required: true, message: '请输入班级名称', trigger: 'blur' },
		{
			validator: (rule, value, callback) => {
				const nameExists = appStore.database.gradeList.some(
					(item: any) => item.name === value && item.id !== props.gradeData?.id
				);
				if (nameExists) {
					callback(new Error('该班级名称已存在'));
				} else {
					callback();
				}
			},
			trigger: 'blur'
		}
	]
});

const originalGradeData = ref<GradeData | null>(null);

watch(() => props.visible, (newVal) => {
	dialogVisible.value = newVal;
	if (newVal && props.gradeData) {
		originalGradeData.value = JSON.parse(JSON.stringify(props.gradeData));
		form.name = props.gradeData.name;
	}
});

watch(dialogVisible, (newVal) => {
	emit('update:visible', newVal);
});

const handleClose = () => {
	dialogVisible.value = false;
};

const handleCancel = () => {
	dialogVisible.value = false;
};

const handleConfirm = async (formEl: FormInstance | undefined) => {
	if (!formEl) return;
	
	try {
		await formEl.validate();
		
		if (!originalGradeData.value) return;
		const newId = uuidv4();
		// 兼容旧版本导出数据：班委周期/独立分组字段缺失时补默认值
		const oldGradeInfo = originalGradeData.value.gradeInfo || {};
		const compatibleGradeInfo = {
			...oldGradeInfo,
			monitorCycleList: oldGradeInfo.monitorCycleList || [],
			teamList: oldGradeInfo.teamList || [],
			teamRecordList: oldGradeInfo.teamRecordList || [],
			indexMap: {
				...(oldGradeInfo.indexMap || {}),
				monitorCycle: oldGradeInfo.indexMap?.monitorCycle ?? 0,
				team: oldGradeInfo.indexMap?.team ?? 0,
				teamRecord: oldGradeInfo.indexMap?.teamRecord ?? 0,
			},
		};
		const newGrade: GradeData = {
			...originalGradeData.value,
			gradeInfo: compatibleGradeInfo,
			id: newId,
			name: form.name,
			delete: 0
		};
		
		appStore.database.gradeList.push(newGrade);
		
		const gradeConfig = appStore.database.gradeList.map((item: any) => ({
			id: item.id,
			name: item.name,
			delete: item.delete
		}));
		
		await curWindow.electronAPI.writeConfigToFile({
			mainPath: GroupPointsConfig.database,
			fileName: DEFAULT_TABLE_NAME.grade,
			suffix: GroupPointsConfig.suffix,
			content: JSON.stringify(gradeConfig)
		});
		
		await curWindow.electronAPI.writeConfigToFile({
			mainPath: GroupPointsConfig.database,
			fileName: `${DEFAULT_TABLE_NAME.grade}-${newId}`,
			suffix: GroupPointsConfig.suffix,
			content: JSON.stringify(newGrade)
		});
		
		ElMessage.success('导入班级成功');
		dialogVisible.value = false;
		emit('success');
	} catch (error) {
		console.log('验证失败或取消');
	}
};
</script>