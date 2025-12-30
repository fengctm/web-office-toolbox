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
      <!-- 文件上传区域 -->
      <FileUpload
        ref="fileUploadRef"
        @file-uploaded="handleFileUploaded"
        @pdf-processed="handlePdfProcessed"
        @error="handleError"
        @update:processing="handleProcessingUpdate"
      />

      <!-- 预览网格区域 -->
      <PreviewGrid
        :pdf-loaded="pdfLoaded"
        :total-pages="totalPages"
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
      @prev-page="prevPage"
      @next-page="nextPage"
    />

    <!-- 导出进度模态框 -->
    <ExportProgressModal
      v-model="exportProgressDialog"
      :format="exportConfig.format"
      :quality="exportConfig.quality"
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
import { ref, reactive } from 'vue'

// 导入子组件
import FileUpload from './FileUpload.vue'
import PreviewGrid from './PreviewGrid.vue'
import PreviewModal from './PreviewModal.vue'
import ExportPanel from './ExportPanel.vue'
import TipsSection from './TipsSection.vue'
import ExportProgressModal from './ExportProgressModal.vue'
import NotificationSnackbar from './NotificationSnackbar.vue'

// 状态管理
const pdfFile = ref(null)
const processing = ref(false)
const pdfLoaded = ref(false)
const totalPages = ref(0)
const exporting = ref(false)
const previewDialog = ref(false)
const exportProgressDialog = ref(false)
const currentPage = ref(1)

// 导出配置
const exportConfig = reactive({
  format: 'png',
  quality: 2,
  range: 'all'
})

// 提示信息
const snackbar = ref({
  show: false,
  message: '',
  color: 'info'
})

// 子组件引用
const fileUploadRef = ref(null)

// 处理文件上传
const handleFileUploaded = (file) => {
  pdfFile.value = file
  if (file) {
    showSnackbar('文件选择成功，请点击"解析PDF"按钮', 'success')
  }
}

// 处理PDF解析完成
const handlePdfProcessed = (pages) => {
  totalPages.value = pages
  pdfLoaded.value = true
  showSnackbar(`PDF解析成功！共 ${pages} 页`, 'success')
}

// 处理处理状态更新
const handleProcessingUpdate = (isProcessing) => {
  processing.value = isProcessing
}

// 处理错误
const handleError = (message) => {
  showSnackbar(message, 'error')
  // 重置相关状态
  if (fileUploadRef.value) {
    fileUploadRef.value.reset()
  }
  pdfFile.value = null
  pdfLoaded.value = false
  totalPages.value = 0
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

// 处理导出图片
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

  // 模拟导出过程
  try {
    const exportPages = config.range === 'current' ? 1 : totalPages.value
    const processingTime = exportPages * 200 // 每页200ms模拟时间

    await new Promise(resolve => setTimeout(resolve, processingTime))

    // 模拟下载过程
    await simulateDownload()

    exportProgressDialog.value = false
    exporting.value = false

    showSnackbar(
      `导出成功！${exportPages} 页已转换为 ${config.format.toUpperCase()} 格式`,
      'success'
    )
  } catch (error) {
    showSnackbar('导出失败，请重试', 'error')
    exportProgressDialog.value = false
    exporting.value = false
  }
}

// 模拟下载
const simulateDownload = async () => {
  return new Promise(resolve => {
    setTimeout(() => {
      // 创建模拟文件
      const content = `PDF to Image Export\nFormat: ${exportConfig.format}\nQuality: ${['低', '中', '高'][exportConfig.quality - 1]}\nPages: ${exportConfig.range === 'current' ? '1' : totalPages.value}\n\nThis is a simulated export.`
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pdf-export-${Date.now()}.txt`
      a.click()
      URL.revokeObjectURL(url)
      resolve()
    }, 500)
  })
}

// 取消导出
const cancelExport = () => {
  exportProgressDialog.value = false
  exporting.value = false
  showSnackbar('导出已取消', 'info')
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
