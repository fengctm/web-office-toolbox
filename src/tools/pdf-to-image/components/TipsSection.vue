<template>
  <div v-if="showTips" class="tips-section mt-4">
    <v-alert
      v-if="!pdfFile && !pdfLoaded"
      type="info"
      variant="outlined"
      icon="mdi-upload"
    >
      <strong>操作步骤：</strong><br>
      1. 点击上方"选择PDF文件"按钮上传PDF<br>
      2. 点击"解析PDF"按钮生成预览<br>
      3. 在导出设置中选择格式和质量<br>
      4. 点击"导出为图片"开始转换
    </v-alert>

    <v-alert
      v-if="pdfLoaded && !exporting"
      type="success"
      variant="tonal"
      icon="mdi-check-circle"
      class="mt-3"
    >
      <strong>准备就绪！</strong><br>
      PDF文件已加载完成，共 {{ totalPages }} 页。您可以预览页面或配置导出选项。
    </v-alert>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  pdfFile: {
    type: Object,
    default: null
  },
  pdfLoaded: {
    type: Boolean,
    default: false
  },
  totalPages: {
    type: Number,
    default: 0
  },
  exporting: {
    type: Boolean,
    default: false
  },
  processing: {
    type: Boolean,
    default: false
  }
})

// 计算属性：是否显示提示
const showTips = computed(() => {
  return !props.processing && (!props.pdfLoaded || !props.exporting)
})
</script>

<style scoped>
.tips-section {
  animation: fadeIn 0.6s ease-out;
}

/* 动画定义 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
