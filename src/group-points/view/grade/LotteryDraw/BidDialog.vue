<template>
	<el-dialog :title="'奖品竞价'" v-model="props.visible" width="800px" :before-close="handleClose">
		<div v-if="!prize" class="empty-state">
			<p>未选择奖品</p>
		</div>
		
		<template v-else>
			<!-- 奖品信息 -->
			<div class="prize-info">
				<h3>竞拍奖品</h3>
				<div class="prize-card">
					<el-image v-if="prize.image && imageBase64" :src="imageBase64" 
						style="width: 80px; height: 80px; border-radius: 8px;" fit="cover" />
					<div class="prize-detail">
						<div class="prize-name">{{ prize.name }}</div>
						<div class="prize-points">需要积分：<span class="points-value">{{ prize.points }}</span> 分</div>
						<div class="prize-quantity">剩余数量：<span :class="prize.quantity > 0 ? 'text-success' : 'text-danger'">{{ prize.quantity }}</span></div>
					</div>
				</div>
			</div>

			<!-- 学生列表 -->
			<div class="student-section">
				<h3>可选学生（积分 ≥ {{ prize.points }}）</h3>
				<div v-if="eligibleStudents.length === 0" class="no-student">
					<p>暂无积分足够的学生</p>
				</div>
				<div v-else class="student-grid">
					<div 
						v-for="student in eligibleStudents" 
						:key="student.id"
						class="student-card"
						:class="{ selected: selectedStudentId === student.id }"
						@click="selectStudent(student)"
					>
						<div class="student-name">{{ student.name }}</div>
						<div class="student-id">学号：{{ student.id }}</div>
						<div class="student-points">积分：<span class="points-value">{{ student.points }}</span> 分</div>
					</div>
				</div>
			</div>
		</template>
		
		<template #footer>
			<el-button @click="handleClose">关闭</el-button>
			<el-button 
				type="primary" 
				:disabled="!selectedStudentId || !prize || isSubmitting" 
				@click="handleConfirm"
			>
				{{ isSubmitting ? '处理中...' : '确认竞拍' }}
			</el-button>
		</template>
	</el-dialog>

	<!-- 二次确认弹窗 -->
	<el-dialog title="确认竞拍" v-model="confirmVisible" width="400px">
		<div class="confirm-content">
			<p>确定要让 <span class="highlight">{{ selectedStudent?.name }}</span> 花费 <span class="highlight">{{ prize?.points }}</span> 积分竞拍 <span class="highlight">{{ prize?.name }}</span> 吗？</p>
		</div>
		<template #footer>
			<el-button @click="confirmVisible = false">取消</el-button>
			<el-button type="danger" @click="submitBid">确认竞拍</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Prize, RuleRecord } from '../../../database/class';
import type { Student } from '../../../database/class';
import { useStudent } from '../../../database/utils/useStudent';
import { usePrize } from '../../../database/utils/usePrize';
import { loadImageAsBase64 } from '../../../database';
import { useAppStore } from '../../../store/models/app';
import { useGrade } from '../../../database/utils/useGrade';
import { ElMessage } from 'element-plus';

