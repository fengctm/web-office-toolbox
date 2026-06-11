<template>
  <v-card elevation="1" rounded="lg">
    <v-card-title class="text-subtitle-1 font-weight-medium">排除规则</v-card-title>
    <v-divider />
    <v-card-text>
      <p class="text-caption text-medium-emphasis mb-3">以下目录/文件将在扫描时被跳过：</p>

      <div class="d-flex flex-wrap ga-2 mb-4">
        <v-chip
          v-for="(rule, i) in exclusions"
          :key="rule"
          closable
          variant="outlined"
          color="teal"
          size="small"
          @click:close="remove(i)"
        >
          {{ rule }}
        </v-chip>
      </div>

      <div class="d-flex ga-2">
        <v-text-field
          v-model="inputVal"
          density="compact"
          variant="outlined"
          placeholder="输入目录名，如 dist、build"
          hide-details
          @keydown.enter="add"
        />
        <v-btn color="teal" variant="flat" @click="add" :disabled="!inputVal.trim()">
          添加
        </v-btn>
      </div>

      <p class="text-caption text-medium-emphasis mt-2">更改排除规则后，需要重新扫描才能生效。</p>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  exclusions: { type: Array, default: () => [] },
})

const emit = defineEmits(['add', 'remove'])

const inputVal = ref('')

function add() {
    const val = inputVal.value.trim()
    if (!val) return
    emit('add', val)
    inputVal.value = ''
}

function remove(index) {
    emit('remove', index)
}
</script>
