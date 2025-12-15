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
      <template
        v-for="(column, colIndex) in row"
        :key="`${colIndex}_${column}`"
      >
        <Box :type="column" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, toRaw } from 'vue';
import Box from './Box.vue';
import { BOX_TYPE, META_SIZE } from './const';

// 0 空白，1 城墙，2 箱子，3 入口，4 小人
// 叠加状态：5 箱子+入口，7 小人+入口
const config = reactive([
  [0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 3, 1, 0, 0, 0],
  [0, 0, 1, 0, 1, 1, 1, 1],
  [1, 1, 1, 2, 0, 2, 3, 1],
  [1, 3, 0, 2, 4, 1, 1, 1],
  [1, 1, 1, 1, 2, 1, 0, 0],
  [0, 0, 0, 1, 3, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 0, 0],
]);
const userPosition = ref([0, 0]);

const widthCount = config.length * META_SIZE;
const heightCount = config[0].length * META_SIZE;

const getUserPosition = () => {
  for (let i = 0; i < config.length; i++) {
    for (let j = 0; j < config[i].length; j++) {
      if ([4, 7].includes(config[i][j])) {
        userPosition.value = [i, j];
      }
    }
  }
};

const handleMove = (event: KeyboardEvent) => {
  const code = event?.code || '';
  const [row, col] = userPosition.value;

  let updateSuccess = true;
  let firstBox = [-1, -1];
  let secondBox = [-1, -1];

  if (code === 'ArrowUp') {
    firstBox = [row - 1, col];
    secondBox = [row - 2, col];
  } else if (code === 'ArrowDown') {
    firstBox = [row + 1, col];
    secondBox = [row + 2, col];
  } else if (code === 'ArrowLeft') {
    firstBox = [row, col - 1];
    secondBox = [row, col - 2];
  } else if (code === 'ArrowRight') {
    firstBox = [row, col + 1];
    secondBox = [row, col + 2];
  }

  // 第一个碰到的是墙壁 - false
  // 第一是盒子，但第二个是墙壁 - false
  const firsetBoxType = config[firstBox[0]][firstBox[1]];
  const secondBoxType = config[secondBox[0]][secondBox[1]];
  if (
    firsetBoxType === BOX_TYPE.WALL ||
    (firsetBoxType === BOX_TYPE.BOX && secondBoxType === BOX_TYPE.WALL)
  ) {
    updateSuccess = false;
  }

  if (updateSuccess) {
    userPosition.value = firstBox;
    const [userRow, userCol] = firstBox;
    if (config[firstBox[0]][firstBox[1]] === BOX_TYPE.BOX) {
      config[secondBox[0]][secondBox[1]] = config[firstBox[0]][firstBox[1]];
    }
    config[userRow][userCol] = BOX_TYPE.USER;
    const curCount = config[row][col] - BOX_TYPE.USER;
    config[row][col] = curCount;
  }
};

onMounted(() => {
  getUserPosition();
  window.addEventListener('keydown', handleMove);
});
onUnmounted(() => {
  window.removeEventListener('keydown', handleMove);
});
</script>

<style scoped>
.container {
  border: 1px solid #eee;
}
</style>
