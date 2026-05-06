<template>
  <div class="compare-viewer">
    <div class="d-none d-md-block">
      <v-row no-gutters class="ga-4">
        <v-col cols="12" md="6">
          <div class="viewer-pane">
            <div class="viewer-label d-flex align-center mb-2">
              <v-icon size="16" color="grey" class="mr-1">mdi-image</v-icon>
              <span class="text-caption font-weight-medium">原图</span>
              <v-spacer />
              <span class="text-caption text-medium-emphasis">{{ originalSize }}</span>
            </div>
            <div class="viewer-image-wrapper checkerboard rounded-lg">
              <v-img :src="originalUrl" max-height="400" contain class="rounded-lg" />
            </div>
          </div>
        </v-col>

        <v-col cols="12" md="6">
          <div class="viewer-pane">
            <div class="viewer-label d-flex align-center mb-2">
              <v-icon size="16" color="teal" class="mr-1">mdi-image-check</v-icon>
              <span class="text-caption font-weight-medium">压缩后</span>
              <v-spacer />
              <template v-if="hasResult">
                <span class="text-caption text-medium-emphasis">{{ resultSize }}</span>
              </template>
            </div>
            <div class="viewer-image-wrapper checkerboard rounded-lg" style="position: relative;">
              <template v-if="hasResult">
                <v-img :src="resultUrl" max-height="400" contain class="rounded-lg" />
              </template>
              <template v-else>
                <div class="empty-state d-flex flex-column align-center justify-center">
                  <v-icon size="48" color="grey-lighten-1">mdi-image-edit-outline</v-icon>
                  <span class="text-caption text-medium-emphasis mt-2">拖动下方滑块开始压缩</span>
                </div>
              </template>
              <v-overlay
                  :model-value="compressing"
                  contained
                  class="align-center justify-center"
                  scrim="rgba(0,0,0,0.3)"
              >
                <v-progress-circular color="teal" indeterminate size="40" />
              </v-overlay>
            </div>
            <div v-if="hasResult" class="text-caption text-medium-emphasis mt-1">
              {{ resultDimensions }}
            </div>
          </div>
        </v-col>
      </v-row>
    </div>

    <div class="d-md-none">
      <v-tabs v-model="mobileTab" color="teal" density="compact" class="mb-2">
        <v-tab value="original">原图 ({{ originalSize }})</v-tab>
        <v-tab value="result" :disabled="!hasResult">
          压缩后 <template v-if="hasResult">({{ resultSize }})</template>
        </v-tab>
      </v-tabs>
      <div class="viewer-image-wrapper checkerboard rounded-lg" style="position: relative;">
        <v-img
            :src="mobileTab === 'original' ? originalUrl : resultUrl"
            max-height="350"
            contain
            class="rounded-lg"
        />
        <v-overlay
            :model-value="compressing && mobileTab === 'result'"
            contained
            class="align-center justify-center"
            scrim="rgba(0,0,0,0.3)"
        >
          <v-progress-circular color="teal" indeterminate size="40" />
        </v-overlay>
      </div>
      <div v-if="hasResult && mobileTab === 'result'" class="text-caption text-medium-emphasis mt-1">
        {{ resultDimensions }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  originalUrl: { type: String, default: '' },
  resultUrl: { type: String, default: '' },
  originalSize: { type: String, default: '' },
  resultSize: { type: String, default: '' },
  resultDimensions: { type: String, default: '' },
  compressing: { type: Boolean, default: false },
  hasResult: { type: Boolean, default: false }
})

const mobileTab = ref('original')
</script>

<style scoped>
.compare-viewer {
  width: 100%;
}

.viewer-pane {
  width: 100%;
}

.viewer-image-wrapper {
  width: 100%;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.checkerboard {
  background: repeating-conic-gradient(
    rgba(128, 128, 128, 0.1) 0% 25%,
    transparent 0% 50%
  ) 50% / 20px 20px;
  border: 1px solid rgb(var(--v-border-color));
}

.empty-state {
  min-height: 200px;
  width: 100%;
}
</style>
