<template>
  <v-card variant="outlined" class="format-settings pa-4 rounded-lg">
    <!-- 输出格式选择 -->
    <div class="text-subtitle-2 mb-2 text-medium-emphasis">输出格式</div>
    <v-btn-toggle
      v-model="internalFormat"
      mandatory
      color="teal"
      variant="outlined"
      divided
      density="comfortable"
      class="mb-4"
    >
      <v-btn
        v-for="fmt in formats"
        :key="fmt.value"
        :value="fmt.value"
        size="small"
      >
        {{ fmt.label }}
      </v-btn>
    </v-btn-toggle>

    <!-- 质量设置（JPEG/WebP 时显示） -->
    <template v-if="currentFormat?.hasQuality">
      <div class="text-subtitle-2 mb-2 text-medium-emphasis">
        压缩质量: <span class="text-teal font-weight-bold">{{ quality }}%</span>
      </div>
      <v-slider
        v-model="internalQuality"
        :min="1"
        :max="100"
        :step="1"
        color="teal"
        track-color="teal-lighten-4"
        thumb-label
        hide-details
        class="mb-2"
      />
      <div class="d-flex justify-space-between text-caption text-disabled mb-4">
        <span>最小体积</span>
        <span>最佳质量</span>
      </div>
    </template>

    <!-- 透明背景处理（JPEG 时显示） -->
    <template v-if="internalFormat === 'jpeg'">
      <div class="text-subtitle-2 mb-2 text-medium-emphasis">透明背景替换色</div>
      <div class="d-flex align-center ga-2 mb-4">
        <div
          v-for="color in bgColors"
          :key="color.label"
          class="bg-swatch"
          :class="{ active: bgColorKey === color.label }"
          :style="{ backgroundColor: `rgb(${color.value.join(',')})` }"
          :title="color.label"
          @click="selectBgColor(color)"
        />
      </div>
    </template>
  </v-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { OUTPUT_FORMATS, BG_COLORS } from '../composables/useImageConverter.js'

const props = defineProps({
  outputFormat: { type: String, default: 'jpeg' },
  quality: { type: Number, default: 85 },
  bgColor: { type: Array, default: () => [255, 255, 255] },
})

const emit = defineEmits(['update:outputFormat', 'update:quality', 'update:bgColor'])

const formats = OUTPUT_FORMATS
const bgColors = BG_COLORS

const internalFormat = computed({
  get: () => props.outputFormat,
  set: (val) => emit('update:outputFormat', val),
})

const internalQuality = computed({
  get: () => props.quality,
  set: (val) => emit('update:quality', val),
})

const currentFormat = computed(() =>
  OUTPUT_FORMATS.find(f => f.value === internalFormat.value)
)

const bgColorKey = ref('白色')

function selectBgColor(color) {
  bgColorKey.value = color.label
  emit('update:bgColor', [...color.value])
}

// 格式变化时重置背景色选择
watch(internalFormat, (val) => {
  if (val !== 'jpeg') return
  bgColorKey.value = '白色'
  emit('update:bgColor', [255, 255, 255])
})
</script>

<style scoped>
.format-settings {
  background: rgb(var(--v-theme-surface));
}

.bg-swatch {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.bg-swatch:hover {
  transform: scale(1.1);
}

.bg-swatch.active {
  border-color: rgb(var(--v-theme-teal));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-teal), 0.3);
}
</style>
