<template>
  <v-container fluid class="color-generator">
    <v-row>
      <v-col cols="12" lg="4">
        <ColorInput
          v-model="mainColor"
          @color-change="handleColorChange"
        />
      </v-col>

      <v-col cols="12" lg="8">
        <ColorPalette :colors="generatedColors" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import ColorInput from './components/ColorInput.vue'
import ColorPalette from './components/ColorPalette.vue'
import { generateAllColors } from './utils/color-utils.js'

const mainColor = ref('#009688')
const generatedColors = ref(generateAllColors('#009688'))

const updateGeneratedColors = (color) => {
  const colors = generateAllColors(color)
  if (colors) {
    generatedColors.value = colors
    saveState()
  }
}

const handleColorChange = (color) => {
  updateGeneratedColors(color.hex)
}

const saveState = () => {
  const state = {
    mainColor: mainColor.value
  }
  try {
    localStorage.setItem('color-generator-state', JSON.stringify(state))
  } catch (error) {
    console.warn('无法保存状态:', error)
  }
}

const loadState = () => {
  try {
    const saved = localStorage.getItem('color-generator-state')
    if (saved) {
      const state = JSON.parse(saved)
      if (state.mainColor) {
        mainColor.value = state.mainColor
      }
    }
  } catch (error) {
    console.warn('无法加载状态:', error)
  }
}

watch(mainColor, (newColor) => {
  if (newColor) {
    updateGeneratedColors(newColor)
  }
}, { immediate: false })

onMounted(() => {
  loadState()
  updateGeneratedColors(mainColor.value)
})
</script>

<style scoped>
.color-generator {
  padding: 16px;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 600px) {
  .color-generator {
    padding: 8px;
  }
}
</style>
