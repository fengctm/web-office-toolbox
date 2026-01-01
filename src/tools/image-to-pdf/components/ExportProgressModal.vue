<template>
  <v-dialog :model-value="modelValue" @update:model-value="updateModelValue" max-width="450" persistent>
    <v-card>
      <v-card-title class="d-flex align-center bg-primary text-on-primary">
        <v-icon class="mr-2">mdi-file-pdf-box</v-icon>
        正在生成 PDF
      </v-card-title>

      <v-card-text class="pa-4">
        <!-- 主进度条 -->
        <div class="mb-4">
          <v-progress-linear
              :model-value="progress"
              color="primary"
              height="25"
              striped
              rounded
          >
            <template v-slot:default="{ value }">
              <strong>{{ Math.round(value) }}%</strong>
            </template>
          </v-progress-linear>
        </div>

        <!-- 详细状态 -->
        <div class="text-body-2 mb-3">
          <div class="d-flex justify-space-between mb-1">
            <span>当前进度:</span>
            <span class="font-weight-medium">{{ currentPage }} / {{ totalPages }}</span>
          </div>
          <div class="d-flex justify-space-between mb-1">
            <span>处理速度:</span>
            <span class="font-weight-medium">{{ processingSpeed }}</span>
          </div>
          <div class="d-flex justify-space-between">
            <span>预计剩余:</span>
            <span class="font-weight-medium">{{ estimatedTime }}</span>
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
          <div class="mt-2 text-on-surface-variant">Worker 线程运行中，UI保持响应</div>
        </v-alert>

        <v-alert
          v-else
          type="success"
          variant="tonal"
          icon="mdi-check-circle-outline"
          class="mt-3 text-caption"
        >
          处理完成！正在准备下载...
        </v-alert>

        <!-- 性能指标 -->
        <div v-if="progress > 0 && progress < 100" class="mt-3 text-caption text-on-surface-variant">
          <div>内存使用: {{ memoryUsage }}</div>
          <div>线程状态: Worker 运行中</div>
        </div>
      </v-card-text>

      <v-card-actions class="justify-center bg-surface-variant">
        <v-btn
          color="error"
          variant="tonal"
          @click="cancel"
          :disabled="progress >= 100"
          prepend-icon="mdi-close"
        >
          取消导出
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
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

const emit = defineEmits(['update:modelValue', 'cancel'])

// 性能指标
const startTime = ref(Date.now())
const processingSpeed = ref('计算中...')
const memoryUsage = ref('计算中...')

// 更新模型值
const updateModelValue = (value) => {
  emit('update:modelValue', value)
  if (value) {
    startTime.value = Date.now()
    processingSpeed.value = '计算中...'
    memoryUsage.value = '计算中...'
  }
}

// 估算剩余时间
const estimatedTime = computed(() => {
  if (props.progress <= 0 || props.progress >= 100) return '计算中...'

  const elapsed = (Date.now() - startTime.value) / 1000
  const remainingPages = props.totalPages - props.currentPage
  const avgTimePerPage = elapsed / (props.currentPage || 1)
  const remainingSeconds = remainingPages * avgTimePerPage

  if (remainingSeconds < 60) {
    return `${Math.ceil(remainingSeconds)}秒`
  } else {
    const minutes = Math.floor(remainingSeconds / 60)
    const seconds = Math.ceil(remainingSeconds % 60)
    return `${minutes}分${seconds}秒`
  }
})

// 监听进度变化，更新性能指标
watch(() => props.currentPage, (current) => {
  if (current > 0) {
    const elapsed = (Date.now() - startTime.value) / 1000
    const speed = (current / elapsed).toFixed(1)
    processingSpeed.value = `${speed} 页/秒`

    // 估算内存使用（基于浏览器性能API）
    if (performance.memory) {
      const usedMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)
      memoryUsage.value = `${usedMB} MB`
    } else {
      memoryUsage.value = 'N/A'
    }
  }
})

// 取消
const cancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

<style scoped>
/* 组件样式 */
</style>