interface Props {
	visible: boolean;
	prize: Prize | null;
	students: Student[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
	(e: 'update:visible', value: boolean): void;
	(e: 'success'): void;
}>();

const { updateStudent } = useStudent();
const { updatePrize } = usePrize();

const selectedStudentId = ref<string>('');
const confirmVisible = ref(false);
const isSubmitting = ref(false);
const imageBase64 = ref('');

const eligibleStudents = computed(() => {
	if (!props.prize) return [];
	return props.students.filter(s => s.points >= props.prize!.points);
});

const selectedStudent = computed(() => {
	return props.students.find(s => s.id === selectedStudentId.value) || null;
});

const selectStudent = (student: Student) => {
	selectedStudentId.value = selectedStudentId.value === student.id ? '' : student.id;
};

const handleClose = () => {
	selectedStudentId.value = '';
	confirmVisible.value = false;
	emit('update:visible', false);
};

const handleConfirm = () => {
	if (!selectedStudent.value || !props.prize) return;
	confirmVisible.value = true;
};

const submitBid = async () => {
	if (!selectedStudent.value || !props.prize) return;
	
	isSubmitting.value = true;
	try {
		// 1. 更新学生积分
		const newPoints = selectedStudent.value.points - props.prize.points;
		await updateStudent(selectedStudent.value.id, selectedStudent.value.name, newPoints);
		
		// 2. 更新奖品数量
		await updatePrize({
			...props.prize,
			quantity: props.prize.quantity - 1
		});
		
		// 3. 添加积分记录（使用负分表示消费）
		const appStore = useAppStore();
		const activeGrade = appStore.activeGrade;
		if (activeGrade) {
			const recordIndex = activeGrade.gradeInfo.indexMap.record || 0;
			const newRecord = new RuleRecord({
				id: recordIndex,
				stu_id: selectedStudent.value.id,
				rule_id: 'bid',
				points: -props.prize.points,
				time: new Date().toISOString()
			});
			activeGrade.gradeInfo.recordList.push(newRecord);
			activeGrade.gradeInfo.indexMap.record++;
			
			await useGrade().updateGradeInfoById(activeGrade.id, activeGrade);
		}
		
		ElMessage.success('竞拍成功！');
		emit('success');
		confirmVisible.value = false;
		handleClose();
	} catch (error) {
		console.error('竞拍失败:', error);
		ElMessage.error('竞拍失败，请重试');
	} finally {
		isSubmitting.value = false;
	}
};

const loadPrizeImage = async () => {
	if (props.prize?.image) {
		imageBase64.value = await loadImageAsBase64(props.prize.image) || '';
	}
};

watch(() => props.visible, (val) => {
	if (val && props.prize) {
		loadPrizeImage();
	}
});

watch(() => props.prize, () => {
	selectedStudentId.value = '';
	if (props.prize) {
		loadPrizeImage();
	}
});
</script>

<style scoped>
.empty-state {
	text-align: center;
	padding: 40px 0;
	color: #999;
}

.empty-icon {
	color: #ccc;
	margin-bottom: 16px;
}

.prize-info {
	margin-bottom: 20px;
	padding-bottom: 20px;
	border-bottom: 1px solid #eee;
}

.prize-info h3,
.student-section h3 {
	font-size: 16px;
	font-weight: 600;
	margin-bottom: 12px;
	color: #333;
}

.prize-card {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 16px;
	background: #fafafa;
	border-radius: 8px;
}

.prize-icon {
	color: #409eff;
}

.prize-detail {
	flex: 1;
}

.prize-name {
	font-size: 18px;
	font-weight: 600;
	color: #333;
	margin-bottom: 8px;
}

.prize-points,
.prize-quantity {
	font-size: 14px;
	color: #666;
	margin-bottom: 4px;
}

.points-value {
	color: #e6a23c;
	font-weight: 600;
}

.student-section {
	max-height: 300px;
	overflow-y: auto;
}

.no-student {
	text-align: center;
	padding: 30px 0;
	color: #999;
}

.student-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
}

.student-card {
	width: 23%;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 16px;
	border: 2px solid #e4e7ed;
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.3s;
	background: #fff;
}

.student-card:hover {
	border-color: #c0c4cc;
	background: #fafafa;
}

.student-card.selected {
	border-color: #409eff;
	background: #ecf5ff;
}

.student-icon {
	color: #909399;
	margin-bottom: 8px;
}

.student-name {
	font-size: 16px;
	font-weight: 600;
	color: #333;
	margin-bottom: 4px;
}

.student-id,
.student-points {
	font-size: 12px;
	color: #909399;
}

.confirm-content {
	text-align: center;
	padding: 20px 0;
}

.confirm-icon {
	color: #e6a23c;
	margin-bottom: 16px;
}

.confirm-content p {
	font-size: 14px;
	color: #666;
	line-height: 1.8;
}

.highlight {
	color: #409eff;
	font-weight: 600;
}

.text-success {
	color: #67c23a;
}

.text-danger {
	color: #f56c6c;
}
</style>