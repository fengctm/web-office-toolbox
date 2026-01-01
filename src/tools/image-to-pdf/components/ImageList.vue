<template>
  <div class="image-section">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="d-flex justify-center align-center ga-2">
        <div class="text-subtitle-1 font-weight-medium text-high-emphasis">图片库</div>
        <v-chip size="small" color="primary" variant="outlined" class="count">
          {{ imageList.length }}
        </v-chip>
      </div>

      <div class="actions-group">
        <v-menu>
          <template #activator="{ props }">
            <v-btn
                v-bind="props"
                size="small"
                variant="text"
                color="on-surface-variant"
                prepend-icon="mdi-sort-variant"
            >
              排序
            </v-btn>
          </template>
          <v-list density="compact" bg-color="surface">
            <v-list-item @click="handleSort('name')">
              <v-list-item-title>按文件名称</v-list-item-title>
            </v-list-item>
            <v-list-item @click="handleSort('id')">
              <v-list-item-title>按原始顺序</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>

    <!-- 图片网格容器 -->
    <div ref="gridContainer" class="grid-container">
      <div
          v-for="(image, index) in imageList"
          :key="image.id"
          v-memo="[image.id, index]"
          class="card"
          :data-id="image.id"
      >
        <!-- 图片区域 -->
        <div class="image-area">
          <img :src="image.preview" alt="" draggable="false" loading="lazy" style="object-fit: contain; background: #f5f5f5;"/>
          <div class="overlay">
            <div class="card-actions">
              <v-btn
                  icon="mdi-close"
                  size="small"
                  variant="elevated"
                  color="error"
                  @click.stop="remove(index)"
              />
            </div>
          </div>
        </div>

        <!-- 信息与控制区域 -->
        <div class="control-wrapper">
          <div class="info-area">
            <div class="name">{{ image.name }}</div>
          </div>

          <!-- 快捷排序控制条 -->
          <div class="page-controls" @click.stop>
            <!-- 左右按钮：使用 text 变体，颜色 on-surface-variant，清晰锐利 -->
            <v-btn
                icon="mdi-chevron-left"
                variant="text"
                density="comfortable"
                size="small"
                color="on-surface-variant"
                :disabled="index === 0"
                @click="moveOne(index, -1)"
            ></v-btn>

            <div class="page-input-box">
              <input
                  type="number"
                  :value="index + 1"
                  min="1"
                  :max="imageList.length"
                  @keyup.enter="handleJump($event, index)"
                  @blur="handleJump($event, index)"
              />
            </div>

            <v-btn
                icon="mdi-chevron-right"
                variant="text"
                density="comfortable"
                size="small"
                color="on-surface-variant"
                :disabled="index === imageList.length - 1"
                @click="moveOne(index, 1)"
            ></v-btn>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {nextTick, onMounted, onUnmounted, ref} from 'vue'

