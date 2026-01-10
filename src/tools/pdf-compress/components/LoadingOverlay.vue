<template>
  <transition name="apple-blur">
    <div v-if="visible" class="loading-overlay">
      <div class="loader-content">
        <v-progress-circular color="teal" indeterminate size="64" width="4"></v-progress-circular>
        <div class="mt-4 font-weight-medium text-teal">{{ status }}</div>
        <div class="text-caption text-medium-emphasis mt-1">请勿关闭页面...</div>
      </div>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  status: {
    type: String,
    default: ''
  }
})
</script>

<style scoped lang="scss">
.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 2000;
  background: rgba(255, 255, 255, 0.8); // 默认浅色遮罩
  backdrop-filter: blur(20px) saturate(180%);
  display: flex;
  align-items: center;
  justify-content: center;

  .loader-content {
    text-align: center;
  }
}

.v-theme--dark .loading-overlay {
  background: rgba(0, 0, 0, 0.85); // 深色遮罩，保证对比度
}

// Apple 风格动画
.apple-blur-enter-active, .apple-blur-leave-active {
  transition: opacity 0.5s ease;
}

.apple-blur-enter-from, .apple-blur-leave-to {
  opacity: 0;
}
</style>