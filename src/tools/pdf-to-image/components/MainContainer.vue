<template>
  <v-card class="pdf-to-image-tool" elevation="2">
    <!-- 工具标题区域 -->
    <v-card-item>
      <v-card-title class="d-flex align-center">
        <v-icon color="teal" class="mr-2">mdi-file-pdf-box</v-icon>
        PDF转图片
      </v-card-title>
      <v-card-subtitle>
        上传PDF文件，转换为高质量图片格式。完全本地处理，保护您的隐私安全。
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <!-- 文件上传区域 - 使用 PDFSecureUpload -->
      <PDFSecureUpload
          label="选择或拖拽 PDF 文件"
          @success="handleFileSelected"
          @reset="handleReset"
      />

      <!-- 预览网格区域 -->
      <PreviewGrid
          :pdf-loaded="pdfLoaded"
          :total-pages="totalPages"
          :pdf-file="pdfFile"
          :pdf-password="pdfPassword"
          @open-preview="handleOpenPreview"
      />

      <!-- 导出控制面板 -->
      <ExportPanel
          :pdf-loaded="pdfLoaded"
          :total-pages="totalPages"
          :exporting="exporting"
          @export-images="handleExportImages"
      />

      <!-- 操作提示区域 -->
      <TipsSection
          :pdf-file="pdfFile"
          :pdf-loaded="pdfLoaded"
          :total-pages="totalPages"
          :exporting="exporting"
          :processing="processing"
      />
    </v-card-text>

    <!-- 放大查看模态框 -->
    <PreviewModal
        v-model="previewDialog"
        :current-page="currentPage"
        :total-pages="totalPages"
        :pdf-file="pdfFile"
        :pdf-password="pdfPassword"
        @prev-page="prevPage"
        @next-page="nextPage"
    />

    <!-- 导出进度模态框 -->
    <ExportProgressModal
        v-model="exportProgressDialog"
        :format="exportConfig.format"
        :quality="exportConfig.quality"
        :progress="exportProgress"
        :current-page="exportCurrentPage"
        :total-pages="exportTotalPages"
        @cancel="cancelExport"
    />

    <!-- 结果提示 -->
    <NotificationSnackbar
        v-model="snackbar.show"
        :message="snackbar.message"
        :color="snackbar.color"
    />
  </v-card>
</template>

<script setup>
import {onMounted, reactive, ref} from 'vue'

// 导入子组件
import PDFSecureUpload from '@/components/PDFSecureUpload.vue'
import PreviewGrid from './PreviewGrid.vue'
import PreviewModal from './PreviewModal.vue'
import ExportPanel from './ExportPanel.vue'
import TipsSection from './TipsSection.vue'
import ExportProgressModal from './ExportProgressModal.vue'
import NotificationSnackbar from '@/components/NotificationSnackbar.vue'

// 导入依赖
import * as pdfjsLib from 'pdfjs-dist'
import JSZip from 'jszip'
import {saveAs} from 'file-saver'
import {
  formatUserFriendlyError,
  handleExportError,
  PerformanceMonitor,
  validateBrowserSupport
} from '../utils/error-handler'

// 状态管理
const pdfFile = ref(null)
const processing = ref(false)
const pdfLoaded = ref(false)
const totalPages = ref(0)
const exporting = ref(false)
const previewDialog = ref(false)
const exportProgressDialog = ref(false)
const currentPage = ref(1)
const pdfPassword = ref('')

// 导出相关状态
const exportConfig = reactive({
  format: 'png',
  quality: 2,
  range: 'all'
})

const exportProgress = ref(0)
const exportCurrentPage = ref(0)
const exportTotalPages = ref(0)

// 提示信息
const snackbar = ref({
  show: false,
  message: '',
  color: 'info'
})

// 子组件引用（已移除，直接使用 PDFSecureUpload）

// 配置pdfjs worker（使用匹配的版本）
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
}

// 性能监控器
const perfMonitor = PerformanceMonitor

// 延迟的浏览器兼容性检查（用于导出时）
const checkBrowserSupportForExport = () => {
  const result = validateBrowserSupport()
  if (!result.isValid) {
    const firstError = result.errors[0]
    showSnackbar(`${firstError.message} - ${firstError.solution}`, 'error')
    return false
  }

  // 显示警告信息
  if (result.warnings.length > 0) {
    result.warnings.forEach(warning => {
      console.warn(`PDF工具警告: ${warning.message} - ${warning.solution}`)
    })
  }

  return true
}

// 组件挂载时只做基本检查，不显示错误
onMounted(() => {
  // 延迟检查，给库加载时间
  setTimeout(() => {
    if (typeof pdfjsLib === 'undefined' || typeof JSZip === 'undefined') {
      console.warn('PDF工具: 部分库正在加载中...')
    }
  }, 1000)
})

// 处理 PDFSecureUpload 文件选择成功
const handleFileSelected = (result) => {
  const {file, password} = result

  // 保存文件和密码
  pdfFile.value = file
  pdfPassword.value = password || ''
  pdfLoaded.value = false
  totalPages.value = 0

  // 自动开始解析 PDF
  processPDF()
}

// 处理重置
const handleReset = () => {
  pdfFile.value = null
  pdfPassword.value = ''
  pdfLoaded.value = false
  totalPages.value = 0
  processing.value = false
  showSnackbar('已重置选择', 'info')
}

