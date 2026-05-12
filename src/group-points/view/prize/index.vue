<template>
	<div class="prize-list-container">
		<!-- 搜索和新增区域 -->
		<div class="search-bar">
			<el-input v-model="searchQuery" placeholder="请输入奖品名称搜索" class="search-input" prefix-icon="Search"
				@keyup.enter="handleSearch" clearable />
			<el-button type="primary" :icon="Plus" @click="handleAdd">新增奖品</el-button>
		</div>

		<!-- 奖品列表 -->
		<el-table :data="filteredPrizes" border>
			<el-table-column prop="id" label="序号" width="120" align="center" fixed="left">
				<template #default="{ row }">
					<el-tooltip effect="light" :content="row.id">
						<span class="prize-id">{{ row.id.slice(0, 8) }}...</span>
					</el-tooltip>
				</template>
			</el-table-column>
			<el-table-column prop="name" label="奖品名称" align="center" min-width="150" fixed="left" />
			<el-table-column prop="image" label="奖品图片" width="120" align="center">
				<template #default="{ row }">
					<el-image v-if="row.image" :src="getFilePath(row.image)" :preview-src-list="[getFilePath(row.image)]"
						fit="cover" style="width: 60px; height: 60px; border-radius: 4px;" preview-teleported />
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
					<el-button size="small" text :icon="Edit" @click="handleEdit(row)">编辑</el-button>
					<el-button size="small" text type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
				</template>
			</el-table-column>
		</el-table>

		<!-- 分页 -->
		<div class="pagination">
			<el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="currentPage"
				:page-sizes="[10, 30, 60]" :page-size="pageSize" layout="total, sizes, prev, pager, next, jumper"
				:total="prizes.length" />
		</div>

		<!-- 新增/编辑弹窗 -->
		<el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" :before-close="handleDialogClose">
			<el-form ref="formRef" :model="formData" label-width="100px" class="dialog-form">
				<el-form-item label="序号" prop="id" v-if="isEdit">
					<el-input v-model="formData.id" disabled />
				</el-form-item>
				<el-form-item label="奖品名称" prop="name" :rules="[{ required: true, message: '请输入奖品名称', trigger: 'blur' }]">
					<el-input v-model="formData.name" placeholder="请输入奖品名称" />
				</el-form-item>
				<el-form-item label="积分值" prop="points" :rules="[{ required: true, message: '请输入积分值', trigger: 'blur' }]">
					<el-input-number v-model="formData.points" :min="1" controls-position="right" style="width: 100%" />
				</el-form-item>
				<el-form-item label="奖品数量" prop="quantity" :rules="[{ required: true, message: '请输入奖品数量', trigger: 'blur' }]">
					<el-input-number v-model="formData.quantity" :min="0" controls-position="right" style="width: 100%" />
				</el-form-item>
				<el-form-item label="适用班级" prop="allow_grades">
					<el-select v-model="formData.allow_grades" multiple placeholder="请选择适用班级（留空表示所有班级）" style="width: 100%">
						<el-option v-for="grade in gradeList" :key="grade.id" :label="grade.name" :value="grade.id" />
					</el-select>
				</el-form-item>
				<el-form-item label="奖品图片" prop="image">
					<image-editor ref="imageEditorRef" />
				</el-form-item>
				<el-form-item label="奖品描述" prop="description">
					<el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入奖品描述" />
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="handleDialogClose">取消</el-button>
				<el-button type="primary" @click="handleSubmit">确定</el-button>
			</template>
		</el-dialog>

		<!-- 删除确认弹窗 -->
		<el-dialog title="确认删除" v-model="deleteConfirmVisible" width="300px">
			<span>确定要删除奖品"{{ deletePrizeRef?.name }}"吗？</span>
			<template #footer>
				<el-button @click="deleteConfirmVisible = false">取消</el-button>
				<el-button type="danger" @click="confirmDelete">确定删除</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import type { FormInstance } from 'element-plus';
