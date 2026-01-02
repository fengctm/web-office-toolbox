<template>
  <div class="chrome-pdf-container" :class="{ 'is-mobile': isMobile }">

    <!-- 1. 顶部工具栏 -->
    <div class="pdf-header">
      <v-btn
          icon="mdi-view-thumbnail"
          variant="text"
          color="white"
          density="comfortable"
          @click="showSidebar = !showSidebar"
      ></v-btn>

      <div class="file-name text-truncate ml-2" v-if="!isMobile">{{ fileName }}</div>

      <v-spacer></v-spacer>

      <!-- 状态显示：当前尺寸模式 -->
      <v-chip size="x-small" variant="outlined" color="grey-lighten-1" class="mr-2" v-if="!isMobile">
        模式: {{ pageSize === 'A4' ? 'A4 纸张' : '原始尺寸' }}
      </v-chip>

      <!-- 缩放控制组 -->
      <div class="zoom-controls d-flex align-center bg-black-o-2 rounded-pill px-2 mx-2">
        <v-btn icon="mdi-minus" size="x-small" variant="text" color="white" @click="changeZoom(-0.1)" :disabled="zoom <= 0.5"></v-btn>
        <span class="zoom-text mx-2">{{ Math.round(zoom * 100) }}%</span>
        <v-btn icon="mdi-plus" size="x-small" variant="text" color="white" @click="changeZoom(0.1)" :disabled="zoom >= 2.0"></v-btn>
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

      <!-- 3. 左侧缩略图：同步页面尺寸与边距 -->
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
              <!-- 缩略图纸张 -->
              <div class="thumb-paper" :style="getPaperStyle(page, 100)">
                <div class="image-box">
                  <img :src="page.url" class="fit-img" @load="e => onImageLoad(e, index)" />
                </div>
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
            <!-- 动态尺寸纸张 -->
            <div class="pdf-sheet" :style="getPaperStyle(page, BASE_WIDTH_PX * zoom)">
              <div class="image-box">
                <img :src="page.url" class="fit-img" />
              </div>
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
  // 页边距 (mm)
  margins: {
    type: Object,
    default: () => ({ top: 20, right: 20, bottom: 20, left: 20 })
  },
  // 页面尺寸模式: "A4" 或 "original" (对应你说的图片原始尺寸/适应屏幕)
  pageSize: {
    type: String,
    default: "A4"
  },
  compressionQuality: { type: Number, default: 0.92 }
})

// 常量
const BASE_WIDTH_PX = 800;
const A4_WIDTH_MM = 210;
const PX_PER_MM = BASE_WIDTH_PX / A4_WIDTH_MM;
const A4_RATIO = 0.707; // 宽/高

const showSidebar = ref(window.innerWidth > 600)
const isMobile = ref(window.innerWidth <= 600)
const scrollContainer = ref(null)
const pageRefs = ref([])
const currentPage = ref(1)
const zoom = ref(1.0)

// 存储每张图片的原始比例 (宽/高)
const imageRatios = reactive({})

const fileName = computed(() => props.files.length > 0 ? '文档预览' : '未选择文件')

// 解析文件
const pages = computed(() => {
  return props.files.map((file, index) => ({
    id: `${file.name}-${file.size}-${file.lastModified}`,
    url: URL.createObjectURL(file)
  }))
})

// 获取图片加载后的比例
const onImageLoad = (event, index) => {
  const { naturalWidth, naturalHeight } = event.target
  imageRatios[index] = naturalWidth / naturalHeight
}

/**
 * 核心逻辑：计算纸张样式
 * @param page 页面数据
 * @param baseWidth 当前显示的基准宽度
 */
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
    boxShadow: '0 0 10px rgba(0,0,0,0.5)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  }

  if (props.pageSize === 'A4') {
    // 固定 A4 比例
    style.aspectRatio = '0.707';
    style.width = `${baseWidth}px`;
  } else {
    // 原始尺寸模式：纸张比例 = 图片比例 (考虑边距补偿)
    // 在该模式下，纸张高度随图片自动撑开，不留垂直白边
    style.width = `${baseWidth}px`;
    style.aspectRatio = 'auto';
    style.minHeight = `${baseWidth / ratio}px`;
  }

  return style
}

// 获取页面外层容器样式
const getPageContainerStyle = (page) => {
  const baseWidth = Math.min(BASE_WIDTH_PX * zoom.value, window.innerWidth - 40);
  return {
    width: `${baseWidth}px`,
    marginBottom: '20px'
  }
}

const contentWrapperStyle = computed(() => ({
  padding: isMobile.value ? '10px' : '20px'
}))

// 基础交互逻辑...
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
  display: flex; flex-direction: column; height: 100%; width: 100%;
  background-color: #525659; overflow: hidden; position: relative;
  &.is-mobile .pdf-sidebar {
    position: absolute; left: 0; top: 48px; height: calc(100% - 48px);
    z-index: 100; box-shadow: 5px 0 15px rgba(0,0,0,0.5);
  }
}

.pdf-header {
  height: 48px; background-color: #323639; display: flex; align-items: center;
  padding: 0 16px; z-index: 110; color: white;
  .zoom-controls { background: rgba(0,0,0,0.3); .zoom-text { font-size: 12px; min-width: 40px; text-align: center; } }
  .page-indicator { background: rgba(0,0,0,0.3); padding: 2px 10px; border-radius: 4px; font-size: 12px; }
}

.pdf-body { display: flex; flex: 1; overflow: hidden; position: relative; }

.pdf-sidebar {
  width: 160px; background-color: #323639; border-right: 1px solid rgba(255,255,255,0.1);
  overflow: hidden; display: flex; flex-direction: column;
}

.thumb-list {
  flex: 1; overflow-y: auto; padding: 16px 0;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }
}

.thumb-item {
  display: flex; flex-direction: column; align-items: center; margin-bottom: 24px; cursor: pointer;
  .thumb-paper {
    transition: all 0.2s; overflow: hidden;
    .image-box { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    .fit-img { width: 100%; height: auto; max-height: 100%; display: block; object-fit: contain; }
  }
  &.active {
    .thumb-paper { transform: scale(1.05); box-shadow: 0 0 0 2px #8ab4f8; }
    .thumb-num { color: #8ab4f8; font-weight: bold; }
  }
}
.thumb-num { font-size: 11px; color: #bdc1c6; margin-top: 6px; }

.pdf-main {
  flex: 1; overflow-y: auto; background-color: #525659;
  &::-webkit-scrollbar { width: 10px; }
  &::-webkit-scrollbar-track { background: #525659; }
  &::-webkit-scrollbar-thumb { background: #777; border: 2px solid #525659; border-radius: 10px; }
}

.pdf-content-wrapper { display: flex; flex-direction: column; align-items: center; }

/* 纸张内部布局 */
.image-box {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
}
.fit-img {
  width: 100%; height: auto; max-height: 100%; display: block; object-fit: contain;
}

.pdf-scrim { position: absolute; inset: 0; background: rgba(0,0,0,0.5); z-index: 90; }
.footer-spacer { height: 40px; }
.slide-enter-active, .slide-leave-active { transition: transform 0.3s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(-160px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media print {
  .pdf-header, .pdf-sidebar, .pdf-scrim { display: none !important; }
  .pdf-main { overflow: visible !important; }
}
</style>