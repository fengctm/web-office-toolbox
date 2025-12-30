<template>
  <v-card
    class="tool-card mx-auto"
    hover
    elevation="2"
    @click="$emit('click')"
  >
    <!-- 工具图标 -->
    <v-card-item class="text-center">
      <v-icon
        size="48"
        color="teal"
        class="tool-icon mb-2"
      >
        {{ tool.icon }}
      </v-icon>
      <v-card-title class="tool-title">{{ tool.name }}</v-card-title>
    </v-card-item>

    <!-- 工具描述 -->
    <v-card-text class="text-center text-grey-darken-1">
      {{ tool.description }}
    </v-card-text>

    <!-- 底部操作区 -->
    <v-card-actions class="justify-center">
      <v-btn
        color="teal"
        variant="tonal"
        rounded="lg"
        class="use-btn"
        @click.stop="$emit('click')"
      >
        使用工具
        <v-icon end icon="mdi-arrow-right"></v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
defineProps({
  tool: {
    type: Object,
    required: true,
    validator: (tool) => {
      return tool.code && tool.name && tool.icon && tool.description
    }
  }
})

defineEmits(['click'])
</script>

<style scoped>
.tool-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 150, 136, 0.25) !important;
}

.tool-card:hover .tool-icon {
  animation: pulse 0.6s ease-in-out;
}

.tool-icon {
  transition: all 0.3s ease;
}

.tool-title {
  font-weight: 600;
  font-size: 1.1rem;
  color: #009688;
  margin-bottom: 4px;
}

.use-btn {
  opacity: 0;
  transform: translateY(4px);
  transition: all 0.3s ease;
}

.tool-card:hover .use-btn {
  opacity: 1;
  transform: translateY(0);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

/* 深色模式适配 */
:deep(.v-theme--dark) .tool-card {
  background-color: #1e1e1e;
}

:deep(.v-theme--dark) .tool-card:hover {
  box-shadow: 0 8px 24px rgba(0, 150, 136, 0.4) !important;
}

:deep(.v-theme--dark) .tool-title {
  color: #26a69a;
}
</style>
