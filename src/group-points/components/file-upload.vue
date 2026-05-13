<template>
  <el-upload
    ref="uploadRef"
    :limit="1"
    v-model:file-list="fileList"
    :auto-upload="false"
    :on-change="handleChange"
    :accept="props.accept"
  >
    <template #trigger>
      <el-button type="primary">选择文件</el-button>
    </template>
    <template #tip>
      <div class="el-upload__tip">
        大小不超过 {{ props.size / 1024 }} kb
      </div>
    </template>
  </el-upload>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { ElMessage, type UploadProps, type UploadUserFile } from 'element-plus';

const props = defineProps({
  accept: {
    type: String,
    default: '',
  },
  size: {
    type: Number,
    default: 10 * 1024,
  },
  onChange: {
    type: Function,
    default: (file: UploadUserFile) => {}
  }
});

const fileList = ref<UploadUserFile[]>([]);

const handleChange: UploadProps['onChange'] = () => {
  const file = fileList.value[0];
  if(file) {
    if(file?.size && file.size > props.size) {
      ElMessage.error('文件大小不能超过 ' + props.size / 1024 + ' kb');
      fileList.value = []
      return;
    }
    props.onChange(file);
  }
};
</script>
