<template>
  <v-card class="pdf-merge-tool" elevation="2">
    <v-card-item>
      <v-card-title class="d-flex align-center">
        <v-icon color="teal" class="mr-2">mdi-call-merge</v-icon>
        PDF插入和拼接
      </v-card-title>
      <v-card-subtitle>
        在PDF中插入页面或合并多个PDF文件
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <div class="text-center pa-4 text-grey">
        <v-icon size="64" icon="mdi-file-multiple" class="mb-3"></v-icon>
        <div>PDF插入和拼接工具</div>
        <div class="text-caption mt-2">功能开发中...</div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
// 空壳工具 - 待开发
</script>

<style scoped>
.pdf-merge-tool {
  border-radius: 12px;
  overflow: hidden;
}
</style>
