<template>
  <v-dialog
    v-model="dialog"
    max-width="800"
    scrollable
  >
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center">
        <v-icon color="teal" class="mr-2">mdi-image-search</v-icon>
        转换预览
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="dialog = false" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <template v-if="item">
          <v-row>
            <!-- 原图 -->
            <v-col cols="6">
              <div class="text-subtitle-2 mb-2 text-medium-emphasis">原始图片</div>
              <div class="preview-box rounded-lg">
                <v-img
                  :src="originalUrl"
                  contain
                  max-height="300"
                />
              </div>
              <div class="mt-2 text-caption">
                <div>文件名: {{ item.file.name }}</div>
                <div>大小: {{ formatFileSize(item.file.size) }}</div>
              </div>
            </v-col>

            <!-- 转换后 -->
            <v-col cols="6">
              <div class="text-subtitle-2 mb-2 text-medium-emphasis">
                转换后 ({{ formatLabel }})
              </div>
              <div class="preview-box rounded-lg">
                <v-img
                  v-if="resultUrl"
                  :src="resultUrl"
                  contain
                  max-height="300"
                />
                <div v-else class="d-flex align-center justify-center fill-height text-medium-emphasis">
                  尚未转换
                </div>
              </div>
              <div v-if="item.result" class="mt-2 text-caption">
                <div>大小: {{ formatFileSize(item.result.blob.size) }}</div>
                <div>
                  变化:
                  <span :class="sizeChangeClass">
                    {{ sizeChangeText }}
                  </span>
                </div>
              </div>
            </v-col>
          </v-row>
        </template>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { formatFileSize } from '@/utils-scripts/ImageHelper.js'
import { OUTPUT_FORMATS } from '../composables/useImageConverter.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  item: { type: Object, default: null },
  outputFormat: { type: String, default: 'jpeg' },
})

const emit = defineEmits(['update:modelValue'])

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

let originalUrl = ref('')
let resultUrl = ref('')

watch(() => props.item, (val) => {
  // 清理旧 URL
  if (originalUrl.value) URL.revokeObjectURL(originalUrl.value)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)

  if (val?.file) {
    originalUrl.value = URL.createObjectURL(val.file)
  }
  if (val?.result?.blob) {
    resultUrl.value = URL.createObjectURL(val.result.blob)
  }
}, { immediate: true })

const formatLabel = computed(() => {
  const fmt = OUTPUT_FORMATS.find(f => f.value === props.outputFormat)
  return fmt?.label || props.outputFormat
})

const sizeChangeText = computed(() => {
  if (!props.item?.result?.blob?.size || !props.item?.file?.size) return ''
  const change = ((1 - props.item.result.blob.size / props.item.file.size) * 100).toFixed(1)
  return change > 0 ? `减少 ${change}%` : `增加 ${Math.abs(change)}%`
})

const sizeChangeClass = computed(() => {
  if (!props.item?.result?.blob?.size || !props.item?.file?.size) return ''
  return props.item.result.blob.size < props.item.file.size ? 'text-success' : 'text-error'
})
</script>

<style scoped>
.preview-box {
  background: rgb(var(--v-theme-surface-variant));
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(var(--v-border-color));
}
</style>
