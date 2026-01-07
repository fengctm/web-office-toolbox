<template>
  <v-card class="pdf-compress-app" elevation="0">
    <!-- 1. Apple 风格全局加载遮罩 -->
    <transition name="apple-blur">
      <div v-if="state.processing" class="loading-overlay">
        <div class="loader-content">
          <v-progress-circular color="teal" indeterminate size="64" width="4"></v-progress-circular>
          <div class="mt-4 font-weight-medium text-teal">{{ state.processStatus }}</div>
          <div class="text-caption text-grey mt-1">请勿关闭页面...</div>
        </div>
      </div>
    </transition>

    <!-- 2. 顶部工具栏 -->
    <v-toolbar class="app-bar-blur" color="rgba(255,255,255,0.8)" flat>
      <v-icon class="ml-4" color="teal">mdi-zip-box</v-icon>
      <v-toolbar-title class="text-subtitle-1 font-weight-bold">PDF 极速压缩</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn v-if="state.file" color="grey" icon="mdi-refresh" variant="text" @click="reset"></v-btn>
    </v-toolbar>

    <v-divider></v-divider>

    <div class="app-body">
      <!-- 状态 A: 待上传 - 使用 PDFSecureUpload -->
      <transition name="slide-up">
        <div v-if="!state.file" class="upload-zone pa-10 fill-height d-flex flex-column align-center justify-center">
          <PDFSecureUpload
              label="选择或拖拽 PDF 文件"
              @success="handleFileSelected"
              @reset="reset"
          />
        </div>

        <!-- 状态 B: 压缩配置区 -->
        <v-container v-else class="config-zone pa-6">
          <v-row>
            <!-- 左侧：基础信息卡片 (Google MD3 风格) -->
            <v-col cols="12" md="5">
              <v-card border class="rounded-xl pa-4" color="teal" variant="tonal">
                <div class="text-overline mb-2">文档信息</div>
                <div class="d-flex align-center mb-4">
                  <v-icon color="teal" size="48">mdi-file-document-outline</v-icon>
                  <div class="ml-3 overflow-hidden">
                    <div class="text-subtitle-1 font-weight-bold text-truncate">{{ state.file.name }}</div>
                    <div class="text-caption">原始大小: {{ formatBytes(state.file.size) }}</div>
                  </div>
                </div>
                <v-divider class="mb-4"></v-divider>
                <div class="d-flex justify-space-between text-body-2 mb-2">
                  <span>页数:</span>
                  <span class="font-weight-bold">{{ state.pageCount }} 页</span>
                </div>
                <div class="d-flex justify-space-between text-body-2">
                  <span>状态:</span>
                  <v-chip :color="state.password ? 'success' : 'grey'" size="x-small" variant="flat">
                    {{ state.password ? '已解密' : '未加密' }}
                  </v-chip>
                </div>
              </v-card>
            </v-col>

            <!-- 右侧：压缩滑块与预计大小 -->
            <v-col cols="12" md="7">
              <div class="pa-4">
                <div class="d-flex align-center mb-6">
                  <span class="text-subtitle-1 font-weight-bold">压缩强度</span>
                  <v-spacer></v-spacer>
                  <v-chip color="teal-darken-2" label size="small">{{ qualityLabel }}</v-chip>
                </div>

                <v-slider
                    v-model="state.quality"
                    color="teal"
                    max="0.9"
                    min="0.1"
                    step="0.1"
                    thumb-label
                    track-color="teal-lighten-4"
                >
                  <template v-slot:prepend>
                    <v-icon color="teal-lighten-3">mdi-image-outline</v-icon>
                  </template>
                  <template v-slot:append>
                    <v-icon color="teal-darken-2">mdi-image-filter-center-focus</v-icon>
                  </template>
                </v-slider>

                <!-- 预计结果预览 -->
                <v-card bg-color="grey-lighten-4" class="rounded-lg pa-4 mt-4 d-flex align-center" variant="flat">
                  <div class="flex-grow-1">
                    <div class="text-caption text-grey">预计压缩后大小</div>
                    <div class="text-h5 font-weight-black text-teal">
                      ~ {{ estimatedSize }}
                    </div>
                  </div>
                  <v-icon color="teal-lighten-4" size="40">mdi-trending-down</v-icon>
                </v-card>

                <v-btn
                    block
                    class="mt-8 rounded-pill"
                    color="teal"
                    elevation="2"
                    prepend-icon="mdi-zip-box"
                    size="large"
                    @click="handleCompress"
                >
                  开始压缩并下载
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </transition>
    </div>
  </v-card>
</template>

<script setup>
import {computed, reactive} from 'vue'
import {PDFDocument} from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import PDFSecureUpload from '@/components/PDFSecureUpload.vue'

// 配置 PDFJS Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

// --- 响应式状态 ---
const state = reactive({
  file: null,
  password: '',
  pageCount: 0,
  quality: 0.5, // 0.1 - 0.9
  processing: false,
  processStatus: '',
})

