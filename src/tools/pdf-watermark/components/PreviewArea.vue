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
        <!-- 水印覆盖层 - 使用统一的水印生成器 -->
        <template #watermark-layer>
          <div class="watermark-overlay" :style="watermarkStyle"></div>
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
import {computed} from 'vue'
import PDFPreview from '@/components/PDFPreview.vue'
import {generatePreviewStyle} from '../utils/watermark-generator.js'

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

// 使用统一的水印生成器生成样式
const watermarkStyle = computed(() => {
  return generatePreviewStyle(props.watermarkConfig);
})
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
  z-index: 100;
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

/* 深色模式下的预览容器 */
:root[data-theme="dark"] .preview-area {
  background-color: #121212;
}

/* 深色模式下的PDF预览背景增强 */
:root[data-theme="dark"] .preview-container {
  background-color: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
}
</style>
