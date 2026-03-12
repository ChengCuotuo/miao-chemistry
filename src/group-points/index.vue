<template>
  <div>
    <p>{{ content }}</p>
    <el-button @click="handleOpenFile">打开文件</el-button>
    <el-button @click="handleReadFile">读取文件</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const curWindow = window as any;
const content = ref('');
// 假设这是在一个按钮点击事件的处理函数中
async function handleOpenFile() {
  // 1. 让用户选择文件
  const filePath = await curWindow.electronAPI.openFileDialog();
  if (filePath) {
    // 2. 读取文件内容
    try {
      const fileContent = await curWindow.electronAPI.readFile(filePath);
      console.log('文件内容:', fileContent);
      content.value = fileContent;
    } catch (error) {
      console.error('读取文件出错:', error);
    }
  }
}

async function handleReadFile() {
	try {
		const fileContent = await curWindow.electronAPI.readGroupPointsConfig();
		console.log('文件内容:', fileContent);
		content.value = fileContent;
	} catch (error) {
		console.error('读取文件出错:', error);
	}
}
</script>

<style lang="scss" scoped></style>
