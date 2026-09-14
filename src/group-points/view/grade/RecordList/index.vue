<template>
  <div class="record-list">
    <!-- 筛选区域 -->
    <div class="filter-bar">
      <el-select
        v-if="monitorEnabled && !props.cycleId"
        v-model="filterCycleId"
        placeholder="周期"
        class="filter-select"
        clearable
      >
        <el-option
          v-for="cycle in cycleList"
          :key="cycle.id"
          :label="cycle.name"
          :value="cycle.id"
        />
      </el-select>
      <el-input
        v-if="!props.studentId"
        v-model="searchStudentId"
        placeholder="学生ID"
        class="search-input"
        clearable
      />
      <el-input
        v-if="!props.studentId"
        v-model="searchStudentName"
        placeholder="学生姓名"
        class="search-input"
        clearable
      />
      <div class="rule-filter">
        <RuleTreeSelect
          v-model="filterRuleIds"
          :rules="filterRules"
          :groups="filterRuleGroups"
          placeholder="规则名称"
          multiple
        />
      </div>
      <el-select
        v-model="filterType"
        placeholder="筛选类型"
        class="filter-select"
        clearable
      >
        <el-option label="加分" value="add" />
        <el-option label="减分" value="subtract" />
      </el-select>
      <el-select
        v-if="monitorEnabled && hasApprovalRecord"
        v-model="filterStatus"
        placeholder="审批状态"
        class="filter-select"
        clearable
      >
        <el-option label="待审批" :value="RECORD_STATUS.PENDING" />
        <el-option label="已通过" :value="RECORD_STATUS.APPROVED" />
        <el-option label="已驳回" :value="RECORD_STATUS.REJECTED" />
      </el-select>
    </div>

    <!-- 记录列表 -->
    <el-table :data="paginatedRecords" border>
      <el-table-column label="序号" type="index" width="60" />
      <el-table-column
        v-if="!props.studentId"
        label="学生ID"
        width="120"
      >
        <template #default="scope">
          <span v-if="scope.row.stu_id">{{ scope.row.stu_id }}</span>
          <span v-else class="text-muted">—</span>
        </template>
      </el-table-column>
      <el-table-column label="学生姓名" prop="student_name" width="120" />
      <el-table-column label="规则名称" prop="rule_name" min-width="140">
        <template #default="scope">
          <el-space>
            <span>{{ scope.row.rule_name }} </span>
            <el-icon
              v-if="scope.row.rule_id.startsWith(BID_RECORD_PREFIX)"
              class="cursor-pointer"
              @click="handleViewPrize(scope.row)"
            >
              <question-filled />
            </el-icon>
          </el-space>
        </template>
      </el-table-column>
      <el-table-column label="积分变化" width="200">
        <template #default="scope">
          <!-- 全量操作汇总记录：加/减显示人均，设置显示目标值 -->
          <el-tooltip
            v-if="isBatchRecord(scope.row.rule_id)"
            placement="top"
            :content="`${batchRecordText(scope.row)}，影响 ${scope.row.count} 人，合计 ${scope.row.points > 0 ? '+' : ''}${scope.row.points} 分`"
          >
            <span
              :class="scope.row.points > 0 ? 'text-success' : scope.row.points < 0 ? 'text-danger' : 'text-muted'"
              >{{ batchRecordText(scope.row) }}</span
            >
          </el-tooltip>
          <span v-else>
            <span
              :class="
                singlePoints(scope.row) > 0 ? 'text-success' : 'text-danger'
              "
              >{{ scope.row.points > 0 ? '+' : ''
              }}{{ scope.row.points }} 分</span
            >
            <template v-if="scope.row.count > 1">
              (
              <span class="count-badge">
                {{ singlePoints(scope.row) > 0 ? '+' : ''
                }}{{ singlePoints(scope.row) }} 分
              </span>
              <span class="count-badge">× {{ scope.row.count }} 次</span>
              )
            </template>
          </span>
        </template>
      </el-table-column>
      <el-table-column
        v-if="monitorEnabled && !props.cycleId"
        label="周期"
        width="110"
      >
        <template #default="scope">
          <span v-if="getCycleNameByRecord(scope.row)">{{
            getCycleNameByRecord(scope.row)
          }}</span>
          <span v-else class="text-muted">—</span>
        </template>
      </el-table-column>
      <el-table-column
        v-if="monitorEnabled"
        label="操作人"
        width="130"
        show-overflow-tooltip
      >
        <template #default="scope">
          <el-space :size="4">
            <span>{{ scope.row.operator_name || '—' }}</span>
            <el-tag
              v-if="isEditedByAdmin(scope.row)"
              size="small"
              type="warning"
              effect="plain"
            >已修改</el-tag>
          </el-space>
        </template>
      </el-table-column>
      <el-table-column
        v-if="monitorEnabled && hasApprovalRecord"
        label="审批状态"
        width="110"
        align="center"
      >
        <template #default="scope">
          <template v-if="isApprovalRecord(scope.row)">
            <el-tooltip
              v-if="scope.row.status === RECORD_STATUS.REJECTED && scope.row.reject_reason"
              placement="top"
              :content="`驳回理由：${scope.row.reject_reason}`"
            >
              <el-tag size="small" type="danger" effect="plain">已驳回</el-tag>
            </el-tooltip>
            <el-tooltip
              v-else-if="scope.row.status === RECORD_STATUS.PENDING"
              placement="top"
              content="尚未计入学生积分，待管理员审批"
            >
              <el-tag size="small" :type="statusTagType(scope.row.status)" effect="plain">
                {{ statusText(scope.row.status) }}
              </el-tag>
            </el-tooltip>
            <el-tag
              v-else
              size="small"
              :type="statusTagType(scope.row.status)"
              effect="plain"
            >
              {{ statusText(scope.row.status) }}
            </el-tag>
          </template>
          <span v-else class="text-muted">—</span>
        </template>
      </el-table-column>
      <el-table-column label="时间" prop="time" width="180" />
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        :current-page="currentPage"
        :page-sizes="[10, 30, 60]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredRecords.length"
      />
    </div>

    <!-- 奖品详情弹窗 -->
    <PrizeDetailDialog
      v-model:visible="prizeDetailVisible"
      :form-data="prizeDetailData"
      :read-only="true"
      ref="prizeDetailDialogRef"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAppStore } from '../../../store/models/app';
