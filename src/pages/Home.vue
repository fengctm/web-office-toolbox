<template>
  <PageTransition>
    <div class="home-page">
      <ToolGrid
        :tools="enabledTools"
        @tool-click="handleToolClick"
      />
    </div>
  </PageTransition>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { toolRegistry } from '../config/tools-config.js'
import ToolGrid from '../components/ToolGrid.vue'
import PageTransition from '../components/PageTransition.vue'

const router = useRouter()

// 获取所有启用的工具
const enabledTools = computed(() => {
  return toolRegistry.getEnabledTools()
})

// 处理工具点击
const handleToolClick = (tool) => {
  router.push({
    name: 'tool',
    params: { code: tool.code }
  })
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  padding: 20px 0;
}
</style>
