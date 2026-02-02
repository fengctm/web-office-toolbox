<template>
  <v-card class="color-input-card" elevation="2">
    <v-card-item>
      <v-card-title class="d-flex align-center">
        <v-icon color="teal" class="mr-2">mdi-palette</v-icon>
        选择主色调
      </v-card-title>
      <v-card-subtitle>
        输入或选择您的主色调
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <v-row>
        <v-col cols="12">
          <div class="color-preview-section">
            <div
              class="color-preview-block"
              :style="{ backgroundColor: displayColor }"
            />
            <div class="color-preview-info">
              <div class="preview-label">预览</div>
              <div class="preview-value">{{ displayColor }}</div>
            </div>
          </div>
        </v-col>
      </v-row>

      <v-row class="mt-2">
        <v-col cols="12">
          <v-text-field
            v-model="hexInput"
            label="HEX 颜色值"
            placeholder="#009688"
            variant="outlined"
            density="comfortable"
            :error-messages="hexError"
            @update:model-value="handleHexInput"
          >
            <template v-slot:prepend-inner>
              <div
                class="color-swatch"
                :style="{ backgroundColor: validHex ? hexInput : '#cccccc' }"
                @click="openColorPicker"
              />
            </template>
            <template v-slot:append-inner>
              <v-btn
                icon="mdi-eyedropper"
                variant="text"
                size="small"
                @click="openColorPicker"
              />
            </template>
          </v-text-field>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-btn
            block
            color="teal"
            variant="tonal"
            @click="openColorPicker"
          >
            <v-icon class="mr-2">mdi-eyedropper</v-icon>
            使用颜色选择器
          </v-btn>
        </v-col>
      </v-row>

      <v-expand-transition>
        <div v-if="showPicker" class="mt-4">
          <v-color-picker
            v-model="pickerColor"
            mode="hex"
            hide-inputs
            hide-sliders
            show-swatches
            swatches-max-height="120"
          />
          <div class="d-flex justify-end mt-2">
            <v-btn
              variant="text"
              @click="showPicker = false"
            >
              取消
            </v-btn>
            <v-btn
              color="teal"
              @click="confirmColor"
            >
              确定
            </v-btn>
          </div>
        </div>
      </v-expand-transition>

      <v-row class="mt-3">
        <v-col cols="4">
          <v-text-field
            v-model.number="rgb.r"
            label="R"
            variant="outlined"
            density="compact"
            min="0"
            max="255"
            type="number"
            @update:model-value="handleRgbInput"
          />
        </v-col>
        <v-col cols="4">
          <v-text-field
            v-model.number="rgb.g"
            label="G"
            variant="outlined"
            density="compact"
            min="0"
            max="255"
            type="number"
            @update:model-value="handleRgbInput"
          />
        </v-col>
        <v-col cols="4">
          <v-text-field
            v-model.number="rgb.b"
            label="B"
            variant="outlined"
            density="compact"
            min="0"
            max="255"
            type="number"
            @update:model-value="handleRgbInput"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="4">
          <v-text-field
            v-model.number="hsl.h"
            label="H (色相)"
            variant="outlined"
            density="compact"
            min="0"
            max="360"
            suffix="°"
            type="number"
            @update:model-value="handleHslInput"
          />
        </v-col>
        <v-col cols="4">
          <v-text-field
            v-model.number="hsl.s"
            label="S (饱和度)"
            variant="outlined"
            density="compact"
            min="0"
            max="100"
            suffix="%"
            type="number"
            @update:model-value="handleHslInput"
          />
        </v-col>
        <v-col cols="4">
          <v-text-field
            v-model.number="hsl.l"
            label="L (亮度)"
            variant="outlined"
            density="compact"
            min="0"
            max="100"
            suffix="%"
            type="number"
            @update:model-value="handleHslInput"
          />
        </v-col>
      </v-row>

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
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  hexToHsl,
  parseColor
} from '../utils/color-utils.js'

const props = defineProps({
  modelValue: {
    type: String,
    default: '#009688'
  }
})

const emit = defineEmits(['update:modelValue', 'color-change'])

const hexInput = ref(props.modelValue)
const rgb = ref({ r: 0, g: 152, b: 136 })
const hsl = ref({ h: 174, s: 63, l: 37 })
const pickerColor = ref(props.modelValue)
const showPicker = ref(false)
const message = ref('')
const messageType = ref('info')
const hexError = ref('')

const displayColor = computed(() => {
  return validHex.value ? hexInput.value : '#cccccc'
})

