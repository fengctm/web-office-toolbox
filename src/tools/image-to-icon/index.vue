<template>
  <v-card class="image-to-icon rounded-xl" elevation="0" border>
    <!-- Custom Stepper Header -->
    <div class="py-6 px-4 bg-surface-variant-light">
      <v-row justify="center" align="center" no-gutters>
        <v-col cols="12" md="10" lg="8">
          <div class="d-flex align-center w-100 flex-wrap flex-md-nowrap">
            <template v-for="(step, index) in steps" :key="step.value">
              <!-- Step Item -->
              <div 
                class="d-flex align-center step-item mb-2 mb-md-0"
                :class="{ 
                  'active': currentStep === step.value, 
                  'completed': stepIndex(currentStep) > index,
                  'flex-grow-0 flex-shrink-0': true
                }"
                @click="canNavigate(step.value) && (currentStep = step.value)"
              >
                <div class="step-circle mr-3 elevation-2 flex-shrink-0">
                  <v-icon v-if="stepIndex(currentStep) > index" size="18" color="white">mdi-check</v-icon>
                  <span v-else class="text-caption font-weight-bold">{{ index + 1 }}</span>
                </div>
                <div>
                  <div class="text-subtitle-2 font-weight-bold step-title">{{ step.title }}</div>
                  <div class="text-caption text-medium-emphasis">{{ step.subtitle }}</div>
                </div>
              </div>

              <!-- Divider -->
              <v-divider 
                v-if="index < steps.length - 1"
                class="mx-4 flex-grow-1 step-divider d-none d-md-block"
                :class="{ 'active': stepIndex(currentStep) > index }"
              ></v-divider>
              <!-- Mobile Divider (Spacers) -->
              <div v-if="index < steps.length - 1" class="d-md-none w-100 my-1"></div>
            </template>
          </div>
        </v-col>
      </v-row>
    </div>

    <v-divider></v-divider>

    <div class="position-relative">
      <v-window v-model="currentStep" :touch="false">
        
        <!-- Step 1: Upload & Crop -->
        <v-window-item value="upload">
          <div class="d-flex flex-column align-center justify-center pa-4 pa-md-8">
            <div class="w-100" style="max-width: 800px">
              <div class="text-center mb-8 fade-in-up">
                <v-icon size="64" color="primary" class="mb-4">mdi-image-filter-center-focus</v-icon>
                <h2 class="text-h4 font-weight-bold mb-2">上传图片</h2>
                <div class="text-body-1 text-medium-emphasis">选择一张图片开始制作图标，我们会自动帮您处理尺寸</div>
              </div>
              
              <v-card class="overflow-visible" variant="flat" color="transparent">
                <ImageCropper @confirm="handleCropConfirm" @cancel="handleCropCancel" />
              </v-card>
            </div>
          </div>
        </v-window-item>

        <!-- Step 2: Configure & Generate -->
        <v-window-item value="configure">
          <div class="pa-4 pa-md-8">
            <div class="max-width-1200 mx-auto">
              <div class="d-flex align-center mb-6">
                <v-btn icon="mdi-arrow-left" variant="text" @click="currentStep = 'upload'" class="mr-2"></v-btn>
                <div>
                  <h2 class="text-h5 font-weight-bold">配置选项</h2>
                  <div class="text-caption text-medium-emphasis">调整图标生成的各项参数</div>
                </div>
              </div>

              <v-row>
                <!-- Left: Preview -->
                <v-col cols="12" md="4">
                  <v-card class="sticky-top-24 rounded-lg" border elevation="0">
                    <v-card-item>
                      <v-card-title class="text-subtitle-1">效果预览</v-card-title>
                    </v-card-item>
                    <v-divider></v-divider>
                    <v-card-text class="d-flex flex-column align-center justify-center checkerboard-bg py-8">
                        <div class="preview-container elevation-4 rounded-lg overflow-hidden" :style="{ borderRadius: `${generationSettings.borderRadius}%` }">
                           <v-img :src="croppedImageUrl" width="200" height="200" cover />
                        </div>
                    </v-card-text>
                    <v-divider></v-divider>
                    <v-card-actions>
                      <v-btn block color="primary" variant="text" @click="resetToUpload">
                        更换图片
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-col>

                <!-- Right: Settings -->
                <v-col cols="12" md="8">
                  <div class="d-flex flex-column gap-4">
                    <v-card border elevation="0" class="rounded-lg">
                      <v-card-text>
                        <SizeSelector v-model="selectedSizes" />
                      </v-card-text>
                    </v-card>

                    <v-card border elevation="0" class="rounded-lg">
                      <v-card-text>
                        <FormatSelector v-model="selectedFormats" />
                      </v-card-text>
                    </v-card>

                    <v-card border elevation="0" class="rounded-lg">
                      <v-card-text>
                        <SettingsPanel
                          v-model="generationSettings"
                          :formats="selectedFormats"
                        />
                      </v-card-text>
                    </v-card>

                    <v-btn
                      @click="handleGenerateClick"
                      color="primary"
                      size="x-large"
                      block
                      class="mt-4 generate-btn"
                      height="64"
                    >
                      <div class="d-flex flex-column align-center">
                        <span class="text-h6">开始生成</span>
                        <span class="text-caption opacity-80">将生成 {{ selectedSizes.length * selectedFormats.length }} 个图标文件</span>
                      </div>
                      <template v-slot:append>
                         <v-icon size="24">mdi-arrow-right</v-icon>
                      </template>
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </div>
          </div>
        </v-window-item>

        <!-- Step 3: Preview & Export -->
        <v-window-item value="export">
           <div class="pa-4 pa-md-8">
             <div class="max-width-1200 mx-auto">
               <div class="d-flex align-center justify-space-between mb-6">
                 <div class="d-flex align-center">
                   <v-btn icon="mdi-arrow-left" variant="text" @click="backToConfigure" class="mr-2"></v-btn>
                    <div>
                      <h2 class="text-h5 font-weight-bold">生成完成！</h2>
                      <div class="text-caption text-medium-emphasis">预览并下载您的图标</div>
                    </div>
                 </div>
                 <v-btn variant="outlined" color="primary" @click="resetToUpload">
                    制作新图标
                 </v-btn>
               </div>

                <v-row>
                  <!-- Left: Icon Preview -->
                  <v-col cols="12" md="8">
                    <IconPreview :icons="generatedIcons" @download="handleDownloadFormat" />
                  </v-col>

                  <!-- Right: Export Panel -->
                  <v-col cols="12" md="4">
                    <div class="sticky-top-24">
                       <ExportPanel
                        :icons="generatedIcons"
                        :original-file-name="originalFileName"
                      />
                    </div>
                  </v-col>
                </v-row>
             </div>
           </div>
        </v-window-item>

      </v-window>

      <!-- Custom Loading Overlay -->
      <v-overlay
        v-model="isGenerating"
        class="align-center justify-center"
        persistent
        backdrop-filter="blur(10px)"
        bg-color="rgba(255, 255, 255, 0.8)"
      >
        <div class="text-center">
          <div class="loading-circle mb-6">
             <div class="circle-1"></div>
             <div class="circle-2"></div>
             <v-icon size="48" color="primary" class="loading-icon">mdi-lightning-bolt</v-icon>
          </div>
          <h3 class="text-h5 font-weight-bold mb-2">正在生成图标...</h3>
          <div class="text-body-1 text-medium-emphasis mb-4">正在处理 {{ generationProgress }}%</div>
          <v-progress-linear
            :model-value="generationProgress"
            color="primary"
            height="8"
            rounded
            striped
            stream
            style="width: 300px"
          ></v-progress-linear>
        </div>
      </v-overlay>
    </div>

    <!-- Notification -->
    <NotificationSnackbar
      v-model="snackbar.show"
      :message="snackbar.message"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
    />
  </v-card>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useIconGenerator } from './composables/useIconGenerator'
