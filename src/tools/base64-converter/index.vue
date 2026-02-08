<template>
  <v-container class="base64-converter" fluid>
    <v-card class="converter-card" elevation="2">
      <v-card-item>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="teal">mdi-code-braces</v-icon>
          Base64 转换器
        </v-card-title>
        <v-card-subtitle>
          支持图片转换为 PNG 格式后编码为 Base64
        </v-card-subtitle>
      </v-card-item>

      <v-card-text>
        <v-tabs v-model="activeTab" align-tabs="start" color="teal">
          <v-tab value="image">
            <v-icon class="mr-2">mdi-image</v-icon>
            图片转换
          </v-tab>
          <v-tab value="text">
            <v-icon class="mr-2">mdi-text</v-icon>
            文本转换
          </v-tab>
        </v-tabs>

        <v-window v-model="activeTab" class="mt-4">
          <v-window-item value="image">
            <div class="upload-mode-toggle mb-4">
              <span class="mode-label mr-3">上传模式：</span>
              <v-btn-toggle
                  v-model="uploadMode"
                  color="teal"
                  density="comfortable"
                  mandatory
                  variant="outlined"
              >
                <v-btn value="single">
                  <v-icon class="mr-1">mdi-file-outline</v-icon>
                  单文件
                </v-btn>
                <v-btn value="multiple">
                  <v-icon class="mr-1">mdi-file-multiple</v-icon>
                  多文件
                </v-btn>
              </v-btn-toggle>
              <v-chip
                  v-if="uploadMode === 'single'"
                  class="ml-3"
                  color="orange"
                  size="small"
                  variant="tonal"
              >
                一次只能上传一个文件
              </v-chip>
              <v-chip
                  v-else
                  class="ml-3"
                  color="green"
                  size="small"
                  variant="tonal"
              >
                支持同时上传多个文件
              </v-chip>
            </div>

            <ImageUploader
                ref="imageUploaderRef"
                :accept-formats="['image/jpeg', 'image/webp', 'image/png']"
                :allow-animated="false"
                :current-file-count="convertedImages.length"
                :drag-enabled="true"
                :max-files="isMultipleMode ? 100 : 1"
                :max-size="50 * 1024 * 1024"
                :multiple="isMultipleMode"
                :show-file-count="isMultipleMode"
                upload-subtext="支持 JPG, WEBP, PNG"
                upload-text="点击或拖拽图片到此处"
                @files-selected="handleFilesSelected"
                @file-error="handleFileError"
            />

            <!-- 大文件确认对话框 -->
            <v-dialog
                v-model="largeFileConfirmDialog"
                max-width="600"
                persistent
            >
              <v-card>
                <v-toolbar color="warning" title="大文件警告">
                  <v-spacer/>
                  <v-btn icon @click="cancelLargeFileProcessing">
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </v-toolbar>

                <v-card-text class="pa-6">
                  <v-alert class="mb-4" density="compact" type="warning" variant="tonal">
                    <div class="text-h6 mb-2">检测到大文件，可能影响性能</div>
                  </v-alert>

                  <div class="warning-content mb-4">
                    <p class="text-body-1 mb-3">
                      <v-icon class="mr-2" color="warning">mdi-file-alert</v-icon>
                      {{
                        largeFileWarning.singleFile ? '该文件' : `这 ${largeFileWarning.fileCount} 个文件`
                      }}较大，转换后可能造成以下影响：
                    </p>

                    <v-list class="mb-3" density="compact">
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon color="warning">mdi-file-outline</v-icon>
                        </template>
                        <v-list-item-title>
                          原始大小：<strong>{{ largeFileWarning.totalOriginalSize }}</strong>
                        </v-list-item-title>
                      </v-list-item>

                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon color="warning">mdi-code-braces</v-icon>
                        </template>
                        <v-list-item-title>
                          预估 Base64 大小：<strong>{{ largeFileWarning.totalEstimatedBase64 }} 字符</strong>
                        </v-list-item-title>
                      </v-list-item>

                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon color="error">mdi-alert-circle</v-icon>
                        </template>
                        <v-list-item-title>
                          可能导致页面卡顿或响应缓慢
                        </v-list-item-title>
                      </v-list-item>

                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon color="error">mdi-content-copy</v-icon>
                        </template>
                        <v-list-item-title>
                          复制操作可能需要较长时间
                        </v-list-item-title>
                      </v-list-item>
                    </v-list>

                    <v-divider class="my-3"/>

                    <p class="text-body-2 text-grey-darken-1 mb-2">
                      <v-icon class="mr-1" size="small">mdi-help-circle</v-icon>
                      建议您：
                    </p>

                    <ul class="text-body-2 text-grey-darken-1 ps-8">
                      <li>确认需要转换这些大文件</li>
                      <li>确保设备有足够内存</li>
                      <li>耐心等待转换完成</li>
                    </ul>

                    <div v-if="largeFileWarning.singleFile" class="mt-3 pa-3 bg-grey-lighten-4 rounded">
                      <p class="text-caption text-grey-darken-2 mb-0">
                        <strong>文件名：</strong>{{ largeFileWarning.fileNames }}
                      </p>
                    </div>
                  </div>
                </v-card-text>

                <v-card-actions class="pa-4 pt-0">
                  <v-spacer/>
                  <v-btn
                      color="grey"
                      variant="outlined"
                      @click="cancelLargeFileProcessing"
                  >
                    <v-icon class="mr-1">mdi-cancel</v-icon>
                    取消
                  </v-btn>
                  <v-btn
                      color="warning"
                      variant="tonal"
                      @click="confirmLargeFileProcessing"
                  >
                    <v-icon class="mr-1">mdi-check-circle</v-icon>
                    确认转换
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

            <!-- 转换进度遮罩层 -->
            <div v-if="isConverting" class="converting-overlay">
              <v-card class="converting-card" elevation="4">
                <v-card-text class="d-flex flex-column align-center pa-6">
                  <v-progress-circular
                      color="teal"
                      indeterminate
                      size="64"
                  />
                  <p class="text-h6 mt-4 text-center">正在转换图片为 Base64...</p>
                  <p class="text-body-2 text-grey-darken-1 mt-2">
                    大文件转换可能需要更长时间，请耐心等待
                  </p>
                </v-card-text>
              </v-card>
            </div>

            <div v-if="convertedImages.length > 0" class="preview-section mt-4">
              <div class="d-flex align-center justify-space-between mb-3">
                <h4 class="text-h6">
                  <v-icon class="mr-2">mdi-image-filter</v-icon>
                  已转换的图片 ({{ convertedImages.length }})
                </h4>
                <div class="d-flex gap-2">
                  <v-btn
                      color="teal"
                      size="small"
                      variant="tonal"
                      @click="copyAllBase64"
                  >
                    <v-icon class="mr-1">mdi-content-copy</v-icon>
                    复制全部
                  </v-btn>
                  <v-btn
                      size="small"
                      variant="outlined"
                      @click="clearAllImages"
                  >
                    <v-icon class="mr-1">mdi-delete</v-icon>
                    清空
                  </v-btn>
                </div>
              </div>

              <v-row>
                <v-col
                    v-for="(img, index) in convertedImages"
                    :key="index"
                    cols="12"
                    md="6"
                >
                  <v-card class="image-result-card" variant="outlined">
                    <div class="image-preview-wrapper">
                      <v-img
                          :aspect-ratio="img.width / img.height"
                          :src="img.dataUrl"
                          class="image-preview"
                          contain
                      />
                    </div>
                    <v-card-text>
                      <div class="image-info mb-2">
                        <strong>{{ img.originalName }}</strong>
                        <v-chip
                            class="ml-2"
                            color="teal"
                            size="x-small"
                            variant="tonal"
                        >
                          {{ img.width }} × {{ img.height }}
                        </v-chip>
                      </div>
                      <v-textarea
                          :model-value="img.pngBase64"
                          class="base64-output"
                          density="compact"
                          hide-details
                          label="Base64 结果"
                          readonly
                          rows="3"
                          variant="outlined"
                      >
                        <template v-slot:append-inner>
                          <v-btn
                              color="teal"
                              size="x-small"
                              variant="text"
                              @click="copySingleBase64(img)"
                          >
                            <v-icon>mdi-content-copy</v-icon>
                          </v-btn>
                        </template>
                      </v-textarea>
                      <v-chip
                          class="mt-2"
                          color="grey"
                          size="x-small"
                          variant="tonal"
                      >
                        {{ formatNumber(img.pngBase64.length) }} 字符
                      </v-chip>
                    </v-card-text>
                    <v-card-actions>
                      <v-spacer/>
                      <v-btn
                          color="error"
                          size="small"
                          variant="text"
                          @click="removeImage(index)"
                      >
                        <v-icon class="mr-1">mdi-delete</v-icon>
                        移除
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-window-item>

          <v-window-item value="text">
            <v-textarea
                v-model="inputText"
                auto-grow
                label="输入文本"
                placeholder="请输入要转换为 Base64 的文本"
                rows="4"
                variant="outlined"
            />

            <div class="d-flex gap-2 mb-4">
              <v-btn
                  :loading="converting"
                  color="teal"
                  variant="tonal"
                  @click="convertTextToBase64"
              >
                <v-icon class="mr-2">mdi-arrow-right</v-icon>
                转换为 Base64
              </v-btn>
              <v-btn
                  variant="outlined"
                  @click="clearText"
              >
                <v-icon class="mr-2">mdi-delete</v-icon>
                清空
              </v-btn>
            </div>

            <div v-if="textBase64Result" class="output-section">
              <v-textarea
                  v-model="textBase64Result"
                  auto-grow
                  label="Base64 结果"
                  readonly
                  rows="4"
                  variant="outlined"
              >
                <template v-slot:append-inner>
                  <v-btn
                      color="teal"
                      size="small"
                      variant="text"
                      @click="copyTextBase64"
                  >
                    <v-icon>mdi-content-copy</v-icon>
                  </v-btn>
                </template>
              </v-textarea>

              <v-chip
                  class="mt-2"
                  color="teal"
                  size="small"
                  variant="tonal"
              >
                长度: {{ formatNumber(textBase64Result.length) }} 字符
              </v-chip>
            </div>
          </v-window-item>
        </v-window>

        <v-alert
            v-if="message"
            :text="message"
            :type="messageType"
            class="mt-3"
            closable
            density="compact"
            @click:close="message = ''"
        />
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import {computed, onBeforeUnmount, ref} from 'vue'
import ImageUploader from '@/components/ImageUploader.vue'

