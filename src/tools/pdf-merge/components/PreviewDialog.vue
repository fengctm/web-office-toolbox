<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" fullscreen>
    <v-card class="pa-0 overflow-hidden">
      <v-toolbar class="apple-glass-toolbar" flat>
        <v-btn icon="mdi-arrow-left" variant="text" @click="$emit('update:modelValue', false)">关闭</v-btn>
        <v-toolbar-title class="ml-4">PDF智能组装台 - 预览</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn color="teal" variant="tonal" @click="$emit('merge')">立即合并下载</v-btn>
      </v-toolbar>

      <div class="preview-wrapper">
        <PDFPreview
            v-if="files.length > 0"
            :files="files"
            :watermark-config="{ text: '预览模式', opacity: 0.1 }"
        />
        <div v-else class="pa-10 text-center">暂无文件</div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import PDFPreview from '@/components/PDFPreview.vue'

defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  files: {
    type: Array,
    default: () => []
  }
})

defineEmits(['update:modelValue', 'merge'])
</script>

<style scoped lang="scss">
.apple-glass-toolbar {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.v-theme--dark .apple-glass-toolbar {
  background: rgba(30, 30, 30, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.preview-wrapper {
  height: calc(100vh - 48px);
  background-color: #525659;
}
</style>