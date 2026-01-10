<template>
  <div class="file-upload-section">
    <PDFSecureUpload
        label="选择或拖拽 PDF 文件"
        @success="handleFileSelected"
        @reset="handleReset"
    />
  </div>
</template>

<script setup>
import PDFSecureUpload from '@/components/PDFSecureUpload.vue'

const emit = defineEmits(['file-selected', 'reset'])

const handleFileSelected = (result) => {
  emit('file-selected', result)
}

const handleReset = () => {
  emit('reset')
}
</script>

<style scoped lang="scss">
// Apple 风格的贝塞尔曲线
$apple-ease: cubic-bezier(0.25, 0.1, 0.25, 1);

.file-upload-section {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  box-sizing: border-box;
}

// 深色模式适配（通过 PDFSecureUpload 内部处理）
</style>