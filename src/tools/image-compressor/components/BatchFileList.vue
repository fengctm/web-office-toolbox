<template>
  <div class="file-list-panel">
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="text-subtitle-1 font-weight-medium">
        文件列表
        <v-chip size="small" color="teal" variant="tonal" class="ml-2">
          {{ files.length }} 个文件
        </v-chip>
      </div>
      <v-btn
        v-if="files.length > 0"
        variant="text"
        size="small"
        color="error"
        prepend-icon="mdi-delete-outline"
        @click="$emit('clear')"
      >
        清空全部
      </v-btn>
    </div>

    <!-- 空状态 -->
    <div v-if="files.length === 0" class="text-center pa-8 text-medium-emphasis">
      <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-image-plus</v-icon>
      <div>请选择图片文件</div>
    </div>

    <!-- 文件列表 -->
    <div v-else class="file-list">
      <transition-group name="list" tag="div">
        <div
          v-for="item in files"
          :key="item.id"
          class="file-item d-flex align-center pa-3 rounded-lg mb-2"
          :class="statusClass(item.status)"
        >
          <!-- 缩略图 -->
          <div class="file-thumb mr-3 rounded">
            <v-img
              v-if="getObjectUrl(item)"
              :src="getObjectUrl(item)"
              width="48"
              height="48"
              cover
              class="rounded"
            />
            <v-icon v-else size="48" color="grey">mdi-file-image</v-icon>
          </div>

          <!-- 文件信息 -->
          <div class="flex-grow-1 min-width-0">
            <div class="text-body-2 font-weight-medium text-truncate">
              {{ item.file.name }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ formatFileSize(item.file.size) }}
              <template v-if="item.status === 'done' && item.result">
                →
                <span class="text-teal font-weight-bold">
                  {{ formatFileSize(item.result.blob.size) }}
                </span>
                <span v-if="sizeChange(item) > 0" class="text-success">
                  (减少 {{ sizeChange(item) }}%)
                </span>
                <span v-else class="text-error">
                  (增加 {{ Math.abs(sizeChange(item)) }}%)
                </span>
              </template>
            </div>
            <div v-if="item.status === 'failed'" class="text-caption text-error">
              {{ item.error }}
            </div>
          </div>

          <!-- 状态/操作 -->
          <div class="d-flex align-center ga-1 ml-2">
            <!-- 压缩中 -->
            <v-progress-circular
              v-if="item.status === 'compressing'"
              size="24"
              width="3"
              color="teal"
              indeterminate
            />

            <!-- 完成 → 下载 -->
            <v-btn
              v-if="item.status === 'done'"
              icon="mdi-download"
              size="small"
              variant="text"
              color="teal"
              @click="$emit('download', item.id)"
            />

            <!-- 失败 → 重试 -->
            <v-btn
              v-if="item.status === 'failed'"
              icon="mdi-refresh"
              size="small"
              variant="text"
              color="warning"
              @click="$emit('retry', item.id)"
            />

            <!-- 删除 -->
            <v-btn
              icon="mdi-close"
              size="small"
              variant="text"
              color="grey"
              :disabled="item.status === 'compressing'"
              @click="$emit('remove', item.id)"
            />
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { formatFileSize } from '@/utils-scripts/ImageHelper.js'

defineProps({
  files: { type: Array, required: true },
})

defineEmits(['remove', 'clear', 'download', 'retry'])

// 缓存 Object URL
const urlCache = new Map()

function getObjectUrl(item) {
  if (urlCache.has(item.id)) return urlCache.get(item.id)
  if (item.status === 'done' && item.result?.blob) {
    const url = URL.createObjectURL(item.result.blob)
    urlCache.set(item.id, url)
    return url
  }
  // 原图预览
  const url = URL.createObjectURL(item.file)
  urlCache.set(item.id, url)
  return url
}

function sizeChange(item) {
  if (!item.result?.blob?.size || !item.file?.size) return 0
  return ((1 - item.result.blob.size / item.file.size) * 100).toFixed(1)
}

function statusClass(status) {
  return {
    'bg-surface': status === 'pending',
    'bg-teal-lighten-5': status === 'compressing',
    'bg-success-lighten-5': status === 'done',
    'bg-error-lighten-5': status === 'failed',
  }
}
</script>

<style scoped>
.file-item {
  border: 1px solid rgb(var(--v-border-color));
  transition: all 0.2s ease;
}

.file-item:hover {
  border-color: rgba(var(--v-theme-teal), 0.5);
}

.file-thumb {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  background: rgb(var(--v-theme-surface-variant));
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
