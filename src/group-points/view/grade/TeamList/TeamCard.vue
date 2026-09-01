<template>
	<el-card class="team-card" shadow="hover">
		<template #header>
			<div class="card-header">
				<div class="team-title">
					<el-tag type="warning" size="large" class="team-points">{{ team.points }} 分</el-tag>
					<span class="team-name">{{ team.name }}</span>
				</div>
				<div class="card-actions">
					<el-button type="primary" :icon="Edit" circle size="small" @click="handleEdit" />
					<el-button type="danger" :icon="Delete" circle size="small" @click="handleDelete" />
				</div>
			</div>
		</template>
		<div class="member-list">
			<el-input
				v-model="searchQuery"
				placeholder="搜索成员"
				class="search-input"
				prefix-icon="Search"
				clearable
			/>
			<div v-for="student in filteredMembers" :key="student.id" class="member-item">
				<div class="member-info">
					<span class="member-name">{{ student.name }}</span>
					<el-tag :type="student.points >= 0 ? 'success' : 'danger'" size="small" class="clickable-tag"
						@click="handleViewRecords(student)">{{ student.points }} 分</el-tag>
				</div>
				<div class="member-actions">
					<el-button type="success" style="margin: 0px;" :icon="Plus" circle size="small"
						@click="handleAddPoints(student)" />
					<el-button v-if="showSubtract" type="danger" style="margin: 0px;" :icon="Minus" circle size="small"
						@click="handleSubtractPoints(student)" />
					<el-button type="warning" style="margin: 0px;" :icon="Ticket" circle size="small"
						@click="handleAdjustPoints(student)" />
				</div>
			</div>
			<el-empty v-if="filteredMembers.length === 0" description="暂无成员" :image-size="60" />
		</div>
		<template #footer>
			<div class="card-footer">
				<div class="footer-label">小组操作：</div>
				<div class="team-actions">
					<el-tooltip content="小组加分" placement="top">
						<el-button type="success" style="margin: 0px;" :icon="Plus" circle size="small" @click="handleTeamAddPoints" />
					</el-tooltip>
					<el-tooltip v-if="showSubtract" content="小组减分" placement="top">
						<el-button type="danger" style="margin: 0px;" :icon="Minus" circle size="small" @click="handleTeamSubtractPoints" />
					</el-tooltip>
					<el-tooltip content="按规则调整小组积分" placement="top">
						<el-button type="warning" style="margin: 0px;" :icon="Ticket" circle size="small" @click="handleTeamAdjustPoints" />
					</el-tooltip>
					<el-tooltip content="查看小组积分记录" placement="top">
						<el-button type="info" style="margin: 0px;" :icon="List" circle size="small" @click="handleTeamViewRecords" />
					</el-tooltip>
				</div>
			</div>
		</template>
	</el-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Edit, Delete, Plus, Minus, Ticket, Search, List } from '@element-plus/icons-vue';
import { Student } from '../../../database/class';
import type { TeamInfo } from './index.vue';
import { useAppStore } from '../../../store/models/app';

// 减分快捷键显示控制：读取基础设置 hideQuickSubtract（true=隐藏，默认隐藏）
const appStore = useAppStore();
const showSubtract = computed(() => !(appStore.database.basicConfig as any)?.hideQuickSubtract);

const props = defineProps<{
	team: TeamInfo;
}>();

// 搜索关键词
const searchQuery = ref('');

// 过滤后的成员列表
const filteredMembers = computed(() => {
	if (!searchQuery.value) {
		return props.team.memberList;
	}
	const query = searchQuery.value.toLowerCase();
	return props.team.memberList.filter(member =>
		member.name.toLowerCase().includes(query) ||
		member.id.toLowerCase().includes(query)
	);
});

const emit = defineEmits<{
	edit: [team: TeamInfo];
	delete: [team: TeamInfo];
	// 小组级操作（只影响小组分数）
	'add-points': [team: TeamInfo];
	'subtract-points': [team: TeamInfo];
	'adjust-points': [team: TeamInfo];
	'view-records': [team: TeamInfo];
	// 成员级操作（只影响成员个人分数）
	'member-add-points': [student: Student];
	'member-subtract-points': [student: Student];
	'member-adjust-points': [student: Student];
	'member-view-records': [student: Student];
}>();

const handleEdit = () => emit('edit', props.team);
const handleDelete = () => emit('delete', props.team);

const handleTeamAddPoints = () => emit('add-points', props.team);
const handleTeamSubtractPoints = () => emit('subtract-points', props.team);
const handleTeamAdjustPoints = () => emit('adjust-points', props.team);
const handleTeamViewRecords = () => emit('view-records', props.team);

const handleAddPoints = (student: Student) => emit('member-add-points', student);
const handleSubtractPoints = (student: Student) => emit('member-subtract-points', student);
const handleAdjustPoints = (student: Student) => emit('member-adjust-points', student);
const handleViewRecords = (student: Student) => emit('member-view-records', student);
</script>

<style scoped>
.team-card {
	width: 300px;
	transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.team-card:hover {
	transform: translateY(-4px);
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.team-title {
	display: flex;
	align-items: center;
	gap: 12px;
}

.team-name {
	font-size: 18px;
	font-weight: 600;
	color: #303133;
}

.team-points {
	font-weight: 600;
}

.card-actions {
	display: flex;
	gap: 8px;
}

.member-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
	min-height: 120px;
}

.search-input {
	width: 100%;
}

.member-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10px 12px;
	background-color: #f5f7fa;
	border-radius: 8px;
}

.member-info {
	display: flex;
	align-items: center;
	gap: 12px;
}

.member-name {
	font-size: 14px;
	color: #606266;
	font-weight: 500;
}

.clickable-tag {
	cursor: pointer;
}

.clickable-tag:hover {
	opacity: 0.8;
}

.member-actions {
	display: flex;
	gap: 8px;
}

.card-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.footer-label {
	font-size: 14px;
	color: #606266;
}

.team-actions {
	display: flex;
	gap: 8px;
}

::v-deep(.el-card__footer) {
	padding: 20px;
}
</style>
