<template>
  <div class="pdf-viewer-mock">
    <!-- 模拟A4页面 -->
    <div
      v-for="(img, index) in images"
      :key="index"
      class="pdf-page-mock"
    >
      <div class="page-header">
        第 {{ index + 1 }} 页 / 共 {{ images.length }} 页
      </div>
      <v-img :src="img.preview" width="100%" contain></v-img>

      <!-- 水印层（可选，供pdf-watermark使用） -->
      <div
        v-if="watermarkConfig"
        class="watermark-layer"
        :style="watermarkStyle"
      >
        <div
          v-for="n in watermarkConfig.count"
          :key="n"
          class="watermark-item"
        >
          {{ watermarkConfig.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  images: {
    type: Array,
    default: () => []
  },
  watermarkConfig: {
    type: Object,
    default: null
  }
})

const watermarkStyle = computed(() => {
  if (!props.watermarkConfig) return {}
  return {
    opacity: props.watermarkConfig.opacity,
    color: props.watermarkConfig.color,
    fontSize: `${props.watermarkConfig.size}px`,
    transform: `rotate(${props.watermarkConfig.rotate}deg)`
  }
})
</script>

<style scoped>
.pdf-viewer-mock {
  max-width: 500px;
  width: 100%;
}

.pdf-page-mock {
  width: 100%;
  height: 0;
  padding-top: 141.4%; /* A4比例 */
  position: relative;
  background: white;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 16px;
}

.page-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 24px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  display: flex;
  align-items: center;
  padding: 0 8px;
  font-size: 11px;
  color: #666;
}

.pdf-page-mock .v-img {
  position: absolute;
  top: 24px;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: calc(100% - 24px);
}

.watermark-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-content: center;
  overflow: hidden;
}

.watermark-item {
  margin: 20px;
  white-space: nowrap;
  font-weight: bold;
  font-family: sans-serif;
  opacity: 0.3;
}
</style>
