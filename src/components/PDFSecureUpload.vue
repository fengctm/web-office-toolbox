<template>
  <div class="pdf-secure-selector">
    <transition mode="out-in" name="apple-switch">

      <!-- 1. 上传区域 -->
      <div v-if="!state.file" :key="'upload'" class="view-container">
        <v-hover v-slot="{ isHovering, props }">
          <v-card
              :class="{ 'is-hovering': isHovering }"
              class="drop-zone-card apple-glass"
              v-bind="props"
              @click="triggerFileSelect"
          >
            <!-- 玻璃流光 -->
            <div class="glass-shimmer"></div>

            <div :class="{ 'anim-wiggle': isHovering }" class="icon-orb anim-float">
              <v-icon color="teal" size="42">mdi-file-pdf-box</v-icon>
            </div>
            <div class="text-h6 font-weight-bold mt-6 text-center px-4 anim-stagger-1">{{ label }}</div>
            <p class="text-caption text-medium-emphasis mt-2 anim-stagger-2">支持加密文档 · 100% 本地解析</p>
            <input ref="fileInput" accept="application/pdf" hidden type="file" @change="handleFileChange">
          </v-card>
        </v-hover>
      </div>

      <!-- 2. 解锁区域 -->
      <div v-else-if="state.isLocked" :key="'unlock'" class="view-container">
        <v-card
            :class="{ 'shake-error': state.isShaking }"
            class="unlock-glass-card apple-glass"
        >
          <div class="glass-shimmer"></div>
          <div class="lock-header anim-pop-in">
            <div class="lock-icon-wrapper">
              <v-icon :color="state.error ? 'error' : 'teal'" size="32">
                {{ state.error ? 'mdi-lock-alert' : 'mdi-lock-outline' }}
              </v-icon>
            </div>
          </div>

          <div class="doc-info text-center mb-8 anim-slide-up">
            <div class="text-h6 font-weight-bold text-truncate px-6">{{ state.file.name }}</div>
            <div class="text-caption text-teal font-weight-bold text-uppercase tracking-widest mt-1">
              Encrypted Document
            </div>
          </div>

          <v-text-field
              v-model="state.password"
              :append-inner-icon="state.showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              :label="state.error || '输入文档密码'"
              :type="state.showPassword ? 'text' : 'password'"
              autofocus
              class="apple-input mb-4 anim-slide-up-delay"
              flat
              hide-details
              variant="solo"
              @input="state.error = ''"
              @click:append-inner="state.showPassword = !state.showPassword"
              @keyup.enter="validatePassword"
          ></v-text-field>

          <div class="d-flex gap-4 mt-6 anim-slide-up-delay-2">
            <v-btn class="apple-btn-secondary" variant="text" @click="reset">取消</v-btn>
            <v-btn :loading="state.loading" class="apple-btn-primary" color="teal" @click="validatePassword">验证
            </v-btn>
          </div>
        </v-card>
      </div>

      <!-- 3. 就绪区域 -->
      <div v-else :key="'ready'" class="view-container">
        <v-card class="status-card apple-glass">
          <div class="glass-shimmer"></div>
          <div class="success-check mb-4 anim-pop-bounce">
            <v-icon color="success" size="64">mdi-check-circle</v-icon>
          </div>
          <div class="text-h6 font-weight-bold px-6 text-truncate w-100 text-center anim-slide-up">
            {{ state.file.name }}
          </div>
          <div class="text-body-2 text-medium-emphasis mb-8 anim-slide-up">解密成功，已准备就绪</div>
          <v-btn class="anim-slide-up-delay" color="error" rounded="xl" variant="tonal" @click="reset">移除文件</v-btn>
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

<style lang="scss" scoped>
/* --- 1. 核心布局 --- */
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
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08) !important;
  overflow: hidden;
  position: relative;
}

/* --- 2. Apple 风格动画 --- */

/* 玻璃流光 */
.glass-shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
          to right,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.1) 50%,
          rgba(255, 255, 255, 0) 100%
  );
  transform: skewX(-20deg);
  animation: shimmerMove 6s infinite;
  pointer-events: none;
  z-index: 0;
}

@keyframes shimmerMove {
  0% {
    left: -100%;
  }
  20% {
    left: 200%;
  }
  100% {
    left: 200%;
  }
}

/* 闲置：上下浮动 */
.anim-float {
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
}

