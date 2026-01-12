<template>
  <v-card class="ai-generator-pro" elevation="4">
    <div class="tool-container" :class="{ 'is-dark': isDark }">

      <!-- 左侧：表单配置区 (Material 结构) -->
      <section class="config-section">
        <v-card-item class="px-0">
          <template v-slot:prepend>
            <div class="brand-icon">
              <v-icon color="teal">mdi-brain-sparkle</v-icon>
            </div>
          </template>
          <v-card-title class="text-h6 font-weight-bold">CO-STAR 智库</v-card-title>
          <v-card-subtitle>构建大师级 AI 提示词</v-card-subtitle>
        </v-card-item>

        <div class="scroll-area pa-1">
          <div class="input-group">
            <div class="group-label"><v-chip size="x-small" color="teal" class="mr-1">R</v-chip> 角色设定</div>
            <v-text-field
                v-model="form.role"
                placeholder="如：资深 Python 开发者"
                variant="outlined"
                density="comfortable"
                color="teal"
                class="apple-input"
                hide-details
            ></v-text-field>
          </div>

          <div class="input-group">
            <div class="group-label"><v-chip size="x-small" color="teal" class="mr-1">O</v-chip> 核心任务</div>
            <v-textarea
                v-model="form.objective"
                placeholder="你想让 AI 帮你完成什么？"
                variant="outlined"
                rows="3"
                color="teal"
                class="apple-input"
                hide-details
            ></v-textarea>
          </div>

          <v-row dense>
            <v-col cols="6">
              <div class="input-group">
                <div class="group-label">风格 (Style)</div>
                <v-select
                    v-model="form.style"
                    :items="styles"
                    variant="outlined"
                    density="comfortable"
                    color="teal"
                    hide-details
                ></v-select>
              </div>
            </v-col>
            <v-col cols="6">
              <div class="input-group">
                <div class="group-label">语调 (Tone)</div>
                <v-select
                    v-model="form.tone"
                    :items="tones"
                    variant="outlined"
                    density="comfortable"
                    color="teal"
                    hide-details
                ></v-select>
              </div>
            </v-col>
          </v-row>

          <!-- 高级折叠面板 -->
          <v-expansion-panels variant="accordion" class="mt-4 apple-panels">
            <v-expansion-panel elevation="0">
              <v-expansion-panel-title class="text-teal font-weight-bold px-0">
                补充上下文 & 格式 (Context / Response)
              </v-expansion-panel-title>
              <v-expansion-panel-text class="px-0">
                <v-textarea v-model="form.context" label="背景信息" variant="underlined" color="teal" rows="2" class="mb-2"></v-textarea>
                <v-text-field v-model="form.response" label="输出格式 (如 JSON)" variant="underlined" color="teal"></v-text-field>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </section>

      <!-- 右侧：实时预览区 (Apple 动效核心) -->
      <section class="preview-section">
        <div class="preview-card shadow-2xl">
          <div class="preview-header">
            <span class="status-dot"></span>
            <span class="text-overline">Live Prompt Preview</span>
            <v-spacer />
            <v-btn icon="mdi-content-copy" size="small" variant="text" color="teal" @click="copyPrompt"></v-btn>
          </div>

          <div class="preview-body">
            <transition-group name="staggered-fade">
              <div v-for="(item, key) in promptParts" :key="key" class="prompt-segment" >
                <div class="segment-title">{{ item.label }}</div>
                <div class="segment-content">{{ item.value }}</div>
              </div>
            </transition-group>

            <div v-if="!hasContent" class="empty-preview">
              <v-icon size="64" class="mb-4 opacity-20">mdi-text-box-search-outline</v-icon>
              <p>在左侧输入，见证奇迹发生</p>
            </div>
          </div>

          <div class="preview-footer">
            <v-btn
                block
                color="teal"
                size="x-large"
                class="copy-btn"
                :disabled="!hasContent"
                @click="copyPrompt"
            >
              一键复制全套指令
            </v-btn>
          </div>
        </div>
      </section>

    </div>

    <!-- 极简通知 -->
    <v-snackbar v-model="copied" color="teal-darken-3" rounded="pill" elevation="12">
      <div class="text-center w-100 font-weight-bold">
        <v-icon class="mr-2">mdi-check-all</v-icon> 提示词已准备就绪！
      </div>
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

