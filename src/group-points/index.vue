<template>
  <Layout />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import Layout from './layout/index.vue'
import { loadGroupPointsConfig } from './database';
import { useAppStore } from './store/models/app';

const appStore = useAppStore();

onMounted(async () => {
  const data = await loadGroupPointsConfig()
		if (data) {
			appStore.setDatabase(data);
		}
});

</script>

<style lang="scss" scoped></style>
