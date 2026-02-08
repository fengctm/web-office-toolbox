<template>
  <div>
    <div class="text-h6 mb-4">选择格式</div>

    <div class="d-flex flex-column gap-4 mb-4">
      <v-card
        v-for="format in formats"
        :key="format.value"
        @click="toggleFormat(format.value)"
        :variant="isFormatSelected(format.value) ? 'elevated' : 'outlined'"
        :color="isFormatSelected(format.value) ? 'primary' : undefined"
        class="cursor-pointer"
        hover
      >
        <v-card-item class="py-3">
          <template v-slot:prepend>
            <v-avatar color="grey-lighten-2" size="40">
              <span class="text-body-1 font-weight-bold">{{ format.value.toUpperCase() }}</span>
            </v-avatar>
          </template>
          <v-card-title class="text-subtitle-1">{{ format.label }}</v-card-title>
          <v-card-subtitle class="text-caption">{{ format.description }}</v-card-subtitle>
          <template v-slot:append>
            <v-checkbox-btn
              :model-value="isFormatSelected(format.value)"
              @click.stop
            />
          </template>
        </v-card-item>
      </v-card>
    </div>

    <!-- Selection Summary -->
    <v-alert variant="tonal" color="info" class="text-center">
      已选择 <strong>{{ selectedFormats.length }}</strong> 种格式
    </v-alert>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ICON_FORMATS } from '../constants/iconFormats'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => ['png']
  }
})

const emit = defineEmits(['update:modelValue'])

const selectedFormats = ref([...props.modelValue])
const formats = Object.values(ICON_FORMATS)

function isFormatSelected(format) {
  return selectedFormats.value.includes(format)
}

function toggleFormat(format) {
  if (selectedFormats.value.includes(format)) {
    selectedFormats.value = selectedFormats.value.filter(f => f !== format)
  } else {
    selectedFormats.value.push(format)
  }
}

watch(selectedFormats, (newFormats) => {
  emit('update:modelValue', newFormats)
}, { deep: true })
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
