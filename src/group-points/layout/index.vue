<template>
	<div class="main-container">
		<div class="left">
			<Menu style="height: 100%;"></Menu>
		</div>
		<div class="right">
			<div class="header">
				<Header></Header>
			</div>
			<div class="content">
				<router-view></router-view>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import Menu from './components/Menu/index.vue'
import Header from './components/Header/index.vue'
</script>

<style scoped lang="scss">
.main-container {
	position: relative;
	width: 100%;
	height: 100%;
	display: flex;

	.left {
		width: 200px;
		height: 100%;
	}

	.right {
		height: 100%;
		flex: 1;

		.header {
			height: 40px;
		}

		.content {
			height: calc(100% - 40px);
		}
	}
}
</style>