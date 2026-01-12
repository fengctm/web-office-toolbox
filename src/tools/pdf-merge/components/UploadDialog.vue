<template>
  <v-dialog
      :model-value="modelValue"
      @update:model-value="handleDialogChange"
      max-width="500px"
      persistent
  >
    <v-card class="pa-0 overflow-hidden" elevation="0">
      <v-toolbar class="apple-glass-toolbar" flat>
        <v-toolbar-title class="text-subtitle-1 font-weight-bold">添加 PDF 文件</v-toolbar-title>
        <v-btn icon="mdi-close" variant="text" @click="handleClose"></v-btn>
      </v-toolbar>

      <div class="pa-6">
        <!-- 使用 key 强制重新渲染组件，确保每次打开都是初始状态 -->
        <PDFSecureUpload
            :key="componentKey"
            label="选择需要添加的 PDF"
            @success="handleSuccess"
            @reset="handleReset"
        />
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import {ref} from 'vue'
import PDFSecureUpload from '@/components/PDFSecureUpload.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'success', 'reset'])

// 使用 key 强制重新渲染组件
const componentKey = ref(0)

const handleDialogChange = (value) => {
  if (value) {
    // 对话框打开时，重置组件状态
    componentKey.value += 1
  }
  emit('update:modelValue', value)
}

const handleClose = () => {
  emit('update:modelValue', false)
  // 延迟一点重置，让动画更自然
  setTimeout(() => {
    componentKey.value += 1
  }, 300)
}

const handleSuccess = (result) => {
  emit('success', result)
  emit('update:modelValue', false)
  // 重置组件为下次使用
  setTimeout(() => {
    componentKey.value += 1
  }, 300)
}

const handleReset = () => {
  emit('reset')
}
</script>

<style scoped lang="scss">
// Apple 风格的贝塞尔曲线
$apple-ease: cubic-bezier(0.25, 0.1, 0.25, 1);

.apple-glass-toolbar {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.v-theme--dark .apple-glass-toolbar {
  background: rgba(30, 30, 30, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
</style>