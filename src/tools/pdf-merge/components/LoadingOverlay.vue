<template>
  <transition name="apple-blur">
    <div v-if="show" class="loading-overlay">
      <div class="loader-content text-center">
        <v-progress-circular color="teal" indeterminate size="64" width="4"></v-progress-circular>
        <div class="mt-4 font-weight-medium text-teal">{{ status }}</div>
      </div>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false
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
  z-index: 200;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.v-theme--dark .loading-overlay {
  background: rgba(0, 0, 0, 0.85);
}

.loader-content {
  padding: 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
}

.v-theme--dark .loader-content {
  background: rgba(30, 30, 30, 0.6);
}

.apple-blur-enter-active, .apple-blur-leave-active {
  transition: opacity 0.5s ease;
}

.apple-blur-enter-from, .apple-blur-leave-to {
  opacity: 0;
}
</style>