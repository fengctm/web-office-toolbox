<template>
  <v-sheet class="control-board" color="surface" rounded="lg" elevation="0">
    <v-divider class="mb-4" />

    <div class="d-flex flex-wrap align-start ga-4">
      <div class="mode-toggle flex-shrink-0">
        <v-btn-toggle
            :model-value="mode"
            mandatory
            color="teal"
            variant="outlined"
            density="comfortable"
            divided
            @update:model-value="$emit('update:mode', $event)"
        >
          <v-btn value="quality" size="small">按质量</v-btn>
          <v-btn value="target" size="small">按大小</v-btn>
        </v-btn-toggle>
      </div>

      <div class="flex-grow-1" style="min-width: 200px;">
        <template v-if="mode === 'quality'">
          <div class="d-flex align-center mb-1">
            <span class="text-caption">压缩质量</span>
            <v-spacer />
            <v-chip size="x-small" color="teal" variant="tonal">{{ quality }}</v-chip>
          </div>
          <v-slider
              :model-value="quality"
              :min="0.1"
              :max="1.0"
              :step="0.01"
              color="teal"
              track-color="grey-lighten-2"
              hide-details
              thumb-label
              @update:model-value="$emit('update:quality', $event)"
          />
          <div class="d-flex justify-space-between text-caption text-medium-emphasis mt-1">
            <span>低质量</span>
            <span>高质量</span>
          </div>
        </template>

        <template v-else>
          <div class="d-flex align-center ga-3">
            <v-text-field
                :model-value="targetSize"
                label="目标大小 (KB)"
                type="number"
                :min="1"
                variant="outlined"
                density="compact"
                hide-details
                style="max-width: 180px;"
                @update:model-value="$emit('update:targetSize', $event)"
            />
            <v-btn
                color="teal"
                variant="tonal"
                :loading="compressing"
                :disabled="compressing"
                prepend-icon="mdi-image-minus"
                @click="$emit('compress')"
            >
              压缩
            </v-btn>
          </div>
        </template>
      </div>
    </div>

    <v-expansion-panels class="mt-4" flat>
      <v-expansion-panel>
        <v-expansion-panel-title class="text-caption px-0" density="compact">
          高级设置
        </v-expansion-panel-title>
        <v-expansion-panel-text class="px-0">
          <div class="d-flex flex-wrap ga-4 pt-2">
            <v-select
                :model-value="outputFormat"
                :items="formatOptions"
                label="输出格式"
                variant="outlined"
                density="compact"
                hide-details
                style="max-width: 160px;"
                @update:model-value="$emit('update:outputFormat', $event)"
            />
            <v-text-field
                :model-value="maxDimension"
                label="最大尺寸限制 (px)"
                type="number"
                :min="0"
                hint="0 表示不限制"
                persistent-hint
                variant="outlined"
                density="compact"
                style="max-width: 180px;"
                @update:model-value="$emit('update:maxDimension', $event)"
            />
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-sheet>
</template>

<script setup>
defineProps({
  mode: { type: String, default: 'quality' },
  quality: { type: Number, default: 0.8 },
  targetSize: { type: Number, default: 200 },
  maxDimension: { type: Number, default: 0 },
  outputFormat: { type: String, default: 'image/jpeg' },
  formatOptions: { type: Array, default: () => [] },
  compressing: { type: Boolean, default: false }
})

defineEmits([
  'update:mode',
  'update:quality',
  'update:targetSize',
  'update:maxDimension',
  'update:outputFormat',
  'compress'
])
</script>

<style scoped>
.control-board {
  padding: 12px 16px;
}
</style>