const isDark = ref(false);
const copied = ref(false);

const form = reactive({
  role: '',
  objective: '',
  style: '专业严谨',
  tone: '客观中立',
  context: '',
  response: ''
});

const styles = ['专业严谨', '创意发散', '极简主义', '教学启发'];
const tones = ['客观中立', '热情友好', '犀利幽默', '权威正式'];

const promptParts = computed(() => [
  { label: 'ROLE', value: form.role },
  { label: 'OBJECTIVE', value: form.objective },
  { label: 'STYLE', value: form.style },
  { label: 'TONE', value: form.tone },
  { label: 'CONTEXT', value: form.context },
  { label: 'RESPONSE', value: form.response }
]);

const hasContent = computed(() => form.role || form.objective);

const copyPrompt = () => {
  const fullText = promptParts.value
      .filter(p => p.value)
      .map(p => `# ${p.label}\n${p.value}`)
      .join('\n\n');

  navigator.clipboard.writeText(fullText);
  copied.value = true;
};
</script>

<style scoped lang="scss">
$apple-ease: cubic-bezier(0.16, 1, 0.3, 1);

.ai-generator-pro {
  border-radius: 28px !important;
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), 0.1);
}

.tool-container {
  display: grid;
  grid-template-columns: 400px 1fr;
  background: var(--v-theme-surface);
  min-height: 650px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
}

// 左侧配置区
.config-section {
  padding: 32px;
  border-right: 1px solid rgba(var(--v-border-color), 0.08);
  display: flex;
  flex-direction: column;

  .brand-icon {
    background: rgba(0, 150, 136, 0.1);
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.input-group {
  margin-bottom: 20px;
  .group-label {
    font-size: 0.75rem;
    font-weight: 700;
    margin-bottom: 8px;
    color: #009688;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
}

// Apple 风格输入框增强
:deep(.v-field) {
  border-radius: 12px !important;
  transition: all 0.3s $apple-ease !important;
  background: rgba(var(--v-theme-on-surface), 0.02) !important;

  &:hover {
    background: rgba(var(--v-theme-on-surface), 0.05) !important;
  }

  &.v-field--focused {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 150, 136, 0.1);
  }
}

// 右侧预览区
.preview-section {
  background: linear-gradient(135deg, rgba(0,150,136,0.05) 0%, rgba(0,150,136,0.1) 100%);
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-card {
  width: 100%;
  max-width: 500px;
  background: white;
  border-radius: 24px;
  height: 550px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 30px 60px rgba(0,0,0,0.12);
  overflow: hidden;
  transition: all 0.5s $apple-ease;

  .v-theme--dark & {
    background: #1a1a1a;
  }
}

.preview-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(0,0,0,0.05);

  .status-dot {
    width: 8px;
    height: 8px;
    background: #4caf50;
    border-radius: 50%;
    margin-right: 10px;
    box-shadow: 0 0 10px #4caf50;
    animation: blink 2s infinite;
  }
}

.preview-body {
  flex-grow: 1;
  padding: 24px;
  overflow-y: auto;
  font-family: 'Inter', system-ui, sans-serif;

  .prompt-segment {
    margin-bottom: 20px;
    animation: slideIn 0.5s $apple-ease forwards;

    .segment-title {
      font-size: 0.65rem;
      font-weight: 800;
      color: #009688;
      margin-bottom: 4px;
    }
    .segment-content {
      font-size: 0.95rem;
      line-height: 1.6;
      color: rgba(var(--v-theme-on-surface), 0.8);
    }
  }
}

.preview-footer {
  padding: 20px;
  background: rgba(var(--v-theme-surface), 0.8);
  backdrop-filter: blur(10px);
}

.copy-btn {
  border-radius: 16px !important;
  font-weight: 700 !important;
  text-transform: none !important;
  letter-spacing: 0.5px;
  transition: all 0.3s $apple-ease !important;
  box-shadow: 0 10px 20px rgba(0, 150, 136, 0.2) !important;

  &:active { transform: scale(0.96); }
}

// 丝滑动画
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(15px); }
  to { opacity: 1; transform: translateX(0); }
}

// 列表过渡动画
.staggered-fade-enter-active {
  transition: all 0.5s $apple-ease;
}
.staggered-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.empty-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(var(--v-theme-on-surface), 0.3);
}
</style>