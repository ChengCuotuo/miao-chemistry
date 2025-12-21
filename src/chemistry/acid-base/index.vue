<template>
  <div class="container">
    <div style="width: 40%">
      <Dynamic @callback="handleCallback" @reset="handleReset" />
    </div>
    <div style="width: 60%">
      <DynamicLineChart ref="dynamicLineChart" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Dynamic from './components/Dynamic.vue'
import DynamicLineChart from './components/DynamicLineChart.vue'

const phRangeInfo = ref([
  13, 12.9, 12.85, 12.7, 12.6, 12.5, 12.45, 12.4, 12.35, 12.3, 12.25, 12.2, 12.15, 12.1, 12, 11,
  9.8, 7, 2, 1.9, 1.86, 1.75, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6,
])

const dynamicLineChart = ref()
const curCount = ref(0)
const handleCallback = (count) => {
  if (curCount.value !== count) {
    curCount.value = count

    if (dynamicLineChart?.value) {
      dynamicLineChart.value.updatePHData(phRangeInfo.value.slice(0, curCount.value))
    }
  }
}

const handleReset = () => {
  dynamicLineChart.value.reset()
}
</script>

<style scoped>
.container {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
