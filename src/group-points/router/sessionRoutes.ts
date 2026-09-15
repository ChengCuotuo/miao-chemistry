// 会话级路由白名单（与具体路由表解耦，便于独立测试）
// 班委会话为只读身份：只能停留在当前班级页；锁屏页是退出登录的去处
export const MONITOR_ALLOWED_ROUTES = ['grade', 'lock'];

// 当前会话是否允许访问目标路由（管理员不受限）
export const isRouteAllowedForSession = (role: string, toName?: string | null): boolean =>
	role !== 'monitor' || MONITOR_ALLOWED_ROUTES.includes(String(toName || ''));
