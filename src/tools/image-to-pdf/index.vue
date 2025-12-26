<template>
  <v-container class="image-to-pdf-container" fluid>
    <PageTransition transition-name="slide">
      <div class="tool-content">
        <!-- 头部 -->
        <div class="tool-header mb-6">
          <div class="header-content">
            <div class="header-left">
              <v-btn
                icon="mdi-arrow-left"
                variant="text"
                size="large"
                @click="goBack"
                class="back-btn mr-2"
              />
              <div class="header-info">
                <div class="d-flex align-center mb-2">
                  <v-icon size="32" color="primary" class="mr-2">mdi-image-multiple</v-icon>
                  <h1 class="text-h4 font-weight-bold tool-title">图片转换 PDF</h1>
                  <v-chip
                    color="primary"
                    variant="outlined"
                    size="small"
                    class="ml-3 step-chip"
                  >
                    步骤 {{ currentStep + 1 }}/3
                  </v-chip>
                </div>
                <div class="text-body-1 text-grey tool-description">
                  将多张图片按顺序合并为 PDF 文件
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 步骤内容区域 -->
        <div class="step-content-wrapper">
          <v-window v-model="currentStep" class="step-window">
            <!-- 步骤 1: 上传 -->
            <v-window-item :value="0">
              <UploadArea @next="handleUploadNext" />
            </v-window-item>

            <!-- 步骤 2: 排序 -->
            <v-window-item :value="1">
              <ImageSorter
                :initial-files="uploadedFiles"
                @back="handleSorterBack"
                @preview="handleSorterPreview"
                @generate="handleSorterGenerate"
              />
            </v-window-item>

            <!-- 步骤 3: 预览 -->
            <v-window-item :value="2">
              <ImagePreview
                :images="sortedImages"
                :start-index="previewIndex"
                @back="handlePreviewBack"
                @generate="handlePreviewGenerate"
              />
            </v-window-item>
          </v-window>
        </div>

        <!-- 生成状态 - 使用修复定位的覆盖层 -->
        <v-overlay
          v-model="generating"
          class="generation-overlay"
          :scrim="true"
          persistent
        >
          <div class="generation-wrapper">
            <v-card class="generation-card" elevation="8">
              <v-card-text class="generation-content">
                <div class="text-center">
                  <v-progress-circular
                    indeterminate
                    color="primary"
                    size="64"
                    class="mb-4"
                  />
                  <div class="text-h6 mb-2">正在生成 PDF...</div>
                  <div class="text-body-2 text-grey">
                    请稍候，正在处理 {{ sortedImages.length }} 张图片
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </v-overlay>

        <!-- 成功提示 - 修复定位 -->
        <v-snackbar
          v-model="successSnackbar"
          color="success"
          timeout="3000"
          location="top right"
          class="fixed-snackbar"
          elevation="8"
        >
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-check-circle</v-icon>
            <span>PDF 生成成功！正在下载...</span>
          </div>
        </v-snackbar>

        <!-- 错误提示 - 修复定位 -->
        <v-snackbar
          v-model="errorSnackbar"
          color="error"
          timeout="5000"
          location="top right"
          class="fixed-snackbar"
          elevation="8"
        >
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-alert-circle</v-icon>
            <span>{{ errorMessage }}</span>
          </div>
        </v-snackbar>
      </div>
    </PageTransition>
  </v-container>
</template>
-------

