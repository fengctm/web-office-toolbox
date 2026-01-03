<template>
  <div class="file-upload-wrapper">
    <transition name="view-switch" mode="out-in">

      <!-- 模式 A：密码解锁界面 (Apple Security Style) -->
      <div v-if="pdfFile && isLocked" :key="'locked'" class="view-container">
        <v-card class="unlock-card" elevation="10">
          <div class="security-badge">
            <v-icon size="32" color="teal">mdi-shield-key-outline</v-icon>
          </div>

          <div class="text-center mb-6">
            <h3 class="text-h5 font-weight-bold mb-1">私密文档</h3>
            <p class="text-body-2 text-grey">请输入访问密码以解锁内容</p>
          </div>

          <div class="file-snippet mb-6">
            <v-icon color="teal-lighten-2" class="mr-2">mdi-file-pdf-box</v-icon>
            <span class="text-truncate font-weight-medium">{{ pdfFile.name }}</span>
          </div>

          <v-text-field
              v-model="password"
              label="访问密码"
              type="password"
              variant="solo-filled"
              flat
              density="comfortable"
              color="teal"
              class="password-input mb-4"
              rounded="lg"
              autofocus
              persistent-placeholder
              placeholder="••••••••"
              @keyup.enter="submitPassword"
          >
            <template v-slot:append-inner>
              <v-icon color="teal-lighten-3">mdi-lock-outline</v-icon>
            </template>
          </v-text-field>

          <div class="action-row">
            <v-btn
                variant="text"
                color="grey-darken-1"
                rounded="pill"
                class="flex-grow-1"
                @click="cancelPassword"
            >
              取消
            </v-btn>
            <v-btn
                color="teal"
                variant="elevated"
                rounded="pill"
                class="flex-grow-1 unlock-btn"
                :loading="isChecking"
                @click="submitPassword"
            >
              验证并解锁
            </v-btn>
          </div>
        </v-card>
      </div>

      <!-- 模式 B：初始上传界面 (Google Material Design) -->
      <div v-else-if="!pdfFile" :key="'upload'" class="view-container">
        <v-hover v-slot="{ isHovering, props }">
          <v-card
              v-bind="props"
              class="upload-drop-zone"
              :class="{ 'is-active': isHovering }"
              @click="triggerUpload"
          >
            <div class="pulse-container">
              <v-icon size="64" color="teal-lighten-2">mdi-cloud-upload-outline</v-icon>
            </div>
            <h2 class="text-h6 font-weight-bold mt-4">导入 PDF 文件</h2>
            <p class="text-caption text-grey-darken-1">点击此处或拖拽文件到这里</p>
            <div class="security-note mt-6">
              <v-icon size="14" class="mr-1">mdi-shield-check</v-icon>
              <span>100% 本地解析，确保隐私安全</span>
            </div>
            <input type="file" ref="fileInput" hidden accept="application/pdf" @change="onFileChange">
          </v-card>
        </v-hover>
      </div>

      <!-- 模式 C：文件已就绪状态 -->
      <div v-else :key="'ready'" class="view-container">
        <v-card variant="flat" border class="ready-card pa-6">
          <v-icon size="48" color="teal" class="mb-2">mdi-check-circle-outline</v-icon>
          <div class="text-h6 font-weight-bold">{{ pdfFile.name }}</div>
          <div class="text-caption text-grey mb-4">{{ formatFileSize(pdfFile.size) }}</div>
          <v-btn
              variant="outlined"
              color="error"
              prepend-icon="mdi-delete-sweep"
              rounded="pill"
              @click="resetFile"
          >
            更换文件
          </v-btn>
        </v-card>
      </div>

    </transition>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { formatFileSize } from '../utils/helpers'

const emit = defineEmits(['file-loaded', 'password-submitted', 'error', 'reset'])

const props = defineProps({
  pdfFile: { type: Object, default: null },
  isLocked: { type: Boolean, default: false },
  isChecking: { type: Boolean, default: false }
})

const fileInput = ref(null)
const password = ref('')

watch(() => props.pdfFile, (newFile) => {
  if (newFile) password.value = ''
})

const triggerUpload = () => fileInput.value.click()

const onFileChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (file.type !== 'application/pdf') {
    emit('error', '请选择 PDF 文件')
    return
  }
  emit('file-loaded', file)
}

const submitPassword = () => {
  if (!password.value) return
  emit('password-submitted', password.value.trim())
}

const cancelPassword = () => {
  password.value = ''
  emit('reset')
}

const resetFile = () => {
  password.value = ''
  emit('reset')
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<style scoped lang="scss">
.file-upload-wrapper {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.view-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 380px;
}

/* --- 解锁卡片 (Apple Style) --- */
.unlock-card {
  width: 100%;
  padding: 32px;
  border-radius: 32px !important;
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  text-align: center;
  position: relative;

  .security-badge {
    width: 64px;
    height: 64px;
    background: #e0f2f1;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
  }

  .file-snippet {
    background: rgba(0, 150, 136, 0.05);
    padding: 8px 16px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    font-size: 0.85rem;
  }

  .action-row {
    display: flex;
    gap: 12px;
  }
}

/* --- 上传区域 (Material Style) --- */
.upload-drop-zone {
  width: 100%;
  height: 320px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 32px !important;
  border: 2px dashed #b2dfdb !important;
  background: #fdfdfd !important;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &.is-active {
    border-color: #009688 !important;
    background: #e0f2f1 !important;
    transform: scale(1.02);
  }

  .pulse-container {
    animation: pulse 2s infinite;
  }

  .security-note {
    font-size: 11px;
    color: #999;
    display: flex;
    align-items: center;
    background: #f5f5f5;
    padding: 4px 12px;
    border-radius: 20px;
  }
}

.ready-card {
  width: 100%;
  border-radius: 32px !important;
  text-align: center;
  background: white !important;
}

/* --- 动画 --- */
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}

.view-switch-enter-active, .view-switch-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.view-switch-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.view-switch-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

/* --- 深色模式 --- */
:root[data-theme="dark"] {
  .unlock-card {
    background: rgba(30, 30, 30, 0.7) !important;
    border-color: rgba(255, 255, 255, 0.1);

    .security-badge { background: #263238; }
    .file-snippet { background: rgba(77, 208, 225, 0.1); }
  }

  .upload-drop-zone {
    background: #1e1e1e !important;
    border-color: #333 !important;
    &.is-active {
      background: #263238 !important;
      border-color: #4dd0e1 !important;
    }
    .security-note { background: #2d2d2d; color: #666; }
  }

  .ready-card { background: #1e1e1e !important; border-color: #333 !important; }
}
</style>