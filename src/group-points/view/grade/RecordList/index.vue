<template>
	<div class="record-list">
		<!-- 筛选区域 -->
		<div class="filter-bar">
			<el-input
				v-if="!props.studentId"
				v-model="searchStudentId"
				placeholder="学生ID"
				class="search-input"
				clearable
			/>
			<el-input
				v-if="!props.studentId"
				v-model="searchStudentName"
				placeholder="学生姓名"
				class="search-input"
				clearable
			/>
			<el-input
				v-model="searchRuleName"
				placeholder="规则名称"
				class="search-input"
				clearable
			/>
			<el-select v-model="filterType" placeholder="筛选类型" class="filter-select" clearable>
				<el-option label="加分" value="add" />
				<el-option label="减分" value="subtract" />
			</el-select>
		</div>

		<!-- 记录列表 -->
		<el-table :data="paginatedRecords" border>
			<el-table-column label="序号" type="index" width="60" />
			<el-table-column v-if="!props.studentId" label="学生ID" prop="stu_id" width="120" />
			<el-table-column label="学生姓名" prop="student_name" width="120" />
			<el-table-column label="规则名称" prop="rule_name">
				<template #default="scope">
					<el-space>
						<span>{{ scope.row.rule_name }} </span>
						<el-icon v-if="scope.row.rule_id.startsWith(BID_RECORD_PREFIX)" class="cursor-pointer" @click="handleViewPrize(scope.row)">
							<question-filled />
						</el-icon>
					</el-space>
				</template>
				</el-table-column>
			<el-table-column label="积分变化" prop="points" width="120">
				<template #default="scope">
					<span :class="scope.row.points > 0 ? 'text-success' : 'text-danger'">
						{{ scope.row.points > 0 ? 	'+' : '' }}{{ scope.row.points }}
					</span>
				</template>
			</el-table-column>
			<el-table-column label="时间" prop="time" width="180" />
		</el-table>

		<!-- 分页 -->
		<div class="pagination">
			<el-pagination @size-change="handleSizeChange" @current-change="handlePageChange" :current-page="currentPage"
				:page-sizes="[10, 30, 60]" :page-size="pageSize" layout="total, sizes, prev, pager, next, jumper"
				:total="filteredRecords.length" />
		</div>

		<!-- 奖品详情弹窗 -->
		<PrizeDetailDialog
			v-model:visible="prizeDetailVisible"
			:form-data="prizeDetailData"
			:read-only="true"
			ref="prizeDetailDialogRef"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAppStore } from '../../../store/models/app';
import { RuleRecord } from '../../../database/class';
import { BID_RECORD_PREFIX } from './constant';
import { QuestionFilled } from '@element-plus/icons-vue';
import PrizeDetailDialog from '../LotteryDraw/PrizeDetailDialog.vue';
import type { Prize } from '../../../database/class';
import { loadImageAsUint8Array } from '../../../database';

interface Props {
	studentId?: string;
}

const props = defineProps<Props>();

const appStore = useAppStore();

// 筛选类型：all-全部, add-加分, subtract-减分
const filterType = ref<'add' | 'subtract'>();

// 搜索关键词
const searchStudentId = ref('');
const searchStudentName = ref('');
const searchRuleName = ref('');

// 分页参数
const currentPage = ref(1);
const pageSize = ref(10);

// 获取学生姓名
const getstudent_name = (stuId: string): string => {
	if (!appStore.activeGrade) return '';
	const student = appStore.activeGrade.gradeInfo.studentList.find(s => s.id === stuId);
	return student?.name || '';
};

// 获取规则名称
const getrule_name = (ruleId: string): string => {
	// 如果是 BID_RECORD_PREFIX 开头的是竞价扣除的
	if(ruleId.startsWith(BID_RECORD_PREFIX)){
		return '竞价扣除';
	}
	const rule = appStore.database.ruleList.find(r => r.id === ruleId);
	return rule?.name || '主动执行';
};

