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

      <TransitionGroup 
        name="staggered-list" 
        tag="div" 
        class="v-row"
      >
        <v-col
          v-for="(icon, index) in group"
          :key="icon.fileName"
          cols="6"
          sm="4"
          md="3"
          :style="{ transitionDelay: `${index * 50}ms` }"
        >
          <v-hover v-slot="{ isHovering, props }">
            <v-card 
              v-bind="props"
              :elevation="isHovering ? 8 : 2"
              variant="elevated" 
              class="icon-card rounded-lg"
              @click="downloadIcon(icon)"
            >
              <div class="icon-image-wrapper checkerboard-bg pa-4 d-flex justify-center align-center">
                <v-img
                  :src="icon.dataUrl"
                  :width="icon.size"
                  :height="icon.size"
                  max-width="100%"
                  aspect-ratio="1"
                  contain
                  class="icon-img"
                />
              </div>
              <v-divider></v-divider>
              <v-card-text class="text-center pa-3">
                <div class="text-body-2 font-weight-bold text-truncate mb-1">{{ icon.fileName }}</div>
                <div class="text-caption text-medium-emphasis">{{ icon.size }}x{{ icon.size }} px</div>
              </v-card-text>
              <v-btn
                icon="mdi-download"
                size="small"
                variant="flat"
                class="download-btn"
                :class="{ 'd-none': !isHovering }"
              />
            </v-card>
          </v-hover>
        </v-col>
      </TransitionGroup>
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
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
}

.icon-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 25px 0 rgba(0, 0, 0, 0.1);
}

.icon-image-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 8px 8px 0 0;
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
  transition: all 0.2s ease-in-out;
  background-color: rgba(var(--v-theme-surface), 0.8) !important;
  backdrop-filter: blur(4px);
}

.icon-card:hover .download-btn {
  opacity: 1;
}

.empty-state {
  min-height: 300px;
}

/* Staggered List Transitions */
.staggered-list-move,
.staggered-list-enter-active,
.staggered-list-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.staggered-list-enter-from,
.staggered-list-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(30px);
}

.staggered-list-leave-active {
  position: absolute;
}
</style>
