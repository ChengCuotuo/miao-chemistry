<template>
  <el-menu
    default-active="home"
    class="el-menu"
    background-color="#565c63"
    active-text-color="#ffd04b"
    text-color="#fff"
    :collapse="appStore.isCollapse"
  >
    <div v-if="activeGrade" style="color: #fff; text-align: center; padding: 10px 0px;">
      <h2>{{ activeGrade.name }}</h2>
    </div>
    <template v-for="route in routes" :key="route.name">
      <template
        v-if="Array.isArray(route.children) && route.children.length > 0"
      >
        <el-sub-menu :index="route.name">
          <template #title>
            <el-icon :size="20" v-if="route.meta.icon">
              <component :is="route.meta.icon" />
            </el-icon>
            <span>{{ route.meta.title }}</span>
          </template>
          <el-menu-item
            v-for="subRoute in route.children"
            :index="subRoute.name"
            @click="handleClick(subRoute)"
          >
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
import { useRouter } from 'vue-router';
import { routes } from '../../../router/routes';
const router = useRouter();
import { useAppStore } from '../../../store/models/app';
import { computed } from 'vue';

const appStore = useAppStore();

const activeGrade = computed(() => appStore.activeGrade);

const handleClick = (route: any) => {
  router.push({ name: route.name });
};
</script>

<style scoped></style>
