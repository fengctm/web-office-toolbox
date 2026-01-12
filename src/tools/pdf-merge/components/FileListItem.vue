<template>
  <v-card class="file-card transition-card" :class="{ 'is-dragging': isDragging }" elevation="1" border>
    <div class="d-flex align-center pa-3">
      <!-- 拖拽手柄 -->
      <div class="drag-handle mr-3">
        <v-icon color="grey-lighten-1">mdi-drag-vertical</v-icon>
      </div>

      <!-- 缩略图 -->
      <div class="thumbnail-box mr-3">
        <img v-if="item.thumbnail" :src="item.thumbnail" class="thumb-img">
        <v-skeleton-loader v-else type="image" class="thumb-skeleton"></v-skeleton-loader>
      </div>

      <!-- 文件信息 -->
      <div class="file-info flex-grow-1 overflow-hidden">
        <div class="d-flex align-center">
          <v-chip size="x-small" color="teal-darken-1" class="mr-2">{{ index + 1 }}</v-chip>
          <div class="text-subtitle-1 font-weight-medium text-truncate">
            {{ item.file.name }}
          </div>
        </div>
        <div class="text-caption text-medium-emphasis mt-1">
          {{ item.pageCount }} 页 · {{ formatSize(item.file.size) }}
        </div>
      </div>

      <!-- 删除按钮 -->
      <v-btn
          icon="mdi-close"
          size="small"
          variant="text"
          color="error"
          @click="$emit('remove')"
      ></v-btn>
    </div>
  </v-card>
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  isDragging: {
    type: Boolean,
    default: false
  }
})

defineEmits(['remove'])

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped lang="scss">
// Apple 风格的贝塞尔曲线
$apple-ease: cubic-bezier(0.25, 0.1, 0.25, 1);

.file-card {
  border: 1px solid rgba(var(--v-border-color), 0.2);
  transition: all 0.3s $apple-ease;

  &:hover {
    border-color: rgb(var(--v-theme-primary));
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }

  &.is-dragging {
    opacity: 0.5;
    background: rgba(var(--v-theme-primary), 0.05);
  }
}

.drag-handle {
  cursor: grab;
  opacity: 0.5;
  transition: opacity 0.2s;

  &:active {
    cursor: grabbing;
    opacity: 1;
  }
}

.thumbnail-box {
  width: 48px;
  height: 64px;
  border-radius: 4px;
  overflow: hidden;
  background: #eee;
  flex-shrink: 0;

  .thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.v-theme--dark .thumbnail-box {
  background: #333;
}

.file-info {
  min-width: 0; // 防止 flex 溢出
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>