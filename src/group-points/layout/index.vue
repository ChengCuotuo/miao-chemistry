<template>
	<div class="main-container">
		<div class="left">
			<Menu style="height: 100%;"></Menu>
		</div>
		<div class="right">
			<div class="content">
				<router-view></router-view>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import Menu from './components/Menu/index.vue'
</script>

<style scoped lang="scss">
.main-container {
	position: relative;
	width: 100%;
	height: 100%;
	display: flex;

	.left {
		height: 100%;
	}

	.right {
		height: 100%;
		flex: 1;

		.header {
			height: 40px;
		}

		.content {
			height: 100%;
			background-color: #f6f7fa;
			padding: 10px;
		}
	}
}
</style>