const activeTab = ref('image')
const uploadMode = ref('single')
const imageUploaderRef = ref(null)  // ImageUploader 组件引用
const convertedImages = ref([])
const inputText = ref('')
const textBase64Result = ref('')
const converting = ref(false)
const message = ref('')
const messageType = ref('info')
const isConverting = ref(false)  // 转换进行中标志
const largeFileConfirmDialog = ref(false)  // 大文件确认对话框
const pendingLargeFiles = ref([])  // 等待确认的大文件列表
const largeFileWarning = ref({})  // 大文件警告信息

// 计算属性：判断是否为多文件模式
const isMultipleMode = computed(() => uploadMode.value === 'multiple')

/**
 * 估算 Base64 编码后的文件大小
 * Base64 编码会使文件大小增加约 33%
 * @param {number} originalSize - 原始文件大小（字节）
 * @returns {string} 格式化后的大小文本
 */
const estimateBase64Size = (originalSize) => {
  const estimatedSize = Math.ceil(originalSize * 1.33)
  return formatNumber(estimatedSize)
}

/**
 * 判断文件是否为大文件
 * @param {File} file - 文件对象
 * @returns {boolean} 是否为大文件
 */
const isLargeFile = (file) => {
  return file.size >= 5 * 1024 * 1024  // 5MB
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const formatNumber = (num) => {
  return num.toLocaleString()
}

const showMessage = (text, type = 'info') => {
  message.value = text
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

/**
 * 将图片文件转换为 PNG 格式的 Base64
 * @param {File} file - 图片文件
 * @returns {Promise<Object>} 转换结果对象
 */
const convertToPngBase64 = async (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)

        const pngBase64 = canvas.toDataURL('image/png')

        URL.revokeObjectURL(url)

        resolve({
          originalName: file.name,
          originalType: file.type,
          originalSize: file.size,
          pngBase64: pngBase64,
          width: img.width,
          height: img.height,
          dataUrl: pngBase64
        })
      } catch (error) {
        URL.revokeObjectURL(url)
        reject(error)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`无法加载图片 "${file.name}"`))
    }

    img.src = url
  })
}

