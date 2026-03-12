<template>
  <img
    v-if="props.type === BOX_TYPE.EMPTY"
    src="./static/empty.png"
    :style="{
      width: `${META_SIZE}px`,
      height: `${META_SIZE}px`,
    }"
  />
  <img
    v-else-if="props.type === BOX_TYPE.WALL"
    src="./static/wall.png"
    :style="{
      width: `${META_SIZE}px`,
      height: `${META_SIZE}px`,
    }"
  />
  <img
    v-else-if="props.type === BOX_TYPE.BOX"
    src="./static/box.png"
    :style="{
      width: `${META_SIZE}px`,
      height: `${META_SIZE}px`,
    }"
  />
  <img
    v-else-if="props.type === BOX_TYPE.USER"
    src="./static/user.png"
    :style="{
      width: `${META_SIZE}px`,
      height: `${META_SIZE}px`,
    }"
  />
  <img
    v-else-if="props.type === BOX_TYPE.ENTRY"
    src="./static/entry.png"
    :style="{
      width: `${META_SIZE}px`,
      height: `${META_SIZE}px`,
    }"
  />
  <img
    v-else-if="props.type === BOX_TYPE.BOX_ENTRY"
    src="./static/box_entry.png"
    :style="{
      width: `${META_SIZE}px`,
      height: `${META_SIZE}px`,
    }"
  />

  <img
    v-else-if="props.type === BOX_TYPE.USER_ENTRY"
    src="./static/user.png"
    :style="{
      width: `${META_SIZE}px`,
      height: `${META_SIZE}px`,
    }"
  />
</template>

<script setup>
import { BOX_TYPE, META_SIZE } from './const';
const props = defineProps({
  type: Number,
});
</script>
