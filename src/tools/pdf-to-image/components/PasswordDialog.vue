<template>
  <v-dialog
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      max-width="400"
      persistent
  >
    <v-card>
      <v-toolbar color="teal-darken-2">
        <v-toolbar-title>
          <v-icon start icon="mdi-lock"></v-icon>
          输入PDF密码
        </v-toolbar-title>
      </v-toolbar>

      <v-card-text class="pt-4">
        <v-alert
            type="info"
            variant="tonal"
            icon="mdi-shield-alert"
            class="mb-4"
        >
          此PDF文件已加密，需要密码才能访问
        </v-alert>

        <v-text-field
            v-model="password"
            label="PDF密码"
            type="password"
            variant="outlined"
            density="comfortable"
            autofocus
            placeholder="请输入密码"
            @keyup.enter="confirm"
        ></v-text-field>

        <div class="text-caption text-grey mt-2">
          提示：某些PDF可能需要密码才能解析和转换
        </div>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn
            color="grey"
            variant="text"
            @click="cancel"
        >
          取消
        </v-btn>
        <v-btn
            color="teal"
            variant="flat"
            @click="confirm"
            :disabled="!password"
        >
          确认
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import {ref, watch} from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:modelValue',
  'confirm',
  'cancel'
])

const password = ref('')

// 监听对话框状态重置密码
watch(() => props.modelValue, (visible) => {
  if (visible) {
    password.value = ''
  }
})

// 确认密码
const confirm = () => {
  if (password.value.trim()) {
    emit('confirm', password.value.trim())
    emit('update:modelValue', false)
  }
}

// 取消
const cancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.v-card {
  border-radius: 8px;
}
</style>
