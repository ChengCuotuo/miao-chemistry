<template>
	<!-- 
	 文件上传包含两种（使用 file-select 组件，解析使用的是 xlsx 库）
		1.txt 文件，使用逗号或分号分割名称
		2.excel 文件，可以设置名称、分数
		3.加载到一个动态表格，可以添加、编辑、删除
		4.可以编辑名称、分数，也可以设置分组
		5.要能动态创建分组，分组列可以动态选择
	-->
	<el-dialog title="批量新增学生" v-model="visible" width="600px">
		<FileUpload accept=".txt,.xlsx,.xls" @change="handleChangeFile" />
		<el-divider style="margin: 10px 0;" />
		<div style="height: 400px">
			<el-auto-resizer>
				<template #default="{ height, width }">
					<el-table-v2 border :columns="columns" :data="studentList" :width="width" :height="height" fixed />
				</template>
			</el-auto-resizer>
		</div>
	</el-dialog>
	<!-- 批量新增学生按钮 -->
	<el-button type="primary" @click="visible = true">批量新增学生</el-button>
</template>
<script setup lang="tsx">
import { ElMessage, ElInput, ElInputNumber } from 'element-plus';
import FileUpload from '../../../components/file-upload.vue';
import { Student } from '../../../database/class';
import { ref, withKeys } from 'vue';
import  * as XLSX from 'xlsx';
import { useAppStore } from '../../../store/models/app';
import type { FunctionalComponent } from 'vue'
import type { Column, InputInstance } from 'element-plus'

const appStore = useAppStore();
const studentList = ref<any[]>([]);
const visible = ref(false);

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
		title: "分数",
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
	const [fileName, fileType] = file.name.split('.');
	const studentCurIndex = appStore.activeGrade?.gradeInfo.indexMap.student;
	if (fileType === 'txt') {
		// 解析 txt 文件
		const reader = new FileReader();
		reader.onload = (e) => {
			const content = e.target?.result as string;
			// 使用逗号或分号分割名称
			const names = content.split(/[；，]/).map(name => name.trim()).filter(name => name);
			studentList.value = names.map((name, index) => ({ id: (index + Number(studentCurIndex)).toString(), name, points: 0, nameEditing: false, pointsEditing: false }));
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
				return { name, points: points || 0, id: (index + Number(studentCurIndex)).toString(), nameEditing: false, pointsEditing: false }
			});
		}
		reader.readAsArrayBuffer(file.raw);
	}
	else {
		ElMessage.error('文件类型错误');
	}
}
</script>
<style scoped>
::v-deep(.table-v2-inline-editing-trigger) {
	border: 1px transparent dotted;
	padding: 4px;
}

::v-deep(.table-v2-inline-editing-trigger:hover) {
	border-color: var(--el-color-primary);
}
</style>