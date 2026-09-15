<template>
	<el-dialog
		v-model="dialogVisible"
		title="导入班级"
		width="480px"
		:before-close="handleClose"
	>
		<el-alert
			v-if="conflictGrade"
			class="conflict-tip"
			type="warning"
			show-icon
			:closable="false"
			:title="`检测到与现有班级「${conflictGrade.name}」名称或 ID 重复`"
		/>

		<el-radio-group v-if="conflictGrade" v-model="mode" class="mode-group">
			<el-radio value="new">创建新班级</el-radio>
			<el-radio value="overwrite">覆盖「{{ conflictGrade.name }}」的数据</el-radio>
		</el-radio-group>

		<el-form ref="formRef" :model="form" label-width="80px" :rules="rules">
			<el-form-item v-if="!isOverwrite" label="班级名称" prop="name">
				<el-input v-model="form.name" placeholder="请输入一个不重复的班级名称" />
			</el-form-item>
			<el-alert
				v-else
				class="overwrite-tip"
				type="error"
				show-icon
				:closable="false"
				:title="`将用导入文件的数据完全替换「${conflictGrade?.name}」的现有数据（学生、分组、积分、记录、周期、班委账号），此操作不可撤销`"
			/>
		</el-form>

		<template #footer>
			<el-button @click="handleCancel">取消</el-button>
			<el-button :type="isOverwrite ? 'danger' : 'primary'" @click="handleConfirm(formRef)">
				{{ isOverwrite ? '确认覆盖' : '确定' }}
			</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { FormRules, FormInstance, ElMessage } from 'element-plus';
import { GroupPointsConfig, DEFAULT_TABLE_NAME } from '../../database';
import { curWindow } from '../../database';
import { useAppStore } from '../../store/models/app';
import { useGrade } from '../../database/utils/useGrade';
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
const { findImportConflict, isGradeNameTaken } = useGrade();
const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const form = reactive<RuleForm>({
	name: ''
});
// 导入方式：new-创建新班级（需要不重名的名称）/ overwrite-覆盖冲突班级的数据
const mode = ref<'new' | 'overwrite'>('new');

// 与导入数据冲突的班级（同名或同 id）
const conflictGrade = computed(() => findImportConflict(props.gradeData));
const isOverwrite = computed(() => !!conflictGrade.value && mode.value === 'overwrite');

const rules = reactive<FormRules<RuleForm>>({
	name: [
		{ required: true, message: '请输入班级名称', trigger: 'blur' },
		{
			validator: (rule, value, callback) => {
				if (isGradeNameTaken(value)) {
					callback(new Error('该班级名称已存在，请换一个名称或选择「覆盖」'));
				} else {
					callback();
				}
			},
			trigger: 'blur'
		}
	]
});

const originalGradeData = ref<GradeData | null>(null);

// 兼容旧版本导出数据：班委周期 / 独立分组 / 班委账号字段缺失时补默认值
const normalizeGradeInfo = (raw: any) => {
	const old = raw || {};
	return {
		...old,
		monitorCycleList: old.monitorCycleList || [],
		monitorAccountList: old.monitorAccountList || [],
		teamList: old.teamList || [],
		teamRecordList: old.teamRecordList || [],
		indexMap: {
			...(old.indexMap || {}),
			monitorCycle: old.indexMap?.monitorCycle ?? 0,
			monitorAccount: old.indexMap?.monitorAccount ?? 0,
			team: old.indexMap?.team ?? 0,
			teamRecord: old.indexMap?.teamRecord ?? 0,
		},
	};
};

watch(() => props.visible, (newVal) => {
	dialogVisible.value = newVal;
	if (newVal && props.gradeData) {
		originalGradeData.value = JSON.parse(JSON.stringify(props.gradeData));
		form.name = props.gradeData.name;
		// 默认「创建新班级」（非破坏性），覆盖需用户主动选择
		mode.value = 'new';
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

// 创建新班级：生成新 id + 用户填写的不重名名称
const importAsNewGrade = async () => {
	if (!originalGradeData.value) return;
	const newId = uuidv4();
	const newGrade: GradeData = {
		...originalGradeData.value,
		gradeInfo: normalizeGradeInfo(originalGradeData.value.gradeInfo),
		id: newId,
		name: form.name,
		delete: 0,
	};
	appStore.database.gradeList.push(newGrade);
	await writeGradeListConfig();
	await writeGradeFile(newId, newGrade);
	ElMessage.success('导入班级成功');
};

// 覆盖：用导入文件的数据完全替换冲突班级的数据（保留该班级的 id，恢复已删除状态）
const overwriteConflictGrade = async () => {
	const target = conflictGrade.value;
	if (!target || !originalGradeData.value) return;
	const needRewriteList = target.delete !== 0;
	target.name = form.name || originalGradeData.value.name || target.name;
	target.delete = 0;
	target.gradeInfo = normalizeGradeInfo(originalGradeData.value.gradeInfo);
	// 班级文件整体重写（列表配置仅在「恢复已删除班级」时才需要同步）
	await writeGradeFile(target.id, target);
	if (needRewriteList) await writeGradeListConfig();
	ElMessage.success(`已用导入数据覆盖「${target.name}」`);
};

const writeGradeListConfig = async () => {
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
};

const writeGradeFile = async (id: string, data: any) => {
	await curWindow.electronAPI.writeConfigToFile({
		mainPath: GroupPointsConfig.database,
		fileName: `${DEFAULT_TABLE_NAME.grade}-${id}`,
		suffix: GroupPointsConfig.suffix,
		content: JSON.stringify(data)
	});
};

const handleConfirm = async (formEl: FormInstance | undefined) => {
	if (!formEl) return;

	try {
		// 覆盖模式下表单里没有名称字段，validate 会直接通过
		await formEl.validate();

		if (isOverwrite.value) {
			await overwriteConflictGrade();
		} else {
			await importAsNewGrade();
		}
		dialogVisible.value = false;
		emit('success');
	} catch (error) {
		console.log('验证失败或取消');
	}
};
</script>

<style scoped>
.conflict-tip {
	margin-bottom: 12px;
}

.mode-group {
	margin-bottom: 12px;
}

.mode-group :deep(.el-radio) {
	margin-right: 20px;
}

.overwrite-tip {
	margin-bottom: 4px;
}
</style>