// 解析PDF（从FileUpload组件迁移过来的逻辑）
const processPDF = async () => {
  if (!pdfFile.value) {
    showSnackbar('请先选择PDF文件', 'warning')
    return
  }

  processing.value = true
  showSnackbar('正在解析PDF文件...', 'info')

  try {
    // 读取文件
    const arrayBuffer = await pdfFile.value.arrayBuffer()

    // 使用 PDFSecureUpload 已经验证过的密码
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      password: pdfPassword.value || ''
    }).promise

    const pageCount = pdf.numPages

    if (pageCount === 0) {
      throw new Error('PDF文件不包含任何页面')
    }

    // 验证可访问性 - 获取第一页
    const page = await pdf.getPage(1)

    // 额外的处理时间，让用户看到进度
    await new Promise(resolve => setTimeout(resolve, 800))

    totalPages.value = pageCount
    pdfLoaded.value = true
    processing.value = false
    showSnackbar(`PDF解析成功！共 ${pageCount} 页`, 'success')

  } catch (error) {
    processing.value = false

    // 处理错误
    const friendlyError = formatUserFriendlyError(error)

    if (friendlyError.severity === 'error') {
      showSnackbar(`${friendlyError.title} - ${friendlyError.suggestion}`, 'error')
    } else if (friendlyError.severity === 'warning') {
      showSnackbar(`${friendlyError.title} - ${friendlyError.suggestion}`, 'warning')
    } else {
      showSnackbar(friendlyError.title, 'info')
    }

    console.error('PDF解析错误:', {
      type: error.type,
      message: error.message,
      details: error.details
    })
  }
}

// 处理打开预览
const handleOpenPreview = (page) => {
  currentPage.value = page
  previewDialog.value = true
}

// 上一页
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

// 下一页
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// 处理导出图片 - 真实实现（带性能优化）
const handleExportImages = async (config) => {
  if (!pdfLoaded.value) {
    showSnackbar('请先解析PDF文件', 'warning')
    return
  }

  // 保存导出配置
  exportConfig.format = config.format
  exportConfig.quality = config.quality
  exportConfig.range = config.range

  exporting.value = true
  exportProgressDialog.value = true
  exportProgress.value = 0

  // 启动性能监控
  perfMonitor.start()

  try {
    // 检查浏览器支持（在导出时检查）
    if (!checkBrowserSupportForExport()) {
      throw new Error('浏览器不支持PDF处理')
    }

    // 读取PDF
    const arrayBuffer = await pdfFile.value.arrayBuffer()

    // 确定导出范围
    const pagesToExport = config.range === 'current'
        ? [currentPage.value]
        : Array.from({length: totalPages.value}, (_, i) => i + 1)

    exportTotalPages.value = pagesToExport.length
    exportCurrentPage.value = 0

    // 处理每一页
    const zip = new JSZip()
    const format = config.format
    const quality = config.quality / 3 // 转换为0-1范围

    // 加载PDF，使用 PDFSecureUpload 已验证的密码
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      password: pdfPassword.value || ''
    }).promise

    for (let i = 0; i < pagesToExport.length; i++) {
      if (!exporting.value) {
        // 用户取消了导出
        throw new PDFToolError('导出已取消', 'cancelled')
      }

      // 检查内存使用
      const memoryCheck = perfMonitor.checkMemory()
      if (memoryCheck.warning) {
        showSnackbar(memoryCheck.message, 'warning')
      }

      const pageNum = pagesToExport[i]
      exportCurrentPage.value = i + 1

      // 更新进度
      const progress = ((i + 1) / pagesToExport.length) * 100
      exportProgress.value = progress

      // 渲染页面
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({scale: 2.0})

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = viewport.width
      canvas.height = viewport.height

      // 使用requestAnimationFrame避免阻塞UI
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          page.render({
            canvasContext: ctx,
            viewport: viewport
          }).promise.then(resolve)
        })
      })

      // 转换为图片数据
      const imageData = canvas.toDataURL(`image/${format}`, quality)
      const base64Data = imageData.split(',')[1]

      // 添加到ZIP
      const filename = `page-${pageNum}.${format}`
      zip.file(filename, base64Data, {base64: true})

      // 清理canvas内存
      canvas.width = 0
      canvas.height = 0
      canvas.remove()
    }

    // 生成并下载ZIP - 自定义命名格式
    const pdfName = pdfFile.value.name.replace('.pdf', '')
    const formatName = config.format.toUpperCase()
    const pageCount = pagesToExport.length
    const zipName = `${pdfName}【转${formatName}${pageCount}张】.zip`

    const content = await zip.generateAsync({type: "blob"})
    saveAs(content, zipName)

    exportProgressDialog.value = false
    exporting.value = false

    const elapsed = perfMonitor.getElapsedTime()
    showSnackbar(`成功导出 ${pagesToExport.length} 张图片 (耗时: ${elapsed}s)`, 'success')

  } catch (error) {
    // 使用错误处理模块
    const handledError = error instanceof PDFToolError ? error : handleExportError(error)
    handlePDFProcessError(handledError)

    exportProgressDialog.value = false
    exporting.value = false
  }
}

// 取消导出
const cancelExport = () => {
  exporting.value = false
  exportProgressDialog.value = false
  showSnackbar('导出已取消', 'info')

  // 清理资源
  if (perfMonitor) {
    const elapsed = perfMonitor.getElapsedTime()
    console.log(`导出取消，耗时: ${elapsed}s`)
  }
}

// 显示提示消息
const showSnackbar = (message, color = 'info') => {
  snackbar.value = {
    show: true,
    message,
    color
  }
}
</script>

<style scoped>
.pdf-to-image-tool {
  border-radius: 12px;
  overflow: hidden;
}
</style>