import { useAppStore } from '../../store/models/app';
import { Prize } from '../../database/class';
import { usePrize } from '../../database/utils/usePrize';
import ImageEditor from '../../components/image-editor.vue';
import { saveStaticFile, loadFilePath, getStaticFilePath } from '../../database';

const { createPrize, deletePrize, updatePrize, getPrizeList, searchPrizes } = usePrize();

const appStore = useAppStore();
const prizes = ref<Prize[]>(getPrizeList() || []);

const preFullPath = ref("")

// 搜索关键词
const searchQuery = ref('');

// 分页
const currentPage = ref(1);
const pageSize = ref(10);

// 弹窗相关
const dialogVisible = ref(false);
const deleteConfirmVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const deletePrizeRef = ref<Prize | null>(null);

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

const imageEditorRef = ref()

// 班级列表
const gradeList = computed(() => appStore.database.gradeList.filter(grade => grade.delete === 0));

// 弹窗标题
const dialogTitle = computed(() => (isEdit.value ? '编辑奖品' : '新增奖品'));

// 过滤后的奖品列表
const filteredPrizes = computed(() => {
	if (!searchQuery.value) {
		return prizes.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value);
	}
	const query = searchQuery.value.toLowerCase();
	const filtered = searchPrizes(query);
	return filtered.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value);
});

const getFilePath = async (image: string) => {
  if (!image) return '';
	const staticPath = await loadFilePath(preFullPath.value + '/' + image)
  try {
    const fileURL = await getStaticFilePath(staticPath);
    console.log('本地路径:', staticPath, 'File URL:', fileURL);
    return fileURL;
  } catch (error) {
    console.error('路径转换失败:', error);
    return staticPath;
  }
}

onMounted(async () => {
	preFullPath.value = await loadFilePath('')
	console.log('静态文件路径:', preFullPath.value);
})

// 搜索
const handleSearch = () => {
	currentPage.value = 1;
};

// 新增
const handleAdd = () => {
	isEdit.value = false;
	formData.value = { id: '', name: '', description: '', points: 1, image: '', quantity: 0, allow_grades: [] };
	dialogVisible.value = true;
};

// 编辑
const handleEdit = (row: Prize) => {
	isEdit.value = true;
	formData.value = { ...row };
	dialogVisible.value = true;
};

// 删除确认
const handleDelete = (row: Prize) => {
	deletePrizeRef.value = row;
	deleteConfirmVisible.value = true;
};

// 确认删除
const confirmDelete = async () => {
	if (deletePrizeRef.value) {
		const res = await deletePrize(deletePrizeRef.value.id);
		if (res) {
			prizes.value = getPrizeList();
		}
	}
	deleteConfirmVisible.value = false;
	deletePrizeRef.value = null;
};

// 提交表单
const handleSubmit = async () => {
	formRef.value?.validate(async (valid) => {
		if (valid) {
			const { name, description, points, quantity, allow_grades } = formData.value;
			let imageName = ''
			const params = await imageEditorRef.value.getImage()
			if (params) {
				const { name: fileName, content } = params
				const [namePart, ext] = fileName?.split(".") || []
				imageName = `${namePart}_${uuidv4().slice(0, 16)}.${ext}`
				await saveStaticFile(imageName, content)
			}

			let res;

			if (isEdit.value) {
				// 编辑
				res = await updatePrize({
					id: formData.value.id!,
					name: name!,
					description: description!,
					points: points!,
					image: imageName,
					quantity: quantity!,
					allow_grades: allow_grades || []
				});
			} else {
				// 新增
				res = await createPrize({
					name: name!,
					description: description!,
					points: points!,
					quantity: quantity!,
					image: imageName,
					allow_grades: allow_grades || []
				});
			}

			if (res) {
				prizes.value = getPrizeList();
				dialogVisible.value = false;
				formRef.value?.resetFields();
			}
		}
	});
};

// 关闭弹窗
const handleDialogClose = () => {
	dialogVisible.value = false;
	formRef.value?.resetFields();
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