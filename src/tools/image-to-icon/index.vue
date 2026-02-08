<template>
  <v-card class="image-to-icon" elevation="4">
    <!-- Header -->
    <v-card-item class="py-4">
      <template v-slot:prepend>
        <v-icon color="primary" size="28">mdi-image-size-select-large</v-icon>
      </template>
      <v-card-title class="text-h6 font-weight-bold">图片转图标</v-card-title>
      <v-card-subtitle>将图片裁切为正方形并生成各种尺寸的图标，支持 PNG、WebP、ICO、SVG 格式</v-card-subtitle>
    </v-card-item>

    <v-divider class="opacity-50"></v-divider>

    <v-card-text class="pa-0">
      <!-- Step 1: Upload & Crop -->
      <div v-if="currentStep === 'upload'" class="pa-4">
        <v-card-item>
          <v-card-title>第 1 步：上传并裁切图片</v-card-title>
          <v-card-subtitle>上传图片并调整裁切区域，确保主体居中</v-card-subtitle>
        </v-card-item>

        <ImageCropper @confirm="handleCropConfirm" @cancel="handleCropCancel" />
      </div>

      <!-- Step 2: Configure & Generate -->
      <div v-else-if="currentStep === 'configure'">
        <v-card-item>
          <v-card-title>第 2 步：配置并生成图标</v-card-title>
          <v-card-subtitle>选择尺寸、格式和生成设置</v-card-subtitle>
        </v-card-item>

        <v-row>
          <!-- Left: Preview -->
          <v-col cols="12" md="4">
            <v-card variant="outlined">
              <v-card-item>
                <v-card-title>裁切预览</v-card-title>
                <template v-slot:append>
                  <v-btn size="small" variant="text" @click="resetToUpload">重新上传</v-btn>
                </template>
              </v-card-item>
              <v-card-text class="d-flex align-center justify-center checkerboard-bg">
                <v-img :src="croppedImageUrl" max-width="300" aspect-ratio="1" class="elevation-2 rounded-lg" />
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Right: Settings -->
          <v-col cols="12" md="8">
            <v-card variant="outlined" class="mb-4">
              <v-card-text>
                <SizeSelector v-model="selectedSizes" />
              </v-card-text>
            </v-card>

            <v-card variant="outlined" class="mb-4">
              <v-card-text>
                <FormatSelector v-model="selectedFormats" />
              </v-card-text>
            </v-card>

            <v-card variant="outlined" class="mb-4">
              <v-card-text>
                <SettingsPanel
                  v-model="generationSettings"
                  :formats="selectedFormats"
                />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Generate Button -->
        <v-card-item>
          <v-btn
            @click="handleGenerateClick"
            :disabled="isGenerating"
            :loading="isGenerating"
            color="primary"
            size="large"
            block
            class="mb-4"
          >
            <v-icon start>mdi-lightning-bolt</v-icon>
            {{ isGenerating ? '生成中...' : '生成图标' }}
          </v-btn>

          <v-progress-linear
            v-if="isGenerating"
            :model-value="generationProgress"
            color="primary"
            class="mb-2"
          ></v-progress-linear>

          <div v-if="isGenerating" class="text-center text-caption text-grey-darken-1">
            生成进度: {{ generationProgress }}%
          </div>
        </v-card-item>
      </div>

      <!-- Step 3: Preview & Export -->
      <div v-else-if="currentStep === 'export'">
        <v-card-item>
          <v-card-title>第 3 步：预览和下载</v-card-title>
          <v-card-subtitle>查看生成的图标并下载</v-card-subtitle>
        </v-card-item>

        <v-row>
          <!-- Left: Icon Preview -->
          <v-col cols="12" md="8">
            <IconPreview :icons="generatedIcons" @download="handleDownloadFormat" />
          </v-col>

          <!-- Right: Export Panel -->
          <v-col cols="12" md="4">
            <ExportPanel
              :icons="generatedIcons"
              :original-file-name="originalFileName"
            />
          </v-col>
        </v-row>

        <!-- Back Button -->
        <v-card-item>
          <v-btn
            @click="backToConfigure"
            variant="outlined"
            prepend-icon="mdi-arrow-left"
            block
          >
            返回重新配置
          </v-btn>
        </v-card-item>
      </div>
    </v-card-text>

    <!-- 添加通知组件 -->
    <NotificationSnackbar
      v-model="snackbar.show"
      :message="snackbar.message"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
    />
  </v-card>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useIconGenerator } from './composables/useIconGenerator'
