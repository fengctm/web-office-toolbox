<template>
  <v-card class="image-compressor" elevation="2" rounded="lg">
    <v-card-item v-if="!selectedFile">
      <v-card-title class="d-flex align-center">
        <v-icon color="teal" class="mr-2">mdi-image-minus</v-icon>
        图片压缩工具
      </v-card-title>
      <v-card-subtitle>
        压缩图片文件大小，支持多种格式
      </v-card-subtitle>
    </v-card-item>

    <v-card-text v-if="!selectedFile">
      <ImageUploader
          :multiple="false"
          :drag-enabled="true"
          upload-text="选择要压缩的图片"
          upload-subtext="支持 JPG, PNG, WEBP"
          button-text="选择图片"
          @files-selected="handleFilesSelected"
          @file-error="handleError"
      />
    </v-card-text>

    <CompressorWorkbench
        v-else
        :original-file="selectedFile"
        @reset="resetTool"
    />
  </v-card>
</template>

<script setup>
import { ref } from 'vue'
import ImageUploader from '@/components/ImageUploader.vue'
import CompressorWorkbench from './components/CompressorWorkbench.vue'
import { useImageCompressor } from './composables/useImageCompressor.js'

const { setFile, reset } = useImageCompressor()

const selectedFile = ref(null)

function handleFilesSelected(files) {
  if (files && files.length > 0) {
    selectedFile.value = files[0]
    setFile(files[0])
  }
}

function handleError(err) {
  console.error(err)
}

function resetTool() {
  reset()
  selectedFile.value = null
}
</script>

<style scoped>
.image-compressor {
  border-radius: 12px;
  overflow: hidden;
}
</style>
