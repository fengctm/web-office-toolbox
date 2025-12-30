<template>
  <v-card class="markdown-to-word-tool" elevation="2">
    <v-card-item>
      <v-card-title class="d-flex align-center">
        <v-icon color="teal" class="mr-2">mdi-language-markdown</v-icon>
        Markdown转Word
      </v-card-title>
      <v-card-subtitle>
        将Markdown转换为Word文档
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <div class="text-center pa-4 text-grey">
        <v-icon size="64" icon="mdi-file-word" class="mb-3"></v-icon>
        <div>Markdown转Word工具</div>
        <div class="text-caption mt-2">功能开发中...</div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
// 空壳工具 - 待开发
</script>

<style scoped>
.markdown-to-word-tool {
  border-radius: 12px;
  overflow: hidden;
}
</style>
