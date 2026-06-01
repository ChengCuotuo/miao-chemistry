<template>
   <el-tag v-if="buildType === 'trial'" type="danger">试用版:{{ duration >= 0 ? `剩余${duration}天` : '已过期' }}</el-tag>
   <el-tag v-else-if="buildType === 'official'" type="success">正式版</el-tag>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useAppStore } from '../group-points/store/models/app'
import dayjs from 'dayjs'

const appStore = useAppStore()

const buildType = computed(() => appStore.database.basicConfig?.buildType || '')
const duration = computed(() => {
  const storeDuration = appStore.database.basicConfig?.duration || 0
  const endTime = appStore.database.basicConfig.startTime + storeDuration
  return Math.floor((endTime - dayjs().unix()) / (24 * 60 * 60))
})

</script>

<style scoped>
</style>