<template>
  <v-container fluid class="home-container">
    <PageTransition transition-name="fade">
      <div class="home-content">
        <!-- 头部区域 -->
        <div class="header-section mb-8">
          <div class="app-icon mb-4">
            <v-icon size="72" color="primary">mdi-toolbox</v-icon>
          </div>
          <h1 class="text-h2 font-weight-bold mb-2 app-title">Web Office Toolbox</h1>
          <div class="text-h6 text-grey mb-4 subtitle">
            办公工具箱 - 集成多种办公辅助工具
          </div>
          <div class="features-hint text-body-1 text-grey-darken-1">
            📌 高效 · 安全 · 本地化 · 零依赖
          </div>
        </div>

        <!-- 工具网格区域 -->
        <div class="tools-section">
          <ToolGrid />
        </div>

        <!-- 底部信息 -->
        <div class="footer-section mt-8">
          <div class="text-caption text-grey">
            基于 Vue 3 + Vuetify 3 + Node.js + SQLite 构建
          </div>
          <div class="text-caption text-grey mt-1">
            支持 PC 端和移动端 · 深色模式适配 · 本地文件处理
          </div>
        </div>
      </div>
    </PageTransition>
  </v-container>
</template>
-------

<file_content path="src/pages/Home.vue">
<template>
  <v-container fluid class="home-container">
    <PageTransition transition-name="fade">
      <div class="home-content">
        <!-- 头部区域 -->
        <div class="header-section mb-8">
          <div class="app-icon mb-4">
            <v-icon size="72" color="primary">mdi-toolbox</v-icon>
          </div>
          <h1 class="text-h2 font-weight-bold mb-2 app-title">Web Office Toolbox</h1>
          <div class="text-h6 text-grey mb-4 subtitle">
            办公工具箱 - 集成多种办公辅助工具
          </div>
          <div class="features-hint text-body-1 text-grey-darken-1">
            📌 高效 · 安全 · 本地化 · 零依赖
          </div>
        </div>

        <!-- 工具网格区域 -->
        <div class="tools-section">
          <ToolGrid />
        </div>

        <!-- 底部信息 -->
        <div class="footer-section mt-8">
          <div class="text-caption text-grey">
            基于 Vue 3 + Vuetify 3 + Node.js + SQLite 构建
          </div>
          <div class="text-caption text-grey mt-1">
            支持 PC 端和移动端 · 深色模式适配 · 本地文件处理
          </div>
        </div>
      </div>
    </PageTransition>
  </v-container>
</template>

<script setup>
import ToolGrid from '../components/ToolGrid.vue'
import PageTransition from '../components/PageTransition.vue'
</script>

<style scoped>
.home-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  padding: 0;
  background: transparent;
}

.home-content {
  width: 100%;
  max-width: 1400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.header-section {
  text-align: center;
  width: 100%;
  max-width: 800px;
}

.app-icon {
  animation: float 4s ease-in-out infinite;
  filter: drop-shadow(0 4px 12px rgba(0, 150, 136, 0.3));
}

.app-title {
  background: linear-gradient(135deg, #009688 0%, #00796b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.subtitle {
  font-weight: 400;
  letter-spacing: 0.5px;
}

.features-hint {
  background: rgba(0, 150, 136, 0.08);
  padding: 8px 16px;
  border-radius: 20px;
  display: inline-block;
  font-weight: 500;
}

.tools-section {
  width: 100%;
  margin: 20px 0;
}

.footer-section {
  text-align: center;
  opacity: 0.8;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-12px) rotate(5deg);
  }
}

/* PC端大屏幕优化 */
@media (min-width: 1400px) {
  .home-content {
    padding: 60px;
  }

  .header-section {
    margin-bottom: 60px;
  }

  .app-icon {
    transform: scale(1.1);
  }

  .app-title {
    font-size: 3.5rem !important;
  }

  .subtitle {
    font-size: 1.25rem !important;
  }

  .features-hint {
    font-size: 1.1rem !important;
    padding: 12px 24px;
  }
}

@media (min-width: 1200px) and (max-width: 1399px) {
  .home-content {
    padding: 50px;
  }

  .header-section {
    margin-bottom: 50px;
  }

  .app-title {
    font-size: 3rem !important;
  }

  .subtitle {
    font-size: 1.15rem !important;
  }
}

