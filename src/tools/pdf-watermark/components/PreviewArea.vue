<template>
  <div class="preview-area">
    <!-- 生成中提示 -->
    <transition name="fade">
      <div v-if="isGenerating" class="generating-hint">
        <v-progress-circular size="32" color="teal" indeterminate width="3"/>
        <span class="ml-3 text-body-2 text-teal">正在渲染预览...</span>
      </div>
    </transition>

    <!-- 预览图片列表 -->
    <div v-if="previewPages.length > 0" class="preview-scroll">
      <div class="preview-list">
        <div v-for="(pageUrl, index) in previewPages" :key="index" class="preview-page">
          <img :src="pageUrl" :alt="`第 ${index + 1} 页`" class="preview-img"/>
          <div class="page-label">{{ index + 1 }}</div>
        </div>
        <div v-if="totalPages > previewPages.length" class="more-pages-hint">
          <v-icon size="20" color="grey">mdi-dots-horizontal</v-icon>
          <span class="text-caption text-grey">
            共 {{ totalPages }} 页，仅预览前 {{ previewPages.length }} 页，导出时将处理全部页面
          </span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!isGenerating" class="empty-state">
      <v-icon size="80" color="grey-lighten-2">mdi-file-document-outline</v-icon>
      <p class="text-grey mt-2">请先上传 PDF 文件以预览</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  previewPages: {
    type: Array,
    default: () => []
  },
  isGenerating: {
    type: Boolean,
    default: false
  },
  totalPages: {
    type: Number,
    default: 0
  }
})
</script>

<style scoped>
.preview-area {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: #525659;
}

.generating-hint {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  padding: 8px 16px;
  border-radius: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.preview-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.preview-scroll::-webkit-scrollbar {
  width: 8px;
}

.preview-scroll::-webkit-scrollbar-track {
  background: #525659;
}

.preview-scroll::-webkit-scrollbar-thumb {
  background: #777;
  border: 2px solid #525659;
  border-radius: 6px;
}

.preview-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.preview-page {
  position: relative;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.preview-img {
  display: block;
  max-width: 100%;
  height: auto;
}

.page-label {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}

.more-pages-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

/* 渐入渐出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 深色模式 */
:root[data-theme="dark"] .preview-area {
  background-color: #1e1e1e;
}

:root[data-theme="dark"] .preview-scroll {
  background-color: #1e1e1e;
}

:root[data-theme="dark"] .generating-hint {
  background: rgba(30, 30, 30, 0.9);
}

:root[data-theme="dark"] .empty-state .v-icon {
  color: #424242 !important;
}

:root[data-theme="dark"] .empty-state p {
  color: #9e9e9e;
}

:root[data-theme="dark"] .more-pages-hint {
  background: rgba(255, 255, 255, 0.05);
}
</style>
