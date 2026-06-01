<template>
  <div style="width: 100%;" @click="handleClick(!appStore.isCollapse)">
    <el-button v-if="appStore.isCollapse" style="font-size: 20px; position: absolute; left: 16px;" link :icon="Expand"/>
    <el-button v-else style="font-size: 20px; position: absolute; right: 10px;" link :icon="Fold"/>
  </div>
</template>

<script setup lang="ts">
import { Expand, Fold } from '@element-plus/icons-vue';
import { useAppStore } from '../../../store/models/app';

const appStore = useAppStore();

const handleClick = (isCollapse: boolean) => {
  appStore.setIsCollapse(isCollapse);
};
</script>

<style scoped lang="scss"></style>
