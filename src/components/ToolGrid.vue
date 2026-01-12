<template>
  <v-container fluid class="tool-portal-container pa-4 pa-sm-8 pa-md-12">
    <!-- 标题区域：Apple 风格的精致排版 -->
    <v-row class="mb-10 header-section">
      <v-col cols="12" class="text-center">
        <div class="title-wrapper">
          <h1 class="text-h4 text-sm-h2 font-weight-bold gradient-text mb-3">
            Web Office Toolbox
          </h1>
          <div class="subtitle-container">
            <span class="privacy-badge">
              <v-icon size="14" class="mr-1">mdi-shield-check</v-icon>
              隐私安全
            </span>
            <p class="text-subtitle-1 text-medium-emphasis">
              纯前端工具箱 · 本地运行 · 无需上传
            </p>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- 工具网格：带交错进场动画 -->
    <v-row v-if="tools.length > 0" class="tool-grid">
      <v-col
          v-for="(tool, index) in tools"
          :key="tool.code"
          cols="12"
          sm="6"
          md="4"
          lg="3"
          class="tool-card-wrapper"
          :style="{ '--delay': `${index * 0.05}s` }"
      >
        <ToolCard
            :tool="tool"
            @click="$emit('tool-click', tool)"
            class="apple-card"
        />
      </v-col>
    </v-row>

    <!-- 空状态：呼吸感设计 -->
    <v-row v-else justify="center" class="mt-12">
      <v-col cols="12" md="6" class="text-center empty-state">
        <div class="empty-icon-box">
          <v-icon
              size="84"
              color="teal-lighten-3"
              icon="mdi-toolbox-outline"
          />
        </div>
        <h2 class="text-h5 font-weight-bold mt-6 mb-2">暂无可用工具</h2>
        <p class="text-medium-emphasis">请检查配置或尝试搜索其他关键字</p>
      </v-col>
    </v-row>

    <!-- 底部状态：精致的胶囊标签 -->
    <v-row class="mt-12">
      <v-col cols="12" class="text-center">
        <v-chip
            color="teal"
            variant="tonal"
            size="large"
            class="footer-counter"
        >
          <v-icon start icon="mdi-layers-triple-outline" size="18"></v-icon>
          已加载 {{ tools.length }} 款生产力工具
        </v-chip>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import ToolCard from './ToolCard.vue'

defineProps({
  tools: {
    type: Array,
    required: true,
    default: () => []
  }
})

defineEmits(['tool-click'])
</script>

<style scoped lang="scss">
/* Apple 标准缓动曲线 */
$apple-ease: cubic-bezier(0.16, 1, 0.3, 1);

.tool-portal-container {
  max-width: 1600px;
  margin: 0 auto;
}

/* 1. 标题特效 */
.gradient-text {
  background: linear-gradient(135deg, #009688 0%, #004d40 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -1px;
  animation: titleFadeIn 0.8s $apple-ease forwards;
}

.privacy-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(0, 150, 136, 0.1);
  color: #00796b;
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* 2. 卡片交错入场动画 (丝滑核心) */
.tool-card-wrapper {
  opacity: 0;
  transform: translateY(30px) scale(0.98);
  animation: cardEntrance 0.6s $apple-ease forwards;
  animation-delay: var(--delay);
}

@keyframes cardEntrance {
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes titleFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 3. 空状态图标呼吸动画 */
.empty-icon-box {
  animation: floating 4s ease-in-out infinite;
  display: inline-block;
}

@keyframes floating {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

/* 4. 卡片悬浮交互增强 */
.apple-card {
  transition: all 0.4s $apple-ease !important;
  &:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 150, 136, 0.15) !important;
  }
  &:active {
    transform: translateY(-2px) scale(0.98);
  }
}

/* 5. 深色模式适配 */
:deep(.v-theme--dark) {
  .gradient-text {
    background: linear-gradient(135deg, #4db6ac 0%, #009688 100%);
    -webkit-background-clip: text;
  }

  .privacy-badge {
    background: rgba(77, 182, 172, 0.1);
    color: #4db6ac;
  }

  .tool-portal-container {
    background-image: radial-gradient(circle at top right, rgba(0, 150, 136, 0.05), transparent 40%);
  }
}

/* 6. 底部计数器样式 */
.footer-counter {
  border: 1px solid rgba(0, 150, 136, 0.2) !important;
  backdrop-filter: blur(8px);
  font-weight: 600;
  transition: all 0.3s $apple-ease;

  &:hover {
    background: rgba(0, 150, 136, 0.15) !important;
    transform: translateY(-2px);
  }
}

/* 7. 响应式细节调整 */
@media (max-width: 600px) {
  .header-section {
    margin-bottom: 24px;
  }
  .tool-card-wrapper {
    margin-bottom: 12px;
  }
}
</style>