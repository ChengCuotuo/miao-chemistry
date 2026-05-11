<template>
	<el-card class="group-card" shadow="hover">
		<template #header>
			<div class="card-header">
				<div class="group-title">
					<el-tag type="primary" size="large" class="group-points">{{ group.points }} 分</el-tag>
					<span class="group-name">{{ group.name }}</span>
				</div>
				<div class="card-actions">
					<el-button type="primary" :icon="Edit" circle size="small" @click="handleEdit" />
					<el-button type="danger" :icon="Delete" circle size="small" @click="handleDelete" />
				</div>
			</div>
		</template>
		<div class="student-list">
			<div v-for="student in group.studentList" :key="student.id" class="student-item">
				<div class="student-info">
					<span class="student-name">{{ student.name }}</span>
					<el-tag type="success" size="small">{{ student.points }} 分</el-tag>
				</div>
				<div class="student-actions">
					<el-button type="success" :icon="Plus" circle size="small" @click="handleAddPoints(student)" />
					<el-button type="warning" :icon="Minus" circle size="small" @click="handleSubtractPoints(student)" />
				</div>
			</div>
			<el-empty v-if="!group.studentList.length" description="暂无成员" :image-size="60" />
		</div>
	</el-card>
</template>

<script setup lang="ts">
import { Edit, Delete, Plus, Minus } from '@element-plus/icons-vue';
import { Student } from '../../../database/class';
import { GroupInfo } from './index.vue';

const props = defineProps<{
	group: GroupInfo;
}>();

const emit = defineEmits<{
	edit: [group: GroupInfo];
	delete: [group: GroupInfo];
	'add-points': [student: Student];
	'subtract-points': [student: Student];
}>();

const handleEdit = () => {
	emit('edit', props.group);
};

const handleDelete = () => {
	emit('delete', props.group);
};

const handleAddPoints = (student: Student) => {
	emit('add-points', student);
};

const handleSubtractPoints = (student: Student) => {
	emit('subtract-points', student);
};
</script>

<style scoped>
.group-card {
	width: 300px;
	transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.group-card:hover {
	transform: translateY(-4px);
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.group-title {
	display: flex;
	align-items: center;
	gap: 12px;
}

.group-name {
	font-size: 18px;
	font-weight: 600;
	color: #303133;
}

.group-points {
	font-weight: 600;
}

.card-actions {
	display: flex;
	gap: 8px;
}

.student-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.student-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px;
	background-color: #f5f7fa;
	border-radius: 8px;
	transition: background-color 0.3s ease;
}

.student-item:hover {
	background-color: #e6f7ff;
}

.student-info {
	display: flex;
	align-items: center;
	gap: 12px;
}

.student-name {
	font-size: 14px;
	color: #606266;
	font-weight: 500;
}

.student-actions {
	display: flex;
	gap: 8px;
}
</style>