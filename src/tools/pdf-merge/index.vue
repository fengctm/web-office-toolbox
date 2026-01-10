<template>
  <v-card class="pdf-merge-tool" elevation="2">
    <!-- 1. 顶部工具栏 -->
    <v-toolbar class="app-bar-blur" density="comfortable" flat>
      <v-icon class="ml-2 mr-2 icon-bounce" color="teal">mdi-call-merge</v-icon>
      <v-toolbar-title class="text-subtitle-1 font-weight-bold toolbar-title">
        PDF智能组装台
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn
          class="btn-micro-interaction mr-2"
          color="text-medium-emphasis"
          size="small"
          variant="text"
          @click="handlePreview"
      >
        <v-icon start>mdi-eye-outline</v-icon>
        预览
      </v-btn>

      <v-btn
          :disabled="!hasEnoughFiles"
          color="teal"
          elevation="2"
          prepend-icon="mdi-merge"
          size="small"
          variant="flat"
          @click="handleMerge"
      >
        开始合并
      </v-btn>
    </v-toolbar>

    <v-divider class="divider-opacity"></v-divider>

    <!-- 2. 核心工作区：文件列表 -->
    <div class="file-list-container">
      <!-- 空状态 -->
      <EmptyState
          v-if="pdfList.length === 0"
          @add-first="openUploadDialog"
      />

      <!-- 列表区域 (使用 vuedraggable) -->
      <draggable
          v-else
          v-model="pdfList"
          animation="300"
          class="sortable-list"
          handle=".drag-handle"
          item-key="id"
          @end="drag = false"
          @start="drag = true"
      >
        <template #item="{ element, index }">
          <FileListItem
              :index="index"
              :is-dragging="drag"
              :item="element"
              @remove="handleRemoveFile(index)"
          />
        </template>
      </draggable>

      <!-- 底部添加按钮 (悬浮) -->
      <v-btn
          v-if="pdfList.length > 0"
          class="add-fab mt-4"
          color="teal"
          elevation="4"
          prepend-icon="mdi-plus"
          variant="flat"
          @click="openUploadDialog"
      >
        添加文件
      </v-btn>
    </div>

    <!-- 3. 上传对话框 -->
    <UploadDialog
        v-model="showUploadDialog"
        @reset="handleUploadReset"
        @success="handleUploadSuccess"
    />

    <!-- 4. 预览对话框 -->
    <PreviewDialog
        v-model="showPreviewDialog"
        :files="previewFiles"
        @merge="handleMergeFromPreview"
    />

    <!-- 5. 加载遮罩 -->
    <LoadingOverlay
        :show="isProcessing"
        :status="processStatus"
    />

    <!-- 通用通知组件 -->
    <NotificationSnackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        :message="snackbar.message"
        :timeout="snackbar.timeout"
    />
  </v-card>
</template>

<script setup>
import {ref} from 'vue'
import draggable from 'vuedraggable'
import {usePdfMerger} from './composables/usePdfMerger.js'
import FileListItem from './components/FileListItem.vue'
import EmptyState from './components/EmptyState.vue'
import UploadDialog from './components/UploadDialog.vue'
import PreviewDialog from './components/PreviewDialog.vue'
import LoadingOverlay from './components/LoadingOverlay.vue'
import NotificationSnackbar from '@/components/NotificationSnackbar.vue'

// 使用 composable
const {
  pdfList,
  isProcessing,
  processStatus,
  hasEnoughFiles,
  previewFiles,
  addFile,
  removeFile,
  mergePdfs
} = usePdfMerger()

// UI 状态
const drag = ref(false)
const showUploadDialog = ref(false)
const showPreviewDialog = ref(false)

// 通知系统状态
const snackbar = ref({
  show: false,
  message: '',
  color: 'info',
  timeout: 4000
})

// 封装通知方法
const showSnackbar = (message, type = 'info') => {
  snackbar.value = {
    show: true,
    message,
    color: type === 'success' ? 'success' :
        type === 'error' ? 'error' :
            type === 'warning' ? 'warning' : 'info',
    timeout: 4000
  }
}

// 对话框操作
const openUploadDialog = () => {
  showUploadDialog.value = true
}

// 处理上传成功
const handleUploadSuccess = async (result) => {
  try {
    await addFile(result.file, result.password, showSnackbar)
  } catch (error) {
    // 错误已在 composable 中处理
  }
}

const handleUploadReset = () => {
  // 用户取消了上传，不做额外操作
}

// 处理文件移除
const handleRemoveFile = (index) => {
  removeFile(index, showSnackbar)
}

// 预览操作
const handlePreview = () => {
  if (pdfList.value.length === 0) {
    showSnackbar('请先添加 PDF 文件', 'warning')
    return
  }
  showPreviewDialog.value = true
}

// 合并操作
const handleMerge = async () => {
  try {
    await mergePdfs(showSnackbar)
  } catch (error) {
    // 错误已在 composable 中处理
  }
}

// 从预览界面合并
const handleMergeFromPreview = () => {
  showPreviewDialog.value = false
  handleMerge()
}
</script>

<style lang="scss" scoped>
// Apple 风格的贝塞尔曲线
$apple-ease: cubic-bezier(0.25, 0.1, 0.25, 1);

.pdf-merge-tool {
  border-radius: 20px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgb(var(--v-theme-background));
  transition: background-color 0.3s $apple-ease;
  position: relative;
}

// --- 1. 顶部工具栏 ---
.app-bar-blur {
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s $apple-ease;

  .toolbar-title {
    color: #1d1d1f;
  }
}

.v-theme--dark {
  .app-bar-blur {
    background-color: rgba(30, 30, 30, 0.75);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    .toolbar-title {
      color: rgba(255, 255, 255, 0.9);
    }
  }

  .divider-opacity {
    border-color: rgba(255, 255, 255, 0.12) !important;
  }
}

.icon-bounce {
  transition: transform 0.4s $apple-ease;
}

.icon-bounce:hover {
  transform: rotate(-10deg) scale(1.1);
}

.btn-micro-interaction {
  transition: transform 0.2s $apple-ease;
}

.btn-micro-interaction:active {
  transform: scale(0.9);
}

// --- 2. 列表区域 ---
.file-list-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
  position: relative;
  background-color: rgb(var(--v-theme-surface));
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.sortable-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 60px; // 给 FAB 留空间
}

.add-fab {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
  border-radius: 12px !important;
  z-index: 10; // 确保在最上层
  min-width: 140px; // 确保最小宽度
}
</style>