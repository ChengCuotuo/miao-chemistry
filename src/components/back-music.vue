<template>
  <div class="back-music-container">
    <audio ref="backgMusicRef" loop hidden>
      <source src="../statics/musics/backmusic.mp3" type="audio/mpeg" />
      您的浏览器不支持音频播放。
    </audio>

    <el-space size="large">
      <span>背景音乐</span>
      <el-switch
        v-model="isPlaying"
        inline-prompt
        :active-icon="VideoPlay"
        :inactive-icon="VideoPause"
        @change="handleToggle"
      />
      <el-slider
        v-model="volume"
        :disabled="!isPlaying"
        :show-tooltip="false"
        @change="changeVolume"
        style="width: 300px"
      />
    </el-space>
  </div>
</template>
<script setup lang="ts">
import {  ref } from 'vue';
import { VideoPlay, VideoPause } from '@element-plus/icons-vue';

const backgMusicRef = ref();
// 存储音乐状态
const isPlaying = ref(true);
const volume = ref(30);

const handleToggle = (flag: boolean) => {
  if (flag) {
    backgMusicRef.value.pause();
  } else {
    backgMusicRef.value.play();
  }

  isPlaying.value = flag;
};

const changeVolume = (val: any) => {
  backgMusicRef.value.volume = val / 100;
};
</script>

<style lang="scss" scoped>
.back-music-container {
  color: #419eff;
}
</style>
