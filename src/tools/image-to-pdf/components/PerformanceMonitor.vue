<template>
  <v-card v-if="show" class="performance-monitor" elevation="2" width="200">
    <v-card-title class="pa-2 bg-surface-darken-1 text-caption font-weight-bold text-on-surface">
      <v-icon size="16" class="mr-1">mdi-speedometer</v-icon>
      性能监控
    </v-card-title>
    <v-card-text class="pa-2 text-caption text-on-surface">
      <div class="d-flex justify-space-between mb-1">
        <span>内存:</span>
        <span class="font-weight-medium">{{ memory }}</span>
      </div>
      <div class="d-flex justify-space-between mb-1">
        <span>FPS:</span>
        <span class="font-weight-medium">{{ fps }}</span>
      </div>
      <div class="d-flex justify-space-between">
        <span>状态:</span>
        <span class="font-weight-medium">{{ status }}</span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import {onMounted, onUnmounted, ref} from 'vue'

const show = ref(false)
const memory = ref('N/A')
const fps = ref(0)
const status = ref('空闲')

let interval = null
let frameCount = 0
let lastTime = performance.now()
let rafId = null

// 监控 FPS
const monitorFPS = () => {
  frameCount++
  const currentTime = performance.now()

  if (currentTime >= lastTime + 1000) {
    fps.value = Math.round((frameCount * 1000) / (currentTime - lastTime))
    frameCount = 0
    lastTime = currentTime
  }

  rafId = requestAnimationFrame(monitorFPS)
}

// 监控内存
const monitorMemory = () => {
  if (performance.memory) {
    const used = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)
    const total = (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(0)
    memory.value = `${used}/${total} MB`
  } else {
    memory.value = 'N/A'
  }
}

// 开始监控
const start = (currentStatus) => {
  show.value = true
  status.value = currentStatus || '运行中'

  // 开始 FPS 监控
  rafId = requestAnimationFrame(monitorFPS)

  // 开始内存监控
  interval = setInterval(monitorMemory, 1000)

  // 立即获取一次内存数据
  monitorMemory()
}

// 停止监控
const stop = () => {
  show.value = false
  status.value = '空闲'
  fps.value = 0
  memory.value = 'N/A'

  if (interval) {
    clearInterval(interval)
    interval = null
  }

  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

onMounted(() => {
  // 默认不显示，需要时调用 start()
})

onUnmounted(() => {
  stop()
})

// 暴露方法给父组件
defineExpose({
  start,
  stop
})
</script>

<style scoped>
.performance-monitor {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  background: rgba(var(--v-theme-surface), 0.95);
  color: rgba(var(--v-theme-on-surface), 1);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-outline-variant), 1);
}

.performance-monitor .v-card-title {
  background: rgba(var(--v-theme-primary), 0.9) !important;
  color: rgba(var(--v-theme-on-primary), 1) !important;
}

.performance-monitor .v-card-text {
  background: rgba(var(--v-theme-surface-variant), 0.8);
  color: rgba(var(--v-theme-on-surface), 1);
}
</style>
