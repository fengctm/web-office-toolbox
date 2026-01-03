<template>
  <div class="preview-area">
    <!-- 预览容器 -->
    <div v-if="previewFiles.length > 0" class="preview-container">
      <PDFPreview
          :files="previewFiles"
          :margins="{top:0, right:0, bottom:0, left:0}"
          pageSize="original"
          :watermarkConfig="watermarkConfig"
      >
        <!-- 水印覆盖层 -->
        <template #watermark-layer>
          <div class="watermark-overlay" :style="watermarkStyle">
            <div v-for="n in 100" :key="n" class="watermark-item">
              {{ watermarkConfig.text }}
            </div>
          </div>
        </template>
      </PDFPreview>
    </div>

    <!-- 空状态提示 -->
    <div v-else class="empty-state">
      <v-icon size="80" color="grey-lighten-2">mdi-file-document-outline</v-icon>
      <p class="text-grey mt-2">请先上传 PDF 文件以预览</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PDFPreview from '@/components/PDFPreview.vue'

const props = defineProps({
  previewFiles: {
    type: Array,
    default: () => []
  },
  watermarkConfig: {
    type: Object,
    required: true
  }
})

// 水印样式计算
const watermarkStyle = computed(() => ({
  '--wm-text': `"${props.watermarkConfig.text}"`,
  '--wm-color': props.watermarkConfig.color,
  '--wm-opacity': props.watermarkConfig.opacity,
  '--wm-size': `${props.watermarkConfig.fontSize}px`,
  '--wm-rotate': `${props.watermarkConfig.rotation}deg`,
  '--wm-gap': `${props.watermarkConfig.gap}px`,
  '--wm-x': `${props.watermarkConfig.offsetX}px`,
  '--wm-y': `${props.watermarkConfig.offsetY}px`,
}))
</script>

<style scoped>
.preview-area {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.preview-container {
  flex: 1;
  overflow: hidden;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

/* 水印覆盖层样式 */
.watermark-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  align-content: space-around;
  overflow: hidden;
  z-index: 100;
}

.watermark-item {
  color: var(--wm-color);
  opacity: var(--wm-opacity);
  font-size: var(--wm-size);
  transform: rotate(var(--wm-rotate)) translate(var(--wm-x), var(--wm-y));
  margin: calc(var(--wm-gap) / 2);
  white-space: nowrap;
  user-select: none;
  font-weight: bold;
  font-family: Arial, sans-serif;
}

/* 深色模式适配 */
:deep(.pdf-preview) {
  background: white;
}

:root[data-theme="dark"] :deep(.pdf-preview) {
  background: #1e1e1e;
}

/* 深色模式空状态 */
:root[data-theme="dark"] .empty-state .v-icon {
  color: #424242 !important;
}

:root[data-theme="dark"] .empty-state p {
  color: #9e9e9e;
}
</style>
