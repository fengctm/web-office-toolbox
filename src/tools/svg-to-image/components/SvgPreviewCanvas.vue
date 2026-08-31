<template>
  <div class="svg-preview-canvas-container" ref="canvasContainerRef">
    <!-- 顶部状态与信息条 -->
    <div class="preview-header">
      <div class="d-flex align-center">
        <v-icon size="small" color="teal" class="mr-1">mdi-eye-outline</v-icon>
        <span class="header-title font-weight-bold text-caption text-uppercase">实时预览画布</span>
      </div>

      <!-- SVG 尺寸与 ViewBox 徽章 -->
      <div v-if="metadata && metadata.valid" class="svg-info-badge ml-3">
        <span class="badge-item">
          <v-icon size="x-small" class="mr-1">mdi-aspect-ratio</v-icon>
          {{ metadata.width }} × {{ metadata.height }} px
        </span>
        <span class="badge-divider">|</span>
        <span class="badge-item text-truncate" :title="metadata.viewBox">
          viewBox: {{ metadata.viewBox }}
        </span>
      </div>

      <v-spacer></v-spacer>

      <!-- 背景颜色切换 -->
      <v-menu location="bottom end" :close-on-content-click="false">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            size="x-small"
            variant="tonal"
            prepend-icon="mdi-palette-outline"
            class="mr-1"
          >
            画布背景
          </v-btn>
        </template>
        <v-card min-width="180" class="pa-2" elevation="4">
          <div class="text-caption font-weight-bold mb-2 text-medium-emphasis">选择预览底色</div>
          <div class="d-flex flex-wrap gap-2">
            <v-btn
              size="small"
              variant="outlined"
              :color="currentBg === 'checkerboard' ? 'teal' : undefined"
              class="w-100 justify-start mb-1"
              @click="currentBg = 'checkerboard'"
            >
              <div class="bg-sample bg-checkerboard mr-2"></div>
              透明棋盘格
            </v-btn>
            <v-btn
              size="small"
              variant="outlined"
              :color="currentBg === 'white' ? 'teal' : undefined"
              class="w-100 justify-start mb-1"
              @click="currentBg = 'white'"
            >
              <div class="bg-sample bg-white mr-2"></div>
              纯白背景
            </v-btn>
            <v-btn
              size="small"
              variant="outlined"
              :color="currentBg === 'dark' ? 'teal' : undefined"
              class="w-100 justify-start mb-1"
              @click="currentBg = 'dark'"
            >
              <div class="bg-sample bg-dark mr-2"></div>
              暗黑背景
            </v-btn>
            <div class="d-flex align-center w-100 mt-1">
              <span class="text-caption mr-2">自定义:</span>
              <input
                type="color"
                v-model="customColor"
                @input="currentBg = 'custom'"
                class="color-picker-input"
              />
            </div>
          </div>
        </v-card>
      </v-menu>

      <!-- 全屏 -->
      <v-tooltip text="全屏沉浸预览" location="top">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            size="x-small"
            variant="text"
            icon="mdi-fullscreen"
            @click="emit('fullscreen')"
          ></v-btn>
        </template>
      </v-tooltip>
    </div>

    <!-- 交互画布视口 -->
    <div
      class="canvas-viewport"
      :class="[bgClass, { 'is-panning': isPanning }]"
      :style="customBgStyle"
      @wheel.prevent="onWheel"
      @mousedown="startPan"
      ref="viewportRef"
    >
      <!-- 变换渲染层 -->
      <div
        class="canvas-transform-layer"
        :style="transformStyle"
      >
        <!-- 渲染 SVG 内容 -->
        <div
          v-if="svgCode && (!metadata || metadata.valid)"
          class="svg-render-box"
          v-html="sanitizedSvg"
        ></div>

        <!-- 错误提示 -->
        <div v-else-if="metadata && !metadata.valid" class="canvas-message error-msg">
          <v-icon size="48" color="error" class="mb-2">mdi-alert-octagon-outline</v-icon>
          <div class="text-subtitle-2 font-weight-bold">SVG 渲染受阻</div>
          <div class="text-caption text-medium-emphasis mt-1">{{ metadata.error }}</div>
        </div>

        <!-- 空代码提示 -->
        <div v-else class="canvas-message empty-msg">
          <v-icon size="56" color="teal-lighten-3" class="mb-2">mdi-vector-square</v-icon>
          <div class="text-subtitle-2 font-weight-bold text-medium-emphasis">暂无 SVG 图像</div>
          <div class="text-caption text-disabled mt-1">在左侧输入代码或选择示例以实时预览</div>
        </div>
      </div>

      <!-- 悬浮控制工具栏胶囊 -->
      <div class="floating-controls" @mousedown.stop>
        <v-tooltip text="缩小 (滚轮向下)" location="top">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              size="x-small"
              icon="mdi-minus"
              variant="text"
              @click="zoomOut"
            ></v-btn>
          </template>
        </v-tooltip>

        <span class="zoom-display" @click="resetTransform" title="点击重置 100%">
          {{ Math.round(zoomLevel * 100) }}%
        </span>

        <v-tooltip text="放大 (滚轮向上)" location="top">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              size="x-small"
              icon="mdi-plus"
              variant="text"
              @click="zoomIn"
            ></v-btn>
          </template>
        </v-tooltip>

        <div class="control-divider"></div>

        <v-tooltip text="自适应画布大小" location="top">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              size="x-small"
              icon="mdi-fit-to-screen-outline"
              variant="text"
              @click="fitToView"
            ></v-btn>
          </template>
        </v-tooltip>

        <v-tooltip text="重置比例与平移 (100%)" location="top">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              size="x-small"
              icon="mdi-restore"
              variant="text"
              @click="resetTransform"
            ></v-btn>
          </template>
        </v-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  svgCode: {
    type: String,
    default: ''
  },
  metadata: {
    type: Object,
    default: () => ({ valid: true, width: 500, height: 500 })
  }
})

