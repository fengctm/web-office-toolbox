<template>
  <div v-if="pdfLoaded && totalPages > 0" class="preview-section">
    <!-- 预览标题和统计 -->
    <div class="preview-header mb-4">
      <v-alert type="info" variant="outlined" icon="mdi-image">
        <strong>预览模式：</strong> 显示前 {{ Math.min(totalPages, 12) }} 页的缩略图
      </v-alert>
    </div>

    <!-- 预览网格 -->
    <v-row>
      <v-col
          v-for="page in Math.min(totalPages, 12)"
          :key="page"
          cols="12"
          sm="6"
          md="4"
          lg="3"
      >
        <v-card
            class="page-preview-card"
            hover
            @click="openPreview(page)"
        >
          <!-- 页码标签 -->
          <v-toolbar density="compact" color="teal-darken-3" class="page-toolbar">
            <v-toolbar-title class="text-subtitle-2">
              第 {{ page }} 页
            </v-toolbar-title>
            <v-btn
                icon="mdi-magnify-plus"
                size="small"
                variant="text"
                @click.stop="openPreview(page)"
            ></v-btn>
          </v-toolbar>

          <!-- 预览内容 -->
          <v-card-text class="preview-content text-center">
            <!-- 显示真实预览图片 -->
            <div v-if="previewImages[page]" class="preview-image-container">
              <img
                  :src="previewImages[page]"
                  :alt="`第${page}页预览`"
                  class="preview-image"
                  @click.stop="openPreview(page)"
              />
            </div>
            <!-- 加载中状态 -->
            <div v-else-if="loading" class="loading-placeholder">
              <v-progress-circular
                  indeterminate
                  size="30"
                  color="teal"
              ></v-progress-circular>
              <div class="text-caption mt-2 text-grey">正在生成预览...</div>
            </div>
            <!-- 占位符 -->
            <div v-else class="preview-placeholder">
              <v-icon size="48" color="grey-darken-2">mdi-file-pdf-box</v-icon>
              <div class="page-number mt-2 text-grey">Page {{ page }}</div>
            </div>
          </v-card-text>

          <!-- 悬停操作 -->
          <v-card-actions class="justify-center">
            <v-btn
                size="small"
                color="teal"
                variant="text"
                prepend-icon="mdi-eye"
                @click.stop="openPreview(page)"
            >
              查看
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- 更多页面提示 -->
    <div v-if="totalPages > 12" class="mt-4 text-center">
      <v-chip color="info" variant="outlined" size="small">
        <v-icon start icon="mdi-dots-horizontal"></v-icon>
        还有 {{ totalPages - 12 }} 页未显示（导出时可全部处理）
      </v-chip>
    </div>
  </div>
</template>

<script setup>
import {onMounted, ref, watch} from 'vue'
import * as pdfjsLib from 'pdfjs-dist'

const props = defineProps({
  pdfLoaded: {
    type: Boolean,
    default: false
  },
  totalPages: {
    type: Number,
    default: 0
  },
  pdfFile: {
    type: Object,
    default: null
  },
  pdfPassword: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['open-preview'])

// 响应式状态
const previewImages = ref({})
const loading = ref(false)
const abortController = ref(null) // 用于取消之前的预览生成任务

// 生成预览图片
const generatePreviews = async () => {
  if (!props.pdfFile || !props.pdfLoaded) return

  // 取消之前的任务
  if (abortController.value) {
    abortController.value.abort()
  }

  // 创建新的AbortController用于取消
  const controller = new AbortController()
  abortController.value = controller

  loading.value = true
  previewImages.value = {}

  try {
    // 配置pdfjs worker
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
    }

    // 读取文件
    const arrayBuffer = await props.pdfFile.arrayBuffer()

    // 检查是否已取消
    if (controller.signal.aborted) {
      throw new Error('任务已取消')
    }

    // 尝试加载PDF，支持加密文件
    let pdf
    try {
      pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        password: props.pdfPassword || ''
      }).promise
    } catch (e) {
      if (controller.signal.aborted) {
        throw new Error('任务已取消')
      }
      if (e.message.includes('password') || e.message.includes('encrypted')) {
        console.warn('PDF已加密，尝试忽略加密访问...')
        pdf = await pdfjsLib.getDocument({
          data: arrayBuffer,
          disableEncryption: true
        }).promise
      } else {
        throw e
      }
    }

    // 检查是否已取消
    if (controller.signal.aborted) {
      throw new Error('任务已取消')
    }

    // 生成前12页的预览
    const pagesToPreview = Math.min(props.totalPages, 12)

    for (let i = 1; i <= pagesToPreview; i++) {
      // 检查是否已取消
      if (controller.signal.aborted) {
        throw new Error('任务已取消')
      }

      try {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({scale: 0.3}) // 小缩略图

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = viewport.width
        canvas.height = viewport.height

        await page.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise

        // 检查是否已取消
        if (controller.signal.aborted) {
          canvas.remove()
          throw new Error('任务已取消')
        }

        // 转换为图片数据URL
        const imageData = canvas.toDataURL('image/png')
        previewImages.value[i] = imageData

        // 清理canvas
        canvas.remove()
      } catch (error) {
        // 如果是取消错误，直接抛出
        if (error.message === '任务已取消') {
          throw error
        }
        console.error(`生成第${i}页预览失败:`, error)
        // 继续处理其他页面
      }
    }
  } catch (error) {
    // 如果是取消错误，不显示错误提示
    if (error.message !== '任务已取消') {
      console.error('预览生成失败:', error)
    }
  } finally {
    // 只有当这是当前任务时才清除loading状态
    if (abortController.value === controller) {
      loading.value = false
      abortController.value = null
    }
  }
}

// 监听props变化，自动生成预览
watch(() => [props.pdfLoaded, props.pdfFile, props.totalPages], ([loaded, file, pages]) => {
  if (loaded && file && pages > 0) {
    // 延迟执行，避免阻塞UI
    setTimeout(() => {
      generatePreviews()
    }, 100)
  }
}, {immediate: false})

// 组件挂载时检查
onMounted(() => {
  if (props.pdfLoaded && props.pdfFile) {
    generatePreviews()
  }
})

// 打开预览
const openPreview = (page) => {
  emit('open-preview', page)
}
</script>

<style scoped>
.preview-section {
  animation: slideUp 0.4s ease-out;
}

.page-preview-card {
  transition: all 0.3s ease;
  border-radius: 8px;
  overflow: hidden;
}

.page-preview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 150, 136, 0.2);
}

.page-toolbar {
  min-height: 36px;
}

.preview-content {
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

/* 预览图片容器 */
.preview-image-container {
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 4px;
  background: #f5f5f5;
}

/* 预览图片 */
.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.preview-image:hover {
  transform: scale(1.05);
}

/* 加载中状态 */
.loading-placeholder {
  text-align: center;
  padding: 10px;
}

/* 占位符 */
.preview-placeholder {
  text-align: center;
  opacity: 0.6;
}

.page-number {
  font-size: 0.75rem;
  font-weight: 500;
}

/* 动画定义 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 深色模式适配 */
.v-theme--dark .page-preview-card:hover {
  box-shadow: 0 8px 16px rgba(38, 166, 154, 0.3);
}

.v-theme--dark .preview-image-container {
  background: #1e1e1e;
}
</style>
