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
          <!-- 当需要密码时，仍然显示 FileUpload 组件的密码输入功能 -->
          <FileUpload
              v-if="pdfState.isEncrypted"
              ref="fileUploadRef"
              :pdf-file="pdfState.file"
              :is-locked="pdfState.isEncrypted"
              :is-checking="loading"
              @password-submitted="handlePasswordSubmitted"
              @reset="reset"
              class="password-overlay"
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
 * 核心逻辑：处理 PDF 解析
 * 修复：确保 file 对象在闭包中始终可用
 */
const runPdfPipeline = async (file, password = '') => {
  if (!file) return;

  loading.value = true
  loadingText.value = password ? '正在解密文档...' : '正在解析 PDF...'

  try {
    // 1. 调用 PdfHelper 进行实例获取
    const result = await PDFHelper.getPdfjsInstance(file, password)

      // 2. 检查加密状态
      if (result.isEncrypted) {
        pdfState.isEncrypted = true
        // 这里的逻辑修复：如果已经传了 password 还是返回 isEncrypted，说明密码真的错了
        if (password !== '') {
          showNotification(notification, '密码错误，请重新输入', 'error')
        } else {
          showNotification(notification, '该文档受密码保护', 'warning')
        }

        loading.value = false
        return // 只有在需要密码时才中断
      }

    // 3. 解析成功：走到这里说明密码正确或文档无加密
    loadingText.value = '正在生成高清预览...'
    const pages = await PDFHelper.renderToImages(file, password, 1.5)

    // 4. 统一更新状态 (只有在解析成功后才更新 pages)
    pdfState.password = password
    pdfState.pages = pages
    pdfState.isEncrypted = false

    showNotification(notification, `解析成功，共 ${pages.length} 页`, 'success')
  } catch (error) {
    console.error('Pipeline Error:', error)
    showNotification(notification, '文件加载失败: ' + formatErrorMessage(error), 'error')
    reset() // 只有真正的系统错误才重置
  } finally {
    loading.value = false
  }
}
// --- 事件处理 ---

// 上传新文件
const handleFileLoaded = (file) => {
  pdfState.file = file // 第一时间赋值！
  runPdfPipeline(file, '')
}

// 用户提交密码
const handlePasswordSubmitted = (password) => {
  if (pdfState.file) {
    runPdfPipeline(pdfState.file, password)
  }
}

// 导出 PDF
const exportPDF = async () => {
  if (!pdfState.file) return
  loading.value = true
  loadingText.value = '正在处理高保真 PDF...'

  try {
    // 1. 获取脱密后的 PDF Blob
    const exportResult = await PDFHelper.exportPDF(
        pdfState.file,
        pdfState.password
    )

    // 2. 注入水印
    const finalBlob = await exportWatermarkedPDF(exportResult.blob, config)

    // 3. 下载
    const url = URL.createObjectURL(finalBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${pdfState.file.name.replace('.pdf', '')}_水印版.pdf`
    a.click()
    URL.revokeObjectURL(url)

    showNotification(notification, '导出成功！', 'success')
  } catch (error) {
    console.error('Export Error:', error)
    showNotification(notification, '导出失败: ' + formatErrorMessage(error), 'error')
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

/* 密码覆盖层样式 */
.password-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 500px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

:root[data-theme="dark"] .password-overlay {
  background: rgba(30, 30, 30, 0.95);
}

/* 预览区域容器需要相对定位以支持绝对定位的覆盖层 */
.preview-wrapper {
  position: relative;
  overflow: visible !important;
}
</style>
