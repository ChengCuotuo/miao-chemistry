import { createRouter, createWebHashHistory } from "vue-router";
import { routes } from "./routes";
import { useAppStore } from "../store/models/app";
import { isRouteAllowedForSession } from "./sessionRoutes";
import { dayjs } from "element-plus";


const router = createRouter({
	strict: true,
	history: createWebHashHistory(),
	routes,
	scrollBehavior: () => ({ left: 0, top: 0 })
})

router.beforeEach((to, from, next) => {
	const appStore = useAppStore()

	// 班委会话（只读身份）：只允许停留在当前班级页，禁止进入班级列表与全局设置
	if (!isRouteAllowedForSession(appStore.currentRole, to.name as string)) {
		next({ name: 'grade' })
		return
	}

	const { buildType, duration, startTime } = appStore.database.basicConfig
	if (to.name !== 'lock' && buildType === 'trial') {
		const endTime = startTime + duration
		if (dayjs().unix() > endTime) {
			next({ name: 'lock' })
		}
	}

	next()
})

export default router
