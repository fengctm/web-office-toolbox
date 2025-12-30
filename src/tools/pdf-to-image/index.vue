<template>
  <v-card class="pdf-to-image-tool" elevation="2">
    <!-- 工具标题区域 -->
    <v-card-item>
      <v-card-title class="d-flex align-center">
        <v-icon color="teal" class="mr-2">mdi-file-pdf-box</v-icon>
        PDF转图片
      </v-card-title>
      <v-card-subtitle>
        上传PDF文件，转换为高质量图片格式。完全本地处理，保护您的隐私安全。
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <!-- 文件上传区域 -->
      <div class="upload-section mb-6">
        <v-file-input
          v-model="pdfFile"
          label="选择PDF文件"
          accept=".pdf,application/pdf"
          prepend-icon="mdi-file-pdf-box"
          :loading="uploading"
          :disabled="uploading"
          @update:modelValue="handleFileUpload"
          variant="outlined"
          density="comfortable"
          hint="仅支持PDF格式文件，建议文件大小不超过50MB"
          persistent-hint
        >
          <template v-slot:append>
            <v-btn
              color="teal"
              variant="tonal"
              :disabled="!pdfFile || uploading"
              :loading="uploading"
              @click="processPDF"
            >
              {{ uploading ? '解析中...' : '解析PDF' }}
            </v-btn>
          </template>
        </v-file-input>

        <!-- 文件信息显示 -->
        <div v-if="pdfFile && !uploading" class="file-info mt-2">
          <v-chip color="primary" size="small" class="mr-2">
            <v-icon start icon="mdi-file"></v-icon>
            {{ pdfFile.name }}
          </v-chip>
          <v-chip color="grey" size="small" class="mr-2">
            <v-icon start icon="mdi-file-size"></v-icon>
            {{ formatFileSize(pdfFile.size) }}
          </v-chip>
          <v-chip color="teal" size="small" v-if="totalPages > 0">
            <v-icon start icon="mdi-book-open-page-variant"></v-icon>
            共 {{ totalPages }} 页
          </v-chip>
        </div>
      </div>

      <!-- 处理状态提示 -->
      <div v-if="processing" class="processing-state mb-6">
        <v-alert type="info" variant="tonal" icon="mdi-clock-outline">
          <div class="d-flex align-center">
            <v-progress-circular
              indeterminate
              size="20"
              width="2"
              color="teal"
              class="mr-3"
            ></v-progress-circular>
            <span>正在解析PDF文件，准备预览...</span>
          </div>
        </v-alert>
      </div>

      <!-- PDF预览网格区域 -->
      <div v-if="pdfLoaded && totalPages > 0" class="preview-section">
        <!-- 预览标题和统计 -->
        <div class="preview-header mb-4">
          <v-alert type="info" variant="outlined" icon="mdi-image">
            <strong>预览模式：</strong> 显示前 {{ Math.min(totalPages, 12) }} 页的缩略图（完整版可显示全部）
          </v-alert>
        </div>

        <!-- 预览网格 -->
        <v-row>
          <v-col
            v-for="page in Math.min(totalPages, 12)"
            :key="page"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <v-card
              class="page-preview-card"
              hover
              @click="openPreview(page)"
            >
              <!-- 页码标签 -->
              <v-toolbar density="compact" color="teal-darken-3" class="page-toolbar">
                <v-toolbar-title class="text-subtitle-2">
                  第 {{ page }} 页
                </v-toolbar-title>
                <v-btn
                  icon="mdi-magnify-plus"
                  size="small"
                  variant="text"
                  @click.stop="openPreview(page)"
                ></v-btn>
              </v-toolbar>

              <!-- 预览内容 -->
              <v-card-text class="preview-content text-center">
                <!-- 模拟预览缩略图 -->
                <div class="preview-placeholder">
                  <v-icon size="48" color="grey-darken-2">mdi-file-pdf-box</v-icon>
                  <div class="page-number mt-2 text-grey">Page {{ page }}</div>
                </div>
              </v-card-text>

              <!-- 悬停操作 -->
              <v-card-actions class="justify-center">
                <v-btn
                  size="small"
                  color="teal"
                  variant="text"
                  prepend-icon="mdi-eye"
                  @click.stop="openPreview(page)"
                >
                  查看
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <!-- 更多页面提示 -->
        <div v-if="totalPages > 12" class="mt-4 text-center">
          <v-chip color="info" variant="outlined" size="small">
            <v-icon start icon="mdi-dots-horizontal"></v-icon>
            还有 {{ totalPages - 12 }} 页未显示（导出时可全部处理）
          </v-chip>
        </div>
      </div>

      <!-- 导出控制面板 -->
      <div v-if="pdfLoaded && totalPages > 0" class="export-section mt-6">
        <v-divider class="mb-4"></v-divider>

        <v-expansion-panels variant="accordion">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <template v-slot:default="{ expanded }">
                <v-icon :color="expanded ? 'teal' : 'grey'" class="mr-2">mdi-cog</v-icon>
                <span>导出设置</span>
              </template>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <!-- 格式选择 -->
              <div class="mb-4">
                <label class="text-subtitle-2 mb-2 d-block">图片格式</label>
                <v-select
                  v-model="exportConfig.format"
                  :items="formatOptions"
                  item-title="text"
                  item-value="value"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-image"
                ></v-select>
              </div>

              <!-- 质量选择 -->
              <div class="mb-4">
                <label class="text-subtitle-2 mb-2 d-block">图片质量</label>
                <v-slider
                  v-model="exportConfig.quality"
                  :min="1"
                  :max="3"
                  :step="1"
                  :ticks="qualityLabels"
                  show-ticks="always"
                  tick-size="4"
                  color="teal"
                  model-value="2"
                  density="comfortable"
                >
                  <template v-slot:append>
                    <v-chip size="small" color="teal" variant="outlined">
                      {{ qualityLabels[exportConfig.quality] }}
                    </v-chip>
                  </template>
                </v-slider>
              </div>

              <!-- 范围选择 -->
              <div class="mb-4">
                <label class="text-subtitle-2 mb-2 d-block">导出范围</label>
                <v-select
                  v-model="exportConfig.range"
                  :items="rangeOptions"
                  item-title="text"
                  item-value="value"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-selection-drag"
                ></v-select>
              </div>

              <!-- 导出按钮 -->
              <v-btn
                block
                color="teal"
                size="large"
                :loading="exporting"
                :disabled="exporting"
                prepend-icon="mdi-download"
                @click="exportImages"
              >
                {{ exporting ? '正在导出...' : '导出为图片' }}
              </v-btn>

              <!-- 导出提示 -->
              <v-alert
                v-if="!exporting"
                type="info"
                variant="tonal"
                class="mt-3"
                icon="mdi-shield-check"
              >
                该工具为本地运行计算，运行速度以本地设备配置决定。所有处理在浏览器中完成，不会上传到服务器。
              </v-alert>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>

      <!-- 操作提示区域 -->
      <div v-if="showTips" class="tips-section mt-4">
        <v-alert
          v-if="!pdfFile && !pdfLoaded"
          type="info"
          variant="outlined"
          icon="mdi-upload"
        >
          <strong>操作步骤：</strong><br>
          1. 点击上方"选择PDF文件"按钮上传PDF<br>
          2. 点击"解析PDF"按钮生成预览<br>
          3. 在导出设置中选择格式和质量<br>
          4. 点击"导出为图片"开始转换
        </v-alert>

        <v-alert
          v-if="pdfLoaded && !exporting"
          type="success"
          variant="tonal"
          icon="mdi-check-circle"
          class="mt-3"
        >
          <strong>准备就绪！</strong><br>
          PDF文件已加载完成，共 {{ totalPages }} 页。您可以预览页面或配置导出选项。
        </v-alert>
      </div>
    </v-card-text>

    <!-- 放大查看模态框 -->
    <v-dialog
      v-model="previewDialog"
      max-width="900"
      persistent
    >
      <v-card>
        <v-toolbar color="teal-darken-2">
          <v-toolbar-title>
            <v-icon start icon="mdi-eye"></v-icon>
            页面预览 - 第 {{ currentPage }} 页
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="closePreview" variant="text">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>

        <v-card-text class="text-center pa-6">
          <!-- 大图预览区域 -->
          <div class="preview-large">
            <v-icon size="128" color="grey-darken-2" class="preview-icon">mdi-file-pdf-box</v-icon>
            <div class="text-h6 mt-4 text-grey">PDF Page {{ currentPage }}</div>
            <div class="text-body-2 text-grey mt-1">预览占位图 - 实际实现将显示真实PDF页面</div>
          </div>

          <!-- 导航控制 -->
          <div class="navigation-controls mt-6">
            <v-btn
              color="teal"
              variant="outlined"
              :disabled="currentPage <= 1"
              @click="prevPage"
              prepend-icon="mdi-chevron-left"
              class="mr-2"
            >
              上一页
            </v-btn>

            <v-chip color="teal" variant="flat" class="mx-2">
              {{ currentPage }} / {{ totalPages }}
            </v-chip>

            <v-btn
              color="teal"
              variant="outlined"
              :disabled="currentPage >= totalPages"
              @click="nextPage"
              append-icon="mdi-chevron-right"
              class="ml-2"
            >
              下一页
            </v-btn>
          </div>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn color="grey" variant="text" @click="closePreview">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 导出进度模态框 -->
    <v-dialog
      v-model="exportProgressDialog"
      max-width="400"
      persistent
    >
      <v-card>
        <v-toolbar color="teal-darken-2">
          <v-toolbar-title>
            <v-icon start icon="mdi-download"></v-icon>
            导出进度
          </v-toolbar-title>
        </v-toolbar>

        <v-card-text class="text-center pa-6">
          <v-progress-circular
            indeterminate
            size="64"
            width="4"
            color="teal"
            class="mb-4"
          ></v-progress-circular>

          <div class="text-h6 mb-2">正在处理...</div>
          <div class="text-body-2 text-grey mb-4">
            格式: {{ exportConfig.format.toUpperCase() }} |
            质量: {{ qualityLabels[exportConfig.quality] }}
          </div>

          <v-alert type="info" variant="tonal" icon="mdi-clock-outline" class="mt-3">
            大文件可能需要较长时间，请耐心等待...
          </v-alert>
        </v-card-text>

        <v-card-actions class="justify-center">
          <v-btn color="grey" variant="text" @click="cancelExport">取消</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 结果提示 -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="4000"
      location="top right"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