<file_content path="src/tools/image-to-pdf/index.vue">
<template>
  <v-container class="image-to-pdf-container" fluid>
    <PageTransition transition-name="slide">
      <div class="tool-content">
        <!-- 头部 -->
        <div class="tool-header mb-6">
          <div class="header-content">
            <div class="header-left">
              <v-btn
                icon="mdi-arrow-left"
                variant="text"
                size="large"
                @click="goBack"
                class="back-btn mr-2"
              />
              <div class="header-info">
                <div class="d-flex align-center mb-2">
                  <v-icon size="32" color="primary" class="mr-2">mdi-image-multiple</v-icon>
                  <h1 class="text-h4 font-weight-bold tool-title">图片转换 PDF</h1>
                  <v-chip
                    color="primary"
                    variant="outlined"
                    size="small"
                    class="ml-3 step-chip"
                  >
                    步骤 {{ currentStep + 1 }}/3
                  </v-chip>
                </div>
                <div class="text-body-1 text-grey tool-description">
                  将多张图片按顺序合并为 PDF 文件
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 步骤内容区域 -->
        <div class="step-content-wrapper">
          <v-window v-model="currentStep" class="step-window">
            <!-- 步骤 1: 上传 -->
            <v-window-item :value="0">
              <UploadArea @next="handleUploadNext" />
            </v-window-item>

            <!-- 步骤 2: 排序 -->
            <v-window-item :value="1">
              <ImageSorter
                :initial-files="uploadedFiles"
                @back="handleSorterBack"
                @preview="handleSorterPreview"
                @generate="handleSorterGenerate"
              />
            </v-window-item>

            <!-- 步骤 3: 预览 -->
            <v-window-item :value="2">
              <ImagePreview
                :images="sortedImages"
                :start-index="previewIndex"
                @back="handlePreviewBack"
                @generate="handlePreviewGenerate"
              />
            </v-window-item>
          </v-window>
        </div>

        <!-- 生成状态 - 使用修复定位的覆盖层 -->
        <v-overlay
          v-model="generating"
          class="generation-overlay"
          :scrim="true"
          persistent
        >
          <div class="generation-wrapper">
            <v-card class="generation-card" elevation="8">
              <v-card-text class="generation-content">
                <div class="text-center">
                  <v-progress-circular
                    indeterminate
                    color="primary"
                    size="64"
                    class="mb-4"
                  />
                  <div class="text-h6 mb-2">正在生成 PDF...</div>
                  <div class="text-body-2 text-grey">
                    请稍候，正在处理 {{ sortedImages.length }} 张图片
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </v-overlay>

        <!-- 成功提示 - 修复定位 -->
        <v-snackbar
          v-model="successSnackbar"
          color="success"
          timeout="3000"
          location="top right"
          class="fixed-snackbar"
          elevation="8"
        >
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-check-circle</v-icon>
            <span>PDF 生成成功！正在下载...</span>
          </div>
        </v-snackbar>

        <!-- 错误提示 - 修复定位 -->
        <v-snackbar
          v-model="errorSnackbar"
          color="error"
          timeout="5000"
          location="top right"
          class="fixed-snackbar"
          elevation="8"
        >
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-alert-circle</v-icon>
            <span>{{ errorMessage }}</span>
          </div>
        </v-snackbar>
      </div>
    </PageTransition>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PageTransition from '../../components/PageTransition.vue'
import UploadArea from './components/UploadArea.vue'
import ImageSorter from './components/ImageSorter.vue'
import ImagePreview from './components/ImagePreview.vue'

const router = useRouter()

// 状态管理
const currentStep = ref(0)
const uploadedFiles = ref([])
const sortedImages = ref([])
const previewIndex = ref(0)
const generating = ref(false)
const successSnackbar = ref(false)
const errorSnackbar = ref(false)
const errorMessage = ref('')

// 步骤 1: 上传完成
const handleUploadNext = (files) => {
  uploadedFiles.value = files
  currentStep.value = 1
}

// 步骤 2: 排序器操作
const handleSorterBack = () => {
  currentStep.value = 0
  uploadedFiles.value = []
}

const handleSorterPreview = (images, index) => {
  sortedImages.value = images
  previewIndex.value = index
  currentStep.value = 2
}

const handleSorterGenerate = (images) => {
  sortedImages.value = images
  generatePDF()
}

// 步骤 3: 预览器操作
const handlePreviewBack = () => {
  currentStep.value = 1
}

const handlePreviewGenerate = () => {
  generatePDF()
}

