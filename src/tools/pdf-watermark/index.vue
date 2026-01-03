<template>
  <v-card class="pdf-watermark-app" elevation="0" :theme="themeName">
    <!-- 1. 加载遮罩 (Apple 风格) -->
    <transition name="apple-loader">
      <div v-if="loading" class="pdf-loading-overlay">
        <div class="loader-content">
          <v-progress-circular indeterminate color="teal" size="64" width="4" class="mb-4"></v-progress-circular>
          <div class="loading-text">{{ loadingText }}</div>
        </div>
      </div>
    </transition>

    <v-layout class="app-layout">
      <!-- 2. 顶部工具栏 -->
      <v-app-bar color="teal-darken-2" density="compact" flat>
        <v-app-bar-nav-icon @click="showSettings = !showSettings"></v-app-bar-nav-icon>
        <v-toolbar-title class="text-subtitle-1 font-weight-bold">
          PDF 水印专业版
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
            v-if="pdfFile"
            prepend-icon="mdi-download"
            variant="flat"
            color="teal-accent-4"
            class="mr-2"
            @click="exportPDF"
        >
          导出 PDF
        </v-btn>
      </v-app-bar>

      <!-- 3. 左侧/底部设置面板 (Google 材质设计) -->
      <v-navigation-drawer
          v-model="showSettings"
          :width="isMobile ? 320 : 380"
          elevation="1"
          location="left"
          class="settings-drawer"
      >
        <div class="pa-4">
          <div class="text-overline mb-4 text-teal">水印内容配置</div>

          <v-text-field
              v-model="config.text"
              label="水印文字"
              variant="outlined"
              density="comfortable"
              color="teal"
              clearable
          ></v-text-field>

          <v-row dense>
            <v-col cols="6">
              <v-select
                  v-model="config.font"
                  :items="['Standard', 'Serif', 'Monospace']"
                  label="字体"
                  variant="outlined"
                  density="comfortable"
              ></v-select>
            </v-col>
            <v-col cols="6">
              <v-text-field
                  v-model.number="config.color"
                  label="颜色"
                  type="color"
                  variant="outlined"
                  density="comfortable"
              ></v-text-field>
            </v-col>
          </v-row>

          <div class="text-overline mt-4 mb-2 text-teal">布局调节</div>

          <v-slider
              v-model="config.fontSize"
              label="大小"
              min="12" max="100" step="1"
              thumb-label
              color="teal"
          ></v-slider>

          <v-slider
              v-model="config.opacity"
              label="不透明度"
              min="0" max="1" step="0.1"
              thumb-label
              color="teal"
          ></v-slider>

          <v-slider
              v-model="config.rotation"
              label="旋转角度"
              min="-180" max="180" step="1"
              thumb-label
              color="teal"
          ></v-slider>

          <v-slider
              v-model="config.gap"
              label="间距 (密度)"
              min="50" max="400" step="10"
              thumb-label
              color="teal"
          ></v-slider>

          <v-row dense>
            <v-col cols="6">
              <v-text-field v-model.number="config.offsetX" label="X 偏移" type="number"
                            variant="underlined"></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field v-model.number="config.offsetY" label="Y 偏移" type="number"
                            variant="underlined"></v-text-field>
            </v-col>
          </v-row>
        </div>
      </v-navigation-drawer>

      <!-- 4. 主体内容 -->
      <v-main class="main-bg">
        <!-- 未上传状态 -->
        <div v-if="!pdfFile" class="fill-height d-flex align-center justify-center">
          <v-hover v-slot="{ isHovering, props }">
            <v-card
                v-bind="props"
                :elevation="isHovering ? 8 : 2"
                class="upload-card pa-10 text-center"
                @click="triggerUpload"
            >
              <v-icon size="80" color="teal-lighten-2" :class="{'pulse': isHovering}">mdi-cloud-upload</v-icon>
              <h2 class="mt-4 text-h5">点击或拖拽 PDF 文件</h2>
              <p class="text-grey mt-2">完全本地处理，保护您的隐私</p>
              <input type="file" ref="fileInput" hidden accept="application/pdf" @change="onFileChange">
            </v-card>
          </v-hover>
        </div>

        <!-- PDF 预览区 -->
        <div v-else class="preview-container fill-height">
          <PDFPreview
              :files="previewFiles"
              :margins="{top:0, right:0, bottom:0, left:0}"
              pageSize="original"
              :watermarkConfig="config"
          >
            <!-- 水印覆盖层逻辑 -->
            <template #watermark-layer>
              <div class="watermark-overlay" :style="watermarkStyle">
                <div v-for="n in 100" :key="n" class="watermark-item">
                  {{ config.text }}
                </div>
              </div>
            </template>
          </PDFPreview>
        </div>
      </v-main>
    </v-layout>

    <!-- 5. 密码对话框 -->
    <v-dialog v-model="passwordDialog" max-width="400" persistent>
      <v-card class="rounded-xl pa-4">
        <v-card-title>文档已加密</v-card-title>
        <v-card-text>
          该 PDF 文件受密码保护，请输入密码以继续。
          <v-text-field
              v-model="password"
              label="访问密码"
              type="password"
              variant="outlined"
              class="mt-4"
              color="teal"
              autofocus
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="reset">取消</v-btn>
          <v-btn color="teal" variant="flat" @click="processFileWithPassword">确认</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import {ref, reactive, computed, onMounted} from 'vue'
