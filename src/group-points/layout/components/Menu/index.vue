<template>
  <el-menu default-active="home" class="el-menu" background-color="#565c63" active-text-color="#ffd04b"
    text-color="#fff" :collapse="appStore.isCollapse">
    <template v-for="route in routes" :key="route.name">
      <template v-if="!route.meta.hide"> <!-- 隐藏路由 -->
        <template v-if="Array.isArray(route.children) && route.children.length > 0">
          <el-sub-menu :index="route.name">
            <template #title>
              <el-icon :size="20" v-if="route.meta.icon">
                <component :is="route.meta.icon" />
              </el-icon>
              <span>{{ route.meta.title }}</span>
            </template>
            <template v-for="subRoute in route.children" :key="subRoute.name"> <!-- 隐藏子路由 -->
              <el-menu-item v-if="!subRoute.meta.hide" :index="subRoute.name" @click="handleClick(subRoute)">
                <el-icon :size="20" v-if="subRoute.meta.icon">
                  <component :is="subRoute.meta.icon" />
                </el-icon>
                <template #title> {{ subRoute.meta.title }}</template>
              </el-menu-item>
            </template>
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
    </template>
    <div style="height: 40px; width: 100%; position: absolute; bottom: 0; ">
      <Collapse />
    </div>
  </el-menu>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { routes } from '../../../router/routes';
import { useAppStore } from '../../../store/models/app';
import Collapse from './Collapse.vue';

const router = useRouter();
const appStore = useAppStore();

const handleClick = (route: any) => {
  router.push({ name: route.name });
};
</script>

<style scoped></style>
