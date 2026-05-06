<template>
  <div class="status-header">
    <div class="d-flex align-center flex-wrap ga-2">
      <div class="d-flex align-center flex-grow-1 overflow-hidden">
        <v-icon color="teal" class="mr-2" size="20">mdi-file-image</v-icon>
        <div class="overflow-hidden">
          <div class="text-subtitle-2 text-truncate">{{ fileName }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ originalSize }}
            <template v-if="hasResult">
              <v-icon size="12" class="mx-1">mdi-arrow-right</v-icon>
              {{ resultSize }}
            </template>
          </div>
        </div>
      </div>

      <v-chip
          v-if="hasResult"
          color="teal"
          variant="tonal"
          size="small"
          class="flex-shrink-0"
      >
        <v-icon start size="14">mdi-arrow-down</v-icon>
        {{ compressionRatio }}%
      </v-chip>

      <div class="d-flex ga-2 flex-shrink-0">
        <v-btn
            v-if="hasResult"
            color="teal"
            variant="tonal"
            size="small"
            prepend-icon="mdi-download"
            @click="$emit('download')"
        >
          下载
        </v-btn>
        <v-btn
            color="grey"
            variant="text"
            size="small"
            prepend-icon="mdi-refresh"
            @click="$emit('reset')"
        >
          重选
        </v-btn>
      </div>
    </div>

    <v-progress-linear
        v-if="compressing"
        color="teal"
        indeterminate
        class="mt-2"
        rounded
        height="3"
    />

    <div v-if="compressing && progressText" class="text-caption text-medium-emphasis mt-1">
      {{ progressText }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  fileName: { type: String, default: '' },
  originalSize: { type: String, default: '' },
  resultSize: { type: String, default: '' },
  compressionRatio: { type: [Number, String], default: 0 },
  compressing: { type: Boolean, default: false },
  progressText: { type: String, default: '' },
  hasResult: { type: Boolean, default: false }
})

defineEmits(['download', 'reset'])
</script>

<style scoped>
.status-header {
  padding: 12px 16px;
  border-bottom: 1px solid rgb(var(--v-border-color));
}
</style>
