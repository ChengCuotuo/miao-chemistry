<template>
  <el-button
    plain
    @click="dialogVisible = true"
    :icon="Setting"
    type="text"
  ></el-button>
  <el-dialog v-model="dialogVisible" title="" width="500">
    <back-music />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Setting } from '@element-plus/icons-vue';
import BackMusic from './back-music.vue';

const dialogVisible = ref(false);
</script>

<style lang="scss" scoped></style>
