<template>
  <!-- 管理员登录弹窗：锁屏页与班级页「切换为管理员」共用同一套登录界面与校验 -->
  <el-dialog
    :model-value="modelValue"
    title="管理员登录"
    width="400px"
    :close-on-click-modal="false"
    @update:model-value="handleVisibleChange"
    @closed="handleClosed"
  >
    <el-input
      v-model="inputPassword"
      type="password"
      placeholder="请输入管理员密码"
      show-password
      @keyup.enter="verifyPassword"
    />
    <template #footer>
      <el-button @click="handleVisibleChange(false)">取消</el-button>
      <el-button type="primary" @click="verifyPassword">登录</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import md5 from 'blueimp-md5'
import { useAppStore } from '../group-points/store/models/app'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  // 密码校验通过（调用方负责后续会话切换与跳转）
  (e: 'success'): void
}>()

const appStore = useAppStore()
const currentPassword = computed(() => appStore.database.basicConfig?.password || '')

const inputPassword = ref('')

const handleVisibleChange = (value: boolean) => {
  emit('update:modelValue', value)
}

// 关闭后清空输入，避免下次打开残留
const handleClosed = () => {
  inputPassword.value = ''
}

const verifyPassword = () => {
  if (md5(inputPassword.value) === currentPassword.value) {
    inputPassword.value = ''
    emit('update:modelValue', false)
    emit('success')
  } else {
    ElMessage.error('密码错误')
  }
}
</script>
