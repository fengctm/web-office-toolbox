<template>
  <v-dialog
    v-model="modelValue"
    max-width="400"
    persistent
  >
    <v-card>
      <v-toolbar color="teal-darken-2">
        <v-toolbar-title>
          <v-icon start icon="mdi-download"></v-icon>
          导出进度
        </v-toolbar-title>
      </v-toolbar>

      <v-card-text class="text-center pa-6">
        <v-progress-circular
          indeterminate
          size="64"
          width="4"
          color="teal"
          class="mb-4"
        ></v-progress-circular>

        <div class="text-h6 mb-2">正在处理...</div>
        <div class="text-body-2 text-grey mb-4">
          格式: {{ format.toUpperCase() }} |
          质量: {{ qualityLabels[quality] }}
        </div>

        <v-alert type="info" variant="tonal" icon="mdi-clock-outline" class="mt-3">
          大文件可能需要较长时间，请耐心等待...
        </v-alert>
      </v-card-text>

      <v-card-actions class="justify-center">
        <v-btn color="grey" variant="text" @click="cancel">取消</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  format: {
    type: String,
    default: 'png'
  },
  quality: {
    type: Number,
    default: 2
  }
})

const emit = defineEmits([
  'update:modelValue',
  'cancel'
])

// 质量标签
const qualityLabels = {
  1: '低',
  2: '中',
  3: '高'
}

// 计算属性：双向绑定对话框状态
const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 取消导出
const cancel = () => {
  emit('cancel')
}
</script>

<style scoped>
/* 组件样式 */
</style>
