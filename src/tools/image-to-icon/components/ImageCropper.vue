<template>
  <div class="image-cropper">
    <!-- 状态 1: 等待上传 -->
    <ImageUploader
      v-if="state === STATE.IDLE"
      key="uploader"
      :allow-animated="false"
      :drag-enabled="true"
      :max-size="10 * 1024 * 1024"
      :multiple="false"
      button-text="选择图片"
      upload-subtext="支持 JPEG、PNG、WebP 格式"
      upload-text="点击上传或拖拽图片到此处"
      @files-selected="handleFilesSelected"
      @file-error="handleFileError"
    />

    <!-- 状态 2: 加载中 -->
    <div v-else-if="state === STATE.LOADING" class="loading-container">
      <v-progress-circular indeterminate color="primary" size="64" />
      <div class="text-h6 mt-4">正在加载图片...</div>
    </div>

    <!-- 状态 3: 裁切就绪 -->
    <div v-show="state === STATE.READY" class="cropper-layout">
      <div class="cropper-wrapper elevation-2 bg-grey-lighten-4">
        <img
          ref="imageRef"
          :src="imageUrl"
          alt="Source"
          class="cropper-image"
          @load="handleImageLoad"
        />
      </div>

      <v-card class="mt-6 rounded-lg" variant="outlined">
        <v-card-text>
          <!-- 控制按钮 -->
          <div class="d-flex justify-center flex-wrap gap-2 mb-6">
            <v-btn icon="mdi-rotate-left" variant="text" density="comfortable" title="向左旋转" @click="rotate(-90)" />
            <v-btn icon="mdi-rotate-right" variant="text" density="comfortable" title="向右旋转" @click="rotate(90)" />
            <v-divider vertical class="mx-2"></v-divider>
            <v-btn icon="mdi-flip-horizontal" variant="text" density="comfortable" title="水平翻转" @click="flip('horizontal')" />
            <v-btn icon="mdi-flip-vertical" variant="text" density="comfortable" title="垂直翻转" @click="flip('vertical')" />
            <v-divider vertical class="mx-2"></v-divider>
            <v-btn icon="mdi-refresh" variant="text" density="comfortable" title="重置" @click="reset" />
          </div>

          <!-- 操作按钮 -->
          <div class="d-flex justify-end gap-2 flex-wrap">
            <v-btn variant="text" color="error" @click="cancel">取消</v-btn>
            <v-btn color="primary" @click="confirmCrop" prepend-icon="mdi-check">确认裁切</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- 状态 4: 错误 -->
    <div v-else class="error-container">
      <v-icon size="64" color="error">mdi-alert-circle</v-icon>
      <div class="text-h6 mt-4">{{ errorMessage }}</div>
      <v-btn color="primary" class="mt-4" @click="resetToIdle">重新上传</v-btn>
    </div>

    <!-- 通知 -->
    <NotificationSnackbar
      v-model="localSnackbar.show"
      :color="localSnackbar.color"
      :message="localSnackbar.message"
    />
  </div>
</template>

<script setup>
import {nextTick, onUnmounted, reactive, ref, watch} from 'vue'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import ImageUploader from '@/components/ImageUploader.vue'
import NotificationSnackbar from '@/components/NotificationSnackbar.vue'

// ==================== 关键设计说明 ====================
//
// 本组件采用混合方案解决 ref 访问时机问题：
//
// 1. 主要策略: v-show + watch
//    - v-show 确保 DOM 元素始终存在
//    - watch 监听 ref 变化，自动初始化 Cropper
//
// 2. 辅助策略: @load 事件
//    - 图片加载完成时作为备用触发点
//    - 防止 watch 未触发的极端情况
//
// 3. 状态管理:
//    - IDLE: 初始状态，显示上传组件
//    - LOADING: 加载中，显示进度条
//    - READY: 就绪状态，显示裁切界面
//    - ERROR: 错误状态，显示错误信息
//
// ==================== 状态常量 ====================
const STATE = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error'
}

// Props & Emits
const props = defineProps({
  modelValue: {type: Object, default: null}
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

// 响应式状态
const state = ref(STATE.IDLE)
const errorMessage = ref('')
const imageRef = ref(null)
const imageUrl = ref(null)
const originalFileName = ref('')

let cropper = null

// CropperJS 配置
const cropperOptions = {
  aspectRatio: 1,
  viewMode: 1,
  autoCropArea: 1,
  dragMode: 'move',
  responsive: true,
  restore: false,
  checkCrossOrigin: false,
  minContainerHeight: 300,
  minContainerWidth: 300,
  guides: true,
  center: true,
  highlight: false,
  cropBoxMovable: true,
  cropBoxResizable: true,
  toggleDragModeOnDblclick: false
}

// Snackbar
const localSnackbar = reactive({
  show: false,
  message: '',
  color: 'info'
})

const showNotification = (message, type = 'info') => {
  localSnackbar.message = message
  localSnackbar.color = type
  localSnackbar.show = true
}

// 文件读取为 DataURL
const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

// 图片预加载（关键！）
const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      console.log('图片预加载完成', {width: img.width, height: img.height})
      resolve(img)
    }
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

// 初始化 Cropper
const initCropper = async () => {
  // 防止重复初始化
  if (cropper) {
    console.log('Cropper 已存在，跳过初始化')
    return
  }

  if (!imageRef.value) {
    console.error('图片元素未找到')
    throw new Error('图片元素未找到')
  }

  // 等待图片完全加载（双重保障）
  if (!imageRef.value.complete) {
    console.log('等待图片加载...')
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('图片加载超时'))
      }, 5000) // 5秒超时

      const onLoad = () => {
        clearTimeout(timeout)
        resolve()
      }

      const onError = () => {
        clearTimeout(timeout)
        reject(new Error('图片加载失败'))
      }

      imageRef.value.addEventListener('load', onLoad, { once: true })
      imageRef.value.addEventListener('error', onError, { once: true })
    })
  }

  try {
    console.log('开始初始化 Cropper')
    cropper = new Cropper(imageRef.value, cropperOptions)
    console.log('Cropper 初始化成功')
  } catch (error) {
    console.error('Cropper 初始化失败:', error)
    throw new Error('图片编辑器初始化失败')
  }
}

