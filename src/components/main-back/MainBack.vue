<template>
  <div class="w-full h-full flex flex-col overflow-clip">
    <div style="position: absolute; left: 24px; top: 12px; z-index: 1;">
      <el-button type="success" circle :icon="Menu" @click="$props.onMenu('menu')" /> 
    </div>
    <CosmicPortal ref="cosmicPortal" />
    <div style="position: absolute; bottom: 10px; width: 100%; display: flex; justify-content: center">
      <el-button type="text" @click="activatePortal">开启传送门</el-button>
      <el-button type="text" @click="shiftDimensions">切换维度</el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useTemplateRef } from 'vue';
import CosmicPortal from './CosmicPortal.vue';
import { Menu } from '@element-plus/icons-vue'

const cosmicPortal = useTemplateRef('cosmicPortal');

const props = defineProps({
  onMenu: {
    type: Function,
    default: (type: string) => {}
  }
})

function activatePortal() {
  if (!cosmicPortal.value) return;
  cosmicPortal.value.activatePortal();
}

function shiftDimensions() {
  if (!cosmicPortal.value) return;
  cosmicPortal.value.shiftDimensions();
}
</script>
