<template>
  <v-card class="char-random-generator" elevation="2">
    <v-card-item>
      <v-card-title class="d-flex align-center">
        <v-icon color="teal" class="mr-2">mdi-shuffle-variant</v-icon>
        字符随机生成器
      </v-card-title>
      <v-card-subtitle>
        生成随机字符序列，支持数字、大写字母、小写字母、简单/复杂符号组合，内置验证码和密码预设
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <!-- 预设按钮 -->
      <div class="mb-4">
        <div class="text-caption text-medium-emphasis mb-2">快速预设</div>
        <div class="d-flex flex-wrap ga-2">
          <v-btn
            variant="tonal"
            size="small"
            color="teal"
            @click="applyPreset('simple-captcha')"
          >
            <v-icon start size="18">mdi-security</v-icon>
            简单验证码
          </v-btn>
          <v-btn
            variant="tonal"
            size="small"
            color="teal"
            @click="applyPreset('complex-captcha')"
          >
            <v-icon start size="18">mdi-shield-check</v-icon>
            复杂验证码
          </v-btn>
          <v-btn
            variant="tonal"
            size="small"
            color="teal"
            @click="applyPreset('simple-password')"
          >
            <v-icon start size="18">mdi-lock</v-icon>
            简单密码
          </v-btn>
          <v-btn
            variant="tonal"
            size="small"
            color="teal"
            @click="applyPreset('complex-password')"
          >
            <v-icon start size="18">mdi-lock-plus</v-icon>
            复杂密码
          </v-btn>
        </div>
      </div>

      <v-divider class="mb-4" />

      <!-- 配置区 -->
      <v-row dense>
        <!-- 字符长度 -->
        <v-col cols="12" sm="6" md="3">
          <v-text-field
            v-model.number="length"
            label="字符长度"
            type="number"
            variant="outlined"
            density="comfortable"
            :min="minLength"
            :max="128"
            :hint="`当前至少需要 ${minLength} 位`"
            persistent-hint
          />
        </v-col>

        <!-- 占位列：保持布局节奏（原"字母大小写"位置已删除）-->
        <v-col cols="12" sm="6" md="3" />
      </v-row>

      <!-- 字符类型开关 -->
      <v-row dense class="mt-2">
        <v-col cols="6" sm="4" md="3">
          <v-switch
            v-model="numbers"
            label="纯数字"
            color="teal"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="4" md="3">
          <v-switch
            v-model="upperLetters"
            label="大写字母"
            color="teal"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="4" md="3">
          <v-switch
            v-model="lowerLetters"
            label="小写字母"
            color="teal"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="4" md="3">
          <v-switch
            v-model="simpleSymbols"
            label="混合简单符号"
            color="teal"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="4" md="3">
          <v-switch
            v-model="complexSymbols"
            label="混合复杂符号"
            color="teal"
            density="compact"
            hide-details
          />
        </v-col>
      </v-row>

      <!-- 生成按钮 -->
      <div class="mt-4 d-flex ga-2">
        <v-btn
          color="teal"
          variant="elevated"
          @click="handleGenerate"
        >
          <v-icon start>mdi-refresh</v-icon>
          生成
        </v-btn>
        <v-btn
          variant="tonal"
          @click="clearAll"
        >
          <v-icon start>mdi-eraser</v-icon>
          清空
        </v-btn>
      </div>

      <!-- 输出区域 -->
      <div v-if="output" class="mt-4">
        <v-textarea
          v-model="output"
          label="生成结果"
          variant="outlined"
          readonly
          rows="2"
          no-resize
          hide-details
          class="output-area"
        />
        <div class="d-flex ga-2 mt-2">
          <v-btn
            variant="tonal"
            size="small"
            color="teal"
            @click="copyResult"
          >
            <v-icon start size="18">mdi-content-copy</v-icon>
            复制结果
          </v-btn>
        </div>
      </div>

      <!-- 消息提示 -->
      <v-alert
        v-if="message"
        :type="messageType"
        :text="message"
        density="compact"
        class="mt-3"
      />
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { generateRandomString, countSelectedCategories } from './utils/random-string.js'