import { RuleRecord, Rule, RuleGroup, RECORD_STATUS, getRecordStatus, OPERATOR_ROLE } from '../../../database/class';
import { BID_RECORD_PREFIX } from './constant';
import type { Prize } from '../../../database/class';
import { loadImageAsUint8Array } from '../../../database';
import { BATCH_RECORD_NAMES, formatBatchRecordText, isApprovalRecord, isBatchRecord } from '../../../database';

// 全量操作汇总记录的展示文案（加/减为人均，设置为目标值）
const batchRecordText = (record: RuleRecord) => formatBatchRecordText(record.rule_id, record.points, record.count, record.batch_value);
// 注意：以下三个仅在 template 中使用，部分编辑器的「移除未使用导入」会误删，导致组件渲染不出来，请勿删除
import RuleTreeSelect from '../../components/RuleTreeSelect.vue';
import PrizeDetailDialog from '../LotteryDraw/PrizeDetailDialog.vue';
import { QuestionFilled } from '@element-plus/icons-vue';

// 规则名称筛选树的常量：非规则库记录（兑奖 / 已删除规则）归入「其他」分组
const OTHER_RULE_GROUP_ID = '__OTHER_RULE_GROUP__';
const BID_SYNTHETIC_RULE_ID = '__BID_RECORD__';
const ORPHAN_RULE_PREFIX = '__ORPHAN_RULE__::';

interface Props {
  studentId?: string;
  cycleId?: string;
}

const props = defineProps<Props>();

const appStore = useAppStore();

// 是否开启周期记分：未开启时隐藏周期筛选与周期列
const monitorEnabled = computed(
  () => appStore.database.basicConfig?.moduleVisibility?.monitorManage ?? true,
);

