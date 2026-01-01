<template>
  <div class="image-section">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="d-flex justify-center align-center ga-2">
        <div class="title">图片库</div>
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
                color="surface-variant"
                prepend-icon="mdi-sort-variant"
            >
              排序
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click="handleSort('name')">
              <v-list-item-title>按文件名称</v-list-item-title>
            </v-list-item>
            <v-list-item @click="handleSort('id')">
              <v-list-item-title>按原始顺序</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-spacer/>
        <v-btn
            size="small"
            color="primary"
            variant="tonal"
            prepend-icon="mdi-plus"
            @click="addMore"
        >
          添加图片
        </v-btn>
      </div>
    </div>

    <!-- 图片网格容器 -->
    <div ref="gridContainer" class="grid-container">
      <!-- 性能优化：使用 v-memo 减少不必要的重绘 -->
      <div
          v-for="(image, index) in imageList"
          :key="image.id"
          v-memo="[image.id, index, imageList.length]"
          class="card"
          :data-id="image.id"
      >
        <!-- 图片区域 -->
        <div class="image-area">
          <img :src="image.preview" alt="" draggable="false" loading="lazy"/>
          <div class="overlay">
            <div class="card-actions">
              <v-btn
                  icon="mdi-close"
                  size="x-small"
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

          <!-- 新增：快捷排序控制条 -->
          <div class="page-controls" @click.stop>
            <v-btn
                icon="mdi-chevron-left"
                variant="text"
                size="x-small"
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
                size="x-small"
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

const emit = defineEmits(['remove-image', 'add-more', 'move-image', 'sort-images'])

// --- 逻辑处理 ---

const remove = (index) => {
  emit('remove-image', index)
}

const addMore = () => {
  emit('add-more')
}

const handleSort = (field) => {
  emit('sort-images', field)
}

/**
 * 左右移动一位
 */
const moveOne = (index, delta) => {
  const to = index + delta
  if (to >= 0 && to < props.imageList.length) {
    emit('move-image', { from: index, to })
  }
}

/**
 * 跳转到指定页码
 */
const handleJump = (event, currentIndex) => {
  const val = parseInt(event.target.value)
  if (isNaN(val)) {
    event.target.value = currentIndex + 1
    return
  }

  // 转换为从 0 开始的索引
  let targetIndex = val - 1

  // 边界约束
  if (targetIndex < 0) targetIndex = 0
  if (targetIndex >= props.imageList.length) targetIndex = props.imageList.length - 1

  if (targetIndex === currentIndex) {
    event.target.value = currentIndex + 1
    return
  }

  emit('move-image', { from: currentIndex, to: targetIndex })
}

// --- Sortable.js 拖拽配置 ---
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

    sortableInstance = Sortable.create(gridContainer.value, {
      animation: 200,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      handle: '.image-area', // 限制只有点击图片区域可以拖拽，避免干扰底部输入框
      onEnd(evt) {
        const {oldIndex, newIndex} = evt
        if (oldIndex === newIndex) return
        emit('move-image', {from: oldIndex, to: newIndex})
      }
    })
  } catch (error) {
    console.error('Sortable init failed:', error)
  }
}

onMounted(() => {
  initSortable()
})

onUnmounted(() => {
  if (sortableInstance) sortableInstance.destroy()
})
</script>

<style scoped>
.image-section {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgba(var(--v-theme-background), 1);
  overflow: hidden;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(var(--v-theme-surface), 1);
  border-bottom: 1px solid rgba(var(--v-theme-outline-variant), 1);
  z-index: 10;
}

.grid-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  align-content: start;
}

.card {
  background-color: rgba(var(--v-theme-surface), 0.95);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-outline-variant), 0.5);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border-color: rgba(var(--v-theme-primary), 0.8);
}

.image-area {
  position: relative;
  width: 100%;
  padding-top: 75%;
  background-color: rgba(var(--v-theme-surface-variant), 0.6);
  cursor: grab;
}

.image-area img {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  object-fit: contain;
  background: rgba(var(--v-theme-surface-variant), 0.3);
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.2s;
  padding: 8px;
}

.card:hover .overlay {
  opacity: 1;
}

.badge {
  position: absolute;
  top: 8px; left: 8px;
  background: rgba(var(--v-theme-primary), 0.9);
  color: rgba(var(--v-theme-on-primary), 1);
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

/* 控制区域 */
.control-wrapper {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(var(--v-theme-surface), 0.95);
}

.info-area .name {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.75);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.page-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 6px;
  padding: 2px;
}

.page-input-box {
  display: flex;
  align-items: center;
}

.page-input-box input {
  width: 40px;
  height: 24px;
  border: 1px solid rgba(var(--v-theme-outline), 0.6);
  border-radius: 4px;
  background: rgba(var(--v-theme-surface), 0.8);
  text-align: center;
  font-size: 12px;
  font-weight: bold;
  color: rgba(var(--v-theme-primary), 1);
  outline: none;
}

.page-input-box input:focus {
  border-color: rgba(var(--v-theme-primary), 1);
  background: rgba(var(--v-theme-surface), 1);
}

/* 移除 Chrome/Safari 数字输入框箭头 */
.page-input-box input::-webkit-outer-spin-button,
.page-input-box input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* 拖拽样式 */
.sortable-ghost {
  opacity: 0.2;
  border: 2px dashed rgba(var(--v-theme-primary), 1);
}

@media (max-width: 600px) {
  .grid-container {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    padding: 8px;
    gap: 8px;
  }
}
</style>
