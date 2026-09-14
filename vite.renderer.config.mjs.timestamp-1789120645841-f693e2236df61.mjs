// vite.renderer.config.mjs
import { defineConfig } from "file:///Users/chunlei/Documents/front/miao-chemistry/node_modules/vite/dist/node/index.js";
import vue from "file:///Users/chunlei/Documents/front/miao-chemistry/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import tailwindcss from "file:///Users/chunlei/Documents/front/miao-chemistry/node_modules/@tailwindcss/vite/dist/index.mjs";
import vueJsx from "file:///Users/chunlei/Documents/front/miao-chemistry/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "/Users/chunlei/Documents/front/miao-chemistry";
var vite_renderer_config_default = defineConfig({
  plugins: [
    tailwindcss(),
    vue(),
    vueJsx()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  define: {
    "import.meta.env.BUILD_TYPE": JSON.stringify(process.env.BUILD_TYPE),
    "import.meta.env.DURATION": JSON.stringify(process.env.DURATION)
  },
  assetsInclude: ["**/*.xlsx"],
  build: {
    chunkSizeWarningLimit: 2e3,
    rollupOptions: {
      input: {
        main: path.resolve(__vite_injected_original_dirname, "index.html")
      },
      output: {
        // 拆分大依赖到独立 chunk，避免单个文件过大
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("echarts")) return "echarts";
            if (id.includes("element-plus") || id.includes("@element-plus")) return "element-plus";
            if (id.includes("xlsx")) return "xlsx";
            if (id.includes("vue3-image-editor")) return "image-editor";
            return "vendor";
          }
        }
      }
    }
  },
  esbuild: {
    // 生产构建移除 console.log / debugger
    pure: ["console.log", "console.info", "console.debug", "debugger"]
  }
});
export {
  vite_renderer_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5yZW5kZXJlci5jb25maWcubWpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2NodW5sZWkvRG9jdW1lbnRzL2Zyb250L21pYW8tY2hlbWlzdHJ5XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvY2h1bmxlaS9Eb2N1bWVudHMvZnJvbnQvbWlhby1jaGVtaXN0cnkvdml0ZS5yZW5kZXJlci5jb25maWcubWpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9jaHVubGVpL0RvY3VtZW50cy9mcm9udC9taWFvLWNoZW1pc3RyeS92aXRlLnJlbmRlcmVyLmNvbmZpZy5tanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJztcbmltcG9ydCB0YWlsd2luZGNzcyBmcm9tICdAdGFpbHdpbmRjc3Mvdml0ZSc7XG5pbXBvcnQgdnVlSnN4IGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZS1qc3gnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWdcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICB0YWlsd2luZGNzcygpLFxuICAgIHZ1ZSgpLFxuICAgIHZ1ZUpzeCgpLFxuICBdLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgfSxcbiAgfSxcbiAgZGVmaW5lOiB7XG4gICAgJ2ltcG9ydC5tZXRhLmVudi5CVUlMRF9UWVBFJzogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYuQlVJTERfVFlQRSksXG4gICAgJ2ltcG9ydC5tZXRhLmVudi5EVVJBVElPTic6IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52LkRVUkFUSU9OKSxcbiAgfSxcbiAgYXNzZXRzSW5jbHVkZTogWycqKi8qLnhsc3gnXSxcbiAgYnVpbGQ6IHtcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDIwMDAsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgaW5wdXQ6IHtcbiAgICAgICAgbWFpbjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ2luZGV4Lmh0bWwnKSxcbiAgICAgIH0sXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgLy8gXHU2MkM2XHU1MjA2XHU1OTI3XHU0RjlEXHU4RDU2XHU1MjMwXHU3MkVDXHU3QUNCIGNodW5rXHVGRjBDXHU5MDdGXHU1MTREXHU1MzU1XHU0RTJBXHU2NTg3XHU0RUY2XHU4RkM3XHU1OTI3XG4gICAgICAgIG1hbnVhbENodW5rcyhpZCkge1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJykpIHtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnZWNoYXJ0cycpKSByZXR1cm4gJ2VjaGFydHMnO1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdlbGVtZW50LXBsdXMnKSB8fCBpZC5pbmNsdWRlcygnQGVsZW1lbnQtcGx1cycpKSByZXR1cm4gJ2VsZW1lbnQtcGx1cyc7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3hsc3gnKSkgcmV0dXJuICd4bHN4JztcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygndnVlMy1pbWFnZS1lZGl0b3InKSkgcmV0dXJuICdpbWFnZS1lZGl0b3InO1xuICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3InO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgZXNidWlsZDoge1xuICAgIC8vIFx1NzUxRlx1NEVBN1x1Njc4NFx1NUVGQVx1NzlGQlx1OTY2NCBjb25zb2xlLmxvZyAvIGRlYnVnZ2VyXG4gICAgcHVyZTogWydjb25zb2xlLmxvZycsICdjb25zb2xlLmluZm8nLCAnY29uc29sZS5kZWJ1ZycsICdkZWJ1Z2dlciddLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTZVLFNBQVMsb0JBQW9CO0FBQzFXLE9BQU8sU0FBUztBQUNoQixPQUFPLGlCQUFpQjtBQUN4QixPQUFPLFlBQVk7QUFDbkIsT0FBTyxVQUFVO0FBSmpCLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sK0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLFlBQVk7QUFBQSxJQUNaLElBQUk7QUFBQSxJQUNKLE9BQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTiw4QkFBOEIsS0FBSyxVQUFVLFFBQVEsSUFBSSxVQUFVO0FBQUEsSUFDbkUsNEJBQTRCLEtBQUssVUFBVSxRQUFRLElBQUksUUFBUTtBQUFBLEVBQ2pFO0FBQUEsRUFDQSxlQUFlLENBQUMsV0FBVztBQUFBLEVBQzNCLE9BQU87QUFBQSxJQUNMLHVCQUF1QjtBQUFBLElBQ3ZCLGVBQWU7QUFBQSxNQUNiLE9BQU87QUFBQSxRQUNMLE1BQU0sS0FBSyxRQUFRLGtDQUFXLFlBQVk7QUFBQSxNQUM1QztBQUFBLE1BQ0EsUUFBUTtBQUFBO0FBQUEsUUFFTixhQUFhLElBQUk7QUFDZixjQUFJLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFDL0IsZ0JBQUksR0FBRyxTQUFTLFNBQVMsRUFBRyxRQUFPO0FBQ25DLGdCQUFJLEdBQUcsU0FBUyxjQUFjLEtBQUssR0FBRyxTQUFTLGVBQWUsRUFBRyxRQUFPO0FBQ3hFLGdCQUFJLEdBQUcsU0FBUyxNQUFNLEVBQUcsUUFBTztBQUNoQyxnQkFBSSxHQUFHLFNBQVMsbUJBQW1CLEVBQUcsUUFBTztBQUM3QyxtQkFBTztBQUFBLFVBQ1Q7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUE7QUFBQSxJQUVQLE1BQU0sQ0FBQyxlQUFlLGdCQUFnQixpQkFBaUIsVUFBVTtBQUFBLEVBQ25FO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
