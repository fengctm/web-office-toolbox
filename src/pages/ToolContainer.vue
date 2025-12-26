<template>
  <v-container class="tool-container" fluid>
    <PageTransition transition-name="slide">
      <!-- 工具内容 -->
      <div v-if="tool" key="tool-content" class="tool-wrapper">
        <!-- 头部导航 -->
        <div class="tool-header mb-6">
          <div class="header-content">
            <div class="header-left">
              <v-btn
                icon="mdi-arrow-left"
                variant="text"
                size="large"
                @click="goBack"
                class="back-btn mr-2"
              />
              <div class="header-info">
                <div class="d-flex align-center mb-2">
                  <v-icon size="32" color="primary" class="mr-2">{{ tool.icon }}</v-icon>
                  <h1 class="text-h4 font-weight-bold tool-title">{{ tool.name }}</h1>
                  <v-chip
                    color="primary"
                    variant="outlined"
                    size="small"
                    class="ml-3 tool-code"
                  >
                    {{ tool.code }}
                  </v-chip>
                </div>
                <div class="text-body-1 text-grey tool-description">
                  {{ tool.description }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 工具功能区域 -->
        <div class="tool-content-wrapper">
          <v-card class="tool-content-card" elevation="2">
            <v-card-text class="tool-content-text">
              <!-- 这里是实际工具组件的插槽 -->
              <div class="tool-placeholder">
                <v-icon size="80" color="primary" class="mb-4">{{ tool.icon }}</v-icon>
                <div class="text-h5 font-weight-bold mb-2">{{ tool.name }} 功能区域</div>
                <div class="text-body-1 text-grey mb-2">
                  这里是 {{ tool.name }} 的具体功能实现区域
                </div>
                <div class="text-caption text-grey-lighten-1">
                  工具代码: {{ tool.code }}
                </div>

                <!-- 实际工具组件将在这里渲染 -->
                <div class="mt-6 text-body-2 text-grey">
                  提示: 实际工具组件会替换此占位内容
                </div>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-else-if="loading" key="loading" class="state-wrapper">
        <div class="loading-content">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
            class="mb-4"
          />
          <div class="text-h6 mb-2">正在加载工具...</div>
          <div class="text-body-1 text-grey">请稍候</div>
        </div>
      </div>

      <!-- 未找到状态 -->
      <div v-else key="not-found" class="state-wrapper">
        <div class="not-found-content">
          <v-icon size="96" color="grey" class="mb-4">mdi-alert-circle-outline</v-icon>
          <div class="text-h4 font-weight-bold mb-2">工具未找到</div>
          <div class="text-body-1 text-grey mb-6">
            您访问的工具不存在或已禁用
          </div>
          <div class="action-buttons">
            <v-btn
              color="primary"
              size="large"
              @click="goBack"
              prepend-icon="mdi-home"
              class="mr-4"
            >
              返回首页
            </v-btn>
            <v-btn
              variant="outlined"
              size="large"
              @click="goBack"
            >
              返回
            </v-btn>
          </div>
        </div>
      </div>
    </PageTransition>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PageTransition from '../components/PageTransition.vue'
import { api } from '../services/api'

const router = useRouter()
const route = useRoute()
const tool = ref(null)
const loading = ref(true)

const toolCode = computed(() => route.params.tool)

const fetchTool = async () => {
  loading.value = true
  try {
    const data = await api.getTool(toolCode.value)
    tool.value = data
  } catch (error) {
    console.error('Failed to fetch tool:', error)
    tool.value = null
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/')
}

onMounted(() => {
  fetchTool()
})

// 监听路由参数变化
watch(toolCode, () => {
  fetchTool()
})
</script>

<style scoped>
.tool-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  width: 100%;
}

/* 工具包装器 */
.tool-wrapper {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 头部导航样式 */
.tool-header {
  width: 100%;
  background: rgba(0, 150, 136, 0.05);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(0, 150, 136, 0.1);
  backdrop-filter: blur(10px);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
}

.back-btn {
  margin-top: 4px;
  flex-shrink: 0;
}

.header-info {
  flex: 1;
  min-width: 0;
}

.tool-title {
  color: #009688;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.tool-code {
  font-weight: 600;
  flex-shrink: 0;
}

.tool-description {
  line-height: 1.6;
  margin-top: 4px;
}

/* 工具内容区域 */
.tool-content-wrapper {
  width: 100%;
}

.tool-content-card {
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 150, 136, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.tool-content-card:hover {
  box-shadow: 0 8px 30px rgba(0, 150, 136, 0.15);
  transform: translateY(-2px);
}

.tool-content-text {
  padding: 32px;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-placeholder {
  text-align: center;
  max-width: 600px;
  width: 100%;
}

/* 状态包装器 */
.state-wrapper {
  width: 100%;
  max-width: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.loading-content,
.not-found-content {
  text-align: center;
  padding: 40px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 150, 136, 0.1);
  width: 100%;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* PC端大屏幕优化 */
@media (min-width: 1400px) {
  .tool-container {
    padding: 40px;
  }

  .tool-header {
    padding: 28px;
    border-radius: 20px;
  }

  .tool-title {
    font-size: 2rem !important;
  }

  .tool-content-text {
    padding: 48px;
    min-height: 400px;
  }

  .tool-placeholder .v-icon {
    font-size: 96px !important;
  }

  .tool-placeholder .text-h5 {
    font-size: 1.5rem !important;
  }

  .state-wrapper {
    min-height: 500px;
  }

  .loading-content,
  .not-found-content {
    padding: 60px;
  }

  .not-found-content .text-h4 {
    font-size: 2rem !important;
  }
}

@media (min-width: 1200px) and (max-width: 1399px) {
  .tool-container {
    padding: 30px;
  }

  .tool-header {
    padding: 24px;
  }

  .tool-title {
    font-size: 1.75rem !important;
  }

  .tool-content-text {
    padding: 40px;
  }

  .state-wrapper {
    min-height: 450px;
  }
}

@media (min-width: 769px) and (max-width: 1199px) {
  .tool-container {
    padding: 20px;
  }

  .tool-header {
    padding: 20px;
  }

  .tool-title {
    font-size: 1.5rem !important;
  }

  .tool-content-text {
    padding: 32px;
  }

  .state-wrapper {
    min-height: 400px;
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .tool-container {
    padding: 12px;
    justify-content: flex-start;
  }

  .tool-wrapper {
    gap: 16px;
  }

  .tool-header {
    padding: 16px;
    border-radius: 12px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-left {
    width: 100%;
    flex-direction: column;
    gap: 12px;
  }

  .back-btn {
    margin-top: 0;
  }

  .tool-title {
    font-size: 1.25rem !important;
  }

  .tool-code {
    align-self: flex-start;
  }

  .tool-description {
    font-size: 0.9rem !important;
  }

  .tool-content-card {
    border-radius: 12px;
  }

  .tool-content-text {
    padding: 24px 16px;
    min-height: 250px;
  }

  .tool-placeholder .v-icon {
    font-size: 64px !important;
  }

  .tool-placeholder .text-h5 {
    font-size: 1.1rem !important;
  }

  .tool-placeholder .text-body-1 {
    font-size: 0.9rem !important;
  }

  .state-wrapper {
    min-height: 350px;
    padding: 16px;
  }

  .loading-content,
  .not-found-content {
    padding: 24px;
    border-radius: 12px;
  }

  .not-found-content .text-h4 {
    font-size: 1.3rem !important;
  }

  .action-buttons {
    flex-direction: column;
    gap: 8px;
  }

  .action-buttons .v-btn {
    width: 100%;
    margin: 0 !important;
  }
}

@media (max-width: 480px) {
  .tool-container {
    padding: 8px;
  }

  .tool-header {
    padding: 12px;
  }

  .tool-title {
    font-size: 1.1rem !important;
  }

  .tool-content-text {
    padding: 20px 12px;
    min-height: 220px;
  }

  .tool-placeholder .v-icon {
    font-size: 56px !important;
  }

  .tool-placeholder .text-h5 {
    font-size: 1rem !important;
  }

  .state-wrapper {
    min-height: 300px;
  }

  .loading-content,
  .not-found-content {
    padding: 20px;
  }

  .not-found-content .text-h4 {
    font-size: 1.1rem !important;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .tool-header {
    background: rgba(0, 150, 136, 0.1);
    border-color: rgba(0, 150, 136, 0.2);
  }

  .tool-content-card {
    background: rgba(30, 30, 30, 0.95);
    border-color: rgba(0, 150, 136, 0.2);
  }

  .loading-content,
  .not-found-content {
    background: rgba(30, 30, 30, 0.95);
    border-color: rgba(0, 150, 136, 0.2);
  }

  .tool-title {
    color: #4dd0e1;
  }
}

[data-theme="dark"] .tool-header {
  background: rgba(0, 150, 136, 0.1);
  border-color: rgba(0, 150, 136, 0.2);
}

[data-theme="dark"] .tool-content-card {
  background: rgba(30, 30, 30, 0.95);
  border-color: rgba(0, 150, 136, 0.2);
}

[data-theme="dark"] .loading-content,
[data-theme="dark"] .not-found-content {
  background: rgba(30, 30, 30, 0.95);
  border-color: rgba(0, 150, 136, 0.2);
}

[data-theme="dark"] .tool-title {
  color: #4dd0e1;
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .tool-header {
    border-width: 2px;
  }

  .tool-content-card {
    border-width: 2px;
  }

  .tool-title {
    -webkit-text-fill-color: #00695c;
    background: #00695c;
  }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .tool-content-card,
  .back-btn,
  .v-btn {
    transition: none !important;
  }

  .tool-content-card:hover {
    transform: none !important;
  }
}

/* 修复对话框和覆盖层位置问题 */
/* 确保所有 v-dialog 和 v-overlay 都有正确的定位 */
:deep(.v-dialog),
:deep(.v-overlay__content) {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  max-width: 90vw !important;
  max-height: 90vh !important;
  overflow-y: auto !important;
}

/* 修复移动端对话框 */
@media (max-width: 768px) {
  :deep(.v-dialog),
  :deep(.v-overlay__content) {
    max-width: 95vw !important;
    max-height: 95vh !important;
    margin: 0 !important;
  }
}

/* 确保覆盖层不会出现位置漂移 */
:deep(.v-overlay) {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 修复滚动锁定问题 */
:deep(.v-overlay--active) {
  overflow: hidden !important;
}

/* 优化弹窗内容的滚动 */
:deep(.v-dialog__content) {
  overflow-y: auto !important;
  -webkit-overflow-scrolling: touch !important;
}

/* 确保工具内容区域的弹窗不会影响主布局 */
.tool-content-wrapper {
  position: relative;
  z-index: 1;
}

/* 修复可能的 z-index 冲突 */
:deep(.v-overlay__content) {
  z-index: 2400 !important;
}

:deep(.v-dialog) {
  z-index: 2400 !important;
}

/* 确保工具容器不会被弹窗影响 */
.tool-container {
  position: relative;
  z-index: 1;
}

/* 修复内容溢出问题 */
.tool-wrapper,
.tool-content-wrapper,
.state-wrapper {
  max-width: 100%;
  overflow: visible;
}

/* 确保所有子组件都能正确显示 */
:deep(*) {
  box-sizing: border-box;
}

/* 修复可能的定位问题 */
.tool-container,
.tool-wrapper,
.tool-header,
.tool-content-wrapper,
.state-wrapper {
  position: relative;
}

/* 确保弹窗在工具容器内正确显示 */
.tool-content-wrapper :deep(.v-overlay) {
  position: fixed !important;
}

/* 修复移动端键盘弹出时的布局问题 */
@media (max-width: 768px) {
  .tool-container {
    min-height: 100vh;
    height: 100vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* 防止键盘弹出时布局错乱 */
  .tool-wrapper,
  .state-wrapper {
    min-height: calc(100vh - 24px);
  }
}

/* 确保在各种情况下都能正确居中 */
.tool-container {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.tool-wrapper,
.state-wrapper {
  margin: 0 auto !important;
}

/* 修复可能的 flexbox 冲突 */
.tool-container > * {
  width: 100%;
}

/* 确保响应式断点不会影响弹窗 */
@media (max-width: 480px) {
  :deep(.v-dialog),
  :deep(.v-overlay__content) {
    width: 100% !important;
    height: 100% !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
    border-radius: 0 !important;
  }
}
</style>
