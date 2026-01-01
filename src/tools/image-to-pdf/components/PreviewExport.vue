<template>
  <div class="preview-export-section">
    <!-- 标签页切换 -->
    <v-tabs v-model="activeTab" bg-color="primary-container" color="primary" class="mb-4">
      <v-tab value="preview">1. 预览</v-tab>
      <v-tab value="export">2. 导出设置</v-tab>
    </v-tabs>

    <!-- 标签页内容 -->
    <v-window v-model="activeTab">
      <!-- 预览面板 -->
      <v-window-item value="preview" class="bg-surface-variant pa-4">
        <v-row no-gutters>
          <!-- 侧边栏缩略图 -->
          <v-col cols="3" md="2" class="d-none d-sm-block bg-surface-darken-1 overflow-y-auto" style="height: 60vh; opacity: 0.8;">
            <div v-for="(img, index) in imageList" :key="index" class="pa-2 text-center">
              <v-img
                :src="img.preview"
                class="mb-1 cursor-pointer rounded elevation-2"
                @click="scrollToPage(index)"
                aspect-ratio="1"
                cover
              ></v-img>
              <span class="text-caption text-on-surface-variant">{{ index + 1 }}</span>
            </div>
          </v-col>

          <!-- 主预览区域 -->
          <v-col cols="12" sm="9" md="10" class="overflow-y-auto bg-surface pa-4" style="height: 60vh; opacity: 0.85;">
            <div class="pdf-viewer-mock mx-auto">
              <div
                v-for="(img, index) in imageList"
                :key="index"
                :id="'page-' + index"
                class="pdf-page-mock mb-4 elevation-4 bg-surface"
              >
                <div class="page-header text-caption text-on-surface-variant">
                  第 {{ index + 1 }} 页 / 共 {{ imageList.length }} 页
                </div>
                <v-img :src="img.preview" width="100%" contain></v-img>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- 导出设置面板 -->
      <v-window-item value="export" class="pa-4">
        <v-card variant="outlined" class="pa-4">
          <v-row align="center" class="mb-4">
            <!-- 文件名设置 -->
            <v-col cols="12" sm="6">
              <v-text-field
                  :model-value="pdfConfig.fileName"
                  @update:model-value="updateConfig('fileName', $event)"
                  label="文件名"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  suffix=".pdf"
                  prepend-inner-icon="mdi-file-document-edit"
                  color="primary"
              ></v-text-field>
            </v-col>

          <!-- 页面尺寸 -->
          <v-col cols="12" sm="6">
            <v-select
                :model-value="pdfConfig.pageSize"
                @update:model-value="updateConfig('pageSize', $event)"
                label="页面尺寸"
                :items="['A4', '图片原始尺寸', '适应屏幕']"
                variant="outlined"
                density="comfortable"
                hide-details
                prepend-inner-icon="mdi-file"
                color="primary"
            ></v-select>
          </v-col>

          <!-- 压缩质量 -->
          <v-col cols="12" class="mt-2">
            <v-slider
                :model-value="pdfConfig.compressionQuality || 0.92"
                @update:model-value="updateConfig('compressionQuality', $event)"
                label="图片压缩质量"
                min="0.5"
                max="1.0"
                step="0.05"
                thumb-label
                color="primary"
                density="comfortable"
                hide-details
            >
              <template v-slot:append>
                <span class="text-primary font-weight-bold">{{ ((pdfConfig.compressionQuality || 0.92) * 100).toFixed(0) }}%</span>
              </template>
            </v-slider>
            <div class="text-caption text-on-surface-variant mt-1">
              质量越低，文件越小，但图片会变模糊
            </div>
          </v-col>
          </v-row>

          <!-- 说明卡片 -->
          <v-alert
              type="info"
              variant="tonal"
              color="primary"
              class="mb-4"
              icon="mdi-information"
          >
            <div class="text-body-2">
              <strong>页面尺寸说明：</strong><br>
              • A4：标准A4纸张尺寸 (210×297mm)<br>
              • 图片原始尺寸：保持图片原始比例<br>
              • 适应屏幕：自动调整到合适大小
            </div>
          </v-alert>

          <!-- 统计信息 -->
          <v-card variant="flat" class="bg-surface-variant pa-3 mb-4">
            <v-row>
              <v-col cols="6">
                <div class="text-caption text-on-surface-variant">图片数量</div>
                <div class="text-h6 font-weight-bold text-primary">{{ imageList.length }}</div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-on-surface-variant">预计文件大小</div>
                <div class="text-h6 font-weight-bold text-primary">{{ estimatedSize }}</div>
              </v-col>
            </v-row>
          </v-card>

          <!-- 导出按钮 -->
          <v-btn
              block
              color="primary"
              size="x-large"
              prepend-icon="mdi-download"
              @click="exportPdf"
              :loading="isGenerating"
              :disabled="imageList.length === 0"
              class="text-weight-bold"
          >
            {{ isGenerating ? '正在生成 PDF...' : '导出 PDF' }}
          </v-btn>

          <!-- 生成提示 -->
          <div v-if="isGenerating" class="text-center mt-4 text-on-surface-variant">
            <v-progress-circular
                indeterminate
                color="primary"
                class="mr-2"
            ></v-progress-circular>
            正在处理 {{ imageList.length }} 张图片...
          </div>
        </v-card>
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  imageList: {
    type: Array,
    default: () => []
  },
  pdfConfig: {
    type: Object,
    default: () => ({ fileName: '图片转PDF', pageSize: 'A4' })
  },
  isGenerating: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update-config',
  'export-pdf',
  'scroll-to-page'
])