const validHex = computed(() => {
  const hex = hexInput.value.replace('#', '')
  return /^([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)
})

const showMessage = (text, type = 'info') => {
  message.value = text
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

const updateFromHex = (hex) => {
  if (!hex.startsWith('#')) {
    hex = '#' + hex
  }
  const rgbValues = hexToRgb(hex)
  const hslValues = hexToHsl(hex)
  rgb.value = rgbValues
  hsl.value = hslValues
  pickerColor.value = hex
  emit('update:modelValue', hex.toUpperCase())
  emit('color-change', { hex: hex.toUpperCase(), ...rgbValues, ...hslValues })
}

const updateFromRgb = () => {
  const r = Math.max(0, Math.min(255, rgb.value.r || 0))
  const g = Math.max(0, Math.min(255, rgb.value.g || 0))
  const b = Math.max(0, Math.min(255, rgb.value.b || 0))
  rgb.value = { r, g, b }
  const hex = rgbToHex(r, g, b)
  const hslValues = rgbToHsl(r, g, b)
  hsl.value = hslValues
  hexInput.value = hex.toUpperCase()
  pickerColor.value = hex
  emit('update:modelValue', hex.toUpperCase())
  emit('color-change', { hex: hex.toUpperCase(), r, g, b, ...hslValues })
}

const updateFromHsl = () => {
  const h = ((hsl.value.h || 0) % 360 + 360) % 360
  const s = Math.max(0, Math.min(100, hsl.value.s || 0))
  const l = Math.max(0, Math.min(100, hsl.value.l || 0))
  hsl.value = { h, s, l }
  const rgbValues = hslToRgb(h, s, l)
  const hex = rgbToHex(rgbValues.r, rgbValues.g, rgbValues.b)
  rgb.value = rgbValues
  hexInput.value = hex.toUpperCase()
  pickerColor.value = hex
  emit('update:modelValue', hex.toUpperCase())
  emit('color-change', { hex: hex.toUpperCase(), ...rgbValues, h, s, l })
}

const handleHexInput = (value) => {
  hexError.value = ''
  let hex = value.trim()
  if (!hex) {
    hexError.value = '请输入颜色值'
    return
  }
  if (!hex.startsWith('#')) {
    hex = '#' + hex
  }
  const parsed = parseColor(hex)
  if (parsed) {
    rgb.value = { r: parsed.r, g: parsed.g, b: parsed.b }
    hsl.value = { h: parsed.h, s: parsed.s, l: parsed.l }
    pickerColor.value = parsed.hex
    emit('update:modelValue', parsed.hex)
    emit('color-change', parsed)
    showMessage('颜色已更新', 'success')
  } else {
    hexError.value = '无效的颜色格式'
  }
}

const handleRgbInput = () => {
  updateFromRgb()
  showMessage('RGB已更新', 'info')
}

const handleHslInput = () => {
  updateFromHsl()
  showMessage('HSL已更新', 'info')
}

const openColorPicker = () => {
  showPicker.value = true
}

const confirmColor = () => {
  if (pickerColor.value) {
    let hex = pickerColor.value
    if (!hex.startsWith('#')) {
      hex = '#' + hex
    }
    const parsed = parseColor(hex)
    if (parsed) {
      hexInput.value = parsed.hex
      rgb.value = { r: parsed.r, g: parsed.g, b: parsed.b }
      hsl.value = { h: parsed.h, s: parsed.s, l: parsed.l }
      emit('update:modelValue', parsed.hex)
      emit('color-change', parsed)
      showMessage('颜色已选择', 'success')
    }
  }
  showPicker.value = false
}

watch(() => props.modelValue, (newVal) => {
  if (newVal && newVal !== hexInput.value) {
    const parsed = parseColor(newVal)
    if (parsed) {
      hexInput.value = parsed.hex
      rgb.value = { r: parsed.r, g: parsed.g, b: parsed.b }
      hsl.value = { h: parsed.h, s: parsed.s, l: parsed.l }
      pickerColor.value = parsed.hex
    }
  }
}, { immediate: true })
</script>

<style scoped>
.color-input-card {
  border-radius: 12px;
  overflow: hidden;
}

.color-preview-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%);
  border-radius: 8px;
}

.color-preview-block {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: background-color 0.3s ease;
}

.color-preview-info {
  flex: 1;
}

.preview-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.preview-value {
  font-size: 18px;
  font-weight: 600;
  font-family: 'Monaco', 'Consolas', monospace;
  color: #333;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 2px solid #ddd;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.color-swatch:hover {
  transform: scale(1.1);
}
</style>