/* 悬停：俏皮摇摆 (替换原来的缩放，避免跳变) */
.anim-wiggle {
  animation: wiggle 0.8s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite !important;
}

@keyframes wiggle {
  0%, 100% {
    transform: rotate(0deg) scale(1.1);
  }
  /* 稍微放大一点 */
  25% {
    transform: rotate(-8deg) scale(1.1);
  }
  75% {
    transform: rotate(8deg) scale(1.1);
  }
}

/* 其他入场动画 */
.anim-pop-in {
  animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  opacity: 0;
}

.anim-pop-bounce {
  animation: popBounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  opacity: 0;
  transform: scale(0);
}

.anim-slide-up {
  animation: slideUpFade 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

.anim-slide-up-delay {
  animation: slideUpFade 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.1s forwards;
  opacity: 0;
  transform: translateY(20px);
}

.anim-stagger-1 {
  animation: slideUpFade 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.2s forwards;
  opacity: 0;
  transform: translateY(10px);
}

.anim-stagger-2 {
  animation: slideUpFade 0.6s cubic-bezier(0.25, 1, 0.5, 1) 0.3s forwards;
  opacity: 0;
  transform: translateY(10px);
}

@keyframes popBounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes popIn {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes slideUpFade {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- 3. 交互与细节 --- */

.apple-input {
  width: 100%;
}

.apple-input :deep(.v-field) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.apple-input :deep(.v-field--focused) {
  transform: scale(1.01);
  box-shadow: 0 4px 20px rgba(0, 150, 136, 0.15) !important;
}

/* 鼠标悬停整体卡片效果：上浮 + 边框高亮 */
.drop-zone-card.is-hovering {
  transform: translateY(-6px);
  border-color: #009688 !important;
  box-shadow: 0 30px 60px rgba(0, 150, 136, 0.15) !important;
}

/* --- 4. 主题样式 (核心修复区) --- */

/* === 默认：浅色模式 === */
/* 强制覆盖任何深色样式 */
.apple-glass {
  background: rgba(255, 255, 255, 0.95) !important; /* 高不透明度纯白，解决背景深色问题 */
  border: 1px solid rgba(255, 255, 255, 0.8);
  color: #212121 !important;
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
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 修复：浅色模式图标颜色更清新 (浅青色) */
.icon-orb .v-icon {
  color: #26A69A !important; /* Teal lighten-1 */
  transition: color 0.3s;
}

.drop-zone-card.is-hovering .icon-orb {
  box-shadow: 0 15px 35px rgba(38, 166, 154, 0.3); /* 匹配浅色系的阴影 */
}

.lock-icon-wrapper {
  width: 64px;
  height: 64px;
  background: rgba(38, 166, 154, 0.1); /* 浅色系背景 */
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

/* 输入框样式 (浅色) */
.apple-input :deep(.v-field) {
  background: rgba(0, 0, 0, 0.04) !important;
  border-radius: 16px !important;
  color: #212121 !important;
}

.apple-input :deep(.v-field__input) {
  color: #212121 !important;
}

.apple-btn-secondary {
  color: rgba(0, 0, 0, 0.6) !important;
}


/* === 深色模式 === */
@media (prefers-color-scheme: dark) {
  .apple-glass {
    background: rgba(30, 30, 30, 0.75) !important;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4) !important;
    color: #ffffff !important;
  }

  /* 深色模式下图标背景透明 */
  .icon-orb {
    background: transparent;
    border: 2px solid rgba(0, 150, 136, 0.5);
    box-shadow: none;
  }

  /* 深色模式图标颜色恢复 Teal */
  .icon-orb .v-icon {
    color: #009688 !important;
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

/* === Vuetify 类强制适配 (防止框架覆盖) === */
:deep(.v-theme--dark) {
  .apple-glass {
    background: rgba(30, 30, 30, 0.75) !important;
    border-color: rgba(255, 255, 255, 0.08);
    color: #fff !important;
  }

  .icon-orb {
    background: transparent;
    border: 2px solid rgba(0, 150, 136, 0.5);
    box-shadow: none;
  }

  .icon-orb .v-icon {
    color: #009688 !important;
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

/* --- 5. 按钮样式 --- */
.apple-btn-primary, .apple-btn-secondary {
  flex: 1;
  height: 52px !important;
  border-radius: 18px !important;
  font-weight: 600 !important;
  text-transform: none !important;
}

/* --- 6. 过渡动画 --- */
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

/* --- 7. 错误抖动 --- */
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