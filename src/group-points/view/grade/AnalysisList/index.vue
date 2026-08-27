<template>
	<div class="analysis-container">
		<!-- 空态 -->
		<div v-if="studentList.length === 0" class="empty-wrap">
			<el-empty description="暂无学生，无法分析" />
		</div>

		<div v-else class="card-grid">
			<!-- 1. 趋势分析（周期对比） -->
			<section class="chart-card" v-if="isChartVisible('trend')" :style="{ order: chartOrderIndex('trend') }">
				<div class="card-title">趋势分析（周期对比）</div>
				<div class="card-sub">各周期积分净变化，观察班级整体走势</div>
				<AnalysisChart :option="trendOption" height="300px"/>
			</section>

			<!-- 2. 行为画像（规则维度） -->
			<section class="chart-card" v-if="isChartVisible('rule')" :style="{ order: chartOrderIndex('rule') }">
				<div class="card-header">
					<div>
						<div class="card-title">行为画像（规则维度）</div>
						<div class="card-sub">各规则触发次数与积分贡献</div>
					</div>
					<el-select v-model="ruleCycleId" placeholder="全部周期" clearable style="width: 160px">
						<el-option v-for="cycle in cycleList" :key="cycle.id" :label="cycle.name" :value="cycle.id" />
					</el-select>
				</div>
				<AnalysisChart :option="ruleOption" height="340px" />
			</section>

			<!-- 3. 规则健康度（规则库维度） -->
			<section class="chart-card" v-if="isChartVisible('ruleHealth')" :style="{ order: chartOrderIndex('ruleHealth') }">
				<div class="card-header">
					<div>
						<div class="card-title">规则健康度（规则库维度）</div>
						<div class="card-sub">规则触发次数，识别形同虚设的规则</div>
					</div>
					<el-select v-model="ruleHealthCycleId" placeholder="全部周期" clearable style="width: 160px">
						<el-option v-for="cycle in cycleList" :key="cycle.id" :label="cycle.name" :value="cycle.id" />
					</el-select>
				</div>
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

			<!-- 4. 协作观察（小组维度） -->
			<section class="chart-card" v-if="isChartVisible('group') && groupList.length > 0 && moduleVisibility.groupManage" :style="{ order: chartOrderIndex('group') }">
				<div class="card-title">协作观察（小组维度）</div>
				<div class="card-sub">小组积分合计对比</div>
				<AnalysisChart :option="groupOption" height="300px" />
			</section>

			<!-- 5. 个体诊断（学生维度） -->
			<section class="chart-card" v-if="isChartVisible('student')" :style="{ order: chartOrderIndex('student') }">
				<div class="card-header">
					<div>
						<div class="card-title">个体诊断（学生维度）</div>
						<div class="card-sub">学生加减分构成与净变化（不受统计范围影响）</div>
					</div>
					<div class="card-tools">
						<el-input v-model="studentSearch" placeholder="按学生名称搜索" clearable prefix-icon="Search" class="card-search" />
						<el-button type="primary" plain :icon="Download" @click="handleExportStudent">导出 Excel</el-button>
					</div>
				</div>
				<AnalysisChart :option="studentOption" height="340px" />
			</section>

			<!-- 6. 积分变化明细（学生 × 周期） -->
			<section class="chart-card" v-if="isChartVisible('matrix') && cycleList.length > 0" :style="{ order: chartOrderIndex('matrix') }">
				<div class="card-header">
					<div>
						<div class="card-title">积分变化明细（学生 × 周期）</div>
						<div class="card-sub">每个学生在各周期的积分净变化（不受统计范围影响）</div>
					</div>
					<div class="card-tools">
						<el-input v-model="matrixSearch" placeholder="按学生名称搜索" clearable prefix-icon="Search" class="card-search" />
						<el-button type="primary" plain :icon="Download" @click="handleExportMatrix">导出 Excel</el-button>
					</div>
				</div>
				<el-table :data="matrixData" size="small" max-height="420" border>
					<el-table-column type="expand" width="40">
						<template #default="scope">
							<div class="expand-detail">
								<div class="expand-title">各项规则积分</div>
								<el-table :data="scope.row.ruleStats" size="small" border>
									<el-table-column prop="name" label="规则" min-width="140" />
									<el-table-column prop="points" label="分值" width="80" align="center">
										<template #default="s">
											<span :class="s.row.points > 0 ? 'text-success' : s.row.points < 0 ? 'text-danger' : 'text-muted'">
												{{ s.row.points > 0 ? '+' : '' }}{{ s.row.points }}
											</span>
										</template>
									</el-table-column>
									<el-table-column prop="count" label="次数" width="80" align="center">
										<template #default="s">
											<span :class="s.row.count > 0 ? 'text-success' : 'text-muted'">{{ s.row.count }}</span>
										</template>
									</el-table-column>
									<el-table-column prop="total" label="积分" width="100" align="center">
										<template #default="s">
											<span :class="s.row.total > 0 ? 'text-success' : s.row.total < 0 ? 'text-danger' : 'text-muted'">
												{{ s.row.total > 0 ? '+' : '' }}{{ s.row.total }}
											</span>
										</template>
									</el-table-column>
								</el-table>
							</div>
						</template>
					</el-table-column>
					<el-table-column prop="name" label="学生" fixed align="center" />
					<el-table-column prop="total" label="合计"  align="center" sortable>
						<template #default="scope">
							<span :class="scope.row.total > 0 ? 'text-success' : scope.row.total < 0 ? 'text-danger' : 'text-muted'">
								{{ scope.row.total > 0 ? '+' : '' }}{{ scope.row.total }}
							</span>
						</template>
					</el-table-column>
					<el-table-column label="操作" fixed="right" align="center">
						<template #default="scope">
							<el-button size="small" type="primary" link :icon="TrendCharts" @click="handleShowTrend(scope.row)">趋势</el-button>
							<el-button size="small" type="success" link :icon="DataAnalysis" @click="handleShowStats(scope.row)">统计</el-button>
						</template>
					</el-table-column>
				</el-table>
			</section>
		</div>

		<!-- 学生周期趋势弹窗 -->
		<el-dialog :title="`${trendStudent?.name || ''} - 周期积分变化`" v-model="trendDialogVisible" width="720px">
			<AnalysisChart :option="studentTrendOption" height="380px" />
		</el-dialog>

		<!-- 学生周期 × 规则执行次数统计弹窗 -->
		<el-dialog :title="`${statsStudent?.name || ''} - 各周期规则执行次数`" v-model="statsDialogVisible" width="900px">
			<el-table :data="statsMatrix" size="small" max-height="500" border>
				<el-table-column prop="cycleName" label="周期" width="110" fixed align="center" />
				<el-table-column v-for="rule in rulesInStats" :key="rule.id" :label="rule.name" align="center" min-width="90">
					<template #default="scope">
						<span>{{ scope.row.ruleCounts[rule.id] || 0 }}次</span>
					</template>
				</el-table-column>
			</el-table>
			<el-empty v-if="statsMatrix.length === 0" description="该学生暂无记录" :image-size="60" />
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAppStore } from '../../../store/models/app';
import AnalysisChart from './AnalysisChart.vue';
import { TrendCharts, Download, DataAnalysis } from '@element-plus/icons-vue';
import { utils, writeFile as writeExcelFile } from 'xlsx';
import { ElMessage } from 'element-plus';

