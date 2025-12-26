<template>
  <v-card class="upload-area" elevation="2">
    <v-card-text class="upload-content">
      <!-- 上传区域标题 -->
      <div class="upload-header mb-6">
        <v-icon size="48" color="primary" class="mb-2">mdi-cloud-upload</v-icon>
        <div class="text-h5 font-weight-bold mb-1">上传图片</div>
        <div class="text-body-1 text-grey">
          选择要转换为 PDF 的图片文件
        </div>
      </div>

      <!-- 文件输入 -->
      <v-input
        :model-value="files"
        :rules="rules"
        multiple
        @update:model-value="handleFilesUpdate"
        class="file-input-wrapper"
      >
        <template #default="{ modelValue }">
          <v-file-input
            v-model="files"
            :multiple="true"
            accept="image/jpeg,image/jpg,image/png"
            label="点击或拖拽选择图片文件"
            prepend-icon="mdi-image-plus"
            variant="outlined"
            density="comfortable"
            chips
            counter
            :show-size="1000"
            @update:modelValue="handleFilesUpdate"
            class="file-input"
            hint="支持 JPG、JPEG、PNG 格式，最多 100 张图片"
            persistent-hint
          >
            <template #selection="{ fileNames }">
              <div class="file-chips-wrapper">
                <v-chip
                  v-for="fileName in fileNames"
                  :key="fileName"
                  class="file-chip mr-2 mb-2"
                  size="small"
                  color="primary"
                  variant="outlined"
                  closable
                  @click:close="removeFile(fileName)"
                >
                  {{ fileName }}
                </v-chip>
              </div>
            </template>
          </v-file-input>
        </template>
      </v-input>
    </v-card-text>

    <v-card-actions class="action-buttons justify-center pb-6">
      <v-btn
        color="primary"
        size="large"
        :disabled="files.length === 0"
        prepend-icon="mdi-arrow-right"
        @click="handleNext"
        class="next-btn px-8"
        elevation="2"
      >
        下一步：排序与预览
      </v-btn>
    </v-card-actions>

    <!-- 文件统计信息 -->
    <v-card-text v-if="files.length > 0" class="file-stats text-center pt-0">
      <div class="text-body-2 font-weight-medium">
        已选择 {{ files.length }} 张图片
      </div>
      <div class="text-caption text-grey mt-1">
        总大小: {{ formatTotalSize() }}
      </div>
    </v-card-text>
  </v-card>
</template>
-------

<file_content path="src/tools/image-to-pdf/components/UploadArea.vue">
<template>
  <v-card class="upload-area" elevation="2">
    <v-card-text class="upload-content">
      <!-- 上传区域标题 -->
      <div class="upload-header mb-6">
        <v-icon size="48" color="primary" class="mb-2">mdi-cloud-upload</v-icon>
        <div class="text-h5 font-weight-bold mb-1">上传图片</div>
        <div class="text-body-1 text-grey">
          选择要转换为 PDF 的图片文件
        </div>
      </div>

      <!-- 文件输入 -->
      <v-input
        :model-value="files"
        :rules="rules"
        multiple
        @update:model-value="handleFilesUpdate"
        class="file-input-wrapper"
      >
        <template #default="{ modelValue }">
          <v-file-input
            v-model="files"
            :multiple="true"
            accept="image/jpeg,image/jpg,image/png"
            label="点击或拖拽选择图片文件"
            prepend-icon="mdi-image-plus"
            variant="outlined"
            density="comfortable"
            chips
            counter
            :show-size="1000"
            @update:modelValue="handleFilesUpdate"
            class="file-input"
            hint="支持 JPG、JPEG、PNG 格式，最多 100 张图片"
            persistent-hint
          >
            <template #selection="{ fileNames }">
              <div class="file-chips-wrapper">
                <v-chip
                  v-for="fileName in fileNames"
                  :key="fileName"
                  class="file-chip mr-2 mb-2"
                  size="small"
                  color="primary"
                  variant="outlined"
                  closable
                  @click:close="removeFile(fileName)"
                >
                  {{ fileName }}
                </v-chip>
              </div>
            </template>
          </v-file-input>
        </template>
      </v-input>
    </v-card-text>

    <v-card-actions class="action-buttons justify-center pb-6">
      <v-btn
        color="primary"
        size="large"
        :disabled="files.length === 0"
        prepend-icon="mdi-arrow-right"
        @click="handleNext"
        class="next-btn px-8"
        elevation="2"
      >
        下一步：排序与预览
      </v-btn>
    </v-card-actions>

    <!-- 文件统计信息 -->
    <v-card-text v-if="files.length > 0" class="file-stats text-center pt-0">
      <div class="text-body-2 font-weight-medium">
        已选择 {{ files.length }} 张图片
      </div>
      <div class="text-caption text-grey mt-1">
        总大小: {{ formatTotalSize() }}
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['next'])

