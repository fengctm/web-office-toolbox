<template>
  <v-card class="svg-to-image-app" elevation="0">
    <!-- 顶部工具栏：Apple 风格的模糊背景 -->
    <v-toolbar color="rgba(255,255,255,0.8)" flat class="app-bar-blur">
      <v-icon color="teal" class="ml-4">mdi-svg</v-icon>
      <v-toolbar-title class="text-subtitle-1 font-weight-bold">SVG 图像转换器</v-toolbar-title>
      <v-spacer></v-spacer>

      <!-- 快速操作按钮组 -->
      <v-btn variant="text" icon="mdi-help-circle-outline" @click="handleHelp"></v-btn>
    </v-toolbar>

    <v-divider></v-divider>

    <v-row no-gutters class="app-content">
      <!-- 1. 输入区域：编辑器风格 -->
      <v-col cols="12" md="5" class="input-section pa-4">
        <div class="section-header d-flex align-center mb-3">
          <span class="text-overline teal--text">SVG 源代码</span>
          <v-spacer></v-spacer>
          <v-btn size="x-small" variant="tonal" color="teal" @click="handleClear">清空</v-btn>
        </div>

        <v-textarea
            v-model="svgCode"
            placeholder="在此粘贴 <svg> 代码..."
            variant="outlined"
            class="code-editor"
            density="comfortable"
            no-resize
            hide-details
            bg-color="grey-lighten-5"
            color="teal"
            @input="handleSvgInput"
        ></v-textarea>

        <div class="export-settings mt-6">
          <span class="text-overline mb-2 d-block">导出配置</span>
          <v-row dense align="center">
            <v-col cols="6">
              <v-select
                  v-model="exportFormat"
                  :items="['PNG', 'JPG', 'WEBP']"
                  label="目标格式"
                  variant="outlined"
                  density="compact"
                  hide-details
              ></v-select>
            </v-col>
            <v-col cols="6">
              <v-btn
                  block
                  color="teal-darken-1"
                  prepend-icon="mdi-download"
                  @click="handleDownloadImage"
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
              class="mt-3"
              @click="handleDownloadSvg"
          >
            保存为 .svg 文件
          </v-btn>
        </div>
      </v-col>

      <!-- 2. 预览区域：巨大展示 -->
      <v-col cols="12" md="7" class="preview-section pa-4">
        <div class="section-header d-flex align-center mb-3">
          <span class="text-overline">实时预览</span>
          <v-spacer></v-spacer>
          <v-btn
              size="small"
              variant="text"
              icon="mdi-fullscreen"
              @click="isFullscreen = true"
          ></v-btn>
        </div>

        <!-- 棋盘格背景预览容器 -->
        <div class="preview-canvas-wrapper" @click="isFullscreen = true">
          <div class="checkerboard-bg"></div>
          <div class="svg-render-container" v-html="svgCode" ref="previewBox"></div>

          <!-- 空状态提示 -->
          <div v-if="!svgCode" class="empty-placeholder">
            <v-icon size="48" color="grey-lighten-2">mdi-xml</v-icon>
            <p>等待代码输入...</p>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- 3. Apple 风格的全屏预览 (点击预览区触发) -->
    <transition name="apple-zoom">
      <div v-if="isFullscreen" class="fullscreen-overlay" @click="isFullscreen = false">
        <v-btn
            icon="mdi-close"
            class="close-btn"
            variant="flat"
            @click="isFullscreen = false"
        ></v-btn>
        <div class="zoom-content" v-html="svgCode" @click.stop></div>
      </div>
    </transition>

    <!-- Snackbar 通知 -->
    <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        :timeout="snackbar.timeout"
        location="top right"
        class="notification-snackbar"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" icon="mdi-close" @click="snackbar.show = false"></v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'

// --- 状态变量 ---
const svgCode = ref('')
const exportFormat = ref('PNG')
const isFullscreen = ref(false)
const previewBox = ref(null)

// --- 逻辑函数（留空由你实现） ---

/**
 * 处理 SVG 代码输入
 */
const handleSvgInput = () => {
  // 自动去除多余的空白字符和换行，保持代码整洁
  if (svgCode.value) {
    svgCode.value = svgCode.value.trim()
  }
}

/**
 * 下载转换后的图像 (JPG/PNG/WEBP)
 */
