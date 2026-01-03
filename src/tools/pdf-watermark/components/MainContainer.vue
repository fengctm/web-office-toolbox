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
            v-if="pdfState.file"
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
        <div v-if="!pdfState.file" class="fill-height d-flex flex-column align-center justify-center">
          <FileUpload
              ref="fileUploadRef"
              :pdf-file="pdfState.file"
              @file-loaded="handleFileLoaded"
              @password-submitted="handlePasswordSubmitted"
              @reset="reset"
          />
        </div>

        <!-- PDF 预览区域 -->
        <div v-else class="preview-wrapper fill-height">
          <PreviewArea
              :preview-files="pdfState.pages"
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
import {ref, reactive, onMounted, useTemplateRef} from 'vue'
import {PDFHelper} from '@/utils-scripts/PdfHelper'
import {showNotification, formatErrorMessage} from '../utils/helpers'
import FileUpload from "@/tools/pdf-watermark/components/FileUpload.vue";
import SettingsPanel from "@/tools/pdf-watermark/components/SettingsPanel.vue";
import PreviewArea from "@/tools/pdf-watermark/components/PreviewArea.vue";
import NotificationSnackbar from "@/components/NotificationSnackbar.vue";
import {exportWatermarkedPDF} from "@/tools/pdf-watermark/utils/pdf-processor.js";

// --- 状态变量 ---
const loading = ref(false)
const loadingText = ref('')
const showSettings = ref(true)
const isMobile = ref(window.innerWidth < 600)
const fileUploadRef = useTemplateRef('fileUploadRef')

// 核心 PDF 数据状态
const pdfState = reactive({
  file: null,
  password: '',
  pages: [],
  isEncrypted: false
})

const notification = reactive({show: false, message: '', color: 'info'})

const config = reactive({
  text: '内部文档 请勿外传',
  font: 'Standard', fontSize: 30, color: '#ff0000',
  opacity: 0.3, rotation: -45, gap: 150, offsetX: 0, offsetY: 0
})

/**
 * 核心逻辑：处理 PDF 加载与解密
 * @param {File} file
 * @param {string} password
 */
const runPdfPipeline = async (file, password = '') => {
  loading.value = true
  loadingText.value = password ? '正在解密并解析...' : '正在解析 PDF...'

  try {
    // 1. 尝试获取实例（PdfHelper.getPdfjsInstance 内部封装了加密捕获）
    const {pdf, isEncrypted} = await PDFHelper.getPdfjsInstance(file, password)

    // 2. 处理加密逻辑
    if (isEncrypted) {
      pdfState.isEncrypted = true
      // 如果提供了密码但仍返回 isEncrypted，说明密码错误
      if (password) {
        showNotification(notification, '密码错误，请重新输入', 'error')
      } else {
        showNotification(notification, '文档已加密，请输入密码', 'warning')
      }
      fileUploadRef.value?.showPasswordInput()
      return
    }

    // 3. 走到这里说明解密成功或无需密码
    const pages = await PDFHelper.renderToImages(file, password, 1.5)

    // 更新持久状态
    pdfState.file = file
    pdfState.password = password
    pdfState.pages = pages
    pdfState.isEncrypted = false

    showNotification(notification, `解析成功！共 ${pages.length} 页`, 'success')
  } catch (error) {
    handleGeneralError(error)
  } finally {
    loading.value = false
  }
}

// --- 事件处理 ---

// 上传新文件
const handleFileLoaded = (file) => {
  reset() // 先清空旧状态
  runPdfPipeline(file)
}

// 用户提交密码
const handlePasswordSubmitted = (password) => {
  runPdfPipeline(pdfState.file, password)
}

// 导出 PDF
const exportPDF = async () => {
  if (!pdfState.file) return

  loading.value = true
  loadingText.value = '正在注入水印并打包...'

  try {
    // 1. 使用保存的密码直接脱密（PdfHelper 会处理 AES-256 等兼容性）
    const exportResult = await PDFHelper.exportPDF(
        pdfState.file,
        pdfState.password,
        'temp.pdf'
    )

    // 2. 注入水印逻辑 (注意：这里应调用你之前的 pdf-lib 水印函数)
    // 假设 exportWatermarkedPDF 是你定义的添加水印的函数
    const finalBlob = await exportWatermarkedPDF(exportResult.blob, config)

    // 3. 触发下载
    triggerDownload(finalBlob)

    showNotification(notification, 'PDF 导出成功！', 'success')
  } catch (error) {
    // 导出时的错误通常是由于某些特殊的加密限制
    handleGeneralError(error, '导出失败')
  } finally {
    loading.value = false
  }
}

/**
 * 辅助函数：统一错误处理
 */
const handleGeneralError = (error, prefix = '加载失败') => {
  console.error(error)
  const msg = error.name === 'PasswordException' || error.message?.includes('password')
      ? '密码验证失败，请重试'
      : `${prefix}: ${formatErrorMessage(error)}`

  showNotification(notification, msg, 'error')

  // 如果不是密码错误导致的彻底失败，则重置
  if (!pdfState.isEncrypted) reset()
}

const triggerDownload = (blob) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${pdfState.file.name.replace('.pdf', '')}_水印版.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

const reset = () => {
  pdfState.file = null
  pdfState.password = ''
  pdfState.pages = []
  pdfState.isEncrypted = false
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