// --- 预设定义 ---
const presets = {
  'simple-captcha': {
    length: 4,
    numbers: true,
    upperLetters: true,
    lowerLetters: true,
    simpleSymbols: false,
    complexSymbols: false
  },
  'complex-captcha': {
    length: 6,
    numbers: true,
    upperLetters: true,
    lowerLetters: true,
    simpleSymbols: true,
    complexSymbols: false
  },
  'simple-password': {
    length: 10,
    numbers: true,
    upperLetters: false,
    lowerLetters: true,
    simpleSymbols: true,
    complexSymbols: false
  },
  'complex-password': {
    length: 16,
    numbers: true,
    upperLetters: true,
    lowerLetters: true,
    simpleSymbols: true,
    complexSymbols: false
  }
}

// --- 响应式状态 ---
const length = ref(8)
const numbers = ref(true)
const upperLetters = ref(true)
const lowerLetters = ref(true)
const simpleSymbols = ref(false)
const complexSymbols = ref(false)
const output = ref('')
const message = ref('')
const messageType = ref('info')

// --- 当前选项汇总（用于 utils） ---
const buildOptions = () => ({
  numbers: numbers.value,
  upperLetters: upperLetters.value,
  lowerLetters: lowerLetters.value,
  simpleSymbols: simpleSymbols.value,
  complexSymbols: complexSymbols.value
})

// --- 动态最小长度（已选类别数）---
const minLength = computed(() => Math.max(1, countSelectedCategories(buildOptions())))

// --- 符号类别互斥（保留原行为：complex 优先于 simple）---
watch(complexSymbols, (v) => {
  if (v && simpleSymbols.value) simpleSymbols.value = false
})
watch(simpleSymbols, (v) => {
  if (v && complexSymbols.value) complexSymbols.value = false
})

// --- 消息 ---
const showMessage = (text, type = 'info') => {
  message.value = text
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

// --- 操作 ---
const handleGenerate = () => {
  const len = Number(length.value)
  const opts = buildOptions()
  const selected = countSelectedCategories(opts)

  if (selected === 0) {
    showMessage('请至少选择一种字符类型', 'warning')
    return
  }

  if (!len || len < 1 || len > 128) {
    showMessage('请输入有效的字符长度 (1-128)', 'warning')
    return
  }

  // R3：长度必须 >= 已选类别数（严格拒绝，不自动改 length）
  if (len < selected) {
    showMessage(
      `已勾选 ${selected} 种字符类型，长度不能小于 ${selected}`,
      'warning'
    )
    return
  }

  try {
    output.value = generateRandomString(len, opts)
    showMessage('生成成功', 'success')
  } catch (error) {
    showMessage('生成失败: ' + error.message, 'error')
  }
}

const applyPreset = (key) => {
  const preset = presets[key]
  if (!preset) return

  length.value = preset.length
  numbers.value = preset.numbers
  upperLetters.value = preset.upperLetters
  lowerLetters.value = preset.lowerLetters
  simpleSymbols.value = preset.simpleSymbols
  complexSymbols.value = preset.complexSymbols

  showMessage(`已应用预设：${getPresetName(key)}`, 'info')
}

const getPresetName = (key) => {
  const map = {
    'simple-captcha': '简单验证码',
    'complex-captcha': '复杂验证码',
    'simple-password': '简单密码',
    'complex-password': '复杂密码'
  }
  return map[key] || key
}

const clearAll = () => {
  output.value = ''
  showMessage('已清空', 'info')
}

const fallbackCopy = (text) => {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '-9999px'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  try {
    document.execCommand('copy')
    return true
  } catch {
    return false
  } finally {
    document.body.removeChild(textarea)
  }
}

const copyResult = async () => {
  if (!output.value) {
    showMessage('没有可复制的内容', 'warning')
    return
  }

  // 优先使用 Clipboard API，不可用时回退到 execCommand
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(output.value)
      showMessage('已复制到剪贴板', 'success')
      return
    } catch {
      // 回退到 fallback
    }
  }

  if (fallbackCopy(output.value)) {
    showMessage('已复制到剪贴板', 'success')
  } else {
    showMessage('复制失败，请手动选择复制', 'error')
  }
}
</script>

<style scoped>
.char-random-generator {
  border-radius: 12px;
  overflow: hidden;
}

.output-area :deep(textarea) {
  font-family: 'Courier New', Courier, monospace;
  font-size: 1.1rem;
  letter-spacing: 2px;
}

@media (max-width: 600px) {
  .char-random-generator {
    border-radius: 8px;
  }
}
</style>
