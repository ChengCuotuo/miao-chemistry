<template>
  <!-- <Layout /> -->
  <el-button type="primary" @click="writeGrade">写入年级配置</el-button>
</template>

<script setup lang="ts">
import Layout from './layout/index.vue'
import { loadGroupPointsConfig, writeGroupPointsGrade } from './database/index.ts'
import { onMounted } from 'vue';
import { Grade } from './database/class/Grade.ts';

const writeGrade = async () => {
  const grade = new Grade({
    id: 0,
    name: '一年级',
  })
  await writeGroupPointsGrade(grade.toString());
}

onMounted(async () => {
  const groupPointsConfig = await loadGroupPointsConfig();
  console.log('groupPointsConfig:', groupPointsConfig);
});
</script>

<style lang="scss" scoped></style>
