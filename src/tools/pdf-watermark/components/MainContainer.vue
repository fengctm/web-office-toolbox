<template>
  <v-card class="pdf-watermark-tool elevation-4" min-height="600">
    <!-- 头部工具栏 -->
    <v-toolbar color="teal" dark flat>
      <v-icon start class="ml-4">mdi-watermark</v-icon>
      <v-toolbar-title class="font-weight-bold">PDF 在线添加水印</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="resetTool">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </v-toolbar>

    <v-container fluid class="pa-0">
      <v-row no-gutters>
        <!-- 左侧：预览区域 -->
        <v-col cols="12" md="8" class="preview-container bg-grey-lighten-3 d-flex flex-column">
          <FileUpload
            v-if="!fileUploaded"
            @file-uploaded="handleFileUploaded"
            @error="handleError"
          />
          <WatermarkPreview
            v-else
            :file="file"
            :settings="settings"
          />
        </v-col>

        <!-- 右侧：控制面板 -->
        <v-col cols="12" md="4" class="control-panel bg-white">
          <SettingsPanel v-model:settings="settings" />
          <ControlActions
            :file-uploaded="fileUploaded"
            :processing="processing"
            @process="handleProcessAndDownload"
            @reset="resetTool"
          />
        </v-col>
      </v-row>
    </v-container>

    <!-- 使用通用通知组件 -->
    <NotificationSnackbar
      v-model="snackbar.show"
      :message="snackbar.text"
      :color="snackbar.color"
    />
  </v-card>
</template>

<script setup>
import { ref, reactive } from 'vue'
import FileUpload from './FileUpload.vue'
import WatermarkPreview from './WatermarkPreview.vue'
import SettingsPanel from './SettingsPanel.vue'
import ControlActions from './ControlActions.vue'
import NotificationSnackbar from '@/components/NotificationSnackbar.vue'
import { PDFProcessor } from '../utils/pdf-processor.js'

const file = ref(null)
const fileUploaded = ref(false)
const processing = ref(false)

const settings = reactive({
  text: 'Web Office Toolbox',
  color: '#009688',
  opacity: 0.3,
  fontSize: 24,
  rotation: -45,
  density: 6,
  offset: 0
})

const snackbar = reactive({ show: false, text: '', color: 'success' })

const handleFileUploaded = (uploadedFile) => {
  file.value = uploadedFile
  fileUploaded.value = true
  showSnackbar('文件解析成功', 'success')
}

const handleError = (message) => {
  showSnackbar(message, 'error')
}

const handleProcessAndDownload = async () => {
  if (!file.value) return

  processing.value = true
  try {
    const blob = await PDFProcessor.generateWatermarkPDF(file.value, settings)
    const fileName = file.value.name.replace('.pdf', '') + '_水印版.pdf'
    await PDFProcessor.downloadPDF(blob, fileName)
    showSnackbar('处理成功！文件已准备下载', 'success')
  } catch (error) {
    showSnackbar('处理失败: ' + error.message, 'error')
  } finally {
    processing.value = false
  }
}

const resetTool = () => {
  file.value = null
  fileUploaded.value = false
  processing.value = false
}

const showSnackbar = (text, color) => {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}
</script>

<style scoped>
.pdf-watermark-tool {
  border-radius: 16px;
  overflow: hidden;
}

.preview-container {
  min-height: 500px;
  position: relative;
  overflow: hidden;
}

.control-panel {
  border-left: 1px solid #e0e0e0;
}

@media (max-width: 960px) {
  .control-panel {
    border-left: none;
    border-top: 1px solid #e0e0e0;
  }
}
</style>
