<template>
  <v-dialog
    v-model="modelValue"
    max-width="900"
    persistent
  >
    <v-card>
      <v-toolbar color="teal-darken-2">
        <v-toolbar-title>
          <v-icon start icon="mdi-eye"></v-icon>
          页面预览 - 第 {{ currentPage }} 页
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="close" variant="text">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="text-center pa-6">
        <!-- 大图预览区域 -->
        <div class="preview-large">
          <v-icon size="128" color="grey-darken-2" class="preview-icon">mdi-file-pdf-box</v-icon>
          <div class="text-h6 mt-4 text-grey">PDF Page {{ currentPage }}</div>
          <div class="text-body-2 text-grey mt-1">预览占位图 - 实际实现将显示真实PDF页面</div>
        </div>

        <!-- 导航控制 -->
        <div class="navigation-controls mt-6">
          <v-btn
            color="teal"
            variant="outlined"
            :disabled="currentPage <= 1"
            @click="prevPage"
            prepend-icon="mdi-chevron-left"
            class="mr-2"
          >
            上一页
          </v-btn>

          <v-chip color="teal" variant="flat" class="mx-2">
            {{ currentPage }} / {{ totalPages }}
          </v-chip>

          <v-btn
            color="teal"
            variant="outlined"
            :disabled="currentPage >= totalPages"
            @click="nextPage"
            append-icon="mdi-chevron-right"
            class="ml-2"
          >
            下一页
          </v-btn>
        </div>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn color="grey" variant="text" @click="close">关闭</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  currentPage: {
    type: Number,
    default: 1
  },
  totalPages: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits([
  'update:modelValue',
  'update:currentPage',
  'prev-page',
  'next-page'
])

// 计算属性：双向绑定对话框状态
const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 关闭对话框
const close = () => {
  emit('update:modelValue', false)
}

// 上一页
const prevPage = () => {
  if (props.currentPage > 1) {
    emit('prev-page')
  }
}

// 下一页
const nextPage = () => {
  if (props.currentPage < props.totalPages) {
    emit('next-page')
  }
}
</script>

<style scoped>
.preview-large {
  text-align: center;
  padding: 40px 20px;
  background: rgba(0, 150, 136, 0.03);
  border-radius: 8px;
  border: 2px dashed rgba(0, 150, 136, 0.2);
}

.preview-icon {
  opacity: 0.4;
}

.navigation-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

/* 深色模式适配 */
.v-theme--dark .preview-large {
  background: rgba(38, 166, 154, 0.05);
  border-color: rgba(38, 166, 154, 0.3);
}

/* 响应式调整 */
@media (max-width: 600px) {
  .navigation-controls {
    flex-direction: column;
    gap: 8px;
  }

  .navigation-controls .v-btn {
    width: 100%;
  }
}
</style>
