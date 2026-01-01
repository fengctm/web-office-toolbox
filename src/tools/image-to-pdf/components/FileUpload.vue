<template>
  <div class="upload-section mb-6">
    <!-- 上传区域 -->
    <div
        v-if="imageList.length === 0"
        class="upload-zone d-flex flex-column align-center justify-center pa-12 border-dashed rounded-lg"
        @click="triggerFileInput"
        @dragover.prevent
        @drop.prevent="handleDrop"
        @dragenter.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        :class="{ 'dragging': isDragging }"
    >
      <v-icon size="80" color="teal-lighten-2" class="mb-4">mdi-cloud-upload</v-icon>
      <div class="text-h6 mb-2">点击或拖拽图片到此处</div>
      <div class="text-body-2 text-grey">支持 JPG, PNG, WEBP (可多选)</div>
      <input
          type="file"
          ref="fileInput"
          multiple
          accept="image/*"
          class="d-none"
          @change="onFileChange"
      />
      <v-btn color="teal" class="mt-6" prepend-icon="mdi-plus" variant="tonal">
        选择图片
      </v-btn>
    </div>

    <!-- 已添加图片提示 -->
    <div v-else class="added-info pa-4 bg-teal-lighten-5 rounded-lg d-flex align-center">
      <v-icon color="teal" class="mr-2">mdi-check-circle</v-icon>
      <div class="flex-grow-1">
        <div class="font-weight-bold">已添加 {{ imageList.length }} 张图片</div>
        <div class="text-caption text-grey">可以继续添加更多图片，或进入下一步排序</div>
      </div>
      <v-btn color="teal" prepend-icon="mdi-plus" variant="tonal" @click="triggerFileInput">
        继续添加
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  imageList: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['images-added', 'error'])

const fileInput = ref(null)
const isDragging = ref(false)

// 触发文件选择
const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click()
  } else {
    console.error('fileInput ref is null')
    emit('error', '文件选择器未正确初始化')
  }
}

// 处理文件选择
const onFileChange = (e) => {
  const files = Array.from(e.target.files)
  processFiles(files)
  // 清空输入，允许重复选择同一文件
  e.target.value = ''
}

// 处理拖拽上传
const handleDrop = (e) => {
  isDragging.value = false
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
  processFiles(files)
}

// 处理并验证文件
const processFiles = async (files) => {
  if (files.length === 0) {
    emit('error', '请选择有效的图片文件')
    return
  }

  // 显示处理进度
  emit('images-added', []) // 通知父组件开始处理

  const validFiles = []
  const errors = []

  // 批量验证和处理
  for (const file of files) {
    try {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        errors.push(`文件 "${file.name}" 格式不支持`)
        continue
      }

      // 验证文件大小 (50MB限制)
      if (file.size > 50 * 1024 * 1024) {
        errors.push(`文件 "${file.name}" 超过50MB限制`)
        continue
      }

      // 验证文件可读性（读取前1KB）
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

  // 显示错误汇总
  if (errors.length > 0) {
    emit('error', errors.join('；'))
  }

  // 通知父组件处理完成
  if (validFiles.length > 0) {
    emit('images-added', validFiles)
  }
}

// 暴露方法给父组件
defineExpose({
  triggerFileInput
})
</script>

<style scoped>
.upload-zone {
  border: 2px dashed rgba(var(--v-theme-outline-variant), 0.6);
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(var(--v-theme-surface-variant), 0.4);
}

.upload-zone:hover {
  background: rgba(var(--v-theme-surface-variant), 0.6);
  border-color: rgba(var(--v-theme-primary), 0.8);
}

.upload-zone.dragging {
  background: rgba(var(--v-theme-primary-container), 0.3);
  border-color: rgba(var(--v-theme-primary), 1);
  transform: scale(1.02);
}

.added-info {
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
  background: rgba(var(--v-theme-surface-variant), 0.4);
}
</style>
