import { createRouter, createWebHistory } from 'vue-router'
import Home from './pages/Home.vue'
import ToolContainer from './pages/ToolContainer.vue'

const routes = [
  {
    path: '/',
    component: Home
  },
  {
    path: '/tool/:tool',
    component: ToolContainer
  },
  {
    path: '/tool/image-to-pdf',
    component: () => import('./tools/image-to-pdf/index.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
