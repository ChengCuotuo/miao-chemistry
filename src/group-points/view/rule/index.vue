<template>
	<div class="rule-list-container">
		<!-- 搜索和新增区域 -->
		<div class="search-bar">
			<el-space>
				<el-input v-model="searchQuery" placeholder="请输入规则名称搜索" class="search-input" prefix-icon="Search"
					@keyup.enter="handleSearch" clearable />
				<el-select v-model="ruleType" placeholder="请选择规则类型" class="search-input" clearable @keyup.enter="handleSearch">
					<el-option label="加分规则" value="add" />
					<el-option label="减分规则" value="subtract" />
				</el-select>
			</el-space>
			<el-button type="primary" :icon="Plus" @click="handleAdd">新增规则</el-button>
		</div>

		<!-- 规则列表 -->
		<el-table :data="filteredRules" border>
			<el-table-column prop="id" label="序号" width="120" align="center" fixed="left">
				<template #default="{ row }">
					<el-tooltip effect="light" :content="row.id">
						<span class="rule-id">{{ row.id.slice(0, 8) }}...</span>
					</el-tooltip>
				</template>
			</el-table-column>
			<el-table-column prop="name" label="规则名称" align="center" min-width="150" fixed="left" />
			<el-table-column prop="points" label="积分值" width="120" align="center">
				<template #default="{ row }">
					<el-tag :type="getPointsTagType(row.points)" size="large">{{ row.points }} 分</el-tag>
				</template>
			</el-table-column>
			<el-table-column prop="allow_grades" label="适用班级" width="150" align="center" show-overflow-tooltip>
				<template #default="{ row }">
					<span v-if="!row.allow_grades || row.allow_grades.length === 0" class="text-gray">所有班级</span>
					<span v-else>{{row.allow_grades.map((gradeId: string) => gradeList.find((grade) => grade.id ===
						gradeId)?.name || gradeId).join(', ') }}</span>
				</template>
			</el-table-column>
			<el-table-column prop="description" label="规则描述" align="center" min-width="200" show-overflow-tooltip />
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
				:total="rules.length" />
		</div>

		<!-- 新增/编辑弹窗 -->
		<el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" :before-close="handleDialogClose">
			<el-form ref="formRef" :model="formData" label-width="100px" class="dialog-form">
				<el-form-item label="序号" prop="id" v-if="isEdit">
					<el-input v-model="formData.id" disabled />
				</el-form-item>
				<el-form-item label="规则名称" prop="name" :rules="[{ required: true, message: '请输入规则名称', trigger: 'blur' }]">
					<el-input v-model="formData.name" placeholder="请输入规则名称" />
				</el-form-item>
				<el-form-item label="积分值" prop="points" :rules="[{ required: true, message: '请输入积分值', trigger: 'blur' }]">
					<el-input-number v-model="formData.points" :min="-999" :max="999" controls-position="right"
						style="width: 200px" />
				</el-form-item>
				<el-form-item label="适用班级" prop="allow_grades">
					<el-select v-model="formData.allow_grades" multiple placeholder="请选择适用班级（留空表示所有班级）" style="width: 100%">
						<el-option v-for="grade in gradeList" :key="grade.id" :label="grade.name" :value="grade.id" />
					</el-select>
				</el-form-item>
				<el-form-item label="规则描述" prop="description">
					<el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入规则描述" />
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="handleDialogClose">取消</el-button>
				<el-button type="primary" @click="handleSubmit">确定</el-button>
			</template>
		</el-dialog>

		<!-- 删除确认弹窗 -->
		<el-dialog title="确认删除" v-model="deleteConfirmVisible" width="300px">
			<span>确定要删除规则"{{ deleteRuleRef?.name }}"吗？</span>
			<template #footer>
				<el-button @click="deleteConfirmVisible = false">取消</el-button>
				<el-button type="danger" @click="confirmDelete">确定删除</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import type { FormInstance } from 'element-plus';
import { useAppStore } from '../../store/models/app';
import { Rule } from '../../database/class';
import { useRule } from '../../database/utils/useRule';

const { createRule, deleteRule, updateRule, getRuleList, searchRules } = useRule();

const appStore = useAppStore();
const rules = ref<Rule[]>(getRuleList() || []);

// 搜索关键词
const searchQuery = ref('');
const ruleType = ref('');

// 分页
const currentPage = ref(1);
const pageSize = ref(10);

// 弹窗相关
const dialogVisible = ref(false);
const deleteConfirmVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const deleteRuleRef = ref<Rule | null>(null);

// 表单数据
const formData = ref<Partial<Rule>>({
	id: '',
	name: '',
	description: '',
	points: 0,
	allow_grades: []
});

// 班级列表
const gradeList = computed(() => appStore.database.gradeList.filter(grade => grade.delete === 0));

// 弹窗标题
const dialogTitle = computed(() => (isEdit.value ? '编辑规则' : '新增规则'));

// 过滤后的规则列表
const filteredRules = computed(() => {
	if (!searchQuery.value && !ruleType.value) {
		return rules.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value);
	}
	const query = searchQuery.value.toLowerCase();
	const filtered = rules.value.filter((item) => {
		const includeName = item.name.toLowerCase().includes(query)
		const sameType = ruleType.value === 'add' ? item.points > 0 : ruleType.value === 'subtract' ? item.points < 0 : true
		return includeName && sameType
	});
	return filtered.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value);
});

// 搜索
const handleSearch = () => {
	currentPage.value = 1;
};

// 新增
const handleAdd = () => {
	isEdit.value = false;
	formData.value = { id: '', name: '', description: '', points: 0, allow_grades: [] };
	dialogVisible.value = true;
};

// 编辑
const handleEdit = (row: Rule) => {
	isEdit.value = true;
	formData.value = { ...row };
	dialogVisible.value = true;
};

// 删除确认
const handleDelete = (row: Rule) => {
	deleteRuleRef.value = row;
	deleteConfirmVisible.value = true;
};

// 确认删除
const confirmDelete = async () => {
	if (deleteRuleRef.value) {
		const res = await deleteRule(deleteRuleRef.value.id);
		if (res) {
			rules.value = getRuleList();
		}
	}
	deleteConfirmVisible.value = false;
	deleteRuleRef.value = null;
};

// 提交表单
const handleSubmit = async () => {
	formRef.value?.validate(async (valid) => {
		if (valid) {
			const { name, description, points, allow_grades } = formData.value;
			let res;

			if (isEdit.value) {
				// 编辑
				res = await updateRule(formData.value.id!, name!, description!, points!, allow_grades || []);
			} else {
				// 新增
				res = await createRule(name!, description!, points!, allow_grades || []);
			}

			if (res) {
				rules.value = getRuleList();
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

// 获取积分标签类型
const getPointsTagType = (points: number) => {
	if (points > 0) return 'success';
	if (points < 0) return 'danger';
	return 'info';
};
</script>

<style scoped>
.rule-list-container {
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
	width: 300px;
}

.pagination {
	display: flex;
	justify-content: flex-end;
	margin-top: 10px;
}

.dialog-form {
	padding-top: 10px;
}

.rule-id {
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