// 周期筛选：cycleId prop 优先（弹窗固定周期），否则用筛选器
const filterCycleId = ref('');

// 周期列表（仅列出班委周期）
const cycleList = computed(
  () => appStore.activeGrade?.gradeInfo?.monitorCycleList || [],
);

// 获取周期名称
const getCycleName = (cycleId: string): string => {
  return cycleList.value.find((item) => item.id === cycleId)?.name || '';
};

// 根据记录反查所属周期名：优先 source=1 的 cycle_id，否则按记录时间匹配周期时间范围
const getCycleNameByRecord = (record: RuleRecord): string => {
  // 全量操作汇总记录不属于任何周期
  if (isBatchRecord(record.rule_id)) return '';
  if (record.source === 1 && record.cycle_id) {
    return getCycleName(record.cycle_id);
  }
  if (!record.time) return '';
  const date = record.time.slice(0, 10);
  const cycle = cycleList.value.find(
    (c) => c.startTime && c.endTime && date >= c.startTime && date <= c.endTime,
  );
  return cycle?.name || '';
};

// 筛选类型：all-全部, add-加分, subtract-减分
const filterType = ref<'add' | 'subtract'>();

// 审批状态筛选（不选 = 全部状态）
const filterStatus = ref<number | undefined>(undefined);

// 当前记录里是否存在审批记录（决定「审批状态」列与筛选器是否出现，避免无意义列）
const hasApprovalRecord = computed(() => studentRecords.value.some(isApprovalRecord));

const statusText = (status?: number) =>
  getRecordStatus({ status }) === RECORD_STATUS.PENDING
    ? '待审批'
    : getRecordStatus({ status }) === RECORD_STATUS.REJECTED
      ? '已驳回'
      : '已通过';

const statusTagType = (status?: number) => {
  const s = getRecordStatus({ status });
  return s === RECORD_STATUS.PENDING ? 'warning' : s === RECORD_STATUS.REJECTED ? 'danger' : 'success';
};

// 管理员改过内容的记录（操作人=管理员，但最初是班委提交的）
const isEditedByAdmin = (record: RuleRecord) =>
  record.operator_role === OPERATOR_ROLE.TEACHER &&
  !!record.submitter_name &&
  record.operator_name === '管理员';

// 搜索关键词
const searchStudentId = ref('');
const searchStudentName = ref('');
// 规则名称筛选（树形多选：分组 → 规则，value 为选中的规则 id 数组）
const filterRuleIds = ref<string[]>([]);

// 规则库 id 集合
const libRuleIds = computed(
  () => new Set((appStore.database.ruleList || []).map((rule) => rule.id)),
);

// 记录中出现、但不在规则库里的规则：兑奖记录归为一个「积分兑换」虚拟规则；其余按名称归为虚拟规则
const extraFilterRules = computed<Rule[]>(() => {
  const ids = libRuleIds.value;
  const list: Rule[] = [];
  let hasBid = false;
  const batchRuleIds = new Set<string>();
  const orphanNames = new Set<string>();
  studentRecords.value.forEach((record) => {
    // 全量操作汇总记录：按虚拟规则单独成节点
    if (isBatchRecord(record.rule_id)) {
      batchRuleIds.add(record.rule_id);
      return;
    }
    if (ids.has(record.rule_id)) return;
    if (record.rule_id.startsWith(BID_RECORD_PREFIX)) {
      hasBid = true;
      return;
    }
    if (record.rule_name) orphanNames.add(record.rule_name);
  });
  if (hasBid) {
    list.push(
      new Rule({
        id: BID_SYNTHETIC_RULE_ID,
        name: '积分兑换',
        points: null,
        group_id: OTHER_RULE_GROUP_ID,
        order: 0,
      }),
    );
  }
  // 全量操作汇总记录（虚拟规则 id 直接用真实 rule_id，筛选时按精确匹配即可）
  Array.from(batchRuleIds)
    .sort()
    .forEach((ruleId, index) => {
      list.push(
        new Rule({
          id: ruleId,
          name: BATCH_RECORD_NAMES[ruleId] || '全量调整',
          points: null,
          group_id: OTHER_RULE_GROUP_ID,
          order: 10 + index,
        }),
      );
    });
  let order = 1;
  Array.from(orphanNames)
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
    .forEach((name) => {
      list.push(
        new Rule({
          id: `${ORPHAN_RULE_PREFIX}${name}`,
          name,
          points: null,
          group_id: OTHER_RULE_GROUP_ID,
          order: order++,
        }),
      );
    });
  return list;
});

