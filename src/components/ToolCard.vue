<template>
  <v-hover v-slot="{ isHovering, props }">
    <v-card
      v-bind="props"
      class="tool-card"
      :class="{ 'hover': isHovering }"
      variant="elevated"
      elevation="2"
      height="100%"
      @click="handleClick"
      :disabled="!tool.enabled"
    >
      <!-- 图标区域 -->
      <div class="icon-wrapper" :class="{ 'pulse': isHovering && tool.enabled }">
        <v-icon size="48" color="primary">{{ tool.icon }}</v-icon>
      </div>

      <!-- 内容区域 -->
      <div class="content-wrapper">
        <div class="text-h5 font-weight-bold tool-name">{{ tool.name }}</div>
        <div class="text-body-2 text-grey tool-description">
          {{ tool.description }}
        </div>
      </div>

      <!-- 底部操作区 -->
      <div class="action-wrapper">
        <v-btn
          block
          variant="flat"
          color="primary"
          size="large"
          prepend-icon="mdi-arrow-right-circle"
          class="tool-btn"
          :class="{ 'btn-hover': isHovering && tool.enabled }"
          :disabled="!tool.enabled"
        >
          {{ tool.enabled ? '开始使用' : '即将推出' }}
        </v-btn>
      </div>

      <!-- 状态指示器 -->
      <v-chip
        v-if="!tool.enabled"
        size="x-small"
        color="grey"
        variant="flat"
        class="status-chip"
      >
        未启用
      </v-chip>
    </v-card>
  </v-hover>
</template>
-------

<file_content path="src/components/ToolCard.vue">
<template>
  <v-hover v-slot="{ isHovering, props }">
    <v-card
      v-bind="props"
      class="tool-card"
      :class="{ 'hover': isHovering }"
      variant="elevated"
      elevation="2"
      height="100%"
      @click="handleClick"
      :disabled="!tool.enabled"
    >
      <!-- 图标区域 -->
      <div class="icon-wrapper" :class="{ 'pulse': isHovering && tool.enabled }">
        <v-icon size="48" color="primary">{{ tool.icon }}</v-icon>
      </div>

      <!-- 内容区域 -->
      <div class="content-wrapper">
        <div class="text-h5 font-weight-bold tool-name">{{ tool.name }}</div>
        <div class="text-body-2 text-grey tool-description">
          {{ tool.description }}
        </div>
      </div>

      <!-- 底部操作区 -->
      <div class="action-wrapper">
        <v-btn
          block
          variant="flat"
          color="primary"
          size="large"
          prepend-icon="mdi-arrow-right-circle"
          class="tool-btn"
          :class="{ 'btn-hover': isHovering && tool.enabled }"
          :disabled="!tool.enabled"
        >
          {{ tool.enabled ? '开始使用' : '即将推出' }}
        </v-btn>
      </div>

      <!-- 状态指示器 -->
      <v-chip
        v-if="!tool.enabled"
        size="x-small"
        color="grey"
        variant="flat"
        class="status-chip"
      >
        未启用
      </v-chip>
    </v-card>
  </v-hover>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  tool: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const handleClick = () => {
  if (props.tool.enabled) {
    router.push(`/tool/${props.tool.code}`)
  }
}
</script>

<style scoped>
.tool-card {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 150, 136, 0.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  min-height: 280px;
  position: relative;
  overflow: hidden;
}

.tool-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 150, 136, 0.2);
  border-color: rgba(0, 150, 136, 0.3);
}

.tool-card:active {
  transform: translateY(-4px) scale(1.01);
}

.tool-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 图标区域样式 */
.icon-wrapper {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 150, 136, 0.08);
  border-radius: 20px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.tool-card:hover .icon-wrapper {
  background: rgba(0, 150, 136, 0.15);
  border-color: rgba(0, 150, 136, 0.3);
  transform: scale(1.05);
}

.pulse {
  animation: pulse 0.6s ease-in-out;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* 内容区域样式 */
.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 8px;
}