// 监听 imageRef 和 state 变化，自动初始化 Cropper
watch(
  [() => state.value, imageRef],
  ([newState, newRef]) => {
    console.log('Watch 触发:', { newState, hasRef: !!newRef, hasImageUrl: !!imageUrl.value })

    // 确保满足所有条件:
    // 1. 状态为 READY
    // 2. ref 已挂载
    // 3. imageUrl 已设置
    // 4. 图片已加载完成
    if (newState === STATE.READY && newRef && imageUrl.value && newRef.complete) {
      console.log('条件满足，开始初始化 Cropper')
      initCropper()
    }
  },
  { flush: 'post' } // 关键: DOM 更新后触发
)

// 图片加载完成事件处理（备用触发点）
const handleImageLoad = () => {
  console.log('图片 load 事件触发')
  if (state.value === STATE.READY && !cropper) {
    initCropper()
  }
}

// 处理文件选择
const handleFilesSelected = async (files) => {
  if (!files || files.length === 0) return

  state.value = STATE.LOADING

  try {
    const file = files[0]
    originalFileName.value = file.name.replace(/\.[^/.]+$/, '')

    // 步骤 1: 读取文件为 DataURL
    const dataUrl = await readFileAsDataURL(file)

    // 步骤 2: 预加载图片（确保浏览器缓存）
    await preloadImage(dataUrl)

    // 步骤 3: 设置 imageUrl
    imageUrl.value = dataUrl

    // 步骤 4: 等待 Vue DOM 更新
    await nextTick()

    // 步骤 5: 切换到 READY 状态（触发 watch 自动初始化）
    state.value = STATE.READY

    // 不再手动调用 initCropper()，由 watch 自动处理
  } catch (error) {
    console.error('处理失败:', error)
    state.value = STATE.ERROR
    errorMessage.value = error.message
    showNotification(error.message, 'error')
  }
}

// 功能方法
const rotate = (degree) => {
  if (cropper && state.value === STATE.READY) {
    cropper.rotate(degree)
  } else {
    showNotification('请先上传图片', 'warning')
  }
}

const flip = (direction) => {
  if (!cropper || state.value !== STATE.READY) {
    showNotification('请先上传图片', 'warning')
    return
  }

  const data = cropper.getData()
  if (direction === 'horizontal') {
    cropper.scaleX(data.scaleX === 1 ? -1 : 1)
  } else {
    cropper.scaleY(data.scaleY === 1 ? -1 : 1)
  }
}

const reset = () => {
  if (cropper && state.value === STATE.READY) {
    cropper.reset()
  }
}

const resetToIdle = () => {
  state.value = STATE.IDLE
  imageUrl.value = null
  errorMessage.value = ''
  if (cropper) {
    cropper.destroy()
    cropper = null
  }
}

const confirmCrop = () => {
  if (!cropper || state.value !== STATE.READY) {
    showNotification('请先上传图片', 'warning')
    return
  }

  try {
    const canvas = cropper.getCroppedCanvas({
      width: 512,
      height: 512,
      imageSmoothingQuality: 'high'
    })

    if (!canvas) {
      showNotification('无法生成裁切图', 'error')
      return
    }

    emit('confirm', {
      canvas,
      imageUrl: imageUrl.value,
      fileName: originalFileName.value
    })
  } catch (error) {
    console.error('裁切失败:', error)
    showNotification('裁切操作失败', 'error')
  }
}

const cancel = () => {
  resetToIdle()
  emit('cancel')
}

const handleFileError = (error) => {
  state.value = STATE.ERROR
  errorMessage.value = error.message || '文件处理失败'
  showNotification(errorMessage.value, 'error')
}

// 清理
onUnmounted(() => {
  if (cropper) {
    cropper.destroy()
    cropper = null
  }
})
</script>

<style scoped>
.image-cropper {
  width: 100%;
}

.loading-container,
.error-container {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.cropper-layout {
  max-width: 800px;
  margin: 0 auto;
}

.cropper-wrapper {
  width: 100%;
  min-height: 300px;
  max-height: 600px;
  background-color: #f5f5f5;
  overflow: hidden;
  border-radius: 8px;
  position: relative;
}

.cropper-image {
  display: block;
  max-width: 100%;
}

.gap-2 {
  gap: 8px;
}
</style>
