<template>
  <v-card class="md-to-word-app" elevation="0">
    <!-- 1. 顶部工具栏 (Apple 玻璃质感) -->
    <v-toolbar color="rgba(255,255,255,0.8)" flat class="app-bar-blur">
      <v-icon color="teal" class="ml-4">mdi-language-markdown</v-icon>
      <v-toolbar-title class="text-subtitle-1 font-weight-bold">Markdown 文档排版</v-toolbar-title>
      <v-spacer></v-spacer>

      <v-btn variant="text" size="small" color="teal" @click="handleLoadDemo" class="mr-2">
        加载示例
      </v-btn>
    </v-toolbar>

    <v-divider></v-divider>

    <v-row no-gutters class="app-content">
      <!-- 2. 左侧：编辑器 -->
      <v-col cols="12" md="6" class="editor-section">
        <div class="section-header d-flex align-center px-4 py-2 bg-grey-lighten-4">
          <span class="text-overline teal--text font-weight-bold">Markdown 编辑器</span>
          <v-spacer></v-spacer>
          <!-- 修正后的清空按钮位置 -->
          <v-tooltip text="清空内容" location="top">
            <template v-slot:activator="{ props }">
              <v-btn
                  v-bind="props"
                  icon="mdi-delete-sweep-outline"
                  size="x-small"
                  variant="text"
                  color="grey-darken-1"
                  @click="handleClear"
                  :disabled="!markdownText"
              ></v-btn>
            </template>
          </v-tooltip>
        </div>

        <v-textarea
            v-model="markdownText"
            placeholder="# 在此输入标题..."
            variant="flat"
            class="md-editor-textarea"
            no-resize
            hide-details
            bg-color="white"
            color="teal"
            @input="handleMdInput"
        ></v-textarea>
      </v-col>

      <!-- 3. 右侧：Word 风格预览区 -->
      <v-col cols="12" md="6" class="preview-section">
        <div class="section-header d-flex align-center px-4 py-2 border-bottom">
          <span class="text-overline">文档预览 (Word 格式)</span>
          <v-spacer></v-spacer>

          <!-- 唯一的主操作按钮 -->
          <v-btn
              prepend-icon="mdi-content-copy"
              color="teal-darken-1"
              size="small"
              variant="flat"
              elevation="1"
              :disabled="!renderedHtml"
              @click="handleCopyRichText"
          >
            复制为富文本
          </v-btn>
        </div>

        <!-- 模拟 A4 纸张预览 -->
        <div class="paper-container">
          <div class="word-paper" ref="renderBox">
            <!-- 最终渲染的 HTML 内容 -->
            <div class="rendered-html-content" v-html="renderedHtml"></div>

            <!-- 空状态提示 -->
            <transition name="fade">
              <div v-if="!markdownText" class="empty-doc-hint">
                <v-icon size="64" color="grey-lighten-3">mdi-text-box-search-outline</v-icon>
                <p class="text-grey-lighten-1 mt-2">输入 Markdown 实时预览</p>
              </div>
            </transition>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { marked } from 'marked'

// --- 状态变量 ---
const markdownText = ref('')
const renderedHtml = ref('')

// --- 逻辑函数 ---

/**
 * 处理 Markdown 输入解析
 */
const handleMdInput = () => {
  if (!markdownText.value) {
    renderedHtml.value = ''
    return
  }

  try {
    // 解析 Markdown。注意：现代版本的 marked 建议直接使用 parse
    renderedHtml.value = marked.parse(markdownText.value, {
      breaks: true,
      gfm: true
    })
  } catch (error) {
    console.error('Markdown 解析失败:', error)
  }
}

/**
 * 复制为富文本
 */
