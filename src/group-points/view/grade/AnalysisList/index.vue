<template>
	<div class="analysis-container">
		<!-- 顶部筛选 -->
		<div class="filter-bar">
			<el-space>
				<span class="label-text">统计范围：</span>
				<el-select v-model="selectedCycleId" placeholder="全部周期" clearable style="width: 200px">
					<el-option v-for="cycle in cycleList" :key="cycle.id" :label="cycle.name" :value="cycle.id" />
				</el-select>
				<span class="muted-text" v-if="recordCount > 0">共 {{ recordCount }} 条记录</span>
			</el-space>
		</div>

		<!-- 空态 -->
		<div v-if="studentList.length === 0" class="empty-wrap">
			<el-empty description="暂无学生，无法分析" />
		</div>

		<div v-else class="card-grid">
			<!-- 1. 趋势分析（周期对比） -->
			<section class="chart-card">
				<div class="card-title">趋势分析（周期对比）</div>
				<div class="card-sub">各周期积分净变化，观察班级整体走势</div>
				<AnalysisChart :option="trendOption" height="300px"/>
			</section>

			<!-- 2. 行为画像（规则维度） -->
			<section class="chart-card">
				<div class="card-title">行为画像（规则维度）</div>
				<div class="card-sub">各规则触发次数与积分贡献</div>
				<AnalysisChart :option="ruleOption" height="340px" />
			</section>

			<!-- 3. 个体诊断（学生维度） -->
			<section class="chart-card">
				<div class="card-title">个体诊断（学生维度）</div>
				<div class="card-sub">学生加减分构成与净变化</div>
				<AnalysisChart :option="studentOption" height="340px" />
			</section>

			<!-- 4. 协作观察（小组维度） -->
			<section class="chart-card" v-if="groupList.length > 0 && moduleVisibility.groupManage">
				<div class="card-title">协作观察（小组维度）</div>
				<div class="card-sub">小组积分合计对比</div>
				<AnalysisChart :option="groupOption" height="300px" />
			</section>

			<!-- 5. 规则健康度（规则库维度） -->
			<section class="chart-card" >
				<div class="card-title">规则健康度（规则库维度）</div>
				<div class="card-sub">规则触发次数，识别形同虚设的规则</div>
				<el-table :data="ruleHealth" size="small" max-height="300">
					<el-table-column prop="name" label="规则名称" min-width="100" show-overflow-tooltip />
					<el-table-column prop="points" label="分值" width="90" align="center">
						<template #default="scope">
							<span :class="scope.row.points > 0 ? 'text-success' : scope.row.points < 0 ? 'text-danger' : 'text-muted'">
								{{ scope.row.points > 0 ? '+' : '' }}{{ scope.row.points }}
							</span>
						</template>
					</el-table-column>
					<el-table-column prop="count" label="触发次数" width="90" align="center" sortable />
					<el-table-column prop="total" label="积分合计" width="90" align="center">
						<template #default="scope">
							<span :class="scope.row.total > 0 ? 'text-success' : scope.row.total < 0 ? 'text-danger' : 'text-muted'">
								{{ scope.row.total > 0 ? '+' : '' }}{{ scope.row.total }}
							</span>
						</template>
					</el-table-column>
					<el-table-column label="状态" width="90" align="center">
						<template #default="scope">
							<el-tag :type="scope.row.count === 0 ? 'danger' : scope.row.count < 3 ? 'warning' : 'success'" size="small">
								{{ scope.row.count === 0 ? '未使用' : scope.row.count < 3 ? '低频' : '正常' }}
							</el-tag>
						</template>
					</el-table-column>
				</el-table>
			</section>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAppStore } from '../../../store/models/app';
import AnalysisChart from './AnalysisChart.vue';

const appStore = useAppStore();
const selectedCycleId = ref('');

