<template>
  <div class="upload-section mb-6">
    <v-file-input
        v-model="pdfFile"
        label="选择PDF文件"
        accept=".pdf,application/pdf"
        prepend-icon="mdi-file-pdf-box"
        :loading="uploading"
        :disabled="uploading"
        @update:modelValue="handleFileUpload"
        variant="outlined"
        density="comfortable"
        hint="仅支持PDF格式文件，建议文件大小不超过50MB"
        persistent-hint
    >
      <template v-slot:append>
        <v-btn
            color="teal"
            variant="tonal"
            :disabled="!pdfFile || uploading"
            :loading="uploading"
            @click="processPDF"
        >
          {{ uploading ? '解析中...' : '解析PDF' }}
        </v-btn>
      </template>
    </v-file-input>

    <!-- 文件信息显示 -->
    <div v-if="pdfFile && !uploading" class="file-info mt-2">
      <v-chip color="primary" size="small" class="mr-2">
        <v-icon start icon="mdi-file"></v-icon>
        {{ pdfFile.name }}
      </v-chip>
      <v-chip color="grey" size="small" class="mr-2">
        <v-icon start icon="mdi-file-size"></v-icon>
        {{ formatFileSize(pdfFile.size) }}
      </v-chip>
      <v-chip color="teal" size="small" v-if="totalPages > 0">
        <v-icon start icon="mdi-book-open-page-variant"></v-icon>
        共 {{ totalPages }} 页
      </v-chip>
      <v-chip color="orange" size="small" v-if="isEncrypted">
        <v-icon start icon="mdi-lock"></v-icon>
        已加密
      </v-chip>
    </div>

    <!-- 处理状态提示 -->
    <div v-if="processing" class="processing-state mt-3">
      <v-alert type="info" variant="tonal" icon="mdi-clock-outline">
        <div class="d-flex align-center">
          <v-progress-circular
              indeterminate
              size="20"
              width="2"
              color="teal"
              class="mr-3"
          ></v-progress-circular>
          <span>正在解析PDF文件，准备预览...</span>
        </div>
      </v-alert>
    </div>

    <!-- 密码输入对话框 -->
    <PasswordDialog
        v-model="showPasswordDialog"
        @confirm="handlePasswordConfirm"
        @cancel="handlePasswordCancel"
    />
  </div>
</template>

<script setup>
import {ref} from 'vue'
import {PDFDocument} from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import {handlePDFError, validateFile} from '../utils/error-handler'
import PasswordDialog from './PasswordDialog.vue'

const emit = defineEmits([
  'file-uploaded',
  'pdf-processed',
  'error',
  'update:processing',
  'password-required'
])

// 响应式状态
const pdfFile = ref(null)
const uploading = ref(false)
const processing = ref(false)
const totalPages = ref(0)
const isEncrypted = ref(false)
const showPasswordDialog = ref(false)
const currentPassword = ref('')

// 配置pdfjs worker（使用匹配的版本）
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
}

// 工具函数：格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 文件上传处理
const handleFileUpload = (file) => {
  if (!file) {
    emit('file-uploaded', null)
    isEncrypted.value = false
    return
  }

  // 使用错误处理模块验证文件
  const validation = validateFile(file)
  if (!validation.valid) {
    emit('error', validation.error.message)
    pdfFile.value = null
    return
  }

  // 重置加密状态
  isEncrypted.value = false
  currentPassword.value = ''

  emit('file-uploaded', file)
}

// 检查PDF是否加密
const checkIfEncrypted = async (file) => {
  try {
    // 重新读取文件，避免ArrayBuffer被分离
    const arrayBuffer = await file.arrayBuffer()
    // 尝试用空密码加载
    await pdfjsLib.getDocument({data: arrayBuffer, password: ''}).promise
    return false
  } catch (e) {
    if (e.message.includes('password') || e.message.includes('encrypted')) {
      return true
    }
    throw e
  }
}

// 处理密码确认
const handlePasswordConfirm = (password) => {
  currentPassword.value = password
  processPDFWithPassword(password)
}

// 处理密码取消
const handlePasswordCancel = () => {
  uploading.value = false
  processing.value = false
  emit('update:processing', false)
  emit('error', '需要密码才能访问此加密PDF文件')
}

