<template>
  <v-container fluid class="tool-grid-container">
    <!-- 工具网格 -->
    <div v-if="tools.length > 0" class="tools-wrapper">
      <div class="tool-grid">
        <ToolCard
          v-for="tool in tools"
          :key="tool.code"
          :tool="tool"
          class="tool-card-item"
        />
      </div>
    </div>

    <!-- 空状态 - 欢迎界面 -->
    <div v-else class="welcome-wrapper">
      <div class="welcome-content">
        <v-icon size="96" color="primary" class="welcome-icon">mdi-toolbox-outline</v-icon>
        <h2 class="text-h3 font-weight-bold mb-3 welcome-title">Web Office Toolbox</h2>
        <div class="text-h6 mb-4 text-grey-darken-2 welcome-subtitle">
          办公工具箱架构已就绪
        </div>
        <div class="text-body-1 text-grey mb-6 welcome-description">
          系统已包含完整的工具模块化架构，支持自动注册和热插拔。<br>
          开发者可以在此基础上快速添加具体工具功能。
        </div>
        <v-btn
            color="primary"
            variant="outlined"
            size="large"
            href="https://github.com/your-repo/webofficetoolbox"
            target="_blank"
            prepend-icon="mdi-github"
            class="doc-btn"
        >
          查看开发文档
        </v-btn>
      </div>
    </div>
  </v-container>
</template>
-------

<file_content path="src/components/ToolGrid.vue">
<template>
  <v-container fluid class="tool-grid-container">
    <!-- 工具网格 -->
    <div v-if="tools.length > 0" class="tools-wrapper">
      <div class="tool-grid">
        <ToolCard
          v-for="tool in tools"
          :key="tool.code"
          :tool="tool"
          class="tool-card-item"
        />
      </div>
    </div>

    <!-- 空状态 - 欢迎界面 -->
    <div v-else class="welcome-wrapper">
      <div class="welcome-content">
        <v-icon size="96" color="primary" class="welcome-icon">mdi-toolbox-outline</v-icon>
        <h2 class="text-h3 font-weight-bold mb-3 welcome-title">Web Office Toolbox</h2>
        <div class="text-h6 mb-4 text-grey-darken-2 welcome-subtitle">
          办公工具箱架构已就绪
        </div>
        <div class="text-body-1 text-grey mb-6 welcome-description">
          系统已包含完整的工具模块化架构，支持自动注册和热插拔。<br>
          开发者可以在此基础上快速添加具体工具功能。
        </div>
        <v-btn
            color="primary"
            variant="outlined"
            size="large"
            href="https://github.com/your-repo/webofficetoolbox"
            target="_blank"
            prepend-icon="mdi-github"
            class="doc-btn"
        >
          查看开发文档
        </v-btn>
      </div>
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ToolCard from './ToolCard.vue'
import { api } from '../services/api'

const tools = ref([])

onMounted(async () => {
  try {
    const data = await api.getTools()
    // 过滤启用的工具
    tools.value = data.filter(tool => tool.enabled !== false)
  } catch (error) {
    console.error('Failed to fetch tools:', error)
    // 如果 API 失败，显示欢迎界面
    tools.value = []
  }
})
</script>

<style scoped>
.tool-grid-container {
  width: 100%;
  padding: 0;
}

/* 工具网格布局 */
.tools-wrapper {
  width: 100%;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 0;
}

.tool-card-item {
  width: 100%;
  transition: all 0.3s ease;
}

.tool-card-item:hover {
  transform: translateY(-4px);
}

/* 欢迎界面样式 */
.welcome-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 40px 20px;
}

.welcome-content {
  text-align: center;
  max-width: 600px;
  width: 100%;
}

.welcome-icon {
  animation: float 4s ease-in-out infinite;
  filter: drop-shadow(0 4px 12px rgba(0, 150, 136, 0.3));
}

.welcome-title {
  background: linear-gradient(135deg, #009688 0%, #00796b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.welcome-subtitle {
  font-weight: 500;
}

.welcome-description {
  line-height: 1.7;
}

.doc-btn {
  margin-top: 8px;
  min-height: 44px;
  padding: 0 24px;
  font-weight: 600;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-10px) rotate(3deg);
  }
}

/* PC端大屏幕优化 */
@media (min-width: 1400px) {
  .tool-grid {
    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
    gap: 32px;
    padding: 20px;
  }

  .welcome-wrapper {
    min-height: 400px;
    padding: 60px 40px;
  }

  .welcome-content {
    max-width: 700px;
  }

  .welcome-icon {
    transform: scale(1.1);
  }

  .welcome-title {
    font-size: 2.5rem !important;
  }

  .welcome-subtitle {
    font-size: 1.25rem !important;
  }

  .welcome-description {
    font-size: 1.1rem !important;
  }
}

@media (min-width: 1200px) and (max-width: 1399px) {
  .tool-grid {
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 28px;
    padding: 16px;
  }

  .welcome-wrapper {
    min-height: 350px;
    padding: 50px 30px;
  }

  .welcome-title {
    font-size: 2.2rem !important;
  }
}