const appStore = useAppStore();
const ruleCycleId = ref('');
const ruleHealthCycleId = ref('');

const studentList = computed(() => appStore.activeGrade?.gradeInfo?.studentList || []);
const groupList = computed(() => appStore.activeGrade?.gradeInfo?.groupList || []);
const studentGroupList = computed(() => appStore.activeGrade?.gradeInfo?.studentGroupList || []);
const recordList = computed(() => appStore.activeGrade?.gradeInfo?.recordList || []);
const cycleList = computed(() => appStore.activeGrade?.gradeInfo?.monitorCycleList || []);
const ruleList = computed(() => appStore.database.ruleList || []);
const moduleVisibility = computed(() => appStore.database.basicConfig?.moduleVisibility || {
	groupManage: false,
});

// ---------- 数据分析图表展示配置 ----------
const CHART_DEFS = ['trend', 'rule', 'ruleHealth', 'group', 'student', 'matrix'];
const DEFAULT_CHART_ORDER = ['trend', 'rule', 'ruleHealth', 'group', 'student', 'matrix'];

const chartOrder = computed(() => {
	const saved = appStore.database.basicConfig?.analysisChartOrder;
	return (Array.isArray(saved) && saved.length ? saved : DEFAULT_CHART_ORDER)
		.filter((k: string) => CHART_DEFS.includes(k));
});

