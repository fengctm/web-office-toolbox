<template>
  <div class="export-panel-container">
    <div class="panel-header d-flex align-center">
      <v-icon size="small" color="teal" class="mr-1">mdi-tray-arrow-down</v-icon>
      <span class="font-weight-bold text-caption text-uppercase">导出与格式配置</span>
      <v-spacer></v-spacer>
      <div v-if="outputDimension" class="text-caption text-medium-emphasis">
        输出尺寸: <strong class="text-teal">{{ outputDimension.width }} × {{ outputDimension.height }}</strong> px
      </div>
    </div>

    <div class="panel-body">
      <v-row dense align="center">
        <!-- 格式选择 -->
        <v-col cols="12" sm="3" md="2">
          <v-select
            v-model="exportConfig.format"
            :items="['PNG', 'JPG', 'WEBP']"
            label="图像格式"
            variant="outlined"
            density="compact"
            hide-details
            color="teal"
          ></v-select>
        </v-col>

        <!-- 分辨率倍率 -->
        <v-col cols="12" sm="4" md="3">
          <v-select
            v-model="exportConfig.scale"
            :items="scaleOptions"
            item-title="label"
            item-value="value"
            label="分辨率倍率"
            variant="outlined"
            density="compact"
            hide-details
            color="teal"
          ></v-select>
        </v-col>

        <!-- 自定义宽高（当选择自定义时展开或并列） -->
        <v-col v-if="exportConfig.scale === 'custom'" cols="6" sm="2" md="2">
          <v-text-field
            v-model.number="exportConfig.customWidth"
            type="number"
            label="宽度 (px)"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="onCustomWidthChange"
          ></v-text-field>
        </v-col>

        <v-col v-if="exportConfig.scale === 'custom'" cols="6" sm="2" md="2">
          <v-text-field
            v-model.number="exportConfig.customHeight"
            type="number"
            label="高度 (px)"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="onCustomHeightChange"
          ></v-text-field>
        </v-col>

        <!-- 质量滑块（针对 JPG / WEBP） -->
        <v-col
          v-if="exportConfig.format !== 'PNG'"
          cols="12"
          sm="5"
          md="3"
        >
          <div class="d-flex align-center px-1">
            <span class="text-caption text-medium-emphasis mr-2" style="white-space: nowrap">
              质量: {{ Math.round(exportConfig.quality * 100) }}%
            </span>
            <v-slider
              v-model="exportConfig.quality"
              :min="0.1"
              :max="1"
              :step="0.05"
              color="teal"
              hide-details
              density="compact"
            ></v-slider>
          </div>
        </v-col>

        <v-spacer></v-spacer>

        <!-- 操作按钮组 -->
        <v-col cols="12" sm="auto" class="d-flex align-center gap-2 justify-end">
          <v-btn
            variant="outlined"
            color="teal"
            size="small"
            prepend-icon="mdi-file-code-outline"
            :disabled="!hasValidSvg"
            @click="emit('download-svg')"
          >
            保存 .SVG
          </v-btn>

          <v-btn
            color="teal-darken-1"
            size="small"
            elevation="1"
            prepend-icon="mdi-download"
            :loading="isExporting"
            :disabled="!hasValidSvg"
            @click="emit('download-image')"
          >
            导出 {{ exportConfig.format }} 图像
          </v-btn>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  exportConfig: {
    type: Object,
    required: true
  },
  metadata: {
    type: Object,
    default: () => ({ valid: true, width: 500, height: 500 })
  },
  isExporting: {
    type: Boolean,
    default: false
  },
  hasValidSvg: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'download-image',
  'download-svg'
])

const scaleOptions = [
  { label: '1x (标准 100%)', value: 1 },
  { label: '2x (高清 200%)', value: 2 },
  { label: '3x (超清 300%)', value: 3 },
  { label: '4x (4K 矢量超采样 400%)', value: 4 },
  { label: '自定义像素宽高', value: 'custom' }
]

// 计算当前设置下的实际输出像素尺寸
const outputDimension = computed(() => {
  if (!props.metadata || !props.metadata.width) return null

  const baseW = props.metadata.width || 500
  const baseH = props.metadata.height || 500

  if (props.exportConfig.scale === 'custom') {
    return {
      width: props.exportConfig.customWidth || baseW,
      height: props.exportConfig.customHeight || baseH
    }
  }

  const mult = Number(props.exportConfig.scale) || 1
  return {
    width: Math.round(baseW * mult),
    height: Math.round(baseH * mult)
  }
})

// 宽高联动比例（如果用户修改自定义宽度）
const onCustomWidthChange = (val) => {
  if (!props.metadata?.width || !props.metadata?.height) return
  if (props.exportConfig.lockAspect) {
    const ratio = props.metadata.height / props.metadata.width
    props.exportConfig.customHeight = Math.round(val * ratio)
  }
}

const onCustomHeightChange = (val) => {
  if (!props.metadata?.width || !props.metadata?.height) return
  if (props.exportConfig.lockAspect) {
    const ratio = props.metadata.width / props.metadata.height
    props.exportConfig.customWidth = Math.round(val * ratio)
  }
}
</script>

<style scoped lang="scss">
.export-panel-container {
  background-color: #ffffff;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding: 10px 16px;
  z-index: 10;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.02);

  .panel-header {
    margin-bottom: 8px;
    color: #475569;
  }

  .gap-2 {
    gap: 8px;
  }
}

.v-theme--dark {
  .export-panel-container {
    background-color: #18181b;
    border-top: 1px solid rgba(255, 255, 255, 0.08);

    .panel-header {
      color: #a1a1aa;
    }
  }
}
</style>