import ImageCropper from './components/ImageCropper.vue'
import SizeSelector from './components/SizeSelector.vue'
import FormatSelector from './components/FormatSelector.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import IconPreview from './components/IconPreview.vue'
import ExportPanel from './components/ExportPanel.vue'
import NotificationSnackbar from '@/components/NotificationSnackbar.vue'

// Steps Config
const steps = [
  { value: 'upload', title: '上传裁切', subtitle: '准备图片' },
  { value: 'configure', title: '配置参数', subtitle: '选择尺寸和格式' },
  { value: 'export', title: '导出图标', subtitle: '预览和下载' }
]

const currentStep = ref('upload') 

function stepIndex(step) {
  return steps.findIndex(s => s.value === step)
}

function canNavigate(targetStep) {
  // Simple guard: can only navigate back or to next step if current step is done
  const currentIdx = stepIndex(currentStep.value)
  const targetIdx = stepIndex(targetStep)
  
  if (targetIdx < currentIdx) return true
  // For forward nav, we rely on buttons, not top nav click usually, 
  // unless we want to allow jumping if data is present.
  // For now, let's only allow clicking header to go back.
  return targetIdx < currentIdx
}

// Notification System
const snackbar = reactive({
  show: false,
  message: '',
  color: 'info',
  timeout: 4000
})

