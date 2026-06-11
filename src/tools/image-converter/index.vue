<template>
  <v-card class="image-converter" elevation="2" rounded="lg">
    <!-- 空状态：文件上传区域 -->
    <template v-if="files.length === 0">
      <v-card-item>
        <v-card-title class="d-flex align-center">
          <v-icon color="teal" class="mr-2">mdi-image-sync</v-icon>
          图片格式转换
        </v-card-title>
        <v-card-subtitle>
          纯前端图片格式转换，支持几乎所有常见格式转为 JPEG / PNG / WebP
        </v-card-subtitle>
      </v-card-item>

      <v-card-text>
        <ImageUploader
          :multiple="true"
          :drag-enabled="true"
          :accept-formats="acceptFormats"
          upload-text="选择要转换的图片"
          upload-subtext="支持 PNG, JPG, WebP, BMP, GIF, TIFF, ICO 等格式"
          button-text="选择图片"
          added-text="已添加 {count} 张图片"
          @files-selected="handleFilesSelected"
          @file-error="handleError"
        />
      </v-card-text>
    </template>

    <!-- 有文件：显示工作区 -->
    <MainContainer
      v-else
      @reset="resetTool"
    />
  </v-card>
</template>

<script setup>
import { ref } from 'vue'
import ImageUploader from '@/components/ImageUploader.vue'
import MainContainer from './components/MainContainer.vue'
import { useImageConverter } from './composables/useImageConverter.js'

const {
  files,
  addFiles,
  reset,
} = useImageConverter()

const acceptFormats = ref([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/bmp',
  'image/gif',
  'image/tiff',
  'image/x-icon',
])

function handleFilesSelected(fileList) {
  if (fileList && fileList.length > 0) {
    addFiles(fileList)
  }
}

function handleError(err) {
  console.error('文件选择错误:', err)
}

function resetTool() {
  reset()
}
</script>

<style scoped>
.image-converter {
  border-radius: 12px;
  overflow: hidden;
}
</style>
