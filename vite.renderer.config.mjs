import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import vueJsx from '@vitejs/plugin-vue-jsx';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [tailwindcss(), vue(), vueJsx()],
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
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
});
