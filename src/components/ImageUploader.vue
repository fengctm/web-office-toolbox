<template>
  <div class="image-uploader">
    <!-- 始终隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      :accept="acceptAttribute"
      :multiple="multiple"
      class="d-none"
      @change="onFileChange"
    />

    <!-- 上传区域 (空状态) -->
    <div
      v-if="currentFileCount === 0"
      class="upload-zone d-flex flex-column align-center justify-center pa-12 rounded-lg elevation-2"
      :class="{ 'dragging': isDragging, 'no-drag': !dragEnabled }"
      @click="triggerFileInput"
      @dragenter.prevent="handleDragEnter"
      @dragover.prevent
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <v-icon
        size="80"
        color="primary"
        class="mb-4 icon-transition"
      >
        mdi-cloud-upload
      </v-icon>

      <div class="text-h6 mb-2 text-high-emphasis">{{ uploadText }}</div>

      <div class="text-body-2 text-medium-emphasis mb-6">
        {{ uploadSubtext }}
      </div>

      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        variant="tonal"
        size="large"
      >
        {{ buttonText }}
      </v-btn>
    </div>

    <!-- 已添加图片提示 (非空状态) -->
    <div v-else class="added-info pa-4 rounded-lg elevation-1 d-flex align-center bg-surface">
      <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
      <div class="flex-grow-1">
        <div class="font-weight-bold text-high-emphasis">
          {{ addedText.replace('{count}', currentFileCount) }}
        </div>
        <div v-if="showFileCount" class="text-caption text-medium-emphasis">
          可以继续添加更多图片
        </div>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        variant="text"
        @click.stop="triggerFileInput"
      >
        {{ continueText }}
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { isAnimatedImage, formatFileSize } from '@/utils-scripts/ImageHelper'

// 错误码定义
const ERROR_CODES = {
  INVALID_FORMAT: 'INVALID_FORMAT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  ANIMATED_NOT_ALLOWED: 'ANIMATED_NOT_ALLOWED',
  TOO_MANY_FILES: 'TOO_MANY_FILES',
  READ_FAILED: 'READ_FAILED'
}

// Props 定义
const props = defineProps({
  // === 基础配置 ===
  multiple: {
    type: Boolean,
    default: false
  },

  // 支持的图片格式（MIME 类型）
  acceptFormats: {
    type: Array,
    default: () => ['image/jpeg', 'image/png', 'image/webp']
  },

  // 文件大小限制（字节），默认 50MB
  maxSize: {
    type: Number,
    default: 50 * 1024 * 1024,
    validator: (value) => value > 0
  },

  // 最大文件数量（仅多选模式，null 表示无限制）
  maxFiles: {
    type: Number,
    default: null
  },

  // === UI 控制 ===
  dragEnabled: {
    type: Boolean,
    default: true
  },

  // 是否显示已添加文件数量（多选模式）
  showFileCount: {
    type: Boolean,
    default: true
  },

  // 当前已添加的文件数量（用于显示状态）
  currentFileCount: {
    type: Number,
    default: 0
  },

  // === 动图检测 ===
  allowAnimated: {
    type: Boolean,
    default: false
  },

  // === 自定义文本 ===
  uploadText: {
    type: String,
    default: '点击或拖拽图片到此处'
  },

  uploadSubtext: {
    type: String,
    default: '支持 JPG, PNG, WEBP'
  },

  buttonText: {
    type: String,
    default: '选择图片'
  },

  addedText: {
    type: String,
    default: '已添加 {count} 张图片'
  },

  continueText: {
    type: String,
    default: '继续添加'
  }
})

// Events 定义
const emit = defineEmits(['files-selected', 'file-error', 'validation-fail'])

// 响应式状态
const fileInput = ref(null)
const isDragging = ref(false)
const dragCounter = ref(0) // 修复子元素触发的 dragleave 问题

// 计算属性：accept 属性值
const acceptAttribute = computed(() => {
  return props.acceptFormats.join(',')
})

// 触发文件选择
const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click()
  } else {
    console.error('fileInput ref is null')
    emitError({ message: '文件选择器未正确初始化', code: 'INPUT_INIT_FAILED' })
  }
}

// 处理文件选择
const onFileChange = (e) => {
  const files = Array.from(e.target.files)
  processFiles(files)
  e.target.value = '' // 重置 input 以允许重复选择同一文件
}