// 树形筛选的规则集合：规则库 + 虚拟规则
const filterRules = computed<Rule[]>(() => [
  ...(appStore.database.ruleList || []),
  ...extraFilterRules.value,
]);

// 树形筛选的分组集合：规则库分组 + 有虚拟规则时的「其他」分组
const filterRuleGroups = computed<RuleGroup[]>(() => {
  const groups = [...(appStore.database.ruleGroupList || [])];
  if (extraFilterRules.value.length) {
    groups.push(
      new RuleGroup({ id: OTHER_RULE_GROUP_ID, name: '其他', order: 9999 }),
    );
  }
  return groups;
});

// 分页参数
const currentPage = ref(1);
const pageSize = ref(10);

// 获取学生姓名
const getstudent_name = (stuId: string): string => {
  if (!appStore.activeGrade) return '';
  const student = appStore.activeGrade.gradeInfo.studentList.find(
    (s) => s.id === stuId,
  );
  return student?.name || '';
};

// 单次规则分值 = 总积分 / 次数（count>=1 时 points 恒为 rule.points × count）
const singlePoints = (record: RuleRecord): number => {
  const count = record.count > 1 ? record.count : 1;
  return record.points / count;
};

// 获取规则名称
const getrule_name = (ruleId: string): string => {
  // 如果是 BID_RECORD_PREFIX 开头的是积分兑换扣除规则
  if (ruleId.startsWith(BID_RECORD_PREFIX)) {
    return '积分兑换';
  }
  // 全量操作汇总记录（全量设置 / 加 / 减积分）
  if (isBatchRecord(ruleId)) {
    return BATCH_RECORD_NAMES[ruleId] || '全量调整';
  }
  const rule = appStore.database.ruleList.find((r) => r.id === ruleId);
  return rule?.name || '主动执行';
};

// 扩展记录接口
interface ExtendedRecord extends RuleRecord {
  student_name: string;
  rule_name: string;
}

// 获取学生的所有记录（带扩展信息）
const studentRecords = computed<ExtendedRecord[]>(() => {
  if (!appStore.activeGrade) return [];
  // 筛选学生记录
  const curRecordList = appStore.activeGrade.gradeInfo.recordList;
  let filtered = !props.studentId
    ? curRecordList
    : curRecordList.filter((record) => record.stu_id === props.studentId);
  // 固定周期（弹窗）或筛选器周期
  // 1) 班委记录（source=1）：按 cycle_id 精确归属，始终显示——即使记录时间在周期范围外（如预建的末来周期、后补时间范围的周期）
  // 2) 普通记录：周期有时间范围时，记录时间落在范围内才算；无时间范围时不匹配
  const targetCycle = props.cycleId || filterCycleId.value;
  if (targetCycle) {
    const cycle = cycleList.value.find((item) => item.id === targetCycle);
    if (cycle) {
      const hasRange = !!cycle.startTime && !!cycle.endTime;
      filtered = filtered.filter((record) => {
        if (record.source === 1) {
          // 班委记录：按 cycle_id 归属
          return record.cycle_id === targetCycle;
        }
        // 普通记录：按时间范围匹配
        if (!hasRange) return false;
        const date = (record.time || '').slice(0, 10);
        return date >= cycle.startTime && date <= cycle.endTime;
      });
    }
  }
  // 添加学生姓名和规则名称
  return filtered
    .map((record) => ({
      ...record,
      student_name: isBatchRecord(record.rule_id) ? '全班' : getstudent_name(record.stu_id),
      rule_name: getrule_name(record.rule_id),
    }))
    .reverse();
});

