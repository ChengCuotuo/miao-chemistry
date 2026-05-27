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
      <GroupPoints v-if="activeKey === 'points'"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MainBack from './components/main-back/MainBack.vue';
// import SystemConfig from './components/system-config.vue';
import BoxGame from './games/box/index.vue';
// import AcidBase from './chemistry/acid-base/index.vue';
import GroupPoints from './group-points/index.vue';
import StickyNav from './components/StickyNav.vue';

const activeKey = ref('points');

// 菜单项数据
const menuItems = ref([
  // { key: 'ph', title: '中和反应与pH曲线模拟实验', desc: '中和反应与pH曲线模拟实验', icon: 'TrendCharts' },
  { key: 'points', title: '积分管理', desc: '积分管理', icon: 'Money' },
  { key: 'box', title: '推箱子', desc: '推箱子游戏', icon: 'Box' },
])

const handleMenuClick = (key: string) => {
  if (key === 'menu') {
    activeKey.value = menuItems.value[0].key;
  } else {
    activeKey.value = key;
  }
}

console.log('👋 This message is being logged by "App.vue", included via Vite');
</script>
