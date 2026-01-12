<template>
  <v-card class="pdf-compress-app" elevation="0">
    <!-- 1. Apple 风格全局加载遮罩 -->
    <LoadingOverlay :visible="state.processing" :status="state.processStatus"/>

    <!-- 2. 顶部工具栏 -->
    <v-toolbar class="app-bar-blur" flat>
      <v-icon class="ml-4 icon-bounce" color="teal">mdi-zip-box</v-icon>
      <v-toolbar-title class="text-subtitle-1 font-weight-bold toolbar-title">
        PDF 极速压缩
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
          v-if="state.file"
          color="text-medium-emphasis"
          icon="mdi-refresh"
          variant="text"
          class="btn-micro-interaction"
          @click="reset"
      ></v-btn>
    </v-toolbar>

    <v-divider class="divider-opacity"></v-divider>

    <div class="app-body">
      <!-- 状态 A: 待上传 -->
      <transition name="slide-up">
        <div v-if="!state.file" class="upload-zone pa-10 fill-height d-flex flex-column align-center justify-center">
          <FileUploadSection
              @file-selected="handleFileSelected"
              @reset="reset"
          />
        </div>

        <!-- 状态 B: 压缩配置区 -->
        <v-container v-else class="config-zone pa-6">
          <v-row>
            <!-- 左侧：基础信息卡片 -->
            <v-col cols="12" md="5">
              <DocumentInfoCard
                  :file-name="state.file.name"
                  :file-size="state.file.size"
                  :page-count="state.pageCount"
                  :password="state.password"
              />
            </v-col>

            <!-- 右侧：压缩配置 -->
            <v-col cols="12" md="7">
              <CompressionConfig
                  v-model:quality="state.quality"
                  :quality-label="qualityLabel"
                  :estimated-size="estimatedSize"
                  :is-dark="isDark"
                  @compress="handleCompress"
              />
            </v-col>
          </v-row>
        </v-container>
      </transition>
    </div>
  </v-card>
</template>

<script setup>
import {computed} from 'vue'
import {useTheme} from 'vuetify'
import {usePdfCompressor} from './composables/usePdfCompressor.js'
import LoadingOverlay from './components/LoadingOverlay.vue'
import FileUploadSection from './components/FileUploadSection.vue'
import DocumentInfoCard from './components/DocumentInfoCard.vue'
import CompressionConfig from './components/CompressionConfig.vue'

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

// 使用 composable
const {
  state,
  qualityLabel,
  estimatedSize,
  handleFileSelected,
  compressPdf,
  reset
} = usePdfCompressor()

// 处理压缩并下载
const handleCompress = async () => {
  try {
    const blob = await compressPdf()

    // 下载
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${state.file.name.replace('.pdf', '')}_compressed.pdf`
    link.click()

    state.processStatus = '完成!'
    setTimeout(() => {
      state.processing = false
    }, 1000)
  } catch (err) {
    alert(err.message)
    state.processing = false
  }
}
</script>

<style lang="scss" scoped>
// Apple 风格的贝塞尔曲线
$apple-ease: cubic-bezier(0.25, 0.1, 0.25, 1);

.pdf-compress-app {
  border-radius: 16px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  transition: background-color 0.3s $apple-ease;
}

// 1. 工具栏样式
.app-bar-blur {
  background-color: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background-color 0.3s $apple-ease, border-color 0.3s $apple-ease;

  .toolbar-title {
    color: #1d1d1f;
    transition: color 0.3s $apple-ease;
  }
}

// 2. 深色模式适配
.v-theme--dark {
  .pdf-compress-app {
    background-color: #000000;
  }

  .app-bar-blur {
    background-color: rgba(30, 30, 30, 0.75);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .toolbar-title {
      color: rgba(255, 255, 255, 0.9);
    }
  }

  .app-body {
    background-color: #121212;
  }

  .divider-opacity {
    border-color: rgba(255, 255, 255, 0.12) !important;
  }
}

// 3. 主体区域
.app-body {
  flex: 1;
  position: relative;
  background-color: #f8f9fa;
}

// 4. Apple 风格微交互动画
.icon-bounce {
  transition: transform 0.4s $apple-ease;

  &:hover {
    transform: rotate(-15deg) scale(1.1);
  }
}

.btn-micro-interaction {
  transition: transform 0.2s $apple-ease;

  &:active {
    transform: scale(0.9);
  }
}

// 5. 动画定义
.slide-up-enter-active {
  transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

// 6. 布局调整
.config-zone {
  max-width: 900px;
  margin: 0 auto;
}

// 7. 兼容旧版深色模式选择器
:root[data-theme="dark"] {
  .pdf-compress-app {
    background-color: #1a1a1a;
  }

  .app-bar-blur {
    background-color: rgba(30, 30, 30, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .app-body {
    background-color: #121212;
  }
}

@media (max-width: 600px) {
  .upload-zone {
    padding: 20px;
  }
}
</style>