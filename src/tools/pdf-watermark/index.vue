<template>
  <v-card class="pdf-watermark-tool" elevation="2">
    <v-card-item>
      <v-card-title class="d-flex align-center">
        <v-icon color="teal" class="mr-2">mdi-watermark</v-icon>
        PDF添加水印
      </v-card-title>
      <v-card-subtitle>
        为PDF文件添加水印
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <div class="text-center pa-4 text-grey">
        <v-icon size="64" icon="mdi-file-document" class="mb-3"></v-icon>
        <div>PDF添加水印工具</div>
        <div class="text-caption mt-2">功能开发中...</div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
// 空壳工具 - 待开发
</script>

<style scoped>
.pdf-watermark-tool {
  border-radius: 12px;
  overflow: hidden;
}
</style>
