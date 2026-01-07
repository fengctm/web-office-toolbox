<template>
  <div class="upload-section mb-6">
    <!-- 始终隐藏的文件输入 -->
    <input
        type="file"
        ref="fileInput"
        multiple
        accept="image/*"
        class="d-none"
        @change="onFileChange"
    />

    <!-- 上传区域 (空状态) -->
    <div
        v-if="imageList.length === 0"
        class="upload-zone d-flex flex-column align-center justify-center pa-12 rounded-lg elevation-2"
        @click="triggerFileInput"
        @dragover.prevent
        @drop.prevent="handleDrop"
        @dragenter.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        :class="{ 'dragging': isDragging }"
    >
      <v-icon
          size="80"
          color="primary"
          class="mb-4 icon-transition"
      >
        mdi-cloud-upload
      </v-icon>

      <div class="text-h6 mb-2 text-high-emphasis">点击或拖拽图片到此处</div>

      <div class="text-body-2 text-medium-emphasis mb-6">
        支持 JPG, PNG, WEBP (可多选)
      </div>

      <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          variant="tonal"
          size="large"
      >
        选择图片
      </v-btn>
    </div>

    <!-- 已添加图片提示 (非空状态) -->
    <div v-else class="added-info pa-4 rounded-lg elevation-1 d-flex align-center bg-surface">
      <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
      <div class="flex-grow-1">
        <div class="font-weight-bold text-high-emphasis">
          已添加 {{ imageList.length }} 张图片
        </div>
        <div class="text-caption text-medium-emphasis">
          可以继续添加更多图片，或进入下一步排序
        </div>
      </div>
      <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          variant="text"
          @click="triggerFileInput"
      >
        继续添加
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import {ref} from 'vue'

const props = defineProps({
  imageList: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['images-added', 'error'])

const fileInput = ref(null)
const isDragging = ref(false)

const triggerFileInput = () => {
  // 直接触发，不做异步等待
  if (fileInput.value) {
    fileInput.value.click()
  } else {
    console.error('fileInput ref is null')
    emit('error', '文件选择器未正确初始化')
  }
}

const onFileChange = (e) => {
  const files = Array.from(e.target.files)
  processFiles(files)
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
  processFiles(files)
}

const processFiles = async (files) => {
  if (files.length === 0) {
    emit('error', '请选择有效的图片文件')
    return
  }

  emit('images-added', [])

  const validFiles = []
  const errors = []

  for (const file of files) {
    try {
      if (!file.type.startsWith('image/')) {
        errors.push(`文件 "${file.name}" 格式不支持`)
        continue
      }

      if (file.size > 50 * 1024 * 1024) {
        errors.push(`文件 "${file.name}" 超过50MB限制`)
        continue
      }

      await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve()
        reader.onerror = () => reject(new Error('无法读取文件'))
        reader.readAsArrayBuffer(file.slice(0, 1024))
      })

      validFiles.push(file)

    } catch (error) {
      errors.push(`文件 "${file.name}" 验证失败`)
    }
  }

  if (errors.length > 0) {
    emit('error', errors.join('；'))
  }

  if (validFiles.length > 0) {
    emit('images-added', validFiles)
  }
}

defineExpose({
  triggerFileInput
})
</script>

<style scoped>
/* --- 通用布局 --- */
.upload-section {
  width: 100%;
  transition: all 0.3s ease;
}

/* --- 上传区域样式 --- */
.upload-zone {
  border: 2px dashed rgb(var(--v-border-color));
  background-color: rgb(var(--v-surface-variant));
  color: rgb(var(--v-on-surface-variant));
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
}

/* 悬停状态 - 核心修复区域 */
.upload-zone:hover {
  /* 1. 大幅降低透明度，让背景变暗 */
  background-color: rgba(var(--v-theme-surface-variant), 0.4);

  /* 2. 边框颜色不要用高亮的 primary，而是加深一点 */
  border-color: rgba(var(--v-border-color), 0.8);

  /* 3. 在深色模式下，叠加一层黑色遮罩层来压暗整体亮度 */
  /* 只有在 v-theme="dark" 时生效 */
}

.v-theme--dark .upload-zone:hover {
  background-color: rgba(0, 0, 0, 0.2); /* 直接叠加黑色遮罩 */
  /* 或者混合使用：background-image: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)); */
}

/* 图标过渡动画 */
.icon-transition {
  transition: transform 0.3s ease;
}

.upload-zone:hover .icon-transition {
  transform: scale(1.1) translateY(-5px);
}

/* --- 拖拽激活状态 --- */
.upload-zone.dragging {
  /* 激活状态可以使用 primary，但透明度也要控制 */
  background-color: rgba(var(--v-theme-primary), 0.08); /* 0.12 -> 0.08 更柔和 */
  border-color: rgb(var(--v-theme-primary));
  border-style: solid;
  transform: scale(1.01);
}

.upload-zone.dragging::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(var(--v-theme-primary), 0.08) 0%, transparent 70%);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.4;
    transform: scale(0.95);
  }
  50% {
    opacity: 0.8;
    transform: scale(1);
  }
  100% {
    opacity: 0.4;
    transform: scale(0.95);
  }
}

/* --- 已添加信息区域 --- */
.added-info {
  border: 1px solid rgb(var(--v-border-color));
  background-color: rgb(var(--v-surface));
  border-left: 4px solid rgb(var(--v-theme-success));
  transition: all 0.3s ease;
}

.added-info:hover {
  /* 同样修复信息区域的 Hover 过亮问题 */
  background-color: rgba(var(--v-theme-surface), 0.8);
}

.v-theme--dark .added-info:hover {
  background-color: rgba(0, 0, 0, 0.1);
}
</style>
