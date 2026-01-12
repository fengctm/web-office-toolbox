<template>
  <div
      :class="{ 'is-dark': isDark, 'reduced-motion': reducedMotion }"
      class="pdf-secure-selector"
      @mouseleave="tilt = { x: 0, y: 0 }"
      @mousemove="handleMouseMove"
  >
    <transition
        :css="!reducedMotion"
        mode="out-in"
        name="apple-state-switch"
    >

      <!-- 1. 初始上传态 -->
      <div v-if="!state.file" :key="'upload'" class="view-stage">
        <div
            :class="{
              'is-dragging': isDragging,
              'hover-tilt': !isDragging && !isMobile
            }"
            :style="tiltStyle"
            class="glass-card upload-zone"
            @click="triggerFileSelect"
            @dragleave="handleDragLeave"
            @dragover.prevent="handleDragOver"
            @drop.prevent="handleDrop"
        >
          <div class="shimmer-effect"></div>
          <div v-if="isDragging" class="rotating-border"></div>
          <div class="ambient-glow"></div>

          <div class="content-box">
            <div :class="{ 'magnetic-pulse': isDragging }" class="icon-sphere anim-float">
              <v-icon class="floating-icon" color="teal" size="48">mdi-file-pdf-box</v-icon>
            </div>

            <div class="text-group">
              <h3 class="text-h6 font-weight-bold mt-6 anim-stagger-1">{{ label }}</h3>
              <p class="text-caption mt-2 anim-stagger-2">100% 本地解析 · 隐私受保护</p>
            </div>

            <div v-if="isDragging" class="drag-hint anim-pop">
              <v-icon color="teal" size="20">mdi-arrow-down-bold</v-icon>
              <span>释放以上传</span>
            </div>
          </div>

          <input ref="fileInput" accept="application/pdf" hidden type="file" @change="handleFileChange">
        </div>
      </div>

      <!-- 2. 密码解锁态 -->
      <div v-else-if="state.isLocked" :key="'unlock'" class="view-stage">
        <div
            :class="{ 'shake-active': state.isShaking }"
            :style="tiltStyle"
            class="glass-card unlock-zone"
        >
          <div class="shimmer-effect"></div>
          <div class="ambient-glow"></div>

          <div :class="{ 'error-pulse': state.error }" class="lock-orb mb-6 anim-pop">
            <v-icon :color="state.error ? 'error' : 'teal'" class="lock-icon" size="32">
              {{ state.error ? 'mdi-lock-alert' : 'mdi-lock-open-outline' }}
            </v-icon>
          </div>

          <div class="file-info text-center mb-8 anim-stagger-1 w-100">
            <div class="text-subtitle-1 font-weight-bold text-truncate px-6">{{ state.file.name }}</div>
            <div class="status-badge mt-2">文档已加密</div>
          </div>

          <div class="input-wrapper w-100 px-6 anim-stagger-2">
            <v-text-field
                v-model="state.password"
                :label="state.error || '输入文档密码'"
                :type="state.showPassword ? 'text' : 'password'"
                autofocus
                class="apple-field"
                color="teal"
                flat
                hide-details
                rounded="lg"
                variant="filled"
                @input="handlePasswordInput"
                @keyup.enter="validatePassword"
            >
              <template v-slot:append-inner>
                <v-btn
                    :color="state.showPassword ? 'teal' : 'grey'"
                    density="comfortable"
                    icon
                    size="small"
                    variant="text"
                    @click="state.showPassword = !state.showPassword"
                >
                  <v-icon size="20">{{ state.showPassword ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
                </v-btn>
              </template>
            </v-text-field>
          </div>

          <!-- 修复：增加按钮间距 -->
          <div class="action-row mt-10 anim-stagger-3 w-100 px-6">
            <v-btn
                class="secondary-btn"
                rounded="xl"
                style="margin-right: 12px;"
                variant="text"
                @click="reset"
            >
              取消
            </v-btn>
            <v-btn
                :disabled="!state.password"
                :loading="state.loading"
                class="shadow-teal primary-btn flex-grow-1"
                color="teal"
                elevation="0"
                rounded="xl"
                @click="validatePassword"
            >
              验证并解锁
              <v-icon class="ml-2" right size="18">mdi-arrow-right-circle</v-icon>
            </v-btn>
          </div>
        </div>
      </div>

      <!-- 3. 就绪态 -->
      <div v-else :key="'ready'" class="view-stage">
        <div :style="tiltStyle" class="glass-card ready-zone">
          <div class="success-ring anim-bounce">
            <div class="celebration-ring">
              <div class="ripple ripple-1"></div>
              <div class="ripple ripple-2"></div>
              <div class="ripple ripple-3"></div>
            </div>
            <v-icon class="check-icon" color="success" size="72">mdi-check-circle</v-icon>
            <div v-if="!reducedMotion" class="particles">
              <span v-for="i in 8" :key="i" :style="getParticleStyle(i)" class="particle"></span>
            </div>
          </div>

          <div class="text-h6 font-weight-bold mt-8 text-truncate w-100 px-8 text-center anim-stagger-1">
            {{ state.file.name }}
          </div>
          <p class="text-body-2 mt-1 opacity-60 anim-stagger-2">解密成功 · 准备就绪</p>

          <v-btn class="mt-10 anim-stagger-3 reset-btn" color="error" rounded="xl" variant="tonal" @click="reset">
            移除文件
          </v-btn>
        </div>
      </div>

    </transition>
  </div>
</template>

<script setup>
import {computed, onMounted, reactive, ref} from 'vue'
import {useTheme} from 'vuetify'
import {PDFHelper} from '@/utils-scripts/PdfHelper'

const props = defineProps({
  label: {type: String, default: '选择或拖拽 PDF'}
})

const emit = defineEmits(['success', 'reset'])
const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)
const isMobile = ref(false)
const reducedMotion = ref(false)
const tilt = ref({x: 0, y: 0})
const fileInput = ref(null)
const isDragging = ref(false)

const state = reactive({
  file: null,
  isLocked: false,
  password: '',
  loading: false,
  error: '',
  isShaking: false,
  showPassword: false
})

const tiltStyle = computed(() => {
  if (reducedMotion.value || isMobile.value) return {}
  return {transform: `perspective(1000px) rotateX(${tilt.value.x}deg) rotateY(${tilt.value.y}deg)`}
})

const handleMouseMove = (e) => {
  if (isMobile.value) return
  const rect = e.currentTarget.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width
  const y = (e.clientY - rect.top) / rect.height
  tilt.value = {x: (y - 0.5) * -12, y: (x - 0.5) * 12}
}

const handleDragOver = () => {
  isDragging.value = true
}
const handleDragLeave = () => {
  isDragging.value = false
}
const handleDrop = (e) => {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file?.type === 'application/pdf') processFile(file)
}

