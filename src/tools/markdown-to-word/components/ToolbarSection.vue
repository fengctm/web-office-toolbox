<template>
  <v-toolbar class="app-bar-blur" flat density="compact">
    <v-icon class="ml-2 mr-2 icon-bounce" color="teal">mdi-language-markdown</v-icon>
    <v-toolbar-title class="text-subtitle-1 font-weight-bold toolbar-title">
      Markdown 排版工具
    </v-toolbar-title>
    <v-spacer></v-spacer>

    <!-- 顶部操作按钮 -->
    <v-btn
        class="btn-micro-interaction mr-2"
        color="teal"
        size="small"
        variant="text"
        @click="onLoadDemo"
    >
      加载示例
    </v-btn>
  </v-toolbar>
</template>

<script setup>
const emit = defineEmits(['load-demo'])

const onLoadDemo = () => {
  emit('load-demo')
}
</script>

<style scoped lang="scss">
// Apple 风格的贝塞尔曲线
$apple-ease: cubic-bezier(0.25, 0.1, 0.25, 1);

.app-bar-blur {
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s $apple-ease;

  .toolbar-title {
    color: #1d1d1f;
  }
}

.v-theme--dark {
  .app-bar-blur {
    background-color: rgba(30, 30, 30, 0.75);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    .toolbar-title {
      color: rgba(255, 255, 255, 0.9);
    }
  }
}

.icon-bounce {
  transition: transform 0.4s $apple-ease;

  &:hover {
    transform: rotate(-10deg) scale(1.1);
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