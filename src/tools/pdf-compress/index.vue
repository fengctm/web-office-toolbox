<template>
  <v-card class="pdf-compress-tool" elevation="2">
    <v-card-item>
      <v-card-title class="d-flex align-center">
        <v-icon color="teal" class="mr-2" icon="mdi-zip-box"></v-icon>
        PDF压缩
      </v-card-title>
      <v-card-subtitle>
        压缩PDF文件大小
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <div class="text-center pa-4 text-grey">
        <v-icon size="64" icon="mdi-zip-box" class="mb-3"></v-icon>
        <div>PDF压缩工具</div>
        <div class="text-caption mt-2">功能开发中...</div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>

// 空壳工具 - 待开发
</script>

<style scoped>
.pdf-compress-tool {
  border-radius: 12px;
  overflow: hidden;
}
</style>
