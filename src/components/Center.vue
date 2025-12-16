<template>
  <div class="center"><slot></slot></div>
</template>

<script setup></script>

<style lang="scss" scoped>
.center {
  position: relative;
  height: 100%;
  width: 100%;
  background-color: #fff;

  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
