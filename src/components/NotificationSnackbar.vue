<template>
  <v-snackbar
      :model-value="modelValue"
      @update:model-value="updateModelValue"
      :color="color"
      :timeout="timeout"
      location="top right"
      elevation="4"
      class="notification-snackbar"
  >
    <div class="d-flex align-center">
      <v-icon class="mr-2">{{ icon }}</v-icon>
      <span class="font-weight-medium">{{ message }}</span>
    </div>

    <template v-slot:actions>
      <v-btn variant="text" icon="mdi-close" @click="close"></v-btn>
    </template>
  </v-snackbar>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: 'info'
  },
  timeout: {
    type: Number,
    default: 4000
  }
})

const emit = defineEmits(['update:modelValue'])

// 根据颜色选择图标
const icon = computed(() => {
  const iconMap = {
    success: 'mdi-check-circle',
    error: 'mdi-alert-circle',
    warning: 'mdi-alert',
    info: 'mdi-information'
  }
  return iconMap[props.color] || 'mdi-information'
})

// 更新模型值
const updateModelValue = (value) => {
  emit('update:modelValue', value)
}

// 关闭
const close = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.notification-snackbar {
  font-weight: 500;
}
</style>
