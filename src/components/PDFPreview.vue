<template>
  <div class="chrome-pdf-viewer">
    <!-- 顶部工具栏：模仿 Chrome 风格 -->
    <header class="pdf-toolbar" v-if="showToolbar">
      <div class="toolbar-left">
        <v-btn icon variant="text" color="white" @click="toggleThumbnails" v-if="showThumbnailsToggle">
          <v-icon>{{ showThumbnails ? 'mdi- some-page-close' : 'mdi-view-thumbnail' }}</v-icon>
        </v-btn>
        <span class="file-name text-truncate" v-if="pdfFile">{{ pdfFile.name }}</span>
      </div>

      <div class="toolbar-center">
        <div class="page-controls">
          <input
              type="number"
              :value="currentPage"
              @change="e => scrollToPage(parseInt(e.target.value))"
              min="1"
              :max="totalPages"
          />
          <span class="divider">/</span>
          <span class="total-pages">{{ totalPages }}</span>
        </div>
      </div>

      <div class="toolbar-right">
        <v-btn icon variant="text" color="white" @click="zoomOut" :disabled="zoom <= 0.5">
          <v-icon>mdi-minus</v-icon>
        </v-btn>
        <span class="zoom-percent">{{ Math.round(zoom * 100) }}%</span>
        <v-btn icon variant="text" color="white" @click="zoomIn" :disabled="zoom >= 3">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
        <v-divider vertical class="mx-2" dark></v-divider>
        <v-btn icon variant="text" color="white" title="打印" @click="handlePrint">
          <v-icon>mdi-printer</v-icon>
        </v-btn>
      </div>
    </header>

    <div class="pdf-main-container">
      <!-- 左侧缩略图栏 -->
      <aside
          class="pdf-sidebar"
          :class="{ 'is-open': showThumbnailsPanel && hasThumbnails }"
      >
        <div class="sidebar-content">
          <div
              v-for="(page, index) in displayPages"
              :key="`thumb-${page.id}`"
              class="thumb-wrapper"
              :class="{ active: currentPage === index + 1 }"
              @click="scrollToPage(index + 1)"
          >
            <div class="thumb-canvas-container" :style="{ aspectRatio: pageRatio }">
              <canvas :ref="el => setThumbnailRef(el, index)"/>
            </div>
            <div class="thumb-number">{{ index + 1 }}</div>
          </div>
        </div>
      </aside>

      <!-- 主预览区 -->
      <main class="pdf-viewport" ref="mainPreviewRef">
        <RecycleScroller
            v-if="useVirtualScroll && displayPages.length > 0"
            class="scroller"
            :items="displayPages"
            :item-size="computedItemSize"
            key-field="id"
            v-slot="{ item, index }"
            @scroll="onScroll"
        >
          <div class="page-canvas-wrapper" :style="pageWrapperStyle">
            <div class="page-shadow-box" :style="{ aspectRatio: pageRatio }">
              <canvas
                  :ref="el => setPageRef(el, index)"
                  class="pdf-canvas"
              />
              <!-- 水印层 -->
              <div
                  v-if="watermarkConfig && watermarkConfig.text"
                  class="watermark-overlay"
                  :style="watermarkStyle"
              >
                <div
                    class="watermark-grid"
                    :style="watermarkGridStyle"
                >
                  <div v-for="n in (watermarkConfig.density * 4)" :key="n" class="watermark-text">
                    {{ watermarkConfig.text }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RecycleScroller>

        <!-- 非虚拟滚动模式 -->
        <div v-else-if="!useVirtualScroll" class="static-scroll-container">
          <div
              v-for="(page, index) in displayPages"
              :key="page.id"
              class="page-canvas-wrapper"
              :style="pageWrapperStyle"
          >
            <div class="page-shadow-box" :style="{ aspectRatio: pageRatio }">
              <canvas :ref="el => setPageRef(el, index)" class="pdf-canvas"/>
              <!-- 水印同上 -->
            </div>
          </div>
        </div>

        <!-- 空状态与加载 -->
        <div v-if="loading" class="overlay-state">
          <v-progress-circular indeterminate color="white"></v-progress-circular>
        </div>
        <div v-if="!loading && displayPages.length === 0" class="overlay-state">
          <v-icon size="64" color="grey-lighten-1">mdi-file-document-outline</v-icon>
          <p class="mt-2 text-white">等待加载文档...</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import {computed, nextTick, ref, watch} from 'vue'
import {RecycleScroller} from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

const props = defineProps({
  images: {type: Array, default: () => []},
  pdfFile: {type: File, default: null},
  watermarkConfig: {
    type: Object,
    default: () => ({
      text: '', color: '#009688', opacity: 0.3, fontSize: 24, rotation: -45, density: 6, offset: 0
    })
  },
  showToolbar: {type: Boolean, default: true},
  showThumbnails: {type: Boolean, default: true},
  showThumbnailsToggle: {type: Boolean, default: true},
  enableRealtime: {type: Boolean, default: true},
  useVirtualScroll: {type: Boolean, default: true}
})

const emit = defineEmits(['page-change', 'render-complete'])

// 状态
const loading = ref(false)
const zoom = ref(1.0)
const currentPage = ref(1)
const showThumbnailsPanel = ref(props.showThumbnails)
const displayPages = ref([])
const pageRefs = ref([])
const thumbnailRefs = ref([])
const mainPreviewRef = ref(null)

// 计算属性
const totalPages = computed(() => displayPages.value.length)
const hasThumbnails = computed(() => totalPages.value > 0)
const pageRatio = computed(() => props.pdfFile ? 0.707 : 0.75) // A4 宽高比 (W/H)

// 关键：根据缩放计算虚拟滚动条目高度
const computedItemSize = computed(() => {
  const baseWidth = 800 // 基准渲染宽度
  const height = baseWidth / pageRatio.value
  return (height * zoom.value) + 40 // 加上 margin 上下间距
})

const pageWrapperStyle = computed(() => ({
  width: `${800 * zoom.value}px`,
  margin: '0 auto',
  padding: '20px 0'
}))

// 水印样式
const watermarkStyle = computed(() => ({
  opacity: props.watermarkConfig.opacity,
  color: props.watermarkConfig.color,
  fontSize: `${props.watermarkConfig.fontSize * zoom.value}px`,
}))

const watermarkGridStyle = computed(() => ({
  transform: `rotate(${props.watermarkConfig.rotation}deg)`,
  gap: `${100 / props.watermarkConfig.density}px`
}))

// 功能函数
const setPageRef = (el, index) => {
  if (el) pageRefs.value[index] = el
}
const setThumbnailRef = (el, index) => {
  if (el) thumbnailRefs.value[index] = el
}

const toggleThumbnails = () => {
  showThumbnailsPanel.value = !showThumbnailsPanel.value
}

const zoomIn = () => {
  if (zoom.value < 3) zoom.value += 0.1
}
const zoomOut = () => {
  if (zoom.value > 0.5) zoom.value -= 0.1
}

const scrollToPage = (pageNum) => {
  if (pageNum < 1 || pageNum > totalPages.value) return
  currentPage.value = pageNum

  const scroller = mainPreviewRef.value?.querySelector('.scroller')
  if (scroller) {
    scroller.scrollTop = (pageNum - 1) * computedItemSize.value
  }
}

const onScroll = (event) => {
  const scrollTop = event.target.scrollTop
  const index = Math.round(scrollTop / computedItemSize.value) + 1
  if (index !== currentPage.value && index > 0) {
    currentPage.value = index
    emit('page-change', index)
  }
}

// 核心渲染逻辑 (优化 PDF 渲染清晰度)
const renderPage = async (canvas, index, isThumbnail = false) => {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const page = displayPages.value[index]
  if (!page) return

  const dpr = window.devicePixelRatio || 1
  const width = isThumbnail ? 120 : 800 * zoom.value
  const height = width / pageRatio.value

  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  ctx.scale(dpr, dpr)

  if (page.canvas) {
    ctx.drawImage(page.canvas, 0, 0, width, height)
  } else if (page.image) {
    const img = new Image()
    img.src = page.image
    await new Promise(r => img.onload = r)
    ctx.drawImage(img, 0, 0, width, height)
  }
}

// 监听缩放和数据变化重新渲染
watch([zoom, displayPages], async () => {
  await nextTick()
  for (let i = 0; i < pageRefs.value.length; i++) {
    renderPage(pageRefs.value[i], i)
  }
  if (showThumbnailsPanel.value) {
    for (let i = 0; i < thumbnailRefs.value.length; i++) {
      renderPage(thumbnailRefs.value[i], i, true)
    }
  }
}, {deep: true})

// 加载 PDF 文件
const processPDF = async (file) => {
  if (!file) return
  loading.value = true
  try {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise

    const pages = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({scale: 2.0}) // 高清离屏渲染
      const offCanvas = document.createElement('canvas')
      offCanvas.width = viewport.width
      offCanvas.height = viewport.height
      await page.render({canvasContext: offCanvas.getContext('2d'), viewport}).promise

      pages.push({id: `page-${i}`, canvas: offCanvas})
    }
    displayPages.value = pages
    emit('render-complete', pages.length)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

watch(() => props.pdfFile, processPDF, {immediate: true})

const handlePrint = () => {
  window.print()
}
</script>

<style scoped>
.chrome-pdf-viewer {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: #525659; /* Chrome PDF 经典背景色 */
  color: white;
  overflow: hidden;
  font-family: Roboto, Arial, sans-serif;
}

/* 工具栏样式 */
.pdf-toolbar {
  height: 48px;
  background-color: #323639;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 100;
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  flex: 1;
}

.toolbar-center {
  display: flex;
  justify-content: center;
  flex: 1;
}

.file-name {
  font-size: 14px;
  margin-left: 8px;
  max-width: 200px;
}

.page-controls {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.page-controls input {
  width: 40px;
  background: transparent;
  border: none;
  color: white;
  text-align: right;
  outline: none;
}

.zoom-percent {
  font-size: 13px;
  width: 45px;
  text-align: center;
}

/* 主内容区 */
.pdf-main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* 侧边栏 */
.pdf-sidebar {
  width: 0;
  background: #323639;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.pdf-sidebar.is-open {
  width: 200px;
}

.sidebar-content {
  width: 200px;
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

.thumb-wrapper {
  margin-bottom: 24px;
  cursor: pointer;
  text-align: center;
}

.thumb-canvas-container {
  width: 120px;
  margin: 0 auto;
  background: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
  transition: transform 0.2s;
}

.thumb-wrapper:hover .thumb-canvas-container {
  transform: scale(1.05);
}

.thumb-wrapper.active .thumb-canvas-container {
  outline: 3px solid #8ab4f8;
}

.thumb-number {
  font-size: 12px;
  margin-top: 8px;
  color: #bdc1c6;
}

/* 视口区域 */
.pdf-viewport {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.scroller {
  height: 100%;
}

.page-canvas-wrapper {
  display: flex;
  justify-content: center;
  will-change: transform;
}

.page-shadow-box {
  position: relative;
  background: white;
  box-shadow: 0 0 8px rgba(0, 0, 0, .5);
}

.pdf-canvas {
  display: block;
}

/* 水印层 */
.watermark-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.watermark-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  align-content: space-around;
  width: 200%;
  height: 200%;
  margin-left: -50%;
  margin-top: -50%;
}

.watermark-text {
  padding: 20px;
  white-space: nowrap;
  font-weight: bold;
  user-select: none;
}

.overlay-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(82, 86, 89, 0.8);
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

::-webkit-scrollbar-track {
  background: #525659;
}

::-webkit-scrollbar-thumb {
  background: #bdc1c6;
  border: 3px solid #525659;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9aa0a6;
}
</style>
