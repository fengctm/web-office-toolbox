<template>
  <v-card class="ai-prompt-tool-card" elevation="2">
    <!-- 头部设计：Material 结构 -->
    <v-card-item class="pb-2">
      <template v-slot:prepend>
        <div class="icon-wrapper">
          <v-icon color="teal" size="28">mdi-auto-fix</v-icon>
        </div>
      </template>
      <v-card-title class="text-h6 font-weight-bold">
        AI 提示词构造器
      </v-card-title>
      <v-card-subtitle>基于 CO-STAR 框架生成精准指令</v-card-subtitle>
    </v-card-item>

    <v-divider class="mx-4 opacity-50"></v-divider>

    <v-card-text class="pa-4">
      <v-row>
        <!-- 左侧：输入区 (Apple 风格的表单平滑过渡) -->
        <v-col cols="12" md="7" class="input-section">
          <div class="section-label mb-4">
            <v-chip size="small" color="teal" variant="flat" class="mr-2">1</v-chip>
            配置核心要素
          </div>

          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                  v-model="form.role"
                  label="扮演角色 (Role)"
                  placeholder="例如：高级前端专家"
                  variant="outlined"
                  color="teal"
                  density="comfortable"
                  class="apple-input"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                  v-model="form.style"
                  :items="styleOptions"
                  label="写作风格 (Style)"
                  variant="outlined"
                  color="teal"
                  density="comfortable"
                  class="apple-input"
              ></v-select>
            </v-col>
            <v-col cols="12">
              <v-textarea
                  v-model="form.context"
                  label="背景上下文 (Context)"
                  placeholder="提供任务的背景信息..."
                  variant="outlined"
                  color="teal"
                  rows="2"
                  auto-grow
                  class="apple-input"
              ></v-textarea>
            </v-col>
            <v-col cols="12">
              <v-textarea
                  v-model="form.objective"
                  label="核心任务 (Objective)"
                  placeholder="你想让 AI 具体做什么？"
                  variant="outlined"
                  color="teal"
                  rows="3"
                  hide-details
                  class="apple-input"
              ></v-textarea>
            </v-col>
          </v-row>

          <!-- 高级选项：折叠面板 (Apple 动画) -->
          <v-expansion-panels variant="accordion" class="mt-4 advanced-panels">
            <v-expansion-panel elevation="0">
              <v-expansion-panel-title class="text-subtitle-2 px-0">
                高级参数 (受众、语调、格式)
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row dense class="pt-2">
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="form.audience" label="目标受众" variant="underlined" color="teal" density="compact"></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="form.tone" label="语调语气" variant="underlined" color="teal" density="compact"></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field v-model="form.response" label="输出格式 (JSON, Markdown, 表格...)" variant="underlined" color="teal" density="compact"></v-text-field>
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>

        <!-- 右侧：预览区 (Material 卡片层级) -->
        <v-col cols="12" md="5">
          <div class="section-label mb-4 d-flex align-center">
            <v-chip size="small" color="teal" variant="flat" class="mr-2">2</v-chip>
            预览与导出
          </div>

          <v-card variant="tonal" color="teal" class="preview-box d-flex flex-column" height="100%">
            <div class="pa-3 d-flex justify-space-between align-center">
              <span class="text-caption font-weight-bold">PROMPT PREVIEW</span>
              <v-btn
                  icon="mdi-content-copy"
                  variant="text"
                  size="small"
                  @click="copyPrompt"
                  :color="copied ? 'success' : 'teal'"
              ></v-btn>
            </div>
            <v-divider></v-divider>
            <v-card-text class="flex-grow-1 overflow-y-auto prompt-content">
              <div v-if="!hasContent" class="text-center py-10 text-grey-darken-1">
                <v-icon size="40" class="mb-2 opacity-20">mdi-text-box-search-outline</v-icon>
                <p class="text-caption">填写左侧表单自动生成</p>
              </div>
              <Transition name="apple-fade">
                <div v-if="hasContent" class="generated-text">
                  {{ fullPrompt }}
                </div>
              </Transition>
            </v-card-text>
            <v-card-actions class="pa-3">
              <v-btn
                  block
                  color="teal"
                  variant="flat"
                  class="apple-btn"
                  @click="resetForm"
              >
                清空重置
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>

    <!-- 底部状态栏 -->
    <v-divider></v-divider>
    <div class="px-4 py-2 d-flex justify-space-between align-center text-caption text-grey">
      <span>Framework: CO-STAR v1.0</span>
      <span>Status: Ready</span>
    </div>

    <!-- 提示通知 -->
    <v-snackbar v-model="copied" timeout="2000" color="success" rounded="pill">
      已成功复制到剪贴板
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';

