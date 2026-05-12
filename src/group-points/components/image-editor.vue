<template>
  <div class="image-editor-compact">
    <ImageEditor
      ref="imageEditor"
      v-model:file-image="selectedFileImageForEdit"
      :max-width="400"
      :max-height="300"
      :color-brush="colorBrush"
      background-crop-div-color="rgba(0,0,0,0.3)"
      border-crop-div-color="#42b983"
    />

    <div class="controls">
      <el-button v-if="!isEditing" type="primary" @click="loadImage" :loading="loading">
        {{ selectedFileImageForEdit ? '更换图片' : '选择图片' }}
      </el-button>
      <el-space v-if="selectedFileImageForEdit && !isEditing">
        <el-button @click="enablePainting">画笔</el-button>
        <el-button @click="enableCroping">裁剪</el-button>
      </el-space>
      <div v-if="activeBrushing" class="color-picker-inline">
        <input type="color" v-model="colorBrush" title="选择画笔颜色" />
      </div>
      <el-space v-if="isEditing">
        <el-button @click="handleCancelChanges">取消</el-button>
        <el-button type="success" @click="handleSaveChanges">保存</el-button>
      </el-space>
    </div>
  </div>
</template>

<script setup >
import { ref, computed } from 'vue'
import { ImageEditor } from 'vue3-image-editor'
import 'vue3-image-editor/styles.css'
import { openFile } from '../utils'
import { ElMessage } from 'element-plus'
import imageCompression from 'browser-image-compression'

const imageEditor = ref(null)
const selectedFileImageForEdit = ref(null)
const colorBrush = ref('#ff0000')
const activeBrushing = ref(false)
const activeCroping = ref(false)
const loading = ref(false)

const isEditing = computed(() => activeBrushing.value || activeCroping.value)

const loadImage = async () => {
  loading.value = true
  try {
    const {name, content} = await openFile('jpg,jpeg,png,gif')
    if(name && content) {
      const extemsons = name.split('.')[1]
      const type = `image/${extemsons}`
      const file = new File([content], name, { type })
      selectedFileImageForEdit.value = file
      ElMessage.success('图片加载成功')
    }else {
      throw new Error('图片加载失败')
    }
  } catch (error) {
    console.error('图片加载失败:', error)
    ElMessage.error('图片加载失败')
  } finally {
    loading.value = false
  }
}

const enablePainting = () => {
  imageEditor.value?.enablePainting()
  activeBrushing.value = true
  ElMessage.info('画笔模式已启用')
}

const enableCroping = () => {
  imageEditor.value?.enableCroping()
  activeCroping.value = true
  ElMessage.info('裁剪模式已启用')
}

const handleSaveChanges = () => {
  imageEditor.value?.saveChanges()
  activeBrushing.value = false
  activeCroping.value = false
  ElMessage.success('修改已保存')
}

const handleCancelChanges = () => {
  imageEditor.value?.cancelChanges()
  activeBrushing.value = false
  activeCroping.value = false
}

const compressionImage = async () => {
  if(activeBrushing.value || activeBrushing.value) {
    handleSaveChanges()
  }

  if(!selectedFileImageForEdit.value) return ''
  const options = {
    maxSizeMB: 0.5,        // 最大体积 0.5MB (500KB)
    maxWidthOrHeight: 1920, // 最大宽/高为 1920px
    useWebWorker: true,     // 使用多线程，不阻塞UI
    initialQuality: 0.8,    // 初始质量 80%
    onProgress: (progress) => {
      // compressionProgress.value = progress // 接收压缩进度 (0-100)
    }
  }
  try {
    // 执行压缩
    return await imageCompression(selectedFileImageForEdit.value, options)
    console.log('压缩成功！')
  } catch (error) {
    console.error('压缩失败:', error)
  }
}

defineExpose({
  getImage: compressionImage,
  download: () => imageEditor.value?.download()
})
</script>

<style scoped>
.image-editor-compact {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 400px;
}

.controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.color-picker-inline input {
  width: 32px;
  height: 32px;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

::v-deep(.main-editor-div) {
  padding: 0;
}
</style>