import ImageCropper from './components/ImageCropper.vue'
import SizeSelector from './components/SizeSelector.vue'
import FormatSelector from './components/FormatSelector.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import IconPreview from './components/IconPreview.vue'
import ExportPanel from './components/ExportPanel.vue'
import NotificationSnackbar from '@/components/NotificationSnackbar.vue'

// 通知系统
const snackbar = reactive({
  show: false,
  message: '',
  color: 'info',
  timeout: 4000
})

// 显示通知
const showSnackbar = (message, type = 'info') => {
  snackbar.message = message
  snackbar.color = type
  snackbar.show = true
}

// 当前步骤
const currentStep = ref('upload') // 'upload' | 'configure' | 'export'

// 裁切后的数据
const croppedCanvas = ref(null)
const croppedImageUrl = ref('')
const originalFileName = ref('icon') // 存储原始文件名

// 选中配置
const selectedSizes = ref([16, 32, 48, 64, 128, 256])
const selectedFormats = ref(['png'])
const generationSettings = ref({
  borderRadius: 0,
  quality: 0.9,
  backgroundColor: 'transparent'
})

// 图标生成
const { isGenerating, progress: generationProgress, generatedIcons, generateIcons } = useIconGenerator()

// 处理裁切确认
function handleCropConfirm({ canvas, imageUrl, fileName }) {
  croppedCanvas.value = canvas
  // 使用 canvas 生成裁切后的图片 URL
  croppedImageUrl.value = canvas.toDataURL('image/png')
  originalFileName.value = fileName || 'icon'
  currentStep.value = 'configure'
}

// 处理裁切取消
function handleCropCancel() {
  currentStep.value = 'upload'
}

// 重置到上传
function resetToUpload() {
  croppedCanvas.value = null
  croppedImageUrl.value = ''
  originalFileName.value = 'icon'
  currentStep.value = 'upload'
}

// 生成图标
async function handleGenerateIcons() {
  if (!croppedCanvas.value) {
    showSnackbar('请先上传并裁切图片', 'warning')
    return
  }

  if (selectedSizes.value.length === 0) {
    showSnackbar('请至少选择一个尺寸', 'warning')
    return
  }

  if (selectedFormats.value.length === 0) {
    showSnackbar('请至少选择一种格式', 'warning')
    return
  }

  try {
    await generateIcons(
      croppedCanvas.value,
      selectedSizes.value,
      selectedFormats.value,
      generationSettings.value
    )

    if (generatedIcons.value.length > 0) {
      currentStep.value = 'export'
      showSnackbar('图标生成成功', 'success')
    }
  } catch (error) {
    console.error('生成图标失败:', error)
    showSnackbar('生成图标失败，请重试', 'error')
  }
}

// 返回配置页面
function backToConfigure() {
  currentStep.value = 'configure'
}

// 下载某个格式的图标
async function handleDownloadFormat(icons) {
  console.log('下载格式图标:', icons)
}

// 生成图标（包装方法）
function handleGenerateClick() {
  handleGenerateIcons()
}
</script>

<style scoped>
.image-to-icon {
  border-radius: 24px !important;
  overflow: hidden;
}

.checkerboard-bg {
  background-image:
    linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

.v-theme--dark .checkerboard-bg {
  background-image:
    linear-gradient(45deg, #2a2a2a 25%, transparent 25%),
    linear-gradient(-45deg, #2a2a2a 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #2a2a2a 75%),
    linear-gradient(-45deg, transparent 75%, #2a2a2a 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}
</style>