// 响应式表单数据
const form = reactive({
  role: '',
  context: '',
  objective: '',
  style: '专业且严谨',
  audience: '',
  tone: '',
  response: ''
});

const styleOptions = [
  '专业且严谨', '创意且幽默', '简洁直白', '学术性', '亲和有力', '代码专家风格'
];

const copied = ref(false);

// 逻辑判断是否有内容
const hasContent = computed(() => {
  return form.role || form.context || form.objective;
});

// 计算最终生成的 Prompt (CO-STAR 结构)
const fullPrompt = computed(() => {
  let p = [];
  if (form.role) p.push(`# Role\n${form.role}`);
  if (form.context) p.push(`# Context\n${form.context}`);
  if (form.objective) p.push(`# Objective\n${form.objective}`);
  if (form.style) p.push(`# Style\n${form.style}`);
  if (form.audience) p.push(`# Audience\n${form.audience}`);
  if (form.tone) p.push(`# Tone\n${form.tone}`);
  if (form.response) p.push(`# Response Format\n${form.response}`);

  return p.join('\n\n');
});

// 方法：复制
const copyPrompt = async () => {
  if (!fullPrompt.value) return;
  try {
    await navigator.clipboard.writeText(fullPrompt.value);
    copied.value = true;
  } catch (err) {
    console.error('Failed to copy!', err);
  }
};

// 方法：重置
const resetForm = () => {
  form.role = '';
  form.context = '';
  form.objective = '';
  form.style = '专业且严谨';
  form.audience = '';
  form.tone = '';
  form.response = '';
};
</script>

<style scoped>
/* 1. Apple 风格核心变量 & 动画 */
:deep(.v-card) {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !0important;
}

.apple-fade-enter-active {
  animation: appleEasing 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes appleEasing {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* 2. 布局样式增强 */
.ai-prompt-tool-card {
  border-radius: 16px !important;
  background: var(--v-theme-surface);
  border: 1px solid rgba(var(--v-border-color), 0.08);
}

.icon-wrapper {
  background: rgba(0, 150, 136, 0.1);
  padding: 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-label {
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #00796b;
}

/* 3. 输入组件 Apple 化 */
:deep(.v-field) {
  border-radius: 10px !important;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s !important;
}

:deep(.v-field--focused) {
  transform: scale(1.01);
}

.apple-input :deep(.v-field__outline) {
  --v-field-border-opacity: 0.15;
}

/* 4. 预览框样式 */
.preview-box {
  border-radius: 12px;
  border: 1px dashed rgba(0, 150, 136, 0.3);
  min-height: 300px;
  background-color: rgba(0, 150, 136, 0.02) !important;
}

.prompt-content {
  font-family: 'SF Mono', 'Roboto Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  white-space: pre-wrap;
}

.generated-text {
  color: rgba(var(--v-theme-on-surface), 0.87);
}

/* 5. 按钮 Apple 交互 */
.apple-btn {
  border-radius: 10px !important;
  text-transform: none !important;
  font-weight: 600 !important;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.apple-btn:active {
  transform: scale(0.96);
}

/* 6. 深色模式适配微调 */
:deep(.v-theme--dark) .preview-box {
  background-color: rgba(0, 150, 136, 0.05) !important;
}

.advanced-panels :deep(.v-expansion-panel-title) {
  min-height: 48px !important;
  color: #009688;
}

/* 响应式调整 */
@media (max-width: 600px) {
  .ai-prompt-tool-card {
    border-radius: 0 !important; /* 移动端全屏感 */
  }
}
</style>