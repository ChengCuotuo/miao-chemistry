<template>
  <div :style="{ height: `${widthCount}px`, width: `${heightCount}px` }" class="container">
    <div v-for="(row, rowIndex) in config" :key="`${rowIndex}`" style="display: flex">
      <Box v-for="(column, colIndex) in row" :key="`${colIndex}_${column}`" :type="column" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import Box from './Box.vue';
import { BOX_TYPE, META_SIZE } from './const';
import { gameInfo } from './config';

const props = defineProps({
  onSuccess: {
    type: Function,
    default: () => { },
  },
  onMove: {
    type: Function,
    default: (moveCount: number) => { },
  },
  updateWidth: {
    type: Function,
    default: (width: number) => { },
  },
});

// 0 空白，1 城墙，2 箱子，3 入口，4 小人
// 叠加状态：5 箱子+入口，7 小人+入口
const config = reactive([[0]]);

const moveFlag = ref(true);
const userPosition = ref([0, 0]);
const entryCount = ref(0);
// 统计箱子在出口的个数
const entrySuccessCount = ref(0);

// 统计游戏宽度和高度
const widthCount = ref(0);
const heightCount = ref(0);

// 统计移动次数
const moveCount = ref(0);

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
  if (!moveFlag.value) return;

  const code = event?.code || '';

  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) return;

  moveCount.value += 1;
  props.onMove(moveCount.value);

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
  const userBoxType = config[row][col];

  if (
    firsetBoxType === BOX_TYPE.WALL ||
    ([BOX_TYPE.BOX, BOX_TYPE.BOX_ENTRY].includes(firsetBoxType) &&
      [BOX_TYPE.WALL, BOX_TYPE.BOX, BOX_TYPE.BOX_ENTRY].includes(secondBoxType))
  ) {
    updateSuccess = false;
  }

  // 更新数据
  if (updateSuccess) {
    userPosition.value = firstBox;

    // 箱子移动
    // 当 firstBox 是 Box 需要移动到 secondBox 位置
    if ([BOX_TYPE.BOX, BOX_TYPE.BOX_ENTRY].includes(firsetBoxType)) {
      if (secondBoxType === BOX_TYPE.ENTRY) {
        // 箱子进入 entry
        config[secondBox[0]][secondBox[1]] = BOX_TYPE.BOX_ENTRY;
        entrySuccessCount.value += 1;
      } else {
        config[secondBox[0]][secondBox[1]] = BOX_TYPE.BOX;
      }
    }

    if ([BOX_TYPE.USER, BOX_TYPE.USER_ENTRY].includes(userBoxType)) {
      if (firsetBoxType === BOX_TYPE.BOX_ENTRY) {
        // 箱子离开 entry
        config[firstBox[0]][firstBox[1]] = BOX_TYPE.USER_ENTRY;
        entrySuccessCount.value -= 1;
      } else if (firsetBoxType === BOX_TYPE.ENTRY) {
        config[firstBox[0]][firstBox[1]] = BOX_TYPE.USER_ENTRY;
      } else {
        config[firstBox[0]][firstBox[1]] = BOX_TYPE.USER;
      }
    }

    // 人移动
    config[row][col] = config[row][col] - BOX_TYPE.USER;

    if (entryCount.value === entrySuccessCount.value) {
      moveFlag.value = false;
      props.onSuccess();
    }
  }
};

const initEntrySuccessCount = (newConfig=[[]]) => {
  let count = 0;
  for (let i = 0; i < newConfig.length; i++) {
    for (let j = 0; j < newConfig[i].length; j++) {
      if (newConfig[i][j] === BOX_TYPE.BOX_ENTRY) {
        count += 1;
      }
    }
  }
  entrySuccessCount.value = count;
}

const startGame = (index: number) => {
  moveCount.value = 0;
  props.onMove(moveCount.value);
  // 重置游戏数据
  moveFlag.value = true;
  userPosition.value = [0, 0];
  entryCount.value = 0;
  entrySuccessCount.value = 0;
  
  if (index < gameInfo.length) {
    const newConfig = JSON.parse(JSON.stringify(gameInfo[index]));
    initEntrySuccessCount(newConfig);
    widthCount.value = newConfig.length * META_SIZE;
    heightCount.value = newConfig[0].length * META_SIZE;

    config.splice(0, config.length, ...newConfig);
    props.updateWidth(widthCount.value);
    setTimeout(() => {
      getUserPosition();
    }, 0);
  }
}

defineExpose({
  startGame,
});

onMounted(() => {
  getUserPosition();
  props.updateWidth(widthCount);
  window.addEventListener('keydown', handleMove);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleMove);
});
</script>

<style scoped>
.container {
  user-select: none;
}
</style>
