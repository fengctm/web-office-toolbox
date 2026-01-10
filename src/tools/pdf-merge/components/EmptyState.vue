<template>
  <div class="empty-state-wrapper">
    <div class="empty-state-content">
      <v-icon class="empty-icon" size="80" color="teal-lighten-1">mdi-file-document-multiple-outline</v-icon>
      <div class="empty-title">准备开始组装</div>
      <div class="empty-subtitle">拖拽上传或添加 PDF 文件</div>

      <v-btn
          class="empty-btn"
          color="teal"
          size="large"
          variant="flat"
          elevation="4"
          @click="$emit('add-first')"
      >
        <v-icon start>mdi-plus</v-icon> 添加第一个 PDF
      </v-btn>
    </div>
  </div>
</template>

<script setup>
defineEmits(['add-first'])
</script>

<style scoped lang="scss">
.empty-state-wrapper {
  width: 100%;
  height: 100%;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background-color: transparent;
  box-sizing: border-box;
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
  max-width: 360px;
}

.empty-icon {
  opacity: 0.6;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #616161;
}

.v-theme--dark .empty-title {
  color: #bdbdbd;
}

.empty-subtitle {
  font-size: 13px;
  color: #757575;
}

.v-theme--dark .empty-subtitle {
  color: #9e9e9e;
}

.empty-btn {
  margin-top: 20px !important;
  animation: pulse 2s infinite;
  min-width: 180px;
  height: 52px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  border-radius: 14px !important;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.4);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 0 0 10px rgba(20, 184, 166, 0);
  }
}
</style>