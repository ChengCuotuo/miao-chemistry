import { createRouter, createWebHashHistory } from "vue-router";
import { routes } from "./routes";

const router = createRouter({
	strict: true,
	history: createWebHashHistory(),
	routes,
	scrollBehavior: () => ({ left: 0, top: 0 })
})

router.beforeEach((to, from, next) => {
	// TODO 检查是否过期，过期跳转到首页锁住路由
	next()
})

export default router
