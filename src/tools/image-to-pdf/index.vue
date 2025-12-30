<template>
  <v-card class="image-to-pdf-tool" elevation="2">
    <v-card-item>
      <v-card-title class="d-flex align-center">
        <v-icon color="teal" class="mr-2">mdi-image</v-icon>
        图片转PDF
      </v-card-title>
      <v-card-subtitle>
        将图片转换为PDF文件
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <div class="text-center pa-4 text-grey">
        <v-icon size="64" icon="mdi-file-image" class="mb-3"></v-icon>
        <div>图片转PDF工具</div>
        <div class="text-caption mt-2">功能开发中...</div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
// 空壳工具 - 待开发
</script>

<style scoped>
.image-to-pdf-tool {
  border-radius: 12px;
  overflow: hidden;
}
</style>
