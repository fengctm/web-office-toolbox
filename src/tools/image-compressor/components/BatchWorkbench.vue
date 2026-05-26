<template>
  <div class="batch-workbench">
    <!-- 标题栏 -->
    <div class="d-flex align-center pa-4 border-b">
      <v-icon color="teal" class="mr-2">mdi-image-multiple-minus</v-icon>
      <div class="flex-grow-1">
        <div class="text-subtitle-1 font-weight-medium">批量压缩</div>
        <div class="text-caption text-medium-emphasis">
          统一设置，一键压缩多张图片
        </div>
      </div>
      <v-btn
        color="grey"
        variant="text"
        size="small"
        prepend-icon="mdi-refresh"
        @click="$emit('reset')"
      >
        重新开始
      </v-btn>
    </div>

    <v-row no-gutters class="pa-4">
      <!-- 左侧：设置面板 -->
      <v-col cols="12" md="4" class="pr-md-4 mb-4 mb-md-0">
        <ControlBoard
          :mode="mode"
          :quality="quality"
          :target-size="targetSize"
          :max-dimension="maxDimension"
          :output-format="outputFormat"
          :format-options="formatOptions"
          :compressing="compressing"
          @update:mode="mode = $event"
          @update:quality="quality = $event"
          @update:target-size="targetSize = $event"
          @update:max-dimension="maxDimension = $event"
          @update:output-format="outputFormat = $event"
          @compress="handleCompressAll"
        />

        <!-- 操作按钮 -->
        <div class="d-flex flex-column ga-2 mt-4">
          <v-btn
            color="teal"
            variant="flat"
            :loading="compressing"
            :disabled="compressing || pendingCount === 0"
            prepend-icon="mdi-play"
            @click="handleCompressAll"
          >
            开始压缩
            <template v-if="pendingCount > 0">({{ pendingCount }} 张)</template>
          </v-btn>

          <v-btn
            v-if="completedCount > 0"
            color="teal"
            variant="tonal"
            prepend-icon="mdi-download"
            @click="handleDownloadAll"
          >
            下载全部 ({{ completedCount }})
          </v-btn>

          <v-btn
            variant="outlined"
            size="small"
            prepend-icon="mdi-plus"
            :disabled="compressing"
            @click="triggerAddFiles"
          >
            继续添加图片
          </v-btn>
        </div>

        <!-- 进度条 -->
        <BatchProgressBar
          class="mt-4"
          :total-files="totalFiles"
          :completed-count="completedCount"
          :failed-count="failedCount"
          :compressing="compressing"
          :current-file-name="currentFileName"
          :total-original-size="totalOriginalSize"
          :total-result-size="totalResultSize"
          :size-change-percent="sizeChangePercent"
        />
      </v-col>

      <!-- 右侧：文件列表 -->
      <v-col cols="12" md="8">
        <BatchFileList
          :files="batchFiles"
          @remove="handleRemove"
          @clear="handleClear"
          @download="handleDownloadSingle"
          @retry="handleRetry"
        />
      </v-col>
    </v-row>

    <!-- 隐藏文件输入 -->
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/jpeg,image/png,image/webp"
      style="display: none;"
      @change="handleAddFiles"
    />

    <NotificationSnackbar
      v-model="snackbar.show"
      :message="snackbar.message"
      :color="snackbar.color"
    />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import ControlBoard from './ControlBoard.vue'
import BatchProgressBar from './BatchProgressBar.vue'
import BatchFileList from './BatchFileList.vue'
import NotificationSnackbar from '@/components/NotificationSnackbar.vue'
import { useBatchCompressor } from '../composables/useBatchCompressor.js'

defineEmits(['reset'])

const {
  batchFiles,
  compressing,
  currentFileName,
  totalFiles,
  completedCount,
  failedCount,
  pendingCount,
  totalOriginalSize,
  totalResultSize,
  sizeChangePercent,
  addFiles,
  removeFile,
  clearFiles,
  compressSingle,
  compressAll,
  downloadSingle,
  downloadAll,
  showMessage,
} = useBatchCompressor()

// 压缩设置
const mode = ref('quality')
const quality = ref(0.8)
const targetSize = ref(200)
const maxDimension = ref(0)
const outputFormat = ref('image/jpeg')

const formatOptions = [
  { title: 'JPEG', value: 'image/jpeg' },
  { title: 'PNG', value: 'image/png' },
  { title: 'WEBP', value: 'image/webp' },
]

const snackbar = reactive({
  show: false,
  message: '',
  color: 'info',
})

function showSnackbar(msg, color = 'info') {
  snackbar.show = true
  snackbar.message = msg
  snackbar.color = color
}

function getSettings() {
  return {
    mode: mode.value,
    quality: quality.value,
    targetSize: Number(targetSize.value),
    maxDim: Number(maxDimension.value),
    format: outputFormat.value,
  }
}

async function handleCompressAll() {
  try {
    await compressAll(getSettings())
  } catch (err) {
    showSnackbar(err.message || '批量压缩出错', 'error')
  }
}

async function handleRetry(id) {
  try {
    await compressSingle(id, getSettings())
  } catch (err) {
    showSnackbar(err.message || '重试失败', 'error')
  }
}

function handleDownloadSingle(id) {
  downloadSingle(id)
}

async function handleDownloadAll() {
  try {
    await downloadAll()
  } catch (err) {
    showSnackbar(err.message || '下载失败', 'error')
  }
}

function handleRemove(id) {
  removeFile(id)
}

function handleClear() {
  clearFiles()
}

// 继续添加图片
const fileInput = ref(null)

function triggerAddFiles() {
  fileInput.value?.click()
}

function handleAddFiles(event) {
  const fileList = event.target.files
  if (fileList && fileList.length > 0) {
    addFiles(Array.from(fileList))
    showMessage(`已添加 ${fileList.length} 张图片`, 'success')
  }
  // 重置 input 以允许再次选择相同文件
  event.target.value = ''
}
</script>

<style scoped>
.batch-workbench {
  width: 100%;
}

.border-b {
  border-bottom: 1px solid rgb(var(--v-border-color));
}
</style>
