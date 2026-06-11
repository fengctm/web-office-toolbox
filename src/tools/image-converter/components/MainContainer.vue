<template>
  <div class="main-container">
    <!-- 顶部标题栏 -->
    <v-card-item class="pb-2">
      <v-card-title class="d-flex align-center">
        <v-icon color="teal" class="mr-2">mdi-image-sync</v-icon>
        图片格式转换
        <v-spacer />
        <v-btn
          variant="text"
          size="small"
          color="grey"
          prepend-icon="mdi-refresh"
          @click="$emit('reset')"
        >
          重新开始
        </v-btn>
      </v-card-title>
      <v-card-subtitle>
        基于 Rust + WebAssembly 实现真正的像素级编解码转换，支持几乎所有常见图片格式
      </v-card-subtitle>
    </v-card-item>

    <v-divider />

    <v-card-text class="pt-4">
      <v-row>
        <!-- 左侧：设置 + 操作 -->
        <v-col cols="12" md="4">
          <!-- 格式设置 -->
          <FormatSettings
            v-model:output-format="outputFormat"
            v-model:quality="quality"
            v-model:bg-color="bgColor"
          />

          <!-- 操作按钮 -->
          <div class="mt-4 d-flex flex-column ga-2">
            <v-btn
              color="teal"
              variant="tonal"
              size="large"
              block
              prepend-icon="mdi-swap-horizontal"
              :loading="converting"
              :disabled="pendingCount === 0 && failedCount === 0"
              @click="convertAll"
            >
              {{ converting ? '转换中...' : '开始转换' }}
            </v-btn>

            <v-btn
              variant="outlined"
              block
              prepend-icon="mdi-download"
              :disabled="completedCount === 0"
              @click="downloadAll"
            >
              下载全部 ({{ completedCount }})
            </v-btn>

            <!-- 继续添加 -->
            <v-btn
              variant="text"
              block
              size="small"
              prepend-icon="mdi-plus"
              :disabled="converting"
              @click="$refs.fileInput?.click()"
            >
              继续添加图片
            </v-btn>
            <input
              ref="fileInput"
              type="file"
              :accept="supportedExtensions"
              multiple
              class="d-none"
              @change="onAddFiles"
            />
          </div>

          <!-- 批量进度 -->
          <div class="mt-4">
            <BatchProgress
              :total-files="totalFiles"
              :completed-count="completedCount"
              :failed-count="failedCount"
              :converting="converting"
              :current-file-name="currentFileName"
              :total-original-size="totalOriginalSize"
              :total-result-size="totalResultSize"
              :size-change-percent="sizeChangePercent"
            />
          </div>
        </v-col>

        <!-- 右侧：文件列表 -->
        <v-col cols="12" md="8">
          <FileListPanel
            :files="files"
            @remove="removeFile"
            @clear="clearFiles"
            @download="downloadSingle"
            @retry="convertSingle"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <!-- 预览弹窗 -->
    <ConvertPreview
      v-model="showPreview"
      :item="previewItem"
      :output-format="outputFormat"
    />

    <!-- 消息提示 -->
    <v-alert
      v-if="message"
      :type="messageType"
      :text="message"
      density="compact"
      class="ma-4"
      closable
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import FormatSettings from './FormatSettings.vue'
import FileListPanel from './FileListPanel.vue'
import BatchProgress from './BatchProgress.vue'
import ConvertPreview from './ConvertPreview.vue'
import { useImageConverter } from '../composables/useImageConverter.js'

const emit = defineEmits(['reset'])

const {
  files,
  outputFormat,
  quality,
  bgColor,
  converting,
  currentFileIndex,
  message,
  messageType,
  totalFiles,
  completedCount,
  failedCount,
  pendingCount,
  totalOriginalSize,
  totalResultSize,
  sizeChangePercent,
  supportedExtensions,
  addFiles,
  removeFile,
  clearFiles,
  convertSingle,
  convertAll,
  downloadSingle,
  downloadAll,
} = useImageConverter()

const fileInput = ref(null)
const showPreview = ref(false)
const previewItem = ref(null)

const currentFileName = computed(() => {
  if (currentFileIndex.value < 0 || currentFileIndex.value >= files.value.length) return ''
  return files.value[currentFileIndex.value].file.name
})

function onAddFiles(e) {
  const fileList = Array.from(e.target.files)
  if (fileList.length > 0) {
    addFiles(fileList)
  }
  e.target.value = ''
}
</script>

<style scoped>
.main-container {
  animation: fadeIn 0.3s ease-out;
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
</style>
