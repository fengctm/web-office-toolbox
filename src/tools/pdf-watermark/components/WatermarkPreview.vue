<template>
  <div class="pdf-viewer flex-grow-1 pa-6">
    <div class="viewer-canvas mx-auto elevation-10 relative">
      <!-- 使用公共 PDFPreview 组件 -->
      <PDFPreview
        :images="[{ preview: mockPreview }]"
        :watermark-config="watermarkConfig"
      />
    </div>
    <div class="text-center mt-4 text-grey-darken-1 text-caption">
      文件名：{{ file.name }} | 水印预览
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PDFPreview from '@/components/PDFPreview.vue'

const props = defineProps({
  file: Object,
  settings: Object
})

// 水印配置
const watermarkConfig = computed(() => ({
  text: props.settings.text,
  opacity: props.settings.opacity,
  color: props.settings.color,
  size: props.settings.fontSize,
  rotate: props.settings.rotation,
  count: props.settings.density * 2
}))

// 模拟预览图（实际应使用 pdf.js 渲染真实PDF）
// 这里使用一个简单的 SVG 作为占位符
const mockPreview = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjcwNyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ3aGl0ZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QREYgUHJldmlldyAoTW9jayk8L3RleHQ+PC9zdmc+'
</script>

<style scoped>
.pdf-viewer {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-y: auto;
}

.viewer-canvas {
  background: white;
  width: 100%;
  max-width: 500px;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}
</style>
