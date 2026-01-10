<template>
  <div class="preview-section">
    <div class="section-header d-flex align-center mb-3">
      <span class="text-overline text-medium-emphasis">实时预览</span>
      <v-spacer></v-spacer>
      <v-btn
          size="small"
          variant="text"
          icon="mdi-fullscreen"
          class="btn-micro-interaction"
          @click="onFullscreen"
      ></v-btn>
    </div>

    <!-- 棋盘格背景预览容器 -->
    <div class="preview-canvas-wrapper" @click="onFullscreen">
      <div class="checkerboard-bg"></div>
      <div class="svg-render-container" v-html="svgCode" ref="previewBox"></div>

      <!-- 空状态提示 -->
      <transition name="fade">
        <div v-if="!svgCode" class="empty-placeholder">
          <v-icon size="48" color="grey-lighten-2">mdi-xml</v-icon>
          <p class="text-body-2 text-medium-emphasis mt-2">等待代码输入...</p>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
defineProps({
  svgCode: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['fullscreen'])

const onFullscreen = () => {
  emit('fullscreen')
}
</script>

<style scoped lang="scss">
// Apple 风格的贝塞尔曲线
$apple-ease: cubic-bezier(0.25, 0.1, 0.25, 1);

.preview-section {
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  padding: 16px; // 添加内边距防止内容被圆角遮挡
  height: 100%;
  box-sizing: border-box;
}

.preview-canvas-wrapper {
  flex: 1;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
  cursor: zoom-in;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s $apple-ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);

  &:hover {
    transform: scale(1.005);
    box-shadow: 0 8px 24px rgba(0,0,0,0.06);
    border-color: rgba(20, 184, 166, 0.3);
  }
}

.checkerboard-bg {
  position: absolute;
  inset: 0;
  // 默认浅色棋盘格
  background-image: linear-gradient(45deg, #eee 25%, transparent 25%),
  linear-gradient(-45deg, #eee 25%, transparent 25%),
  linear-gradient(45deg, transparent 75%, #eee 75%),
  linear-gradient(-45deg, transparent 75%, #eee 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  z-index: 0;
  opacity: 0.6;
}

.svg-render-container {
  position: relative;
  z-index: 1;
  max-width: 90%;
  max-height: 90%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s $apple-ease;

  :deep(svg) {
    width: 100%;
    height: auto;
    filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.15));
    transition: transform 0.3s $apple-ease;
  }
}

.empty-placeholder {
  position: absolute;
  text-align: center;
  z-index: 2;
  color: #999;
  pointer-events: none;
}

.btn-micro-interaction {
  transition: transform 0.2s $apple-ease, opacity 0.2s;

  &:active {
    transform: scale(0.92);
    opacity: 0.8;
  }
}

// 简单的淡入动画
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s $apple-ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

// 深色模式适配
.v-theme--dark {
  .preview-section {
    background-color: #000000;
  }

  .checkerboard-bg {
    background-image: linear-gradient(45deg, #1c1c1e 25%, transparent 25%),
    linear-gradient(-45deg, #1c1c1e 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #1c1c1e 75%),
    linear-gradient(-45deg, transparent 75%, #1c1c1e 75%);
  }
}

// 响应式适配
@media (max-width: 960px) {
  .preview-canvas-wrapper {
    min-height: 300px;
  }
}
</style>