// 状态管理
const pdfFile = ref(null)
const uploading = ref(false)
const processing = ref(false)
const pdfLoaded = ref(false)
const totalPages = ref(0)
const exporting = ref(false)
const previewDialog = ref(false)
const exportProgressDialog = ref(false)
const currentPage = ref(1)

// 导出配置
const exportConfig = reactive({
  format: 'png',
  quality: 2, // 1=低, 2=中, 3=高
  range: 'all' // all=全部, current=当前页
})

// 提示信息
const snackbar = ref({
  show: false,
  message: '',
  color: 'info'
})

// 格式选项
const formatOptions = [
  { text: 'PNG (无损，高质量)', value: 'png' },
  { text: 'JPG (有损，文件较小)', value: 'jpg' },
  { text: 'WEBP (现代格式，平衡)', value: 'webp' }
]

// 质量标签
const qualityLabels = {
  1: '低',
  2: '中',
  3: '高'
}

// 导出范围选项
const rangeOptions = [
  { text: '全部页面', value: 'all' },
  { text: '当前页面', value: 'current' }
]

// 计算属性：是否显示提示
const showTips = computed(() => {
  return !processing.value && (!pdfLoaded.value || !exporting.value)
})

// 工具函数：格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 文件上传处理
const handleFileUpload = (file) => {
  if (!file) {
    resetState()
    return
  }

  // 验证文件类型
  if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
    showSnackbar('请选择PDF格式的文件', 'error')
    pdfFile.value = null
    return
  }

  // 验证文件大小 (50MB限制)
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    showSnackbar('文件大小超过50MB限制', 'error')
    pdfFile.value = null
    return
  }

  showSnackbar('文件选择成功，请点击"解析PDF"按钮', 'success')
}

