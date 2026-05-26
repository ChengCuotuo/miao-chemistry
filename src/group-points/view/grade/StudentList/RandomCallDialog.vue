<template>
	<el-dialog :title="'随机点名'" v-model="props.visible" width="400px" :before-close="handleClose">
		<div class="random-call-content">
			<div v-if="!isRolling && !selectedStudent" class="empty-state">
				<el-icon :size="64" class="empty-icon">User</el-icon>
				<p>点击开始按钮随机点名</p>
			</div>
			
			<div v-else-if="isRolling" class="rolling-state">
				<div class="rolling-name">{{ rollingName }}</div>
				<p class="rolling-tip">正在随机抽取...</p>
			</div>
			
			<div v-else class="result-state">
				<div class="result-name">{{ selectedStudent?.name }}</div>
				<div class="result-id">学号：{{ selectedStudent?.id }}</div>
			</div>
		</div>
		
		<template #footer>
			<el-button @click="handleClose">关闭</el-button>
			<el-button type="primary" :disabled="isRolling" @click="handleRoll">
				{{ isRolling ? '抽取中...' : '开始点名' }}
			</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Student } from '../../../database/class';
import { ElMessage } from 'element-plus';

interface Props {
	visible: boolean;
	students: Student[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
	(e: 'update:visible', value: boolean): void;
}>();

const isRolling = ref(false);
const rollingName = ref('');
const selectedStudent = ref<Student | null>(null);
let rollTimer: ReturnType<typeof setInterval> | null = null;

const handleRoll = () => {
	if (!props.students.length) {
		ElMessage.warning('当前班级没有学生');
		return;
	}
	
	isRolling.value = true;
	selectedStudent.value = null;
	
	let count = 0;
	const maxCount = 20;
	
	rollTimer = setInterval(() => {
		const randomIndex = Math.floor(Math.random() * props.students.length);
		rollingName.value = props.students[randomIndex].name;
		count++;
		
		if (count >= maxCount) {
			if (rollTimer) {
				clearInterval(rollTimer);
				rollTimer = null;
			}
			isRolling.value = false;
			selectedStudent.value = props.students[Math.floor(Math.random() * props.students.length)];
		}
	}, 80);
};

const handleClose = () => {
	if (rollTimer) {
		clearInterval(rollTimer);
		rollTimer = null;
	}
	isRolling.value = false;
	emit('update:visible', false);
};

watch(() => props.visible, (val) => {
	if (!val) {
		handleClose();
	}
});
</script>

<style scoped>
.random-call-content {
	text-align: center;
	padding: 30px 0;
}

.empty-state {
	padding: 40px 0;
}

.empty-icon {
	color: #ccc;
	margin-bottom: 16px;
}

.rolling-state {
	padding: 40px 0;
}

.rolling-name {
	font-size: 48px;
	font-weight: bold;
	color: #409eff;
	animation: pulse 0.1s infinite;
	margin-bottom: 16px;
}

.rolling-tip {
	color: #999;
	font-size: 14px;
}

.result-state {
	padding: 40px 0;
}

.result-icon {
	color: #67c23a;
	margin-bottom: 16px;
}

.result-name {
	font-size: 36px;
	font-weight: bold;
	color: #67c23a;
	margin-bottom: 12px;
}

.result-id,
.result-points {
	font-size: 16px;
	color: #666;
	margin-bottom: 8px;
}

@keyframes pulse {
	0%, 100% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.05);
	}
}
</style>