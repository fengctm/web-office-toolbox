<template>
  <div class="image-cropper">
    <!-- 使用 ImageUploader 处理文件上传 -->
    <ImageUploader
        v-if="!imageUrl"
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

    <div v-else class="cropper-container-layout">
      <!-- 限制预览区域的高度和形状 -->
      <div class="cropper-wrapper">
        <img ref="imageRef" :src="imageUrl" alt="Source image" class="img-source"/>
      </div>

      <v-card class="mt-4" variant="outlined">
        <v-card-text>
          <!-- 控制按钮 -->
          <div class="d-flex justify-center gap-2 mb-4">
            <v-btn icon="mdi-rotate-left" size="small" title="向左旋转" variant="outlined" @click="rotate(-90)"/>
            <v-btn icon="mdi-rotate-right" size="small" title="向右旋转" variant="outlined" @click="rotate(90)"/>
            <v-btn icon="mdi-flip-horizontal" size="small" title="水平翻转" variant="outlined"
                   @click="flip('horizontal')"/>
            <v-btn icon="mdi-flip-vertical" size="small" title="垂直翻转" variant="outlined" @click="flip('vertical')"/>
            <v-btn icon="mdi-refresh" size="small" title="重置" variant="outlined" @click="reset"/>
          </div>

          <!-- 操作按钮 -->
          <div class="d-flex justify-end gap-2">
            <v-btn variant="outlined" @click="cancel">取消</v-btn>
            <v-btn color="primary" @click="confirmCrop">确认裁切</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <NotificationSnackbar
        v-model="localSnackbar.show"
        :color="localSnackbar.color"
        :message="localSnackbar.message"
    />
  </div>
</template>

<script setup>
import {nextTick, onUnmounted, reactive, ref} from 'vue'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css' // 【关键】必须引入官方样式
import ImageUploader from '@/components/ImageUploader.vue'
import NotificationSnackbar from '@/components/NotificationSnackbar.vue'

const props = defineProps({
  modelValue: {type: Object, default: null}
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const imageRef = ref(null)
const imageUrl = ref(null)
const originalFileName = ref('')
let cropper = null

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

// 初始化 Cropper
const initCropper = () => {
  if (!imageRef.value) return

  // 销毁旧实例
  if (cropper) {
    cropper.destroy()
  }

  cropper = new Cropper(imageRef.value, {
    aspectRatio: 1,      // 锁定 1:1
    viewMode: 1,         // 限制裁切框不超过画布边界
    autoCropArea: 0.8,
    dragMode: 'move',    // 默认移动图片
    responsive: true,
    restore: false,
    checkCrossOrigin: true,
  })
}

// 处理文件选择
const handleFilesSelected = (files) => {
  if (!files || files.length === 0) return

  const file = files[0]
  originalFileName.value = file.name.replace(/\.[^/.]+$/, '')

  const reader = new FileReader()
  reader.onload = async (e) => {
    imageUrl.value = e.target.result

    // 等待 Vue DOM 更新渲染 <img> 标签
    await nextTick()

    // 确保图片加载完成后初始化
    if (imageRef.value) {
      if (imageRef.value.complete) {
        initCropper()
      } else {
        imageRef.value.onload = initCropper
      }
    }
  }
  reader.readAsDataURL(file)
}

// 功能方法添加安全检查
function rotate(degree) {
  if (cropper) cropper.rotate(degree)
}

function flip(direction) {
  if (!cropper) return
  const data = cropper.getData()
  if (direction === 'horizontal') {
    cropper.scaleX(data.scaleX === 1 ? -1 : 1)
  } else {
    cropper.scaleY(data.scaleY === 1 ? -1 : 1)
  }
}

function reset() {
  if (cropper) cropper.reset()
}

function confirmCrop() {
  if (!cropper) return

  try {
    // 获取裁切结果
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

function cancel() {
  imageUrl.value = null
  if (cropper) {
    cropper.destroy()
    cropper = null
  }
  emit('cancel')
}

function handleFileError(error) {
  showNotification(error.message || '文件处理失败', 'error')
}

onUnmounted(() => {
  if (cropper) cropper.destroy()
})
</script>

<style scoped>
.image-cropper {
  width: 100%;
}

.cropper-container-layout {
  max-width: 600px;
  margin: 0 auto;
}

.cropper-wrapper {
  width: 100%;
  /* 关键：给容器一个确定的高度或比例 */
  aspect-ratio: 1 / 1;
  background-color: #f0f0f0;
  overflow: hidden;
  border-radius: 8px;
}

.img-source {
  /* 关键：确保图片在初始化前不会撑破容器 */
  display: block;
  max-width: 100%;
}

/* 覆盖一些 Vuetify 按钮间距 */
.gap-2 {
  gap: 8px;
}
</style>