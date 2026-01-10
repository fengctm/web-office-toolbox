<template>
  <transition name="apple-zoom">
    <div v-if="visible" class="fullscreen-overlay" @click="onClose">
      <v-btn
          icon="mdi-close"
          class="close-btn"
          variant="flat"
          size="large"
          color="grey-lighten-4"
          @click="onClose"
      ></v-btn>
      <div class="zoom-content" v-html="svgCode" @click.stop></div>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  svgCode: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close'])

const onClose = () => {
  emit('close')
}
</script>

<style scoped lang="scss">
// Apple 风格的贝塞尔曲线
$apple-ease: cubic-bezier(0.25, 0.1, 0.25, 1);

.fullscreen-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  transition: background 0.3s;

  .v-theme--dark & {
    background: rgba(0, 0, 0, 0.85);
  }

  .close-btn {
    position: absolute;
    top: 24px;
    right: 24px;
    z-index: 10;
    border-radius: 50%;
    width: 48px;
    height: 48px;
  }

  .zoom-content {
    max-width: 85vw;
    max-height: 85vh;
    transition: transform 0.3s $apple-ease;

    :deep(svg) {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
}

// Apple 缩放动画
.apple-zoom-enter-active, .apple-zoom-leave-active {
  transition: all 0.4s $apple-ease;
}

.apple-zoom-enter-from, .apple-zoom-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
</style>