<template>
  <div class="input-section">
    <div class="section-header d-flex align-center mb-3">
      <span class="text-overline teal--text">SVG 源代码</span>
      <v-spacer></v-spacer>
      <v-btn
          size="x-small"
          variant="tonal"
          color="teal"
          class="btn-micro-interaction"
          @click="onClear"
      >
        清空
      </v-btn>
    </div>

    <v-textarea
        :model-value="svgCode"
        @update:model-value="onSvgInput"
        placeholder="在此粘贴 <svg> 代码..."
        variant="outlined"
        class="code-editor"
        density="comfortable"
        no-resize
        hide-details
        bg-color="grey-lighten-5"
        color="teal"
    ></v-textarea>

    <div class="export-settings mt-6">
      <span class="text-overline mb-2 d-block text-medium-emphasis">导出配置</span>
      <v-row dense align="center">
        <v-col cols="6">
          <v-select
              :model-value="exportFormat"
              @update:model-value="onFormatChange"
              :items="['PNG', 'JPG', 'WEBP']"
              label="目标格式"
              variant="outlined"
              density="compact"
              hide-details
              class="select-transition"
          ></v-select>
        </v-col>
        <v-col cols="6">
          <v-btn
              block
              color="teal-darken-1"
              prepend-icon="mdi-download"
              class="btn-micro-interaction"
              @click="onDownloadImage"
          >
            下载图像
          </v-btn>
        </v-col>
      </v-row>

      <v-btn
          block
          variant="outlined"
          color="teal"
          prepend-icon="mdi-file-code"
          class="mt-3 btn-micro-interaction"
          @click="onDownloadSvg"
      >
        保存为 .svg 文件
      </v-btn>
    </div>
  </div>
</template>

<script setup>
defineProps({
  svgCode: {
    type: String,
    default: ''
  },
  exportFormat: {
    type: String,
    default: 'PNG'
  }
})

const emit = defineEmits([
  'update:svgCode',
  'update:exportFormat',
  'clear',
  'download-image',
  'download-svg'
])

const onSvgInput = (value) => {
  emit('update:svgCode', value)
}

const onFormatChange = (value) => {
  emit('update:exportFormat', value)
}

const onClear = () => {
  emit('clear')
}

const onDownloadImage = () => {
  emit('download-image')
}

const onDownloadSvg = () => {
  emit('download-svg')
}
</script>

<style scoped lang="scss">
// Apple 风格的贝塞尔曲线
$apple-ease: cubic-bezier(0.25, 0.1, 0.25, 1);

.input-section {
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  background-color: #f5f5f7; // Apple 浅灰
  padding: 16px; // 添加内边距防止内容被圆角遮挡
  height: 100%;
  box-sizing: border-box;

  .v-theme--dark & {
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    background-color: #000000;
  }
}

.code-editor {
  flex: 1;
  font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace; // Apple 字体栈
  font-size: 13px;
  border-radius: 12px;
  overflow: hidden;

  :deep(.v-field__input) {
    padding: 16px !important;
    line-height: 1.6;
  }
}

.btn-micro-interaction {
  transition: transform 0.2s $apple-ease, opacity 0.2s;

  &:active {
    transform: scale(0.92);
    opacity: 0.8;
  }
}

.select-transition {
  :deep(.v-field) {
    transition: box-shadow 0.2s $apple-ease;
  }
  :deep(.v-field--focused) {
    box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.2); // Teal 光晕
  }
}

// 深色模式适配
.v-theme--dark {
  .code-editor {
    :deep(.v-field) {
      background-color: #1c1c1e !important;
      color: #fff !important;
    }
    :deep(.v-field__outline) {
      color: rgba(255,255,255,0.2);
    }
  }
}
</style>