<template>
  <div class="header">
    <el-button
      style="font-size: 20px"
      link
      :icon="appStore.isCollapse ? Expand : Fold"
      @click="handleClick(!appStore.isCollapse)"
    />
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

<style scoped lang="scss">
.header {
  padding: 0 10px;
	background-color: #fff;
	display: flex;
	align-items: center;
}
</style>
