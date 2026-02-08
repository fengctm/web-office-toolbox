<template>
  <div>
    <div class="text-h6 mb-4">选择尺寸</div>

    <!-- Preset Selection -->
    <div class="mb-6">
      <div class="text-subtitle-2 mb-2">快速预设</div>
      <v-row>
        <v-col
          v-for="(preset, key) in SIZE_PRESETS"
          :key="key"
          cols="6"
        >
          <v-card
            @click="selectPreset(key)"
            :variant="selectedPreset === key ? 'elevated' : 'outlined'"
            :color="selectedPreset === key ? 'primary' : undefined"
            class="cursor-pointer"
            hover
          >
            <v-card-text>
              <div class="text-subtitle-2 font-weight-bold">{{ preset.label }}</div>
              <div class="text-caption">{{ preset.description }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Custom Size Selection -->
    <div class="mb-4">
      <div class="text-subtitle-2 mb-2">自定义尺寸</div>
      <div class="d-flex gap-2 mb-3 flex-wrap">
        <v-chip
          v-for="category in sizeCategories"
          :key="category.name"
          @click="toggleCategory(category.name)"
          :color="isCategorySelected(category.name) ? 'primary' : undefined"
          :variant="isCategorySelected(category.name) ? 'elevated' : 'outlined'"
          class="cursor-pointer"
          size="small"
        >
          {{ category.label }}
        </v-chip>
      </div>

      <!-- Size List -->
      <v-card variant="outlined" max-height="350" class="overflow-y-auto">
        <div v-for="category in sizeCategories" :key="category.name">
          <v-list-item class="cursor-pointer">
            <template v-slot:prepend>
              <v-checkbox-btn
                :model-value="isCategorySelected(category.name)"
                @update:model-value="toggleCategory(category.name)"
              />
            </template>
            <v-list-item-title
              @click="toggleCategory(category.name)"
              class="cursor-pointer"
            >
              {{ category.label }}
            </v-list-item-title>
            <v-list-item-subtitle>{{ category.sizes.length }} 个尺寸</v-list-item-subtitle>
            <template v-slot:append>
              <v-icon
                :class="{ 'rotate-180': expandedCategories.has(category.name) }"
                @click.stop="toggleExpand(category.name)"
                class="cursor-pointer"
              >
                mdi-chevron-down
              </v-icon>
            </template>
          </v-list-item>

          <v-expand-transition>
            <div v-show="expandedCategories.has(category.name)" class="px-4 pb-3">
              <v-row class="mt-2">
                <v-col
                  v-for="size in category.sizes"
                  :key="size"
                  cols="6"
                  sm="4"
                  md="3"
                  class="pa-2"
                >
                  <v-checkbox
                    :value="size"
                    v-model="selectedSizes"
                    :label="`${size}x${size}`"
                    density="comfortable"
                    hide-details
                    class="mb-1"
                  />
                </v-col>
              </v-row>
            </div>
          </v-expand-transition>

          <v-divider v-if="category.name !== Object.keys(ICON_SIZES).pop()" />
        </div>
      </v-card>
    </div>

    <!-- Selection Summary -->
    <v-alert variant="tonal" color="info" class="text-center">
      已选择 <strong>{{ selectedSizes.length }}</strong> 个尺寸
    </v-alert>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ICON_SIZES, SIZE_PRESETS } from '../constants/iconSizes'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const selectedSizes = ref([...props.modelValue])
const selectedPreset = ref(null)
const expandedCategories = ref(new Set(['standard']))

// Size categories
const sizeCategories = computed(() => {
  return Object.entries(ICON_SIZES).map(([name, sizes]) => ({
    name,
    label: getCategoryLabel(name),
    sizes: sizes.map(s => s.size)
  }))
})

function getCategoryLabel(name) {
  const labels = {
    standard: '标准尺寸',
    extended: '扩展尺寸',
    ios: 'iOS',
    android: 'Android'
  }
  return labels[name] || name
}

// Select preset
function selectPreset(presetKey) {
  const preset = SIZE_PRESETS[presetKey]
  if (selectedPreset.value === presetKey) {
    // Deselect
    selectedPreset.value = null
    selectedSizes.value = []
  } else {
    selectedPreset.value = presetKey
    selectedSizes.value = [...preset.sizes]
  }
}

// 只切换展开/折叠状态,不影响选中
function toggleExpand(categoryName) {
  if (expandedCategories.value.has(categoryName)) {
    expandedCategories.value.delete(categoryName)
  } else {
    expandedCategories.value.add(categoryName)
  }
}

// Toggle category
function toggleCategory(categoryName) {
  const sizes = ICON_SIZES[categoryName].map(s => s.size)

  if (isCategorySelected(categoryName)) {
    // Deselect category
    selectedSizes.value = selectedSizes.value.filter(s => !sizes.includes(s))
    selectedPreset.value = null
  } else {
    // Select category
    const newSizes = [...new Set([...selectedSizes.value, ...sizes])]
    selectedSizes.value = newSizes.sort((a, b) => a - b)
    selectedPreset.value = null
  }
}

// Check if category is selected
function isCategorySelected(categoryName) {
  const sizes = ICON_SIZES[categoryName].map(s => s.size)
  return sizes.every(s => selectedSizes.value.includes(s))
}

// Watch for changes
watch(selectedSizes, (newSizes) => {
  emit('update:modelValue', newSizes)
}, { deep: true })

// Initialize
if (props.modelValue.length === 0) {
  // Select standard sizes by default
  selectedSizes.value = ICON_SIZES.standard.map(s => s.size)
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.rotate-180 {
  transform: rotate(180deg);
}
</style>