const props = defineProps({
  imageList: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['remove-image', 'move-image', 'sort-images'])

const remove = (index) => {
  emit('remove-image', index)
}

const handleSort = (field) => {
  emit('sort-images', field)
}

const moveOne = (index, delta) => {
  const to = index + delta
  if (to >= 0 && to < props.imageList.length) {
    emit('move-image', {from: index, to})
  }
}

const gridContainer = ref(null)
let sortableInstance = null

const initSortable = async () => {
  await nextTick()
  if (!gridContainer.value) return

  try {
    const {default: Sortable} = await import('sortablejs')
    if (sortableInstance) {
      sortableInstance.destroy()
    }

    // 精准拖拽：只允许通过图片区域拖拽，避免干扰底部输入框
    sortableInstance = Sortable.create(gridContainer.value, {
      animation: 200,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      handle: '.image-area', // 限制拖拽手柄为图片区域
      delay: 0, // 立即响应
      forceFallback: false, // 使用原生拖拽
      onEnd(evt) {
        const {oldIndex, newIndex} = evt
        if (oldIndex === newIndex) return

        // 显示拖拽成功提示
        emit('move-image', {from: oldIndex, to: newIndex})
      }
    })
  } catch (error) {
    console.error('Sortable init failed:', error)
  }
}

// 优化页码跳转：支持失焦和回车
const handleJump = (event, currentIndex) => {
  const input = event.target
  const val = parseInt(input.value)

  if (isNaN(val) || val < 1) {
    input.value = currentIndex + 1
    return
  }

  const targetIndex = Math.min(val - 1, props.imageList.length - 1)

  if (targetIndex === currentIndex) {
    input.value = currentIndex + 1
    return
  }

  emit('move-image', {from: currentIndex, to: targetIndex})

  // 自动聚焦到下一个输入框（提升效率）
  nextTick(() => {
    const inputs = document.querySelectorAll('.page-input-box input')
    if (inputs[targetIndex]) {
      inputs[targetIndex].focus()
      inputs[targetIndex].select()
    }
  })
}

onMounted(() => {
  initSortable()
})

onUnmounted(() => {
  if (sortableInstance) sortableInstance.destroy()
})
</script>

<style scoped>
/* --- 容器布局 --- */
.image-section {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgb(var(--v-theme-background));
  overflow: hidden;
}

/* --- 工具栏 --- */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
  z-index: 10;
}

/* --- 网格容器 --- */
.grid-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  align-content: start;
}

/* --- 卡片设计 --- */
.card {
  background-color: rgb(var(--v-theme-surface));
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-outline), 0.08);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.card:hover {
  box-shadow: 0 8px 16px rgba(0,0,0,0.15);
  border-color: rgba(var(--v-theme-primary), 0.3);
}

/* --- 图片区域 --- */
.image-area {
  position: relative;
  width: 100%;
  padding-top: 75%;
  /* 背景移除，保持透明或极淡，让图片内容凸显 */
  background-color: transparent;
  cursor: grab;
}

/* 如果图片加载失败或透明背景时的占位色 */
.image-area img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  /* 图片本身无需背景，依靠容器背景 */
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.1) 100%);
  opacity: 0;
  transition: opacity 0.2s ease;
  padding: 8px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
}

.card:hover .overlay {
  opacity: 1;
}

/* --- 底部控制区 --- */
.control-wrapper {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgb(var(--v-theme-surface));
  /* 边框极其淡化 */
  border-top: 1px solid rgba(var(--v-theme-outline), 0.04);
}

/* --- 文件名文字 --- */
.info-area {
  width: 100%;
  min-height: 1.5em;
  display: flex;
  align-items: center;
  justify-content: center;
}

.name {
  width: 100%;
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

/* --- 页码控制器 --- */
.page-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  /* 背景色调整为极度透明的 outline，几乎不可见，仅用于微调层次 */
  background-color: rgba(var(--v-theme-outline), 0.05);
  border-radius: 8px;
  padding: 4px 8px; /* 稍微增加内边距，让布局更舒展 */
  height: 36px; /* 固定高度，防止抖动 */
}

.page-input-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
}

.page-input-box input {
  width: 100%;
  border: none;
  background: transparent;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  outline: none;
  padding: 2px 0;
}

.page-input-box input::-webkit-outer-spin-button,
.page-input-box input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* --- 拖拽状态 --- */
.sortable-ghost {
  opacity: 0.4;
  background-color: rgba(var(--v-theme-primary), 0.08) !important;
  border: 1px dashed rgba(var(--v-theme-primary), 0.5);
}

.sortable-drag {
  opacity: 1;
  box-shadow: 0 12px 24px rgba(0,0,0,0.25);
  cursor: grabbing;
  background-color: rgb(var(--v-theme-surface)) !important;
}

/* --- 响应式 --- */
@media (max-width: 600px) {
  .grid-container {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    padding: 8px;
    gap: 12px;
  }
  .name {
    font-size: 12px;
  }
  .control-wrapper {
    padding: 8px;
    gap: 8px;
  }
  .page-controls {
    padding: 2px 4px;
    height: 32px;
  }
}
</style>
