<template>
  <div :class="{ 'is-mobile': isMobile }" class="chrome-pdf-container">

    <!-- 1. 顶部工具栏 -->
    <div class="pdf-header">
      <v-btn
          color="white"
          density="comfortable"
          icon="mdi-view-headline"
          variant="text"
          @click="showSidebar = !showSidebar"
      ></v-btn>

      <div v-if="!isMobile" class="file-name text-truncate ml-2">{{ fileName }}</div>

      <v-spacer></v-spacer>

      <v-chip v-if="!isMobile" class="mr-2" color="grey-lighten-1" size="x-small" variant="outlined">
        {{ isProcessing ? '渲染中...' : (pages.length === 0 ? '无数据' : `${pages.length} 页`) }}
      </v-chip>

      <!-- 缩放控制组 -->
      <div class="zoom-controls d-flex align-center bg-black-o-2 rounded-pill px-2 mx-2">
        <v-btn :disabled="zoom <= 0.5" color="white" icon="mdi-minus" size="x-small" variant="text"
               @click="changeZoom(-0.1)"></v-btn>
        <span class="zoom-text mx-2">{{ Math.round(zoom * 100) }}%</span>
        <v-btn :disabled="zoom >= 2.0" color="white" icon="mdi-plus" size="x-small" variant="text"
               @click="changeZoom(0.1)"></v-btn>
      </div>

      <v-spacer v-if="!isMobile"></v-spacer>

      <div class="page-indicator">
        {{ currentPage }} / {{ pages.length }}
      </div>

      <v-btn v-if="!isMobile" color="white" icon="mdi-printer" variant="text" @click="handlePrint"></v-btn>
    </div>

    <div class="pdf-body">
      <!-- 2. 移动端遮罩层 -->
      <transition name="fade">
        <div v-if="isMobile && showSidebar" class="pdf-scrim" @click="showSidebar = false"></div>
      </transition>

      <!-- 3. 左侧缩略图 -->
      <transition name="slide">
        <aside v-show="showSidebar" class="pdf-sidebar">
          <div class="thumb-list">
            <!-- 加载状态占位 -->
            <div v-if="isProcessing" class="d-flex justify-center pa-4 text-grey-lighten-2 caption">
              <v-progress-circular color="grey" indeterminate size="24"></v-progress-circular>
              <span class="ml-2">解析文档中...</span>
            </div>

            <div
                v-for="(page, index) in pages"
                :key="page.id"
                :class="{ 'active': currentPage === index + 1 }"
                class="thumb-item"
                @click="handleThumbClick(index)"
            >
              <div :style="getPaperStyle(page, 100)" class="thumb-paper">
                <div class="image-box">
                  <!-- PDF 渲染出来的图片或原图片 -->
                  <img :src="page.url" class="fit-img" @load="e => onImageLoad(e, index)"/>
                  <!-- 骨架屏占位，如果 URL 为空时显示 -->
                  <v-skeleton-loader v-if="!page.url" class="w-100 h-100 absolute top-0 left-0"
                                     type="image"></v-skeleton-loader>
                </div>
                <!-- 缩略图也显示微缩水印 -->
                <div :style="watermarkStyle" class="watermark-overlay mini"></div>
              </div>
              <div class="thumb-num">{{ index + 1 }}</div>
            </div>
          </div>
        </aside>
      </transition>

      <!-- 4. 右侧主预览区 -->
      <main ref="scrollContainer" class="pdf-main" @scroll="onScroll">
        <div :style="contentWrapperStyle" class="pdf-content-wrapper">
          <div
              v-for="(page, index) in pages"
              :key="'page-' + page.id"
              :ref="el => pageRefs[index] = el"
              :style="getPageContainerStyle(page)"
              class="pdf-page-container"
          >
            <!-- 纸张 -->
            <div :style="getPaperStyle(page, BASE_WIDTH_PX * zoom)" class="pdf-sheet">
              <div class="image-box">
                <!-- PDF 渲染出来的图片或原图片 -->
                <img :src="page.url" class="fit-img"/>
                <v-skeleton-loader v-if="!page.url" class="w-100 h-100 absolute top-0 left-0"
                                   type="image"></v-skeleton-loader>
              </div>

              <!-- 【核心新增】水印覆盖层 -->
              <div
                  v-if="watermarkConfig.text && page.url"
                  :style="watermarkStyle"
                  class="watermark-overlay"
              ></div>
            </div>
          </div>
          <div class="footer-spacer"></div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import {computed, onMounted, onUnmounted, reactive, ref, watchEffect} from 'vue'
