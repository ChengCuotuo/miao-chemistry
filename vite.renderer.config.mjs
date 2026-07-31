import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import vueJsx from '@vitejs/plugin-vue-jsx';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    tailwindcss(),
    vue(),
    vueJsx(),
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
