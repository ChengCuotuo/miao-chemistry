<template>
  <div class="main-back">
    <div style="position: absolute; left: 24px; top: 12px; z-index: 1;">
      <el-space>
        <el-button type="primary" circle :icon="Menu" @click="handleMenuClick" /> 
        <CurVersion />
      </el-space>
    </div>
    <div class="clock-container">
      <div class="clock">{{ currentTime }}</div>
      <div class="date">{{ currentDate }}</div>
    </div>

    <!-- 选择登录角色弹窗 -->
    <el-dialog
      v-model="roleDialogVisible"
      title="选择登录角色"
      width="380px"
      :close-on-click-modal="false"
    >
      <div class="role-select">
        <el-button type="primary" size="large" @click="handleAdminLogin">
          <el-icon style="margin-right: 6px;"><Avatar /></el-icon>管理员登录
        </el-button>
        <el-button type="success" size="large" @click="handleMonitorLoginClick">
          <el-icon style="margin-right: 6px;"><User /></el-icon>班委登录
        </el-button>
      </div>
    </el-dialog>

    <!-- 管理员密码验证弹窗 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="管理员登录"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-input
        v-model="inputPassword"
        type="password"
        placeholder="请输入管理员密码"
        show-password
        @keyup.enter="verifyPassword"
      />
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="verifyPassword">登录</el-button>
      </template>
    </el-dialog>

    <!-- 班委登录弹窗 -->
    <el-dialog
      v-model="monitorLoginVisible"
      title="班委登录"
      width="420px"
      :close-on-click-modal="false"
    >
      <el-form label-width="60px" @submit.prevent>
        <el-form-item label="班级">
          <el-select v-model="monitorGradeId" placeholder="请选择班级" style="width: 100%">
            <el-option v-for="g in gradeList" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="账号">
          <el-input v-model="monitorName" placeholder="请输入班委账号" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="monitorPassword" type="password" show-password placeholder="请输入密码"
            @keyup.enter="handleMonitorLoginSubmit" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="monitorLoginVisible = false">取消</el-button>
        <el-button type="primary" :loading="monitorLoginLoading" @click="handleMonitorLoginSubmit">登录</el-button>
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
import { Menu, Message, Platform, Avatar, User } from '@element-plus/icons-vue'
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { ElMessage, dayjs } from 'element-plus'
import { useAppStore } from '../group-points/store/models/app'
import md5 from 'blueimp-md5'
import { BUILD_TYPE } from '../group-points/database'
import { useGrade } from '../group-points/database/utils/useGrade'
import { useMonitorAccount } from '../group-points/database/utils/useMonitorAccount'
import { useRouter } from 'vue-router'
import CurVersion from './CurVersion.vue'

const props = defineProps({
  onMenu: {
    type: Function,
    default: (type: string) => {}
  }
})

const appStore = useAppStore()
const router = useRouter()
const { getGradeInfoById } = useGrade()
const { verifyMonitorAccount } = useMonitorAccount()
const currentPassword = computed(() => appStore.database.basicConfig?.password || '')
// 是否开启周期记分（未开启则无班委角色，直接管理员登录）
const monitorEnabled = computed(() => appStore.database.basicConfig?.moduleVisibility?.monitorManage ?? true)

// 未删除的班级列表
const gradeList = computed(() => appStore.database.gradeList.filter(item => item.delete === 0))

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
  // 已设置密码：未开启周期记分时直接管理员登录；开启时弹出角色选择
  if (!monitorEnabled.value) {
    passwordDialogVisible.value = true
  } else {
    roleDialogVisible.value = true
  }
}

// ---------- 角色选择 ----------
const roleDialogVisible = ref(false)

const handleAdminLogin = () => {
  roleDialogVisible.value = false
  passwordDialogVisible.value = true
}

const handleMonitorLoginClick = () => {
  roleDialogVisible.value = false
  monitorLoginVisible.value = true
  // 重置班委登录表单
  monitorGradeId.value = '';
  monitorName.value = '';
  monitorPassword.value = '';
}

// ---------- 管理员登录 ----------
const passwordDialogVisible = ref(false)
const inputPassword = ref('')
const expiredDialogVisible = ref(false)

const verifyPassword = async() => {
  if (md5(inputPassword.value) === currentPassword.value) {
    appStore.setCurrentRole('teacher')
    props.onMenu('menu')
    passwordDialogVisible.value = false
    inputPassword.value = ''
    await nextTick();
    router.push({ name: 'home' });
  } else {
    ElMessage.error('密码错误')
  }
}

// ---------- 班委登录 ----------
const monitorLoginVisible = ref(false)
const monitorLoginLoading = ref(false)
const monitorGradeId = ref('')
const monitorName = ref('')
const monitorPassword = ref('')

const handleMonitorLoginSubmit = async () => {
  if (!monitorGradeId.value) {
    ElMessage.warning('请选择班级');
    return;
  }
  if (!monitorName.value || !monitorPassword.value) {
    ElMessage.warning('请输入账号和密码');
    return;
  }
  monitorLoginLoading.value = true;
  try {
    // 先加载班级信息，供账号校验使用
    const gradeInfo = await getGradeInfoById(monitorGradeId.value);
    if (!gradeInfo) {
      ElMessage.error('班级信息加载失败');
      return;
    }
    appStore.setActiveGrade(gradeInfo);
    const res = verifyMonitorAccount(monitorName.value, monitorPassword.value);
    if (res.success) {
      appStore.setCurrentRole('monitor');
      appStore.setIsCollapse(true);
      monitorLoginVisible.value = false;
      // 顺序：先切 activeKey 让 GroupPoints 挂载（此时 HomeView 虽挂载但有角色守卫不会清数据），
      // 再跳转 grade 路由进入班级页，彻底规避 HomeView.onMounted 与路由竞争清空 activeGrade 的问题
      props.onMenu('menu');
      await nextTick();
      router.push({ name: 'grade' });
    } else {
      ElMessage.warning(res.message || '登录失败');
    }
  } catch (error) {
    console.error('班委登录出错:', error);
    ElMessage.error('登录失败，请重试');
  } finally {
    monitorLoginLoading.value = false;
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

.role-select {
  display: flex;
  padding: 12px 0;
}

.role-select .el-button {
  width: 100%;
  height: 56px;
  font-size: 16px;
  justify-content: center;
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