// 使用密码解析PDF
const processPDFWithPassword = async (password) => {
  uploading.value = true
  processing.value = true
  emit('update:processing', true)

  try {
    const arrayBuffer = await pdfFile.value.arrayBuffer()

    // 优先使用pdfjs加载（带密码），它对加密PDF支持更好
    let pdf
    try {
      pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        password: password
      }).promise
    } catch (pdfjsError) {
      // 如果pdfjs失败，尝试pdf-lib
      console.warn('pdfjs加载失败，尝试pdf-lib:', pdfjsError.message)

      try {
        const pdfDoc = await PDFDocument.load(arrayBuffer, {
          ignoreEncryption: true,
          password: password
        })
        const pageCount = pdfDoc.getPageCount()

        if (pageCount === 0) {
          throw new Error('PDF文件不包含任何页面')
        }

        // 重新用pdfjs加载验证
        pdf = await pdfjsLib.getDocument({
          data: arrayBuffer,
          password: password
        }).promise

      } catch (pdfLibError) {
        // 如果都失败，检查是否是密码错误
        if (pdfjsError.message.includes('password') ||
            pdfLibError.message.includes('password') ||
            pdfjsError.message.includes('encrypted') ||
            pdfLibError.message.includes('encrypted')) {
          throw new Error('密码错误，请重新输入')
        }
        throw pdfjsError // 抛出原始错误
      }
    }

    // 获取总页数
    const pageCount = pdf.numPages

    // 验证可访问性 - 获取第一页
    const page = await pdf.getPage(1)

    // 额外的处理时间，让用户看到进度
    await new Promise(resolve => setTimeout(resolve, 800))

    totalPages.value = pageCount
    uploading.value = false
    processing.value = false
    emit('update:processing', false)
    emit('pdf-processed', pageCount)

    // 如果是加密PDF，将密码传递给父组件
    if (isEncrypted.value && password) {
      // 通过专门的事件传递密码
      emit('password-required', password)
    }

  } catch (error) {
    uploading.value = false
    processing.value = false
    emit('update:processing', false)

    // 如果密码错误，重新显示密码输入框
    if (error.message.includes('密码错误') ||
        error.message.includes('password') ||
        error.message.includes('incorrect') ||
        error.message.includes('encrypted')) {
      emit('error', '密码错误，请重新输入')
      showPasswordDialog.value = true
    } else {
      const handledError = handlePDFError(error)
      emit('error', handledError.message)
      console.error('PDF解析错误:', handledError)
    }
  }
}

// 解析PDF - 真实实现（集成错误处理）
const processPDF = async () => {
  if (!pdfFile.value) {
    emit('error', '请先选择PDF文件')
    return
  }

  uploading.value = true
  processing.value = true
  emit('update:processing', true)

  try {
    // 读取文件
    const arrayBuffer = await pdfFile.value.arrayBuffer()

    // 首先检查是否加密
    const encrypted = await checkIfEncrypted(pdfFile.value)

    if (encrypted) {
      isEncrypted.value = true
      uploading.value = false
      processing.value = false
      emit('update:processing', false)
      // 显示密码输入对话框
      showPasswordDialog.value = true
      return
    }

    // 如果未加密，使用简单方式处理
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      password: ''
    }).promise

    const pageCount = pdf.numPages

    if (pageCount === 0) {
      throw new Error('PDF文件不包含任何页面')
    }

    // 验证可访问性
    const page = await pdf.getPage(1)

    await new Promise(resolve => setTimeout(resolve, 800))

    totalPages.value = pageCount
    uploading.value = false
    processing.value = false
    emit('update:processing', false)
    emit('pdf-processed', pageCount)

  } catch (error) {
    uploading.value = false
    processing.value = false
    emit('update:processing', false)

    const handledError = handlePDFError(error)
    emit('error', handledError.message)
    console.error('PDF解析错误:', handledError)
  }
}

// 重置状态
const reset = () => {
  pdfFile.value = null
  uploading.value = false
  processing.value = false
  totalPages.value = 0
}

// 暴露给父组件的方法
const setPasswordForParent = (password) => {
  // 通过事件将密码传递给父组件
  emit('password-required', password)
}

defineExpose({
  reset,
  setPasswordForParent
})
</script>

<style scoped>
.upload-section {
  background: rgba(0, 150, 136, 0.03);
  padding: 16px;
  border-radius: 8px;
  border: 1px dashed rgba(0, 150, 136, 0.3);
}

.file-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.processing-state {
  animation: fadeIn 0.3s ease-out;
}

/* 深色模式适配 */
.v-theme--dark .upload-section {
  background: rgba(38, 166, 154, 0.05);
  border-color: rgba(38, 166, 154, 0.4);
}

/* 动画定义 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


/* 响应式调整 */
@media (max-width: 600px) {
  .file-info {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