const handleCopyRichText = async () => {
  if (!renderedHtml.value) return

  try {
    // 构造带样式的 HTML，确保 Word 粘贴时能识别基础排版
    const htmlContent = `
      <html>
        <head><meta charset="utf-8"></head>
        <body>
          <div style="font-family: 'Calibri', 'Microsoft YaHei', sans-serif; line-height: 1.5;">
            ${renderedHtml.value}
          </div>
        </body>
      </html>
    `

    if (navigator.clipboard && window.ClipboardItem) {
      const data = [
        new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'text/plain': new Blob([markdownText.value], { type: 'text/plain' })
        })
      ]
      await navigator.clipboard.write(data)
      showNotification('已成功复制，请直接在 Word 中粘贴', 'success')
    } else {
      // 兼容性降级
      await navigator.clipboard.writeText(renderedHtml.value)
      showNotification('环境不支持富文本复制，已复制 HTML 源码', 'warning')
    }
  } catch (error) {
    console.error('复制失败:', error)
    showNotification('复制失败', 'error')
  }
}

const showNotification = (message, type = 'info') => {
  const event = new CustomEvent('show-notification', {
    detail: { message, type }
  })
  window.dispatchEvent(event)
}

const handleClear = () => {
  markdownText.value = ''
  renderedHtml.value = ''
}

const handleLoadDemo = () => {
  markdownText.value = `# 项目报告范本

## 一、项目背景
这是一个 **Markdown 转 Word** 的高效排版方案。

## 二、功能亮点
1. **即时性**：左侧编辑，右侧预览。
2. **高兼容**：支持表格、引用、加粗。
3. **Apple 风格**：丝滑的视觉体验。

> 请点击右上方“复制为富文本”按钮进行测试。

---
*生成时间：${new Date().toLocaleDateString()}*`
  handleMdInput()
}
</script>

<style scoped lang="scss">
.md-to-word-app {
  border-radius: 16px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

.app-bar-blur {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.app-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-section {
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.md-editor-textarea {
  flex: 1;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 14px;

  :deep(.v-field__input) {
    padding: 20px !important;
    line-height: 1.6;
  }
}

.preview-section {
  background-color: #f5f7f9;
  display: flex;
  flex-direction: column;
}

.paper-container {
  flex: 1;
  overflow-y: auto;
  padding: 30px 20px;
  display: flex;
  justify-content: center;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: #d1d1d1; border-radius: 10px; }
}

.word-paper {
  background-color: white;
  width: 100%;
  min-height: 842px; // 模拟 A4 高度比例
  max-width: 700px;
  padding: 60px 80px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  border-radius: 2px;
  position: relative;

  .rendered-html-content {
    font-family: "Calibri", "Microsoft YaHei", sans-serif;
    color: #333;
    line-height: 1.6;

    :deep(h1) { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; font-size: 28px; }
    :deep(h2) { margin-top: 25px; margin-bottom: 15px; font-size: 22px; border-left: 4px solid teal; padding-left: 10px; }
    :deep(p) { margin-bottom: 14px; text-align: justify; }
    :deep(blockquote) { background: #f9f9f9; padding: 15px; border-left: 5px solid #ccc; margin: 20px 0; font-style: italic; }
    :deep(table) { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    :deep(th), :deep(td) { border: 1px solid #ddd; padding: 8px; text-align: left; }
    :deep(th) { background-color: #f2f2f2; }
  }
}

.empty-doc-hint {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.border-bottom {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* 深色模式适配 */
:root[data-theme="dark"] {
  .md-to-word-app { background-color: #1a1a1a; }
  .app-bar-blur { background-color: rgba(26, 26, 26, 0.8); border-color: rgba(255, 255, 255, 0.1); }
  .editor-section { border-color: rgba(255, 255, 255, 0.1); }
  .preview-section { background-color: #121212; }
  .word-paper { box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5); }
}

@media (max-width: 960px) {
  .app-content { flex-direction: column; overflow-y: auto; }
  .editor-section { border-right: none; height: 350px; }
  .word-paper { padding: 40px 30px; }
}
</style>