// 根据筛选类型和关键词过滤
const filteredRecords = computed(() => {
  let result = studentRecords.value;

  // 按积分类型筛选
  if (filterType.value === 'add') {
    result = result.filter((record) => record.points > 0);
  } else if (filterType.value === 'subtract') {
    result = result.filter((record) => record.points < 0);
  }

  // 按审批状态筛选（待审批 / 已通过 / 已驳回）
  if (filterStatus.value !== undefined && filterStatus.value !== null) {
    result = result.filter(
      (record) => getRecordStatus(record) === filterStatus.value,
    );
  }

  // 按学生ID筛选
  if (searchStudentId.value) {
    result = result.filter((record) =>
      record.stu_id.toLowerCase().includes(searchStudentId.value.toLowerCase()),
    );
  }

  // 按学生姓名筛选
  if (searchStudentName.value) {
    result = result.filter((record) =>
      record.student_name
        .toLowerCase()
        .includes(searchStudentName.value.toLowerCase()),
    );
  }

  // 按规则筛选（多选，命中任一选中规则即保留）：虚拟规则（积分兑换 / 已删除规则）走前缀或名称，其余按规则 id 精确匹配
  if (filterRuleIds.value.length) {
    result = result.filter((record) =>
      filterRuleIds.value.some((ruleId) => {
        if (ruleId === BID_SYNTHETIC_RULE_ID)
          return record.rule_id.startsWith(BID_RECORD_PREFIX);
        if (ruleId.startsWith(ORPHAN_RULE_PREFIX))
          return record.rule_name === ruleId.slice(ORPHAN_RULE_PREFIX.length);
        return record.rule_id === ruleId;
      }),
    );
  }

  return result;
});

// 分页后的数据
const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredRecords.value.slice(start, end);
});

// 分页大小变化
const handleSizeChange = (val: number) => {
  pageSize.value = val;
  currentPage.value = 1;
};

// 处理分页切换
const handlePageChange = (page: number) => {
  currentPage.value = page;
};

// 奖品详情弹窗
const prizeDetailVisible = ref(false);
const prizeDetailData = ref<Partial<Prize>>({});
const prizeDetailDialogRef = ref();

// 获取奖品信息
const getPrizeById = (prizeId: string): Prize | undefined => {
  return appStore.database.prizeList.find((p) => p.id === prizeId);
};

// 查看奖品详情
const handleViewPrize = async (record: ExtendedRecord) => {
  // 从规则ID中提取奖品ID（格式：bid_奖品ID）
  const prizeId = record.rule_id.replace(BID_RECORD_PREFIX, '');
  const prize = getPrizeById(prizeId);

  if (prize) {
    prizeDetailData.value = { ...prize };
    prizeDetailVisible.value = true;

    // 如果有图片，加载并显示到编辑器
    if (prize.image) {
      try {
        const uint8Array = await loadImageAsUint8Array(prize.image);
        if (uint8Array && prizeDetailDialogRef.value?.imageEditorRef) {
          await prizeDetailDialogRef.value.imageEditorRef.setImage(
            uint8Array,
            prize.image,
          );
        }
      } catch (error) {
        console.error('Failed to load prize image:', error);
      }
    }
  }
};

// 筛选条件变化时回到第 1 页，避免停留在越界页导致列表看起来是空的
watch(
  [
    filterCycleId,
    filterType,
    searchStudentId,
    searchStudentName,
    filterRuleIds,
  ],
  () => {
    currentPage.value = 1;
  },
);

// 监听学生ID变化，重置分页
watch(
  () => props.studentId,
  () => {
    currentPage.value = 1;
  },
);
</script>

<style scoped>
.record-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.search-input {
  width: 140px;
}

.filter-select {
  width: 140px;
}

.rule-filter {
  width: 260px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #999;
}

.text-success {
  color: #67c23a;
  font-weight: 600;
}

.text-danger {
  color: #f56c6c;
  font-weight: 600;
}

.count-badge {
  color: #909399;
}

.text-muted {
  color: #909399;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
