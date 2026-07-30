import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import vueJsx from '@vitejs/plugin-vue-jsx';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    tailwindcss(),
    vue(),
    vueJsx(),
    // Element Plus 按需导入：API（ElMessage 等）自动导入
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    // Element Plus 按需导入：组件（el-button 等）自动注册
    Components({
      resolvers: [ElementPlusResolver({ importStyle: 'css' })],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'import.meta.env.BUILD_TYPE': JSON.stringify(process.env.BUILD_TYPE),
    'import.meta.env.DURATION': JSON.stringify(process.env.DURATION),
  },
  assetsInclude: ['**/*.xlsx'],
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        // 拆分大依赖到独立 chunk，避免单个文件过大
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('echarts')) return 'echarts';
            if (id.includes('element-plus') || id.includes('@element-plus')) return 'element-plus';
            if (id.includes('xlsx')) return 'xlsx';
            if (id.includes('vue3-image-editor')) return 'image-editor';
            return 'vendor';
          }
        },
      },
    },
  },
  esbuild: {
    // 生产构建移除 console.log / debugger
    pure: ['console.log', 'console.info', 'console.debug', 'debugger'],
  },
});
