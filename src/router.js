import { createRouter, createWebHistory } from 'vue-router'
import Home from './pages/Home.vue'
import ToolPage from './pages/ToolPage.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {
      title: '首页 - Web Office Toolbox'
    }
  },
  {
    path: '/tool/:code',
    name: 'tool',
    component: ToolPage,
    meta: {
      title: '工具详情'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: Home,
    meta: {
      title: '页面未找到'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫 - 动态设置页面标题
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title
  } else {
    document.title = 'Web Office Toolbox'
  }
  next()
})

export default router