const emit = defineEmits(['fullscreen'])

const canvasContainerRef = ref(null)
const viewportRef = ref(null)

// 变换状态：缩放与平移
const zoomLevel = ref(1)
const panOffset = ref({ x: 0, y: 0 })
const isPanning = ref(false)
const dragStart = ref({ x: 0, y: 0 })

// 背景选择
const currentBg = ref('checkerboard') // 'checkerboard' | 'white' | 'dark' | 'custom'
const customColor = ref('#38bdf8')

const bgClass = computed(() => {
  if (currentBg.value === 'checkerboard') return 'bg-checkerboard'
  if (currentBg.value === 'white') return 'bg-pure-white'
  if (currentBg.value === 'dark') return 'bg-pure-dark'
  return ''
})

const customBgStyle = computed(() => {
  if (currentBg.value === 'custom') {
    return { backgroundColor: customColor.value }
  }
  return {}
})

// 计算图层变换
const transformStyle = computed(() => {
  return {
    transform: `translate(${panOffset.value.x}px, ${panOffset.value.y}px) scale(${zoomLevel.value})`,
    transformOrigin: 'center center'
  }
})

// 保证 SVG 代码渲染正常
const sanitizedSvg = computed(() => {
  if (!props.svgCode) return ''
  return props.svgCode
})

// 滚轮平滑缩放
const onWheel = (e) => {
  const delta = e.deltaY < 0 ? 1.15 : 0.85
  const newZoom = Math.min(Math.max(zoomLevel.value * delta, 0.1), 10)
  zoomLevel.value = Math.round(newZoom * 100) / 100
}

const zoomIn = () => {
  zoomLevel.value = Math.min(Math.round(zoomLevel.value * 1.2 * 100) / 100, 10)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(Math.round(zoomLevel.value * 0.8 * 100) / 100, 0.1)
}

const resetTransform = () => {
  zoomLevel.value = 1
  panOffset.value = { x: 0, y: 0 }
}

// 自动适应视口大小
const fitToView = () => {
  if (!viewportRef.value || !props.metadata || !props.metadata.width) {
    resetTransform()
    return
  }
  const rect = viewportRef.value.getBoundingClientRect()
  const padding = 60
  const availW = rect.width - padding
  const availH = rect.height - padding

  const svgW = props.metadata.width || 500
  const svgH = props.metadata.height || 500

  const scaleX = availW / svgW
  const scaleY = availH / svgH
  const scale = Math.min(scaleX, scaleY, 1.5)

  zoomLevel.value = Math.max(Math.round(scale * 100) / 100, 0.2)
  panOffset.value = { x: 0, y: 0 }
}

