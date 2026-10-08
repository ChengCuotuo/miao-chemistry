<template>
  <div class="global-setting-container">
    <el-space>
      <span>设置步长：</span>
      <el-input-number
        v-model="basicConfig.step"
        :min="1"
        :max="10"
        controls-position="right"
        style="width: 160px"
        @change="handleChangeStep"
      />
    </el-space>
    <el-space style="margin-top: 10px">
      <span>修改密码：</span>
      <el-input
        disabled
        :password="true"
        v-model="basicConfig.password"
        type="password"
        style="width: 160px"
        placeholder="请输入密码"
      />
      <el-button type="primary" text :icon="Edit" @click="showPasswordDialog" />
    </el-space>
    <el-divider border-style="dashed" style="margin: 14px 0" />
    <el-space>
      <span>隐藏减分快捷键：</span>
      <el-tooltip content="开启后：关联分组/独立分组中学生个人减分、批量减分及小组减分按钮全部隐藏（按规则调整积分不受影响）" placement="top">
        <el-icon class="module-tip-icon"><InfoFilled /></el-icon>
      </el-tooltip>
      <el-switch v-model="basicConfig.hideQuickSubtract" @change="handleHideQuickSubtractChange" />
    </el-space>
    <el-divider border-style="dashed" style="margin: 14px 0" />
    <el-space>
      <span>启用班委账号：</span>
      <el-tooltip content="开启后：可以在「学生管理」页创建班委账号（并可授权其可见模块），锁屏页可选择「班委登录」，班委登录后为只读身份；关闭后仅管理员登录" placement="top">
        <el-icon class="module-tip-icon"><InfoFilled /></el-icon>
      </el-tooltip>
      <el-switch v-model="basicConfig.monitorAccountEnabled" @change="handleMonitorAccountEnabledChange" />
      <el-tag v-if="!basicConfig.monitorAccountEnabled" size="small" type="info" effect="plain">
        仅管理员登录
      </el-tag>
    </el-space>
    <div class="setting-tip">
      「启用班委账号」控制班委这条线是否可用：关闭后不再创建/使用班委账号，锁屏页直接进入管理员密码登录。
    </div>
    <!-- 默认班级功能：仅在启用班委账号后展示 -->
    <template v-if="basicConfig.monitorAccountEnabled">
      <el-divider border-style="dashed" style="margin: 14px 0" />
      <el-space>
        <span>开启默认班级功能：</span>
        <el-tooltip content="开启后：软件启动直接进入所选班级的班委页面（只读身份），锁屏页点击进入也直接进入该班级的班委页面" placement="top">
          <el-icon class="module-tip-icon"><InfoFilled /></el-icon>
        </el-tooltip>
        <el-switch v-model="basicConfig.defaultGradeEnabled" @change="handleDefaultGradeEnabledChange" />
      </el-space>
      <div v-if="basicConfig.defaultGradeEnabled" class="default-grade-row">
        <span>默认班级：</span>
        <el-select
          v-model="basicConfig.defaultGradeId"
          placeholder="请选择默认班级"
          style="width: 220px"
          @change="handleDefaultGradeChange"
        >
          <el-option v-for="g in selectableGrades" :key="g.id" :label="g.name" :value="g.id" />
        </el-select>
        <span v-if="defaultAccountHint" class="default-grade-hint">{{ defaultAccountHint }}</span>
      </div>
      <div class="setting-tip">
        「默认班级」用于把当前设备固定给某个班级使用：启动即进入该班级的班委页面，无需登录；进入后仍可通过右上角「切换为管理员」换成管理员身份。
      </div>
    </template>
    <el-divider border-style="dashed" style="margin: 14px 0" />
    <div class="module-setting">
      <div class="module-setting-title">
        班级管理模块展示设置（拖拽调整顺序，开关控制展示）：
      </div>
      <draggable
        class="module-drag-list"
        item-key="key"
        tag="ul"
        v-model="moduleOrderList"
        :animation="200"
        handle=".drag-handle"
        @end="handleModuleOrderChange"
      >
        <template #item="{ element }">
          <li class="module-drag-item">
            <el-icon class="drag-handle"><Rank /></el-icon>
            <span class="module-name">{{ element.label }}</span>
            <el-tooltip
              v-if="element.key === 'monitor'"
              content="关闭后：关联分组/独立分组隐藏积分周期、数据分析自动隐藏、锁屏直接管理员登录"
              placement="top"
            >              <el-icon class="module-tip-icon"><InfoFilled /></el-icon>
            </el-tooltip>
            <el-tooltip
              v-if="element.key === 'group' || element.key === 'team'"
              :content="element.key === 'group' ? '关联分组与独立分组互斥，只能开启一个' : '独立分组与关联分组互斥，只能开启一个'"
              placement="top"
            >
              <el-icon class="module-tip-icon"><InfoFilled /></el-icon>
            </el-tooltip>
            <el-switch v-model="element.visible" @change="(v: any) => handleModuleToggle(element, v)" />
          </li>
        </template>
      </draggable>
    </div>
    <el-divider border-style="dashed" style="margin: 14px 0" />
    <div class="module-setting">
      <div class="module-setting-title">
        数据分析图表展示设置（拖拽调整顺序，开关控制展示）：
      </div>
      <draggable
        class="module-drag-list"
        item-key="key"
        tag="ul"
        v-model="chartOrderList"
        :animation="200"
        handle=".drag-handle"
        @end="handleChartOrderChange"
      >
        <template #item="{ element }">
          <li class="module-drag-item">
            <el-icon class="drag-handle"><Rank /></el-icon>
            <span class="module-name">{{ element.label }}</span>
            <el-switch v-model="element.visible" @change="handleChartChange" />
          </li>
        </template>
      </draggable>
    </div>
  </div>

  <!-- 密码修改弹窗组件 -->
  <PasswordChangeDialog
    v-model:visible="passwordDialogVisible"
    :current-password="basicConfig.password"
    @password-changed="handlePasswordChanged"
  />
