<template>
  <v-tabs v-model="activeTab" color="teal" grow>
    <v-tab value="content">内容</v-tab>
    <v-tab value="style">样式</v-tab>
    <v-tab value="layout">布局</v-tab>
  </v-tabs>

  <v-divider></v-divider>

  <v-card-text class="overflow-y-auto" style="max-height: 600px;">
    <v-window v-model="activeTab">
      <!-- 内容设置 -->
      <v-window-item value="content" class="pa-2">
        <v-text-field
          :model-value="settings.text"
          @update:model-value="update('text', $event)"
          label="水印文字"
          variant="outlined"
          density="comfortable"
          placeholder="输入水印内容"
          class="mt-4"
        ></v-text-field>
        <v-alert density="compact" type="info" variant="tonal" class="mt-2">
          提示：建议使用中英文字符
        </v-alert>
      </v-window-item>

      <!-- 样式设置 -->
      <v-window-item value="style" class="pa-2">
        <div class="text-subtitle-2 mb-2">字体颜色与透明度</div>
        <v-color-picker
          :model-value="settings.color"
          @update:model-value="update('color', $event)"
          hide-inputs
          show-swatches
          height="120"
          class="mb-4 mx-auto"
        ></v-color-picker>

        <v-slider
          :model-value="settings.opacity"
          @update:model-value="update('opacity', $event)"
          label="透明度"
          min="0"
          max="1"
          step="0.1"
          thumb-label
          color="teal"
        ></v-slider>

        <v-slider
          :model-value="settings.fontSize"
          @update:model-value="update('fontSize', $event)"
          label="字体大小"
          min="12"
          max="100"
          step="1"
          thumb-label
          color="teal"
        ></v-slider>
      </v-window-item>

      <!-- 布局设置 -->
      <v-window-item value="layout" class="pa-2">
        <v-slider
          :model-value="settings.rotation"
          @update:model-value="update('rotation', $event)"
          label="倾斜角度"
          min="-180"
          max="180"
          step="1"
          thumb-label
          color="teal"
        >
          <template v-slot:append>
            <v-icon>mdi-rotate-right</v-icon>
          </template>
        </v-slider>

        <v-slider
          :model-value="settings.density"
          @update:model-value="update('density', $event)"
          label="分布密度"
          min="1"
          max="20"
          step="1"
          thumb-label
          color="teal"
        ></v-slider>

        <v-slider
          :model-value="settings.offset"
          @update:model-value="update('offset', $event)"
          label="水平偏移量"
          min="-100"
          max="100"
          step="1"
          thumb-label
          color="teal"
        ></v-slider>
      </v-window-item>
    </v-window>
  </v-card-text>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  settings: Object
})

const emit = defineEmits(['update:settings'])

const activeTab = ref('content')

const update = (key, value) => {
  emit('update:settings', { ...props.settings, [key]: value })
}
</script>
