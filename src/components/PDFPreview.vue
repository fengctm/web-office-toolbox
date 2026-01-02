<template>
  <div class="chrome-pdf-container" :class="{ 'is-mobile': isMobile }">

    <!-- 1. 顶部工具栏：增加缩放控制 -->
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

      <!-- 2. 移动端遮罩层：侧边栏打开时显示，点击关闭侧边栏 -->
      <transition name="fade">
        <div v-if="isMobile && showSidebar" class="pdf-scrim" @click="showSidebar = false"></div>
      </transition>

      <!-- 3. 左侧缩略图：移动端采用绝对定位抽屉 -->
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
              <div class="thumb-paper">
                <img :src="page.url" class="thumb-img" />
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
              :style="pageStyle"
          >
            <div class="a4-sheet">
              <v-img :src="page.url" width="100%" aspect-ratio="0.707" cover>
                <template v-slot:placeholder>
                  <div class="fill-height d-flex align-center justify-center bg-grey-darken-3">
                    <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
                  </div>
                </template>
              </v-img>
            </div>
          </div>
          <div class="footer-spacer"></div>
        </div>
      </main>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, onMounted } from 'vue'

const props = defineProps({
  files: { type: Array, default: () => [] }
})

const showSidebar = ref(window.innerWidth > 600)
const isMobile = ref(window.innerWidth <= 600)
const scrollContainer = ref(null)
const pageRefs = ref([])
const currentPage = ref(1)
const zoom = ref(1.0) // 缩放倍数

const fileName = computed(() => props.files.length > 0 ? '文档预览' : '未选择文件')

// 页面数据映射
const pages = computed(() => {
  return props.files.map((file, index) => ({
    id: `${file.name}-${file.size}-${file.lastModified}`,
    url: URL.createObjectURL(file)
  }))
})

// 动态样式计算
const pageStyle = computed(() => ({
  width: `${Math.min(800 * zoom.value, window.innerWidth - 40)}px`,
  transition: 'width 0.2s ease-out'
}))

const contentWrapperStyle = computed(() => ({
  padding: isMobile.value ? '10px' : '20px'
}))

// 处理窗口大小变化
const handleResize = () => {
  isMobile.value = window.innerWidth <= 600
  if (isMobile.value) {
    showSidebar.value = false
  }
}

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  pages.value.forEach(p => URL.revokeObjectURL(p.url))
})

// 缩放控制
const changeZoom = (delta) => {
  const newZoom = parseFloat((zoom.value + delta).toFixed(1))
  if (newZoom >= 0.5 && newZoom <= 2.0) {
    zoom.value = newZoom
  }
}

// 缩略图点击
const handleThumbClick = (index) => {
  scrollToPage(index)
  if (isMobile.value) {
    showSidebar.value = false // 移动端点击后自动收起
  }
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
  height: 100%; /* 由外部容器决定高度 */
  width: 100%;
  background-color: #525659;
  overflow: hidden;
  position: relative;
  border-radius: 4px;

  &.is-mobile {
    .pdf-header { padding: 0 8px; }
    .pdf-sidebar {
      position: absolute;
      left: 0;
      top: 48px;
      height: calc(100% - 48px);
      z-index: 100;
      box-shadow: 5px 0 15px rgba(0,0,0,0.5);
    }
  }
}

/* 遮罩层 */
.pdf-scrim {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 90;
}

.pdf-header {
  height: 48px;
  background-color: #323639;
  display: flex;
  align-items: center;
  padding: 0 16px;
  z-index: 110;
  color: white;

  .zoom-controls {
    background: rgba(0,0,0,0.3);
    .zoom-text { font-size: 12px; min-width: 40px; text-align: center; }
  }

  .page-indicator {
    background: rgba(0,0,0,0.3);
    padding: 2px 10px;
    border-radius: 4px;
    font-size: 12px;
  }
}

.pdf-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.pdf-sidebar {
  width: 160px;
  background-color: #323639;
  border-right: 1px solid rgba(255,255,255,0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.thumb-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }
}

.thumb-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  cursor: pointer;

  .thumb-paper {
    width: 100px;
    background: white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.5);
    border: 2px solid transparent;
    line-height: 0;
    transition: transform 0.2s;
    .thumb-img { width: 100%; aspect-ratio: 0.707; object-fit: cover; }
  }

  &.active {
    .thumb-paper { border-color: #8ab4f8; transform: scale(1.05); }
    .thumb-num { color: #8ab4f8; font-weight: bold; }
  }
}
.thumb-num { font-size: 11px; color: #bdc1c6; margin-top: 6px; }

.pdf-main {
  flex: 1;
  overflow-y: auto;
  background-color: #525659;

  &::-webkit-scrollbar { width: 10px; }
  &::-webkit-scrollbar-track { background: #525659; }
  &::-webkit-scrollbar-thumb {
    background: #777;
    border: 2px solid #525659;
    border-radius: 10px;
  }
}

.pdf-content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pdf-page-container {
  margin-bottom: 16px;
  will-change: width;
}

.a4-sheet {
  background: white;
  box-shadow: 0 0 10px rgba(0,0,0,0.5);
}

.footer-spacer { height: 40px; }

/* 动画 */
.slide-enter-active, .slide-leave-active { transition: transform 0.3s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(-160px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media print {
  .pdf-header, .pdf-sidebar, .pdf-scrim { display: none !important; }
  .pdf-main { overflow: visible !important; }
}
</style>
