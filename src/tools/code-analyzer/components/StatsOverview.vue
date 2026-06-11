<template>
  <v-row>
    <v-col cols="12" sm="6" md="3">
      <v-card elevation="1" rounded="lg" class="stat-card">
        <v-card-text>
          <div class="text-caption text-medium-emphasis mb-1">代码文件数</div>
          <div class="text-h4 font-weight-bold text-teal">{{ formatNum(fileCount) }}</div>
          <div class="text-caption text-medium-emphasis mt-1">共扫描 {{ formatNum(totalFiles) }} 个文件</div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" sm="6" md="3">
      <v-card elevation="1" rounded="lg" class="stat-card">
        <v-card-text>
          <div class="text-caption text-medium-emphasis mb-1">总行数</div>
          <div class="text-h4 font-weight-bold text-teal">{{ formatNum(totalLines) }}</div>
          <div class="text-caption text-medium-emphasis mt-1">平均每文件 {{ formatNum(avgLines) }} 行</div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" sm="6" md="3">
      <v-card elevation="1" rounded="lg" class="stat-card">
        <v-card-text>
          <div class="text-caption text-medium-emphasis mb-1">文件类型</div>
          <div class="text-h4 font-weight-bold text-teal">{{ typeCount }}</div>
          <div class="text-caption text-medium-emphasis mt-1">种不同的扩展名</div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" sm="6" md="3">
      <v-card elevation="1" rounded="lg" class="stat-card">
        <v-card-text>
          <div class="text-caption text-medium-emphasis mb-1">扫描耗时</div>
          <div class="text-h4 font-weight-bold text-teal">{{ elapsed }}s</div>
          <div class="text-caption text-medium-emphasis mt-1">约 {{ formatNum(filesPerSec) }} 文件/秒</div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  fileCount: { type: Number, default: 0 },
  totalFiles: { type: Number, default: 0 },
  totalLines: { type: Number, default: 0 },
  typeCount: { type: Number, default: 0 },
  elapsed: { type: Number, default: 0 },
})

const avgLines = computed(() => props.fileCount > 0 ? Math.round(props.totalLines / props.fileCount) : 0)
const filesPerSec = computed(() => props.elapsed > 0 ? Math.round(props.totalFiles / props.elapsed) : 0)

function formatNum(n) {
  return n.toLocaleString('zh-CN')
}
</script>

<style scoped>
.stat-card {
  transition: background-color 0.2s;
}
.stat-card:hover {
  background: rgba(0, 150, 136, 0.04);
}
.v-theme--dark .stat-card:hover {
  background: rgba(0, 150, 136, 0.08);
}
</style>
