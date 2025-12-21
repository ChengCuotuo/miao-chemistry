<template>
  <!-- <MainBack /> -->
  <div>
    <Center>
      <!-- <BoxMain /> -->
       <AcidBase />
    </Center>
    <SystemConfig />
  </div>
</template>

<script setup>
import Center from './components/Center.vue';
import MainBack from './components/main-back/MainBack.vue';
import SystemConfig from './components/system-config.vue';
import BoxMain from './games/box/BoxMain.vue';
import AcidBase from './chemistry/acid-base/index.vue'

console.log('👋 This message is being logged by "App.vue", included via Vite');
</script>