/**
 * 处理 ImageUploader 发送的文件选择事件
 * @param {File[]} files - 选中的文件数组
 */
const handleFilesSelected = async (files) => {
  if (!files || files.length === 0) {
    return
  }

  // 检查是否包含大文件
  const largeFiles = files.filter(file => isLargeFile(file))

  if (largeFiles.length > 0) {
    // 计算总大小和预估 Base64 大小
    const totalOriginalSize = largeFiles.reduce((sum, file) => sum + file.size, 0)
    const totalEstimatedBase64 = Math.ceil(totalOriginalSize * 1.33)

    // 准备警告信息
    largeFileWarning.value = {
      fileCount: largeFiles.length,
      fileNames: largeFiles.map(f => f.name).join('、'),
      totalOriginalSize: formatFileSize(totalOriginalSize),
      totalEstimatedBase64: formatNumber(totalEstimatedBase64),
      singleFile: largeFiles.length === 1
    }

    // 保存待处理的文件
    pendingLargeFiles.value = files

    // 显示确认对话框
    largeFileConfirmDialog.value = true
    return
  }

  // 没有大文件，直接处理
  await processConversion(files)
}

/**
 * 处理图片转换
 * @param {File[]} files - 要转换的文件数组
 */
const processConversion = async (files) => {
  isConverting.value = true

  try {
    // 批量转换所有文件为 PNG Base64
    const results = await Promise.all(
        files.map(file => convertToPngBase64(file))
    )

    // 根据模式决定如何添加结果
    if (uploadMode.value === 'single') {
      // 单文件模式：替换所有结果
      convertedImages.value = results
    } else {
      // 多文件模式：追加到现有结果
      convertedImages.value = [...convertedImages.value, ...results]
    }

    showMessage(`成功转换 ${results.length} 张图片为 Base64`, 'success')
  } catch (error) {
    console.error('图片转换失败:', error)
    showMessage('转换失败: ' + error.message, 'error')
  } finally {
    isConverting.value = false
  }
}