const handleDownloadImage = async () => {
  if (!svgCode.value) {
    showSnackbar('请先输入SVG代码', 'warning')
    return
  }

  try {
    // 创建临时容器来解析SVG
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svgCode.value, 'image/svg+xml')
    const svgElement = svgDoc.documentElement

    // 检查解析是否成功
    if (svgElement.nodeName === 'parsererror') {
      throw new Error('SVG代码格式错误，请检查')
    }

    // 获取SVG尺寸，如果没有则使用默认值
    const width = parseInt(svgElement.getAttribute('width')) || 500
    const height = parseInt(svgElement.getAttribute('height')) || 500

    // 创建Canvas
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    // 如果是JPG格式，先填充白色背景
    if (exportFormat.value === 'JPG') {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, width, height)
    }

    // 将SVG转换为图片
    const svgString = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)

      // 转换为指定格式并下载
      const mimeType = {
        'PNG': 'image/png',
        'JPG': 'image/jpeg',
        'WEBP': 'image/webp'
      }[exportFormat.value]

      canvas.toBlob((blob) => {
        const downloadUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = `converted.${exportFormat.value.toLowerCase()}`
        link.click()
        URL.revokeObjectURL(downloadUrl)
        showSnackbar('图片下载成功！', 'success')
      }, mimeType, 0.95)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      throw new Error('SVG渲染失败，请检查代码')
    }

    img.src = url

  } catch (error) {
    console.error('转换失败:', error)
    showSnackbar(error.message || '转换失败', 'error')
  }
}

/**
 * 将当前输入的代码下载为 .svg 文件
 */
const handleDownloadSvg = () => {
  if (!svgCode.value) {
    showSnackbar('请先输入SVG代码', 'warning')
    return
  }

  try {
    const blob = new Blob([svgCode.value], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'image.svg'
    link.click()
    URL.revokeObjectURL(url)
    showSnackbar('SVG文件下载成功！', 'success')
  } catch (error) {
    console.error('下载失败:', error)
    showSnackbar('下载失败', 'error')
  }
}

/**
 * 清空输入
 */
const handleClear = () => {
  svgCode.value = ''
  showSnackbar('已清空输入', 'info')
}

/**
 * 帮助信息
 */
const handleHelp = () => {
  const helpText = `
使用说明：
1. 在左侧粘贴SVG代码（以 <svg> 开头）
2. 右侧实时预览效果
3. 选择导出格式（PNG/JPG/WEBP）
4. 点击"下载图像"转换并下载
5. 点击"保存为.svg文件"下载原始代码

提示：
- JPG格式会自动添加白色背景
- 点击预览区可全屏查看
- 支持深色模式
- 所有处理在本地完成，保护隐私
  `.trim()
  
  alert(helpText)
}

// Snackbar 通知系统
const snackbar = ref({
  show: false,
  message: '',
  color: 'info',
  timeout: 3000
})

const showSnackbar = (message, type = 'info') => {
  snackbar.value = {
    show: true,
    message,
    color: type === 'success' ? 'success' : 
           type === 'error' ? 'error' : 
           type === 'warning' ? 'warning' : 'info',
    timeout: 3000
  }
}
</script>

<style scoped lang="scss">
.svg-to-image-app {
  border-radius: 16px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

// Apple 风格模糊工具栏
.app-bar-blur {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.app-content {
  flex: 1;
  overflow: hidden;
}

.input-section {
  border-right: 1px solid rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
}

.code-editor {
  flex: 1;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;

  :deep(.v-field__input) {
    padding: 12px !important;
  }
}

// 预览容器
.preview-section {
  background-color: #f9f9f9;
  display: flex;
  flex-direction: column;
}

.preview-canvas-wrapper {
  flex: 1;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.05);
  cursor: zoom-in;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.005);
  }
}

// 经典的棋盘格背景
.checkerboard-bg {
  position: absolute;
  inset: 0;
  background-image:
      linear-gradient(45deg, #eee 25%, transparent 25%),
      linear-gradient(-45deg, #eee 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #eee 75%),
      linear-gradient(-45deg, transparent 75%, #eee 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  z-index: 0;
}

.svg-render-container {
  position: relative;
  z-index: 1;
  max-width: 90%;
  max-height: 90%;
  display: flex;
  align-items: center;
  justify-content: center;

  :deep(svg) {
    width: 100%;
    height: auto;
    filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1));
  }
}

.empty-placeholder {
  position: absolute;
  text-align: center;
  z-index: 2;
  color: #999;
}

// 全屏预览
.fullscreen-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.95);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(20px);

  .close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 10;
  }

  .zoom-content {
    max-width: 80vw;
    max-height: 80vh;
    :deep(svg) {
      width: 100%;
      height: 100%;
    }
  }
}

// Apple 缩放动画
.apple-zoom-enter-active, .apple-zoom-leave-active {
  transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}
.apple-zoom-enter-from, .apple-zoom-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* 深色模式适配 */
:root[data-theme="dark"] {
  .svg-to-image-app { background-color: #1e1e1e; }
  .app-bar-blur { background-color: rgba(30,30,30,0.8); border-color: rgba(255,255,255,0.1); }
  .preview-section { background-color: #121212; }
  .checkerboard-bg { background-image:
      linear-gradient(45deg, #252525 25%, transparent 25%),
      linear-gradient(-45deg, #252525 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #252525 75%),
      linear-gradient(-45deg, transparent 75%, #252525 75%); }
  .code-editor { :deep(.v-field) { background-color: #2d2d2d !important; } }
  .fullscreen-overlay { background: rgba(18, 18, 18, 0.95); }
}

@media (max-width: 960px) {
  .app-content { overflow-y: auto; }
  .preview-canvas-wrapper { min-height: 300px; }
}
</style>
