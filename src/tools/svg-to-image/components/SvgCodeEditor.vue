<template>
  <div class="svg-code-editor-container">
    <!-- 编辑器顶部工具栏 -->
    <div class="editor-toolbar">
      <div class="d-flex align-center">
        <v-icon size="small" color="teal" class="mr-1">mdi-code-tags</v-icon>
        <span class="toolbar-title font-weight-bold text-caption text-uppercase">SVG 源代码</span>
      </div>

      <v-spacer></v-spacer>

      <div class="toolbar-actions d-flex align-center gap-1">
        <!-- 示例代码下拉菜单 -->
        <v-menu location="bottom end">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              size="x-small"
              variant="tonal"
              color="teal"
              prepend-icon="mdi-shape-outline"
              class="text-none"
            >
              示例模板
              <v-icon end size="small">mdi-chevron-down</v-icon>
            </v-btn>
          </template>
          <v-list density="compact" elevation="4">
            <v-list-item
              v-for="(sample, index) in SAMPLE_SVGS"
              :key="index"
              :title="sample.title"
              @click="loadSample(sample)"
            >
              <template #prepend>
                <v-icon size="small" color="teal">mdi-file-code-outline</v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-menu>

        <!-- 上传 SVG -->
        <v-tooltip text="导入本地 .svg 文件" location="top">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              size="x-small"
              variant="text"
              icon="mdi-upload"
              @click="triggerUpload"
            ></v-btn>
          </template>
        </v-tooltip>
        <input
          ref="fileInputRef"
          type="file"
          accept=".svg,image/svg+xml"
          style="display: none"
          @change="handleFileUpload"
        />

        <!-- 美化 / 格式化 -->
        <v-tooltip text="格式化 / 美化 XML 结构" location="top">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              size="x-small"
              variant="text"
              icon="mdi-code-json"
              color="teal"
              @click="handleFormat"
            ></v-btn>
          </template>
        </v-tooltip>

        <!-- 压缩 -->
        <v-tooltip text="代码压缩（去除多余空格换行）" location="top">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              size="x-small"
              variant="text"
              icon="mdi-arrow-collapse-all"
              @click="handleMinify"
            ></v-btn>
          </template>
        </v-tooltip>

        <!-- 复制源码 -->
        <v-tooltip text="复制全部代码" location="top">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              size="x-small"
              variant="text"
              icon="mdi-content-copy"
              @click="handleCopy"
            ></v-btn>
          </template>
        </v-tooltip>

        <!-- 清空 -->
        <v-tooltip text="清空内容" location="top">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              size="x-small"
              variant="text"
              icon="mdi-trash-can-outline"
              color="error"
              @click="handleClear"
            ></v-btn>
          </template>
        </v-tooltip>
      </div>
    </div>

    <!-- CodeMirror 编辑器挂载容器 -->
    <div class="editor-wrapper" ref="editorContainerRef"></div>

    <!-- 语法错误提示浮层（如果有错误） -->
    <div v-if="validationError" class="editor-error-banner">
      <v-icon size="small" color="error" class="mr-1">mdi-alert-circle</v-icon>
      <span class="text-caption text-truncate" :title="validationError">
        {{ validationError }}
      </span>
    </div>

    <!-- 底部状态统计栏 -->
    <div class="editor-statusbar">
      <div class="d-flex align-center">
        <span
          class="status-indicator mr-2"
          :class="validationError ? 'status-error' : (modelValue ? 'status-success' : 'status-empty')"
        ></span>
        <span class="text-caption text-medium-emphasis">
          {{ validationError ? '语法异常' : (modelValue ? '代码正常' : '就绪') }}
        </span>
      </div>

      <v-spacer></v-spacer>

      <div class="d-flex align-center gap-3 text-caption text-medium-emphasis">
        <span>{{ lineCount }} 行</span>
        <span>{{ charCount }} 字符</span>
        <span>{{ byteSize }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useTheme } from 'vuetify'
import { EditorState, Compartment } from '@codemirror/state'
import { EditorView, basicSetup } from 'codemirror'
import { xml } from '@codemirror/lang-xml'
import { oneDark } from '@codemirror/theme-one-dark'
import { keymap } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { formatSvg, minifySvg, formatBytes, SAMPLE_SVGS } from '../utils/svgUtils.js'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  validationError: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'notify'])

const theme = useTheme()
const editorContainerRef = ref(null)
const fileInputRef = ref(null)
let editorView = null

const themeCompartment = new Compartment()
const isDark = computed(() => theme.global.name.value === 'dark')

// 自定义亮色主题样式
const customLightTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '13px',
    backgroundColor: '#ffffff',
    color: '#1f2937'
  },
  '.cm-content': {
    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Monaco, Consolas, monospace",
    padding: '12px 0'
  },
  '.cm-gutters': {
    backgroundColor: '#f8fafc',
    color: '#94a3b8',
    borderRight: '1px solid #e2e8f0'
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(20, 184, 166, 0.06)'
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(20, 184, 166, 0.12)',
    color: '#0f766e'
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#0d9488'
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: 'rgba(20, 184, 166, 0.25) !important'
  }
})

