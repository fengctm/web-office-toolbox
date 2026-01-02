<template>
  <div class="upload-zone d-flex flex-column align-center justify-center flex-grow-1">
    <v-hover v-slot="{ isHovering, props }">
      <v-card
        v-bind="props"
        :elevation="isHovering ? 8 : 2"
        class="upload-card d-flex flex-column align-center justify-center pa-10 cursor-pointer"
        @click="triggerFileInput"
      >
        <v-icon size="80" :color="isHovering ? 'teal' : 'grey-lighten-1'" class="transition-swing">
          mdi-file-pdf-box
        </v-icon>
        <div class="text-h6 mt-4">点击或拖拽 PDF 文件到此处</div>
        <div class="text-caption text-grey mt-2">支持无加密、未损坏的 PDF 文档</div>
        <v-btn color="teal" class="mt-6" variant="elevated">选择文件</v-btn>
      </v-card>
    </v-hover>
    <input
      type="file"
      ref="fileInput"
      hidden
      accept="application/pdf"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { PDFProcessor } from '../utils/pdf-processor.js'

const emit = defineEmits(['file-uploaded', 'error'])
const fileInput = ref(null)

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    // 使用 pdf-processor 校验
    const isValid = await PDFProcessor.validatePDF(file)
    if (isValid) {
      emit('file-uploaded', file)
    }
  } catch (error) {
    emit('error', error.message)
  }
}
</script>

<style scoped>
.upload-zone {
  min-height: 400px;
}

.upload-card {
  border: 2px dashed #ccc;
  border-radius: 20px;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.upload-card:hover {
  border-color: #009688;
  transform: translateY(-5px);
}
</style>
