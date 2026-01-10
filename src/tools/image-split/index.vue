<template>
  <v-card class="image-split-tool" elevation="2">
    <v-card-item>
      <v-card-title class="d-flex align-center">
        <v-icon color="teal" class="mr-2">mdi-image-filter-hdr</v-icon>
        图片分割
      </v-card-title>
      <v-card-subtitle>
        将图片按指定规则分割成多个小图
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <div class="text-center pa-4 text-grey">
        <v-icon size="64" icon="mdi-image-multiple" class="mb-3"></v-icon>
        <div>图片分割工具</div>
        <div class="text-caption mt-2">功能开发中...</div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
// 空壳工具 - 待开发
</script>

<style scoped>
.image-split-tool {
  border-radius: 12px;
  overflow: hidden;
}
</style>