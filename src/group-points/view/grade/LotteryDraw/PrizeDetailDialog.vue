<template>
	<el-dialog :title="dialogTitle" v-model="props.visible" width="600px" :before-close="handleClose">
		<el-form ref="formRef" :model="props.formData" label-width="100px" class="dialog-form">
			<el-form-item label="奖品名称" prop="name">
				<el-input :disabled="props.readOnly" v-model="props.formData.name" placeholder="请输入奖品名称" />
			</el-form-item>
			<el-form-item label="积分值" prop="points">
				<el-input-number :disabled="props.readOnly" v-model="props.formData.points" :min="1" controls-position="right" style="width: 100%" />
			</el-form-item>
			<el-form-item label="奖品数量" prop="quantity">
				<el-input-number :disabled="props.readOnly" v-model="props.formData.quantity" :min="0" controls-position="right" style="width: 100%" />
			</el-form-item>
			<el-form-item label="奖品图片" prop="image">
				<image-editor :disabled="props.readOnly" ref="imageEditorRef" />
			</el-form-item>
			<el-form-item label="奖品描述" prop="description">
				<el-input :disabled="props.readOnly" v-model="props.formData.description" type="textarea" :rows="3" placeholder="请输入奖品描述" />
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button type="primary" @click="handleClose">关闭</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { FormInstance } from 'element-plus';
import type { Prize } from '../../../database/class';
import ImageEditor from '../../../components/image-editor.vue';

interface Props {
	visible: boolean;
	formData: Partial<Prize>;
	readOnly: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
	(e: 'update:visible', value: boolean): void;
}>();

const formRef = ref<FormInstance>();
const imageEditorRef = ref();

const dialogTitle = computed(() => (props.readOnly ? '奖品详情' : '编辑奖品'));

const handleClose = () => {
	emit('update:visible', false);
	formRef.value?.resetFields();
};

// 暴露方法供父组件调用
defineExpose({
	imageEditorRef,
	handleClose
});
</script>

<style scoped>
.dialog-form {
	padding-top: 10px;
}
</style>