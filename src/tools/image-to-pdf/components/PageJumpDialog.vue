<template>
  <v-dialog :model-value="modelValue" @update:model-value="updateModelValue" max-width="300" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon color="primary" class="mr-2">mdi-arrow-right-bold</v-icon>
        移动图片位置
      </v-card-title>
      <v-card-text>
        <div class="mb-2 text-body-1">将选中的图片（第 {{ currentIndex + 1 }} 页）移动到：</div>
        <v-text-field
            v-model.number="targetPage"
            type="number"
            min="1"
            :max="totalPages"
            label="目标页码"
            variant="outlined"
            density="comfortable"
            color="primary"
            hide-details
            autofocus
            @keyup.enter="confirm"
        ></v-text-field>
        <div class="text-caption text-on-surface-variant mt-2">
          有效范围：1 - {{ totalPages }}
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="close">取消</v-btn>
        <v-btn color="primary" @click="confirm" :disabled="!isValid">确定</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  currentIndex: {
    type: Number,
    default: 0
  },
  totalPages: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

// 更新模型值
const updateModelValue = (value) => {
  emit('update:modelValue', value)
}

const targetPage = ref(1)

// 重置目标页码当对话框打开时
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    targetPage.value = props.currentIndex + 1
  }
})

// 验证目标页码是否有效
const isValid = computed(() => {
  const page = parseInt(targetPage.value)
  return page >= 1 && page <= props.totalPages && page !== props.currentIndex + 1
})

// 确认
const confirm = () => {
  if (isValid.value) {
    emit('confirm', targetPage.value)
    close()
  }
}

// 关闭
const close = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped>
/* 组件样式 */
</style>
