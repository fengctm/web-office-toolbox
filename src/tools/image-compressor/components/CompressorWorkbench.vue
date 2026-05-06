<template>
  <div class="workbench">
    <StatusHeader
        :file-name="originalFile?.name || ''"
        :original-size="formatSize(originalFile?.size)"
        :result-size="result ? formatSize(result.blob.size) : ''"
        :compression-ratio="compressionRatio"
        :compressing="compressing"
        :progress-text="progressText"
        :has-result="!!result"
        @download="handleDownload"
        @reset="$emit('reset')"
    />

    <CompareViewer
        :original-url="originalUrl"
        :result-url="resultUrl"
        :original-size="formatSize(originalFile?.size)"
        :result-size="result ? formatSize(result.blob.size) : ''"
        :result-dimensions="result ? `${result.width} × ${result.height} px` : ''"
        :compressing="compressing"
        :has-result="!!result"
    />

    <ControlBoard
        :mode="mode"
        :quality="quality"
        :target-size="targetSize"
        :max-dimension="maxDimension"
        :output-format="outputFormat"
        :format-options="formatOptions"
        :compressing="compressing"
        @update:mode="handleModeChange"
        @update:quality="handleQualityChange"
        @update:target-size="targetSize = $event"
        @update:max-dimension="maxDimension = $event"
        @update:output-format="outputFormat = $event"
        @compress="handleTargetCompress"
    />

    <NotificationSnackbar
        v-model="snackbar.show"
        :message="snackbar.message"
        :color="snackbar.color"
    />
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import StatusHeader from './StatusHeader.vue'
import CompareViewer from './CompareViewer.vue'
import ControlBoard from './ControlBoard.vue'
import NotificationSnackbar from '@/components/NotificationSnackbar.vue'
import { useImageCompressor } from '../composables/useImageCompressor.js'

const props = defineProps({
  originalFile: { type: [File, Object], default: null }
})

defineEmits(['reset'])

const {
  originalUrl, result, resultUrl,
  compressing, progressText, compressionRatio,
  compressByQuality, compressToTargetSize,
  setFile, download
} = useImageCompressor()

const mode = ref('quality')
const quality = ref(0.8)
const targetSize = ref(200)
const maxDimension = ref(0)
const outputFormat = ref('image/jpeg')

const formatOptions = [
  { title: 'JPEG', value: 'image/jpeg' },
  { title: 'PNG', value: 'image/png' },
  { title: 'WEBP', value: 'image/webp' }
]

const snackbar = reactive({
  show: false,
  message: '',
  color: 'info'
})

function formatSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function showSnackbar(msg, color = 'info') {
  snackbar.show = true
  snackbar.message = msg
  snackbar.color = color
}

let debounceTimer = null

function handleQualityChange(val) {
  quality.value = val
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    try {
      await compressByQuality(val, maxDimension.value, outputFormat.value)
    } catch (err) {
      showSnackbar(err.message || '压缩失败', 'error')
    }
  }, 300)
}

function handleModeChange(newMode) {
  mode.value = newMode
}

async function handleTargetCompress() {
  try {
    await compressToTargetSize(targetSize.value, {
      maxDim: maxDimension.value,
      format: outputFormat.value,
      maxIterations: 10
    })
    showSnackbar('压缩完成', 'success')
  } catch (err) {
    showSnackbar(err.message || '压缩失败', 'error')
  }
}

function handleDownload() {
  const name = props.originalFile
      ? props.originalFile.name.replace(/\.[^.]+$/, '') + '_compressed'
      : 'compressed'
  download(name)
}

watch(() => props.originalFile, (file) => {
  if (file) setFile(file)
}, { immediate: true })
</script>

<style scoped>
.workbench {
  width: 100%;
  padding: 16px;
}
</style>
