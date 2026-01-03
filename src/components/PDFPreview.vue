<template>
  <div class="chrome-pdf-container" :class="{ 'is-mobile': isMobile }">

    <!-- 1. 顶部工具栏 -->
    <div class="pdf-header">
      <v-btn
          icon="mdi-view-headline"
          variant="text"
          color="white"
          density="comfortable"
          @click="showSidebar = !showSidebar"
      ></v-btn>

      <div class="file-name text-truncate ml-2" v-if="!isMobile">{{ fileName }}</div>

      <v-spacer></v-spacer>

      <v-chip size="x-small" variant="outlined" color="grey-lighten-1" class="mr-2" v-if="!isMobile">
        模式: {{ pageSize === 'A4' ? 'A4 纸张' : '原始尺寸' }}
      </v-chip>

      <!-- 缩放控制组 -->
      <div class="zoom-controls d-flex align-center bg-black-o-2 rounded-pill px-2 mx-2">
        <v-btn icon="mdi-minus" size="x-small" variant="text" color="white" @click="changeZoom(-0.1)"
               :disabled="zoom <= 0.5"></v-btn>
        <span class="zoom-text mx-2">{{ Math.round(zoom * 100) }}%</span>
        <v-btn icon="mdi-plus" size="x-small" variant="text" color="white" @click="changeZoom(0.1)"
               :disabled="zoom >= 2.0"></v-btn>
      </div>

      <v-spacer v-if="!isMobile"></v-spacer>

      <div class="page-indicator">
        {{ currentPage }} / {{ pages.length }}
      </div>

      <v-btn icon="mdi-printer" variant="text" color="white" @click="handlePrint" v-if="!isMobile"></v-btn>
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
            <div
                v-for="(page, index) in pages"
                :key="page.id"
                class="thumb-item"
                :class="{ 'active': currentPage === index + 1 }"
                @click="handleThumbClick(index)"
            >
              <div class="thumb-paper" :style="getPaperStyle(page, 100)">
                <div class="image-box">
                  <img :src="page.url" class="fit-img" @load="e => onImageLoad(e, index)"/>
                </div>
                <!-- 缩略图也显示微缩水印 -->
                <div class="watermark-overlay mini" :style="watermarkStyle"></div>
              </div>
              <div class="thumb-num">{{ index + 1 }}</div>
            </div>
          </div>
        </aside>
      </transition>

      <!-- 4. 右侧主预览区 -->
      <main class="pdf-main" ref="scrollContainer" @scroll="onScroll">
        <div class="pdf-content-wrapper" :style="contentWrapperStyle">
          <div
              v-for="(page, index) in pages"
              :key="'page-' + page.id"
              :ref="el => pageRefs[index] = el"
              class="pdf-page-container"
              :style="getPageContainerStyle(page)"
          >
            <!-- 纸张 -->
            <div class="pdf-sheet" :style="getPaperStyle(page, BASE_WIDTH_PX * zoom)">
              <div class="image-box">
                <img :src="page.url" class="fit-img"/>
              </div>

              <!-- 【核心新增】水印覆盖层 -->
              <div
                  v-if="watermarkConfig.text"
                  class="watermark-overlay"
                  :style="watermarkStyle"
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
import { ref, computed, onUnmounted, onMounted, reactive } from 'vue'

const props = defineProps({
  files: { type: Array, default: () => [] },
  margins: {
    type: Object,
    default: () => ({ top: 20, right: 20, bottom: 20, left: 20 })
  },
  pageSize: { type: String, default: "A4" },
  // 【新增】水印配置
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
  }
})

// 常量与状态
const BASE_WIDTH_PX = 800;
const A4_WIDTH_MM = 210;
const A4_RATIO = 0.707;

const showSidebar = ref(window.innerWidth > 600)
const isMobile = ref(window.innerWidth <= 600)
const scrollContainer = ref(null)
const pageRefs = ref([])
const currentPage = ref(1)
const zoom = ref(1.0)
const imageRatios = reactive({})

const fileName = computed(() => props.files.length > 0 ? '文档预览' : '未选择文件')

// 解析文件
const pages = computed(() => {
  return props.files.map((file, index) => ({
    id: `${file.name}-${file.size}-${file.lastModified}`,
    url: URL.createObjectURL(file)
  }))
})

// 【核心逻辑】生成动态水印样式
const watermarkStyle = computed(() => {
  const conf = props.watermarkConfig;
  if (!conf.text) return {};

  // 1. 创建一个动态 SVG
  // 我们创建一个 gap x gap 大小的方格，文字居中旋转
  const size = conf.gap || 100;
  const half = size / 2;

  // 对文字进行转义防止特殊字符破坏 SVG
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
    // 缩略图模式下需要缩小背景尺寸
    backgroundSize: isMobile.value ? `${size * 0.5}px` : 'auto'
  };
});

// 获取图片加载后的比例
const onImageLoad = (event, index) => {
  const { naturalWidth, naturalHeight } = event.target
  imageRatios[index] = naturalWidth / naturalHeight
}

const getPaperStyle = (page, baseWidth) => {
  const index = pages.value.indexOf(page)
  const ratio = imageRatios[index] || A4_RATIO
  const mmToPx = baseWidth / A4_WIDTH_MM;

  const style = {
    paddingTop: `${props.margins.top * mmToPx}px`,
    paddingRight: `${props.margins.right * mmToPx}px`,
    paddingBottom: `${props.margins.bottom * mmToPx}px`,
    paddingLeft: `${props.margins.left * mmToPx}px`,
    backgroundColor: 'white',
    boxShadow: '0 0 15px rgba(0,0,0,0.3)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative', // 必须为 relative 以支撑遮罩层
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  }

  if (props.pageSize === 'A4') {
    style.aspectRatio = '0.707';
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
  pages.value.forEach(p => URL.revokeObjectURL(p.url))
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
    container.scrollTo({ top: target.offsetTop - 10, behavior: 'smooth' })
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

<style scoped lang="scss">
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

/* 水印覆盖层核心样式 */
.watermark-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; // 确保不影响鼠标操作
  z-index: 5;

  &.mini {
    transform: scale(1); // 缩略图模式
    background-size: 50% !important; // 缩略图水印减小
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
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);

  .zoom-controls {
    background: rgba(255, 255, 255, 0.1);
    transition: background 0.3s;
    &:hover { background: rgba(255, 255, 255, 0.2); }

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

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 4px; }
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

    .fit-img { width: 100%; height: auto; display: block; }
  }

  &:hover .thumb-paper {
    transform: translateY(-2px);
  }

  &.active {
    .thumb-paper {
      transform: scale(1.08);
      box-shadow: 0 0 0 2px #8ab4f8, 0 10px 20px rgba(0,0,0,0.5);
    }
    .thumb-num { color: #8ab4f8; font-weight: bold; }
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

  &::-webkit-scrollbar { width: 12px; }
  &::-webkit-scrollbar-track { background: #525659; }
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

.slide-enter-active, .slide-leave-active { transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1); }
.slide-enter-from, .slide-leave-to { transform: translateX(-180px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media print {
  .pdf-header, .pdf-sidebar, .pdf-scrim, .watermark-overlay { display: none !important; }
}
</style>