.tool-name {
  color: #009688;
  margin-bottom: 8px;
  letter-spacing: -0.3px;
  line-height: 1.3;
}

.tool-description {
  line-height: 1.6;
  font-size: 0.95rem;
  flex: 1;
  display: flex;
  align-items: center;
}

/* 按钮区域样式 */
.action-wrapper {
  width: 100%;
  margin-top: 16px;
}

.tool-btn {
  font-weight: 600;
  letter-spacing: 0.5px;
  border-radius: 12px !important;
  transition: all 0.2s ease !important;
  text-transform: none !important;
}

.tool-btn.btn-hover {
  background: linear-gradient(135deg, #009688 0%, #00796b 100%) !important;
  color: white !important;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 150, 136, 0.3);
}

.tool-btn:disabled {
  background: rgba(0, 0, 0, 0.05) !important;
  color: rgba(0, 0, 0, 0.38) !important;
}

/* 状态指示器 */
.status-chip {
  position: absolute;
  top: 12px;
  right: 12px;
  font-weight: 600;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .tool-card {
    background: rgba(30, 30, 30, 0.95);
    border-color: rgba(0, 150, 136, 0.2);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }

  .tool-card:hover {
    box-shadow: 0 20px 40px rgba(0, 150, 136, 0.35);
  }

  .icon-wrapper {
    background: rgba(0, 150, 136, 0.15);
  }

  .tool-card:hover .icon-wrapper {
    background: rgba(0, 150, 136, 0.25);
    border-color: rgba(0, 150, 136, 0.4);
  }

  .tool-name {
    color: #4dd0e1;
  }

  .tool-description {
    color: #b0b0b0;
  }

  .tool-btn.btn-hover {
    background: linear-gradient(135deg, #009688 0%, #26a69a 100%) !important;
  }

  .tool-btn:disabled {
    background: rgba(255, 255, 255, 0.05) !important;
    color: rgba(255, 255, 255, 0.38) !important;
  }
}

/* PC端大屏幕优化 */
@media (min-width: 1400px) {
  .tool-card {
    padding: 32px;
    min-height: 320px;
    border-radius: 20px;
  }

  .icon-wrapper {
    width: 96px;
    height: 96px;
    margin-bottom: 20px;
  }

  .icon-wrapper .v-icon {
    font-size: 56px !important;
  }

  .tool-name {
    font-size: 1.4rem !important;
    margin-bottom: 12px;
  }

  .tool-description {
    font-size: 1rem !important;
  }

  .tool-btn {
    font-size: 1.05rem !important;
    min-height: 48px !important;
  }
}

@media (min-width: 1200px) and (max-width: 1399px) {
  .tool-card {
    padding: 28px;
    min-height: 300px;
  }

  .icon-wrapper {
    width: 88px;
    height: 88px;
  }

  .tool-name {
    font-size: 1.25rem !important;
  }

  .tool-btn {
    font-size: 1rem !important;
    min-height: 44px !important;
  }
}

@media (min-width: 769px) and (max-width: 1199px) {
  .tool-card {
    padding: 24px;
    min-height: 280px;
  }

  .icon-wrapper {
    width: 80px;
    height: 80px;
  }

  .tool-name {
    font-size: 1.15rem !important;
  }

  .tool-btn {
    font-size: 0.95rem !important;
    min-height: 42px !important;
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .tool-card {
    padding: 20px;
    min-height: 240px;
    border-radius: 14px;
  }

  .icon-wrapper {
    width: 72px;
    height: 72px;
    margin-bottom: 12px;
  }

  .icon-wrapper .v-icon {
    font-size: 36px !important;
  }

  .tool-name {
    font-size: 1.1rem !important;
    margin-bottom: 6px;
  }

  .tool-description {
    font-size: 0.85rem !important;
    line-height: 1.5;
  }

  .tool-btn {
    font-size: 0.9rem !important;
    min-height: 40px !important;
    border-radius: 10px !important;
  }

  .tool-card:hover {
    transform: translateY(-6px) scale(1.01);
  }
}

@media (max-width: 480px) {
  .tool-card {
    padding: 16px;
    min-height: 220px;
    border-radius: 12px;
  }

  .icon-wrapper {
    width: 64px;
    height: 64px;
  }

  .tool-name {
    font-size: 1rem !important;
  }

  .tool-description {
    font-size: 0.8rem !important;
  }

  .tool-btn {
    font-size: 0.85rem !important;
    min-height: 36px !important;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .tool-card {
    border-width: 2px;
  }

  .icon-wrapper {
    border-width: 3px;
  }

  .tool-btn {
    border-width: 2px;
    font-weight: 700;
  }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .tool-card,
  .icon-wrapper,
  .tool-btn {
    transition: none !important;
  }

  .pulse {
    animation: none !important;
  }

  .tool-card:hover {
    transform: none !important;
  }
}

/* 工具卡片入场动画 */
.tool-card {
  animation: fadeInUp 0.5s ease-out backwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 优化触摸反馈 */
@media (hover: none) and (pointer: coarse) {
  .tool-card:active {
    background: rgba(0, 150, 136, 0.05);
  }
}

/* 确保禁用状态下的样式 */
.tool-card[disabled="true"],
.tool-card.disabled {
  pointer-events: none;
}

.tool-card[disabled="true"] .icon-wrapper,
.tool-card.disabled .icon-wrapper {
  background: rgba(0, 0, 0, 0.03);
}

.tool-card[disabled="true"] .tool-name,
.tool-card.disabled .tool-name {
  color: rgba(0, 0, 0, 0.38);
}

/* 深色模式下的禁用状态 */
[data-theme="dark"] .tool-card[disabled="true"],
[data-theme="dark"] .tool-card.disabled {
  background: rgba(30, 30, 30, 0.8);
}

[data-theme="dark"] .tool-card[disabled="true"] .icon-wrapper,
[data-theme="dark"] .tool-card.disabled .icon-wrapper {
  background: rgba(255, 255, 255, 0.03);
}

[data-theme="dark"] .tool-card[disabled="true"] .tool-name,
[data-theme="dark"] .tool-card.disabled .tool-name {
  color: rgba(255, 255, 255, 0.38);
}
</style>
</file_content>
</replace_in_file>

[Response interrupted by a tool use result. Only one tool may be active at a time

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  tool: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const handleClick = () => {
  if (props.tool.enabled) {
    router.push(`/tool/${props.tool.code}`)
  }
}
</script>

<style scoped>
.tool-card {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 240px;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 150, 136, 0.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 320px;
}

.tool-card.hover {
  transform: translateY(-8px) scale(1.03);
  box-shadow: 0 20px 36px rgba(0, 150, 136, 0.25);
  border-color: rgba(0, 150, 136, 0.3);
}

.transition-all {
  transition: all 0.3s ease;
}

.pulse {
  animation: pulse 0.6s ease-in-out;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

.tool-btn {
  transition: all 0.2s ease;
  font-weight: 600;
  font-size: 0.95rem;
}

.tool-btn.btn-hover {
  color: #009688;
  transform: translateX(6px);
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .tool-card {
    background: rgba(30, 30, 30, 0.95);
    border-color: rgba(0, 150, 136, 0.2);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }

  .tool-card.hover {
    box-shadow: 0 20px 36px rgba(0, 150, 136, 0.35);
  }
}

/* 响应式设计 - 移动端优化 */
@media (max-width: 768px) {
  .tool-card {
    min-height: 200px;
    max-width: 100%;
    border-radius: 14px;
  }

  .tool-card.hover {
    transform: translateY(-6px) scale(1.02);
  }

  .tool-btn {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .tool-card {
    min-height: 180px;
    border-radius: 12px;
  }

  .tool-card.hover {
    transform: translateY(-4px) scale(1.01);
  }

  .tool-btn {
    font-size: 0.85rem;
  }
}

/* 大屏幕优化 */
@media (min-width: 1400px) {
  .tool-card {
    min-height: 260px;
    max-width: 360px;
  }

  .tool-btn {
    font-size: 1rem;
  }
}
</style>
