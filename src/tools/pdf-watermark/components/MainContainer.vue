<template>
  <div class="main-container">
    <!-- Loading 遮罩 (Apple 风格) -->
    <transition name="apple-loader">
      <div v-if="loading" class="pdf-loading-overlay">
        <div class="loader-content">
          <v-progress-circular indeterminate color="teal" size="64" width="4" class="mb-4"></v-progress-circular>
          <div class="loading-text">{{ loadingText }}</div>
        </div>
      </div>
    </transition>

    <v-layout class="app-layout">
      <!-- 顶部工具栏 -->
      <v-app-bar color="teal-darken-2" density="compact" flat>
        <v-app-bar-nav-icon @click="showSettings = !showSettings"></v-app-bar-nav-icon>
        <v-toolbar-title class="text-subtitle-1 font-weight-bold">
          PDF 水印专业版
        </v-toolbar-title>
        <v-spacer></v-spacer>

        <!-- 导出按钮直接放在工具栏 -->
        <v-btn
            v-if="pdfFile"
            prepend-icon="mdi-download"
            variant="flat"
            color="teal-accent-4"
            @click="exportPDF"
            :loading="loading"
            :disabled="loading"
            class="mr-2"
        >
          导出 PDF
        </v-btn>
      </v-app-bar>

      <!-- 左侧设置面板 -->
      <v-navigation-drawer
          v-model="showSettings"
          :width="isMobile ? 320 : 380"
          elevation="1"
          location="left"
          class="settings-drawer"
      >
        <div class="pa-4">
          <SettingsPanel
              v-model:config="config"
          />
        </div>
      </v-navigation-drawer>

      <!-- 主体内容 -->
      <v-main class="main-bg">
        <!-- 文件上传区域 -->
        <div v-if="!pdfFile" class="fill-height d-flex flex-column align-center justify-center">
          <FileUpload
              ref="fileUploadRef"
              :pdf-file="pdfFile"
              @file-loaded="handleFileLoaded"
              @password-submitted="handlePasswordSubmitted"
              @error="handleError"
              @reset="reset"
          />
        </div>

        <!-- PDF 预览区域 -->
        <div v-else class="preview-wrapper fill-height">
          <PreviewArea
              :preview-files="previewFiles"
              :watermark-config="config"
          />
        </div>
      </v-main>
    </v-layout>

    <!-- 公共通知组件 -->
    <NotificationSnackbar
        v-model="notification.show"
        :message="notification.message"
        :color="notification.color"
    />
  </div>
</template>

<script setup>
import {ref, reactive, onMounted} from 'vue'
import {processPDF, exportWatermarkedPDF} from '../utils/pdf-processor'
import {showNotification, isPasswordError, formatErrorMessage} from '../utils/helpers'

// 导入子组件
import FileUpload from './FileUpload.vue'
import SettingsPanel from './SettingsPanel.vue'
import PreviewArea from './PreviewArea.vue'
import NotificationSnackbar from '@/components/NotificationSnackbar.vue'

// --- 状态变量 ---
const loading = ref(false)
const loadingText = ref('')
const showSettings = ref(true)
const pdfFile = ref(null)
const previewFiles = ref([])
const fileUploadRef = ref(null)
const isMobile = ref(window.innerWidth < 600)

// 通知状态
const notification = reactive({
  show: false,
  message: '',
  color: 'info'
})

const config = reactive({
  text: '内部文档 请勿外传',
  font: 'Standard',
  fontSize: 30,
  color: '#ff0000',
  opacity: 0.3,
  rotation: -45,
  gap: 150,
  offsetX: 0,
  offsetY: 0
})

// --- 文件处理 ---
const handleFileLoaded = async (file) => {
  pdfFile.value = file
  await processFile(file, '')
}

const handlePasswordSubmitted = (password) => {
  if (fileUploadRef.value) {
    fileUploadRef.value.password = password
  }
  // 使用密码重新处理PDF
  processFile(pdfFile.value, password)
}

const processFile = async (file, password) => {
  loading.value = true
  loadingText.value = '正在解析 PDF...'

  try {
    const pages = await processPDF(file, password)
    previewFiles.value = pages
    loading.value = false
    showNotification(notification, `PDF解析成功！共 ${pages.length} 页`, 'success')
  } catch (error) {
    loading.value = false

    if (isPasswordError(error)) {
      showNotification(notification, '密码错误，请重新输入', 'error')
      if (fileUploadRef.value) {
        fileUploadRef.value.showPasswordInput()
      }
    } else {
      handleError('文件加载失败: ' + formatErrorMessage(error))
      reset()
    }
  }
}

// --- 导出 PDF ---
const exportPDF = async () => {
  loading.value = true
  loadingText.value = '正在注入水印并打包...'

  try {
    const password = fileUploadRef.value?.password || ''
    const blob = await exportWatermarkedPDF(pdfFile.value, config, password)
    
    // 下载文件
    const fileName = `${pdfFile.value.name.replace('.pdf', '')}_水印版.pdf`
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)

    loading.value = false
    showNotification(notification, 'PDF 导出成功！', 'success')
  } catch (error) {
    loading.value = false
    
    if (isPasswordError(error)) {
      showNotification(notification, '密码错误或 PDF 已加密', 'warning')
      if (fileUploadRef.value) {
        fileUploadRef.value.showPasswordInput()
      }
    } else {
      handleError('导出失败: ' + formatErrorMessage(error))
    }
  }
}

// --- 错误处理 ---
const handleError = (message) => {
  showNotification(notification, message, 'error')
}

// --- 重置 ---
const reset = () => {
  pdfFile.value = null
  previewFiles.value = []
  loading.value = false
  loadingText.value = ''
}

// --- 生命周期 ---
onMounted(() => {
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 600
  })
})
</script>

<style scoped>
.main-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.app-layout {
  height: 100%;
}

.main-bg {
  background-color: #f5f5f5;
}

.preview-wrapper {
  overflow: hidden;
}

/* Apple Loader 样式 */
.pdf-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}

.loading-text {
  font-size: 14px;
  color: #00796b;
  font-weight: 500;
}

.apple-loader-enter-active, .apple-loader-leave-active {
  transition: all 0.5s ease;
}

.apple-loader-enter-from, .apple-loader-leave-to {
  opacity: 0;
}

/* 深色模式适配 */
:root[data-theme="dark"] .main-bg {
  background-color: #121212;
}

/* 深色模式 Loading 遮罩 */
:root[data-theme="dark"] .pdf-loading-overlay {
  background: rgba(0, 0, 0, 0.85);
}

/* 深色模式 Loading 文字 */
:root[data-theme="dark"] .loading-text {
  color: #4dd0e1;
}

/* 深色模式下的应用栏 */
:root[data-theme="dark"] .v-app-bar {
  background-color: #1e1e1e !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* 深色模式下的抽屉背景 */
:root[data-theme="dark"] .settings-drawer {
  background-color: #1e1e1e !important;
  border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* 深色模式下的按钮文本 */
:root[data-theme="dark"] .v-btn {
  color: #e0e0e0 !important;
}

/* 深色模式下的工具栏标题 */
:root[data-theme="dark"] .v-toolbar-title {
  color: #ffffff !important;
}
</style>
