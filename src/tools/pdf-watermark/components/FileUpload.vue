<template>
  <!-- 使用已有的 PDFSecureUpload 公共组件 -->
  <PDFSecureUpload
      :label="label"
      @reset="handleReset"
      @success="handleSuccess"
  />
</template>

<script setup>
import {defineEmits, defineProps} from 'vue'
import PDFSecureUpload from '@/components/PDFSecureUpload.vue'

const emit = defineEmits(['file-loaded', 'password-submitted', 'error', 'reset'])

const props = defineProps({
  label: {
    type: String,
    default: '选择或拖拽 PDF'
  }
})

// PDFSecureUpload 的 success 事件返回 { file, password }
const handleSuccess = (result) => {
  emit('file-loaded', result.file)
  if (result.password) {
    emit('password-submitted', result.password)
  }
}

const handleReset = () => {
  emit('reset')
}
</script>

<style scoped>
/* 组件不需要额外样式，所有样式都在公共组件中 */
</style>