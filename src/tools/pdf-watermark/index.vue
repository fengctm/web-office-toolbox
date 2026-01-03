<template>
  <!-- 入口组件：仅导入并渲染主容器 -->
  <MainContainer />
</template>

<script setup>
// 入口组件保持简洁，所有逻辑在 MainContainer 中
import MainContainer from './components/MainContainer.vue'
</script>

<style scoped>
/* 入口组件不需要额外样式 */
</style>