// 解析PDF
const processPDF = async () => {
  if (!pdfFile.value) {
    showSnackbar('请先选择PDF文件', 'warning')
    return
  }

  uploading.value = true
  processing.value = true

  // 模拟解析过程
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 模拟随机页数 (5-50页)
    totalPages.value = Math.floor(Math.random() * 46) + 5

    // 模拟额外的处理时间
    await new Promise(resolve => setTimeout(resolve, 1000))

    pdfLoaded.value = true
    processing.value = false
    uploading.value = false

    showSnackbar(`PDF解析成功！共 ${totalPages.value} 页`, 'success')
  } catch (error) {
    showSnackbar('PDF解析失败，请重试', 'error')
    processing.value = false
    uploading.value = false
  }
}

// 打开预览
const openPreview = (page) => {
  currentPage.value = page
  previewDialog.value = true
}

// 关闭预览
const closePreview = () => {
  previewDialog.value = false
}

// 上一页
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

// 下一页
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// 导出图片
const exportImages = async () => {
  if (!pdfLoaded.value) {
    showSnackbar('请先解析PDF文件', 'warning')
    return
  }

  exporting.value = true
  exportProgressDialog.value = true

  // 模拟导出过程
  try {
    const exportPages = exportConfig.range === 'current' ? 1 : totalPages.value
    const processingTime = exportPages * 200 // 每页200ms模拟时间

    await new Promise(resolve => setTimeout(resolve, processingTime))

    // 模拟下载过程
    await simulateDownload()

    exportProgressDialog.value = false
    exporting.value = false

    showSnackbar(
      `导出成功！${exportPages} 页已转换为 ${exportConfig.format.toUpperCase()} 格式`,
      'success'
    )
  } catch (error) {
    showSnackbar('导出失败，请重试', 'error')
    exportProgressDialog.value = false
    exporting.value = false
  }
}

