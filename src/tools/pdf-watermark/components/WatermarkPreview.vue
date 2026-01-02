<template>
  <div class="watermark-preview-container flex-grow-1">
    <!-- 使用通用 PDFPreview 组件 -->
    <PDFPreview
      :pdf-file="file"
      :watermark-config="watermarkConfig"
      :show-toolbar="false"
      :show-thumbnails="false"
      :show-thumbnails-toggle="false"
      :use-virtual-scroll="false"
      @render-complete="onRenderComplete"
    />

    <!-- 状态提示 -->
    <div v-if="rendering" class="rendering-indicator">
      <v-progress-circular indeterminate size="20" color="teal" class="mr-2" />
      <span>正在渲染预览...</span>
    </div>

    <div v-if="!rendering && file" class="file-info text-caption mt-2">
      <v-icon size="14" color="teal">mdi-file-pdf-box</v-icon>
      {{ file.name }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import PDFPreview from '@/components/PDFPreview.vue'

const props = defineProps({
  file: Object,
  settings: Object
})

const rendering = ref(false)

// 水印配置 - 转换为 PDFPreview 期望的格式
const watermarkConfig = computed(() => ({
  text: props.settings.text,
  color: props.settings.color,
  opacity: props.settings.opacity,
  fontSize: props.settings.fontSize,
  rotation: props.settings.rotation,
  density: props.settings.density,
  offset: props.settings.offset || 0
}))

// 渲染完成回调
const onRenderComplete = (pageCount) => {
  rendering.value = false
}

// 监听文件变化，显示加载状态
watch(() => props.file, (newFile) => {
  if (newFile) {
    rendering.value = true
  }
}, { immediate: true })
</script>

<style scoped>
.watermark-preview-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  background: var(--v-theme-surface);
  border-radius: 8px;
  overflow: hidden;
}

.rendering-indicator {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 150, 136, 0.9);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  font-size: 12px;
  z-index: 5;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.file-info {
  text-align: center;
  color: var(--v-theme-grey-darken-1);
  padding: 8px;
  background: var(--v-theme-surface-variant);
  border-top: 1px solid var(--v-theme-outline-variant);
}

/* 确保 PDFPreview 占满容器 */
.watermark-preview-container :deep(.pdf-preview-container) {
  height: 100%;
  border-radius: 0;
}

.watermark-preview-container :deep(.main-preview) {
  background: var(--v-theme-surface);
}
</style>
