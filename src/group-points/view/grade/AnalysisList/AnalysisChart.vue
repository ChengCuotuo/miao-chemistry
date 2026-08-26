<template>
	<div ref="chartRef" class="analysis-chart" :style="{ height: height }"></div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts/core';
import { GridComponent, TooltipComponent, LegendComponent, VisualMapComponent } from 'echarts/components';
import { BarChart, LineChart, HeatmapChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue';

echarts.use([GridComponent, TooltipComponent, LegendComponent, VisualMapComponent, BarChart, LineChart, HeatmapChart, CanvasRenderer]);

const props = defineProps<{
	option: Record<string, unknown>;
	height?: string;
}>();

const chartRef = ref<HTMLElement>();
let chart: ReturnType<typeof echarts.init> | null = null;

const render = () => {
	if (!chartRef.value) return;
	if (!chart) chart = echarts.init(chartRef.value);
	chart.setOption(props.option, true);
};

const onResize = () => chart?.resize();

onMounted(() => {
	nextTick(render);
	window.addEventListener('resize', onResize);
});

watch(() => props.option, render, { deep: true });

onBeforeUnmount(() => {
	window.removeEventListener('resize', onResize);
	chart?.dispose();
	chart = null;
});
</script>

<style scoped>
.analysis-chart {
	width: 100%;
}
</style>
