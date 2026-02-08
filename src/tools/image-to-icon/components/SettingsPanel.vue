<template>
  <div>
    <div class="text-h6 mb-4">生成设置</div>

    <!-- Border Radius Setting -->
    <div class="mb-6">
      <div class="d-flex justify-space-between align-center mb-2">
        <span class="text-subtitle-2">圆角半径</span>
        <v-chip color="primary" size="small">{{ borderRadius }}%</v-chip>
      </div>
      <v-slider
        v-model="borderRadius"
        min="0"
        max="50"
        step="1"
        color="primary"
        hide-details
      >
        <template v-slot:prepend>
          <span class="text-caption text-grey">0%</span>
        </template>
        <template v-slot:append>
          <span class="text-caption text-grey">50%</span>
        </template>
      </v-slider>
    </div>

    <!-- Quality Setting -->
    <div class="mb-6" v-if="showQualitySetting">
      <div class="d-flex justify-space-between align-center mb-2">
        <span class="text-subtitle-2">图片质量</span>
        <v-chip color="primary" size="small">{{ Math.round(quality * 100) }}%</v-chip>
      </div>
      <v-slider
        v-model="quality"
        min="0.6"
        max="1.0"
        step="0.05"
        color="primary"
        hide-details
      >
        <template v-slot:prepend>
          <span class="text-caption text-grey">60%</span>
        </template>
        <template v-slot:append>
          <span class="text-caption text-grey">100%</span>
        </template>
      </v-slider>
      <v-alert variant="tonal" color="warning" density="compact" class="mt-2">
        仅对 WebP 格式有效
      </v-alert>
    </div>

    <!-- Background Color -->
    <div class="mb-6">
      <div class="text-subtitle-2 mb-3">背景颜色</div>
      <div class="d-flex gap-3 flex-wrap align-center">
        <v-avatar
          v-for="color in backgroundColors"
          :key="color.value"
          :style="{ backgroundColor: color.preview }"
          @click="backgroundColor = color.value"
          size="32"
          class="cursor-pointer"
          :class="{ 'selected-bg': backgroundColor === color.value }"
        >
          <v-icon v-if="backgroundColor === color.value" color="white" size="20">mdi-check</v-icon>
        </v-avatar>
      </div>
    </div>

    <!-- Preview Border Radius Effect -->
    <v-divider class="mb-4"></v-divider>
    <div class="text-subtitle-2 mb-3">圆角效果预览</div>
    <v-card variant="tonal" class="pa-4 d-flex justify-center">
      <div
        class="preview-shape"
        :style="{
          borderRadius: `${borderRadius}%`,
          backgroundColor: backgroundColor === 'transparent' ? '#3b82f6' : backgroundColor
        }"
      />
    </v-card>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      borderRadius: 0,
      quality: 0.9,
      backgroundColor: 'transparent'
    })
  },
  formats: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const borderRadius = ref(props.modelValue.borderRadius)
const quality = ref(props.modelValue.quality)
const backgroundColor = ref(props.modelValue.backgroundColor)

const backgroundColors = [
  { label: '透明', value: 'transparent', preview: '#ffffff' },
  { label: '白色', value: '#ffffff', preview: '#ffffff' },
  { label: '黑色', value: '#000000', preview: '#000000' },
  { label: '蓝色', value: '#3b82f6', preview: '#3b82f6' },
  { label: '绿色', value: '#10b981', preview: '#10b981' },
  { label: '红色', value: '#ef4444', preview: '#ef4444' },
  { label: '黄色', value: '#f59e0b', preview: '#f59e0b' },
  { label: '紫色', value: '#8b5cf6', preview: '#8b5cf6' }
]

// Show quality setting only for WebP
const showQualitySetting = computed(() => {
  return props.formats.includes('webp')
})

// Update settings
watch([borderRadius, quality, backgroundColor], () => {
  emit('update:modelValue', {
    borderRadius: borderRadius.value,
    quality: quality.value,
    backgroundColor: backgroundColor.value
  })
})
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.selected-bg {
  box-shadow: 0 0 0 2px rgb(var(--v-theme-primary));
}

.preview-shape {
  width: 80px;
  height: 80px;
  background-color: #3b82f6;
  transition: border-radius 0.3s;
}
</style>
