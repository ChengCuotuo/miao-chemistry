<template>
  <!-- <MainBack /> -->

  <!-- <Center> -->
  <BoxGame />
  <!-- </Center> -->
  <!-- <SystemConfig /> -->

  <!-- 中和反应与pH曲线模拟实验 -->
  <!-- <AcidBase /> -->
   <!-- <group-points /> -->
</template>

<script setup>
import Center from './components/Center.vue';
import MainBack from './components/main-back/MainBack.vue';
import SystemConfig from './components/system-config.vue';
import BoxGame from './games/box/index.vue';
import AcidBase from './chemistry/acid-base/index.vue';
import GroupPoints from './group-points/index.vue';


console.log('👋 This message is being logged by "App.vue", included via Vite');
</script>
