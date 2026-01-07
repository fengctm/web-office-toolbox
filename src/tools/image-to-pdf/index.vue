<template>
  <div class="image-to-pdf-wrapper">
    <!-- 本地计算提示 -->
    <v-alert
        type="info"
        variant="tonal"
        color="info"
        class="mb-4"
        icon="mdi-laptop"
    >
      <div class="text-body-2">
        <strong>💡 本地计算说明：</strong><br>
        • 所有图片处理和PDF生成都在您的设备本地完成<br>
        • 计算速度受本地设备性能影响（CPU/内存）<br>
        • 图片不会上传到服务器，保护您的隐私安全<br>
        • 处理大量图片时可能需要一些时间，请耐心等待
      </div>
    </v-alert>

    <MainContainer/>
  </div>
</template>

<script setup>
import MainContainer from './components/MainContainer.vue'
</script>

<style scoped>
.image-to-pdf-wrapper {
  width: 100%;
  height: 100%;
}

/* 优化提示框样式 */
.image-to-pdf-wrapper :deep(.v-alert) {
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
}

.image-to-pdf-wrapper :deep(.v-alert__content) {
  padding: 8px 0;
}

/* 响应式调整 */
@media (max-width: 600px) {
  .image-to-pdf-wrapper :deep(.v-alert) {
    font-size: 13px;
  }
}
</style>
