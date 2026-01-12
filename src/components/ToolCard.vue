<template>
  <v-card
      ref="cardRef"
      class="tool-card"
      @click="$emit('click')"
      @mouseenter="isHovering = true"
      @mouseleave="isHovering = false"
      @mousemove="handleMouseMove"
  >
    <!-- 核心光效层：跟随鼠标移动 -->
    <div
        :style="spotlightStyle"
        class="mouse-spotlight"
    ></div>

    <!-- 边框掠光：让边缘在光照下更闪耀 -->
    <div :style="spotlightStyle" class="border-glow"></div>

    <v-card-item class="content-top">
      <div class="icon-wrapper">
        <v-icon class="tool-icon" color="teal" size="42">
          {{ tool.icon }}
        </v-icon>
      </div>
      <v-card-title class="tool-title text-h6">{{ tool.name }}</v-card-title>
    </v-card-item>

    <v-card-text class="tool-description text-body-2">
      {{ tool.description }}
    </v-card-text>

    <v-spacer></v-spacer>

    <v-card-actions class="pa-4 pt-0">
      <v-btn
          block
          class="use-btn apple-btn"
          color="teal"
          variant="tonal"
          @click.stop="$emit('click')"
      >
        <span>开启工具</span>
        <v-icon class="arrow-icon" end icon="mdi-arrow-right"></v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import {computed, ref} from 'vue';

const props = defineProps({
  tool: {type: Object, required: true}
});
defineEmits(['click']);

// --- 光效逻辑 ---
const cardRef = ref(null);
const isHovering = ref(false);
const mousePos = ref({x: 0, y: 0});

const handleMouseMove = (e) => {
  if (!cardRef.value) return;
  // 获取卡片相对于视口的位置
  const rect = cardRef.value.$el.getBoundingClientRect();
  // 计算鼠标在卡片内部的坐标
  mousePos.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
};

// 将坐标转化为 CSS 变量
const spotlightStyle = computed(() => ({
  '--x': `${mousePos.value.x}px`,
  '--y': `${mousePos.value.y}px`,
  '--opacity': isHovering.value ? 1 : 0
}));
</script>

<style lang="scss" scoped>
$apple-ease: cubic-bezier(0.16, 1, 0.3, 1);

.tool-card {
  border-radius: 24px !important;
  background: var(--v-theme-surface);
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.5s $apple-ease, box-shadow 0.5s $apple-ease !important;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(var(--v-border-color), 0.08);
  cursor: pointer;
  z-index: 1;

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1) !important;

    .tool-icon {
      transform: scale(1.1) translateY(-4px);
    }
  }

  &:active {
    transform: translateY(-4px) scale(0.98);
  }
}

/* 核心跟随光效：使用径向渐变 */
.mouse-spotlight {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
  opacity: var(--opacity);
  transition: opacity 0.5s $apple-ease;
  // 关键：渐变中心随变量移动
  background: radial-gradient(
          600px circle at var(--x) var(--y),
          rgba(0, 150, 136, 0.08),
          transparent 40%
  );
}

/* 掠光边框效果 */
.border-glow {
  position: absolute;
  inset: -1px; // 稍微超出边界以照亮边框
  padding: 1px; // 内部填充
  background: radial-gradient(
          300px circle at var(--x) var(--y),
          rgba(0, 150, 136, 0.3),
          transparent 60%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box,
  linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box,
  linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: var(--opacity);
  transition: opacity 0.5s $apple-ease;
}

/* 内容排版 */
.content-top {
  position: relative;
  z-index: 2;
}

.icon-wrapper {
  padding: 24px 0 16px;
  display: flex;
  justify-content: center;
}

.tool-icon {
  transition: all 0.5s $apple-ease;
}

.tool-title {
  text-align: center;
  font-weight: 800 !important;
  color: #00796b;
}

.tool-description {
  position: relative;
  z-index: 2;
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.5);
  padding: 0 20px 16px;
  min-height: 64px;
}

.apple-btn {
  border-radius: 16px !important;
  font-weight: 700 !important;
  transition: all 0.3s $apple-ease !important;
}

/* 深色模式增强 */
:deep(.v-theme--dark) {
  .tool-card {
    background: #1a1a1a;

    &:hover {
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5) !important;
    }
  }

  .mouse-spotlight {
    background: radial-gradient(
            600px circle at var(--x) var(--y),
            rgba(0, 150, 136, 0.15),
            transparent 40%
    );
  }

  .tool-title {
    color: #4db6ac;
  }
}

/* 移动端处理：完全禁用跟随光效以节省性能 */
@media (max-width: 960px) {
  .mouse-spotlight, .border-glow {
    display: none;
  }

  .tool-card:hover {
    transform: none;
  }
}
</style>