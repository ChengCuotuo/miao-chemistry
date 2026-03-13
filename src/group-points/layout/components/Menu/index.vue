<template>
  <el-menu default-active="home" class="el-menu-vertical-demo" :collapse="isCollapse">
    <template v-for="route in routes" :key="route.name">
      <template v-if="Array.isArray(route.children) && route.children.length > 0">
        <el-sub-menu :index="route.name">
          <template #title>
            <el-icon :size="20" v-if="route.meta.icon">
              <component :is="route.meta.icon" />
            </el-icon>  
            <span>{{ route.meta.title }}</span>
          </template>
          <el-menu-item v-for="subRoute in route.children" :index="subRoute.name" @click="handleClick(subRoute)">
             <el-icon :size="20" v-if="subRoute.meta.icon">
              <component :is="subRoute.meta.icon" />
            </el-icon>
            <template #title> {{ subRoute.meta.title }}</template>
          </el-menu-item>
        </el-sub-menu>
      </template>
      <template v-else>
        <el-menu-item :index="route.name" @click="handleClick(route)">
          <el-icon :size="20" v-if="route.meta.icon">
            <component :is="route.meta.icon" />
          </el-icon>
          <template #title> {{ route.meta.title }}</template>
        </el-menu-item>
      </template>
    </template>
  </el-menu>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { routes } from '../../../router/routes'
const router = useRouter();

const isCollapse = ref(false);

const handleClick = (route: any) => {
  router.push({ name: route.name });
}
</script>

<style scoped></style>
