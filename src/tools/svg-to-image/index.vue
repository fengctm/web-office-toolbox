<template>
  <v-card class="svg-to-image-app" elevation="0">
    <!-- 顶部工具栏：Apple 风格的模糊背景 -->
    <v-toolbar class="app-bar-blur" flat>
      <v-icon class="ml-4 icon-bounce" color="teal">mdi-svg</v-icon>
      <v-toolbar-title class="text-subtitle-1 font-weight-bold toolbar-title">
        SVG 图像转换器
      </v-toolbar-title>
      <v-spacer></v-spacer>

      <!-- 快速操作按钮组 -->
      <v-btn
          class="btn-micro-interaction"
          icon="mdi-help-circle-outline"
          variant="text"
          @click="handleHelp"
      ></v-btn>
    </v-toolbar>

    <v-divider class="divider-opacity"></v-divider>

    <v-row class="app-content" no-gutters>
      <!-- 1. 输入区域 -->
      <v-col class="section-animate-left input-col" cols="12" md="5">
        <InputSection
            v-model:exportFormat="exportFormat"
            v-model:svgCode="svgCode"
            @clear="handleClear"
            @download-image="handleDownloadImage"
            @download-svg="handleDownloadSvg"
        />
      </v-col>

      <!-- 2. 预览区域 -->
      <v-col class="section-animate-right preview-col" cols="12" md="7">
        <PreviewSection
            :svgCode="svgCode"
            @fullscreen="isFullscreen = true"
        />
      </v-col>
    </v-row>

    <!-- 3. Apple 风格的全屏预览 -->
    <FullscreenPreview
        :svgCode="svgCode"
        :visible="isFullscreen"
        @close="isFullscreen = false"
    />

    <!-- 通用通知组件 -->
    <NotificationSnackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        :message="snackbar.message"
        :timeout="snackbar.timeout"
    />
  </v-card>
</template>

<script setup>
import {ref} from 'vue'
import {useSvgConverter} from './composables/useSvgConverter.js'
import InputSection from './components/InputSection.vue'
import PreviewSection from './components/PreviewSection.vue'
import FullscreenPreview from './components/FullscreenPreview.vue'
import NotificationSnackbar from '@/components/NotificationSnackbar.vue'

// 使用 composable 获取核心逻辑和状态
const {
  svgCode,
  exportFormat,
  isFullscreen,
  handleSvgInput,
  handleDownloadImage: baseHandleDownloadImage,
  handleDownloadSvg: baseHandleDownloadSvg,
  handleClear: baseHandleClear,
  handleHelp
} = useSvgConverter()

// 通知系统状态
const snackbar = ref({
  show: false,
  message: '',
  color: 'info',
  timeout: 3000
})

// 封装通知方法
const showSnackbar = (message, type = 'info') => {
  snackbar.value = {
    show: true,
    message,
    color: type === 'success' ? 'success' :
        type === 'error' ? 'error' :
            type === 'warning' ? 'warning' : 'info',
    timeout: 3000
  }
}

// 绑定通知系统的处理函数
const handleDownloadImage = async () => {
  await baseHandleDownloadImage(showSnackbar)
}

const handleDownloadSvg = () => {
  baseHandleDownloadSvg(showSnackbar)
}

const handleClear = () => {
  baseHandleClear(showSnackbar)
}
</script>

<style lang="scss" scoped>
// Apple 风格的贝塞尔曲线
$apple-ease: cubic-bezier(0.25, 0.1, 0.25, 1);
$apple-ease-in: cubic-bezier(0.42, 0, 1, 1);
$apple-ease-out: cubic-bezier(0, 0, 0.58, 1);

.svg-to-image-app {
  border-radius: 20px; // 圆角稍微大一点，更符合现代 Apple 风格
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  transition: background-color 0.3s $apple-ease;
}

// 1. 深色模式与玻璃拟态工具栏
.app-bar-blur {
  // 默认浅色模式背景
  background-color: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s $apple-ease;

  .toolbar-title {
    color: #1d1d1f; // Apple 几乎黑
  }
}

// 适配 Vuetify 3 的深色模式类
.v-theme--dark {
  .svg-to-image-app {
    background-color: #000000;
  }

  .app-bar-blur {
    // 深色模式玻璃背景
    background-color: rgba(30, 30, 30, 0.75);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .toolbar-title {
      color: rgba(255, 255, 255, 0.9);
    }
  }

  .divider-opacity {
    border-color: rgba(255, 255, 255, 0.12) !important;
  }
}

// 2. Apple 风格微交互动画
.btn-micro-interaction {
  transition: transform 0.2s $apple-ease, opacity 0.2s;

  &:active {
    transform: scale(0.92); // 按钮按下稍微缩小
    opacity: 0.8;
  }
}

.icon-bounce {
  transition: transform 0.4s $apple-ease-out;

  &:hover {
    transform: rotate(-10deg) scale(1.1);
  }
}

// 3. 内容入场动画
.app-content {
  flex: 1;
  overflow: hidden;
  display: flex;
}

.section-animate-left, .section-animate-right {
  animation: slide-fade-up 0.8s $apple-ease-out backwards;
}

.section-animate-left {
  animation-delay: 0.1s;
}

.section-animate-right {
  animation-delay: 0.2s;
}

@keyframes slide-fade-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 响应式适配
@media (max-width: 960px) {
  .app-content {
    overflow-y: auto;
  }

  .input-col,
  .preview-col {
    min-height: 400px; // 确保移动端有足够的高度
  }
}
</style>