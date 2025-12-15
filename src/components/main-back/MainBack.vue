<template>
  <div class="w-full h-full flex flex-col overflow-clip">
    <CosmicPortal ref="cosmicPortal" container-class="rounded-lg" />
    <div class="flex flex-row items-center justify-center gap-4">
      <RippleButton @click="activatePortal">Activate Portal</RippleButton>
      <RippleButton @click="shiftDimensions">Shift Dimensions</RippleButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useTemplateRef } from 'vue';
import CosmicPortal from './CosmicPortal.vue';
import RippleButton from './RippleButton.vue';

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