</template>

<script setup lang="ts">
import { useAppStore } from '../../store/models/app';
import { useBasic } from '../../database/utils/useBasic';
import { Edit, Rank, InfoFilled } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref, computed, onMounted, watch } from 'vue';
import draggable from 'vuedraggable';
import PasswordChangeDialog from './PasswordChangeDialog.vue';
import md5 from 'blueimp-md5';
import { useDefaultGrade } from '../../database/utils/useDefaultGrade';

const { updateBasicConfig } = useBasic();
// 默认班级功能：可用班级列表 / 自动进入 / 账号提示
const { selectableGrades, resolveDefaultAccount } = useDefaultGrade();

const appStore = useAppStore();
const basicConfig = appStore.database.basicConfig;

// 模块定义：key 唯一标识，label 展示名
const MODULE_DEFS: Record<string, string> = {
  student: '学生管理',
	group: '关联分组',
	team: '独立分组',
	monitor: '周期记分',
	analysis: '数据分析',
	lottery: '积分兑换',
	record: '积分记录',
};

const DEFAULT_MODULE_ORDER = ['student','group', 'team',  'monitor', 'analysis', 'record', 'lottery'];

// 模块 key → moduleVisibility 里的真实字段名
const MODULE_VIS_FIELD: Record<string, string> = {
  student: 'studentManage',
  group: 'groupManage',
  team: 'teamManage',
  monitor: 'monitorManage',
  record: 'pointsManage',
  lottery: 'pointsExchange',
  analysis: 'analysisManage',
};

const getModuleVisible = (key: string): boolean => {
  const vis = basicConfig?.moduleVisibility || {
    groupManage: false,
    pointsManage: true,
    pointsExchange: true,
    studentManage: true,
    monitorManage: true,
    analysisManage: true,
    teamManage: true,
  };
  return vis[MODULE_VIS_FIELD[key] as keyof typeof vis] ?? true;
};