// 扩展记录接口
interface ExtendedRecord extends RuleRecord {
	student_name: string;
	rule_name: string;
}

// 获取学生的所有记录（带扩展信息）
const studentRecords = computed<ExtendedRecord[]>(() => {
	if (!appStore.activeGrade) return [];
	// 筛选学生记录
	const curRecordList = appStore.activeGrade.gradeInfo.recordList;
	const filtered = !props.studentId ? curRecordList : curRecordList.filter(
		record => record.stu_id === props.studentId
	);
	// 添加学生姓名和规则名称
	return filtered.map(record => ({
		...record,
		student_name: getstudent_name(record.stu_id),
		rule_name: getrule_name(record.rule_id)
	})).reverse();
});

// 根据筛选类型和关键词过滤
const filteredRecords = computed(() => {
	let result = studentRecords.value;

	// 按积分类型筛选
	if (filterType.value === 'add') {
		result = result.filter(record => record.points > 0);
	} else if (filterType.value === 'subtract') {
		result = result.filter(record => record.points < 0);
	}

	// 按学生ID筛选
	if (searchStudentId.value) {
		result = result.filter(record => 
			record.stu_id.toLowerCase().includes(searchStudentId.value.toLowerCase())
		);
	}

	// 按学生姓名筛选
	if (searchStudentName.value) {
		result = result.filter(record => 
			record.student_name.toLowerCase().includes(searchStudentName.value.toLowerCase())
		);
	}

	// 按规则名称筛选
	if (searchRuleName.value) {
		result = result.filter(record => 
			record.rule_name.toLowerCase().includes(searchRuleName.value.toLowerCase())
		);
	}

	return result;
});

// 分页后的数据
const paginatedRecords = computed(() => {
	const start = (currentPage.value - 1) * pageSize.value;
	const end = start + pageSize.value;
	return filteredRecords.value.slice(start, end);
});

// 分页大小变化
const handleSizeChange = (val: number) => {
	pageSize.value = val;
	currentPage.value = 1;
};

// 处理分页切换
const handlePageChange = (page: number) => {
	currentPage.value = page;
};

// 奖品详情弹窗
const prizeDetailVisible = ref(false);
const prizeDetailData = ref<Partial<Prize>>({});
const prizeDetailDialogRef = ref();

// 获取奖品信息
const getPrizeById = (prizeId: string): Prize | undefined => {
	return appStore.database.prizeList.find(p => p.id === prizeId);
};

// 查看奖品详情
const handleViewPrize = async (record: ExtendedRecord) => {
	// 从规则ID中提取奖品ID（格式：bid_奖品ID）
	const prizeId = record.rule_id.replace(BID_RECORD_PREFIX, '');
	const prize = getPrizeById(prizeId);

	if (prize) {
		prizeDetailData.value = { ...prize };
		prizeDetailVisible.value = true;

		// 如果有图片，加载并显示到编辑器
		if (prize.image) {
			try {
				const uint8Array = await loadImageAsUint8Array(prize.image);
				if (uint8Array && prizeDetailDialogRef.value?.imageEditorRef) {
					await prizeDetailDialogRef.value.imageEditorRef.setImage(uint8Array, prize.image);
				}
			} catch (error) {
				console.error('Failed to load prize image:', error);
			}
		}
	}
};

// 监听学生ID变化，重置分页
watch(() => props.studentId, () => {
	currentPage.value = 1;
});
</script>

<style scoped>
.record-list {
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 100%;
}

.filter-bar {
	display: flex;
	gap: 12px;
	margin-bottom: 16px;
}

.search-input {
	width: 140px;
}

.filter-select {
	width: 140px;
}

.pagination {
	display: flex;
	justify-content: flex-end;
	margin-top: 10px;
}


.empty-state {
	text-align: center;
	padding: 40px 0;
	color: #999;
}

.text-success {
	color: #67c23a;
	font-weight: 600;
}

.text-danger {
	color: #f56c6c;
	font-weight: 600;
}

.cursor-pointer {
	cursor: pointer;
}
</style>