const activeTab = ref('preview')

// 估算文件大小 - 基于压缩质量和实际图片大小
const estimatedSize = computed(() => {
  if (props.imageList.length === 0) return '0 KB'

  // 获取压缩质量（默认0.92）
  const quality = props.pdfConfig.compressionQuality || 0.92

  // 根据实际图片大小估算
  let totalBytes = 0
  props.imageList.forEach(img => {
    if (img.file && img.file.size) {
      // 估算逻辑：
      // 1. 压缩质量影响：quality * 0.8 (经验系数)
      // 2. JPEG压缩比：通常为原始的 30-70%
      // 3. 综合系数：quality * 0.6
      const compressionRatio = quality * 0.6
      totalBytes += img.file.size * compressionRatio
    } else {
      totalBytes += 50 * 1024 // 默认 50KB
    }
  })

  if (totalBytes < 1024 * 1024) {
    return `${(totalBytes / 1024).toFixed(1)} KB`
  } else {
    return `${(totalBytes / 1024 / 1024).toFixed(1)} MB`
  }
})

// 自动文件名生成 - 格式：图片转PDF【图片数量】张
const autoFileName = computed(() => {
  if (props.imageList.length === 0) return '图片转PDF'

  const count = props.imageList.length
  return `图片转PDF【${count}】张`
})

// 当图片数量变化时，自动更新文件名
watch(() => props.imageList.length, (newLength, oldLength) => {
  if (newLength > 0 && newLength !== oldLength) {
    // 只有当用户没有手动修改过文件名时才自动更新
    if (!props.pdfConfig.fileName || props.pdfConfig.fileName.startsWith('图片转PDF')) {
      emit('update-config', 'fileName', autoFileName.value)
    }
  }
}, { immediate: true })

// 更新配置
const updateConfig = (key, value) => {
  emit('update-config', key, value)
}

// 导出 PDF
const exportPdf = () => {
  emit('export-pdf')
}

// 滚动到指定页面
const scrollToPage = (index) => {
  emit('scroll-to-page', index)
  // 切换到预览标签
  activeTab.value = 'preview'
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.pdf-viewer-mock {
  max-width: 500px;
}

.pdf-page-mock {
  width: 100%;
  aspect-ratio: 1 / 1.414; /* A4 比例 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 4px;
}

.page-header {
  padding: 4px 8px;
  background: rgba(var(--v-theme-surface-variant), 1);
  border-bottom: 1px solid rgba(var(--v-theme-outline-variant), 1);
}

/* 自定义滚动条 - 使用主题颜色 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-surface-variant), 1);
}

::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 1);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-primary), 0.8);
}
</style>