// 拖拽列表数据（顺序 + 可见性快照）
const moduleOrderList = ref<{ key: string; label: string; visible: boolean }[]>(
  (() => {
    const savedOrder: string[] =
      Array.isArray(basicConfig?.moduleOrder) && basicConfig.moduleOrder.length
        ? basicConfig.moduleOrder.filter((k: string) => MODULE_DEFS[k])
        : DEFAULT_MODULE_ORDER;
    // 补齐保存顺序里缺失的模块（新增模块兼容）
    const missing = DEFAULT_MODULE_ORDER.filter((k) => !savedOrder.includes(k));
    return [...savedOrder, ...missing].map((key) => ({
      key,
      label: MODULE_DEFS[key],
      visible: getModuleVisible(key),
    }));
  })(),
);

// 拖拽结束：写入新顺序并持久化
const handleModuleOrderChange = () => {
  handleModuleChange();
};

// ---------- 数据分析图表设置 ----------
const ANALYSIS_CHART_DEFS: Record<string, string> = {
  student: '个体诊断（学生维度）',
  matrix: '积分变化明细（学生×周期）',
  rule: '行为画像（规则维度）',
  trend: '趋势分析（周期对比）',
  ruleHealth: '规则健康度（规则库维度）',
  group: '协作观察（小组维度）',
};
const DEFAULT_ANALYSIS_CHART_ORDER = [
  'student',
  'matrix',
  'rule',
  'trend',
  'ruleHealth',
  'group',
];

const getChartVisible = (key: string): boolean => {
  const vis = basicConfig?.analysisChartVisibility || {
    trend: true,
    rule: true,
    ruleHealth: true,
    group: true,
    student: true,
    matrix: true,
  };
  return (vis as Record<string, boolean>)[key] ?? true;
};

// 图表拖拽列表（顺序 + 可见性快照）
const chartOrderList = ref<{ key: string; label: string; visible: boolean }[]>(
  (() => {
    const savedOrder: string[] =
      Array.isArray(basicConfig?.analysisChartOrder) &&
      basicConfig.analysisChartOrder.length
        ? basicConfig.analysisChartOrder.filter(
            (k: string) => ANALYSIS_CHART_DEFS[k],
          )
        : DEFAULT_ANALYSIS_CHART_ORDER;
    const missing = DEFAULT_ANALYSIS_CHART_ORDER.filter(
      (k) => !savedOrder.includes(k),
    );
    return [...savedOrder, ...missing].map((key) => ({
      key,
      label: ANALYSIS_CHART_DEFS[key],
      visible: getChartVisible(key),
    }));
  })(),
);

const handleChartOrderChange = () => {
  handleChartChange();
};

// 图表可见性/顺序变更：同步到配置（防抖持久化）
const handleChartChange = () => {
  if (basicConfig) {
    if (!basicConfig.analysisChartVisibility) {
      basicConfig.analysisChartVisibility = {
        trend: true,
        rule: true,
        ruleHealth: true,
        group: true,
        student: true,
        matrix: true,
      };
    }
    chartOrderList.value.forEach((item) => {
      (basicConfig.analysisChartVisibility as Record<string, boolean>)[
        item.key
      ] = item.visible;
    });
    basicConfig.analysisChartOrder = chartOrderList.value.map(
      (item) => item.key,
    );
  }
  // 复用防抖持久化
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    await updateBasicConfig({ ...basicConfig });
    ElMessage.success('设置已保存');
  }, 300);
};

// 防抖定时器
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const handleChangeStep = (val: number) => {
  // 清除之前的定时器
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // 防抖处理，延迟300ms执行
  debounceTimer = setTimeout(async () => {
    basicConfig.step = val;
    await updateBasicConfig({ ...basicConfig });
  }, 300);
};

