<template>
  <v-app class="app-wrapper">
    <v-main class="main-content">
      <!-- 顶部导航栏 - 只在需要时显示 -->
      <v-app-bar
        v-if="showAppBar"
        app
        flat
        density="comfortable"
        class="app-bar"
        :elevation="scrollY > 0 ? 2 : 0"
      >
        <v-app-bar-nav-icon @click="drawer = !drawer" v-if="$vuetify.display.mobile"></v-app-bar-nav-icon>

        <v-app-bar-title class="app-title">
          <v-icon class="mr-2" color="primary">mdi-toolbox</v-icon>
          Web Office Toolbox
        </v-app-bar-title>

        <v-spacer></v-spacer>

        <v-btn
          icon
          variant="text"
          @click="goHome"
          v-if="!isHome"
          class="mr-2"
        >
          <v-icon>mdi-home</v-icon>
          <v-tooltip activator="parent" location="bottom">返回首页</v-tooltip>
        </v-btn>

        <v-btn
          icon
          variant="text"
          @click="toggleTheme"
        >
          <v-icon>{{ isDark ? 'mdi-weather-night' : 'mdi-weather-sunny' }}</v-icon>
          <v-tooltip activator="parent" location="bottom">切换主题</v-tooltip>
        </v-btn>
      </v-app-bar>

      <!-- 侧边导航抽屉 - 移动端使用 -->
      <v-navigation-drawer
        v-model="drawer"
        app
        temporary
        class="nav-drawer"
      >
        <v-list>
          <v-list-item @click="goHome" prepend-icon="mdi-home" title="首页"></v-list-item>
          <v-list-item @click="toggleTheme" prepend-icon="mdi-theme-light-dark" :title="isDark ? '浅色模式' : '深色模式'"></v-list-item>
        </v-list>
      </v-navigation-drawer>

      <!-- 主要内容区域 -->
      <div class="content-wrapper">
        <router-view v-slot="{ Component, route }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </div>

      <!-- 底部栏 - 移动端显示 -->
      <v-bottom-navigation
        v-if="$vuetify.display.mobile && !isHome"
        app
        grow
        class="bottom-nav"
      >
        <v-btn @click="goHome">
          <v-icon>mdi-home</v-icon>
          首页
        </v-btn>
        <v-btn @click="toggleTheme">
          <v-icon>{{ isDark ? 'mdi-weather-night' : 'mdi-weather-sunny' }}</v-icon>
          主题
        </v-btn>
      </v-bottom-navigation>

      <!-- 全局提示 -->
      <v-snackbar
        v-model="notification.show"
        :color="notification.color"
        :timeout="notification.timeout"
        location="top right"
        class="notification"
        elevation="8"
      >
        <div class="d-flex align-center">
          <v-icon class="mr-2">{{ notification.icon }}</v-icon>
          <span>{{ notification.message }}</span>
        </div>
      </v-snackbar>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 状态管理
const drawer = ref(false)
const scrollY = ref(0)
const isDark = ref(false)

// 通知系统
const notification = ref({
  show: false,
  message: '',
  color: 'info',
  timeout: 3000,
  icon: 'mdi-information'
})

// 计算属性
const isHome = computed(() => route.path === '/')
const showAppBar = computed(() => {
  // 在移动端和工具页面显示导航栏
  return true
})

// 滚动监听
const handleScroll = () => {
  scrollY.value = window.scrollY
}

// 导航方法
const goHome = () => {
  if (!isHome.value) {
    router.push('/')
  }
  drawer.value = false
}

// 主题切换
const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  showNotification(
    isDark.value ? '已切换到深色模式' : '已切换到浅色模式',
    'success',
    'mdi-theme-light-dark'
  )
}

// 通知方法
const showNotification = (message, color = 'info', icon = 'mdi-information', timeout = 3000) => {
  notification.value = {
    show: true,
    message,
    color,
    timeout,
    icon
  }
}

// 暴露通知方法给子组件
defineExpose({
  showNotification
})

