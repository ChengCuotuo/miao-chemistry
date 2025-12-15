<template>
  <div
    class="wall"
    :style="{ width: `${META_SIZE}px`, height: `${META_SIZE}px` }"
  ></div>
</template>

<script setup>
import { META_SIZE } from './const';
</script>

<style lang="scss" scoped>
.wall {
  background: #fff;
}
</style>
