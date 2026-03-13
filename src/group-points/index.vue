<template>
  <Layout />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import Layout from './layout/index.vue'
import { loadGroupPointsConfig } from './database/index.ts'

onMounted(async () => {
  const groupPointsConfig = await loadGroupPointsConfig();
  console.log('groupPointsConfig:', groupPointsConfig);
});
</script>

<style lang="scss" scoped></style>
