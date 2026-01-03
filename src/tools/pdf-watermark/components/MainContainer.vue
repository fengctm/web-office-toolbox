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
import { ref, reactive, computed, onMounted } from 'vue'
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'

// 导入子组件
import FileUpload from './FileUpload.vue'
import SettingsPanel from './SettingsPanel.vue'
import PreviewArea from './PreviewArea.vue'
import NotificationSnackbar from '@/components/NotificationSnackbar.vue'

// 配置 pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

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

// --- 通知方法 ---
const showNotification = (message, color = 'info') => {
  notification.message = message
  notification.color = color
  notification.show = true
  
  // 4秒后自动关闭
  setTimeout(() => {
    notification.show = false
  }, 4000)
}

// --- 文件处理 ---
const handleFileLoaded = async (file) => {
  pdfFile.value = file
  await loadPDF(file)
}

const handlePasswordSubmitted = (password) => {
  loadPDF(pdfFile.value, password)
}

const loadPDF = async (file, pass = '') => {
  loading.value = true
  loadingText.value = '正在解析 PDF...'

  try {
    const arrayBuffer = await file.arrayBuffer()
    
    // 验证是否加密
    try {
      await PDFDocument.load(arrayBuffer, {password: pass})
    } catch (err) {
      if (err.message.includes('password')) {
        fileUploadRef.value.showPasswordInput()
        loading.value = false
        return
      }
      throw err
    }

    // 使用 PDF.js 生成预览图
    const pdf = await pdfjsLib.getDocument({data: arrayBuffer, password: pass}).promise
    const pages = []

    for (let i = 1; i <= pdf.numPages; i++) {
      loadingText.value = `正在渲染第 ${i}/${pdf.numPages} 页...`
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({scale: 1.5})
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.height = viewport.height
      canvas.width = viewport.width

      await page.render({canvasContext: context, viewport}).promise

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8))
      pages.push(new File([blob], `page-${i}.jpg`, {type: 'image/jpeg'}))
    }

    previewFiles.value = pages
    loading.value = false
  } catch (err) {
    console.error(err)
    handleError('文件加载失败: ' + err.message)
    reset()
  }
}

// --- 导出 PDF ---
const exportPDF = async () => {
  loading.value = true
  loadingText.value = '正在注入水印并打包...'

  try {
    const arrayBuffer = await pdfFile.value.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const pages = pdfDoc.getPages()

    // 解析颜色
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
      } : {r: 0, g: 0, b: 0}
    }
    const c = hexToRgb(config.color)

    pages.forEach(page => {
      const {width, height} = page.getSize()

      for (let x = -width; x < width * 2; x += config.gap) {
        for (let y = -height; y < height * 2; y += config.gap) {
          page.drawText(config.text, {
            x: x + config.offsetX,
            y: y + config.offsetY,
            size: config.fontSize,
            font: font,
            color: rgb(c.r, c.g, c.b),
            opacity: config.opacity,
            rotate: degrees(config.rotation),
          })
        }
      }
    })

    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes], {type: 'application/pdf'})
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${pdfFile.value.name.replace('.pdf', '')}_水印版.pdf`
    a.click()

    loading.value = false
    showNotification('PDF 导出成功！', 'success')
  } catch (err) {
    handleError('导出失败: ' + err.message)
    loading.value = false
  }
}

// --- 错误处理 ---
const handleError = (message) => {
  showNotification(message, 'error')
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
  background: rgba(0, 0, 0, 0.7);
}

/* 深色模式 Loading 文字 */
:root[data-theme="dark"] .loading-text {
  color: #4dd0e1;
}
</style>
