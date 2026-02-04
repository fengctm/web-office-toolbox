<template>
  <v-container fluid class="base64-converter">
    <v-card class="converter-card" elevation="2">
      <v-card-item>
        <v-card-title class="d-flex align-center">
          <v-icon color="teal" class="mr-2">mdi-code-braces</v-icon>
          Base64 转换器
        </v-card-title>
        <v-card-subtitle>
          支持图片转换为 PNG 格式后编码为 Base64
        </v-card-subtitle>
      </v-card-item>

      <v-card-text>
        <v-tabs v-model="activeTab" color="teal" align-tabs="start">
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
                mandatory
                color="teal"
                variant="outlined"
                density="comfortable"
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
                variant="tonal"
                size="small"
              >
                一次只能上传一个文件
              </v-chip>
              <v-chip
                v-else
                class="ml-3"
                color="green"
                variant="tonal"
                size="small"
              >
                支持同时上传多个文件
              </v-chip>
            </div>

            <ImageToPngConverter
              ref="imageConverter"
              :mode="uploadMode"
              accept="image/jpeg,image/webp,image/png"
              :max-size="5 * 1024 * 1024"
              @convert="handleImageConvert"
              @error="handleConvertError"
            />

            <div v-if="convertedImages.length > 0" class="preview-section mt-4">
              <div class="d-flex align-center justify-space-between mb-3">
                <h4 class="text-h6">
                  <v-icon class="mr-2">mdi-image-filter</v-icon>
                  已转换的图片 ({{ convertedImages.length }})
                </h4>
                <div class="d-flex gap-2">
                  <v-btn
                    variant="tonal"
                    color="teal"
                    size="small"
                    @click="copyAllBase64"
                  >
                    <v-icon class="mr-1">mdi-content-copy</v-icon>
                    复制全部
                  </v-btn>
                  <v-btn
                    variant="outlined"
                    size="small"
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
                  <v-card variant="outlined" class="image-result-card">
                    <div class="image-preview-wrapper">
                      <v-img
                        :src="img.dataUrl"
                        :aspect-ratio="img.width / img.height"
                        contain
                        class="image-preview"
                      />
                    </div>
                    <v-card-text>
                      <div class="image-info mb-2">
                        <strong>{{ img.originalName }}</strong>
                        <v-chip
                          size="x-small"
                          color="teal"
                          variant="tonal"
                          class="ml-2"
                        >
                          {{ img.width }} × {{ img.height }}
                        </v-chip>
                      </div>
                      <v-textarea
                        :model-value="img.pngBase64"
                        label="Base64 结果"
                        variant="outlined"
                        density="compact"
                        rows="3"
                        readonly
                        hide-details
                        class="base64-output"
                      >
                        <template v-slot:append-inner>
                          <v-btn
                            variant="text"
                            color="teal"
                            size="x-small"
                            @click="copySingleBase64(img)"
                          >
                            <v-icon>mdi-content-copy</v-icon>
                          </v-btn>
                        </template>
                      </v-textarea>
                      <v-chip
                        size="x-small"
                        class="mt-2"
                        color="grey"
                        variant="tonal"
                      >
                        {{ formatNumber(img.pngBase64.length) }} 字符
                      </v-chip>
                    </v-card-text>
                    <v-card-actions>
                      <v-spacer />
                      <v-btn
                        variant="text"
                        color="error"
                        size="small"
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
              label="输入文本"
              variant="outlined"
              rows="4"
              placeholder="请输入要转换为 Base64 的文本"
              auto-grow
            />

            <div class="d-flex gap-2 mb-4">
              <v-btn
                variant="tonal"
                color="teal"
                :loading="converting"
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
                label="Base64 结果"
                variant="outlined"
                rows="4"
                readonly
                auto-grow
              >
                <template v-slot:append-inner>
                  <v-btn
                    variant="text"
                    color="teal"
                    size="small"
                    @click="copyTextBase64"
                  >
                    <v-icon>mdi-content-copy</v-icon>
                  </v-btn>
                </template>
              </v-textarea>

              <v-chip
                color="teal"
                variant="tonal"
                size="small"
                class="mt-2"
              >
                长度: {{ formatNumber(textBase64Result.length) }} 字符
              </v-chip>
            </div>
          </v-window-item>
        </v-window>

        <v-alert
          v-if="message"
          :type="messageType"
          :text="message"
          density="compact"
          class="mt-3"
          closable
          @click:close="message = ''"
        />
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import ImageToPngConverter from './components/ImageToPngConverter.vue'

const activeTab = ref('image')
const uploadMode = ref('single')
const imageConverter = ref(null)
const convertedImages = ref([])
const inputText = ref('')
const textBase64Result = ref('')
const converting = ref(false)
const message = ref('')
const messageType = ref('info')

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

const handleImageConvert = (results) => {
  if (uploadMode.value === 'single') {
    convertedImages.value = results
  } else {
    convertedImages.value = [...convertedImages.value, ...results]
  }
  showMessage(`成功转换 ${results.length} 张图片`, 'success')
}

const handleConvertError = (error) => {
  console.error('转换错误:', error)
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
  imageConverter.value?.reset()
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
</style>
