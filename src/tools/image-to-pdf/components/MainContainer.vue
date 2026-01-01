<template>
  <v-card class="image-to-pdf-tool" elevation="2">
    <!-- 工具标题区域 -->
    <v-card-item>
      <v-card-title class="d-flex align-center">
        <v-icon color="teal" class="mr-2">mdi-file-pdf-box</v-icon>
        图片转 PDF
      </v-card-title>
      <v-card-subtitle>
        将多张图片合并为一个 PDF 文件，支持拖拽排序和预览
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <!-- 文件上传区域 -->
      <FileUpload
          ref="fileUploadRef"
          :image-list="imageList"
          @images-added="handleImagesAdded"
          @error="handleError"
      />

      <!-- 图片列表和排序区域 -->
      <ImageList
          v-if="imageList.length > 0"
          :image-list="imageList"
          @remove-image="removeImage"
          @move-image="moveImage"
          @add-more="addMoreImages"
          @sort-images="sortImages"
          @open-page-dialog="openPageDialog"
      />

      <!-- 预览和导出区域 -->
      <PreviewExport
          v-if="imageList.length > 0"
          :image-list="imageList"
          :pdf-config="pdfConfig"
          :is-generating="isGenerating"
          @update-config="updateConfig"
          @export-pdf="exportToPdf"
          @scroll-to-page="scrollToPage"
      />
    </v-card-text>

    <!-- 页码跳转对话框 -->
    <PageJumpDialog
        v-model="pageDialog.show"
        :current-index="pageDialog.currentIndex"
        :total-pages="imageList.length"
        @confirm="jumpToPage"
    />

    <!-- 导出进度模态框 -->
    <ExportProgressModal
        v-model="exportProgressDialog.show"
        :progress="exportProgress"
        :current-page="exportCurrentPage"
        :total-pages="imageList.length"
        @cancel="cancelExport"
    />

    <!-- 结果提示 -->
    <NotificationSnackbar
        v-model="snackbar.show"
        :message="snackbar.message"
        :color="snackbar.color"
    />

    <!-- 性能监控 -->
    <PerformanceMonitor ref="performanceMonitor" />
  </v-card>
</template>

<script setup>
import { reactive, ref, onUnmounted } from 'vue'

// 导入子组件
import FileUpload from './FileUpload.vue'
import ImageList from './ImageList.vue'
import PreviewExport from './PreviewExport.vue'
import PageJumpDialog from './PageJumpDialog.vue'
import ExportProgressModal from './ExportProgressModal.vue'
import NotificationSnackbar from '@/components/NotificationSnackbar.vue'
import PerformanceMonitor from './PerformanceMonitor.vue'

// 导入依赖
import { PDFWorkerManager } from '../utils/worker-manager'

// 状态管理
const imageList = ref([])
const fileUploadRef = ref(null)
const isGenerating = ref(false)
const performanceMonitor = ref(null)

const pdfConfig = reactive({
  fileName: '图片转PDF',
  pageSize: 'A4'
})

const pageDialog = reactive({
  show: false,
  currentIndex: 0
})

const exportProgressDialog = reactive({
  show: false
})

const exportProgress = ref(0)
const exportCurrentPage = ref(0)

const snackbar = ref({
  show: false,
  message: '',
  color: 'info'
})

// 处理图片添加
const handleImagesAdded = (files) => {
  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      imageList.value.push({
        id: Date.now() + Math.random(),
        file: file,
        preview: e.target.result,
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB'
      })
    }
    reader.readAsDataURL(file)
  })

  showSnackbar(`成功添加 ${files.length} 张图片`, 'success')
}

// 移除图片
const removeImage = (index) => {
  imageList.value.splice(index, 1)
  showSnackbar('图片已移除', 'info')
}

// 移动行（处理拖拽排序）- 行索引转换为扁平数组操作
const moveRow = ({ from, to }) => {
  // 获取当前的列数（需要与 ImageList 组件同步）
  const columns = getColumns()

  // 计算行对应的扁平数组索引范围
  const fromStartIndex = from * columns
  const toStartIndex = to * columns

  // 获取要移动的行的所有图片
  const rowItems = imageList.value.slice(fromStartIndex, fromStartIndex + columns)

  // 从原位置移除
  imageList.value.splice(fromStartIndex, columns)

  // 计算新的插入位置（需要考虑移除后索引的变化）
  let insertIndex = toStartIndex
  if (toStartIndex > fromStartIndex) {
    // 如果移动到后面的位置，需要调整索引
    insertIndex = toStartIndex - columns
  }

  // 插入到新位置
  imageList.value.splice(insertIndex, 0, ...rowItems)

  showSnackbar('图片顺序已更新', 'success')
}

// 获取当前列数（与 ImageList 组件逻辑保持一致）
const getColumns = () => {
  const width = window.innerWidth
  if (width < 600) return 1
  else if (width < 960) return 2
  else return 4
}

