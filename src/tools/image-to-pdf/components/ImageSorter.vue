<template>
  <v-card class="image-sorter" elevation="2">
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon color="primary" class="mr-2">mdi-sort-variant</v-icon>
        <span class="text-h6">图片排序</span>
      </div>
      <v-chip color="primary" variant="outlined" size="small">
        {{ images.length }} 张图片
      </v-chip>
    </v-card-title>

    <v-card-text>
      <v-list class="sort-list">
        <v-list-item
          v-for="(item, index) in images"
          :key="item.id"
          class="sort-item mb-2"
          :class="{
            'dragging': draggingIndex === index,
            'drag-over': dragOverIndex === index && draggingIndex !== null,
            'drag-above': dragOverIndex === index && draggingIndex !== null && draggingIndex > index,
            'drag-below': dragOverIndex === index && draggingIndex !== null && draggingIndex < index
          }"
          draggable="true"
          @dragstart="handleDragStart(index)"
          @dragover.prevent="handleDragOver(index)"
          @drop="handleDrop(index)"
          @dragend="handleDragEnd"
        >
          <template #prepend>
            <div class="drag-handle-wrapper">
              <v-icon class="drag-handle">mdi-drag-horizontal</v-icon>
              <span class="drag-index">{{ index + 1 }}</span>
            </div>
          </template>

          <template #title>
            <div class="d-flex align-center">
              <span class="page-number mr-2">{{ index + 1 }}</span>
              <span class="file-name">{{ item.file.name }}</span>
            </div>
          </template>

          <template #subtitle>
            <span class="text-caption text-grey">{{ formatFileSize(item.file.size) }}</span>
          </template>

          <template #append>
            <v-avatar size="56" class="mr-2 preview-avatar">
              <v-img :src="item.preview" cover class="preview-img" />
            </v-avatar>
            <v-btn
              icon="mdi-eye"
              variant="text"
              size="small"
              color="primary"
              @click="handlePreview(index)"
              class="preview-btn"
            />
          </template>
        </v-list-item>
      </v-list>

      <v-alert
        v-if="images.length === 0"
        type="info"
        variant="tonal"
        class="mt-4"
      >
        暂无图片，请返回上传步骤
      </v-alert>
    </v-card-text>

    <v-card-actions class="justify-space-between px-4 pb-4">
      <v-btn
        color="grey"
        variant="text"
        prepend-icon="mdi-arrow-left"
        @click="handleBack"
      >
        返回上传
      </v-btn>
      <v-btn
        color="primary"
        size="large"
        :disabled="images.length === 0"
        prepend-icon="mdi-eye"
        @click="handlePreviewAll"
        class="px-6"
      >
        预览所有
      </v-btn>
      <v-btn
        color="primary"
        size="large"
        :disabled="images.length === 0"
        prepend-icon="mdi-file-pdf-box"
        @click="handleGenerate"
        class="px-6"
      >
        生成 PDF
      </v-btn>
    </v-card-actions>

    <!-- 拖拽时的视觉反馈 -->
    <v-overlay
      v-model="showDropIndicator"
      class="drag-overlay"
      :scrim="false"
    >
      <div class="drag-indicator">
        <v-icon size="64" color="primary">mdi-arrow-up-down</v-icon>
        <div class="text-h6 mt-4">释放以重新排序</div>
      </div>
    </v-overlay>
  </v-card>
</template>

<script setup>
import { ref, reactive } from 'vue'

const props = defineProps({
  initialFiles: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['back', 'preview', 'generate'])

const images = ref([])
const draggingIndex = ref(null)
const dragOverIndex = ref(null)
const showDropIndicator = ref(false)

// 初始化图片数据
const initImages = async () => {
  images.value = await Promise.all(
    props.initialFiles.map(async (file, index) => ({
      id: `img-${Date.now()}-${index}`,
      file,
      preview: await readFileAsDataURL(file)
    }))
  )
}

const readFileAsDataURL = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.readAsDataURL(file)
  })
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 拖拽处理
const handleDragStart = (index) => {
  draggingIndex.value = index
  dragOverIndex.value = null
  showDropIndicator.value = true
}

const handleDragOver = (index) => {
  if (draggingIndex.value !== null && draggingIndex.value !== index) {
    dragOverIndex.value = index
  }
}

