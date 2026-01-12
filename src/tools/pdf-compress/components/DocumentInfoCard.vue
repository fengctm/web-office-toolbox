<template>
  <v-card
      border
      class="rounded-xl pa-4 info-card transition-card"
      color="teal"
      variant="tonal"
  >
    <div class="text-overline mb-2">文档信息</div>
    <div class="d-flex align-center mb-4">
      <v-icon color="teal" size="48">mdi-file-document-outline</v-icon>
      <div class="ml-3 overflow-hidden">
        <div class="text-subtitle-1 font-weight-bold text-truncate">{{ fileName }}</div>
        <div class="text-caption text-medium-emphasis">原始大小: {{ formatBytes(fileSize) }}</div>
      </div>
    </div>
    <v-divider class="mb-4 opacity-50"></v-divider>
    <div class="d-flex justify-space-between text-body-2 mb-2">
      <span>页数:</span>
      <span class="font-weight-bold">{{ pageCount }} 页</span>
    </div>
    <div class="d-flex justify-space-between text-body-2">
      <span>状态:</span>
      <v-chip :color="password ? 'success' : 'grey'" size="x-small" variant="flat">
        {{ password ? '已解密' : '未加密' }}
      </v-chip>
    </div>
  </v-card>
</template>

<script setup>
defineProps({
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  pageCount: {
    type: Number,
    required: true
  },
  password: {
    type: String,
    default: ''
  }
})

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped lang="scss">
// Apple 风格的贝塞尔曲线
$apple-ease: cubic-bezier(0.25, 0.1, 0.25, 1);

.transition-card {
  transition: transform 0.3s $apple-ease, box-shadow 0.3s $apple-ease;

  &:hover {
    transform: translateY(-2px);
  }
}

// 深色模式适配
.v-theme--dark {
  .info-card {
    background-color: rgba(20, 184, 166, 0.1);
  }
}
</style>