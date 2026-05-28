<template>
	<!-- 
	 文件上传包含两种（使用 file-select 组件，解析使用的是 xlsx 库）
		1.txt 文件，使用逗号或分号分割名称
		2.excel 文件，可以设置名称、积分
		3.加载到一个动态表格，可以添加、编辑、删除
		4.可以编辑名称、积分，也可以设置分组
		5.要能动态创建分组，分组列可以动态选择
	-->
	<el-dialog title="批量新增学生" v-model="visible" width="600px">
		<el-alert type="warning" show-icon :closable="false" style="margin-bottom: 10px;" title="">
			<p> 支持两种快速添加方式：</p>
			<p>1.上传 TXT 文件，内容以中文 ，或 ；分隔名称即可批量导入；</p>
			<p>2.下载 <el-button link type="success" text="success" @click="downloadTemp">Excel
					模板</el-button>，按模板填好信息后上传，一键批量添加。</p>
		</el-alert>
		<FileUpload accept=".txt,.xlsx,.xls" @change="handleChangeFile" />
		<el-divider style="margin: 10px 0;" />
		<div style="height: 360px">
			<el-auto-resizer>
				<template #default="{ height, width }">
					<el-table-v2 border :columns="columns" :data="studentList" :width="width" :height="height" fixed />
				</template>
			</el-auto-resizer>
		</div>
		<template #footer>
			<div style="display: flex; align-items: center; justify-content: space-between;">
				<el-space>
					<el-button type="primary" @click="handleBatchPoints">统一修改积分</el-button>
				</el-space>
				<el-space>
					<el-button @click="handleDialogClose">取消</el-button>
					<el-button type="primary" @click="handleSubmit">提交</el-button>
				</el-space>
			</div>
		</template>
	</el-dialog>

	<el-dialog title="统一修改积分" v-model="batchPointsVisible" width="400px">
		<el-form label-width="80px">
			<el-form-item label="积分值">
				<el-input-number v-model="batchPointsValue"  style="width: 100%;" controls-position="right" />
			</el-form-item>
		</el-form>
		<template #footer>
			<el-space>
				<el-button @click="batchPointsVisible = false">取消</el-button>
				<el-button type="primary" @click="handleConfirmBatchPoints">确认</el-button>
			</el-space>
		</template>
	</el-dialog>
	<!-- 批量新增学生按钮 -->
	<el-button type="primary" @click="handleBatchAddStu">批量新增学生</el-button>
</template>
<script setup lang="tsx">
import { ElMessage, ElInput } from 'element-plus';
import FileUpload from '../../../components/file-upload.vue';
import { Student } from '../../../database/class';
import { ref, withKeys } from 'vue';
import * as XLSX from 'xlsx';
import { useAppStore } from '../../../store/models/app';
import type { FunctionalComponent } from 'vue'
import type { Column, InputInstance } from 'element-plus'
import { saveGradeInfo } from '../../../database';

const appStore = useAppStore();
const studentList = ref<any[]>([]);
const visible = ref(false);
const batchPointsVisible = ref(false);
const batchPointsValue = ref(0);

type SelectionCellProps = {
	value?: any
	intermediate?: boolean
	onChange: (value?: any) => void
	onBlur: () => void
	onKeydownEnter: () => void
	forwardRef: (el: InputInstance) => void
}


const InputCell: FunctionalComponent<SelectionCellProps> = ({
	value,
	onChange,
	onBlur,
	onKeydownEnter,
	forwardRef,
}) => {
	return (
		<ElInput
			ref={forwardRef as any}
			onInput={onChange}
			onBlur={onBlur}
			onKeydown={withKeys(onKeydownEnter, ['enter'])}
			modelValue={value}
		/>
	)
}

const columns: Column<any>[] = [
	{
		key: "id",
		dataKey: "id",
		title: "序号",
		width: 100
	},
	{
		key: "name",
		dataKey: "name",
		title: "姓名",
		width: 200,
		cellRenderer: (params: any) => {
			const { rowData, column } = params;
			const onChange = (value?: string) => {
				rowData[column.dataKey] = value || ''
			}
			const onEnterEditMode = () => {
				rowData.nameEditing = true
			}

			const onExitEditMode = () => (rowData.nameEditing = false)
			const input = ref()
			const setRef = (el: any) => {
				input.value = el
				if (el) {
					el.focus?.()
				}
			}

			return rowData.nameEditing ? (
				<InputCell
					forwardRef={setRef}
					value={rowData[column.dataKey]}
					onChange={onChange}
					onBlur={onExitEditMode}
					onKeydownEnter={onExitEditMode}
				/>
			) : (
				<div class="table-v2-inline-editing-trigger"
					onClick={onEnterEditMode} >
					{rowData[column.dataKey]}
				</div>
			)
		},
	},
	{
		key: "points",
		dataKey: "points",
		title: "积分",
		width: 200,
		cellRenderer: (params: any) => {
			const { rowData, column } = params;
			const onChange = (value?: string) => {
				rowData[column.dataKey] = (value || "").length > 0 ? Number(value) : ''
			}
			const onEnterEditMode = () => {
				rowData.pointsEditing = true
			}

			const onExitEditMode = () => {
				rowData.pointsEditing = false
			}
			const input = ref()
			const setRef = (el: any) => {
				input.value = el
				if (el) {
					el.focus?.()
				}
			}

			return rowData.pointsEditing ? (
				<InputCell
					forwardRef={setRef}
					value={rowData[column.dataKey]}
					onChange={onChange}
					onBlur={onExitEditMode}
					onKeydownEnter={onExitEditMode}
				/>
			) : (
				<div class="table-v2-inline-editing-trigger"
					onClick={onEnterEditMode} >
					{rowData[column.dataKey]}
				</div>
			)
		},
	},
]

