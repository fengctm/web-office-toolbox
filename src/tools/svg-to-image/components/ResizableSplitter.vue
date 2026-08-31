<template>
  <div
    ref="containerRef"
    class="resizable-splitter"
    :class="[`direction-${direction}`, { 'is-dragging': isDragging }]"
  >
    <!-- 第一面板（左/上） -->
    <div class="split-pane first-pane" :style="firstPaneStyle">
      <slot name="first" />
    </div>

    <!-- 拖拽手柄分割条 -->
    <div
      class="splitter-bar"
      :class="{ 'is-active': isDragging }"
      @mousedown="startDrag"
      @touchstart.passive="startTouchDrag"
      @dblclick="resetRatio"
      title="拖拽调整大小，双击复位"
    >
      <div class="splitter-handle">
        <div class="grip-line"></div>
      </div>
    </div>

    <!-- 第二面板（右/下） -->
    <div class="split-pane second-pane" :style="secondPaneStyle">
      <slot name="second" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

const props = defineProps({
  direction: {
    type: String,
    default: 'horizontal', // 'horizontal' (左右) | 'vertical' (上下)
    validator: (v) => ['horizontal', 'vertical'].includes(v)
  },
  modelValue: {
    type: Number,
    default: 50 // 百分比 0 - 100
  },
  min: {
    type: Number,
    default: 20
  },
  max: {
    type: Number,
    default: 80
  }
})

const emit = defineEmits(['update:modelValue', 'drag-start', 'drag-end'])

const containerRef = ref(null)
const isDragging = ref(false)
const currentRatio = ref(props.modelValue)

// 响应父组件 modelValue 更新
const ratio = computed(() => {
  return Math.min(Math.max(props.modelValue, props.min), props.max)
})

const firstPaneStyle = computed(() => {
  if (props.direction === 'horizontal') {
    return {
      width: `${ratio.value}%`,
      height: '100%'
    }
  } else {
    return {
      width: '100%',
      height: `${ratio.value}%`
    }
  }
})

const secondPaneStyle = computed(() => {
  if (props.direction === 'horizontal') {
    return {
      width: `${100 - ratio.value}%`,
      height: '100%'
    }
  } else {
    return {
      width: '100%',
      height: `${100 - ratio.value}%`
    }
  }
})

const updateRatioFromPosition = (clientX, clientY) => {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  let newRatio = 50

  if (props.direction === 'horizontal') {
    const offset = clientX - rect.left
    newRatio = (offset / rect.width) * 100
  } else {
    const offset = clientY - rect.top
    newRatio = (offset / rect.height) * 100
  }

  const clamped = Math.min(Math.max(newRatio, props.min), props.max)
  emit('update:modelValue', Math.round(clamped * 10) / 10)
}

const onMouseMove = (e) => {
  if (!isDragging.value) return
  e.preventDefault()
  updateRatioFromPosition(e.clientX, e.clientY)
}

const onMouseUp = () => {
  if (!isDragging.value) return
  isDragging.value = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  emit('drag-end')
}

const startDrag = (e) => {
  e.preventDefault()
  isDragging.value = true
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  document.body.style.cursor = props.direction === 'horizontal' ? 'col-resize' : 'row-resize'
  document.body.style.userSelect = 'none'
  emit('drag-start')
}

// 触屏事件适配
const onTouchMove = (e) => {
  if (!isDragging.value || !e.touches[0]) return
  updateRatioFromPosition(e.touches[0].clientX, e.touches[0].clientY)
}

const onTouchEnd = () => {
  isDragging.value = false
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
  emit('drag-end')
}

const startTouchDrag = () => {
  isDragging.value = true
  document.addEventListener('touchmove', onTouchMove, { passive: true })
  document.addEventListener('touchend', onTouchEnd)
  emit('drag-start')
}

// 双击复位 50%
const resetRatio = () => {
  emit('update:modelValue', 50)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
})
</script>

<style scoped lang="scss">
.resizable-splitter {
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;

  &.direction-horizontal {
    flex-direction: row;

    .splitter-bar {
      width: 10px;
      margin: 0 -5px;
      cursor: col-resize;
      height: 100%;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;

      .grip-line {
        width: 3px;
        height: 36px;
        border-radius: 3px;
        background-color: rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
      }

      &:hover .grip-line,
      &.is-active .grip-line {
        background-color: #0d9488;
        transform: scaleY(1.2);
      }
    }
  }

  &.direction-vertical {
    flex-direction: column;

    .splitter-bar {
      height: 10px;
      margin: -5px 0;
      cursor: row-resize;
      width: 100%;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;

      .grip-line {
        width: 36px;
        height: 3px;
        border-radius: 3px;
        background-color: rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
      }

      &:hover .grip-line,
      &.is-active .grip-line {
        background-color: #0d9488;
        transform: scaleX(1.2);
      }
    }
  }

  .split-pane {
    position: relative;
    overflow: hidden;
    min-width: 0;
    min-height: 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  &.is-dragging {
    cursor: grab;
    user-select: none;
  }
}

.v-theme--dark {
  .splitter-bar {
    .grip-line {
      background-color: rgba(255, 255, 255, 0.2) !important;
    }
    &:hover .grip-line,
    &.is-active .grip-line {
      background-color: #14b8a6 !important;
    }
  }
}
</style>