const studentList = computed(() => appStore.activeGrade?.gradeInfo?.studentList || []);
const groupList = computed(() => appStore.activeGrade?.gradeInfo?.groupList || []);
const studentGroupList = computed(() => appStore.activeGrade?.gradeInfo?.studentGroupList || []);
const recordList = computed(() => appStore.activeGrade?.gradeInfo?.recordList || []);
const cycleList = computed(() => appStore.activeGrade?.gradeInfo?.monitorCycleList || []);
const ruleList = computed(() => appStore.database.ruleList || []);
const moduleVisibility = computed(() => appStore.database.basicConfig?.moduleVisibility || {
	groupManage: true,
});

const getRuleName = (id: string) => ruleList.value.find(r => r.id === id)?.name || '';

// 判断记录是否属于指定周期（班委记录按 cycle_id；普通记录按时间范围）
const recordInCycle = (record: { source?: number, cycle_id?: string, time?: string }, cycle: { id: string, startTime?: string, endTime?: string }) => {
	if (record.source === 1) return record.cycle_id === cycle.id;
	if (!cycle.startTime || !cycle.endTime) return false;
	const date = (record.time || '').slice(0, 10);
	return date >= cycle.startTime && date <= cycle.endTime;
};

// 参与统计的记录（可选周期过滤）
const scopedRecords = computed(() => {
	const records = recordList.value;
	if (!selectedCycleId.value) return records;
	const cycle = cycleList.value.find(c => c.id === selectedCycleId.value);
	if (!cycle) return records;
	return records.filter(r => recordInCycle(r, cycle));
});

const recordCount = computed(() => scopedRecords.value.length);

// 记录的实际积分 = points（已经是规则分值 × 次数后的总量）
const sumPoints = (records: typeof recordList.value) => records.reduce((acc, r) => acc + r.points, 0);

// ---------- 1. 趋势分析：各周期净变化 ----------
const trendOption = computed(() => {
	const cycles = cycleList.value;
	const names = cycles.map(c => c.name);
	const netValues = cycles.map(c => {
		const recs = recordList.value.filter(r => recordInCycle(r, c));
		return sumPoints(recs);
	});
	return {
		tooltip: { trigger: 'axis' },
		grid: { left: 50, right: 20, top: 30, bottom: 40 },
		xAxis: { type: 'category', data: names, name: '周期' },
		yAxis: { type: 'value', name: '净积分' },
		series: [{
			name: '净变化',
			type: 'line',
			data: netValues,
			smooth: true,
			symbol: 'circle',
			symbolSize: 8,
			itemStyle: { color: '#409eff' },
			areaStyle: { opacity: 0.08 },
			markLine: {
				data: [{ type: 'average', name: '均值' }],
				lineStyle: { type: 'dashed', color: '#909399' },
				label: { position: 'insideEndTop' },
			},
		}],
	};
});

// ---------- 2. 行为画像：规则触发次数（Top 12） ----------
const ruleOption = computed(() => {
	const map = new Map<string, { name: string, count: number, total: number }>();
	scopedRecords.value.forEach(r => {
		const key = r.rule_id;
		const name = getRuleName(r.rule_id);
		if (!map.has(key)) map.set(key, { name, count: 0, total: 0 });
		const item = map.get(key)!;
		item.count += (r.count || 1);
		item.total += r.points;
	});
	const sorted = [...map.values()].sort((a, b) => b.count - a.count).slice(0, 12).reverse();
	return {
		tooltip: {
			trigger: 'axis',
			axisPointer: { type: 'shadow' },
			formatter: (params: any[]) => {
				const p = params[0];
				const item = sorted[p.dataIndex];
				return `${item.name}<br/>触发 ${item.count} 次<br/>积分 ${item.total > 0 ? '+' : ''}${item.total}`;
			},
		},
		grid: { left: 110, right: 30, top: 20, bottom: 30 },
		xAxis: { type: 'value', name: '次数' },
		yAxis: { type: 'category', data: sorted.map(s => s.name), axisLabel: { width: 100, overflow: 'truncate' } },
		series: [{
			name: '触发次数',
			type: 'bar',
			data: sorted.map(s => s.count),
			barMaxWidth: 18,
			itemStyle: { color: '#67c23a', borderRadius: [0, 3, 3, 0] },
			label: { show: true, position: 'right' },
		}],
	};
});