// 隐藏减分快捷键开关变更
const handleHideQuickSubtractChange = async (val: boolean) => {
  basicConfig.hideQuickSubtract = val;
  await updateBasicConfig({ ...basicConfig });
  ElMessage.success(val ? '已隐藏减分快捷键' : '已显示减分快捷键');
};

// 启用班委账号开关变更：关闭前二次确认
const handleMonitorAccountEnabledChange = async (val: boolean) => {
  if (!val) {
    try {
      await ElMessageBox.confirm(
        '关闭后：无法再创建班委账号，锁屏页的「班委登录」也会隐藏，只能使用管理员密码登录。确认关闭？',
        '关闭班委账号',
        { type: 'warning', confirmButtonText: '确认关闭', cancelButtonText: '取消' },
      );
    } catch {
      // 取消：把开关拨回去
      basicConfig.monitorAccountEnabled = true;
      return;
    }
  }
  basicConfig.monitorAccountEnabled = val;
  // 关闭班委账号时，默认班级功能一并失效
  const defaultGradeClosed = val ? false : !!basicConfig.defaultGradeEnabled;
  if (!val) {
    basicConfig.defaultGradeEnabled = false;
    defaultAccountHint.value = '';
  }
  await updateBasicConfig({ ...basicConfig });
  // 关闭后当前班委会话立即失效：退出到锁屏（与管理员改密码不回踢不同，这里是权限本身被撤销）
  const kicked = val ? false : appStore.exitMonitorSessionIfCurrent();
  ElMessage.success(val
    ? '已启用班委账号（可创建账号并让班委登录）'
    : (kicked ? '已关闭班委账号，当前班委登录已退出' : '已关闭班委账号，仅管理员登录'));
  if (defaultGradeClosed) ElMessage.info('默认班级功能已同步关闭');
};

// ---------- 默认班级功能 ----------
const defaultAccountHint = ref('');

// 当前默认班级名称（用于提示文案）
const defaultGradeName = computed(() =>
  selectableGrades.value.find((item) => item.id === basicConfig.defaultGradeId)?.name || '',
);

// 刷新「自动进入时使用的班委账号」提示
const refreshDefaultAccountHint = async () => {
  defaultAccountHint.value = '';
  if (!basicConfig.defaultGradeEnabled || !basicConfig.defaultGradeId) return;
  const account = await resolveDefaultAccount(basicConfig.defaultGradeId);
  defaultAccountHint.value = account
    ? `将以班委账号「${account.name}」自动进入`
    : '该班级暂无班委账号，将按默认可见模块（仅学生管理）进入';
};

// 开启默认班级功能的开关
const handleDefaultGradeEnabledChange = async (val: boolean) => {
  if (val) {
    if (!selectableGrades.value.length) {
      basicConfig.defaultGradeEnabled = false;
      ElMessage.warning('暂无可用班级，请先创建班级');
      return;
    }
    // 未选或所选班级已失效：默认选中第一个可用班级
    if (!selectableGrades.value.some((item) => item.id === basicConfig.defaultGradeId)) {
      basicConfig.defaultGradeId = selectableGrades.value[0].id;
    }
  }
  await updateBasicConfig({ ...basicConfig });
  await refreshDefaultAccountHint();
  ElMessage.success(val
    ? `已开启默认班级功能：启动将直接进入「${defaultGradeName.value}」的班委页面`
    : '已关闭默认班级功能');
};

// 切换默认班级
const handleDefaultGradeChange = async () => {
  await updateBasicConfig({ ...basicConfig });
  await refreshDefaultAccountHint();
  ElMessage.success(`默认班级已设置为「${defaultGradeName.value}」`);
};

// 默认班级被删除时，自动关闭默认班级功能（避免启动进入空页面）
watch(selectableGrades, (list) => {
  if (!basicConfig.defaultGradeEnabled) return;
  if (list.some((item) => item.id === basicConfig.defaultGradeId)) return;
  basicConfig.defaultGradeEnabled = false;
  basicConfig.defaultGradeId = '';
  defaultAccountHint.value = '';
  updateBasicConfig({ ...basicConfig });
  ElMessage.warning('默认班级已不存在，已自动关闭默认班级功能');
});