// 生命周期
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })

  // 检测系统主题偏好
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    isDark.value = true
    document.documentElement.setAttribute('data-theme', 'dark')
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.app-wrapper {
  background: transparent !important;
}

.main-content {
  min-height: 100vh;
  position: relative;
}

/* 应用栏样式优化 */
.app-bar {
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.85) !important;
  border-bottom: 1px solid rgba(0, 150, 136, 0.1);
  transition: all 0.3s ease;
}

[data-theme="dark"] .app-bar {
  background: rgba(30, 30, 30, 0.85) !important;
  border-bottom: 1px solid rgba(0, 150, 136, 0.2);
}

.app-title {
  font-weight: 700;
  color: #009688;
  letter-spacing: 0.5px;
}

/* 内容包装器 - 优化PC端布局 */
.content-wrapper {
  width: 100%;
  min-height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  transition: all 0.3s ease;
}

/* PC端大屏幕优化 */
@media (min-width: 1400px) {
  .content-wrapper {
    padding: 40px 60px;
  }
}

@media (min-width: 1200px) and (max-width: 1399px) {
  .content-wrapper {
    padding: 30px 40px;
  }
}

@media (min-width: 769px) and (max-width: 1199px) {
  .content-wrapper {
    padding: 20px 30px;
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .content-wrapper {
    padding: 12px;
    min-height: calc(100vh - 120px); /* 减去底部导航高度 */
  }

  .app-title {
    font-size: 1rem;
  }
}

/* 侧边导航抽屉样式 */
.nav-drawer {
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.95) !important;
}

[data-theme="dark"] .nav-drawer {
  background: rgba(30, 30, 30, 0.95) !important;
}

/* 底部导航栏样式 */
.bottom-nav {
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.95) !important;
  border-top: 1px solid rgba(0, 150, 136, 0.1);
}

[data-theme="dark"] .bottom-nav {
  background: rgba(30, 30, 30, 0.95) !important;
  border-top: 1px solid rgba(0, 150, 136, 0.2);
}

/* 通知样式优化 */
.notification {
  backdrop-filter: blur(10px);
  border-radius: 8px;
  font-weight: 500;
}

/* 路由过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 按钮悬停效果优化 */
.v-btn {
  border-radius: 8px !important;
}

.v-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 150, 136, 0.2);
}

/* 修复移动端触摸反馈 */
@media (max-width: 768px) {
  .v-btn {
    min-width: 44px;
    min-height: 44px;
  }

  .v-app-bar-nav-icon {
    min-width: 44px;
    min-height: 44px;
  }
}

/* 优化滚动条在应用内的显示 */
.content-wrapper::-webkit-scrollbar {
  width: 6px;
}

.content-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0, 150, 136, 0.4);
  border-radius: 3px;
}

/* 防止内容溢出 */
.v-main {
  overflow-x: hidden;
}

/* 优化 Vuetify 组件在新布局中的表现 */
:deep(.v-container) {
  padding: 0 !important;
}

:deep(.v-card) {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
}

:deep(.v-card:hover) {
  box-shadow: 0 8px 30px rgba(0, 150, 136, 0.15) !important;
}

/* 移动端触摸优化 */
@media (max-width: 768px) {
  :deep(.v-card) {
    border-radius: 12px !important;
  }

  :deep(.v-btn) {
    letter-spacing: 0;
  }
}

/* PC端舒适度优化 */
@media (min-width: 769px) {
  :deep(.v-card) {
    border-radius: 16px !important;
  }

  :deep(.v-card-title) {
    font-size: 1.25rem !important;
    padding: 20px 24px !important;
  }

  :deep(.v-card-text) {
    font-size: 1rem !important;
    line-height: 1.7 !important;
  }

  :deep(.v-card-actions) {
    padding: 16px 24px !important;
  }

  :deep(.v-btn) {
    min-height: 44px !important;
    padding: 0 24px !important;
    font-size: 1rem !important;
    font-weight: 600 !important;
  }
}
</style>
