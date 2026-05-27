<template>
  <div class="main-back">
    <div style="position: absolute; left: 24px; top: 12px; z-index: 1;">
      <el-button type="success" circle :icon="Menu" @click="$props.onMenu('menu')" /> 
    </div>
    <div class="clock-container">
      <div class="clock">{{ currentTime }}</div>
      <div class="date">{{ currentDate }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Menu } from '@element-plus/icons-vue'
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  onMenu: {
    type: Function,
    default: (type: string) => {}
  }
})

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