import * as pdfjsLib from 'pdfjs-dist'

// 配置 PDFJS Worker (使用您提供的版本对应的 CDN)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const props = defineProps({
  files: {type: Array, default: () => []},
  margins: {
    type: Object,
    default: () => null  // null 表示根据文件类型自动选择
  },
  pageSize: {type: String, default: "A4"},
  watermarkConfig: {
    type: Object,
    default: () => ({
      text: '',
      fontSize: 20,
      color: '#000000',
      opacity: 0.3,
      rotation: -45,
      gap: 100,
      offsetX: 0,
      offsetY: 0,
      font: 'sans-serif'
    })
  },
  // 新增：支持密码参数，格式可以是字符串或对象 { file: File, password: string }
  password: {
    type: [String, Object],
    default: ''
  }
})

// 常量与状态
const BASE_WIDTH_PX = 800;
const A4_WIDTH_MM = 210;
const A4_RATIO = 0.707; // 210 / 297

const showSidebar = ref(window.innerWidth > 600)
const isMobile = ref(window.innerWidth <= 600)
const scrollContainer = ref(null)
const pageRefs = ref([])
const currentPage = ref(1)
const zoom = ref(1.0)
const imageRatios = reactive({})
const isProcessing = ref(false) // 新增：处理状态

const fileName = computed(() => {
  if (!props.files || props.files.length === 0) return '未选择文件'
  return props.files[0].name || (props.files[0].file ? props.files[0].file.name : '文档预览')
})

// 页面数据结构: { id: string, url: string, fileIndex: number }
const pages = ref([])

// 【核心逻辑】处理文件并生成图片
watchEffect(async () => {
  const files = props.files || []

  // 1. 清理旧资源
  if (pages.value.length > 0) {
    pages.value.forEach(p => {
      // 只释放 Blob URL，DataURL 是字符串无需释放
      if (p.url && p.url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(p.url)
        } catch (e) {
        }
      }
    })
    pages.value = []
  }

  if (files.length === 0) return

  isProcessing.value = true

  // 2. 遍历文件
  let pageIndexCounter = 0

  for (let fIndex = 0; fIndex < files.length; fIndex++) {
    const fileObj = files[fIndex]

    // 标准化 File 对象和提取密码
    let actualFile = fileObj
    let filePassword = ''

    // 情况 1: 文件对象格式 { file: File, password: string }
    if (fileObj && typeof fileObj === 'object' && !(fileObj instanceof Blob)) {
      actualFile = fileObj.file || fileObj
      if (fileObj.password) {
        filePassword = fileObj.password
      }
    }

    // 情况 2: 通过 props.password 参数传递密码
    if (props.password) {
      if (typeof props.password === 'string') {
        filePassword = props.password
      } else if (typeof props.password === 'object' && props.password[fileObj.name]) {
        filePassword = props.password[fileObj.name]
      }
    }

    if (!actualFile || !(actualFile instanceof Blob)) continue

    try {
      // 判断是否为 PDF
      if (actualFile.type === 'application/pdf' || (actualFile.name && actualFile.name.toLowerCase().endsWith('.pdf'))) {
        // --- A. 处理 PDF ---
        const arrayBuffer = await actualFile.arrayBuffer()
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          password: filePassword || undefined  // 传递密码
        })
        const pdf = await loadingTask.promise

        // 遍历 PDF 的每一页
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const pageId = `pdf-${fIndex}-p${pageNum}`
          pages.value.push({
            id: pageId,
            url: '', // 先占位，等渲染完成后填充
            fileIndex: fIndex
          })

          // 渲染逻辑（不阻塞主线程）
          renderPdfPageToImg(pdf, pageNum).then(dataUrl => {
            const targetPage = pages.value.find(p => p.id === pageId)
            if (targetPage) targetPage.url = dataUrl
          })
        }
      } else {
        // --- B. 处理普通图片 (JPG/PNG等) ---
        const url = URL.createObjectURL(actualFile)
        pages.value.push({
          id: `img-${fIndex}`,
          url: url,
          fileIndex: fIndex
        })
      }
    } catch (err) {
      console.error('File processing error:', err)
    }
  }

  // 简单的延迟防止闪烁
  setTimeout(() => {
    isProcessing.value = false
  }, 500)
})