// 鼠标拖拽平移
const startPan = (e) => {
  // 只响应鼠标左键或中键
  if (e.button !== 0 && e.button !== 1) return
  isPanning.value = true
  dragStart.value = {
    x: e.clientX - panOffset.value.x,
    y: e.clientY - panOffset.value.y
  }
  window.addEventListener('mousemove', onPanMove)
  window.addEventListener('mouseup', endPan)
}

const onPanMove = (e) => {
  if (!isPanning.value) return
  panOffset.value = {
    x: e.clientX - dragStart.value.x,
    y: e.clientY - dragStart.value.y
  }
}

const endPan = () => {
  isPanning.value = false
  window.removeEventListener('mousemove', onPanMove)
  window.removeEventListener('mouseup', endPan)
}

onUnmounted(() => {
  window.removeEventListener('mousemove', onPanMove)
  window.removeEventListener('mouseup', endPan)
})
</script>

<style scoped lang="scss">
.svg-preview-canvas-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  position: relative;
  background-color: #f1f5f9;
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  min-height: 42px;
  z-index: 5;

  .header-title {
    color: #475569;
    letter-spacing: 0.5px;
  }
}

.svg-info-badge {
  display: flex;
  align-items: center;
  background-color: rgba(20, 184, 166, 0.1);
  color: #0f766e;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid rgba(20, 184, 166, 0.2);

  .badge-divider {
    margin: 0 6px;
    opacity: 0.4;
  }
}

.canvas-viewport {
  flex: 1;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;

  &.is-panning {
    cursor: grabbing;
  }
}

.canvas-transform-layer {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.05s ease-out;
  pointer-events: none;
}

.svg-render-box {
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;

  :deep(svg) {
    filter: drop-shadow(0 12px 28px rgba(0, 0, 0, 0.15));
    display: block;
    max-width: 100%;
    max-height: 100%;
  }
}

.canvas-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  border-radius: 16px;
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  max-width: 320px;

  &.error-msg {
    border: 1px solid rgba(239, 68, 68, 0.2);
    background-color: rgba(254, 242, 242, 0.9);
  }
}

// 悬浮工具胶囊
.floating-controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  z-index: 10;
  gap: 2px;

  .zoom-display {
    font-size: 11px;
    font-weight: 600;
    color: #475569;
    padding: 0 6px;
    cursor: pointer;
    min-width: 44px;
    text-align: center;

    &:hover {
      color: #0d9488;
    }
  }

  .control-divider {
    width: 1px;
    height: 14px;
    background-color: rgba(0, 0, 0, 0.1);
    margin: 0 4px;
  }
}

// 棋盘格与底色
.bg-checkerboard {
  background-image: linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
    linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
    linear-gradient(-45deg, transparent 75%, #e2e8f0 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

.bg-pure-white {
  background-color: #ffffff;
}

.bg-pure-dark {
  background-color: #09090b;
}

.bg-sample {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.color-picker-input {
  width: 28px;
  height: 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: none;
}

// 深色模式适配
.v-theme--dark {
  .svg-preview-canvas-container {
    background-color: #09090b;
  }

  .preview-header {
    background-color: #18181b;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    .header-title {
      color: #a1a1aa;
    }
  }

  .bg-checkerboard {
    background-image: linear-gradient(45deg, #27272a 25%, transparent 25%),
      linear-gradient(-45deg, #27272a 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #27272a 75%),
      linear-gradient(-45deg, transparent 75%, #27272a 75%);
  }

  .floating-controls {
    background-color: rgba(24, 24, 27, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);

    .zoom-display {
      color: #d4d4d8;
      &:hover {
        color: #2dd4bf;
      }
    }

    .control-divider {
      background-color: rgba(255, 255, 255, 0.15);
    }
  }

  .canvas-message {
    background-color: rgba(24, 24, 27, 0.9);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);

    &.error-msg {
      background-color: rgba(69, 10, 10, 0.85);
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
  }
}
</style>