/**
 * 确认处理大文件
 */
const confirmLargeFileProcessing = async () => {
  largeFileConfirmDialog.value = false
  await processConversion(pendingLargeFiles.value)
  pendingLargeFiles.value = []
}

/**
 * 取消处理大文件
 */
const cancelLargeFileProcessing = () => {
  largeFileConfirmDialog.value = false
  pendingLargeFiles.value = []
  showMessage('已取消大文件转换', 'info')
}

/**
 * 处理文件错误
 * @param {Object} error - 错误对象
 */
const handleFileError = (error) => {
  console.error('文件错误:', error)
  showMessage(error.message || '文件处理出错', 'error')
}

const copySingleBase64 = async (img) => {
  try {
    await navigator.clipboard.writeText(img.pngBase64)
    showMessage('已复制 Base64 到剪贴板', 'success')
  } catch (error) {
    showMessage('复制失败', 'error')
  }
}

const copyAllBase64 = async () => {
  if (convertedImages.value.length === 0) {
    showMessage('没有可复制的内容', 'warning')
    return
  }

  const allBase64 = convertedImages.value
      .map((img, index) => `// ${img.originalName}\n${img.pngBase64}`)
      .join('\n\n')

  try {
    await navigator.clipboard.writeText(allBase64)
    showMessage(`已复制 ${convertedImages.value.length} 个 Base64 结果`, 'success')
  } catch (error) {
    showMessage('复制失败', 'error')
  }
}

const removeImage = (index) => {
  convertedImages.value.splice(index, 1)
  showMessage('已移除图片', 'info')
}

const clearAllImages = () => {
  convertedImages.value = []
  // ImageUploader 不需要 reset，它会根据 currentFileCount 自动更新
  showMessage('已清空所有图片', 'info')
}

const convertTextToBase64 = () => {
  if (!inputText.value) {
    showMessage('请输入文本内容', 'warning')
    return
  }

  converting.value = true

  try {
    textBase64Result.value = btoa(unescape(encodeURIComponent(inputText.value)))
    showMessage('文本转换为 Base64 成功', 'success')
  } catch (error) {
    showMessage('转换失败: ' + error.message, 'error')
  } finally {
    converting.value = false
  }
}

const copyTextBase64 = async () => {
  if (!textBase64Result.value) {
    showMessage('没有可复制的内容', 'warning')
    return
  }

  try {
    await navigator.clipboard.writeText(textBase64Result.value)
    showMessage('已复制 Base64 到剪贴板', 'success')
  } catch (error) {
    showMessage('复制失败', 'error')
  }
}

const clearText = () => {
  inputText.value = ''
  textBase64Result.value = ''
}

// 生命周期清理
onBeforeUnmount(() => {
  convertedImages.value = []
})
</script>

<style scoped>
.base64-converter {
  padding: 16px;
  animation: fadeIn 0.3s ease-out;
}

.converter-card {
  border-radius: 12px;
  overflow: hidden;
}

.upload-mode-toggle {
  display: flex;
  align-items: center;
}

.mode-label {
  font-weight: 500;
  color: #666;
}

.preview-section {
  border-top: 1px solid #e0e0e0;
  padding-top: 16px;
}

.image-result-card {
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.image-result-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-preview-wrapper {
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  max-height: 200px;
  overflow: hidden;
}

.image-preview {
  border-radius: 0;
}

.image-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.base64-output {
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 11px;
}

.output-section {
  margin-top: 16px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 600px) {
  .base64-converter {
    padding: 8px;
  }

  .upload-mode-toggle {
    flex-direction: column;
    align-items: flex-start;
  }

  .mode-label {
    margin-bottom: 8px;
  }

  .ml-3 {
    margin-left: 0 !important;
    margin-top: 8px;
  }
}

.converting-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.converting-card {
  border-radius: 16px;
  min-width: 320px;
  max-width: 400px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
