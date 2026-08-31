<template>
  <v-card
    class="svg-to-image-app"
    :class="{ 'is-workbench-maximized': isWorkbenchMaximized }"
    elevation="2"
  >
    <!-- 顶部主工具栏 -->
    <v-toolbar class="app-bar-blur" density="compact" flat>
      <v-icon class="ml-3 icon-bounce" color="teal">mdi-svg</v-icon>
      <v-toolbar-title class="text-subtitle-2 font-weight-bold toolbar-title ml-2">
        SVG 可视化工作台
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <!-- 快速操作按钮组 -->
      <div class="d-flex align-center gap-1 mr-2">
        <!-- 布局方向切换（左右 / 上下） -->
        <v-tooltip
          :text="layoutDirection === 'horizontal' ? '切换为上下分栏布局' : '切换为左右分栏布局'"
          location="bottom"
        >
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              size="small"
              variant="text"
              :icon="layoutDirection === 'horizontal' ? 'mdi-view-split-horizontal' : 'mdi-view-split-vertical'"
              @click="toggleLayoutDirection"
            ></v-btn>
          </template>
        </v-tooltip>

        <!-- 沉浸工作台铺满视口 / 退出 -->
        <v-tooltip
          :text="isWorkbenchMaximized ? '退出最大化工作台' : '工作台最大化（铺满视口）'"
          location="bottom"
        >
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              size="small"
              variant="text"
              :icon="isWorkbenchMaximized ? 'mdi-arrow-collapse-all' : 'mdi-arrow-expand-all'"
              :color="isWorkbenchMaximized ? 'teal' : undefined"
              @click="toggleWorkbenchMaximized"
            ></v-btn>
          </template>
        </v-tooltip>

        <!-- 帮助说明 -->
        <v-tooltip text="功能说明与使用帮助" location="bottom">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              size="small"
              icon="mdi-help-circle-outline"
              variant="text"
              @click="handleHelp"
            ></v-btn>
          </template>
        </v-tooltip>
      </div>
    </v-toolbar>

    <v-divider class="divider-opacity"></v-divider>

    <!-- 工作台核心内容区：可拖拽调整比例分栏 -->
    <div class="workbench-body">
      <ResizableSplitter
        v-model="splitRatio"
        :direction="layoutDirection"
        :min="20"
        :max="80"
      >
        <!-- 第一区域：CodeMirror 6 代码编辑 -->
        <template #first>
          <SvgCodeEditor
            v-model="svgCode"
            :validation-error="metadata?.error"
            @notify="showSnackbar"
          />
        </template>

        <!-- 第二区域：交互预览画布 + 底部导出面板 -->
        <template #second>
          <div class="preview-export-container">
            <div class="preview-wrapper">
              <SvgPreviewCanvas
                :svg-code="svgCode"
                :metadata="metadata"
                @fullscreen="isFullscreen = true"
              />
            </div>

            <!-- 底部导出配置条 -->
            <ExportPanel
              :export-config="exportConfig"
              :metadata="metadata"
              :is-exporting="isExporting"
              :has-valid-svg="Boolean(svgCode && metadata?.valid)"
              @download-image="onDownloadImage"
              @download-svg="onDownloadSvg"
            />
          </div>
        </template>
      </ResizableSplitter>
    </div>

    <!-- Apple 风格全屏遮罩大图预览 -->
    <FullscreenPreview
      :svg-code="svgCode"
      :visible="isFullscreen"
      @close="isFullscreen = false"
    />

    <!-- 通用通知系统 -->
    <NotificationSnackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :message="snackbar.message"
      :timeout="snackbar.timeout"
    />
  </v-card>
</template>

<script setup>
import { ref } from 'vue'
import { useSvgConverter } from './composables/useSvgConverter.js'
import ResizableSplitter from './components/ResizableSplitter.vue'
import SvgCodeEditor from './components/SvgCodeEditor.vue'
import SvgPreviewCanvas from './components/SvgPreviewCanvas.vue'
import ExportPanel from './components/ExportPanel.vue'
import FullscreenPreview from './components/FullscreenPreview.vue'
import NotificationSnackbar from '@/components/NotificationSnackbar.vue'

const {
  svgCode,
  metadata,
  exportConfig,
  layoutDirection,
  splitRatio,
  isWorkbenchMaximized,
  isFullscreen,
  isExporting,
  toggleLayoutDirection,
  toggleWorkbenchMaximized,
  handleDownloadImage: baseHandleDownloadImage,
  handleDownloadSvg: baseHandleDownloadSvg,
  handleHelp
} = useSvgConverter()

// 全局通知系统
const snackbar = ref({
  show: false,
  message: '',
  color: 'info',
  timeout: 3000
})

const showSnackbar = (message, type = 'info') => {
  snackbar.value = {
    show: true,
    message,
    color:
      type === 'success'
        ? 'success'
        : type === 'error'
        ? 'error'
        : type === 'warning'
        ? 'warning'
        : 'info',
    timeout: 3000
  }
}

const onDownloadImage = async () => {
  await baseHandleDownloadImage(showSnackbar)
}

const onDownloadSvg = () => {
  baseHandleDownloadSvg(showSnackbar)
}
</script>

<style lang="scss" scoped>
$apple-ease: cubic-bezier(0.25, 0.1, 0.25, 1);

.svg-to-image-app {
  border-radius: 16px;
  overflow: hidden;
  height: 800px;
  min-height: 650px;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  transition: all 0.3s $apple-ease;
  border: 1px solid rgba(0, 0, 0, 0.08);

  // 沉浸工作台最大化视口模式
  &.is-workbench-maximized {
    position: fixed;
    inset: 0;
    width: 100vw !important;
    height: 100vh !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
    z-index: 1200;
    border-radius: 0;
    border: none;
  }
}

.app-bar-blur {
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  .toolbar-title {
    color: #1e293b;
  }
}

.workbench-body {
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  display: flex;
}

.preview-export-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;

  .preview-wrapper {
    flex: 1;
    min-height: 0;
    position: relative;
    overflow: hidden;
  }
}

.icon-bounce {
  transition: transform 0.3s ease;
  &:hover {
    transform: scale(1.15) rotate(-6deg);
  }
}

.gap-1 {
  gap: 4px;
}

// 深色模式适配
.v-theme--dark {
  .svg-to-image-app {
    background-color: #0d0e12;
    border-color: rgba(255, 255, 255, 0.08);
  }

  .app-bar-blur {
    background-color: rgba(24, 24, 27, 0.85);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    .toolbar-title {
      color: #f1f5f9;
    }
  }

  .divider-opacity {
    border-color: rgba(255, 255, 255, 0.08) !important;
  }
}
</style>