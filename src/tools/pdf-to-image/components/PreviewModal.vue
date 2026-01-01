<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="updateModelValue"
    max-width="900"
    persistent
  >
    <v-card>
      <v-toolbar color="teal-darken-2">
        <v-toolbar-title>
          <v-icon start icon="mdi-eye"></v-icon>
          页面预览 - 第 {{ currentPage }} 页
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="close" variant="text">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-0">
        <!-- 大图预览区域 - 支持滚动 -->
        <div class="preview-container">
          <!-- 加载中状态 -->
          <div v-if="loading" class="loading-state">
            <v-progress-circular
              indeterminate
              size="60"
              color="teal"
              class="mb-4"
            ></v-progress-circular>
            <div class="text-body-1 text-grey">正在生成预览...</div>
          </div>

          <!-- 显示预览图片 -->
          <div v-else-if="previewImage" class="image-scroll-container">
            <img
              :src="previewImage"
              :alt="`第${currentPage}页预览`"
              class="preview-image-full"
            />
          </div>

          <!-- 错误/占位符状态 -->
          <div v-else class="placeholder-state">
            <v-icon size="128" color="grey-darken-2" class="preview-icon">mdi-file-pdf-box</v-icon>
            <div class="text-h6 mt-4 text-grey">PDF Page {{ currentPage }}</div>
            <div class="text-body-2 text-grey mt-1">无法生成预览</div>
          </div>
        </div>

        <!-- 导航控制 - 固定在底部 -->
        <div class="navigation-controls">
          <v-btn
            color="teal"
            variant="outlined"
            :disabled="currentPage <= 1 || loading"
            @click="prevPage"
            prepend-icon="mdi-chevron-left"
            class="mr-2"
          >
            上一页
          </v-btn>

          <v-chip color="teal" variant="flat" class="mx-2">
            {{ currentPage }} / {{ totalPages }}
          </v-chip>

          <v-btn
            color="teal"
            variant="outlined"
            :disabled="currentPage >= totalPages || loading"
            @click="nextPage"
            append-icon="mdi-chevron-right"
            class="ml-2"
          >
            下一页
          </v-btn>
        </div>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn color="grey" variant="text" @click="close" :disabled="loading">关闭</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  currentPage: {
    type: Number,
    default: 1
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

const emit = defineEmits([
  'update:modelValue',
  'update:currentPage',
  'prev-page',
  'next-page'
])

// 响应式状态
const previewImage = ref('')
const loading = ref(false)

// 更新模型值
const updateModelValue = (value) => {
  emit('update:modelValue', value)
}

// 生成预览图片
const generatePreview = async () => {
  if (!props.pdfFile || !props.currentPage) return

  loading.value = true
  previewImage.value = ''

  try {
    // 配置pdfjs worker
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
    }

    // 读取文件
    const arrayBuffer = await props.pdfFile.arrayBuffer()

    // 尝试加载PDF，支持加密文件
    let pdf
    try {
      pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        password: props.pdfPassword || ''
      }).promise
    } catch (e) {
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

    // 获取指定页面
    const page = await pdf.getPage(props.currentPage)

    // 设置缩放比例（大图预览）
    const viewport = page.getViewport({ scale: 1.5 })

    // 创建canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = viewport.width
    canvas.height = viewport.height

    // 渲染页面
    await page.render({
      canvasContext: ctx,
      viewport: viewport
    }).promise

    // 转换为图片数据URL
    previewImage.value = canvas.toDataURL('image/png')

    // 清理canvas
    canvas.remove()

  } catch (error) {
    console.error('预览生成失败:', error)
    previewImage.value = ''
  } finally {
    loading.value = false
  }
}

// 监听页面变化，重新生成预览
watch(() => [props.currentPage, props.modelValue], ([page, visible]) => {
  if (visible && page && props.pdfFile) {
    // 延迟执行，避免阻塞UI
    setTimeout(() => {
      generatePreview()
    }, 100)
  }
})

// 监听文件变化
watch(() => props.pdfFile, (file) => {
  if (file && props.modelValue && props.currentPage) {
    generatePreview()
  }
})

// 关闭对话框
const close = () => {
  if (!loading.value) {
    emit('update:modelValue', false)
    previewImage.value = ''
  }
}

// 上一页
const prevPage = () => {
  if (props.currentPage > 1 && !loading.value) {
    emit('prev-page')
  }
}

// 下一页
const nextPage = () => {
  if (props.currentPage < props.totalPages && !loading.value) {
    emit('next-page')
  }
}
</script>

<style scoped>
/* 预览容器 - 固定高度，支持滚动 */
.preview-container {
  height: 60vh; /* 占视口高度的60% */
  min-height: 400px;
  max-height: 600px;
  overflow: hidden;
  background: rgba(0, 150, 136, 0.03);
  border-radius: 8px 8px 0 0;
  border: 2px dashed rgba(0, 150, 136, 0.2);
  border-bottom: none;
}

/* 图片滚动容器 */
.image-scroll-container {
  height: 100%;
  overflow: auto; /* 支持滚动 */
  display: flex;
  align-items: flex-start; /* 顶部对齐 */
  justify-content: center;
  padding: 20px;
}

/* 完整显示的图片 */
.preview-image-full {
  max-width: 100%;
  height: auto;
  display: block;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 加载中状态 */
.loading-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

/* 占位符状态 */
.placeholder-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  opacity: 0.6;
}

.preview-icon {
  opacity: 0.4;
}

/* 导航控制 - 固定在底部 */
.navigation-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  padding: 16px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 0 0 8px 8px;
  border: 2px dashed rgba(0, 150, 136, 0.2);
  border-top: none;
}

/* 深色模式适配 */
.v-theme--dark .preview-container {
  background: rgba(38, 166, 154, 0.05);
  border-color: rgba(38, 166, 154, 0.3);
}

.v-theme--dark .navigation-controls {
  background: rgba(255, 255, 255, 0.02);
}

.v-theme--dark .preview-image-full {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

/* 滚动条样式 */
.image-scroll-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.image-scroll-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.image-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(0, 150, 136, 0.5);
  border-radius: 4px;
}

.image-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 150, 136, 0.7);
}

/* 响应式调整 */
@media (max-width: 900px) {
  .preview-container {
    height: 50vh;
    min-height: 300px;
    max-height: 500px;
  }

  .image-scroll-container {
    padding: 10px;
  }

  .navigation-controls {
    flex-direction: column;
    gap: 8px;
  }

  .navigation-controls .v-btn {
    width: 100%;
  }
}

@media (max-width: 600px) {
  .preview-container {
    height: 40vh;
    min-height: 250px;
    max-height: 400px;
  }

  .navigation-controls {
    padding: 12px;
  }
}
</style>
