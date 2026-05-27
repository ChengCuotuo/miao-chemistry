<template>
  <div class="main-back">
    <div style="position: absolute; left: 24px; top: 12px; z-index: 1;">
      <el-button type="success" circle :icon="Menu" @click="handleMenuClick" /> 
    </div>
    <div class="clock-container">
      <div class="clock">{{ currentTime }}</div>
      <div class="date">{{ currentDate }}</div>
    </div>

    <!-- 密码验证弹窗 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="请输入密码"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-input
        v-model="inputPassword"
        type="password"
        placeholder="请输入密码"
        show-password
        @keyup.enter="verifyPassword"
      />
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="verifyPassword">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { Menu } from '@element-plus/icons-vue'
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../../group-points/store/models/app'

const props = defineProps({
  onMenu: {
    type: Function,
    default: (type: string) => {}
  }
})

const appStore = useAppStore()
const currentPassword = appStore.database.basicConfig?.password || ''

const currentTime = ref('')
const currentDate = ref('')
let timer: number | null = null

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false
  })
  currentDate.value = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long'
  })
}

const handleMenuClick = () => {
  if (!currentPassword) {
    props.onMenu('menu')
    return
  }
  passwordDialogVisible.value = true
}

const passwordDialogVisible = ref(false)
const inputPassword = ref('')

const verifyPassword = () => {
  if (inputPassword.value === currentPassword) {
    props.onMenu('menu')
    passwordDialogVisible.value = false
    inputPassword.value = ''
  } else {
    ElMessage.error('密码错误')
  }
}

onMounted(() => {
  updateTime()
  timer = window.setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.main-back {
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: clip;
}

.clock-container {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 1;
}

.clock {
  font-size: 72px;
  font-weight: bold;
  color: #333;
  font-family: 'Courier New', monospace;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.date {
  font-size: 24px;
  color: #666;
  margin-top: 16px;
  font-weight: 500;
}
</style>