const files = ref([])
const rules = [
  (value) => {
    if (!value || value.length === 0) return '请至少选择一张图片'
    if (value.length > 100) return '最多支持 100 张图片'
    return true
  }
]

const handleFilesUpdate = (value) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png']

  if (value && value.length > 0) {
    // 过滤有效文件
    const validFiles = value.filter(file => validTypes.includes(file.type))
    files.value = validFiles
  } else {
    files.value = []
  }
}

const handleNext = () => {
  if (files.value.length > 0) {
    emit('next', files.value)
  }
}

// 移除单个文件
const removeFile = (fileName) => {
  files.value = files.value.filter(file => file.name !== fileName)
}

// 格式化总大小
const formatTotalSize = () => {
  const total = files.value.reduce((sum, file) => sum + file.size, 0)
  if (total === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(total) / Math.log(k))
  return parseFloat((total / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.upload-area {
  transition: all 0.3s ease;
  border-radius: 16px;
  overflow: hidden;
}

.upload-content {
  padding: 32px;
  min-height: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 上传区域标题 */
.upload-header {
  text-align: center;
  width: 100%;
  max-width: 500px;
}

.upload-header .v-icon {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

/* 文件输入包装器 */
.file-input-wrapper {
  width: 100%;
  max-width: 600px;
}

.file-input {
  width: 100%;
}

/* 文件标签容器 */
.file-chips-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.file-chip {
  transition: all 0.2s ease;
}

.file-chip:hover {
  transform: scale(1.05);
}

/* 操作按钮区域 */
.action-buttons {
  width: 100%;
}

.next-btn {
  font-weight: 600;
  letter-spacing: 0.5px;
  border-radius: 12px !important;
  transition: all 0.2s ease !important;
  min-height: 48px !important;
}

.next-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 150, 136, 0.3) !important;
}

.next-btn:disabled {
  opacity: 0.5;
}

/* 文件统计信息 */
.file-stats {
  animation: fadeIn 0.3s ease;
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

/* 悬停效果 */
.upload-area:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 150, 136, 0.2) !important;
}

/* PC端大屏幕优化 */
@media (min-width: 1400px) {
  .upload-content {
    padding: 48px;
    min-height: 300px;
  }

  .upload-header .v-icon {
    font-size: 64px !important;
  }

  .upload-header .text-h5 {
    font-size: 1.5rem !important;
  }

  .upload-header .text-body-1 {
    font-size: 1.1rem !important;
  }

  .next-btn {
    font-size: 1.1rem !important;
    min-height: 52px !important;
    padding: 0 32px !important;
  }
}

@media (min-width: 1200px) and (max-width: 1399px) {
  .upload-content {
    padding: 40px;
  }

  .upload-header .v-icon {
    font-size: 56px !important;
  }

  .upload-header .text-h5 {
    font-size: 1.35rem !important;
  }

  .next-btn {
    font-size: 1.05rem !important;
    min-height: 48px !important;
  }
}

@media (min-width: 769px) and (max-width: 1199px) {
  .upload-content {
    padding: 32px;
  }

  .upload-header .v-icon {
    font-size: 52px !important;
  }

  .upload-header .text-h5 {
    font-size: 1.25rem !important;
  }

  .next-btn {
    font-size: 1rem !important;
    min-height: 46px !important;
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .upload-content {
    padding: 24px 16px;
    min-height: 220px;
  }

  .upload-header .v-icon {
    font-size: 40px !important;
    animation: float 2.5s ease-in-out infinite;
  }

  .upload-header .text-h5 {
    font-size: 1.1rem !important;
  }

  .upload-header .text-body-1 {
    font-size: 0.9rem !important;
  }

  .file-input-wrapper {
    max-width: 100%;
  }

  .next-btn {
    width: 100%;
    font-size: 0.95rem !important;
    min-height: 44px !important;
  }

  .file-chips-wrapper {
    gap: 6px;
  }

  .file-chip {
    font-size: 0.8rem !important;
  }
}

@media (max-width: 480px) {
  .upload-content {
    padding: 20px 12px;
    min-height: 200px;
  }

  .upload-header .v-icon {
    font-size: 36px !important;
  }

  .upload-header .text-h5 {
    font-size: 1rem !important;
  }

  .upload-header .text-body-1 {
    font-size: 0.85rem !important;
  }

  .next-btn {
    font-size: 0.9rem !important;
    min-height: 40px !important;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .upload-area {
    background: rgba(30, 30, 30, 0.95);
  }

  .upload-header .v-icon {
    filter: drop-shadow(0 4px 12px rgba(0, 150, 136, 0.5));
  }

  .file-chip {
    background: rgba(0, 150, 136, 0.15) !important;
  }
}

[data-theme="dark"] .upload-area {
  background: rgba(30, 30, 30, 0.95);
}

[data-theme="dark"] .upload-header .v-icon {
  filter: drop-shadow(0 4px 12px rgba(0, 150, 136, 0.5));
}

[data-theme="dark"] .file-chip {
  background: rgba(0, 150, 136, 0.15) !important;
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .upload-area {
    border-width: 2px;
    border-style: solid;
    border-color: #00695c;
  }

  .next-btn {
    border-width: 2px !important;
    font-weight: 700;
  }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .upload-header .v-icon {
    animation: none !important;
  }

  .upload-area,
  .next-btn,
  .file-chip {
    transition: none !important;
  }

  .upload-area:hover {
    transform: none !important;
  }
}

/* 优化文件输入样式 */
:deep(.v-file-input) {
  cursor: pointer;
}

:deep(.v-file-input__input) {
  cursor: pointer;
}

:deep(.v-field__input) {
  min-height: 56px;
  padding-top: 12px;
  padding-bottom: 12px;
}

/* 优化拖拽区域视觉反馈 */
:deep(.v-file-input:hover .v-field__outline),
:deep(.v-file-input:focus-within .v-field__outline) {
  border-color: #009688 !important;
}

/* 确保错误状态清晰可见 */
:deep(.v-messages__message) {
  font-size: 0.85rem;
  margin-top: 4px;
}

/* 优化滚动区域 */
.upload-area {
  max-height: 80vh;
  overflow-y: auto;
}

/* 修复可能的样式冲突 */
.upload-area :deep(*) {
  box-sizing: border-box;
}
</style>
</file_content>
</replace_in_file>

[Response interrupted by a tool use result. Only one tool may be active at a time

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['next'])

const files = ref([])
const rules = [
  (value) => {
    if (!value || value.length === 0) return '请至少选择一张图片'
    if (value.length > 100) return '最多支持 100 张图片'
    return true
  }
]

const handleFilesUpdate = (value) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png']

  if (value && value.length > 0) {
    // 过滤有效文件
    const validFiles = value.filter(file => validTypes.includes(file.type))
    files.value = validFiles
  } else {
    files.value = []
  }
}

const handleNext = () => {
  if (files.value.length > 0) {
    emit('next', files.value)
  }
}
</script>

<style scoped>
.upload-area {
  transition: all 0.3s ease;
}

.upload-area:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 150, 136, 0.15) !important;
}

:deep(.v-file-input) {
  cursor: pointer;
}

:deep(.v-file-input__input) {
  cursor: pointer;
}
</style>
