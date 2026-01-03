<template>
  <div class="settings-panel">
    <v-card variant="outlined" class="pa-4">
      <div class="text-overline mb-4 text-teal">水印内容配置</div>

      <v-text-field
          v-model="config.text"
          label="水印文字"
          variant="outlined"
          density="comfortable"
          color="teal"
          clearable
      ></v-text-field>

      <v-row dense>
        <v-col cols="6">
          <v-select
              v-model="config.font"
              :items="['Standard', 'Serif', 'Monospace']"
              label="字体"
              variant="outlined"
              density="comfortable"
          ></v-select>
        </v-col>
        <v-col cols="6">
          <v-text-field
              v-model.number="config.color"
              label="颜色"
              type="color"
              variant="outlined"
              density="comfortable"
          ></v-text-field>
        </v-col>
      </v-row>

      <div class="text-overline mt-4 mb-2 text-teal">布局调节</div>

      <v-slider
          v-model="config.fontSize"
          label="大小"
          min="12" max="100" step="1"
          thumb-label
          color="teal"
      ></v-slider>

      <v-slider
          v-model="config.opacity"
          label="不透明度"
          min="0" max="1" step="0.1"
          thumb-label
          color="teal"
      ></v-slider>

      <v-slider
          v-model="config.rotation"
          label="旋转角度"
          min="-180" max="180" step="1"
          thumb-label
          color="teal"
      ></v-slider>

      <v-slider
          v-model="config.gap"
          label="间距 (密度)"
          min="50" max="400" step="10"
          thumb-label
          color="teal"
      ></v-slider>

      <v-row dense>
        <v-col cols="6">
          <v-text-field
              v-model.number="config.offsetX"
              label="X 偏移"
              type="number"
              variant="underlined"
          ></v-text-field>
        </v-col>
        <v-col cols="6">
          <v-text-field
              v-model.number="config.offsetY"
              label="Y 偏移"
              type="number"
              variant="underlined"
          ></v-text-field>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script setup>
import {computed} from "vue";

const props = defineProps({
  config: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:config'])

// 自动更新配置（使用 v-model）
const config = computed({
  get: () => props.config,
  set: (value) => emit('update:config', value)
})
</script>

<style scoped>
.settings-panel {
  width: 100%;
}

/* 深色模式适配 - 使用 Vuetify 主题变量 */
.settings-panel :deep(.v-card) {
  background: rgb(var(--v-theme-surface));
  border-color: rgba(var(--v-theme-on-surface), 0.12);
}

.settings-panel :deep(.text-overline) {
  color: rgb(var(--v-theme-primary));
}

.settings-panel :deep(.v-text-field .v-field__input),
.settings-panel :deep(.v-select__selection) {
  color: rgb(var(--v-theme-on-surface));
}

.settings-panel :deep(.v-field__label) {
  color: rgba(var(--v-theme-on-surface), 0.68);
}

.settings-panel :deep(.v-slider__thumb-label) {
  color: rgb(var(--v-theme-surface));
  background: rgb(var(--v-theme-primary));
}

.settings-panel :deep(.v-slider__track) {
  background: rgba(var(--v-theme-on-surface), 0.1);
}

.settings-panel :deep(.v-slider__thumb) {
  background: rgb(var(--v-theme-primary));
}

.settings-panel :deep(.v-field__outline) {
  color: rgba(var(--v-theme-on-surface), 0.38);
}

.settings-panel :deep(.v-input__details) {
  color: rgba(var(--v-theme-on-surface), 0.68);
}

.settings-panel :deep(.v-field__clearable) {
  color: rgba(var(--v-theme-on-surface), 0.68);
}

.settings-panel :deep(.v-select__append) {
  color: rgba(var(--v-theme-on-surface), 0.68);
}

/* 颜色选择器特殊处理 */
.settings-panel :deep(.v-text-field[type="color"] input) {
  color-scheme: light;
}

:root[data-theme="dark"] .settings-panel :deep(.v-text-field[type="color"] input) {
  color-scheme: dark;
}
</style>
