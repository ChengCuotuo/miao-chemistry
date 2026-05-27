<template>
	<div class="prize-list-container">
		<!-- 奖品列表 -->
		<el-table :data="filteredPrizes" border>
			<el-table-column prop="name" label="奖品名称" align="center" min-width="100" fixed="left" />
			<el-table-column prop="image" label="奖品图片" width="120" align="center">
				<template #default="{ row }">
					<el-image v-if="row.image && imageBase64Map[row.image]" :src="imageBase64Map[row.image]"
						:preview-src-list="[imageBase64Map[row.image]]" fit="cover"
						style="width: 60px; height: 60px; border-radius: 4px;" preview-teleported />
					<span v-else-if="row.image" class="text-gray">加载中...</span>
					<span v-else class="text-gray">暂无图片</span>
				</template>
			</el-table-column>
			<el-table-column prop="quantity" label="奖品数量" width="120" align="center">
				<template #default="{ row }">
					<el-tag :type="getQuantityTagType(row.quantity)" size="large">{{ row.quantity }}</el-tag>
				</template>
			</el-table-column>
			<el-table-column prop="points" label="积分值" width="120" align="center">
				<template #default="{ row }">
					<el-tag type="warning" size="large">{{ row.points }} 分</el-tag>
				</template>
			</el-table-column>
			<el-table-column prop="allow_grades" label="适用班级" width="150" align="center" show-overflow-tooltip>
				<template #default="{ row }">
					<span v-if="!row.allow_grades || row.allow_grades.length === 0" class="text-gray">所有班级</span>
					<span v-else>{{row.allow_grades.map((gradeId: string) => gradeList.find((grade) => grade.id ===
						gradeId)?.name || gradeId).join(', ')}}</span>
				</template>
			</el-table-column>
			<el-table-column prop="description" label="奖品描述" align="center" min-width="200" show-overflow-tooltip />
			<el-table-column label="操作" width="180" align="center" fixed="right">
				<template #default="{ row }">
					<el-button type="primary" v-if="row.quantity > 0" size="small" text :icon="Money" @click="handleBid(row)">竞价</el-button>
					<el-button size="small" text :icon="View" @click="handleEdit(row)">详情</el-button>
				</template>
			</el-table-column>
		</el-table>

		<!-- 分页 -->
		<div class="pagination">
			<el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="currentPage"
				:page-sizes="[10, 30, 60]" :page-size="pageSize" layout="total, sizes, prev, pager, next, jumper"
				:total="prizes.length" />
		</div>

		<!-- 奖品详情弹窗 -->
		<PrizeDetailDialog
			v-model:visible="dialogVisible"
			:form-data="formData"
			:read-only="true"
			ref="prizeDetailDialogRef"
		/>

		<!-- 竞价弹窗 -->

		<!-- 竞价弹窗 -->
		<BidDialog 
			v-model:visible="bidDialogVisible" 
			:prize="currentBidPrize" 
			:students="students" 
			@success="handleBidSuccess" 
		/>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { View, Money } from '@element-plus/icons-vue';
import { useAppStore } from '../../../store/models/app';
import { Prize } from '../../../database/class';
import { usePrize } from '../../../database/utils/usePrize';
import BidDialog from './BidDialog.vue';
import PrizeDetailDialog from './PrizeDetailDialog.vue';
import { useStudent } from '../../../database/utils/useStudent';

import {  loadImagePath, loadImageAsBase64, loadImageAsUint8Array } from '../../../database';

const { getPrizeList } = usePrize();
const { getStudentList } = useStudent();
const appStore = useAppStore();

const prizes = ref<Prize[]>(getPrizeList() || []);
const students = ref(getStudentList());
const preFullPath = ref("")

// 分页
const currentPage = ref(1);
const pageSize = ref(10);

// 弹窗相关
const dialogVisible = ref(false);

// 表单数据
const formData = ref<Partial<Prize>>({
	id: '',
	name: '',
	description: '',
	points: 1,
	image: '',
	quantity: 0,
	allow_grades: []
});

const prizeDetailDialogRef = ref()

// 班级列表
const gradeList = computed(() => appStore.database.gradeList.filter(grade => grade.delete === 0));



// 过滤后的奖品列表
const filteredPrizes = computed(() => {
	const gradeId = appStore.activeGrade?.id || '';
	return (prizes.value.filter((item) => {
		if (!item.allow_grades || item.allow_grades.length === 0) {
			return true
		}
		return item.allow_grades.includes(gradeId)
	}))
});

// 图片 base64 缓存
const imageBase64Map = ref<Record<string, string>>({});

// 加载单张图片为 base64
const loadSingleImage = async (imageName: string) => {
	if (!imageName || imageBase64Map.value[imageName]) return;
	const base64 = await loadImageAsBase64(imageName);
	if (base64) {
		imageBase64Map.value[imageName] = base64;
	}
};

// 加载所有图片
const loadAllImages = async () => {
	const imageNames = [...new Set(prizes.value.map(p => p.image).filter(Boolean))];
	await Promise.all(imageNames.map(loadSingleImage));
};

onMounted(async () => {
	preFullPath.value = await loadImagePath('')
	console.log('静态文件路径:', preFullPath.value);
	// 加载所有图片
	await loadAllImages();
});

// 查看详情
const handleEdit = async (row: Prize) => {
	formData.value = { ...row };

	// 先打开弹窗，确保组件已挂载
	dialogVisible.value = true;

	// 等待弹窗打开和组件挂载
	await new Promise(resolve => setTimeout(resolve, 100));

	// 如果有图片，加载并显示到编辑器
	if (row.image) {
		try {
			const uint8Array = await loadImageAsUint8Array(row.image);

			if (uint8Array && prizeDetailDialogRef.value?.imageEditorRef) {
				await prizeDetailDialogRef.value.imageEditorRef.setImage(uint8Array, row.image);
			}
		} catch (error) {
			console.error('Failed to load existing image:', error);
		}
	}
};

// 竞价弹窗
const bidDialogVisible = ref(false);
const currentBidPrize = ref<Prize | null>(null);

// 竞价
const handleBid = async (row: Prize) => {
	currentBidPrize.value = row;
	students.value = getStudentList();
	bidDialogVisible.value = true;
};

// 竞价成功回调
const handleBidSuccess = () => {
	prizes.value = getPrizeList();
	students.value = getStudentList();
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

// 获取数量标签类型
const getQuantityTagType = (quantity: number) => {
	if (quantity === 0) return 'danger';
	if (quantity < 10) return 'warning';
	return 'success';
};
</script>

<style scoped>
.prize-list-container {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	background: #fff;
	padding: 10px;
}

.search-bar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
}

.search-input {
	width: 200px;
}

.pagination {
	display: flex;
	justify-content: flex-end;
	margin-top: 10px;
}

.dialog-form {
	padding-top: 10px;
}

.prize-id {
	font-family: 'Courier New', monospace;
	font-size: 12px;
	color: #909399;
	background: #f5f7fa;
	padding: 2px 6px;
	border-radius: 4px;
}

.text-gray {
	color: #909399;
}
</style>