// PDF 生成逻辑
const generatePDF = async () => {
  if (sortedImages.value.length === 0) {
    errorMessage.value = '没有图片可生成 PDF'
    errorSnackbar.value = true
    return
  }

  generating.value = true

  try {
    // 准备表单数据
    const formData = new FormData()

    // 添加图片文件
    for (const image of sortedImages.value) {
      formData.append('images', image.file)
    }

    // 添加顺序信息
    const order = sortedImages.value.map((_, index) => index)
    formData.append('order', JSON.stringify(order))

    // 发送请求
    const response = await fetch('http://localhost:3000/api/tools/image-to-pdf/generate', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    if (result.success && result.fileUrl) {
      // 创建下载链接，确保触发下载而不是打开
      const fullUrl = `http://localhost:3000${result.fileUrl}`

      // 使用 fetch 获取 PDF 文件，然后创建 Blob 下载
      try {
        const response = await fetch(fullUrl)
        if (!response.ok) throw new Error('下载文件失败')

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `image-to-pdf-${Date.now()}.pdf`
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()

        // 清理
        window.URL.revokeObjectURL(url)
        document.body.removeChild(link)

        successSnackbar.value = true

        // 延迟返回首页
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } catch (downloadError) {
        console.error('下载失败:', downloadError)
        // 降级方案：使用传统方式
        const link = document.createElement('a')
        link.href = fullUrl
        link.download = `image-to-pdf-${Date.now()}.pdf`
        link.target = '_blank' // 强制新标签页
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        successSnackbar.value = true

        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    } else {
      throw new Error(result.message || '生成失败')
    }
  } catch (error) {
    console.error('生成 PDF 失败:', error)
    errorMessage.value = error.message || '生成 PDF 失败，请重试'
    errorSnackbar.value = true
  } finally {
    generating.value = false
  }
}

// 返回首页
const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.image-to-pdf-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  width: 100%;
}

.tool-content {
  width: 100%;
  max-width: 1000px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 头部样式 */
.tool-header {
  width: 100%;
  background: rgba(0, 150, 136, 0.05);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(0, 150, 136, 0.1);
  backdrop-filter: blur(10px);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
}

.back-btn {
  margin-top: 4px;
  flex-shrink: 0;
}

.header-info {
  flex: 1;
  min-width: 0;
}

.tool-title {
  color: #009688;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.step-chip {
  font-weight: 600;
  flex-shrink: 0;
}

.tool-description {
  line-height: 1.6;
  margin-top: 4px;
}

/* 步骤内容区域 */
.step-content-wrapper {
  width: 100%;
}

.step-window {
  background: transparent;
}

/* 生成状态覆盖层 - 修复定位 */
.generation-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 2400 !important;
}

.generation-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.generation-card {
  border-radius: 16px;
  min-width: 320px;
  max-width: 500px;
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 150, 136, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.generation-content {
  padding: 32px;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 提示消息 - 修复定位 */
.fixed-snackbar {
  position: fixed !important;
  top: 20px !important;
  right: 20px !important;
  z-index: 3000 !important;
  max-width: 400px !important;
}

/* PC端大屏幕优化 */
@media (min-width: 1400px) {
  .image-to-pdf-container {
    padding: 40px;
  }

  .tool-header {
    padding: 28px;
    border-radius: 20px;
  }

  .tool-title {
    font-size: 2rem !important;
  }

  .generation-card {
    min-width: 400px;
    border-radius: 20px;
  }

  .generation-content {
    padding: 48px;
  }

  .fixed-snackbar {
    top: 30px !important;
    right: 30px !important;
    max-width: 500px !important;
  }
}

@media (min-width: 1200px) and (max-width: 1399px) {
  .image-to-pdf-container {
    padding: 30px;
  }

  .tool-header {
    padding: 24px;
  }

  .tool-title {
    font-size: 1.75rem !important;
  }

  .generation-card {
    min-width: 360px;
  }

  .generation-content {
    padding: 40px;
  }
}

@media (min-width: 769px) and (max-width: 1199px) {
  .image-to-pdf-container {
    padding: 20px;
  }

  .tool-header {
    padding: 20px;
  }

  .tool-title {
    font-size: 1.5rem !important;
  }

  .generation-card {
    min-width: 320px;
  }

  .generation-content {
    padding: 32px;
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .image-to-pdf-container {
    padding: 12px;
    justify-content: flex-start;
  }

  .tool-content {
    gap: 16px;
  }

  .tool-header {
    padding: 16px;
    border-radius: 12px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-left {
    width: 100%;
    flex-direction: column;
    gap: 12px;
  }

  .back-btn {
    margin-top: 0;
  }

  .tool-title {
    font-size: 1.25rem !important;
  }

  .step-chip {
    align-self: flex-start;
  }

  .tool-description {
    font-size: 0.9rem !important;
  }

  .generation-card {
    min-width: 280px;
    border-radius: 12px;
    margin: 16px;
  }

  .generation-content {
    padding: 24px;
  }

  .fixed-snackbar {
    top: 12px !important;
    right: 12px !important;
    left: 12px !important;
    max-width: calc(100% - 24px) !important;
  }
}

@media (max-width: 480px) {
  .image-to-pdf-container {
    padding: 8px;
  }

  .tool-header {
    padding: 12px;
  }

  .tool-title {
    font-size: 1.1rem !important;
  }

  .generation-card {
    min-width: 240px;
    margin: 12px;
  }

  .generation-content {
    padding: 20px;
  }

  .fixed-snackbar {
    top: 8px !important;
    right: 8px !important;
    left: 8px !important;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .tool-header {
    background: rgba(0, 150, 136, 0.1);
    border-color: rgba(0, 150, 136, 0.2);
  }

  .generation-card {
    background: rgba(30, 30, 30, 0.95);
    border-color: rgba(0, 150, 136, 0.2);
  }

  .tool-title {
    color: #4dd0e1;
  }
}

[data-theme="dark"] .tool-header {
  background: rgba(0, 150, 136, 0.1);
  border-color: rgba(0, 150, 136, 0.2);
}

[data-theme="dark"] .generation-card {
  background: rgba(30, 30, 30, 0.95);
  border-color: rgba(0, 150, 136, 0.2);
}

[data-theme="dark"] .tool-title {
  color: #4dd0e1;
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .tool-header {
    border-width: 2px;
  }

  .generation-card {
    border-width: 2px;
  }

  .tool-title {
    -webkit-text-fill-color: #00695c;
    background: #00695c;
  }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .tool-header,
  .generation-card,
  .back-btn,
  .v-btn {
    transition: none !important;
  }
}

/* 修复全局对话框和覆盖层定位 */
/* 确保所有 v-dialog 和 v-overlay 都有正确的定位 */
:deep(.v-dialog),
:deep(.v-overlay__content) {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  max-width: 90vw !important;
  max-height: 90vh !important;
  overflow-y: auto !important;
}

/* 修复移动端对话框 */
@media (max-width: 768px) {
  :deep(.v-dialog),
  :deep(.v-overlay__content) {
    max-width: 95vw !important;
    max-height: 95vh !important;
    margin: 0 !important;
  }
}

/* 确保覆盖层不会出现位置漂移 */
:deep(.v-overlay) {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 修复滚动锁定问题 */
:deep(.v-overlay--active) {
  overflow: hidden !important;
}

/* 优化弹窗内容的滚动 */
:deep(.v-dialog__content) {
  overflow-y: auto !important;
  -webkit-overflow-scrolling: touch !important;
}

/* 确保工具内容区域的弹窗不会影响主布局 */
.step-content-wrapper {
  position: relative;
  z-index: 1;
}

/* 修复可能的 z-index 冲突 */
:deep(.v-overlay__content) {
  z-index: 2400 !important;
}

:deep(.v-dialog) {
  z-index: 2400 !important;
}

/* 确保工具容器不会被弹窗影响 */
.image-to-pdf-container {
  position: relative;
  z-index: 1;
}

/* 修复内容溢出问题 */
.tool-content,
.step-content-wrapper {
  max-width: 100%;
  overflow: visible;
}

/* 确保所有子组件都能正确显示 */
:deep(*) {
  box-sizing: border-box;
}

/* 修复可能的定位问题 */
.image-to-pdf-container,
.tool-content,
.tool-header,
.step-content-wrapper {
  position: relative;
}

/* 修复 snackbar 在工具容器内的定位 */
:deep(.v-snackbar) {
  position: fixed !important;
  z-index: 3000 !important;
}

/* 确保在各种情况下都能正确居中 */
.image-to-pdf-container {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.tool-content {
  margin: 0 auto !important;
}

/* 修复可能的 flexbox 冲突 */
.image-to-pdf-container > * {
  width: 100%;
}

/* 修复移动端键盘弹出时的布局问题 */
@media (max-width: 768px) {
  .image-to-pdf-container {
    min-height: 100vh;
    height: 100vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* 防止键盘弹出时布局错乱 */
  .tool-content {
    min-height: calc(100vh - 24px);
  }
}

/* 确保响应式断点不会影响弹窗 */
@media (max-width: 480px) {
  :deep(.v-dialog),
  :deep(.v-overlay__content) {
    width: 100% !important;
    height: 100% !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
    border-radius: 0 !important;
  }
}
</style>
</file_content>
</replace_in_file>

[Response interrupted by a tool use result. Only one tool may be active at a time

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PageTransition from '../../components/PageTransition.vue'
import UploadArea from './components/UploadArea.vue'
import ImageSorter from './components/ImageSorter.vue'
import ImagePreview from './components/ImagePreview.vue'

const router = useRouter()

// 状态管理
const currentStep = ref(0)
const uploadedFiles = ref([])
const sortedImages = ref([])
const previewIndex = ref(0)
const generating = ref(false)
const successSnackbar = ref(false)
const errorSnackbar = ref(false)
const errorMessage = ref('')

// 步骤 1: 上传完成
const handleUploadNext = (files) => {
  uploadedFiles.value = files
  currentStep.value = 1
}

// 步骤 2: 排序器操作
const handleSorterBack = () => {
  currentStep.value = 0
  uploadedFiles.value = []
}

const handleSorterPreview = (images, index) => {
  sortedImages.value = images
  previewIndex.value = index
  currentStep.value = 2
}

const handleSorterGenerate = (images) => {
  sortedImages.value = images
  generatePDF()
}

// 步骤 3: 预览器操作
const handlePreviewBack = () => {
  currentStep.value = 1
}

const handlePreviewGenerate = () => {
  generatePDF()
}

// PDF 生成逻辑
const generatePDF = async () => {
  if (sortedImages.value.length === 0) {
    errorMessage.value = '没有图片可生成 PDF'
    errorSnackbar.value = true
    return
  }

  generating.value = true

  try {
    // 准备表单数据
    const formData = new FormData()

    // 添加图片文件
    for (const image of sortedImages.value) {
      formData.append('images', image.file)
    }

    // 添加顺序信息
    const order = sortedImages.value.map((_, index) => index)
    formData.append('order', JSON.stringify(order))

    // 发送请求
    const response = await fetch('http://localhost:3000/api/tools/image-to-pdf/generate', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    if (result.success && result.fileUrl) {
      // 创建下载链接，确保触发下载而不是打开
      const fullUrl = `http://localhost:3000${result.fileUrl}`

      // 使用 fetch 获取 PDF 文件，然后创建 Blob 下载
      try {
        const response = await fetch(fullUrl)
        if (!response.ok) throw new Error('下载文件失败')

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `image-to-pdf-${Date.now()}.pdf`
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()

        // 清理
        window.URL.revokeObjectURL(url)
        document.body.removeChild(link)

        successSnackbar.value = true

        // 延迟返回首页
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } catch (downloadError) {
        console.error('下载失败:', downloadError)
        // 降级方案：使用传统方式
        const link = document.createElement('a')
        link.href = fullUrl
        link.download = `image-to-pdf-${Date.now()}.pdf`
        link.target = '_blank' // 强制新标签页
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        successSnackbar.value = true

        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    } else {
      throw new Error(result.message || '生成失败')
    }
  } catch (error) {
    console.error('生成 PDF 失败:', error)
    errorMessage.value = error.message || '生成 PDF 失败，请重试'
    errorSnackbar.value = true
  } finally {
    generating.value = false
  }
}

// 返回首页
const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.image-to-pdf-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 20px;
}

.tool-content {
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
}

.header-card {
  background: rgba(0, 150, 136, 0.05);
  border-radius: 12px;
}

.step-window {
  background: transparent;
}

.generation-overlay {
  backdrop-filter: blur(4px);
}

.generation-card {
  background: white;
  border-radius: 12px;
  min-width: 300px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .image-to-pdf-container {
    padding: 12px;
  }

  .tool-content {
    width: 100%;
  }

  .generation-card {
    min-width: 280px;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .generation-card {
    background: rgba(30, 30, 30, 0.95);
  }
}
</style>