onMounted(refreshDefaultAccountHint);

// 密码修改相关
const passwordDialogVisible = ref(false);

const showPasswordDialog = () => {
  passwordDialogVisible.value = true;
};

const handlePasswordChanged = async (newPassword: string) => {
  basicConfig.password = md5(newPassword);
  await updateBasicConfig({ ...basicConfig });
};

// 模块可见性/顺序变更：同步到配置字段（防抖持久化）
// 开关切换统一入口：关联分组/独立分组互斥，只能开一个
const handleModuleToggle = (element: { key: string, label: string, visible: boolean }, newValue: boolean) => {
	// 处理关联分组/独立分组互斥
	if (element.key === 'group' && newValue) {
		const teamItem = moduleOrderList.value.find(item => item.key === 'team');
		if (teamItem && teamItem.visible) {
			ElMessageBox.confirm('关联分组与独立分组互斥，开启「关联分组」将自动关闭「独立分组」，确认？', '提示', {
				type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消',
			}).then(() => {
				teamItem.visible = false;
				handleModuleChange();
			}).catch(() => {
				// 取消则回滚开关
				element.visible = false;
			});
			return;
		}
	} else if (element.key === 'team' && newValue) {
		const groupItem = moduleOrderList.value.find(item => item.key === 'group');
		if (groupItem && groupItem.visible) {
			ElMessageBox.confirm('独立分组与关联分组互斥，开启「独立分组」将自动关闭「关联分组」，确认？', '提示', {
				type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消',
			}).then(() => {
				groupItem.visible = false;
				handleModuleChange();
			}).catch(() => {
				element.visible = false;
			});
			return;
		}
	}
	// 其他情况直接保存
	handleModuleChange();
};

const handleModuleChange = () => {
  if (basicConfig) {
    // 初始化兜底
    if (!basicConfig.moduleVisibility) {
      basicConfig.moduleVisibility = {
        groupManage: false,
        pointsManage: true,
        pointsExchange: true,
        studentManage: true,
        monitorManage: true,
        analysisManage: true,
        teamManage: true,
      };
    }
    moduleOrderList.value.forEach((item) => {
      // 按映射写入真实字段：groupManage / studentManage / monitorManage / pointsManage / pointsExchange
      const field = MODULE_VIS_FIELD[
        item.key
      ] as keyof typeof basicConfig.moduleVisibility;
      basicConfig.moduleVisibility[field] = item.visible;
    });
    basicConfig.moduleOrder = moduleOrderList.value.map((item) => item.key);
  }

  // 清除之前的定时器
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // 防抖处理，延迟300ms执行
  debounceTimer = setTimeout(async () => {
    await updateBasicConfig({ ...basicConfig });
    ElMessage.success('设置已保存');
  }, 300);
};
</script>

<style scoped>
.global-setting-container {  /* height: calc(100% - 20px); */
  width: calc(100% - 20px);
  background-color: #fff;
  padding: 10px;

  font-size: 14px;

  display: flex;
  flex-direction: column;
  flex-wrap: wrap;

  overflow-y: auto;
}

.module-setting-title {
  font-weight: bold;
}

.module-drag-list {
  list-style: none;
  padding: 0;
  margin: 10px 0 0;
  width: 340px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fff;
}

.module-drag-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid #ebeef5;
  background: #fff;
}

.module-drag-item:last-child {
  border-bottom: none;
}

.drag-handle {
  cursor: grab;
  color: #909399;
}

.drag-handle:active {
  cursor: grabbing;
}

.module-name {
  flex: 1;
}

.setting-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
  max-width: 760px;
}

.default-grade-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.module-tip-icon {
  color: #909399;
  cursor: help;
  font-size: 14px;
}

.default-grade-hint {
  font-size: 12px;
  color: #909399;
}
</style>
