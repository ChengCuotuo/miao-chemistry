<template>
  <div ref="chartDom" class="chart-container"></div>
</template>

<script setup>
import * as echarts from 'echarts/core';
import { GridComponent } from 'echarts/components';
import { LineChart } from 'echarts/charts';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import { onMounted, ref } from 'vue';

echarts.use([GridComponent, LineChart, CanvasRenderer, UniversalTransition]);

const chartDom = ref(null);
const myChart = ref(null);
const option = ref({
  xAxis: {
    name: '酸溶液（V/ml）',
    nameLocation: 'middle',
    nameTextStyle: {
      fontSize: 20,
    },
    nameGap: 30,
    axisLabel: {
      fontSize: 20,
      align: 'center',
    },
    data: [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 38,
      40,
    ],
  },
  yAxis: {
    name: 'pH',
    min: 0,
    interval: 1,
    max: 14,
    nameTextStyle: {
      fontSize: 20,
    },
    axisLabel: {
      fontSize: 20,
    },
  },
  series: [
    {
      data: [],
      type: 'line',
      smooth: true,
      color: '#f94241',
    },
  ],
});

const updatePHData = (data) => {
  option.value.series[0].data = [...data];
  myChart.value.setOption(option.value);
};

const reset = () => {
  option.value.series[0].data = [];
  myChart.value.setOption(option.value);
};

defineExpose({ updatePHData, reset });

onMounted(() => {
  if (chartDom.value) {
    myChart.value = echarts.init(chartDom.value);
    myChart.value.setOption(option.value);
  }
});
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 500px;
  border-left: 1px solid #ccc;
}
</style>