// --- 计算属性 ---
const qualityLabel = computed(() => {
  if (state.quality <= 0.3) return '深度压缩 (低画质)'
  if (state.quality <= 0.6) return '平衡模式 (推荐)'
  return '高清压缩 (高画质)'
})

const estimatedSize = computed(() => {
  if (!state.file) return '0 KB'
  // 估算算法：基于原始大小 * 质量系数 * 修正因子
  const base = state.file.size * state.quality * 0.8
  return formatBytes(Math.max(base, state.file.size * 0.1))
})

// --- 核心方法 ---

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 处理 PDFSecureUpload 文件选择成功
const handleFileSelected = async (result) => {
  const {file, password} = result

  // 保存文件和密码
  state.file = file
  state.password = password || ''

  // 自动解析文件信息
  await loadFileInfo()
}

// 解析 PDF 信息（获取页数）
const loadFileInfo = async () => {
  state.processing = true
  state.processStatus = '正在解析文档...'

  try {
    const arrayBuffer = await state.file.arrayBuffer()
    // 使用 PDFSecureUpload 已验证的密码
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      password: state.password || ''
    })
    const pdf = await loadingTask.promise

    state.pageCount = pdf.numPages

    // 额外的处理时间，让用户看到进度
    await new Promise(resolve => setTimeout(resolve, 500))
  } catch (err) {
    alert('无法解析 PDF: ' + err.message)
    reset()
  } finally {
    state.processing = false
  }
}

/**
 * 核心压缩逻辑
 * 策略：将每一页重构为指定质量的图片再打包。这是目前前端减小 PDF 体积最稳妥的方法。
 */
const handleCompress = async () => {
  state.processing = true
  state.processStatus = '正在准备压缩引擎...'

  try {
    const arrayBuffer = await state.file.arrayBuffer()
    // 使用 PDFSecureUpload 已验证的密码
    const pdfjs = await pdfjsLib.getDocument({
      data: arrayBuffer,
      password: state.password || ''
    }).promise
    const outPdf = await PDFDocument.create()

    for (let i = 1; i <= pdfjs.numPages; i++) {
      state.processStatus = `正在压缩第 ${i} / ${pdfjs.numPages} 页...`

      const page = await pdfjs.getPage(i)
      // 这里的 scale 决定了基础分辨率，配合 quality 达到压缩效果
      const viewport = page.getViewport({scale: 1.5})

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({canvasContext: ctx, viewport}).promise

      // 核心压缩：将页面转为低质量 JPG
      const imgData = canvas.toDataURL('image/jpeg', state.quality)
      const imgBytes = await fetch(imgData).then(res => res.arrayBuffer())
      const img = await outPdf.embedJpg(imgBytes)

      const newPage = outPdf.addPage([img.width, img.height])
      newPage.drawImage(img, {x: 0, y: 0, width: img.width, height: img.height})
    }

    state.processStatus = '正在打包文档...'
    const finalBytes = await outPdf.save()
    const blob = new Blob([finalBytes], {type: 'application/pdf'})

    // 下载
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${state.file.name.replace('.pdf', '')}_compressed.pdf`
    link.click()

    state.processStatus = '完成!'
    setTimeout(() => state.processing = false, 1000)
  } catch (err) {
    alert('压缩失败: ' + err.message)
    state.processing = false
  }
}

const reset = () => {
  state.file = null
  state.password = ''
  state.pageCount = 0
  state.processing = false
}
</script>

<style lang="scss" scoped>
.pdf-compress-app {
  border-radius: 16px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  font-family: 'Roboto', sans-serif;
}

.app-bar-blur {
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.app-body {
  flex: 1;
  position: relative;
  background-color: #f8f9fa;
}

// Apple 风格加载层
.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 2000;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  display: flex;
  align-items: center;
  justify-content: center;

  .loader-content {
    text-align: center;
  }
}

// 上传卡片
.drop-card {
  width: 100%;
  max-width: 450px;
  height: 280px;
  border: 2px dashed #e0e0e0;
  border-radius: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: white;
  transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);

  &.is-hover {
    border-color: #009688;
    background-color: #e0f2f1;
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 150, 136, 0.1);
  }
}

.config-zone {
  max-width: 900px;
  margin: 0 auto;
}

// 动画
.apple-blur-enter-active, .apple-blur-leave-active {
  transition: opacity 0.5s ease;
}

.apple-blur-enter-from, .apple-blur-leave-to {
  opacity: 0;
}

.slide-up-enter-active {
  transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

/* 深色模式 */
:root[data-theme="dark"] {
  .pdf-compress-app {
    background-color: #1a1a1a;
  }

  .app-bar-blur {
    background-color: rgba(30, 30, 30, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .app-body {
    background-color: #121212;
  }

  .drop-card {
    background: #1e1e1e;
    border-color: #333;
  }

  .loading-overlay {
    background: rgba(0, 0, 0, 0.8);
  }
}

@media (max-width: 600px) {
  .drop-card {
    height: 200px;
    border-radius: 20px;
  }
}
</style>