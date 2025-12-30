<template>
  <v-container fluid>
    <!-- 标题区域 -->
    <v-row class="mb-6">
      <v-col cols="12" class="text-center">
        <h1 class="text-h3 font-weight-bold text-teal-darken-2 mb-2">
          Web Office Toolbox
        </h1>
        <p class="text-grey-darken-1 text-subtitle-1">
          纯前端工具箱 - 多数功能本地运行，保护您的隐私
        </p>
      </v-col>
    </v-row>

    <!-- 工具网格 -->
    <v-row v-if="tools.length > 0">
      <v-col
          v-for="tool in tools"
          :key="tool.code"
          cols="12"
          sm="6"
          md="4"
          lg="3"
      >
        <ToolCard
            :tool="tool"
            @click="$emit('tool-click', tool)"
        />
      </v-col>
    </v-row>

    <!-- 空状态 -->
    <v-row v-else justify="center" class="mt-12">
      <v-col cols="12" md="6" class="text-center">
        <v-icon
            size="64"
            color="grey"
            icon="mdi-toolbox"
            class="mb-4"
        />
        <h2 class="text-h5 text-grey-darken-1 mb-2">
          暂无可用工具
        </h2>
        <p class="text-grey">
          请检查工具配置或添加新工具
        </p>
      </v-col>
    </v-row>

    <!-- 统计信息 -->
    <v-row class="mt-8">
      <v-col cols="12" class="text-center">
        <v-chip
            color="teal"
            variant="outlined"
            size="large"
        >
          <v-icon start icon="mdi-counter"></v-icon>
          工具数量: {{ tools.length }}
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

<style scoped>
/* 入场动画 */
.v-container {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 深色模式适配 */
.v-theme--dark .text-teal-darken-2 {
  color: #26a69a !important;
}

.v-theme--dark .text-grey-darken-1,
.v-theme--dark .text-grey {
  color: #aaa !important;
}

/* 响应式调整 */
@media (max-width: 600px) {
  .text-h3 {
    font-size: 1.75rem !important;
  }
}
</style>
