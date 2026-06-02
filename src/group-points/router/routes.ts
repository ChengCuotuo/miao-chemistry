export const routes = [
	{
		path: '/',
		component: () => import('../view/HomeView.vue'),
		name: 'home',
		meta: { hide: false, title: '所有班级', icon: 'HomeFilled' },
	},
	{
		path: "/base",
		name: 'base',
		meta: { hide: false, title: '全局设置', icon: 'Tools' },
		children: [
			{
				path: "prize",
				component: () => import('../view/prize/index.vue'),
				name: 'prize',
				meta: { hide: false, title: '奖品设置', icon: 'Trophy' },
			},
			{
				path: "rule",
				component: () => import('../view/rule/index.vue'),
				name: 'rule',
				meta: { hide: false, title: '规则设置', icon: 'Connection' },
			},
			{
				path: "basic",
				component: () => import('../view/basic/index.vue'),
				name: 'basic',
				meta: { hide: false, title: '基础设置', icon: 'Setting' },
			}
		]
	},
	{
		path: '/grade',
		component: () => import('../view/grade/index.vue'),
		name: 'grade',
		meta: { hide: true },
	},
	{
		path: '/lock',
		component: () => import('../view/lock/index.vue'),
		name: 'lock',
		meta: { hide: true },
	},
];
