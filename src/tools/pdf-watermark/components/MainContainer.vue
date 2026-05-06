<template>
  <div class="main-container">
    <!-- Loading 遮罩 -->
    <transition name="apple-loader">
      <div v-if="loading" class="pdf-loading-overlay">
        <div class="loader-content">
          <v-progress-circular class="mb-4" color="teal" indeterminate size="64" width="4"></v-progress-circular>
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

        <!-- 导出按钮 -->
        <v-btn
            v-if="originalPdfBytes"
            :disabled="loading"
            :loading="loading"
            class="mr-2"
            color="teal-accent-4"
            prepend-icon="mdi-download"
            variant="flat"
            @click="exportPDF"
        >
          导出 PDF
        </v-btn>
      </v-app-bar>

      <!-- 左侧设置面板 -->
      <v-navigation-drawer
          v-model="showSettings"
          :width="isMobile ? 320 : 380"
          class="settings-drawer"
          elevation="1"
          location="left"
      >
        <div class="pa-4">
          <SettingsPanel v-model:config="config"/>
        </div>
      </v-navigation-drawer>

      <!-- 主体内容 -->
      <v-main class="main-bg">
        <!-- 文件上传区域 -->
        <div v-if="!originalPdfBytes" class="fill-height d-flex flex-column align-center justify-center">
          <FileUpload
              label="选择或拖拽 PDF 文件"
              @reset="reset"
              @success="handleFileSelected"
          />
        </div>

        <!-- PDF 预览区域 -->
        <div v-else class="preview-wrapper fill-height">
          <PreviewArea
              :preview-pages="previewPages"
              :is-generating="isPreviewGenerating"
              :total-pages="totalPages"
          />
        </div>
      </v-main>
    </v-layout>

    <!-- 公共通知组件 -->
    <NotificationSnackbar
        v-model="notification.show"
        :color="notification.color"
        :message="notification.message"
    />
  </div>
</template>

<script setup>
import {onMounted, reactive, ref} from 'vue'
import {PDFHelper} from '@/utils-scripts/PdfHelper'
import {formatErrorMessage, showNotification} from '../utils/helpers.js'
import {useWatermarkPreview} from '../utils/preview-renderer.js'
import {exportWatermarkedPDF} from '../utils/pdf-processor.js'
import FileUpload from './FileUpload.vue'
import SettingsPanel from './SettingsPanel.vue'
import PreviewArea from './PreviewArea.vue'
import NotificationSnackbar from '../../../components/NotificationSnackbar.vue'

// --- 状态变量 ---
const loading = ref(false)
const loadingText = ref('')
const showSettings = ref(true)
const isMobile = ref(window.innerWidth < 600)

// 核心 PDF 数据
const originalPdfBytes = ref(null) // 缓存原始 PDF 的 ArrayBuffer
const pdfFileRef = ref(null) // 保留 file 引用，用于导出文件名
const totalPages = ref(0)
const notification = reactive({show: false, message: '', color: 'info'})

// 水印配置
const config = reactive({
  text: '内部文档 请勿外传',
  fontSize: 30,
  color: '#ff0000',
  opacity: 0.3,
  rotation: -45,
  gap: 150,
  offsetX: 0,
  offsetY: 0
})

// 预览引擎
const {previewPages, isGenerating: isPreviewGenerating, refresh} =
    useWatermarkPreview(originalPdfBytes, config)

// --- 文件处理 ---

const handleFileSelected = async (result) => {
  const {file, password} = result

  loading.value = true
  loadingText.value = password ? '正在解密文档...' : '正在加载 PDF...'

  try {
    // 1. 验证 PDF（使用 PdfHelper 支持加密文档）
    const pdfInstance = await PDFHelper.getPdfjsInstance(file, password || '')

    if (pdfInstance.isEncrypted) {
      if (password) {
        showNotification(notification, '密码错误，请重新输入', 'error')
      } else {
        showNotification(notification, '该文档受密码保护', 'warning')
      }
      loading.value = false
      return
    }

    // 2. 获取页数
    const pages = await PDFHelper.renderToImages(file, password || '', 1.5)
    totalPages.value = pages.length

    // 3. 缓存原始 PDF bytes（如果是加密文档，使用解密后的 bytes）
    if (password) {
      const exportResult = await PDFHelper.exportPDF(file, password)
      originalPdfBytes.value = await exportResult.blob.arrayBuffer()
    } else {
      originalPdfBytes.value = await file.arrayBuffer()
    }

    pdfFileRef.value = file
    showNotification(notification, `解析成功，共 ${totalPages.value} 页`, 'success')
  } catch (error) {
    console.error('File loading error:', error)
    showNotification(notification, '文件加载失败: ' + formatErrorMessage(error), 'error')
    reset()
  } finally {
    loading.value = false
  }
}

// --- 导出 ---

const exportPDF = async () => {
  if (!originalPdfBytes.value) return

  loading.value = true
  loadingText.value = '正在生成高保真 PDF...'

  try {
    const finalBlob = await exportWatermarkedPDF(originalPdfBytes.value, config)

    const url = URL.createObjectURL(finalBlob)
    const a = document.createElement('a')
    a.href = url
    const fileName = pdfFileRef.value?.name?.replace('.pdf', '') || 'document'
    a.download = `${fileName}_水印版.pdf`
    a.click()
    URL.revokeObjectURL(url)

    showNotification(notification, '导出成功！', 'success')
  } catch (error) {
    console.error('Export error:', error)
    showNotification(notification, '导出失败: ' + formatErrorMessage(error), 'error')
  } finally {
    loading.value = false
  }
}

// --- 重置 ---

const reset = () => {
  originalPdfBytes.value = null
  pdfFileRef.value = null
  totalPages.value = 0
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
  position: relative;
}

/* Loading 遮罩 */
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

/* 深色模式 */
:root[data-theme="dark"] .main-bg {
  background-color: #121212;
}

:root[data-theme="dark"] .pdf-loading-overlay {
  background: rgba(0, 0, 0, 0.85);
}

:root[data-theme="dark"] .loading-text {
  color: #4dd0e1;
}

:root[data-theme="dark"] .v-app-bar {
  background-color: #1e1e1e !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

:root[data-theme="dark"] .settings-drawer {
  background-color: #1e1e1e !important;
  border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
}

:root[data-theme="dark"] .v-btn {
  color: #e0e0e0 !important;
}

:root[data-theme="dark"] .v-toolbar-title {
  color: #ffffff !important;
}
</style>
