<template>
  <v-fade-transition>
    <v-btn
        v-if="showButton"
        class="scroll-to-top-btn"
        :class="{ 'is-at-bottom': isAtBottom }"
        elevation="6"
        size="large"
        :icon="isAtBottom ? 'mdi-arrow-up' : 'mdi-arrow-down'"
        @click="handleClick"
        :style="buttonStyle"
    />
  </v-fade-transition>
</template>

<script setup>
import {computed, onMounted, onUnmounted, ref, watch} from 'vue'

const showButton = ref(false)
const isAtBottom = ref(false)
const scrollY = ref(0)
const scrollHeight = ref(0)
const clientHeight = ref(0)

// 计算按钮位置（右下角，避开可能的浮动元素）
const buttonStyle = computed(() => {
  const bottomOffset = 24 // 距离底部 24px
  const rightOffset = 24 // 距离右侧 24px

  return {
    position: 'fixed',
    bottom: `${bottomOffset}px`,
    right: `${rightOffset}px`,
    zIndex: 1000,
    // Apple 风格的平滑过渡
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    // 轻微的缩放效果
    transform: showButton.value ? 'scale(1)' : 'scale(0)',
    // Google 风格的阴影
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)'
  }
})

// 检查滚动位置
const checkScrollPosition = () => {
  // 优先查找文档内容区域，然后是工具容器，最后是 window
  const container = document.querySelector('.v-card-text') ||
      document.querySelector('.image-to-pdf-tool') ||
      document.querySelector('.image-to-pdf-wrapper') ||
      document.querySelector('#app')

  // 调试日志
  console.log('Scroll check:', {
    container: container?.className || 'window',
    scrollY: container ? container.scrollTop : window.scrollY,
    scrollHeight: container ? container.scrollHeight : document.documentElement.scrollHeight,
    clientHeight: container ? container.clientHeight : window.innerHeight
  })

  if (container) {
    scrollY.value = container.scrollTop
    scrollHeight.value = container.scrollHeight
    clientHeight.value = container.clientHeight

    // 降低显示阈值：滚动超过 100px
    showButton.value = scrollY.value > 100

    // 判断是否在底部（允许 10px 误差）
    isAtBottom.value = scrollY.value + clientHeight.value >= scrollHeight.value - 10

    console.log('Container mode:', {showButton: showButton.value, isAtBottom: isAtBottom.value})
  } else {
    // 回退：检查 window
    scrollY.value = window.scrollY
    scrollHeight.value = document.documentElement.scrollHeight
    clientHeight.value = window.innerHeight

    showButton.value = scrollY.value > 100
    isAtBottom.value = scrollY.value + clientHeight.value >= scrollHeight.value - 10

    console.log('Window mode:', {showButton: showButton.value, isAtBottom: isAtBottom.value})
  }
}

// 点击处理
const handleClick = () => {
  const container = document.querySelector('.image-to-pdf-tool')

  if (isAtBottom.value) {
    // 滚动到顶部
    if (container) {
      container.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  } else {
    // 滚动到底部
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    } else {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      })
    }
  }
}

// 监听滚动事件（使用防抖优化性能）
let scrollTimeout = null
const handleScroll = () => {
  if (scrollTimeout) return

  scrollTimeout = setTimeout(() => {
    checkScrollPosition()
    scrollTimeout = null
  }, 100) // 100ms 防抖
}

onMounted(() => {
  // 尝试绑定到文档内容区域
  const container = document.querySelector('.v-card-text') ||
      document.querySelector('.image-to-pdf-tool')

  if (container) {
    container.addEventListener('scroll', handleScroll, {passive: true})
    // 初始检查
    checkScrollPosition()
  } else {
    // 回退到 window
    window.addEventListener('scroll', handleScroll, {passive: true})
    // 初始检查
    checkScrollPosition()

    // 如果容器不存在，延迟再次尝试绑定
    setTimeout(() => {
      const retryContainer = document.querySelector('.v-card-text') ||
          document.querySelector('.image-to-pdf-tool')
      if (retryContainer) {
        window.removeEventListener('scroll', handleScroll)
        retryContainer.addEventListener('scroll', handleScroll, {passive: true})
      }
    }, 500)
  }
})

onUnmounted(() => {
  const container = document.querySelector('.v-card-text') ||
      document.querySelector('.image-to-pdf-tool')
  if (container) {
    container.removeEventListener('scroll', handleScroll)
  } else {
    window.removeEventListener('scroll', handleScroll)
  }

  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
})

watch(() => showButton.value, (newValue) => {
  if (newValue) {
    console.log('Button shown')
  }
})
</script>

<style scoped>
/* 悬浮按钮样式 */
.scroll-to-top-btn {
  /* Google Material 风格 */
  border-radius: 50% !important;
  min-width: 48px !important;
  width: 48px !important;
  height: 48px !important;

  /* Apple 风格的平滑动画 */
  animation: appleEasing 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  /* 悬停效果 */
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

/* 悬停时的缩放和阴影增强 */
.scroll-to-top-btn:hover {
  transform: scale(1.1) !important;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.15) !important;
}

/* 点击时的压缩效果 */
.scroll-to-top-btn:active {
  transform: scale(0.95) !important;
}

/* 在底部时的特殊样式 */
.scroll-to-top-btn.is-at-bottom {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%) !important;
}

/* 深色模式适配 */
:root[data-theme="dark"] .scroll-to-top-btn {
  background: #2196f3 !important;
}

:root[data-theme="dark"] .scroll-to-top-btn.is-at-bottom {
  background: linear-gradient(135deg, #42a5f5 0%, #1e88e5 100%) !important;
}

/* Apple 风格的缓动动画 */
@keyframes appleEasing {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
  50% {
    opacity: 0.8;
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 图标样式优化 */
.scroll-to-top-btn :deep(.v-icon) {
  font-size: 24px;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 悬停时图标旋转 */
.scroll-to-top-btn:hover :deep(.v-icon) {
  transform: rotate(180deg);
}

/* 移动端适配 */
@media (max-width: 600px) {
  .scroll-to-top-btn {
    width: 44px !important;
    height: 44px !important;
    min-width: 44px !important;
    bottom: 16px !important;
    right: 16px !important;
  }

  .scroll-to-top-btn :deep(.v-icon) {
    font-size: 20px;
  }
}

/* 高性能模式 */
@media (prefers-reduced-motion: reduce) {
  .scroll-to-top-btn {
    transition: none !important;
    animation: none !important;
  }

  .scroll-to-top-btn:hover {
    transform: none !important;
  }
}
</style>
