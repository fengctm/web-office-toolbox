<template>
  <v-card variant="outlined">
    <v-card-item>
      <v-card-title>导出选项</v-card-title>
    </v-card-item>

    <v-divider></v-divider>

    <v-card-text>
      <!-- Single download info -->
      <v-alert variant="tonal" color="info" class="mb-4">
        <template v-slot:prepend>
          <v-icon>mdi-information</v-icon>
        </template>
        <div class="text-caption">单个下载：点击预览区的图标可以单独下载</div>
      </v-alert>

      <!-- Batch download -->
      <v-btn
        @click="handleDownloadAll"
        :loading="isDownloading"
        :disabled="icons.length === 0"
        color="primary"
        size="large"
        block
        class="mb-4"
        prepend-icon="mdi-package-down"
      >
        打包下载全部图标 (ZIP)
      </v-btn>

      <!-- Progress -->
      <v-progress-linear
        v-if="isDownloading || exportProgress > 0"
        :model-value="exportProgress"
        color="primary"
        class="mb-2"
      ></v-progress-linear>

      <div v-if="isDownloading || exportProgress > 0" class="text-center text-caption text-grey-darken-1 mb-4">
        {{ exportProgress }}%
      </div>

      <!-- HTML Code -->
      <div v-if="hasHtmlCode" class="mb-4">
        <div class="d-flex justify-space-between align-center mb-2">
          <span class="text-subtitle-2">Favicon HTML 代码</span>
          <v-btn
            @click="copyHtmlCode"
            size="small"
            variant="outlined"
            prepend-icon="mdi-content-copy"
          >
            {{ copied ? '已复制!' : '复制' }}
          </v-btn>
        </div>
        <v-card variant="tonal" class="pa-3">
          <pre class="code-block"><code>{{ htmlCode }}</code></pre>
        </v-card>
      </div>

      <!-- Stats -->
      <v-divider class="mb-4"></v-divider>
      <v-row>
        <v-col cols="4">
          <v-card variant="tonal" class="text-center pa-2">
            <div class="text-h4 text-primary">{{ iconCount }}</div>
            <div class="text-caption">图标总数</div>
          </v-card>
        </v-col>
        <v-col cols="4">
          <v-card variant="tonal" class="text-center pa-2">
            <div class="text-h4 text-primary">{{ formatCount }}</div>
            <div class="text-caption">格式数量</div>
          </v-card>
        </v-col>
        <v-col cols="4">
          <v-card variant="tonal" class="text-center pa-2">
            <div class="text-h6 text-primary">{{ estimatedSize }}</div>
            <div class="text-caption">预计大小</div>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useIconExport } from '../composables/useIconExport'

const props = defineProps({
  icons: {
    type: Array,
    default: () => []
  },
  originalFileName: {
    type: String,
    default: 'icon'
  }
})

const { isExporting, exportProgress, downloadAllIcons, generateFaviconHtml } = useIconExport()

const isDownloading = ref(false)
const copied = ref(false)

// Statistics
const iconCount = computed(() => props.icons.length)
const formatCount = computed(() => {
  const formats = new Set(props.icons.map(i => i.format))
  return formats.size
})
const estimatedSize = computed(() => {
  // Rough estimate: average 10KB per icon
  const sizeInBytes = props.icons.length * 10 * 1024
  if (sizeInBytes < 1024) return `${sizeInBytes} B`
  if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`
  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
})

// Has HTML code (only show if favicon-related icons are generated)
const hasHtmlCode = computed(() => {
  return props.icons.some(i => i.format === 'ico' || i.format === 'png' || i.format === 'svg')
})

// HTML code
const htmlCode = computed(() => {
  return generateFaviconHtml(props.icons)
})

// Download all as ZIP
async function handleDownloadAll() {
  if (props.icons.length === 0) return

  isDownloading.value = true
  try {
    // 使用带格式的文件名
    const zipFileName = `${props.originalFileName}【转图标】`
    await downloadAllIcons(props.icons, zipFileName)
  } finally {
    isDownloading.value = false
  }
}

// Copy HTML code
function copyHtmlCode() {
  navigator.clipboard.writeText(htmlCode.value).then(() => {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  })
}
</script>

<style scoped>
.code-block {
  margin: 0;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 11px;
  line-height: 1.5;
  overflow-x: auto;
}

.code-block code {
  color: rgb(var(--v-theme-on-surface));
}
</style>
