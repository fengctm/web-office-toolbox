<template>
  <div class="pdf-secure-selector">
    <transition name="apple-switch" mode="out-in">

      <!-- 1. 上传区域 -->
      <div v-if="!state.file" :key="'upload'" class="view-container">
        <v-hover v-slot="{ isHovering, props }">
          <v-card
              v-bind="props"
              class="drop-zone-card apple-glass"
              :class="{ 'is-hovering': isHovering }"
              @click="triggerFileSelect"
          >
            <div class="icon-orb">
              <v-icon size="42" color="teal">mdi-file-pdf-box</v-icon>
            </div>
            <div class="text-h6 font-weight-bold mt-6 text-center px-4">{{ label }}</div>
            <p class="text-caption text-medium-emphasis mt-2">支持加密文档 · 100% 本地解析</p>
            <input type="file" ref="fileInput" hidden accept="application/pdf" @change="handleFileChange">
          </v-card>
        </v-hover>
      </div>

      <!-- 2. 解锁区域 -->
      <div v-else-if="state.isLocked" :key="'unlock'" class="view-container">
        <v-card
            class="unlock-glass-card apple-glass"
            :class="{ 'shake-error': state.isShaking }"
        >
          <div class="lock-header">
            <div class="lock-icon-wrapper">
              <v-icon :color="state.error ? 'error' : 'teal'" size="32">
                {{ state.error ? 'mdi-lock-alert' : 'mdi-lock-outline' }}
              </v-icon>
            </div>
          </div>

          <div class="doc-info text-center mb-8">
            <div class="text-h6 font-weight-bold text-truncate px-6">{{ state.file.name }}</div>
            <div class="text-caption text-teal font-weight-bold text-uppercase tracking-widest mt-1">
              Encrypted Document
            </div>
          </div>

          <!-- 修复宽度：添加 class="apple-input" 并在 CSS 中强制 width: 100% -->
          <v-text-field
              v-model="state.password"
              :label="state.error || '输入文档密码'"
              :type="state.showPassword ? 'text' : 'password'"
              variant="solo"
              flat
              class="apple-input mb-4"
              :append-inner-icon="state.showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="state.showPassword = !state.showPassword"
              @keyup.enter="validatePassword"
              @input="state.error = ''"
              hide-details
              autofocus
          ></v-text-field>

          <div class="d-flex gap-4 mt-6">
            <v-btn variant="text" class="apple-btn-secondary" @click="reset">取消</v-btn>
            <v-btn color="teal" class="apple-btn-primary" :loading="state.loading" @click="validatePassword">验证</v-btn>
          </div>
        </v-card>
      </div>

      <!-- 3. 就绪区域 -->
      <div v-else :key="'ready'" class="view-container">
        <v-card class="status-card apple-glass">
          <div class="success-check mb-4">
            <v-icon color="success" size="64">mdi-check-circle</v-icon>
          </div>
          <div class="text-h6 font-weight-bold px-6 text-truncate w-100 text-center">{{ state.file.name }}</div>
          <div class="text-body-2 text-medium-emphasis mb-8">解密成功，已准备就绪</div>
          <v-btn variant="tonal" color="error" rounded="xl" @click="reset">移除文件</v-btn>
        </v-card>
      </div>

    </transition>
  </div>
</template>

<script setup>
import {reactive, ref} from 'vue'
import {PDFHelper} from '@/utils-scripts/PdfHelper'

const props = defineProps({
  label: {type: String, default: '选择或拖拽 PDF'}
})

const emit = defineEmits(['success', 'reset'])
const fileInput = ref(null)

const state = reactive({
  file: null,
  isLocked: false,
  password: '',
  loading: false,
  error: '',
  isShaking: false,
  showPassword: false
})

const triggerFileSelect = () => fileInput.value.click()

const handleFileChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  state.file = file
  state.loading = true
  try {
    const {isEncrypted} = await PDFHelper.getPdfjsInstance(file)
    if (isEncrypted) {
      state.isLocked = true
    } else {
      finishSelection('')
    }
  } catch (err) {
    state.error = '非法的 PDF 文件'
    reset()
  } finally {
    state.loading = false
  }
}

const validatePassword = async () => {
  if (!state.password) {
    triggerShake()
    return
  }
  state.loading = true
  try {
    const isValid = await PDFHelper.verifyPassword(state.file, state.password)
    if (isValid) {
      finishSelection(state.password)
    } else {
      state.error = '密码错误'
      triggerShake()
    }
  } catch (err) {
    state.error = '验证出错'
    triggerShake()
  } finally {
    state.loading = false
  }
}

const triggerShake = () => {
  state.isShaking = true
  setTimeout(() => {
    state.isShaking = false
  }, 500)
}

const clearError = () => {
  state.error = ''
}

const finishSelection = (finalPassword) => {
  state.isLocked = false
  emit('success', {file: state.file, password: finalPassword})
}

