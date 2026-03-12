<!-- StickyNav.vue -->
<template>
  <div 
    class="sticky-nav"
    ref="navRef"
    :style="{ display: visible ? 'block' : 'none' }"
    @mouseleave="handleMouseLeave"
  >
    <!-- 导航栏主体 -->
    <div class="nav-main">
      <div class="nav-left">
        <el-pace>
          <el-button type="success" circle :icon="Lock" @click="$props.menuCallback('lock')"/>
          <el-button 
           type="success" 
           :icon="ArrowDown"
           @click="toggleDropdown"
         >
           所有
         </el-button>
        </el-pace>
      </div>
    </div>

    <!-- 下拉内容区域 -->
    <transition>
      <div 
        v-show="isDropdownVisible"
        class="dropdown-content"
        @mouseenter="handleDropdownEnter"
        @mouseleave="handleDropdownLeave"
      >
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            <el-card v-for="item in props.menuItems" :key="item.key" :body-style="{ padding: '0px' }" class="menu-card" @click="$props.menuCallback(item.key)">
              <div class="menu-item">
                <el-icon class="menu-icon"><component :is="item.icon" /></el-icon>
                <div class="menu-info">
                  <h4>{{ item.title }}</h4>
                  <p style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ item.desc }}</p>
                </div>
              </div>
            </el-card>
          </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ArrowDown, Lock } from '@element-plus/icons-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: true
  },
  menuItems: {
    type: Array<{ key: string, title: string, desc: string, icon: any }>,
    default: () => []
  },
  menuCallback: {
    type: Function,
    default: (key: string) => {}
  }
})

// 吸顶状态
const navRef = ref(null)

// 下拉菜单显示状态
const isDropdownVisible = ref(false)

// 处理鼠标离开导航栏
const handleMouseLeave = () => {
  // 延迟关闭下拉，防止鼠标快速移动时闪烁
  setTimeout(() => {
    if (!isHoveringDropdown.value) {
      isDropdownVisible.value = false
    }
  }, 100)
}

// 处理下拉区域鼠标进入
const handleDropdownEnter = () => {
  isHoveringDropdown.value = true
  isDropdownVisible.value = true
}

// 处理下拉区域鼠标离开
const handleDropdownLeave = () => {
  isHoveringDropdown.value = false
  isDropdownVisible.value = false
}

// 悬停状态跟踪
const isHoveringDropdown = ref(false)

// 切换下拉菜单（点击按钮时）
const toggleDropdown = () => {
  isDropdownVisible.value = !isDropdownVisible.value
}
</script>

<style scoped>
.sticky-nav {
  width: 100%;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1000;
}

.nav-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  margin: 0 auto;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dropdown-content {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin: 0 auto;
  z-index: 999;
}

.menu-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.menu-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px;
}

.menu-icon {
  font-size: 24px;
  color: #409eff;
  margin-right: 12px;
}

.menu-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #303133;
}

.menu-info p {
  margin: 0;
  font-size: 14px;
  color: #909399;
}
</style>