const handleChangeFile = async (file: any) => {
	const [_, fileType] = file.name.split('.');
	const studentCurIndex = appStore.activeGrade?.gradeInfo.indexMap.student;
	if (fileType === 'txt') {
		// 解析 txt 文件
		const reader = new FileReader();
		reader.onload = (e) => {
			const content = e.target?.result as string;
			// 使用逗号或分号分割名称
			const names = content.split(/[；，]/).map(name => name.trim()).filter(name => name);
			studentList.value = names.map((name, index) => ({ id: ((index + 1) + Number(studentCurIndex)).toString(), name, points: 0, nameEditing: false, pointsEditing: false }));
		};
		reader.readAsText(file.raw);
	}
	else if (fileType === 'xlsx' || fileType === 'xls') {
		const reader = new FileReader();
		reader.onload = function (e: any) {
			// 解析 excel 文件
			const data = new Uint8Array(e.target.result);
			// 解析文件
			const workbook = XLSX.read(data, { type: 'array' });
			// 获取第一个工作表名称
			const firstSheet = workbook.SheetNames[0];
			// 获取工作表对象
			const worksheet = workbook.Sheets[firstSheet];
			// 将工作表转为 JSON 格式
			const jsonData = XLSX.utils.sheet_to_json(worksheet);
			studentList.value = Array.from(jsonData.values()).map((item: any, index: number) => {
				const [name, points] = Object.values(item);
				return { name, points: points || 0, id: ((index + 1) + Number(studentCurIndex)).toString(), nameEditing: false, pointsEditing: false }
			});
		}
		reader.readAsArrayBuffer(file.raw);
	}
	else {
		ElMessage.error('文件类型错误');
	}
}

const handleBatchAddStu = () => {
	visible.value = true
	studentList.value = []
}

const handleDialogClose = () => {
	visible.value = false;
	studentList.value = [];
}

const handleBatchPoints = () => {
	batchPointsVisible.value = true;
	batchPointsValue.value = 0;
}

const handleConfirmBatchPoints = () => {
	studentList.value.forEach(student => {
		student.points = batchPointsValue.value;
	});
	batchPointsVisible.value = false;
	ElMessage.success('积分修改成功');
}

const downloadTemp = async () => {
	try {
		const sheetData = [
			["姓名", "积分"],      // 表头
			["miaomiao", 0]       // 数据行
		];
		// 将数据转换为 SheetJS 的工作表
		const workbook = XLSX.utils.book_new();         // 新建工作簿
		const worksheet = XLSX.utils.aoa_to_sheet(sheetData); // 用二维数组创建工作表
		XLSX.utils.book_append_sheet(workbook, worksheet, "积分榜"); // 将工作表添加到工作簿，命名为“积分榜”
		//导出并触发下载
		XLSX.writeFile(workbook, "students.xlsx");
		ElMessage.warning('开始下载模板');
	} catch (error) {
		console.error('下载模板失败:', error);
		ElMessage.error('模板下载失败');
	}
}

const handleSubmit = async () => {
	// 提交表单
	if (appStore.activeGrade) {
		const students = studentList.value.map(stu => {
			const { id, name, points } = stu;
			return new Student({ id, name, points });
		})
		const lastIndex = students[students.length - 1].id;
		appStore.activeGrade.gradeInfo.studentList.push(...students);
		appStore.activeGrade.gradeInfo.indexMap.student = Number(lastIndex) + 1;
		await saveGradeInfo(appStore.activeGrade.id, JSON.stringify(appStore.activeGrade));
		ElMessage.success('班级信息更新成功');
		visible.value = false
	}
}

</script>
<style scoped>
::v-deep(.table-v2-inline-editing-trigger) {
	width: 200px;
	border-radius: 4px;
	border: 1px transparent dotted;
	padding: 4px;
}

::v-deep(.table-v2-inline-editing-trigger:hover) {
	border-color: var(--el-color-primary);
}
</style>