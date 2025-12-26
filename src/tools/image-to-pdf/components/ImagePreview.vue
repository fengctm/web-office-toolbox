<template>
  <v-card class="image-preview" elevation="2">
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon color="primary" class="mr-2">mdi-eye</v-icon>
        <span class="text-h6">图片预览</span>
      </div>
      <v-chip color="primary" variant="outlined" size="small">
        {{ currentIndex + 1 }} / {{ images.length }}
      </v-chip>
    </v-card-title>

    <v-card-text class="preview-container">
      <!-- 预览区域 -->
      <div class="preview-area mb-4">
        <v-sheet
            class="a4-page mx-auto"
            elevation="4"
        >
          <div v-if="currentImage" class="image-container">
            <img
                :src="currentImage.preview"
                :alt="currentImage.file.name"
                class="preview-image"
                @load="handleImageLoad"
                @error="handleImageError"
            />
          </div>
          <div v-else class="empty-state">
            <v-icon size="64" color="grey">mdi-image-off</v-icon>
            <div class="text-grey mt-2">无图片</div>
          </div>
        </v-sheet>
      </div>

      <!-- 图片信息 -->
      <div v-if="currentImage" class="image-info text-center mb-4">
        <div class="text-h6 font-weight-bold mb-1">{{ currentImage.file.name }}</div>
        <div class="text-caption text-grey">
          {{ formatFileSize(currentImage.file.size) }} •
          {{ currentImage.file.type }}
        </div>
      </div>

      <!-- 导航控制 -->
      <div class="navigation-controls d-flex justify-center align-center">
        <v-btn
            icon="mdi-chevron-left"
            variant="outlined"
            :disabled="currentIndex === 0"
            @click="previousImage"
            class="mr-2"
        />

        <v-slider
            v-model="currentIndex"
            :min="0"
            :max="images.length - 1"
            :step="1"
            hide-details
            class="slider mx-2"
            @update:modelValue="handleSliderChange"
        />

        <v-btn
            icon="mdi-chevron-right"
            variant="outlined"
            :disabled="currentIndex === images.length - 1"
            @click="nextImage"
            class="ml-2"
        />
      </div>
    </v-card-text>

    <v-card-actions class="justify-space-between px-4 pb-4">
      <v-btn
          color="grey"
          variant="text"
          prepend-icon="mdi-arrow-left"
          @click="handleBack"
      >
        返回排序
      </v-btn>
      <v-btn
          color="primary"
          size="large"
          prepend-icon="mdi-file-pdf-box"
          @click="handleGenerate"
          class="px-6"
      >
        生成 PDF
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import {ref, computed, watch, onMounted, onUnmounted} from 'vue'

const props = defineProps({
  images: {
    type: Array,
    required: true
  },
  startIndex: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['back', 'generate'])

const currentIndex = ref(props.startIndex)

const currentImage = computed(() => {
  return props.images[currentIndex.value] || null
})

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const previousImage = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

const nextImage = () => {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++
  }
}

const handleSliderChange = (value) => {
  currentIndex.value = value
}

const handleBack = () => {
  emit('back')
}

const handleGenerate = () => {
  emit('generate')
}

// 图片加载处理
const handleImageLoad = () => {
  console.log('图片加载成功')
}

const handleImageError = (event) => {
  console.error('图片加载失败:', event)
}

// 键盘导航
const handleKeydown = (event) => {
  if (event.key === 'ArrowLeft') {
    previousImage()
  } else if (event.key === 'ArrowRight') {
    nextImage()
  }
}

// 监听键盘事件
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// 监听图片数组变化，重置索引
watch(() => props.images, (newImages) => {
  if (newImages.length === 0) {
    currentIndex.value = 0
  } else if (currentIndex.value >= newImages.length) {
    currentIndex.value = newImages.length - 1
  }
})
</script>

<style scoped>
.preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 400px;
}

.a4-page {
  width: 100%;
  max-width: 320px;
  height: 452px; /* A4 比例 1:1.414 */
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  border: 2px solid rgba(0, 150, 136, 0.3);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.a4-page:hover {
  border-color: #009688;
  box-shadow: 0 8px 24px rgba(0, 150, 136, 0.2);
}

.image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border-radius: 4px;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.image-info {
  background: rgba(0, 150, 136, 0.05);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 150, 136, 0.1);
}

.navigation-controls {
  width: 100%;
  max-width: 400px;
}

.slider {
  min-width: 200px;
}

:deep(.v-slider__thumb) {
  background: #009688;
}

:deep(.v-slider__track) {
  background: rgba(0, 150, 136, 0.2);
}

:deep(.v-slider__track-fill) {
  background: #009688;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .a4-page {
    max-width: 240px;
    height: 339px;
  }

  .navigation-controls {
    flex-direction: column;
    gap: 12px;
  }

  .slider {
    width: 100%;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .a4-page {
    border-color: rgba(0, 150, 136, 0.4);
  }

  .image-info {
    background: rgba(0, 150, 136, 0.1);
    border-color: rgba(0, 150, 136, 0.2);
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
</style>
