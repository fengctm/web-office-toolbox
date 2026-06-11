<template>
  <v-card class="image-compressor" elevation="2" rounded="lg">
    <!-- 空状态：上传区域 -->
    <template v-if="isEmpty">
      <v-card-item>
        <v-card-title class="d-flex align-center">
          <v-icon color="teal" class="mr-2">mdi-image-minus</v-icon>
          图片压缩工具
        </v-card-title>
        <v-card-subtitle>
          压缩图片文件大小，支持多种格式
        </v-card-subtitle>
      </v-card-item>

      <v-card-text>
        <div class="d-flex justify-center mb-4">
          <v-btn-toggle
            v-model="mode"
            mandatory
            color="teal"
            variant="outlined"
            density="comfortable"
            divided
          >
            <v-btn value="single" size="small">单图压缩</v-btn>
            <v-btn value="batch" size="small">批量压缩</v-btn>
          </v-btn-toggle>
        </div>

        <ImageUploader
          :multiple="mode === 'batch'"
          :drag-enabled="true"
          :upload-text="mode === 'batch' ? '选择要批量压缩的图片' : '选择要压缩的图片'"
          :upload-subtext="mode === 'batch' ? '可一次选择多张图片，支持 JPG, PNG, WEBP' : '支持 JPG, PNG, WEBP'"
          :button-text="mode === 'batch' ? '选择图片（可多选）' : '选择图片'"
          :added-text="mode === 'batch' ? '已添加 {count} 张图片' : undefined"
          @files-selected="handleFilesSelected"
          @file-error="handleError"
        />
      </v-card-text>
    </template>

    <!-- 单图模式 -->
    <CompressorWorkbench
      v-else-if="mode === 'single' && selectedFile"
      :original-file="selectedFile"
      @reset="resetSingle"
    />

    <!-- 批量模式 -->
    <BatchWorkbench
      v-else-if="mode === 'batch'"
      @reset="resetBatch"
    />
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import ImageUploader from '@/components/ImageUploader.vue'
import CompressorWorkbench from './components/CompressorWorkbench.vue'
import BatchWorkbench from './components/BatchWorkbench.vue'
import { useImageCompressor } from './composables/useImageCompressor.js'
import { useBatchCompressor } from './composables/useBatchCompressor.js'

const { setFile, reset: resetSingleCompressor } = useImageCompressor()
const { addFiles, reset: resetBatchCompressor, batchFiles } = useBatchCompressor()

const mode = ref('single')
const selectedFile = ref(null)

const isEmpty = computed(() => {
  if (mode.value === 'single') return !selectedFile.value
  return batchFiles.value.length === 0
})

function handleFilesSelected(files) {
  if (!files || files.length === 0) return

  if (mode.value === 'single') {
    selectedFile.value = files[0]
    setFile(files[0])
  } else {
    addFiles(files)
  }
}

function handleError(err) {
  console.error(err)
}

function resetSingle() {
  resetSingleCompressor()
  selectedFile.value = null
}

function resetBatch() {
  resetBatchCompressor()
}
</script>

<style scoped>
.image-compressor {
  border-radius: 12px;
  overflow: hidden;
}
</style>
