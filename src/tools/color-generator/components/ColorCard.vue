<template>
  <v-card class="color-card" elevation="2">
    <div
      class="color-preview"
      :style="{ backgroundColor: color.hex }"
      @click="copyToClipboard(color.hex, 'hex')"
    >
      <div class="copy-hint">
        <v-icon size="16" color="white">mdi-content-copy</v-icon>
        <span>点击复制</span>
      </div>
    </div>

    <v-card-item>
      <v-card-title class="d-flex align-center">
        <v-icon v-if="icon" :color="color.hex" class="mr-2" size="20">
          {{ icon }}
        </v-icon>
        {{ label }}
      </v-card-title>
      <v-card-subtitle v-if="subtitle">
        {{ subtitle }}
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <div class="color-values">
        <div
          class="color-value-row"
          @click="copyToClipboard(color.hex, 'hex')"
        >
          <div class="value-label">
            <v-icon size="16" class="mr-1">mdi-hexagon</v-icon>
            HEX
          </div>
          <div class="value-content">
            <span class="value-text">{{ color.hex }}</span>
            <v-chip
              size="x-small"
              color="teal"
              variant="tonal"
            >
              复制
            </v-chip>
          </div>
        </div>

        <div
          class="color-value-row"
          @click="copyToClipboard(rgbText, 'rgb')"
        >
          <div class="value-label">
            <v-icon size="16" class="mr-1">mdi-circle</v-icon>
            RGB
          </div>
          <div class="value-content">
            <span class="value-text">{{ rgbText }}</span>
            <v-chip
              size="x-small"
              color="teal"
              variant="tonal"
            >
              复制
            </v-chip>
          </div>
        </div>

        <div
          class="color-value-row"
          @click="copyToClipboard(hslText, 'hsl')"
        >
          <div class="value-label">
            <v-icon size="16" class="mr-1">mdi-contrast-circle</v-icon>
            HSL
          </div>
          <div class="value-content">
            <span class="value-text">{{ hslText }}</span>
            <v-chip
              size="x-small"
              color="teal"
              variant="tonal"
            >
              复制
            </v-chip>
          </div>
        </div>

        <div
          v-if="showRgba && rgbaText"
          class="color-value-row"
          @click="copyToClipboard(rgbaText, 'rgba')"
        >
          <div class="value-label">
            <v-icon size="16" class="mr-1">mdi-circle-opacity</v-icon>
            RGBA
          </div>
          <div class="value-content">
            <span class="value-text">{{ rgbaText }}</span>
            <v-chip
              size="x-small"
              color="teal"
              variant="tonal"
            >
              复制
            </v-chip>
          </div>
        </div>
      </div>

      <v-expand-transition>
        <div v-if="showDetails" class="mt-3">
          <v-divider class="mb-3" />
          <div class="rgb-details">
            <div class="detail-row">
              <span class="detail-label">R (红)</span>
              <span class="detail-value" :style="{ color: color.hex }">
                {{ color.r }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">G (绿)</span>
              <span class="detail-value" :style="{ color: color.hex }">
                {{ color.g }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">B (蓝)</span>
              <span class="detail-value" :style="{ color: color.hex }">
                {{ color.b }}
              </span>
            </div>
          </div>
          <v-divider class="my-3" />
          <div class="hsl-details">
            <div class="detail-row">
              <span class="detail-label">H (色相)</span>
              <span class="detail-value" :style="{ color: color.hex }">
                {{ color.h }}°
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">S (饱和度)</span>
              <span class="detail-value" :style="{ color: color.hex }">
                {{ color.s }}%
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">L (亮度)</span>
              <span class="detail-value" :style="{ color: color.hex }">
                {{ color.l }}%
              </span>
            </div>
          </div>
        </div>
      </v-expand-transition>

      <v-btn
        variant="text"
        size="small"
        block
        class="mt-2"
        @click="showDetails = !showDetails"
      >
        {{ showDetails ? '收起详情' : '显示详情' }}
        <v-icon end>
          {{ showDetails ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
        </v-icon>
      </v-btn>
    </v-card-text>

    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      timeout="2000"
      location="bottom center"
    >
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn variant="text" @click="showSnackbar = false">
          关闭
        </v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  color: {
    type: Object,
    required: true
  },
  label: {
    type: String,
    default: '颜色'
  },
  subtitle: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  showRgba: {
    type: Boolean,
    default: false
  }
})

const showDetails = ref(false)
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const rgbText = computed(() => {
  const { r, g, b } = props.color
  return `rgb(${r}, ${g}, ${b})`
})

const hslText = computed(() => {
  const { h, s, l } = props.color
  return `hsl(${h}, ${s}%, ${l}%)`
})

const rgbaText = computed(() => {
  if (props.color.rgba) {
    return props.color.rgba
  }
  if (props.color.opacity !== undefined) {
    const { r, g, b, opacity } = props.color
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }
  return null
})

const copyToClipboard = async (text, format) => {
  try {
    await navigator.clipboard.writeText(text)
    snackbarText.value = `${format.toUpperCase()} 已复制到剪贴板`
    snackbarColor.value = 'success'
    showSnackbar.value = true
  } catch (error) {
    snackbarText.value = '复制失败，请手动选择复制'
    snackbarColor.value = 'error'
    showSnackbar.value = true
  }
}
</script>

<style scoped>
.color-card {
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.color-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.color-preview {
  height: 100px;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.color-preview:hover {
  transform: scale(1.02);
}

.copy-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 20px;
  color: white;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.color-preview:hover .copy-hint {
  opacity: 1;
}

.color-values {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.color-value-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.color-value-row:hover {
  background: #e8f5e9;
  transform: translateX(4px);
}

.value-label {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.value-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.value-text {
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  color: #333;
}

.rgb-details,
.hsl-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.detail-label {
  font-size: 13px;
  color: #666;
}

.detail-value {
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 14px;
  font-weight: 600;
}
</style>
