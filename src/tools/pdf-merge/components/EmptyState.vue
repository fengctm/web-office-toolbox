<template>
  <transition name="fade">
    <div v-if="show" class="empty-state text-center pa-10">
      <v-icon size="80" color="grey-lighten-2">mdi-file-document-multiple-outline</v-icon>
      <div class="text-h6 font-weight-medium text-grey-darken-1 mt-4">准备开始组装</div>
      <div class="text-caption text-grey-darken-1 mt-2">拖拽上传或添加 PDF 文件</div>

      <v-btn
          class="mt-6 btn-pulse"
          color="teal"
          size="large"
          variant="tonal"
          @click="$emit('add-first')"
      >
        <v-icon start>mdi-plus</v-icon> 添加第一个 PDF
      </v-btn>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

defineEmits(['add-first'])
</script>

<style scoped lang="scss">
// Apple 风格的贝塞尔曲线
$apple-ease: cubic-bezier(0.25, 0.1, 0.25, 1);

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  opacity: 0.7;
}

.btn-pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.4);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 0 0 10px rgba(20, 184, 166, 0);
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s $apple-ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>