// 自定义深色主题扩展
const customDarkTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '13px',
    backgroundColor: '#121214'
  },
  '.cm-content': {
    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Monaco, Consolas, monospace",
    padding: '12px 0'
  },
  '.cm-gutters': {
    backgroundColor: '#18181b',
    color: '#71717a',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)'
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.04)'
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(20, 184, 166, 0.2)',
    color: '#2dd4bf'
  }
})

// 统计信息
const lineCount = computed(() => {
  if (!props.modelValue) return 0
  return props.modelValue.split('\n').length
})

const charCount = computed(() => (props.modelValue || '').length)
const byteSize = computed(() => formatBytes(new Blob([props.modelValue || '']).size))

// 初始化 CodeMirror 6
const initEditor = () => {
  if (!editorContainerRef.value) return

  const initialTheme = isDark.value ? [oneDark, customDarkTheme] : customLightTheme

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      const newDoc = update.state.doc.toString()
      if (newDoc !== props.modelValue) {
        emit('update:modelValue', newDoc)
      }
    }
  })

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      basicSetup,
      xml(),
      keymap.of([indentWithTab]),
      themeCompartment.of(initialTheme),
      updateListener,
      EditorView.lineWrapping
    ]
  })

  editorView = new EditorView({
    state,
    parent: editorContainerRef.value
  })
}

// 监听外部 modelValue 变更（如加载示例、格式化等）
watch(
  () => props.modelValue,
  (newVal) => {
    if (editorView) {
      const currentDoc = editorView.state.doc.toString()
      if (newVal !== currentDoc) {
        editorView.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: newVal || '' }
        })
      }
    }
  }
)

// 监听主题切换
watch(
  () => isDark.value,
  (dark) => {
    if (editorView) {
      editorView.dispatch({
        effects: themeCompartment.reconfigure(dark ? [oneDark, customDarkTheme] : customLightTheme)
      })
    }
  }
)

// 工具栏动作
const handleFormat = () => {
  if (!props.modelValue) return
  const formatted = formatSvg(props.modelValue)
  emit('update:modelValue', formatted)
  emit('notify', '代码已格式化美化', 'success')
}

const handleMinify = () => {
  if (!props.modelValue) return
  const minified = minifySvg(props.modelValue)
  emit('update:modelValue', minified)
  emit('notify', '代码已完成压缩', 'success')
}

const handleCopy = async () => {
  if (!props.modelValue) {
    emit('notify', '当前无内容可复制', 'warning')
    return
  }
  try {
    await navigator.clipboard.writeText(props.modelValue)
    emit('notify', 'SVG 代码已复制到剪贴板', 'success')
  } catch (e) {
    emit('notify', '复制失败，请手动选择复制', 'error')
  }
}

const handleClear = () => {
  emit('update:modelValue', '')
  emit('notify', '已清空编辑区', 'info')
}

const loadSample = (sample) => {
  emit('update:modelValue', sample.code)
  emit('notify', `已载入示例：${sample.title}`, 'success')
}

const triggerUpload = () => {
  fileInputRef.value?.click()
}

const handleFileUpload = (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    const content = event.target?.result
    if (typeof content === 'string') {
      emit('update:modelValue', content)
      emit('notify', `已成功读取文件 ${file.name}`, 'success')
    }
  }
  reader.onerror = () => {
    emit('notify', '读取本地 SVG 文件失败', 'error')
  }
  reader.readAsText(file)
  e.target.value = ''
}

onMounted(() => {
  initEditor()
})

onUnmounted(() => {
  if (editorView) {
    editorView.destroy()
  }
})
</script>

<style scoped lang="scss">
.svg-code-editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: #ffffff;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #f8fafc;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  min-height: 42px;

  .toolbar-title {
    color: #475569;
    letter-spacing: 0.5px;
  }

  .gap-1 {
    gap: 4px;
  }
}

.editor-wrapper {
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;

  :deep(.cm-editor) {
    height: 100%;
    outline: none !important;
  }

  :deep(.cm-scroller) {
    font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Monaco, Consolas, monospace;
    overflow: auto;
  }
}

.editor-error-banner {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background-color: #fef2f2;
  border-top: 1px solid #fecaca;
  color: #dc2626;
  font-size: 12px;
  animation: slide-up 0.2s ease-out;
}

.editor-statusbar {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background-color: #f8fafc;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  min-height: 30px;

  .status-indicator {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;

    &.status-success {
      background-color: #10b981;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }
    &.status-error {
      background-color: #ef4444;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
    }
    &.status-empty {
      background-color: #94a3b8;
    }
  }

  .gap-3 {
    gap: 12px;
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 深色模式适配
.v-theme--dark {
  .svg-code-editor-container {
    background-color: #121214;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
  }

  .editor-toolbar {
    background-color: #18181b;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    .toolbar-title {
      color: #a1a1aa;
    }
  }

  .editor-error-banner {
    background-color: rgba(239, 68, 68, 0.15);
    border-top: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171;
  }

  .editor-statusbar {
    background-color: #18181b;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
}
</style>
