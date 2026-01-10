<template>
  <div class="editor-column">
    <!-- 通用标题栏 -->
    <div class="pane-header">
      <div class="d-flex align-center">
        <v-icon class="mr-2" color="teal" size="small">mdi-pencil-box-outline</v-icon>
        <span class="text-caption font-weight-bold text-medium-emphasis">MARKDOWN 编辑</span>
      </div>
      <v-tooltip location="bottom" text="清空内容">
        <template v-slot:activator="{ props }">
          <v-btn
              :disabled="!markdownText"
              color="text-medium-emphasis"
              icon="mdi-delete-sweep-outline"
              size="x-small"
              v-bind="props"
              variant="text"
              class="btn-micro-interaction"
              @click="onClear"
          ></v-btn>
        </template>
      </v-tooltip>
    </div>

    <!-- 编辑器容器：手动控制背景 -->
    <div class="editor-container">
      <v-textarea
          :model-value="markdownText"
          @update:model-value="onInput"
          class="md-textarea"
          color="teal"
          hide-details
          no-resize
          placeholder="# 在此输入 Markdown..."
          variant="plain"
          auto-grow
      ></v-textarea>
    </div>
  </div>
</template>

<script setup>
defineProps({
  markdownText: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:markdownText', 'clear'])

const onInput = (value) => {
  emit('update:markdownText', value)
}

const onClear = () => {
  emit('clear')
}
</script>

<style scoped lang="scss">
// Apple 风格的贝塞尔曲线
$apple-ease: cubic-bezier(0.25, 0.1, 0.25, 1);

.editor-column {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid transparent;

  .v-theme--dark & {
    border-right-color: rgba(255,255,255,0.12);
  }
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

.editor-container {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  background-color: #ffffff;

  .v-theme--dark & {
    background-color: #1e1e1e;
  }
}

.md-textarea {
  height: 100% !important;

  :deep(.v-field) {
    height: 100%;
    background: transparent !important;
    box-shadow: none !important;
    border: none;
  }

  :deep(.v-field__input) {
    font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
    font-size: 14px;
    line-height: 1.7;
    padding: 20px !important;

    .v-theme--light & {
      color: #333;
    }
    .v-theme--dark & {
      color: #d4d4d4;
    }
  }
}

.btn-micro-interaction {
  transition: transform 0.2s $apple-ease, opacity 0.2s;
  
  &:active {
    transform: scale(0.9);
    opacity: 0.7;
  }
}
</style>