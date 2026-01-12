<template>
  <div class="preview-column">
    <!-- 通用标题栏 -->
    <div class="pane-header">
      <div class="d-flex align-center">
        <v-icon class="mr-2" color="grey" size="small">mdi-file-word-box-outline</v-icon>
        <span class="text-caption font-weight-bold text-medium-emphasis">WORD 预览</span>
      </div>
      <v-btn
          :disabled="!renderedHtml"
          color="teal-darken-1"
          size="x-small"
          variant="flat"
          class="btn-micro-interaction"
          @click="onCopy"
      >
        复制富文本
      </v-btn>
    </div>

    <!-- 预览容器：模拟 A4 纸张环境 -->
    <div class="preview-container">
      <div class="word-paper-shadow">
        <!-- 纸张实体 -->
        <div ref="renderBox" class="word-paper">

          <!-- 渲染的内容 -->
          <div class="document-content" v-html="renderedHtml"></div>

          <!-- 空状态 -->
          <transition name="fade">
            <div v-if="!markdownText" class="empty-state">
              <v-icon
                  :color="isDark ? 'grey-darken-2' : 'grey-lighten-2'"
                  size="56"
              >
                mdi-text-box-search-outline
              </v-icon>
              <p class="text-caption text-medium-emphasis mt-2">
                在左侧输入以开始预览
              </p>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed} from 'vue'
import {useTheme} from 'vuetify'

const props = defineProps({
  markdownText: {
    type: String,
    default: ''
  },
  renderedHtml: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['copy'])

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const onCopy = () => {
  emit('copy')
}
</script>

<style scoped lang="scss">
// Apple 风格的贝塞尔曲线
$apple-ease: cubic-bezier(0.25, 0.1, 0.25, 1);
$apple-ease-out: cubic-bezier(0.42, 0, 0.58, 1);

.preview-column {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: rgba(255, 255, 255, 0.5);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  height: 48px;

  .v-theme--dark & {
    background-color: rgba(30, 30, 30, 0.6);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
}

.preview-container {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  display: flex;
  justify-content: center;
  background-color: #f0f2f5;

  .v-theme--dark & {
    background-color: #0a0a0a;
  }
}

// 纸张容器
.word-paper-shadow {
  width: 100%;
  max-width: 680px;
  height: fit-content;
  min-height: 800px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s $apple-ease, box-shadow 0.3s $apple-ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  }

  .v-theme--dark & {
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
  }
}

// 纸张实体
.word-paper {
  background-color: #ffffff;
  padding: 60px 50px;
  min-height: 800px;
  position: relative;

  .v-theme--dark & {
    background-color: #252526;
    color: #e0e0e0;
  }
}

// 样式渲染
.document-content {
  font-family: "Calibri", "Microsoft YaHei", sans-serif;
  line-height: 1.6;
  color: inherit;

  // 强制换行和溢出处理
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;

  h1, h2, h3, h4 {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    color: inherit;
  }

  h1 {
    border-bottom: 1px solid rgba(var(--v-border-color), 0.3);
    padding-bottom: 8px;
  }

  p {
    margin-bottom: 16px;
    text-align: justify;
  }

  ul, ol {
    margin-bottom: 16px;
    padding-left: 24px;
  }

  blockquote {
    border-left: 4px solid #4caf50;
    padding-left: 16px;
    margin: 16px 0;
    color: rgba(var(--v-theme-on-surface), 0.7);
    background: rgba(var(--v-theme-surface-variant), 0.3);
    padding: 12px;
    border-radius: 0 4px 4px 0;
  }

  code {
    font-family: 'Consolas', 'Monaco', monospace;
    background: rgba(var(--v-theme-surface-variant), 0.5);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9em;
    color: #d81b60;
  }

  pre {
    background: rgba(var(--v-theme-surface-variant), 0.8);
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin-bottom: 16px;

    code {
      background: transparent;
      padding: 0;
      color: inherit;
      display: block;
      white-space: pre-wrap;
    }
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;

    th, td {
      border: 1px solid rgba(var(--v-border-color), 0.4);
      padding: 8px 12px;
      text-align: left;
    }

    th {
      background: rgba(var(--v-theme-primary), 0.1);
    }
  }

  img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
  }

  hr {
    border: 0;
    height: 1px;
    background: rgba(var(--v-border-color), 0.5);
    margin: 24px 0;
  }
}

// 空状态
.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  width: 100%;
}

// 动画
.btn-micro-interaction {
  transition: transform 0.2s $apple-ease, opacity 0.2s;

  &:active {
    transform: scale(0.9);
    opacity: 0.7;
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s $apple-ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>