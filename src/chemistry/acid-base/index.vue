<template>
  <div class="title">中和反应与pH曲线模拟实验</div>
  <div class="container">
    <div style="width: 40%">
      <Dynamic @callback="handleCallback" @reset="handleReset" />
    </div>
    <div style="width: 60%">
      <DynamicLineChart ref="dynamicLineChart" />
    </div>
  </div>
  <div style="padding: 20px">
    <p>实验说明:</p>
    <p>向 20ml 0.4% 的氢氧化钠溶液中逐滴滴入 0.4% 的盐酸。</p>
    <p>
      利用 pH 传感器实时检测酸碱混合过程中溶液 pH
      的变化情况，并借助计算机以图像的形式呈现出来，即可直接得到酸碱中和反应过程中溶液的
      pH 变化曲线。
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Dynamic from './components/Dynamic.vue';
import DynamicLineChart from './components/DynamicLineChart.vue';

const phRangeInfo = ref([
  13, 12.9, 12.85, 12.7, 12.6, 12.5, 12.45, 12.4, 12.35, 12.3, 12.25, 12.2,
  12.15, 12.1, 12, 11, 9.8, 7, 2, 1.9, 1.86, 1.75, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6,
  1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6,
]);

const dynamicLineChart = ref();
const curCount = ref(0);
const handleCallback = (count) => {
  if (curCount.value !== count) {
    curCount.value = count;

    if (dynamicLineChart?.value) {
      dynamicLineChart.value.updatePHData(
        phRangeInfo.value.slice(0, curCount.value),
      );
    }
  }
};

const handleReset = () => {
  dynamicLineChart.value.reset();
};
</script>

<style scoped>
.title {
  padding: 12px 0;
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  border-bottom: 1px solid #ccc;
}
.container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #ccc;
}
</style>