const chartVisibility = computed(() => appStore.database.basicConfig?.analysisChartVisibility || {});

// 图表是否可见
const isChartVisible = (key: string) => (chartVisibility.value as Record<string, boolean>)[key] ?? true;

// 图表顺序索引（用于 CSS order，未出现在配置里的排在后面）
const chartOrderIndex = (key: string) => {
	const idx = chartOrder.value.indexOf(key);
	return idx === -1 ? 999 : idx;
};

const getRuleName = (id: string) => ruleList.value.find(r => r.id === id)?.name || '';

// 判断记录是否属于指定周期（班委记录按 cycle_id；普通记录按时间范围）
const recordInCycle = (record: { source?: number, cycle_id?: string, time?: string }, cycle: { id: string, startTime?: string, endTime?: string }) => {
	if (record.source === 1) return record.cycle_id === cycle.id;
	if (!cycle.startTime || !cycle.endTime) return false;
	const date = (record.time || '').slice(0, 10);
	return date >= cycle.startTime && date <= cycle.endTime;
};

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

// ---------- 2. 行为画像：规则触发次数（Top 12，独立周期筛选） ----------
const ruleRecords = computed(() => {
	if (!ruleCycleId.value) return recordList.value;
	const cycle = cycleList.value.find(c => c.id === ruleCycleId.value);
	if (!cycle) return recordList.value;
	return recordList.value.filter(r => recordInCycle(r, cycle));
});
const ruleOption = computed(() => {
	const map = new Map<string, { name: string, count: number, total: number }>();
	ruleRecords.value.forEach(r => {
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

// ---------- 3. 个体诊断：学生加减分构成（Top 15，独立搜索，不受统计范围影响） ----------
const studentSearch = ref('');
const studentStats = computed(() => {
	return studentList.value.map(s => {
		const recs = recordList.value.filter(r => r.stu_id === s.id);
		const add = recs.filter(r => r.points > 0).reduce((a, r) => a + r.points, 0);
		const sub = recs.filter(r => r.points < 0).reduce((a, r) => a + r.points, 0);
		return { name: s.name, add, sub: Math.abs(sub), net: add + sub };
	}).filter(s => !studentSearch.value || s.name.toLowerCase().includes(studentSearch.value.toLowerCase()))
		.sort((a, b) => b.net - a.net);
});
const studentOption = computed(() => {
	const list = studentStats.value.slice(0, 15).reverse();
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

// ---------- 5. 规则健康度：触发次数表（独立周期筛选） ----------
const ruleHealthRecords = computed(() => {
	if (!ruleHealthCycleId.value) return recordList.value;
	const cycle = cycleList.value.find(c => c.id === ruleHealthCycleId.value);
	if (!cycle) return recordList.value;
	return recordList.value.filter(r => recordInCycle(r, cycle));
});
const ruleHealth = computed(() => {
	return ruleList.value.map(r => {
		const recs = ruleHealthRecords.value.filter(rec => rec.rule_id === r.id);
		return {
			name: r.name,
			points: r.points,
			count: recs.reduce((a, rec) => a + (rec.count || 1), 0),
			total: sumPoints(recs),
		};
	}).sort((a, b) => b.count - a.count);
});

// ---------- 6. 积分变化明细：学生 × 周期 净变化矩阵（独立搜索，不受统计范围影响） ----------
const matrixSearch = ref('');
const matrixData = computed(() => {
	return studentList.value.map(s => {
		const cyclePoints: Record<string, number> = {};
		let total = 0;
		cycleList.value.forEach(cycle => {
			const recs = recordList.value.filter(r => r.stu_id === s.id && recordInCycle(r, cycle));
			const net = sumPoints(recs);
			cyclePoints[cycle.id] = net;
			total += net;
		});
		// 展开用的规则次数明细（该学生各规则的执行次数，仅列有记录的规则）
		const stuRecs = recordList.value.filter(r => r.stu_id === s.id);
		const usedRuleIds = new Set<string>();
		stuRecs.forEach(r => { if (r.rule_id) usedRuleIds.add(r.rule_id); });
		const ruleStats = ruleList.value
			.filter(r => usedRuleIds.has(r.id))
			.map(r => {
				const recs = stuRecs.filter(rec => rec.rule_id === r.id);
				return {
					name: r.name,
					points: r.points,
					count: recs.reduce((a, rec) => a + (rec.count || 1), 0),
					total: recs.reduce((a, rec) => a + rec.points, 0),
				};
			})
			.sort((a, b) => b.total - a.total);
		return { stu_id: s.id, name: s.name, cyclePoints, ruleStats, total };
	}).filter(s => !matrixSearch.value || s.name.toLowerCase().includes(matrixSearch.value.toLowerCase()))
		.sort((a, b) => b.total - a.total);
});

// ---------- 导出：个体诊断 + 积分变化明细 → 同一 Excel 两个 sheet ----------
// ---------- 导出个体诊断（学生维度） ----------
const handleExportStudent = () => {
	try {
		const workbook = utils.book_new();
		const diagRows: (string | number)[][] = [['学生姓名', '加分', '减分', '净变化']];
		studentStats.value.forEach(s => diagRows.push([s.name, s.add, -s.sub, s.net]));
		utils.book_append_sheet(workbook, utils.aoa_to_sheet(diagRows), '个体诊断');
		writeExcelFile(workbook, '个体诊断导出.xlsx');
		ElMessage.success('已导出：个体诊断');
	} catch (error) {
		console.error('导出失败:', error);
		ElMessage.error('导出失败');
	}
};

// ---------- 导出积分变化明细（学生 × 周期，合并单元格：学生姓名跨周期行合并） ----------
const handleExportMatrix = () => {
	try {
		const workbook = utils.book_new();

		// 全班用过的规则（去重，按规则列表顺序）
		const usedRuleIds = new Set<string>();
		recordList.value.forEach(r => { if (r.rule_id) usedRuleIds.add(r.rule_id); });
		const usedRules = ruleList.value.filter(r => usedRuleIds.has(r.id));

		// 表头：学生姓名 | 周期 | 规则1 | 规则2 | ...
		const rows: (string | number)[][] = [['学生姓名', '周期', ...usedRules.map(r => r.name)]];

		// 学生姓名列合并范围
		const merges: { s: { r: number, c: number }, e: { r: number, c: number } }[] = [];

		matrixData.value.forEach(s => {
			// 该学生在每个周期的行
			const startRow = rows.length; // 即将写入的第一行（0-based 行号）
			let rowCount = 0;
			cycleList.value.forEach(cycle => {
				const row: (string | number)[] = [s.name, cycle.name];
				usedRules.forEach(rule => {
					const recs = recordList.value.filter(r =>
						r.stu_id === s.stu_id && r.rule_id === rule.id && recordInCycle(r, cycle)
					);
					row.push(recs.reduce((a, r) => a + (r.count || 1), 0));
				});
				rows.push(row);
				rowCount++;
			});
			// 该学生的总计行：汇总该学生各规则的次数（"总计"放在周期列，学生姓名列留空）
			const stuTotalRow: (string | number)[] = ['', '总计'];
			usedRules.forEach(rule => {
				const cnt = recordList.value
					.filter(r => r.stu_id === s.stu_id && r.rule_id === rule.id)
					.reduce((a, r) => a + (r.count || 1), 0);
				stuTotalRow.push(cnt);
			});
			rows.push(stuTotalRow);

			// 学生姓名列合并（第 0 列）：从第一周期行到总计行（含总计行）
			const endRow = startRow + rowCount; // 总计行所在行号
			if (endRow > startRow) {
				merges.push({ s: { r: startRow, c: 0 }, e: { r: endRow, c: 0 } });
			}
		});

		const sheet = utils.aoa_to_sheet(rows);
		sheet['!merges'] = merges;
		utils.book_append_sheet(workbook, sheet, '积分变化明细');
		writeExcelFile(workbook, '积分变化明细导出.xlsx');
		ElMessage.success('已导出：积分变化明细');
	} catch (error) {
		console.error('导出失败:', error);
		ElMessage.error('导出失败');
	}
};

// ---------- 6d. 学生周期 × 规则执行次数统计 ----------
const statsDialogVisible = ref(false);
const statsStudent = ref<{ stu_id: string, name: string } | null>(null);

// 该学生各周期内出现的规则（去重，按规则列表顺序）
const rulesInStats = computed(() => {
	if (!statsStudent.value) return [];
	const ids = new Set<string>();
	recordList.value.forEach(r => {
		if (r.stu_id === statsStudent.value!.stu_id && r.rule_id) ids.add(r.rule_id);
	});
	return ruleList.value.filter(r => ids.has(r.id));
});

// 统计矩阵：行=周期，列=规则，值为执行次数
const statsMatrix = computed(() => {
	if (!statsStudent.value) return [];
	return cycleList.value.map(cycle => {
		const ruleCounts: Record<string, number> = {};
		rulesInStats.value.forEach(rule => {
			const recs = recordList.value.filter(r =>
				r.stu_id === statsStudent.value!.stu_id && r.rule_id === rule.id && recordInCycle(r, cycle)
			);
			const cnt = recs.reduce((a, r) => a + (r.count || 1), 0);
			ruleCounts[rule.id] = cnt;
		});
		return { cycleName: cycle.name, ruleCounts };
	});
});

const handleShowStats = (row: { stu_id: string, name: string }) => {
	statsStudent.value = row;
	statsDialogVisible.value = true;
};

// ---------- 6c. 学生周期趋势弹窗 ----------
const trendDialogVisible = ref(false);
const trendStudent = ref<{ name: string, cyclePoints: Record<string, number>, total: number } | null>(null);

const handleShowTrend = (row: { name: string, cyclePoints: Record<string, number>, total: number }) => {
	trendStudent.value = row;
	trendDialogVisible.value = true;
};

const studentTrendOption = computed(() => {
	if (!trendStudent.value) return {};
	const cycles = cycleList.value;
	const names = cycles.map(c => c.name);
	const values = cycles.map(c => trendStudent.value!.cyclePoints[c.id] || 0);
	return {
		tooltip: { trigger: 'axis' },
		grid: { left: 50, right: 20, top: 30, bottom: 40 },
		xAxis: { type: 'category', data: names, name: '周期', boundaryGap: false },
		yAxis: { type: 'value', name: '净积分' },
		series: [{
			name: '净变化',
			type: 'line',
			data: values,
			smooth: true,
			symbol: 'circle',
			symbolSize: 8,
			itemStyle: { color: '#409eff' },
			areaStyle: { opacity: 0.08 },
			markLine: { data: [{ type: 'average', name: '均值' }], lineStyle: { type: 'dashed', color: '#909399' }, label: { position: 'insideEndTop' } },
			markPoint: { data: [{ type: 'max', name: '峰值' }, { type: 'min', name: '谷值' }] },
		}],
	};
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
	display: flex;
	flex-direction: column;
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

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 12px;
	margin-bottom: 8px;
}

.card-tools {
	display: flex;
	align-items: center;
	gap: 8px;
	flex: none;
}

.card-search {
	width: 200px;
}

.expand-detail {
	padding: 8px 16px;
}

.expand-title {
	font-size: 12px;
	color: #909399;
	margin-bottom: 6px;
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
