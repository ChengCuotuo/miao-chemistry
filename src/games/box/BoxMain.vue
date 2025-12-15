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
const entryCount = ref(0);

const widthCount = config.length * META_SIZE;
const heightCount = config[0].length * META_SIZE;

const getUserPosition = () => {
  for (let i = 0; i < config.length; i++) {
    for (let j = 0; j < config[i].length; j++) {
      if ([BOX_TYPE.USER, BOX_TYPE.USER_ENTRY].includes(config[i][j])) {
        userPosition.value = [i, j];
      }
      if (
        [BOX_TYPE.ENTRY, BOX_TYPE.BOX_ENTRY, BOX_TYPE.USER_ENTRY].includes(
          config[i][j],
        )
      ) {
        entryCount.value += 1;
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
    ([BOX_TYPE.BOX, BOX_TYPE.BOX_ENTRY].includes(firsetBoxType) &&
      [BOX_TYPE.WALL, BOX_TYPE.BOX, BOX_TYPE.BOX_ENTRY].includes(secondBoxType))
  ) {
    updateSuccess = false;
  }

  // 更新数据
  // TODO 需要处理 BOX_TYPE.ENTRY 相关的内容，比如：User 进入和退出 Entry，箱子进入和退出 Entry
  if (updateSuccess) {
    userPosition.value = firstBox;

    // 处理 secondBox
    if (firsetBoxType === BOX_TYPE.BOX) {
      if (secondBoxType === BOX_TYPE.ENTRY) {
        config[secondBox[0]][secondBox[1]] = BOX_TYPE.BOX_ENTRY;
      } else {
        config[secondBox[0]][secondBox[1]] = BOX_TYPE.BOX;
      }
    }

    if (firsetBoxType === BOX_TYPE.BOX_ENTRY) {
      config[firstBox[0]][firstBox[1]] = BOX_TYPE.USER_ENTRY;
    } else {
      config[firstBox[0]][firstBox[1]] = BOX_TYPE.USER;
    }

    config[row][col] = config[row][col] - BOX_TYPE.USER;
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