// 移动图片（处理拖拽排序和按钮移动）
const moveImage = (params) => {
  if (params && typeof params === 'object' && 'from' in params && 'to' in params) {
    // 拖拽排序模式：from 和 to 是索引
    const { from, to } = params
    if (from >= 0 && from < imageList.value.length && to >= 0 && to < imageList.value.length) {
      const item = imageList.value.splice(from, 1)[0]
      imageList.value.splice(to, 0, item)
      showSnackbar('图片顺序已更新', 'success')
    }
  } else {
    // 原来的按钮移动模式：index 和 direction
    const index = params
    const direction = arguments[1]
    const newIndex = index + direction
    if (newIndex >= 0 && newIndex < imageList.value.length) {
      const item = imageList.value.splice(index, 1)[0]
      imageList.value.splice(newIndex, 0, item)
    }
  }
}

// 排序图片
const sortImages = () => {
  imageList.value.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'}))
  showSnackbar('按文件名自动排序完成', 'success')
}

// 添加更多图片
const addMoreImages = () => {
  if (fileUploadRef.value) {
    fileUploadRef.value.triggerFileInput()
  }
}

// 打开页码跳转对话框
const openPageDialog = (index) => {
  pageDialog.currentIndex = index
  pageDialog.show = true
}

// 跳转到指定页码
const jumpToPage = (targetPage) => {
  const targetIndex = Math.max(0, Math.min(targetPage - 1, imageList.value.length - 1))
  const item = imageList.value.splice(pageDialog.currentIndex, 1)[0]
  imageList.value.splice(targetIndex, 0, item)
  showSnackbar(`已移动到第 ${targetPage} 页`, 'success')
}

// 滚动到指定页面
const scrollToPage = (index) => {
  const el = document.getElementById(`page-${index}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// 更新配置
const updateConfig = (key, value) => {
  pdfConfig[key] = value
}

// 处理错误
const handleError = (message) => {
  showSnackbar(message, 'error')
}

// 显示提示消息
const showSnackbar = (message, color = 'info') => {
  snackbar.value = {
    show: true,
    message,
    color
  }
}

// Worker 管理器实例
let workerManager = null

// 导出 PDF - 使用 Worker 异步处理
const exportToPdf = async () => {
  if (imageList.value.length === 0) {
    showSnackbar('请先添加图片', 'warning')
    return
  }

  // 验证文件对象
  const validImages = imageList.value.filter(img => img.file)
  if (validImages.length === 0) {
    showSnackbar('没有有效的图片文件', 'error')
    return
  }

  isGenerating.value = true
  exportProgressDialog.show = true
  exportProgress.value = 0
  exportCurrentPage.value = 0

  try {
    // 获取或创建 Worker 管理器
    if (!workerManager) {
      workerManager = new PDFWorkerManager()
    }

    // 启动性能监控
    if (performanceMonitor.value) {
      performanceMonitor.value.start('PDF 导出中')
    }

    // 设置回调函数
    workerManager
      .onProgress(({ current, total, percentage, currentPage, message }) => {
        exportProgress.value = percentage
        exportCurrentPage.value = currentPage
        // 可以在这里显示更详细的消息
        if (message) {
          console.log(`进度: ${message}`)
        }
      })
      .onComplete(() => {
        showSnackbar(`成功导出 ${validImages.length} 页 PDF`, 'success')
        cleanupExport()
      })
      .onError((errorMessage, error) => {
        console.error('导出错误:', error)
        showSnackbar('导出失败: ' + errorMessage, 'error')
        cleanupExport()
      })
      .onCancel(() => {
        showSnackbar('导出已取消', 'info')
        cleanupExport()
      })

    // 准备文件列表（只传递原始文件对象）
    const files = validImages.map(img => img.file)

    // 开始异步导出
    await workerManager.start(files, {
      fileName: pdfConfig.fileName,
      pageSize: pdfConfig.pageSize
    })

  } catch (error) {
    showSnackbar('导出初始化失败: ' + error.message, 'error')
    cleanupExport()
  }
}

// 取消导出
const cancelExport = () => {
  if (workerManager) {
    workerManager.cancel()
  } else {
    cleanupExport()
    showSnackbar('导出已取消', 'info')
  }
}

// 清理导出状态
const cleanupExport = () => {
  isGenerating.value = false
  exportProgressDialog.show = false
  exportProgress.value = 0
  exportCurrentPage.value = 0

  if (workerManager) {
    workerManager.cleanup()
  }

  // 停止性能监控
  if (performanceMonitor.value) {
    performanceMonitor.value.stop()
  }
}

// 组件卸载时清理
onUnmounted(() => {
  // 清理图片预览数据
  imageList.value = []

  // 终止 Worker
  if (workerManager) {
    workerManager.terminate()
    workerManager = null
  }
})
</script>

<style scoped>
.image-to-pdf-tool {
  border-radius: 12px;
  overflow: hidden;
}
</style>