const handlePasswordInput = () => {
  if (navigator.vibrate && state.password.length > 0) navigator.vibrate(2)
}

const getParticleStyle = (i) => ({'--rot': `${i * 45}deg`})

const triggerFileSelect = () => fileInput.value.click()
const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) processFile(file)
}

const processFile = async (file) => {
  state.file = file
  state.loading = true
  try {
    const {isEncrypted} = await PDFHelper.getPdfjsInstance(file)
    if (isEncrypted) state.isLocked = true
    else finishSelection('')
  } catch (err) {
    state.error = '非法的 PDF 文件'
    reset()
  } finally {
    state.loading = false
  }
}

const validatePassword = async () => {
  if (!state.password) return triggerShake()
  state.loading = true
  try {
    const isValid = await PDFHelper.verifyPassword(state.file, state.password)
    if (isValid) finishSelection(state.password)
    else {
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
  // iPhone 风格的震动模式：短-长-短
  if (navigator.vibrate) navigator.vibrate([15, 30, 15])
  setTimeout(() => {
    state.isShaking = false
  }, 350)
}

const finishSelection = (finalPassword) => {
  state.isLocked = false
  emit('success', {file: state.file, password: finalPassword})
}

const reset = () => {
  state.file = null;
  state.isLocked = false;
  state.password = '';
  state.error = '';
  emit('reset')
}

onMounted(() => {
  isMobile.value = window.matchMedia('(hover: none)').matches
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})
</script>

<style lang="scss" scoped>
/* ==================== 变量与核心缓动 ==================== */
$apple-ease: cubic-bezier(0.16, 1, 0.3, 1);
$spring-ease: cubic-bezier(0.34, 1.56, 0.64, 1);
// 修复：iPhone风格的急促抖动曲线
$shake-ease: cubic-bezier(.36, .07, .19, .97);

.pdf-secure-selector {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
}

.view-stage {
  min-height: 460px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.glass-card {
  width: 100%;
  min-height: 400px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 36px;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition: transform 0.15s ease-out, box-shadow 0.4s $apple-ease;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);

  .is-dark & {
    background: rgba(30, 30, 30, 0.75);
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  }
}

/* ==================== 1. 修复：iPhone风格错误抖动 ==================== */
.shake-active {
  // 修复：3次快速来回，带轻微旋转，总时长0.35s
  animation: iphoneShake 0.35s $shake-ease both;
}

@keyframes iphoneShake {
  0%, 100% {
    transform: translateX(0) rotate(0deg);
  }
  20% {
    transform: translateX(-6px) rotate(-1deg);
  }
  40% {
    transform: translateX(5px) rotate(1deg);
  }
  60% {
    transform: translateX(-4px) rotate(-0.5deg);
  }
  80% {
    transform: translateX(3px) rotate(0.5deg);
  }
}

/* ==================== 2. 修复：按钮间距 ==================== */
.action-row {
  display: flex;
  gap: 16px !important; // 增加按钮间距
  width: 100%;

  .secondary-btn {
    flex: 1;
    height: 52px !important;
    font-weight: 600 !important;
    transition: all 0.3s $apple-ease !important;

    &:hover {
      background: rgba(0, 0, 0, 0.05) !important;
      transform: translateY(-1px);
    }
  }

  .primary-btn {
    flex: 2; // 主按钮更宽
    height: 52px !important;
    font-weight: 700 !important;
    transition: all 0.3s $apple-ease !important;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 15px 30px rgba(0, 150, 136, 0.3) !important;
    }

    &:active:not(:disabled) {
      transform: translateY(0) scale(0.96);
    }

    &:disabled {
      opacity: 0.5;
      transform: none !important;
    }
  }

  // 移动端堆叠
  @media (max-width: 480px) {
    flex-direction: column;
    gap: 12px !important;

    .secondary-btn,
    .primary-btn {
      width: 100%;
      flex: none;
    }
  }
}

/* ==================== 其它增强 ==================== */
.content-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.icon-sphere {
  width: 100px;
  height: 100px;
  background: white;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 25px rgba(0, 150, 136, 0.1);
  transition: all 0.6s $spring-ease;

  .is-dark & {
    background: rgba(255, 255, 255, 0.05);
  }
}

.lock-orb {
  width: 72px;
  height: 72px;
  background: rgba(0, 150, 136, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s $apple-ease;

  &.error-pulse {
    animation: errorPulse 0.6s $apple-ease;
  }
}

@keyframes errorPulse {
  0%, 100% {
    background: rgba(244, 67, 54, 0.1);
    transform: scale(1);
  }
  50% {
    background: rgba(244, 67, 54, 0.3);
    transform: scale(1.1);
  }
}

.status-badge {
  display: inline-block;
  padding: 6px 16px;
  background: rgba(0, 150, 136, 0.15);
  color: #00796b;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  border-radius: 20px;
  letter-spacing: 1.2px;
  transition: all 0.3s $apple-ease;
}

.dark-theme .status-badge {
  background: rgba(0, 191, 165, 0.25);
  color: #00bfa5;
}

/* 成功态庆祝 */
.success-ring {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.celebration-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
}

.ripple {
  position: absolute;
  inset: 0;
  border: 2px solid #4caf50;
  border-radius: 50%;
  opacity: 0;
}

.ripple-1 {
  animation: ripple 1.2s $apple-ease infinite;
}

.ripple-2 {
  animation: ripple 1.2s $apple-ease 0.4s infinite;
}

.ripple-3 {
  animation: ripple 1.2s $apple-ease 0.8s infinite;
}

@keyframes ripple {
  0% {
    transform: scale(0.6);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

.particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: #4caf50;
  border-radius: 50%;
  animation: particleBurst 0.7s $spring-ease forwards;
}

@keyframes particleBurst {
  0% {
    opacity: 1;
    transform: rotate(var(--rot)) translateX(0);
  }
  100% {
    opacity: 0;
    transform: rotate(var(--rot)) translateX(60px);
  }
}

/* 状态切换 */
.apple-state-switch-enter-active, .apple-state-switch-leave-active {
  transition: all 0.5s $apple-ease;
}

.apple-state-switch-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.96);
}

.apple-state-switch-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(1.04);
}

/* 动画类 */
.anim-float {
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}

.anim-bounce {
  animation: bounceIn 0.8s $spring-ease forwards;
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3) rotate(-30deg);
  }
  70% {
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0);
  }
}

.anim-stagger-1 {
  animation: fadeInUp 0.6s $apple-ease 0.1s backwards;
}

.anim-stagger-2 {
  animation: fadeInUp 0.6s $apple-ease 0.2s backwards;
}

.anim-stagger-3 {
  animation: fadeInUp 0.6s $apple-ease 0.3s backwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 流光 */
.shimmer-effect {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  transform: translateX(-100%) skewX(-15deg);
  animation: shimmer 7s infinite;
}

@keyframes shimmer {
  15%, 100% {
    transform: translateX(250%) skewX(-15deg);
  }
}

/* 移动端适配 */
@media (max-width: 480px) {
  .glass-card {
    padding: 32px 20px;
    border-radius: 28px;
  }

  .icon-sphere {
    width: 80px;
    height: 80px;
  }

  .lock-orb {
    width: 60px;
    height: 60px;
  }

  .success-ring {
    width: 100px;
    height: 100px;
  }
}
</style>