const showSnackbar = (message, type = 'info') => {
  snackbar.message = message
  snackbar.color = type
  snackbar.show = true
}

// Data
const croppedCanvas = ref(null)
const croppedImageUrl = ref('')
const originalFileName = ref('icon')

// Settings
const selectedSizes = ref([16, 32, 48, 64, 128, 256])
const selectedFormats = ref(['png'])
const generationSettings = ref({
  borderRadius: 0,
  quality: 0.9,
  backgroundColor: 'transparent'
})

// Generator
const { isGenerating, progress: generationProgress, generatedIcons, generateIcons } = useIconGenerator()

// Handlers
function handleCropConfirm({ canvas, imageUrl, fileName }) {
  croppedCanvas.value = canvas
  croppedImageUrl.value = canvas.toDataURL('image/png')
  originalFileName.value = fileName || 'icon'
  currentStep.value = 'configure'
}

function handleCropCancel() {
  currentStep.value = 'upload'
}

function resetToUpload() {
  croppedCanvas.value = null
  croppedImageUrl.value = ''
  originalFileName.value = 'icon'
  currentStep.value = 'upload'
}

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

function backToConfigure() {
  currentStep.value = 'configure'
}

function handleDownloadFormat(icons) {
  // Logic is likely handled in IconPreview emit or we use ExportPanel logic
  // Just logging for now if not used
  console.log('Download format requested', icons.length)
}

function handleGenerateClick() {
  handleGenerateIcons()
}
</script>

<style scoped>
.image-to-icon {
  background-color: rgb(var(--v-theme-surface));
  transition: all 0.3s ease;
}

/* --- Stepper Styles --- */
.step-item {
  cursor: pointer;
  position: relative;
  z-index: 1;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.step-item:hover {
  opacity: 0.9;
}

.step-item.active {
  opacity: 1;
}

.step-item.completed {
  opacity: 1;
}

.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgb(var(--v-theme-surface));
  border: 2px solid rgb(var(--v-border-color));
  color: rgb(var(--v-theme-on-surface));
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.step-item.active .step-circle {
  border-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.1);
}

.step-item.completed .step-circle {
  background-color: rgb(var(--v-theme-success));
  border-color: rgb(var(--v-theme-success));
  color: white;
}

.step-divider {
  border-color: rgb(var(--v-border-color));
  transition: all 0.4s ease;
  border-width: 2px 0 0 0;
  opacity: 0.3;
}

.step-divider.active {
  border-color: rgb(var(--v-theme-success));
  opacity: 1;
}

.bg-surface-variant-light {
  background-color: rgb(var(--v-theme-surface-variant), 0.05);
}

/* --- Layout Utils --- */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(var(--v-border-color), 0.5);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-border-color), 0.8);
}

.max-width-1200 {
  max-width: 1200px;
  margin: 0 auto;
}

.sticky-top-24 {
  position: sticky;
  top: 24px;
  z-index: 2;
}

.gap-4 {
  gap: 16px;
}

/* --- Animations --- */
.fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.generate-btn {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.generate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px -5px rgba(var(--v-theme-primary), 0.3);
}

/* --- Loading Animation --- */
.loading-circle {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.circle-1, .circle-2 {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 4px solid transparent;
  border-top-color: rgb(var(--v-theme-primary));
}

.circle-1 {
  animation: spin 1.5s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.circle-2 {
  width: 70%;
  height: 70%;
  margin: 15%;
  border-color: transparent;
  border-bottom-color: rgb(var(--v-theme-secondary));
  animation: spin 2s cubic-bezier(0.5, 0, 0.5, 1) infinite reverse;
}

.loading-icon {
  animation: pulse-icon 1.5s infinite ease-in-out;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse-icon {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.9); }
}

.v-theme--dark .custom-scrollbar::-webkit-scrollbar-thumb {
   background: rgba(255,255,255,0.2);
}

/* --- Preview Styles --- */
.checkerboard-bg {
  background-image:
    linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
    linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
    linear-gradient(-45deg, transparent 75%, #e0e0e0 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

.v-theme--dark .checkerboard-bg {
  background-image:
    linear-gradient(45deg, #333 25%, transparent 25%),
    linear-gradient(-45deg, #333 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #333 75%),
    linear-gradient(-45deg, transparent 75%, #333 75%);
}
</style>
