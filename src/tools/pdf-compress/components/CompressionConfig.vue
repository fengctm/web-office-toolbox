<template>
  <div class="compression-config pa-4">
    <div class="d-flex align-center mb-6">
      <span class="text-subtitle-1 font-weight-bold">压缩强度</span>
      <v-spacer></v-spacer>
      <v-chip color="teal-darken-2" label size="small" class="font-weight-medium">{{ qualityLabel }}</v-chip>
    </div>

    <v-slider
        :model-value="quality"
        @update:model-value="onQualityChange"
        color="teal"
        max="0.9"
        min="0.1"
        step="0.1"
        thumb-label
        track-color="teal-lighten-4"
    >
      <template v-slot:prepend>
        <v-icon color="teal-lighten-3">mdi-image-outline</v-icon>
      </template>
      <template v-slot:append>
        <v-icon color="teal-darken-2">mdi-image-filter-center-focus</v-icon>
      </template>
    </v-slider>

    <!-- 预计结果预览 -->
    <v-card
        class="rounded-lg pa-4 mt-4 d-flex align-center transition-card"
        variant="flat"
        :class="isDark ? 'bg-grey-darken-4' : 'bg-grey-lighten-4'"
    >
      <div class="flex-grow-1">
        <div class="text-caption text-medium-emphasis">预计压缩后大小</div>
        <div class="text-h5 font-weight-black text-teal">
          ~ {{ estimatedSize }}
        </div>
      </div>
      <v-icon color="teal-lighten-4" size="40">mdi-trending-down</v-icon>
    </v-card>

    <v-btn
        block
        class="mt-8 rounded-pill btn-compress"
        color="teal"
        elevation="2"
        prepend-icon="mdi-zip-box"
        size="large"
        @click="onCompress"
    >
      开始压缩并下载
    </v-btn>
  </div>
</template>

<script setup>
defineProps({
  quality: {
    type: Number,
    required: true
  },
  qualityLabel: {
    type: String,
    required: true
  },
  estimatedSize: {
    type: String,
    required: true
  },
  isDark: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:quality', 'compress'])

const onQualityChange = (value) => {
  emit('update:quality', value)
}

const onCompress = () => {
  emit('compress')
}
</script>

<style scoped lang="scss">
// Apple 风格的贝塞尔曲线
$apple-ease: cubic-bezier(0.25, 0.1, 0.25, 1);

.compression-config {
  max-width: 100%;
}

.transition-card {
  transition: transform 0.3s $apple-ease, box-shadow 0.3s $apple-ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.btn-compress {
  transition: transform 0.2s $apple-ease, box-shadow 0.2s $apple-ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(20, 184, 166, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
}

// 深色模式适配
.v-theme--dark {
  .compression-config {
    background-color: transparent;
  }
}
</style>