<template>
  <v-card class="md-to-word-app" elevation="0">
    <!-- 1. 顶部工具栏 -->
    <ToolbarSection @load-demo="handleLoadDemo"/>

    <v-divider class="divider-opacity"></v-divider>

    <!-- 2. 主体内容：对称双栏布局 -->
    <v-row class="app-content" no-gutters>
      <!-- 左侧：编辑器 -->
      <v-col class="section-animate-left" cols="12" md="6">
        <EditorSection
            v-model:markdown-text="markdownText"
            @clear="handleClear"
        />
      </v-col>

      <!-- 分割线 -->
      <v-divider vertical class="divider-opacity" v-if="!$vuetify.display.mobile"></v-divider>
      <v-divider class="divider-opacity" v-else></v-divider>

      <!-- 右侧：预览 -->
      <v-col class="section-animate-right" cols="12" md="6">
        <PreviewSection
            :markdown-text="markdownText"
            :rendered-html="renderedHtml"
            @copy="handleCopyRichText"
        />
      </v-col>
    </v-row>

    <!-- 通用通知组件 -->
    <NotificationSnackbar
        v-model="snackbar.show"
        :message="snackbar.message"
        :color="snackbar.color"
        :timeout="snackbar.timeout"
    />
  </v-card>
</template>

<script setup>
import {onMounted, ref, watch} from 'vue'
import {useMarkdownConverter} from './composables/useMarkdownConverter.js'
import ToolbarSection from './components/ToolbarSection.vue'
import EditorSection from './components/EditorSection.vue'
import PreviewSection from './components/PreviewSection.vue'
import NotificationSnackbar from '@/components/NotificationSnackbar.vue'

// 使用 composable
const {
  markdownText,
  renderedHtml,
  handleMdInput,
  handleCopyRichText: baseHandleCopyRichText,
  handleClear: baseHandleClear,
  handleLoadDemo: baseHandleLoadDemo
} = useMarkdownConverter()

// 通知系统状态
const snackbar = ref({
  show: false,
  message: '',
  color: 'info',
  timeout: 4000
})

// 封装通知方法
const showSnackbar = (message, type = 'info') => {
  snackbar.value = {
    show: true,
    message,
    color: type === 'success' ? 'success' :
        type === 'error' ? 'error' :
            type === 'warning' ? 'warning' : 'info',
    timeout: 4000
  }
}

// 绑定通知系统的处理函数
const handleCopyRichText = () => {
  baseHandleCopyRichText(showSnackbar)
}

const handleClear = () => {
  baseHandleClear(showSnackbar)
}

const handleLoadDemo = () => {
  baseHandleLoadDemo(showSnackbar)
}

// 监听 markdownText 变化自动转换
watch(markdownText, () => {
  handleMdInput()
})

// 组件挂载后加载一次示例
onMounted(() => {
  handleLoadDemo()
})
</script>

<style lang="scss" scoped>
// Apple 风格的贝塞尔曲线
$apple-ease: cubic-bezier(0.25, 0.1, 0.25, 1);
$apple-ease-out: cubic-bezier(0.42, 0, 0.58, 1);

// --- 整体容器 ---
.md-to-word-app {
  border-radius: 20px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgb(var(--v-theme-background));
  transition: background-color 0.3s $apple-ease;
}

// --- 布局主体 ---
.app-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  background-color: #f5f5f7;

  .v-theme--dark & {
    background-color: #000000;
  }
}

// --- 分割线 ---
.divider-opacity {
  opacity: 0.5;

  .v-theme--dark & {
    border-color: rgba(255, 255, 255, 0.12) !important;
  }
}

// --- 动画类 ---
.section-animate-left {
  animation: slide-in-left 0.6s $apple-ease-out both;
  animation-delay: 0.1s;
}

.section-animate-right {
  animation: slide-in-right 0.6s $apple-ease-out both;
  animation-delay: 0.2s;
}

@keyframes slide-in-left {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// --- 响应式 ---
@media (max-width: 960px) {
  .app-content {
    flex-direction: column;
  }

  .section-animate-left {
    height: 400px;
    border-right: none;
    border-bottom: 1px solid rgba(var(--v-border-color), 0.2);
  }
}
</style>