import {PDFDocument, rgb, degrees, StandardFonts} from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import PDFPreview from "@/components/PDFPreview.vue";

// 配置 pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

// --- 状态变量 ---
const loading = ref(false)
const loadingText = ref('')
const showSettings = ref(true)
const pdfFile = ref(null)
const previewFiles = ref([]) // 存储每页生成的图片 File 对象
const passwordDialog = ref(false)
const password = ref('')
const fileInput = ref(null)
const isMobile = ref(window.innerWidth < 600)

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

// --- 样式计算 (实时预览) ---
const watermarkStyle = computed(() => ({
  '--wm-text': `"${config.text}"`,
  '--wm-color': config.color,
  '--wm-opacity': config.opacity,
  '--wm-size': `${config.fontSize}px`,
  '--wm-rotate': `${config.rotation}deg`,
  '--wm-gap': `${config.gap}px`,
  '--wm-x': `${config.offsetX}px`,
  '--wm-y': `${config.offsetY}px`,
}))

// --- 文件处理 ---
const triggerUpload = () => fileInput.value.click()

const onFileChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  pdfFile.value = file
  await loadPDF(file)
}

const loadPDF = async (file, pass = '') => {
  loading.value = true
  loadingText.value = '正在解析 PDF...'

  try {
    const arrayBuffer = await file.arrayBuffer()
    // 1. 验证是否加密
    try {
      await PDFDocument.load(arrayBuffer, {password: pass})
    } catch (err) {
      if (err.message.includes('password')) {
        passwordDialog.value = true
        loading.value = false
        return
      }
      throw err
    }

    // 2. 使用 PDF.js 生成预览图
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
    passwordDialog.value = false
    loading.value = false
  } catch (err) {
    console.error(err)
    alert('文件加载失败: ' + err.message)
    reset()
  }
}

const processFileWithPassword = () => {
  loadPDF(pdfFile.value, password.value)
}

const reset = () => {
  pdfFile.value = null
  previewFiles.value = []
  passwordDialog.value = false
  loading.value = false
}

// --- 导出 PDF (核心逻辑) ---
const exportPDF = async () => {
  loading.value = true
  loadingText.value = '正在注入水印并打包...'

  try {
    const arrayBuffer = await pdfFile.value.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer, {password: password.value})
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

      // 这里的网格绘制逻辑需要匹配预览图的 CSS 密度
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
  } catch (err) {
    alert('导出失败: ' + err.message)
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.pdf-watermark-app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.upload-card {
  width: 90%;
  max-width: 500px;
  border: 2px dashed #009688;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);

  &:hover {
    background-color: #e0f2f1;
    transform: translateY(-5px);
  }
}

.pulse {
  animation: pulse-animation 2s infinite;
}

@keyframes pulse-animation {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* 核心预览水印 CSS */
:deep(.pdf-sheet) {
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    inset: -100%; /* 扩大范围以覆盖旋转后的空白 */
    pointer-events: none;
    z-index: 10;

    // 使用 mask 或 background-image 实现网格水印
    background-image: radial-gradient(circle, transparent 0%, transparent 100%);
    display: grid;
    grid-template-columns: repeat(auto-fill, var(--wm-gap));
    grid-template-rows: repeat(auto-fill, var(--wm-gap));

    // 这种方式模拟水印平铺
    background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48L3N2Zz4="); // 占位
  }
}

/* 更好的实时预览方案：在每一页上面盖一个 SVG 或 Div Grid */
:deep(.pdf-page-container) {
  position: relative;

  .watermark-grid-preview {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    align-content: space-around;
    overflow: hidden;
    z-index: 100;

    span {
      color: var(--wm-color);
      opacity: var(--wm-opacity);
      font-size: var(--wm-size);
      transform: rotate(var(--wm-rotate)) translate(var(--wm-x), var(--wm-y));
      margin: calc(var(--wm-gap) / 2);
      white-space: nowrap;
      user-select: none;
    }
  }
}

/* Apple Loader */
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

  .loading-text {
    font-size: 14px;
    color: #00796b;
    font-weight: 500;
  }
}

.apple-loader-enter-active, .apple-loader-leave-active {
  transition: all 0.5s ease;
}

.apple-loader-enter-from, .apple-loader-leave-to {
  opacity: 0;
}
</style>