// 辅助函数：将 PDF 某一页渲染为 Base64 图片
const renderPdfPageToImg = async (pdf, pageNum) => {
  const page = await pdf.getPage(pageNum)
  // scale 1.5 或 2.0 保证清晰度
  const viewport = page.getViewport({scale: 1.5})

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = viewport.width
  canvas.height = viewport.height

  await page.render({canvasContext: ctx, viewport}).promise

  // 转为 JPEG 格式以节省内存（如果需要透明背景则用 PNG）
  return canvas.toDataURL('image/jpeg', 0.9)
}

// 【核心逻辑】生成动态水印样式
const watermarkStyle = computed(() => {
  const conf = props.watermarkConfig;
  if (!conf.text) return {};

  const size = conf.gap || 100;
  const half = size / 2;
  const escapedText = conf.text.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <text
        x="${half}"
        y="${half}"
        fill="${conf.color}"
        font-size="${conf.fontSize}"
        font-family="${conf.font}"
        fill-opacity="${conf.opacity}"
        text-anchor="middle"
        dominant-baseline="middle"
        transform="rotate(${conf.rotation} ${half} ${half})"
      >
        ${escapedText}
      </text>
    </svg>
  `.trim();

  const encodedSvg = btoa(unescape(encodeURIComponent(svg)));

  return {
    backgroundImage: `url("data:image/svg+xml;base64,${encodedSvg}")`,
    backgroundRepeat: 'repeat',
    backgroundPosition: `${conf.offsetX}px ${conf.offsetY}px`,
    backgroundSize: isMobile.value ? `${size * 0.5}px` : 'auto'
  };
});

// 获取图片加载后的比例
const onImageLoad = (event, index) => {
  const {naturalWidth, naturalHeight} = event.target
  imageRatios[index] = naturalWidth / naturalHeight
}

const getPaperStyle = (page, baseWidth) => {
  const index = pages.value.indexOf(page)
  // PDF 渲染后通常是 A4 比例，或者我们可以根据实际图片比例
  const ratio = imageRatios[index] || A4_RATIO
  const mmToPx = baseWidth / A4_WIDTH_MM;

  // 动态确定页边距：PDF 为 0，图片为 20
  let margins = props.margins
  if (!margins) {
    // 根据页面 ID 判断类型
    const isPDF = page.id && page.id.startsWith('pdf-')
    margins = isPDF ? {top: 0, right: 0, bottom: 0, left: 0} : {top: 20, right: 20, bottom: 20, left: 20}
  }

  const style = {
    paddingTop: `${margins.top * mmToPx}px`,
    paddingRight: `${margins.right * mmToPx}px`,
    paddingBottom: `${margins.bottom * mmToPx}px`,
    paddingLeft: `${margins.left * mmToPx}px`,
    backgroundColor: 'white',
    boxShadow: '0 0 15px rgba(0,0,0,0.3)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  }

  if (props.pageSize === 'A4') {
    style.aspectRatio = '0.707'; // 强制 A4 比例
    style.width = `${baseWidth}px`;
  } else {
    style.width = `${baseWidth}px`;
    style.aspectRatio = 'auto';
    style.minHeight = `${baseWidth / ratio}px`;
  }
  return style
}

const getPageContainerStyle = (page) => {
  const baseWidth = Math.min(BASE_WIDTH_PX * zoom.value, window.innerWidth - 40);
  return {
    width: `${baseWidth}px`,
    marginBottom: '20px'
  }
}

const contentWrapperStyle = computed(() => ({
  padding: isMobile.value ? '10px' : '32px'
}))

// 基础交互逻辑
const handleResize = () => {
  isMobile.value = window.innerWidth <= 600
  if (isMobile.value) showSidebar.value = false
}

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  // 清理所有 Blob URL
  pages.value.forEach(p => {
    if (p.url && p.url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(p.url)
      } catch (e) {
      }
    }
  })
})

const changeZoom = (delta) => {
  const newZoom = parseFloat((zoom.value + delta).toFixed(1))
  if (newZoom >= 0.5 && newZoom <= 2.0) zoom.value = newZoom
}

const handleThumbClick = (index) => {
  scrollToPage(index)
  if (isMobile.value) showSidebar.value = false
}

const scrollToPage = (index) => {
  const container = scrollContainer.value
  const target = pageRefs.value[index]
  if (container && target) {
    container.scrollTo({top: target.offsetTop - 10, behavior: 'smooth'})
  }
}

const onScroll = (e) => {
  const container = e.target
  const viewportCenter = container.scrollTop + (container.clientHeight / 2)
  for (let i = 0; i < pageRefs.value.length; i++) {
    const el = pageRefs.value[i]
    if (el && el.offsetTop <= viewportCenter && (el.offsetTop + el.offsetHeight) >= viewportCenter) {
      currentPage.value = i + 1
      break
    }
  }
}

const handlePrint = () => window.print()
</script>

<style lang="scss" scoped>
/* 保持原有样式不变，增加骨架屏定位相关 */
.chrome-pdf-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: #525659;
  overflow: hidden;
  position: relative;
  font-family: Roboto, sans-serif;

  &.is-mobile .pdf-sidebar {
    position: absolute;
    left: 0;
    top: 48px;
    height: calc(100% - 48px);
    z-index: 100;
    box-shadow: 10px 0 20px rgba(0, 0, 0, 0.4);
  }
}

/* 深色模式适配修正 */
:root[data-theme="dark"] .chrome-pdf-container {
  background-color: #1e1e1e !important;
}

:root[data-theme="dark"] .pdf-header {
  background-color: #2d2d2d !important;
}

:root[data-theme="dark"] .pdf-sidebar {
  background-color: #2d2d2d !important;
  border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
}

:root[data-theme="dark"] .pdf-main {
  background-color: #1e1e1e !important;
}

/* 水印覆盖层核心样式 */
.watermark-overlay {
  position: absolute !important;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
  mix-blend-mode: normal !important;

  &.mini {
    background-size: 50% !important;
  }
}

.pdf-header {
  height: 48px;
  background-color: #323639;
  display: flex;
  align-items: center;
  padding: 0 16px;
  z-index: 110;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

  .zoom-controls {
    background: rgba(255, 255, 255, 0.1);

    .zoom-text {
      font-size: 12px;
      min-width: 45px;
      text-align: center;
      font-weight: 500;
    }
  }

  .page-indicator {
    background: rgba(0, 0, 0, 0.3);
    padding: 2px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    letter-spacing: 1px;
  }
}

.pdf-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.pdf-sidebar {
  width: 180px;
  background-color: #323639;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.thumb-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }
}

.thumb-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 28px;
  cursor: pointer;

  .thumb-paper {
    position: relative;
    transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
    overflow: hidden;

    .image-box {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
    }

    .fit-img {
      width: 100%;
      height: auto;
      display: block;
    }
  }

  &:hover .thumb-paper {
    transform: translateY(-2px);
  }

  &.active {
    .thumb-paper {
      transform: scale(1.08);
      box-shadow: 0 0 0 2px #8ab4f8, 0 10px 20px rgba(0, 0, 0, 0.5);
    }

    .thumb-num {
      color: #8ab4f8;
      font-weight: bold;
    }
  }
}

.thumb-num {
  font-size: 11px;
  color: #bdc1c6;
  margin-top: 10px;
}

.pdf-main {
  flex: 1;
  overflow-y: auto;
  background-color: #525659;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    width: 12px;
  }

  &::-webkit-scrollbar-track {
    background: #525659;
  }

  &::-webkit-scrollbar-thumb {
    background: #777;
    border: 3px solid #525659;
    border-radius: 10px;
  }
}

.pdf-content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-box {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fit-img {
  width: 100%;
  height: auto;
  max-height: 100%;
  display: block;
  object-fit: contain;
}

.pdf-scrim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 90;
}

.slide-enter-active, .slide-leave-active {
  transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

.slide-enter-from, .slide-leave-to {
  transform: translateX(-180px);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* 骨架屏绝对定位 */
.absolute {
  position: absolute !important;
}

@media print {
  .pdf-header, .pdf-sidebar, .pdf-scrim, .watermark-overlay {
    display: none !important;
  }
}
</style>