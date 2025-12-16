<template>
  <div
    class="box"
    :style="{ width: `${META_SIZE}px`, height: `${META_SIZE}px`, background }"
  >
    {{ innder }}
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { BOX_TYPE, META_SIZE } from './const';
const props = defineProps({
  type: Number,
});

let background = ref('#4a311e');
const innder = ref('');
onMounted(() => {
  switch (props.type) {
    case BOX_TYPE.EMPTY:
      background.value = '#fff';
      break;
    case BOX_TYPE.WALL:
      background.value = '#798b9c';
      innder.value = '墙';
      break;
    case BOX_TYPE.BOX:
      background.value = '#4a311e';
      innder.value = '箱';
      break;
    case BOX_TYPE.ENTRY:
      background.value = '#8c8e00';
      innder.value = '口';
      break;
    case BOX_TYPE.USER:
      background.value = '#ffeea3';
      innder.value = '人';
      break;
    case BOX_TYPE.BOX_ENTRY:
      background.value = '#4a311e';
      innder.value = '箱口';
      break;
    case BOX_TYPE.USER_ENTRY:
      background.value = '#4a311e';
      innder.value = '人口';
    default:
      break;
  }
});
</script>

<style lang="scss" scoped>
.box {
  line-height: 60px;
  text-align: center;
}
</style>
