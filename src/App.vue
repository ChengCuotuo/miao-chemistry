<template>
  <div style="height: 100%;">
      <StickyNav :visible="activeKey !== 'lock'" :menuItems="menuItems" :menuCallback="handleMenuClick" />
      <MainBack v-if="activeKey === 'lock'" :onMenu="handleMenuClick" />
      <div style="height: calc(100% - 58px);" v-show="activeKey !== 'lock'">
        <!-- <SystemConfig /> -->
        <!-- 中和反应与pH曲线模拟实验 -->
        <!-- <AcidBase v-if="activeKey === 'ph'" /> -->
        <!-- 推箱子 -->
        <BoxGame v-if="activeKey === 'box'" />
        <GroupPoints v-if="activeKey === 'points'" />
      </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import MainBack from './components/MainBack.vue';
// import SystemConfig from './components/system-config.vue';
import BoxGame from './games/box/index.vue';
// import AcidBase from './chemistry/acid-base/index.vue';
import GroupPoints from './group-points/index.vue';
import StickyNav from './components/StickyNav.vue';
import { useAppStore } from './group-points/store/models/app';
import { loadGroupPointsConfig } from './group-points/database';
import { ElMessage, ElMessageBox, dayjs } from 'element-plus';
import { useBasic } from './group-points/database/utils/useBasic';
import { useRouter } from 'vue-router'

const activeKey = ref('lock');
const appStore = useAppStore();
const { updateBasicConfig } = useBasic()
const router = useRouter()

// 菜单项数据
const menuItems = ref([
  // { key: 'ph', title: '中和反应与pH曲线模拟实验', desc: '中和反应与pH曲线模拟实验', icon: 'TrendCharts' },
  { key: 'points', title: '积分管理', desc: '积分管理', icon: 'Money' },
  { key: 'box', title: '推箱子', desc: '推箱子游戏', icon: 'Box' },
])

const handleMenuClick = (key: string) => {
  if (key === 'menu') {
    activeKey.value = menuItems.value[0].key;

    const { buildType, duration, startTime } = appStore.database.basicConfig
    if (buildType === 'trial') {
      const endTime = startTime + duration
      if (dayjs().unix() > endTime) {
	      appStore.setIsCollapse(true);
        router.push({ name: 'lock' })
      }
    }
  } else {
    activeKey.value = key;
  }
}

// 班委退出登录：切回锁屏并复位
watch(() => appStore.needLock, (v) => {
  if (v) {
    appStore.setNeedLock(false);
    activeKey.value = 'lock';
  }
});

onMounted(async () => {
  const data = await loadGroupPointsConfig()
  if (data) {
    appStore.setDatabase(data);
    if (data.basicConfig.firstRun === 1) {
      // 第一次运行，提示用户设置密码 
      ElMessageBox.alert(`当前密码为：${data?.password}，只显示一次，请记下密码`, '提示', {
        confirmButtonText: '确认',
        callback: async () => {
          await navigator.clipboard.writeText(data?.password);
          ElMessage.success('密码已复制到剪贴板')
          appStore.database.basicConfig.firstRun = 0
          await updateBasicConfig({ ...appStore.database.basicConfig })
        },
      })
    }
  }
});


console.log('👋 This message is being logged by "App.vue", included via Vite');
</script>
