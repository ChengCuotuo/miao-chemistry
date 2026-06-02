import { createRouter, createWebHashHistory } from "vue-router";
import { routes } from "./routes";
import { useAppStore } from "../store/models/app";
import { dayjs } from "element-plus";


const router = createRouter({
	strict: true,
	history: createWebHashHistory(),
	routes,
	scrollBehavior: () => ({ left: 0, top: 0 })
})

router.beforeEach((to, from, next) => {
	const appStore = useAppStore()
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
