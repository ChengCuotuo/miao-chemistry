<template>
  <div
    :style="{ height: `${widthCount}px`, width: `${heightCount}px` }"
    class="container"
  >
    <div
      v-for="(row, rowIndex) in config"
      :key="rowIndex"
      style="display: flex"
    >
      <div v-for="(column, colIndex) in row" :key="colIndex">
        <Empty v-if="column === 0" />
        <Wall v-else-if="column === 1" />
        <Box v-else-if="column === 2" />
        <Enter v-else-if="column === 3" />
        <User v-else-if="column === 4" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Box from './Box.vue';
import { META_SIZE } from './const';
import Empty from './Empty.vue';
import Enter from './Enter.vue';
import User from './User.vue';
import Wall from './Wall.vue';

// 0 空白，1 城墙，2 箱子，3 入口，4 小人
// 叠加状态：5 箱子+入口，7 小人+入口
const config = [
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 3, 1, 0, 0, 0],
  [0, 0, 1, 0, 1, 1, 1, 1],
  [1, 1, 1, 2, 0, 2, 3, 1],
  [1, 3, 0, 2, 4, 1, 1, 1],
  [1, 1, 1, 1, 2, 1, 0, 0],
  [0, 0, 0, 1, 3, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 0, 0],
];
const widthCount = config.length * META_SIZE;
const heightCount = config[0].length * META_SIZE;
</script>

<style scoped>
.container {
  background-color: #fff;
  border: 1px solid #eee;
}
</style>
