<template>
  <div class="image-editor-container">
    <!-- 图片编辑组件 -->
    <ImageEditor
      ref="imageEditor"
      v-model:file-image="selectedFileImageForEdit"
      :max-width="500"
      :max-height="500"
      :color-brush="colorBrush"
      background-crop-div-color="rgba(0,0,0,0.3)"
      border-crop-div-color="#42b983"
      @finish-editing="finishEditImage"
    />

    <!-- 主控制按钮组 - 未激活编辑模式时显示 -->
    <div class="button-group" v-if="!isEditing">
      <button class="btn btn-primary" @click="loadSampleImage">加载示例图片</button>
      <button class="btn btn-outline" @click="callEnablePainting">
        ✏️ 画笔标注
      </button>
      <button class="btn btn-outline" @click="callEnableCroping">
        ✂️ 裁剪图片
      </button>
      <button class="btn btn-outline" @click="callDownLoadImage">
        💾 下载图片
      </button>
    </div>

    <!-- 画笔颜色选择器 - 画笔模式下显示 -->
    <div class="color-picker" v-if="activeBrushing">
      <label>画笔颜色：</label>
      <input type="color" v-model="colorBrush" />
    </div>

    <!-- 编辑模式操作按钮组 - 编辑模式下显示 -->
    <div class="action-buttons" v-if="isEditing">
      <button class="btn btn-secondary" @click="callCancelChanges">取消</button>
      <button class="btn btn-success" @click="callSaveChanges">保存修改</button>
    </div>

    <!-- 当前状态提示 -->
    <div class="status" v-if="statusMessage">
      {{ statusMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ImageEditor } from 'vue3-image-editor'
import 'vue3-image-editor/styles.css'
import { openFile } from '../utils'

// 响应式数据
const imageEditor = ref(null)
const selectedFileImageForEdit = ref(null)
const colorBrush = ref('#ff0000')  // 默认红色画笔
const activeBrushing = ref(false)
const activeCroping = ref(false)
const statusMessage = ref('')

// 计算属性：是否处于编辑模式
const isEditing = computed(() => activeBrushing.value || activeCroping.value)

/**
 * 加载示例图片
 * 创建一个测试用的 File 对象
 */
const loadSampleImage = async () => {
  statusMessage.value = '正在加载图片...'
  
  // 方式1：通过 URL 获取图片并转为 File
  try {
    const image = await openFile('jpg,jpeg,png,gif')
    const file = new File([image], 'sample-image.jpg', { type: 'image/jpeg' })
    selectedFileImageForEdit.value = file
    statusMessage.value = '图片加载成功！点击画笔或裁剪开始编辑'
  } catch (error) {
    console.error('图片加载失败:', error)
    statusMessage.value = '图片加载失败'
  }
}

/**
 * 启用画笔模式
 */
const callEnablePainting = () => {
  if (imageEditor.value) {
    imageEditor.value.enablePainting()
    activeBrushing.value = true
    statusMessage.value = '画笔模式已启用，拖动鼠标在图片上绘制'
  }
}

/**
 * 启用裁剪模式
 */
const callEnableCroping = () => {
  if (imageEditor.value) {
    imageEditor.value.enableCroping()
    activeCroping.value = true
    statusMessage.value = '裁剪模式已启用，拖动裁剪框选择区域'
  }
}

/**
 * 保存修改（画笔/裁剪后的确认）
 */
const callSaveChanges = () => {
  if (imageEditor.value) {
    imageEditor.value.saveChanges()
    activeBrushing.value = false
    activeCroping.value = false
    statusMessage.value = '修改已保存'
  }
}

/**
 * 取消修改（画笔/裁剪后的撤销）
 */
const callCancelChanges = () => {
  if (imageEditor.value) {
    imageEditor.value.cancelChanges()
    activeBrushing.value = false
    activeCroping.value = false
    statusMessage.value = '已取消修改'
  }
}

/**
 * 下载编辑后的图片
 */
const callDownLoadImage = () => {
  if (imageEditor.value) {
    imageEditor.value.download()
    statusMessage.value = '图片下载中...'
  }
}

/**
 * 编辑完成回调 - 获取最终编辑后的文件
 * @param {File} newFile - 编辑完成后的图片文件
 */
const finishEditImage = (newFile) => {
  console.log('编辑完成，最终文件:', newFile)
  statusMessage.value = '编辑已完成！'
  
  // 可以在这里将文件上传到服务器
  // uploadToServer(newFile)
}

// 可以在这里添加上传逻辑
const uploadToServer = async (file) => {
  const formData = new FormData()
  formData.append('image', file)
  // 示例上传代码
  // const response = await fetch('/api/upload', { method: 'POST', body: formData })
}
</script>

<style scoped>
.image-editor-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.button-group {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  justify-content: center;
}

.color-picker {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
}

.color-picker label {
  font-size: 14px;
  font-weight: 500;
}

.color-picker input {
  width: 50px;
  height: 40px;
  cursor: pointer;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 2px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #42b983;
  color: white;
}

.btn-primary:hover {
  background-color: #359268;
}

.btn-outline {
  background-color: white;
  border: 2px solid #42b983;
  color: #42b983;
}

.btn-outline:hover {
  background-color: #42b983;
  color: white;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-success:hover {
  background-color: #218838;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.status {
  margin-top: 16px;
  padding: 10px;
  background-color: #f0f9f4;
  border-radius: 8px;
  color: #42b983;
  font-size: 14px;
  text-align: center;
}
</style>