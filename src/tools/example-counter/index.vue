<template>
  <v-card class="counter-tool" elevation="2">
    <v-card-item>
      <v-card-title class="d-flex align-center">
        <v-icon color="teal" class="mr-2">mdi-counter</v-icon>
        示例计数器
      </v-card-title>
      <v-card-subtitle>
        一个简单的计数器，演示工具箱的基本功能
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <!-- 计数器显示 -->
      <div class="counter-display text-center mb-6">
        <div class="counter-value">{{ count }}</div>
        <div class="counter-label text-grey">当前数值</div>
      </div>

      <!-- 控制按钮 -->
      <div class="controls d-flex justify-center flex-wrap gap-2">
        <v-btn
          color="error"
          variant="tonal"
          size="large"
          :disabled="count <= 0"
          @click="decrement"
          prepend-icon="mdi-minus"
        >
          减少
        </v-btn>

        <v-btn
          color="grey"
          variant="tonal"
          size="large"
          @click="reset"
          prepend-icon="mdi-refresh"
        >
          重置
        </v-btn>

        <v-btn
          color="success"
          variant="tonal"
          size="large"
          @click="increment"
          prepend-icon="mdi-plus"
        >
          增加
        </v-btn>
      </div>

      <!-- 步长设置 -->
      <div class="step-config mt-6">
        <v-slider
          v-model="step"
          :min="1"
          :max="10"
          :step="1"
          label="步长"
          color="teal"
          thumb-label
        >
          <template v-slot:append>
            <v-text-field
              v-model="step"
              type="number"
              style="width: 60px"
              density="compact"
              hide-details
            ></v-text-field>
          </template>
        </v-slider>
      </div>

      <!-- 历史记录 -->
      <div class="history mt-6" v-if="history.length > 0">
        <v-divider class="mb-3"></v-divider>
        <div class="text-subtitle-2 mb-2">操作历史</div>
        <v-chip-group column>
          <v-chip
            v-for="(item, index) in history"
            :key="index"
            size="small"
            :color="item.type === 'inc' ? 'success' : item.type === 'dec' ? 'error' : 'grey'"
            variant="outlined"
          >
            {{ item.type === 'inc' ? '+' : item.type === 'dec' ? '-' : 'R' }}
            {{ item.value }}
          </v-chip>
        </v-chip-group>
      </div>
    </v-card-text>

    <v-card-actions class="justify-end">
      <v-btn
        color="teal"
        variant="text"
        @click="clearHistory"
        :disabled="history.length === 0"
      >
        清除历史
      </v-btn>
    </v-card-actions>

    <!-- 提示消息 -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="2000"
      location="bottom right"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const emit = defineEmits(['update:loading'])

// 响应式状态
const count = ref(0)
const step = ref(1)
const history = ref([])
const snackbar = ref({
  show: false,
  message: '',
  color: 'info'
})

// 计数器操作
const increment = () => {
  const oldValue = count.value
  count.value += step.value
  addToHistory('inc', step.value)
  showSnack(`+${step.value} ( ${oldValue} → ${count.value} )`, 'success')
}

const decrement = () => {
  if (count.value <= 0) {
    showSnack('计数器不能小于0', 'warning')
    return
  }
  const oldValue = count.value
  count.value -= step.value
  addToHistory('dec', step.value)
  showSnack(`-${step.value} ( ${oldValue} → ${count.value} )`, 'error')
}

const reset = () => {
  if (count.value === 0) {
    showSnack('计数器已经是0', 'info')
    return
  }
  const oldValue = count.value
  count.value = 0
  addToHistory('reset', oldValue)
  showSnack(`重置: ${oldValue} → 0`, 'info')
}

// 历史记录
const addToHistory = (type, value) => {
  history.value.unshift({
    type,
    value,
    timestamp: new Date().toLocaleTimeString()
  })

  // 限制历史记录数量
  if (history.value.length > 10) {
    history.value = history.value.slice(0, 10)
  }
}

const clearHistory = () => {
  history.value = []
  showSnack('历史记录已清除', 'info')
}

// 工具提示
const showSnack = (message, color = 'info') => {
  snackbar.value = {
    show: true,
    message,
    color
  }
}

// 自动保存/加载
const saveState = () => {
  try {
    const state = {
      count: count.value,
      step: step.value,
      history: history.value
    }
    localStorage.setItem('counter-state', JSON.stringify(state))
  } catch (error) {
    console.warn('保存状态失败:', error)
  }
}

const loadState = () => {
  try {
    const saved = localStorage.getItem('counter-state')
    if (saved) {
      const state = JSON.parse(saved)
      count.value = state.count || 0
      step.value = state.step || 1
      history.value = state.history || []
    }
  } catch (error) {
    console.warn('加载状态失败:', error)
  }
}

// 监听变化自动保存
watch([count, step], () => {
  saveState()
}, { deep: true })

// 组件挂载时加载状态
loadState()
</script>

<style scoped>
.counter-tool {
  border-radius: 12px;
  overflow: hidden;
}

.counter-display {
  padding: 30px 20px;
  background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.counter-display::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.counter-value {
  font-size: 4rem;
  font-weight: 700;
  color: #009688;
  line-height: 1;
  margin-bottom: 8px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

.counter-label {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.controls {
  gap: 12px;
}

.history {
  max-height: 200px;
  overflow-y: auto;
}

/* 深色模式适配 */
:deep(.v-theme--dark) .counter-display {
  background: linear-gradient(135deg, #004d40 0%, #00695c 100%);
}

:deep(.v-theme--dark) .counter-value {
  color: #26a69a;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

/* 响应式调整 */
@media (max-width: 600px) {
  .counter-value {
    font-size: 3rem;
  }

  .controls {
    flex-direction: column;
  }

  .controls .v-btn {
    width: 100%;
  }
}
</style>
