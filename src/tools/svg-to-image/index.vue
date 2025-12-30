<template>
  <v-card class="svg-to-image-tool" elevation="2">
    <v-card-item>
      <v-card-title class="d-flex align-center">
        <v-icon color="teal" class="mr-2">mdi-svg</v-icon>
        SVG转图片
      </v-card-title>
      <v-card-subtitle>
        将SVG转换为图片格式
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <div class="text-center pa-4 text-grey">
        <v-icon size="64" icon="mdi-image" class="mb-3"></v-icon>
        <div>SVG转图片工具</div>
        <div class="text-caption mt-2">功能开发中...</div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
// 空壳工具 - 待开发
</script>

<style scoped>
.svg-to-image-tool {
  border-radius: 12px;
  overflow: hidden;
}
</style>
