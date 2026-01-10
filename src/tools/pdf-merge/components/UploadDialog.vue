<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="500px" persistent>
    <v-card class="pa-0 overflow-hidden" elevation="0">
      <v-toolbar class="apple-glass-toolbar" flat>
        <v-toolbar-title class="text-subtitle-1 font-weight-bold">添加 PDF 文件</v-toolbar-title>
        <v-btn icon="mdi-close" variant="text" @click="$emit('update:modelValue', false)"></v-btn>
      </v-toolbar>

      <div class="pa-6">
        <PDFSecureUpload
            label="选择需要添加的 PDF"
            @success="handleSuccess"
            @reset="$emit('reset')"
        />
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import PDFSecureUpload from '@/components/PDFSecureUpload.vue'

defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'success', 'reset'])

const handleSuccess = (result) => {
  emit('success', result)
  emit('update:modelValue', false)
}
</script>

<style scoped lang="scss">
// Apple 风格的贝塞尔曲线
$apple-ease: cubic-bezier(0.25, 0.1, 0.25, 1);

.apple-glass-toolbar {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.v-theme--dark .apple-glass-toolbar {
  background: rgba(30, 30, 30, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
</style>