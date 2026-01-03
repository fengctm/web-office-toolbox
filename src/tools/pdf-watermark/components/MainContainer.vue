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
import {PDFDocument, rgb, degrees, StandardFonts} from 'pdf-lib'
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
  await processPDF(file, '')
}

const handlePasswordSubmitted = (password) => {
  if (fileUploadRef.value) {
    fileUploadRef.value.password = password
  }
  // 使用密码重新处理PDF
  processPDF(pdfFile.value, password)
}

const processPDF = async (file, password) => {
  loading.value = true
  loadingText.value = '正在解析 PDF...'

  try {
    const arrayBuffer = await file.arrayBuffer()

    // 优先使用pdfjs加载（带密码），它对加密PDF支持更好
    let pdf
    try {
      // 如果密码为空字符串，传递undefined而不是空字符串
      const pdfPassword = password || undefined
      pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        password: pdfPassword
      }).promise
    } catch (pdfjsError) {
      // 如果pdfjs失败，尝试pdf-lib
      console.warn('pdfjs加载失败，尝试pdf-lib:', pdfjsError.message)

      try {
        // 如果密码为空字符串，传递undefined而不是空字符串
        const pdfPassword = password || undefined
        const pdfDoc = await PDFDocument.load(arrayBuffer, {
          ignoreEncryption: true,
          password: pdfPassword
        })
        const pageCount = pdfDoc.getPageCount()

        if (pageCount === 0) {
          throw new Error('PDF文件不包含任何页面')
        }

        // 重新用pdfjs加载验证
        pdf = await pdfjsLib.getDocument({
          data: arrayBuffer,
          password: pdfPassword
        }).promise

      } catch (pdfLibError) {
        // 如果都失败，检查是否是密码错误
        if (pdfjsError.message.includes('password') ||
            pdfLibError.message.includes('password') ||
            pdfjsError.message.includes('encrypted') ||
            pdfjsError.message.includes('encrypted') ||
            pdfLibError.message.includes('password') ||
            pdfLibError.message.includes('encrypted')) {
          
          loading.value = false
          // 显示密码输入框
          if (fileUploadRef.value) {
            fileUploadRef.value.showPasswordInput()
          }
          return
        }
        throw pdfjsError // 抛出原始错误
      }
    }

    // 获取总页数
    const pageCount = pdf.numPages

    // 验证可访问性 - 获取第一页
    const page = await pdf.getPage(1)

    // 渲染预览图
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
    showNotification(`PDF解析成功！共 ${pageCount} 页`, 'success')

  } catch (error) {
    loading.value = false

    // 如果是密码错误，重新显示密码输入框
    if (error.message.includes('密码错误') ||
        error.message.includes('password') ||
        error.message.includes('incorrect') ||
        error.message.includes('encrypted')) {
      showNotification('密码错误，请重新输入', 'error')
      if (fileUploadRef.value) {
        fileUploadRef.value.showPasswordInput()
      }
    } else {
      handleError('文件加载失败: ' + error.message)
      reset()
    }
  }
}

// --- 导出 PDF ---
const exportPDF = async () => {
  loading.value = true
  loadingText.value = '正在注入水印并打包...'

  try {
    const arrayBuffer = await pdfFile.value.arrayBuffer()
    let pdfDoc

    try {
      const password = fileUploadRef.value?.password || ''
      pdfDoc = await PDFDocument.load(arrayBuffer, {password})
    } catch (err) {
      const errorMsg = err.message.toLowerCase()
      if (errorMsg.includes('password') || errorMsg.includes('encrypted')) {
        loading.value = false
        showNotification('密码错误或 PDF 已加密', 'warning')
        if (fileUploadRef.value) {
          fileUploadRef.value.showPasswordInput()
        }
        return
      }
      throw err
    }

    // 检查水印文本是否包含中文字符
    const hasChinese = /[\u4e00-\u9fa5]/.test(config.text)

    if (hasChinese) {
      // 使用Canvas渲染中文水印并转换为图片
      await addChineseWatermarkAsImage(pdfDoc)
    } else {
      // 使用标准字体处理英文
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      const pages = pdfDoc.getPages()
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
    }

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

// --- 使用Canvas渲染中文水印并添加为图片 ---
const addChineseWatermarkAsImage = async (pdfDoc) => {
  const pages = pdfDoc.getPages()

  // 解析颜色
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : {r: 255, g: 0, b: 0}
  }
  const color = hexToRgb(config.color)

  // 为每一页创建水印图片
  for (const page of pages) {
    const {width, height} = page.getSize()

    // 创建Canvas来渲染水印
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // 设置Canvas尺寸（使用较高的分辨率）
    const scale = 2
    canvas.width = width * scale
    canvas.height = height * scale

    // 设置背景为透明
    ctx.fillStyle = 'rgba(0, 0, 0, 0)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 完全匹配预览图的SVG背景实现逻辑
    const gap = config.gap * scale
    const offsetX = config.offsetX * scale
    const offsetY = config.offsetY * scale

    // 创建单个SVG单元格（与预览图完全一致）
    const unitCanvas = document.createElement('canvas')
    const unitCtx = unitCanvas.getContext('2d')
    unitCanvas.width = gap
    unitCanvas.height = gap

    // 设置背景为透明
    unitCtx.fillStyle = 'rgba(0, 0, 0, 0)'
    unitCtx.fillRect(0, 0, gap, gap)

    // 关键：字体大小不乘以scale，与预览图保持一致
    const fontSize = config.fontSize
    unitCtx.font = `bold ${fontSize}px "Microsoft YaHei", "SimHei", "Noto Sans CJK SC", sans-serif`
    unitCtx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${config.opacity})`
    unitCtx.textAlign = 'center'
    unitCtx.textBaseline = 'middle'

    // 计算旋转中心
    const half = gap / 2
    const rotationRad = (config.rotation * Math.PI) / 180

    // 保存状态
    unitCtx.save()
    unitCtx.translate(half, half)
    unitCtx.rotate(rotationRad)
    unitCtx.fillText(config.text, 0, 0)
    unitCtx.restore()

    // 计算需要多少个单元格来覆盖整个页面
    const cols = Math.ceil(canvas.width / gap) + 2
    const rows = Math.ceil(canvas.height / gap) + 2

    // 绘制重复的背景
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * gap + offsetX
        const y = row * gap + offsetY

        if (x < canvas.width && y < canvas.height) {
          ctx.drawImage(unitCanvas, x, y)
        }
      }
    }

    // 转换为PNG图片
    const pngDataUrl = canvas.toDataURL('image/png')
    const pngBytes = await fetch(pngDataUrl).then(res => res.arrayBuffer())
    const pngImage = await pdfDoc.embedPng(pngBytes)

    // 将图片添加到PDF页面
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: width,
      height: height,
      opacity: 1
    })
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