@media (min-width: 769px) and (max-width: 1199px) {
  .tool-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    padding: 12px;
  }

  .welcome-wrapper {
    min-height: 320px;
    padding: 40px 24px;
  }

  .welcome-title {
    font-size: 1.8rem !important;
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .tool-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 8px;
  }

  .tool-card-item {
    max-width: 100%;
  }

  .welcome-wrapper {
    min-height: 280px;
    padding: 24px 16px;
  }

  .welcome-icon {
    transform: scale(0.9);
    animation: float 3s ease-in-out infinite;
  }

  .welcome-title {
    font-size: 1.5rem !important;
  }

  .welcome-subtitle {
    font-size: 1rem !important;
  }

  .welcome-description {
    font-size: 0.9rem !important;
    line-height: 1.6;
  }

  .doc-btn {
    font-size: 0.9rem !important;
    min-height: 40px;
  }
}

@media (max-width: 480px) {
  .tool-grid {
    gap: 12px;
    padding: 4px;
  }

  .welcome-wrapper {
    padding: 20px 12px;
  }

  .welcome-title {
    font-size: 1.3rem !important;
  }

  .welcome-subtitle {
    font-size: 0.9rem !important;
  }

  .welcome-description {
    font-size: 0.85rem !important;
  }

  .doc-btn {
    font-size: 0.85rem !important;
    padding: 0 16px;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .welcome-icon {
    filter: drop-shadow(0 4px 12px rgba(0, 150, 136, 0.5));
  }
}

[data-theme="dark"] .welcome-icon {
  filter: drop-shadow(0 4px 12px rgba(0, 150, 136, 0.5));
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .welcome-title {
    -webkit-text-fill-color: #00695c;
    background: #00695c;
  }

  .doc-btn {
    border-width: 2px !important;
  }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .welcome-icon {
    animation: none;
  }

  .tool-card-item,
  .doc-btn {
    transition: none !important;
  }
}

/* 工具卡片入场动画 */
.tool-card-item {
  animation: slideUp 0.5s ease-out backwards;
}

.tool-card-item:nth-child(1) { animation-delay: 0.05s; }
.tool-card-item:nth-child(2) { animation-delay: 0.1s; }
.tool-card-item:nth-child(3) { animation-delay: 0.15s; }
.tool-card-item:nth-child(4) { animation-delay: 0.2s; }
.tool-card-item:nth-child(5) { animation-delay: 0.25s; }
.tool-card-item:nth-child(6) { animation-delay: 0.3s; }

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式网格断点 */
@media (max-width: 1024px) {
  .tool-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
}

@media (max-width: 640px) {
  .tool-grid {
    grid-template-columns: 1fr;
  }
}

/* 确保网格容器不会溢出 */
.tool-grid {
  max-width: 100%;
  box-sizing: border-box;
}

/* 优化滚动区域 */
.tool-grid-container {
  overflow-x: hidden;
}

/* 欢迎界面的最大宽度限制 */
.welcome-content {
  max-width: 100%;
  box-sizing: border-box;
}

/* 确保按钮有合适的点击区域 */
.doc-btn {
  margin-top: 12px;
}

/* 工具卡片悬停效果增强 */
.tool-card-item:hover {
  transform: translateY(-6px) scale(1.02);
  z-index: 2;
}

/* 移动端工具卡片优化 */
@media (max-width: 768px) {
  .tool-card-item:hover {
    transform: translateY(-4px) scale(1.01);
  }
}
</style>
</file_content>
</replace_in_file>

[Response interrupted by a tool use result. Only one tool may be active at a time

<script setup>
import { ref, onMounted } from 'vue'
import ToolCard from './ToolCard.vue'
import { api } from '../services/api'

const tools = ref([])

onMounted(async () => {
  try {
    const data = await api.getTools()
    // 过滤启用的工具
    tools.value = data.filter(tool => tool.enabled !== false)
  } catch (error) {
    console.error('Failed to fetch tools:', error)
    // 如果 API 失败，显示欢迎界面
    tools.value = []
  }
})
</script>

<style scoped>
.tool-grid {
  max-width: 100%;
  margin: 0 auto;
  padding: 20px 40px;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 工具卡片入场动画 */
.tool-grid-enter-active,
.tool-grid-leave-active {
  transition: all 0.5s ease;
}

.tool-grid-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.tool-grid-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 响应式间距调整 */
@media (max-width: 768px) {
  .tool-grid {
    padding: 16px 20px;
  }

  .mb-6 {
    margin-bottom: 20px !important;
  }
}

@media (max-width: 480px) {
  .tool-grid {
    padding: 12px 16px;
  }

  .mb-6 {
    margin-bottom: 16px !important;
  }
}

/* 大屏幕优化 */
@media (min-width: 1400px) {
  .tool-grid {
    padding: 30px 60px;
  }

  .mb-6 {
    margin-bottom: 32px !important;
  }
}
</style>
