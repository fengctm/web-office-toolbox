<template>
  <div class="pdf-secure-selector">
    <transition name="view-switch" mode="out-in">

      <!-- 1. 初始上传区域 (Google MD3 Style) -->
      <div v-if="!state.file" :key="'upload'" class="view-container">
        <v-hover v-slot="{ isHovering, props }">
          <v-card
              v-bind="props"
              class="drop-zone-card"
              :class="{ 'is-hovering': isHovering }"
              @click="triggerFileSelect"
          >
            <div class="icon-wrapper">
              <v-icon size="48" color="teal">mdi-file-pdf-box</v-icon>
            </div>
            <div class="text-h6 font-weight-bold mt-4">{{ label }}</div>
            <p class="text-caption text-grey mt-1">支持加密文档，本地解析</p>
            <input
                type="file"
                ref="fileInput"
                hidden
                accept="application/pdf"
                @change="handleFileChange"
            >
          </v-card>
        </v-hover>
      </div>

      <!-- 2. 密码解锁区域 (Apple Security Style) -->
      <div v-else-if="state.isLocked" :key="'unlock'" class="view-container">
        <v-card class="unlock-glass-card" elevation="12">
          <div class="lock-header">
            <v-avatar color="teal-lighten-5" size="64">
              <v-icon color="teal" size="32">mdi-lock-outline</v-icon>
            </v-avatar>
          </div>

          <div class="doc-info text-center mb-6">
            <div class="text-subtitle-1 font-weight-black text-truncate px-4">
              {{ state.file.name }}
            </div>
            <v-chip size="x-small" variant="tonal" color="teal" class="mt-1">
              受保护的文档
            </v-chip>
          </div>

          <v-text-field
              v-model="state.password"
              label="输入文档密码"
              type="password"
              variant="solo-filled"
              flat
              rounded="lg"
              bg-color="grey-lighten-4"
              color="teal"
              autofocus
              class="mb-4"
              :error-messages="state.error"
              @keyup.enter="validatePassword"
              @input="state.error = ''"
          ></v-text-field>

          <div class="d-flex gap-3">
            <v-btn
                variant="text"
                rounded="pill"
                class="flex-1"
                @click="reset"
            >
              取消
            </v-btn>
            <v-btn
                color="teal"
                variant="flat"
                rounded="pill"
                class="flex-1"
                :loading="state.loading"
                @click="validatePassword"
            >
              验证
            </v-btn>
          </div>
        </v-card>
      </div>

      <!-- 3. 解析中/就绪状态 -->
      <div v-else :key="'ready'" class="view-container">
        <v-card variant="flat" border class="status-card rounded-xl pa-6 text-center">
          <v-progress-circular
              v-if="state.loading"
              indeterminate
              color="teal"
              class="mb-2"
          ></v-progress-circular>
          <v-icon v-else color="success" size="48" class="mb-2">mdi-check-circle</v-icon>

          <div class="text-subtitle-1 font-weight-bold">{{ state.file.name }}</div>
          <div class="text-caption text-grey">已成功解密并准备就绪</div>

          <v-btn
              variant="text"
              color="error"
              size="small"
              class="mt-4"
              @click="reset"
          >
            重置文件
          </v-btn>
        </v-card>
      </div>

    </transition>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { PDFHelper } from '@/utils-scripts/PdfHelper'

const props = defineProps({
  label: { type: String, default: '选择或拖拽 PDF' }
})

const emit = defineEmits(['success', 'reset'])

const fileInput = ref(null)
const state = reactive({
  file: null,
  isLocked: false,
  password: '',
  loading: false,
  error: ''
})

const triggerFileSelect = () => fileInput.value.click()

/**
 * 阶段 1：文件选择与初步加密检测
 */
const handleFileChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  state.file = file
  state.loading = true

  try {
    // 检查 PDF 是否加密
    const { isEncrypted } = await PDFHelper.getPdfjsInstance(file)

    if (isEncrypted) {
      state.isLocked = true
    } else {
      // 未加密，直接交付
      finishSelection('')
    }
  } catch (err) {
    state.error = '非法的 PDF 文件'
    reset()
  } finally {
    state.loading = false
  }
}

/**
 * 阶段 2：验证用户输入的密码
 */
const validatePassword = async () => {
  if (!state.password) return

  state.loading = true
  state.error = ''

  try {
    // 使用工具类验证密码
    const isValid = await PDFHelper.verifyPassword(state.file, state.password)

    if (isValid) {
      finishSelection(state.password)
    } else {
      state.error = '密码错误，请重新输入'
      // Apple 风格的输入提示：通常这里可以加一个抖动动画
    }
  } catch (err) {
    state.error = '验证过程中出错'
  } finally {
    state.loading = false
  }
}

/**
 * 阶段 3：成功后的终点
 */
const finishSelection = (finalPassword) => {
  state.isLocked = false
  // 关键：将验证过的 file 对象和正确的 password 传给父组件
  emit('success', {
    file: state.file,
    password: finalPassword
  })
}

const reset = () => {
  state.file = null
  state.isLocked = false
  state.password = ''
  state.loading = false
  state.error = ''
  emit('reset')
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<style scoped lang="scss">
.pdf-secure-selector {
  width: 100%;
  max-width: 460px;
  margin: 0 auto;
}

.view-container {
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 1. 上传卡片 (MD3) */
.drop-zone-card {
  width: 100%;
  height: 280px;
  border: 2px dashed #B2DFDB !important;
  border-radius: 32px !important;
  background: #FAFAFA !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);

  &:hover {
    border-color: #009688 !important;
    background: #E0F2F1 !important;
    transform: translateY(-4px);
  }

  .icon-wrapper {
    width: 80px;
    height: 80px;
    background: white;
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }
}

/* 2. 解锁卡片 (Apple Glass) */
.unlock-glass-card {
  width: 100%;
  padding: 32px;
  border-radius: 32px !important;
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  text-align: center;

  .lock-header {
    margin-bottom: 24px;
    display: flex;
    justify-content: center;
  }
}

/* 3. 状态卡片 */
.status-card {
  width: 100%;
  background: white !important;
  border: 1px solid #E0E0E0 !important;
}

/* 动效 */
.view-switch-enter-active, .view-switch-leave-active {
  transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}
.view-switch-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.view-switch-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

/* 深色模式适配 */
:root[data-theme="dark"] {
  .drop-zone-card {
    background: #1E1E1E !important;
    border-color: #333 !important;
    &:hover { border-color: #4DD0E1 !important; background: #263238 !important; }
    .icon-wrapper { background: #2D2D2D; }
  }
  .unlock-glass-card {
    background: rgba(30, 30, 30, 0.7) !important;
    border-color: rgba(255, 255, 255, 0.1);
  }
  .status-card { background: #1E1E1E !important; border-color: #333 !important; }
}
</style>