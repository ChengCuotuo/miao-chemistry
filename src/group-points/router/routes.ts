export const routes = [
	{
		path: '/',
		component: () => import('../view/HomeView.vue'),
		name: 'home',
		meta: { hide: false, title: '首页', icon: 'HomeFilled' },
	},
	{
		path: "/base",
		name: 'base',
		meta: { hide: false, title: '基础信息', icon: 'Tools' },
		children: [
			{
				path: "student",
				component: () => import('../view/student/index.vue'),
				name: 'student',
				meta: { hide: false, title: '学生管理', icon: 'User' },
			},
			{
				path: "group",
				component: () => import('../view/group/index.vue'),
				name: 'group',
				meta: { hide: false, title: '分组管理', icon: 'Files' },
			},
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
				meta: { hide: false, title: '规则设置', icon: 'Setting' },
			}
		]
	}
];
