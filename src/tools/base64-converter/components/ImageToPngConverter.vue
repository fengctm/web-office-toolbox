<template>
  <div class="image-to-png-converter">
    <div
      class="drop-zone"
      :class="{ 'drop-zone--active': isDragging, 'drop-zone--error': hasError }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <div class="drop-zone-content">
        <v-icon size="48" color="teal" class="mb-3">
          mdi-cloud-upload
        </v-icon>
        <p class="drop-zone-text">
          {{ isDragging ? '释放以上传图片' : '拖拽图片到此处，或点击选择文件' }}
        </p>
        <p class="drop-zone-hint">
          支持 {{ acceptDescription }} 格式，单文件最大 {{ formatSize(maxSize) }}
        </p>
        <v-btn
          variant="tonal"
          color="teal"
          class="mt-3"
          @click="triggerFileInput"
        >
          <v-icon class="mr-2">mdi-folder-open</v-icon>
          选择文件
        </v-btn>
      </div>
      <input
        ref="fileInput"
        type="file"
        class="file-input"
        :accept="accept"
        :multiple="mode === 'multiple'"
        @change="handleFileSelect"
      />
    </div>

    <div v-if="errorMessage" class="error-message">
      <v-alert
        type="error"
        variant="tonal"
        density="compact"
        closable
        @click:close="clearError"
      >
        {{ errorMessage }}
      </v-alert>
    </div>

    <div v-if="loading" class="loading-overlay">
      <v-progress-circular
        indeterminate
        color="teal"
        size="64"
      />
      <p class="loading-text">正在转换图片为 PNG 格式...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  accept: {
    type: String,
    default: 'image/*'
  },
  maxSize: {
    type: Number,
    default: 5 * 1024 * 1024
  },
  mode: {
    type: String,
    default: 'single',
    validator: (value) => ['single', 'multiple'].includes(value)
  }
})

const emit = defineEmits(['convert', 'error'])

const fileInput = ref(null)
const isDragging = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const loading = ref(false)

const acceptDescription = computed(() => {
  const types = props.accept.split(',').map(t => t.trim())
  if (types.includes('image/*')) {
    return 'JPEG, WebP, PNG'
  }
  return types.map(t => t.replace('image/', '').toUpperCase()).join(', ')
})

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const validateFiles = (files) => {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/webp', 'image/png', 'image/gif']
  const validFiles = []
  const errors = []

  Array.from(files).forEach((file, index) => {
    if (!imageTypes.includes(file.type)) {
      errors.push(`文件 "${file.name}" 不是支持的图片格式`)
      return
    }

    if (file.size > props.maxSize) {
      errors.push(`文件 "${file.name}" 大小超过限制 (${formatSize(props.maxSize)})`)
      return
    }

    validFiles.push(file)
  })

  if (errors.length > 0) {
    errorMessage.value = errors.join('; ')
    hasError.value = true
    emit('error', errors.join('; '))
  }

  if (props.mode === 'single' && validFiles.length > 1) {
    errorMessage.value = '单文件模式只能上传一个文件，已保留第一个文件'
    hasError.value = true
    emit('error', '单文件模式限制')
    return [validFiles[0]]
  }

  return validFiles
}

const convertToPngBase64 = async (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)

        const pngBase64 = canvas.toDataURL('image/png')

        URL.revokeObjectURL(url)

        resolve({
          originalName: file.name,
          originalType: file.type,
          originalSize: file.size,
          pngBase64: pngBase64,
          width: img.width,
          height: img.height,
          dataUrl: pngBase64
        })
      } catch (error) {
        URL.revokeObjectURL(url)
        reject(error)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`无法加载图片 "${file.name}"`))
    }

    img.src = url
  })
}

const processFiles = async (files) => {
  const validFiles = validateFiles(files)
  if (validFiles.length === 0) {
    return
  }

  loading.value = true
  hasError.value = false
  errorMessage.value = ''

  try {
    const results = await Promise.all(
      validFiles.map(file => convertToPngBase64(file))
    )

    emit('convert', results)

    if (props.mode === 'single') {
      showPreview(results[0])
    } else {
      results.forEach(result => showPreview(result))
    }
  } catch (error) {
    errorMessage.value = '转换失败: ' + error.message
    hasError.value = true
    emit('error', error.message)
  } finally {
    loading.value = false
  }
}

const showPreview = (result) => {
  console.log('图片转换完成:', result.originalName)
}

const handleDragOver = (e) => {
  isDragging.value = true
}

const handleDragLeave = (e) => {
  isDragging.value = false
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files.length > 0) {
    processFiles(files)
  }
}

const handleFileSelect = (e) => {
  const files = e.target.files
  if (files.length > 0) {
    processFiles(files)
  }
  e.target.value = ''
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const clearError = () => {
  hasError.value = false
  errorMessage.value = ''
}

const reset = () => {
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  isDragging.value = false
  hasError.value = false
  errorMessage.value = ''
}

defineExpose({
  reset,
  clearError
})
</script>

<style scoped>
.image-to-png-converter {
  width: 100%;
}

.drop-zone {
  border: 2px dashed #ccc;
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
  position: relative;
}

.drop-zone:hover {
  border-color: #009688;
  background: #f5f5f5;
}

.drop-zone--active {
  border-color: #009688;
  background: #e0f2f1;
  transform: scale(1.02);
}

.drop-zone--error {
  border-color: #f44336;
  background: #ffebee;
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.drop-zone-text {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.drop-zone-hint {
  font-size: 12px;
  color: #999;
  margin-bottom: 0;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.error-message {
  margin-top: 16px;
}

.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  margin-top: 16px;
}

.loading-text {
  margin-top: 16px;
  color: #666;
  font-size: 14px;
}
</style>