const reset = () => {
  state.file = null
  state.isLocked = false
  state.password = ''
  state.error = ''
  emit('reset')
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<style scoped lang="scss">
/* --- 1. 核心布局层 --- */
.pdf-secure-selector {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
}

.view-container {
  width: 100%;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.apple-glass {
  width: 100%;
  min-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 36px !important;
  transition: all 0.4s cubic-bezier(0.15, 0.83, 0.66, 1);
  padding: 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08) !important; /* 默认稍淡一点的阴影 */
  overflow: hidden;
  position: relative;
}

/* --- 2. 交互与动画 --- */

/* 修复：输入框宽度问题 */
.apple-input {
  width: 100%;
}

/* 修复：悬停效果 - 移除背景突变，改为边框高亮 + 上浮 */
.drop-zone-card.is-hovering {
  transform: translateY(-6px);
  border-color: #009688 !important; /* 主题色 Teal */
  box-shadow: 0 30px 60px rgba(0, 150, 136, 0.15) !important;
  /* 不再强制修改 background */
}

/* 修复：悬停时的图标俏动动画 */
.drop-zone-card.is-hovering .icon-orb {
  transform: scale(1.15) rotate(-5deg);
  box-shadow: 0 15px 35px rgba(0, 150, 136, 0.25);
}

/* --- 3. 主题样式 (浅色 vs 深色) --- */

/* === 默认：浅色模式 === */
.apple-glass {
  background: rgba(255, 255, 255, 0.9) !important; /* 更白，更像 Apple 风格 */
  border: 1px solid rgba(255, 255, 255, 0.6);
  color: #212121;
}

.icon-orb {
  width: 90px;
  height: 90px;
  background: #ffffff;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 25px rgba(0, 150, 136, 0.1);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); /* 弹性过渡 */
}

.lock-icon-wrapper {
  width: 64px;
  height: 64px;
  background: rgba(0, 150, 136, 0.1);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.apple-input :deep(.v-field) {
  background: rgba(0, 0, 0, 0.04) !important;
  border-radius: 16px !important;
  color: #212121;
}

.apple-input :deep(.v-field__input) {
  color: #212121 !important;
}

.apple-btn-secondary {
  color: rgba(0, 0, 0, 0.6) !important;
}

/* === 深色模式适配 (Media Query) === */
@media (prefers-color-scheme: dark) {
  .apple-glass {
    background: rgba(30, 30, 30, 0.75) !important;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4) !important;
    color: #ffffff;
  }

  /* 修复：深色模式下图标背景透明，带边框，不刺眼 */
  .icon-orb {
    background: transparent;
    border: 2px solid rgba(0, 150, 136, 0.5); /* Teal 边框 */
    box-shadow: none;
  }

  /* 悬停时图标稍微亮一点 */
  .drop-zone-card.is-hovering .icon-orb {
    background: rgba(0, 150, 136, 0.05);
    border-color: #009688;
  }

  .lock-icon-wrapper {
    background: rgba(255, 255, 255, 0.08);
  }

  .apple-input :deep(.v-field) {
    background: rgba(255, 255, 255, 0.08) !important;
  }

  .apple-input :deep(.v-field__input) {
    color: #fff !important;
  }

  .apple-input :deep(.v-label) {
    color: rgba(255, 255, 255, 0.7) !important;
  }

  .apple-btn-secondary {
    color: rgba(255, 255, 255, 0.6) !important;
  }
}

/* === 深色模式适配 (Vuetify 类) === */
:deep(.v-theme--dark) {
  .apple-glass {
    background: rgba(30, 30, 30, 0.75) !important;
    border-color: rgba(255, 255, 255, 0.08);
    color: #fff;
  }

  .icon-orb {
    background: transparent;
    border: 2px solid rgba(0, 150, 136, 0.5);
    box-shadow: none;
  }

  .drop-zone-card.is-hovering .icon-orb {
    background: rgba(0, 150, 136, 0.05);
    border-color: #009688;
  }

  .lock-icon-wrapper {
    background: rgba(255, 255, 255, 0.08);
  }

  .apple-input :deep(.v-field) {
    background: rgba(255, 255, 255, 0.08) !important;
  }

  .apple-input :deep(.v-field__input) {
    color: #fff !important;
  }

  .apple-input :deep(.v-label) {
    color: rgba(255, 255, 255, 0.7) !important;
  }

  .apple-btn-secondary {
    color: rgba(255, 255, 255, 0.6) !important;
  }
}

/* --- 4. 按钮样式 --- */
.apple-btn-primary {
  flex: 1;
  height: 52px !important;
  border-radius: 18px !important;
  font-weight: 600 !important;
  text-transform: none !important;
}

.apple-btn-secondary {
  flex: 1;
  height: 52px !important;
  border-radius: 18px !important;
  font-weight: 600 !important;
  text-transform: none !important;
}

/* --- 5. 过渡动画 --- */
.apple-switch-enter-active, .apple-switch-leave-active {
  transition: all 0.5s cubic-bezier(0.15, 0.83, 0.66, 1);
}

.apple-switch-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
  filter: blur(10px);
}

.apple-switch-leave-to {
  opacity: 0;
  transform: scale(1.05) translateY(-20px);
  filter: blur(10px);
}

/* --- 6. 错误抖动 --- */
@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  20%, 60% {
    transform: translateX(-10px);
  }
  40%, 80% {
    transform: translateX(10px);
  }
}

.shake-error {
  animation: shake 0.4s cubic-bezier(.36, .07, .19, .97) both;
}
</style>