// 拖拽事件处理（参考 PDFSecureUpload 的实现）
const handleDragEnter = (e) => {
  if (!props.dragEnabled) return
  e.preventDefault()
  dragCounter.value++
  isDragging.value = true
}

const handleDragLeave = (e) => {
  if (!props.dragEnabled) return
  e.preventDefault()
  dragCounter.value--
  // 只有当计数器归零时才取消拖拽状态（修复子元素触发的问题）
  if (dragCounter.value === 0) {
    isDragging.value = false
  }
}

const handleDrop = (e) => {
  if (!props.dragEnabled) return
  e.preventDefault()
  isDragging.value = false
  dragCounter.value = 0

  const files = Array.from(e.dataTransfer.files)
  processFiles(files)
}

// 验证单个文件
const validateFile = async (file) => {
  // 1. 格式验证
  if (!props.acceptFormats.includes(file.type)) {
    return {
      valid: false,
      reason: `不支持的文件格式: ${file.type || '未知格式'}`
    }
  }

  // 2. 大小验证
  if (file.size > props.maxSize) {
    return {
      valid: false,
      reason: `文件超过 ${formatFileSize(props.maxSize)} 限制`
    }
  }

  // 3. 动图验证
  if (!props.allowAnimated) {
    try {
      const isAnimated = await isAnimatedImage(file)
      if (isAnimated) {
        return {
          valid: false,
          reason: '不支持动图文件'
        }
      }
    } catch (error) {
      console.warn('动图检测失败:', error)
      // 动图检测失败时不阻止文件上传
    }
  }

  return { valid: true }
}

// 处理文件列表
const processFiles = async (files) => {
  if (files.length === 0) {
    emitError({ message: '请选择有效的图片文件' })
    return
  }

  // 多选模式下检查文件数量限制
  if (props.multiple && props.maxFiles !== null) {
    const totalCount = props.currentFileCount + files.length
    if (totalCount > props.maxFiles) {
      emitError({
        message: `最多只能上传 ${props.maxFiles} 个文件`,
        code: ERROR_CODES.TOO_MANY_FILES
      })
      return
    }
  }

  const validFiles = []
  const errors = []

  // 验证所有文件
  for (const file of files) {
    const result = await validateFile(file)

    if (result.valid) {
      validFiles.push(file)
    } else {
      errors.push({
        file,
        reason: result.reason
      })
    }
  }

  // 发送验证失败事件（详细错误列表）
  if (errors.length > 0) {
    emit('validation-fail', errors)
  }

  // 发送错误事件（第一个错误，用于简化处理）
  if (errors.length === 1) {
    emitError({
      message: errors[0].reason,
      file: errors[0].file,
      code: getErrorCode(errors[0].reason)
    })
  } else if (errors.length > 1) {
    emitError({
      message: `${errors.length} 个文件验证失败，请检查文件格式和大小`,
      code: 'MULTIPLE_ERRORS'
    })
  }

  // 发送成功选择的文件
  if (validFiles.length > 0) {
    emit('files-selected', validFiles)
  }
}

// 发送错误事件
const emitError = (error) => {
  emit('file-error', error)
}

// 根据错误原因获取错误码
const getErrorCode = (reason) => {
  if (reason.includes('格式')) {
    return ERROR_CODES.INVALID_FORMAT
  }
  if (reason.includes('限制') || reason.includes('超过')) {
    return ERROR_CODES.FILE_TOO_LARGE
  }
  if (reason.includes('动图')) {
    return ERROR_CODES.ANIMATED_NOT_ALLOWED
  }
  return ERROR_CODES.READ_FAILED
}

// 暴露方法供父组件调用
defineExpose({
  triggerFileInput
})
</script>

<style scoped>
/* --- 通用布局 --- */
.image-uploader {
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

/* 禁用拖拽时的样式 */
.upload-zone.no-drag {
  cursor: pointer;
}

/* 悬停状态 */
.upload-zone:hover {
  background-color: rgba(var(--v-theme-surface-variant), 0.4);
  border-color: rgba(var(--v-border-color), 0.8);
}

/* 深色模式悬停状态 */
.v-theme--dark .upload-zone:hover {
  background-color: rgba(0, 0, 0, 0.2);
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
  background-color: rgba(var(--v-theme-primary), 0.08);
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
  background-color: rgba(var(--v-theme-surface), 0.8);
}

.v-theme--dark .added-info:hover {
  background-color: rgba(0, 0, 0, 0.1);
}
</style>
