<template>
  <v-snackbar
    v-model="modelValue"
    :color="color"
    :timeout="timeout"
    location="top right"
  >
    {{ message }}
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

// 计算属性：双向绑定snackbar状态
const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>

<style scoped>
/* 组件样式 */
</style>