const handleDrop = (targetIndex) => {
  if (draggingIndex.value !== null && draggingIndex.value !== targetIndex) {
    // 重新排序
    const draggedItem = images.value[draggingIndex.value]
    images.value.splice(draggingIndex.value, 1)
    images.value.splice(targetIndex, 0, draggedItem)
  }
}

const handleDragEnd = () => {
  draggingIndex.value = null
  dragOverIndex.value = null
  showDropIndicator.value = false
}

// 操作处理
const handlePreview = (index) => {
  emit('preview', images.value, index)
}

const handlePreviewAll = () => {
  emit('preview', images.value, 0)
}

const handleGenerate = () => {
  emit('generate', images.value)
}

const handleBack = () => {
  emit('back')
}

// 初始化
initImages()
</script>

<style scoped>
.sort-list {
  background: transparent;
}

.sort-item {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 150, 136, 0.1);
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: grab;
}

.sort-item:hover {
  background: rgba(0, 150, 136, 0.05);
  border-color: rgba(0, 150, 136, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.sort-item.dragging {
  opacity: 0.7;
  cursor: grabbing;
  transform: rotate(3deg) scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 150, 136, 0.3);
  border-color: #009688;
  background: rgba(0, 150, 136, 0.1);
}

.sort-item.drag-over {
  border-color: #009688;
  background: rgba(0, 150, 136, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 150, 136, 0.2);
}

.sort-item.drag-above {
  border-top: 3px solid #009688;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  margin-top: -2px;
}

.sort-item.drag-below {
  border-bottom: 3px solid #009688;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  margin-bottom: -2px;
}

.drag-handle-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.drag-handle {
  cursor: grab;
  color: #666;
  font-size: 18px;
}

.drag-index {
  font-size: 10px;
  font-weight: bold;
  color: #009688;
  background: rgba(0, 150, 136, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
}

.page-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #009688;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  margin-right: 8px;
  transition: all 0.2s ease;
}

.sort-item.dragging .page-number {
  background: #fff;
  color: #009688;
  transform: scale(1.1);
}

.file-name {
  font-weight: 500;
  transition: all 0.2s ease;
}

.sort-item.dragging .file-name {
  font-weight: 600;
  color: #009688;
}

.preview-avatar {
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.sort-item:hover .preview-avatar {
  border-color: rgba(0, 150, 136, 0.3);
  transform: scale(1.05);
}

.preview-img {
  border-radius: 4px;
}

.preview-btn {
  opacity: 0;
  transform: translateX(8px);
  transition: all 0.2s ease;
}

.sort-item:hover .preview-btn {
  opacity: 1;
  transform: translateX(0);
}

.drag-overlay {
  pointer-events: none;
}

.drag-indicator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.95);
  padding: 32px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.05);
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .sort-item {
    background: rgba(30, 30, 30, 0.95);
    border-color: rgba(0, 150, 136, 0.2);
  }

  .sort-item:hover {
    background: rgba(0, 150, 136, 0.1);
  }

  .sort-item.dragging {
    background: rgba(0, 150, 136, 0.2);
    border-color: #009688;
  }

  .sort-item.drag-over {
    background: rgba(0, 150, 136, 0.25);
  }

  .drag-handle {
    color: #aaa;
  }

  .drag-index {
    background: rgba(0, 150, 136, 0.2);
    color: #4dd0e1;
  }

  .drag-indicator {
    background: rgba(30, 30, 30, 0.95);
  }

  .file-name {
    color: #e0e0e0;
  }

  .sort-item.dragging .file-name {
    color: #4dd0e1;
  }
}

/* 修复全局对话框和覆盖层定位 - 确保不会漂移 */
:deep(.v-dialog),
:deep(.v-overlay__content) {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  max-width: 90vw !important;
  max-height: 90vh !important;
  overflow-y: auto !important;
}

:deep(.v-overlay) {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 2400 !important;
}

/* 修复移动端对话框 */
@media (max-width: 768px) {
  :deep(.v-dialog),
  :deep(.v-overlay__content) {
    max-width: 95vw !important;
    max-height: 95vh !important;
    margin: 0 !important;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sort-item {
    padding: 8px 12px;
  }

  .preview-avatar {
    width: 48px;
    height: 48px;
  }

  .drag-handle-wrapper {
    gap: 2px;
  }

  .drag-index {
    font-size: 9px;
    padding: 1px 4px;
  }
}
</style>