// ---------- 3. 个体诊断：学生加减分构成（Top 15） ----------
const studentOption = computed(() => {
	const list = studentList.value.map(s => {
		const recs = scopedRecords.value.filter(r => r.stu_id === s.id);
		const add = recs.filter(r => r.points > 0).reduce((a, r) => a + r.points, 0);
		const sub = recs.filter(r => r.points < 0).reduce((a, r) => a + r.points, 0);
		return { name: s.name, add, sub: Math.abs(sub), net: add + sub };
	}).sort((a, b) => (b.add + b.net) - (a.add + a.net)).slice(0, 15).reverse();
	return {
		tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
		legend: { data: ['加分', '减分'], top: 0 },
		grid: { left: 70, right: 20, top: 30, bottom: 30 },
		xAxis: { type: 'value' },
		yAxis: { type: 'category', data: list.map(s => s.name), axisLabel: { width: 70, overflow: 'truncate' } },
		series: [
			{ name: '加分', type: 'bar', stack: 'total', data: list.map(s => s.add), itemStyle: { color: '#67c23a' }, barMaxWidth: 16 },
			{ name: '减分', type: 'bar', stack: 'total', data: list.map(s => s.sub), itemStyle: { color: '#f56c6c' }, barMaxWidth: 16 },
		],
	};
});

// ---------- 4. 协作观察：小组积分合计 ----------
const groupOption = computed(() => {
	const list = groupList.value.map(g => {
		const members = studentGroupList.value
			.filter(sg => sg.group_id === g.id)
			.map(sg => studentList.value.find(s => s.id === sg.student_id))
			.filter(Boolean);
		const total = members.reduce((a, m) => a + (m?.points || 0), 0);
		return { name: g.name, total };
	}).sort((a, b) => b.total - a.total).reverse();
	return {
		tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
		grid: { left: 80, right: 30, top: 20, bottom: 30 },
		xAxis: { type: 'value', name: '积分' },
		yAxis: { type: 'category', data: list.map(g => g.name), axisLabel: { width: 80, overflow: 'truncate' } },
		series: [{
			name: '小组积分',
			type: 'bar',
			data: list.map(g => g.total),
			barMaxWidth: 22,
			itemStyle: { color: '#e6a23c', borderRadius: [0, 3, 3, 0] },
			label: { show: true, position: 'right' },
		}],
	};
});

// ---------- 5. 规则健康度：触发次数表 ----------
const ruleHealth = computed(() => {
	return ruleList.value.map(r => {
		const recs = scopedRecords.value.filter(rec => rec.rule_id === r.id);
		return {
			name: r.name,
			points: r.points,
			count: recs.reduce((a, rec) => a + (rec.count || 1), 0),
			total: sumPoints(recs),
		};
	}).sort((a, b) => b.count - a.count);
});

// 周期删除后，若选中的周期消失则重置
watch(cycleList, (list) => {
	if (selectedCycleId.value && !list.some(c => c.id === selectedCycleId.value)) {
		selectedCycleId.value = '';
	}
});
</script>

<style scoped>
.analysis-container {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.filter-bar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
}

.label-text {
	font-weight: 600;
}

.muted-text {
	font-size: 12px;
	color: #909399;
}

.empty-wrap {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
}

.card-grid {
	overflow-y: auto;
	padding-bottom: 6px;
}

.chart-card {
	background: #fff;
	border: 1px solid #ebeef5;
	border-radius: 8px;
	padding: 14px 16px;
	margin-bottom: 20px;
}

.card-title {
	font-weight: 600;
	font-size: 14px;
	margin-bottom: 2px;
}

.card-sub {
	font-size: 12px;
	color: #909399;
	margin-bottom: 8px;
}

.text-success {
	color: #67c23a;
	font-weight: 600;
}

.text-danger {
	color: #f56c6c;
	font-weight: 600;
}

.text-muted {
	color: #909399;
}
</style>
