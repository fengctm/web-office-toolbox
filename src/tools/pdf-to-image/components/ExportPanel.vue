<template>
  <div v-if="pdfLoaded && totalPages > 0" class="export-section mt-6">
    <v-divider class="mb-4"></v-divider>

    <v-expansion-panels variant="accordion">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <template v-slot:default="{ expanded }">
            <v-icon :color="expanded ? 'teal' : 'grey'" class="mr-2">mdi-cog</v-icon>
            <span>导出设置</span>
          </template>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <!-- 格式选择 -->
          <div class="mb-4">
            <label class="text-subtitle-2 mb-2 d-block">图片格式</label>
            <v-select
              v-model="exportConfig.format"
              :items="formatOptions"
              item-title="text"
              item-value="value"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-image"
            ></v-select>
          </div>

          <!-- 质量选择 -->
          <div class="mb-4">
            <label class="text-subtitle-2 mb-2 d-block">图片质量</label>
            <v-slider
              v-model="exportConfig.quality"
              :min="1"
              :max="3"
              :step="1"
              :ticks="qualityLabels"
              show-ticks="always"
              tick-size="4"
              color="teal"
              density="comfortable"
              thumb-label
              @update:model-value="(val) => exportConfig.quality = val"
            >
              <template v-slot:append>
                <v-chip size="small" color="teal" variant="outlined">
                  {{ qualityLabels[exportConfig.quality] }}
                </v-chip>
              </template>
            </v-slider>
          </div>

          <!-- 范围选择 -->
          <div class="mb-4">
            <label class="text-subtitle-2 mb-2 d-block">导出范围</label>
            <v-select
              v-model="exportConfig.range"
              :items="rangeOptions"
              item-title="text"
              item-value="value"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-selection-drag"
            ></v-select>
          </div>

          <!-- 导出按钮 -->
          <v-btn
            block
            color="teal"
            size="large"
            :loading="exporting"
            :disabled="exporting"
            prepend-icon="mdi-download"
            @click="exportImages"
          >
            {{ exporting ? '正在导出...' : '导出为图片' }}
          </v-btn>

          <!-- 导出提示 -->
          <v-alert
            v-if="!exporting"
            type="info"
            variant="tonal"
            class="mt-3"
            icon="mdi-shield-check"
          >
            该工具为本地运行计算，运行速度以本地设备配置决定。所有处理在浏览器中完成，不会上传到服务器。
          </v-alert>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const props = defineProps({
  pdfLoaded: {
    type: Boolean,
    default: false
  },
  totalPages: {
    type: Number,
    default: 0
  },
  exporting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'export-images',
  'update:exporting'
])

// 导出配置
const exportConfig = reactive({
  format: 'png',
  quality: 2, // 1=低, 2=中, 3=高
  range: 'all' // all=全部, current=当前页
})

// 格式选项
const formatOptions = [
  { text: 'PNG (无损，高质量)', value: 'png' },
  { text: 'JPG (有损，文件较小)', value: 'jpg' },
  { text: 'WEBP (现代格式，平衡)', value: 'webp' }
]

// 质量标签
const qualityLabels = {
  1: '低',
  2: '中',
  3: '高'
}

// 导出范围选项
const rangeOptions = [
  { text: '全部页面', value: 'all' },
  { text: '当前页面', value: 'current' }
]

// 导出图片
const exportImages = () => {
  emit('export-images', {
    format: exportConfig.format,
    quality: exportConfig.quality,
    range: exportConfig.range
  })
}

// 暴露配置给父组件
defineExpose({
  exportConfig
})
</script>

<style scoped>
.export-section {
  animation: fadeIn 0.5s ease-out;
}

/* 动画定义 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 确保Vuetify组件样式正确应用 */
:deep(.v-expansion-panel-text__content) {
  padding: 16px 0;
}
</style>