// 模拟下载
const simulateDownload = async () => {
  // 实际实现中，这里会：
  // 1. 使用pdf-lib或pdf.js解析PDF
  // 2. 将每页转换为Canvas
  // 3. 导出为指定格式的图片
  // 4. 创建下载链接

  // 这里我们模拟创建一个下载文件
  return new Promise(resolve => {
    setTimeout(() => {
      // 创建模拟文件
      const content = `PDF to Image Export\nFormat: ${exportConfig.format}\nQuality: ${qualityLabels[exportConfig.quality]}\nPages: ${exportConfig.range === 'current' ? '1' : totalPages.value}\n\nThis is a simulated export.`
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pdf-export-${Date.now()}.txt`
      a.click()
      URL.revokeObjectURL(url)
      resolve()
    }, 500)
  })
}

// 取消导出
const cancelExport = () => {
  exportProgressDialog.value = false
  exporting.value = false
  showSnackbar('导出已取消', 'info')
}

// 显示提示消息
const showSnackbar = (message, color = 'info') => {
  snackbar.value = {
    show: true,
    message,
    color
  }
}

// 重置状态
const resetState = () => {
  pdfFile.value = null
  uploading.value = false
  processing.value = false
  pdfLoaded.value = false
  totalPages.value = 0
  exporting.value = false
  currentPage.value = 1
  exportConfig.format = 'png'
  exportConfig.quality = 2
  exportConfig.range = 'all'
}
</script>

<style scoped>
.pdf-to-image-tool {
  border-radius: 12px;
  overflow: hidden;
}

.upload-section {
  background: rgba(0, 150, 136, 0.03);
  padding: 16px;
  border-radius: 8px;
  border: 1px dashed rgba(0, 150, 136, 0.3);
}

.file-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.processing-state {
  animation: fadeIn 0.3s ease-out;
}

.preview-section {
  animation: slideUp 0.4s ease-out;
}

.page-preview-card {
  transition: all 0.3s ease;
  border-radius: 8px;
  overflow: hidden;
}

.page-preview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 150, 136, 0.2);
}

.page-toolbar {
  min-height: 36px;
}

.preview-content {
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-placeholder {
  text-align: center;
  opacity: 0.6;
}

.page-number {
  font-size: 0.75rem;
  font-weight: 500;
}

.export-section {
  animation: fadeIn 0.5s ease-out;
}

.tips-section {
  animation: fadeIn 0.6s ease-out;
}

.preview-large {
  text-align: center;
  padding: 40px 20px;
  background: rgba(0, 150, 136, 0.03);
  border-radius: 8px;
  border: 2px dashed rgba(0, 150, 136, 0.2);
}

.preview-icon {
  opacity: 0.4;
}

.navigation-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

/* 动画定义 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 深色模式适配 */
.v-theme--dark .upload-section {
  background: rgba(38, 166, 154, 0.05);
  border-color: rgba(38, 166, 154, 0.4);
}

.v-theme--dark .preview-large {
  background: rgba(38, 166, 154, 0.05);
  border-color: rgba(38, 166, 154, 0.3);
}

.v-theme--dark .page-preview-card:hover {
  box-shadow: 0 8px 16px rgba(38, 166, 154, 0.3);
}

/* 响应式调整 */
@media (max-width: 600px) {
  .file-info {
    flex-direction: column;
    gap: 4px;
  }

  .navigation-controls {
    flex-direction: column;
    gap: 8px;
  }

  .navigation-controls .v-btn {
    width: 100%;
  }
}

/* 确保Vuetify组件样式正确应用 */
:deep(.v-file-input) {
  width: 100%;
}

:deep(.v-expansion-panel-text__content) {
  padding: 16px 0;
}
</style>
