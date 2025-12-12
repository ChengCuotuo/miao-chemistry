<template>
  <div class="w-full h-full flex flex-col overflow-clip">
    <CosmicPortal ref="cosmicPortal" container-class="rounded-lg" />
    <div class="flex flex-row items-center justify-center gap-4">
      <button @click="activatePortal">Activate Portal</button>
      <button @click="shiftDimensions">Shift Dimensions</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useTemplateRef } from 'vue';
import CosmicPortal from './CosmicPortal.vue';

const cosmicPortal = useTemplateRef('cosmicPortal');

function activatePortal() {
  if (!cosmicPortal.value) return;
  cosmicPortal.value.activatePortal();
}

function shiftDimensions() {
  if (!cosmicPortal.value) return;
  cosmicPortal.value.shiftDimensions();
}
</script>
