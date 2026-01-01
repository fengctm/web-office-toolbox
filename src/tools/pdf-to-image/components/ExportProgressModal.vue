<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="updateModelValue"
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

      <v-card-text class="pa-4">
        <!-- 真实进度条 -->
        <div class="mb-4">
          <v-progress-linear
            :model-value="progress"
            color="teal"
            height="25"
            striped
            rounded
          >
            <template v-slot:default="{ value }">
              <strong>{{ Math.ceil(value) }}%</strong>
            </template>
          </v-progress-linear>
        </div>

        <!-- 详细信息 -->
        <div class="text-body-2 mb-2">
          <div class="d-flex justify-space-between">
            <span>当前页码:</span>
            <span class="font-weight-medium">{{ currentPage }} / {{ totalPages }}</span>
          </div>
          <div class="d-flex justify-space-between">
            <span>图片格式:</span>
            <span class="font-weight-medium">{{ format.toUpperCase() }}</span>
          </div>
          <div class="d-flex justify-space-between">
            <span>图片质量:</span>
            <span class="font-weight-medium">{{ qualityLabels[quality] }}</span>
          </div>
        </div>

        <!-- 状态提示 -->
        <v-alert
          v-if="progress < 100"
          type="info"
          variant="tonal"
          icon="mdi-clock-outline"
          class="mt-3 text-caption"
        >
          正在处理第 {{ currentPage }} 页，请勿关闭窗口...
        </v-alert>

        <v-alert
          v-else
          type="success"
          variant="tonal"
          icon="mdi-check-circle-outline"
          class="mt-3 text-caption"
        >
          处理完成！正在打包下载...
        </v-alert>
      </v-card-text>

      <v-card-actions class="justify-center">
        <v-btn
          color="error"
          variant="tonal"
          @click="cancel"
          :disabled="progress >= 100"
        >
          取消导出
        </v-btn>
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
  },
  progress: {
    type: Number,
    default: 0
  },
  currentPage: {
    type: Number,
    default: 0
  },
  totalPages: {
    type: Number,
    default: 0
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

// 更新模型值
const updateModelValue = (value) => {
  emit('update:modelValue', value)
}

// 取消导出
const cancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}

.v-progress-linear {
  font-weight: bold;
}

/* 深色模式适配 */
.v-theme--dark .text-body-2 {
  color: rgba(255, 255, 255, 0.87);
}
</style>
