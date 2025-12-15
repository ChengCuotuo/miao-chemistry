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
import { META_SIZE } from './const';
const props = defineProps({
  type: Number,
});

let background = ref('#4a311e');
const innder = ref('');
onMounted(() => {
  switch (props.type) {
    case 0:
      background.value = '#fff';
      break;
    case 1:
      background.value = '#798b9c';
      innder.value = '墙';
      break;
    case 2:
      background.value = '#4a311e';
      innder.value = '箱';
      break;
    case 3:
      background.value = '#8c8e00';
      innder.value = '口';
      break;
    case 4:
      background.value = '#ffeea3';
      innder.value = '人';
      break;
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
