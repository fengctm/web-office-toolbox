<template>
  <div>
    <v-card-item>
      <v-card-title>生成预览</v-card-title>
      <template v-slot:append>
        <v-chip size="small">共 {{ icons.length }} 个</v-chip>
      </template>
    </v-card-item>

    <v-divider></v-divider>

    <!-- Group by format -->
    <div v-for="(group, format) in groupedIcons" :key="format" class="pa-4">
      <div class="d-flex justify-space-between align-center mb-3">
        <div class="text-h6">{{ format.toUpperCase() }}</div>
        <v-btn
          @click="downloadFormat(format)"
          size="small"
          variant="tonal"
          color="primary"
          prepend-icon="mdi-download"
        >
          下载全部 {{ format.toUpperCase() }}
        </v-btn>
      </div>

      <v-row>
        <v-col
          v-for="icon in group"
          :key="icon.fileName"
          cols="6"
          sm="4"
          md="3"
        >
          <v-card variant="outlined" class="icon-card">
            <div class="icon-image-wrapper checkerboard-bg">
              <v-img
                :src="icon.dataUrl"
                aspect-ratio="1"
                cover
              />
            </div>
            <v-card-text class="text-center pa-2">
              <div class="text-caption font-weight-bold text-truncate">{{ icon.fileName }}</div>
              <div class="text-caption text-grey-darken-1">{{ icon.size }}x{{ icon.size }}</div>
            </v-card-text>
            <v-btn
              @click="downloadIcon(icon)"
              icon="mdi-download"
              size="small"
              variant="text"
              class="download-btn"
            />
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Empty State -->
    <div v-if="icons.length === 0" class="empty-state d-flex flex-column align-center justify-center pa-12">
      <v-icon size="80" color="grey-lighten-1" class="mb-4">mdi-image-outline</v-icon>
      <div class="text-h6 text-grey-darken-1">暂无生成的图标</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useIconExport } from '../composables/useIconExport'

const props = defineProps({
  icons: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['download'])

const { downloadSingleIcon } = useIconExport()

// Group by format
const groupedIcons = computed(() => {
  return props.icons.reduce((groups, icon) => {
    if (!groups[icon.format]) {
      groups[icon.format] = []
    }
    groups[icon.format].push(icon)
    return groups
  }, {})
})

// Download single icon
function downloadIcon(icon) {
  downloadSingleIcon(icon)
}

// Download all icons of a format
function downloadFormat(format) {
  const formatIcons = groupedIcons.value[format]
  emit('download', formatIcons)
}
</script>

<style scoped>
.icon-card {
  position: relative;
}

.icon-image-wrapper {
  position: relative;
}

.checkerboard-bg {
  background-image:
    linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
  background-size: 10px 10px;
  background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
}

.v-theme--dark .checkerboard-bg {
  background-image:
    linear-gradient(45deg, #2a2a2a 25%, transparent 25%),
    linear-gradient(-45deg, #2a2a2a 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #2a2a2a 75%),
    linear-gradient(-45deg, transparent 75%, #2a2a2a 75%);
  background-size: 10px 10px;
  background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
}

.download-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.icon-card:hover .download-btn {
  opacity: 1;
}

.empty-state {
  min-height: 300px;
}
</style>
