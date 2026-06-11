<template>
  <div v-if="totalFiles > 0" class="batch-progress">
    <div class="d-flex align-center justify-space-between mb-2">
      <span class="text-body-2 font-weight-medium">
        压缩进度
      </span>
      <span class="text-body-2 text-medium-emphasis">
        {{ completedCount + failedCount }} / {{ totalFiles }}
      </span>
    </div>

    <v-progress-linear
      :model-value="progressPercent"
      :color="progressColor"
      height="8"
      rounded
      class="mb-2"
    />

    <!-- 当前文件名 -->
    <div v-if="compressing && currentFileName" class="text-caption text-medium-emphasis mb-2">
      正在压缩: {{ currentFileName }}
    </div>

    <!-- 统计信息 -->
    <div v-if="completedCount + failedCount > 0" class="d-flex ga-4 text-caption flex-wrap">
      <span v-if="completedCount > 0" class="text-success">
        <v-icon size="14" class="mr-1">mdi-check-circle</v-icon>
        {{ completedCount }} 成功
      </span>
      <span v-if="failedCount > 0" class="text-error">
        <v-icon size="14" class="mr-1">mdi-alert-circle</v-icon>
        {{ failedCount }} 失败
      </span>
      <span v-if="totalOriginalSize > 0" class="text-teal">
        总体积: {{ formatFileSize(totalOriginalSize) }}
        → {{ formatFileSize(totalResultSize) }}
        <template v-if="parseFloat(sizeChangePercent) > 0">
          (减少 {{ sizeChangePercent }}%)
        </template>
        <template v-else-if="parseFloat(sizeChangePercent) < 0">
          (增加 {{ Math.abs(sizeChangePercent) }}%)
        </template>
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatFileSize } from '@/utils-scripts/ImageHelper.js'

const props = defineProps({
  totalFiles: { type: Number, default: 0 },
  completedCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  compressing: { type: Boolean, default: false },
  currentFileName: { type: String, default: '' },
  totalOriginalSize: { type: Number, default: 0 },
  totalResultSize: { type: Number, default: 0 },
  sizeChangePercent: { type: [String, Number], default: 0 },
})

const progressPercent = computed(() => {
  if (props.totalFiles === 0) return 0
  return Math.round((props.completedCount + props.failedCount) / props.totalFiles * 100)
})

const progressColor = computed(() => {
  if (props.failedCount > 0 && props.completedCount === 0) return 'error'
  if (props.failedCount > 0) return 'warning'
  return 'teal'
})
</script>

<style scoped>
.batch-progress {
  padding: 12px 16px;
  border-radius: 12px;
  background: rgb(var(--v-theme-surface-variant));
}
</style>