@media (min-width: 769px) and (max-width: 1199px) {
  .home-content {
    padding: 30px;
  }

  .header-section {
    margin-bottom: 40px;
  }

  .app-title {
    font-size: 2.5rem !important;
  }

  .subtitle {
    font-size: 1.05rem !important;
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .home-content {
    padding: 20px;
    justify-content: flex-start;
  }

  .header-section {
    margin-bottom: 30px;
  }

  .app-icon {
    transform: scale(0.9);
    animation: float 3s ease-in-out infinite;
  }

  .app-title {
    font-size: 1.8rem !important;
    letter-spacing: -0.3px;
  }

  .subtitle {
    font-size: 0.95rem !important;
  }

  .features-hint {
    font-size: 0.9rem !important;
    padding: 6px 12px;
  }

  .footer-section {
    margin-top: 20px;
  }
}

@media (max-width: 480px) {
  .home-content {
    padding: 16px;
  }

  .app-title {
    font-size: 1.5rem !important;
  }

  .subtitle {
    font-size: 0.85rem !important;
  }

  .features-hint {
    font-size: 0.8rem !important;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .features-hint {
    background: rgba(0, 150, 136, 0.15);
    color: #4dd0e1;
  }

  .app-icon {
    filter: drop-shadow(0 4px 12px rgba(0, 150, 136, 0.5));
  }
}

[data-theme="dark"] .features-hint {
  background: rgba(0, 150, 136, 0.15);
  color: #4dd0e1;
}

[data-theme="dark"] .app-icon {
  filter: drop-shadow(0 4px 12px rgba(0, 150, 136, 0.5));
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .app-title {
    -webkit-text-fill-color: #00695c;
    background: #00695c;
  }

  .features-hint {
    border: 2px solid #00695c;
    background: transparent;
  }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .app-icon {
    animation: none;
  }

  .home-content * {
    transition: none !important;
  }
}

/* 内容区域滚动优化 */
.home-content {
  overflow-y: auto;
  max-height: calc(100vh - 40px);
}

/* 确保工具网格有足够的空间 */
.tools-section {
  min-height: 300px;
}

/* 优化工具卡片的显示 */
.tools-section :deep(.tool-grid) {
  gap: 24px;
}

.tools-section :deep(.tool-card) {
  min-height: 260px;
}

/* PC端舒适间距 */
@media (min-width: 769px) {
  .tools-section :deep(.tool-grid) {
    gap: 32px;
  }

  .tools-section :deep(.tool-card) {
    min-height: 280px;
  }
}
</style>
</file_content>
</replace_in_file>

[Response interrupted by a tool use result. Only one tool may be active at a time

<script setup>
import ToolGrid from '../components/ToolGrid.vue'
import PageTransition from '../components/PageTransition.vue'
</script>

<style scoped>
.home-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(0, 150, 136, 0.05) 0%, rgba(255, 255, 255, 1) 100%);
}

.home-card {
  max-width: 1400px;
  width: 95%;
  height: 90vh;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 150, 136, 0.1);
  box-shadow: 0 8px 32px rgba(0, 150, 136, 0.1);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.home-card:hover {
  box-shadow: 0 12px 40px rgba(0, 150, 136, 0.15);
  transform: translateY(-2px);
}

.app-icon {
  animation: float 3s ease-in-out infinite;
}

.app-title {
  background: linear-gradient(135deg, #009688 0%, #00796b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .home-container {
    background: linear-gradient(135deg, rgba(0, 150, 136, 0.1) 0%, rgba(30, 30, 30, 1) 100%);
  }

  .home-card {
    background: rgba(30, 30, 30, 0.95);
    border-color: rgba(0, 150, 136, 0.2);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .home-container {
    padding: 0;
    width: 100%;
    height: 100vh;
  }

  .home-card {
    width: 100%;
    height: 100vh;
    border-radius: 0;
    max-width: 100%;
  }

  .app-title {
    font-size: 1.75rem !important;
  }
}

@media (max-width: 480px) {
  .app-title {
    font-size: 1.5rem !important;
  }

  .text-subtitle-1 {
    font-size: 0.8rem !important;
  }

  .app-icon {
    animation: float 2.5s ease-in-out infinite;
  }
}
</style>
