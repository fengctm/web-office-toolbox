<template>
  <v-app>
    <!-- 应用栏 -->
    <v-app-bar
        border
        class="app-bar"
        color="teal-darken-2"
        flat
    >
      <v-app-bar-title class="font-weight-bold">
        <v-icon class="mr-2" icon="mdi-toolbox"></v-icon>
        Web Office Toolbox
      </v-app-bar-title>

      <v-spacer></v-spacer>

      <!-- 主题切换 -->
      <v-btn
          class="mr-2"
          icon
          variant="text"
          @click="toggleTheme"
      >
        <v-icon>
          {{ isDark ? 'mdi-weather-night' : 'mdi-weather-sunny' }}
        </v-icon>
      </v-btn>

      <!-- GitHub 链接 -->
      <v-btn
          href="https://github.com/fengctm/web-office-toolbox"
          icon
          target="_blank"
          variant="text"
      >
        <v-icon>mdi-github</v-icon>
      </v-btn>
    </v-app-bar>

    <!-- 主要内容区域 -->
    <v-main>
      <v-container class="main-container" fluid>
        <router-view v-slot="{ Component, route }">
          <transition mode="out-in" name="page-fade">
            <component :is="Component" :key="route.path"/>
          </transition>
        </router-view>
      </v-container>
    </v-main>

    <!-- 底部 -->
    <v-footer border class="footer">
      <v-container fluid>
        <v-row align="center" justify="center">
          <v-col class="text-center text-caption text-grey" cols="12">
            <span class="mr-2">© 2024 Web Office Toolbox</span>
            <span class="mx-2">•</span>
            <span class="mr-2">纯前端工具箱</span>
            <span class="mx-2">•</span>
            <span>本地运行 · 隐私保护</span>
          </v-col>
        </v-row>
      </v-container>
    </v-footer>

    <!-- 全局通知 -->
    <v-snackbar
        v-model="notification.show"
        :color="notification.color"
        :timeout="3000"
        class="mt-12"
        location="top right"
    >
      {{ notification.message }}
    </v-snackbar>
  </v-app>
</template>

<script setup>
import {onMounted, ref} from 'vue'
import {useTheme} from 'vuetify'

const theme = useTheme()
const isDark = ref(false)

// 通知系统
const notification = ref({
  show: false,
  message: '',
  color: 'info'
})

// 主题切换
const toggleTheme = () => {
  isDark.value = !isDark.value
  const newTheme = isDark.value ? 'dark' : 'light'

  // 使用 Vuetify 3 推荐的 API
  theme.global.name.value = newTheme
  localStorage.setItem('theme', newTheme)

  // 更新HTML的data-theme属性，使CSS深色模式生效
  if (isDark.value) {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }

  showNotification(`已切换到${isDark.value ? '深色' : '浅色'}模式`, 'info')
}

// 显示通知
const showNotification = (message, color = 'info') => {
  notification.value = {
    show: true,
    message,
    color
  }
}

// 初始化主题
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  let targetTheme

  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
    targetTheme = savedTheme
  } else {
    // 自动检测系统主题
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    isDark.value = prefersDark
    targetTheme = prefersDark ? 'dark' : 'light'
  }

  // 使用 Vuetify 3 推荐的 API
  theme.global.name.value = targetTheme

  // 初始化时也设置data-theme属性
  if (isDark.value) {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

// 检查浏览器兼容性
const checkCompatibility = () => {
  const features = [
    {name: 'localStorage', supported: typeof localStorage !== 'undefined'},
    {name: 'CSS Grid', supported: CSS.supports('display', 'grid')},
    {name: 'CSS Variables', supported: CSS.supports('--color: red')}
  ]

  const unsupported = features.filter(f => !f.supported)
  if (unsupported.length > 0) {
    console.warn('部分功能不支持:', unsupported.map(f => f.name))
  }
}

onMounted(() => {
  initTheme()
  checkCompatibility()

  // 显示欢迎消息
  setTimeout(() => {
    showNotification('欢迎使用 Web Office Toolbox！', 'success')
  }, 1000)
})
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  overflow-x: hidden;
}

/* 应用容器 */
#app {
  min-height: 100vh;
  background: var(--v-theme-background);
}

/* 页面过渡动画 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 150, 136, 0.5);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 150, 136, 0.7);
}

/* 深色模式滚动条 */
:root[data-theme="dark"] ::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

:root[data-theme="dark"] ::-webkit-scrollbar-thumb {
  background: rgba(38, 166, 154, 0.5);
}

/* 应用栏样式 */
.app-bar {
  backdrop-filter: blur(10px);
}

/* 主内容区域 */
.main-container {
  min-height: calc(100vh - 128px);
  padding: 0;
}

/* 底部样式 */
.footer {
  background: rgba(0, 150, 136, 0.05);
  backdrop-filter: blur(10px);
}

/* 工具提示优化 */
.v-tooltip__content {
  opacity: 0.95 !important;
}

/* 按钮点击效果 */
.v-btn {
  transition: all 0.2s ease;
}

.v-btn:not(:disabled):active {
  transform: scale(0.95) !important;
}

/* 卡片悬停效果 */
.v-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 输入框焦点效果 */
.v-field__outline {
  transition: all 0.3s ease;
}

/* 响应式调整 */
@media (max-width: 600px) {
  .app-bar .v-app-bar-title {
    font-size: 0.9rem;
  }

  .main-container {
    padding: 0;
  }
}
</style>
