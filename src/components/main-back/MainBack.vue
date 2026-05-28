<template>
  <div class="main-back">
    <div style="position: absolute; left: 24px; top: 12px; z-index: 1;">
      <el-space>
        <el-button type="success" circle :icon="Menu" @click="handleMenuClick" /> 
        <el-tag v-if="buildType === 'trial'" type="warning">试用版</el-tag>
      </el-space>
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

    <!-- 试用版本过期提示弹窗 -->
    <el-dialog
      v-model="expiredDialogVisible"
      title="试用版本已过期"
      width="500px"
      :close-on-click-modal="false"
      :show-close="false"
    >
      <div class="expired-content">
        <el-result
          icon="warning"
          title="试用版本已过期"
          sub-title="感谢您的使用，试用期限已结束"
        >
          <template #extra>
            <div class="contact-info">
              <p>如需继续使用，请联系管理员升级正式版本：</p>
              <div class="contact-item">
                <el-icon><Message /></el-icon>
                <span>邮箱：lei021191@163.com</span>
              </div>
              <div class="contact-item">
                <el-icon><Platform /></el-icon>
                <span>小红书账号：喵喵教学助手</span>
              </div>
            </div>
          </template>
        </el-result>
      </div>
      <template #footer>
        <el-button type="primary" @click="expiredDialogVisible = false">知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { Menu, Message, Platform } from '@element-plus/icons-vue'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage, dayjs } from 'element-plus'
import { useAppStore } from '../../group-points/store/models/app'
import md5 from 'blueimp-md5'
import { BUILD_TYPE } from '../../group-points/database'

const props = defineProps({
  onMenu: {
    type: Function,
    default: (type: string) => {}
  }
})

const appStore = useAppStore()
const currentPassword = computed(() => appStore.database.basicConfig?.password || '')
const buildType = computed(() => appStore.database.basicConfig?.buildType || '')

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
  if (!currentPassword.value) {
    // 判断是否是试用版本，如果是是否在 30 天有效期内
    const buildType = appStore.database.basicConfig.buildType
    if(buildType === BUILD_TYPE.trial) {
      const startTime = appStore.database.basicConfig.startTime
      const currentTime = dayjs().unix()
      const trialPeriod = 30 * 24 * 60 * 60 // 30天的秒数
      
      if(currentTime - startTime > trialPeriod) {
        // 试用版本已过期，显示升级提示弹窗
        expiredDialogVisible.value = true
        return
      } else {
        // 试用期内，直接进入
        props.onMenu('menu')
        return
      }
    } else {
      // 正式版本，直接进入
      props.onMenu('menu')
      return
    }
  }
  passwordDialogVisible.value = true
}

const passwordDialogVisible = ref(false)
const inputPassword = ref('')
const expiredDialogVisible = ref(false)

const verifyPassword = () => {
  if (md5(inputPassword.value) === currentPassword.value) {
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

.expired-content {
  text-align: center;
}

.contact-info {
  text-align: left;
  margin-top: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.contact-info p {
  margin: 0 0 15px 0;
  color: #606266;
  font-size: 14px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #303133;
  font-size: 14px;
}

.contact-item:last-child {
  margin-bottom: 0;
}

.contact-item .el-icon {
  color: #409eff;
  font-size: 16px;
}
</style>