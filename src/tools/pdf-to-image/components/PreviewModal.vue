<template>
  <v-dialog
    v-model="modelValue"
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

      <v-card-text class="text-center pa-6">
        <!-- 大图预览区域 -->
        <div class="preview-large">
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
          <div v-else-if="previewImage" class="image-container">
            <img
              :src="previewImage"
              :alt="`第${currentPage}页预览`"
              class="preview-image"
            />
          </div>

          <!-- 错误/占位符状态 -->
          <div v-else class="placeholder-state">
            <v-icon size="128" color="grey-darken-2" class="preview-icon">mdi-file-pdf-box</v-icon>
            <div class="text-h6 mt-4 text-grey">PDF Page {{ currentPage }}</div>
            <div class="text-body-2 text-grey mt-1">无法生成预览</div>
          </div>
        </div>

        <!-- 导航控制 -->
        <div class="navigation-controls mt-6">
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

// 计算属性：双向绑定对话框状态
const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

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
.preview-large {
  text-align: center;
  padding: 40px 20px;
  background: rgba(0, 150, 136, 0.03);
  border-radius: 8px;
  border: 2px dashed rgba(0, 150, 136, 0.2);
}

.preview-icon {
  opacity: 0.4;
}

.navigation-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

/* 深色模式适配 */
.v-theme--dark .preview-large {
  background: rgba(38, 166, 154, 0.05);
  border-color: rgba(38, 166, 154, 0.3);
}

/* 响应式调整 */
@media (max-width: 600px) {
  .navigation-controls {
    flex-direction: column;
    gap: 8px;
  }

  .navigation-controls .v-btn {
    width: 100%;
  }
}
</style>
