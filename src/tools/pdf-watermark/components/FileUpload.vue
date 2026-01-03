<template>
  <div class="file-upload-section">
    <!-- 未上传状态 -->
    <div v-if="!pdfFile" class="upload-area">
      <v-hover v-slot="{ isHovering, props }">
        <v-card
            v-bind="props"
            :elevation="isHovering ? 8 : 2"
            class="upload-card pa-10 text-center"
            @click="triggerUpload"
        >
          <v-icon
              size="80"
              color="teal-lighten-2"
              :class="{'pulse': isHovering}"
          >
            mdi-cloud-upload
          </v-icon>
          <h2 class="mt-4 text-h5">点击或拖拽 PDF 文件</h2>
          <p class="text-grey mt-2">完全本地处理，保护您的隐私</p>
          <input
              type="file"
              ref="fileInput"
              hidden
              accept="application/pdf"
              @change="onFileChange"
          >
        </v-card>
      </v-hover>
    </div>

    <!-- 文件已上传状态 -->
    <div v-else class="file-info">
      <v-alert
          type="info"
          variant="tonal"
          color="teal"
          icon="mdi-file-pdf-box"
          title="PDF 已加载"
      >
        <div class="d-flex align-center justify-space-between mt-2">
          <span>{{ pdfFile.name }} ({{ formatFileSize(pdfFile.size) }})</span>
          <v-btn
              size="small"
              color="error"
              variant="outlined"
              prepend-icon="mdi-close"
              @click="resetFile"
          >
            移除文件
          </v-btn>
        </div>
      </v-alert>
    </div>

    <!-- 密码对话框 -->
    <v-dialog v-model="showPasswordDialog" max-width="400" persistent>
      <v-card class="rounded-xl pa-4">
        <v-card-title>文档已加密</v-card-title>
        <v-card-text>
          该 PDF 文件受密码保护，请输入密码以继续。
          <v-text-field
              v-model="password"
              label="访问密码"
              type="password"
              variant="outlined"
              class="mt-4"
              color="teal"
              autofocus
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="cancelPassword">取消</v-btn>
          <v-btn color="teal" variant="flat" @click="submitPassword">确认</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import {ref} from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import {formatFileSize} from '../utils/helpers'

// 配置pdfjs worker（使用匹配的版本）
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
}

const emit = defineEmits([
  'file-loaded',
  'password-required',
  'password-submitted',
  'error',
  'reset'
])

const props = defineProps({
  pdfFile: {
    type: Object,
    default: null
  }
})

const fileInput = ref(null)
const showPasswordDialog = ref(false)
const password = ref('')

// 触发文件选择
const triggerUpload = () => {
  fileInput.value.click()
}

// 文件选择变化
const onFileChange = (e) => {
  const file = e.target.files[0]
  if (!file) return

  if (file.type !== 'application/pdf') {
    emit('error', '请选择 PDF 文件')
    return
  }

  emit('file-loaded', file)
}

// 重置文件
const resetFile = () => {
  emit('reset')
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 显示密码输入框
const showPasswordInput = () => {
  showPasswordDialog.value = true
}

// 提交密码
const submitPassword = () => {
  if (password.value) {
    const cleanPassword = password.value.trim() // 去除前后空格
    emit('password-submitted', cleanPassword)
    showPasswordDialog.value = false
    // 不清空密码，让父组件可以保存和使用
  }
}

// 取消密码输入
const cancelPassword = () => {
  showPasswordDialog.value = false
  password.value = ''
  emit('reset')
}

// 暴露方法给父组件
defineExpose({
  showPasswordInput,
  triggerUpload,
  password  // 暴露密码，让父组件可以访问
})
</script>

<style scoped>
.file-upload-section {
  width: 100%;
}

.upload-area {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.upload-card {
  width: 90%;
  max-width: 500px;
  border: 2px dashed;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  background: white;
  color: #333333;
  border-color: #009688;
}

.upload-card:hover {
  background-color: #e0f2f1;
  transform: translateY(-5px);
  border-width: 3px;
}

/* 深色模式适配 */
:root[data-theme="dark"] .upload-card {
  background: #1e1e1e !important;
  color: #e0e0e0 !important;
  border-color: #4dd0e1 !important;
}

:root[data-theme="dark"] .upload-card:hover {
  background-color: #263238 !important;
  border-color: #4dd0e1 !important;
}

/* 图标颜色 - 深色模式适配 */
:root[data-theme="dark"] .upload-card .v-icon {
  color: #4dd0e1 !important;
}

/* 标题文字 - 深色模式适配 */
:root[data-theme="dark"] .upload-card h2 {
  color: #e0e0e0 !important;
  font-weight: 600;
}

/* 描述文字 - 深色模式适配 */
:root[data-theme="dark"] .upload-card p {
  color: #9e9e9e !important;
}

/* 深色模式下的文件信息警告框 */
:root[data-theme="dark"] .file-info .v-alert {
  background-color: rgba(77, 208, 225, 0.08) !important;
  border-color: rgba(77, 208, 225, 0.4) !important;
  color: #e0e0e0 !important;
}

:root[data-theme="dark"] .file-info .v-alert .v-alert__content {
  color: #e0e0e0 !important;
}

/* 深色模式下的密码对话框 */
:root[data-theme="dark"] .v-card {
  background-color: #1e1e1e !important;
  color: #e0e0e0 !important;
}

:root[data-theme="dark"] .v-card .v-card-title {
  color: #ffffff !important;
}

:root[data-theme="dark"] .v-card .v-card-text {
  color: #e0e0e0 !important;
}

/* 深色模式下的输入框 */
:root[data-theme="dark"] .v-text-field .v-field__input {
  color: #e0e0e0 !important;
}

:root[data-theme="dark"] .v-text-field .v-field__label {
  color: #9e9e9e !important;
}

/* 深色模式下的按钮 */
:root[data-theme="dark"] .v-btn {
  color: #e0e0e0 !important;
}

/* 悬停时的图标动画 */
.upload-card:hover .v-icon {
  transform: scale(1.1);
  transition: transform 0.3s ease;
}

.pulse {
  animation: pulse-animation 2s infinite;
}

@keyframes pulse-animation {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.file-info {
  width: 100%;
}

/* 文件信息卡片深色适配 */
:root[data-theme="dark"] .file-info .v-alert {
  background-color: rgba(77, 208, 225, 0.05) !important;
  border-color: rgba(77, 208, 225, 0.3) !important;
}

:root[data-theme="dark"] .file-info .v-alert .v-alert__content {
  color: #e0e0e0 !important;
}
</style>
