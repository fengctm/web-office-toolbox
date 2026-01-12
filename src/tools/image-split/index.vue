<template>
  <v-card class="image-split-pro" elevation="4">
    <!-- 头部：Google Material 3 风格 -->
    <v-card-item class="py-4">
      <template v-slot:prepend>
        <div class="header-icon">
          <v-icon color="teal" size="28">mdi-image-filter-hdr</v-icon>
        </div>
      </template>
      <v-card-title class="text-h6 font-weight-bold">
        图片分割
      </v-card-title>
      <v-card-subtitle>
        将图片按指定规则分割成多个小图
      </v-card-subtitle>
    </v-card-item>

    <v-divider class="opacity-50"></v-divider>

    <v-card-text class="pa-0">
      <div class="tool-layout">
        <!-- 控制区 -->
        <aside class="settings-panel">
          <div v-if="!imageSrc" class="upload-trigger apple-transition" @click="triggerUpload">
            <v-icon class="mb-4" color="teal-lighten-2" size="64">mdi-tray-arrow-up</v-icon>
            <div class="text-h6">开始处理图片</div>
            <div class="text-caption">点击或拖拽至此处</div>
          </div>

          <div v-else class="controls-content apple-fade-in">
            <!-- 文件信息卡片 -->
            <v-card class="mb-6 rounded-lg" color="teal" variant="tonal">
              <v-card-item class="pa-3">
                <div class="d-flex align-center">
                  <v-avatar class="mr-3" rounded="lg" size="40">
                    <v-img :src="imageSrc" cover></v-img>
                  </v-avatar>
                  <div class="flex-grow-1 overflow-hidden">
                    <div class="text-subtitle-2 text-truncate">{{ fileName }}</div>
                    <div class="text-caption">{{ imgDimensions.width }} × {{ imgDimensions.height }} px</div>
                  </div>
                  <v-btn icon="mdi-close" size="x-small" variant="text" @click="reset"></v-btn>
                </div>
              </v-card-item>
            </v-card>

            <div class="setting-item mb-6">
              <div class="d-flex justify-space-between mb-2">
                <span class="text-subtitle-2">行数 (Rows)</span>
                <v-chip color="teal" size="x-small" variant="flat">{{ rows }}</v-chip>
              </div>
              <v-slider v-model="rows" class="apple-slider" color="teal" hide-details max="15" min="1"
                        step="1"></v-slider>
            </div>

            <div class="setting-item mb-8">
              <div class="d-flex justify-space-between mb-2">
                <span class="text-subtitle-2">列数 (Columns)</span>
                <v-chip color="teal" size="x-small" variant="flat">{{ cols }}</v-chip>
              </div>
              <v-slider v-model="cols" class="apple-slider" color="teal" hide-details max="15" min="1"
                        step="1"></v-slider>
            </div>

            <v-btn
                :loading="isProcessing"
                block
                class="export-btn shadow-teal"
                color="teal"
                size="x-large"
                @click="handleExport"
            >
              <v-icon start>mdi-zip-box</v-icon>
              导出 {{ rows * cols }} 个切片
            </v-btn>
          </div>
        </aside>

        <!-- 预览区 (丝滑核心) -->
        <main :class="{ 'empty': !imageSrc }" class="preview-stage">
          <div v-if="imageSrc" class="canvas-wrapper">
            <div class="preview-container shadow-2xl">
              <img :src="imageSrc" class="preview-img" @load="onImageLoad"/>

              <!-- 动态网格层 -->
              <div class="grid-overlay">
                <!-- 垂直线 -->
                <transition-group name="grid-line">
                  <div
                      v-for="i in (cols - 1)"
                      :key="'v-'+i"
                      :style="{ left: `${(i/cols)*100}%` }"
                      class="line vertical"
                  ></div>
                </transition-group>

                <!-- 水平线 -->
                <transition-group name="grid-line">
                  <div
                      v-for="i in (rows - 1)"
                      :key="'h-'+i"
                      :style="{ top: `${(i/rows)*100}%` }"
                      class="line horizontal"
                  ></div>
                </transition-group>
              </div>
            </div>
          </div>

          <div v-else class="empty-placeholder">
            <div class="floating-blobs"></div>
            <p class="text-grey-darken-1">等待图片上传...</p>
          </div>
        </main>
      </div>
    </v-card-text>

    <input ref="fileRef" accept="image/*" hidden type="file" @change="onFileChange"/>

    <!-- 成功提示 -->
    <v-snackbar v-model="showSuccess" color="success" elevation="10" rounded="pill">
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-check-decagram</v-icon>
        分割完成，已开始下载压缩包！
      </div>
    </v-snackbar>
  </v-card>
</template>

<script setup>
import {reactive, ref} from 'vue';
import JSZip from 'jszip';
import {saveAs} from 'file-saver';

const fileRef = ref(null);
const imageSrc = ref(null);
const fileName = ref('');
const isProcessing = ref(false);
const showSuccess = ref(false);
const rows = ref(3);
const cols = ref(3);
const imgDimensions = reactive({width: 0, height: 0});

const triggerUpload = () => fileRef.value.click();

const onFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  fileName.value = file.name.split('.')[0];
  const reader = new FileReader();
  reader.onload = (ev) => {
    imageSrc.value = ev.target.result;
  };
  reader.readAsDataURL(file);
};

const onImageLoad = (e) => {
  imgDimensions.width = e.target.naturalWidth;
  imgDimensions.height = e.target.naturalHeight;
};

const reset = () => {
  imageSrc.value = null;
  fileRef.value.value = '';
};

const handleExport = async () => {
  isProcessing.value = true;
  const zip = new JSZip();
  const img = new Image();
  img.src = imageSrc.value;

  await img.decode();
  const partW = img.naturalWidth / cols.value;
  const partH = img.naturalHeight / rows.value;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = partW;
  canvas.height = partH;

  for (let r = 0; r < rows.value; r++) {
    for (let c = 0; c < cols.value; c++) {
      ctx.clearRect(0, 0, partW, partH);
      ctx.drawImage(img, c * partW, r * partH, partW, partH, 0, 0, partW, partH);
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      zip.file(`${fileName.value}_${r + 1}_${c + 1}.png`, blob);
    }
  }

  const content = await zip.generateAsync({type: 'blob'});
  saveAs(content, `${fileName.value}【分割${rows.value * cols.value}份】.zip`);
  isProcessing.value = false;
  showSuccess.value = true;
};
</script>

<style lang="scss" scoped>
// Apple 标准缓动
$apple-ease: cubic-bezier(0.16, 1, 0.3, 1);

.image-split-pro {
  border-radius: 24px !important;
  overflow: hidden;
  transition: all 0.5s $apple-ease;
}

.tool-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  min-height: 550px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
}

// 控制面板
.settings-panel {
  padding: 24px;
  border-right: 1px solid rgba(var(--v-border-color), 0.1);
  background: rgba(var(--v-theme-surface), 0.8);
  backdrop-filter: blur(10px);
  z-index: 10;
}

.upload-trigger {
  height: 100%;
  border: 2px dashed rgba(var(--v-theme-teal), 0.3);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background: rgba(0, 150, 136, 0.05);
    border-color: #009688;
    transform: scale(0.98);
  }
}

// 预览舞台
.preview-stage {
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  position: relative;
  overflow: hidden;

  .v-theme--dark & {
    background: #0f0f0f;
  }
}

.preview-container {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  line-height: 0;
  background: white;
  transition: transform 0.8s $apple-ease;
}

.preview-img {
  max-width: 100%;
  max-height: 70vh;
  display: block;
}

// 核心动画：丝滑线条
.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;

  .line {
    position: absolute;
    background: rgba(255, 255, 255, 0.9);
    // 使用双层阴影实现极致的线条清晰度
    box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.3), 0 0 4px rgba(0, 0, 0, 0.2);
    transition: all 0.6s $apple-ease;
    z-index: 2;

    &.vertical {
      width: 1.5px;
      height: 100%;
      top: 0;
    }

    &.horizontal {
      height: 1.5px;
      width: 100%;
      left: 0;
    }
  }
}

// 线条进入离开动画 (Apple 风格的伸缩感)
.grid-line-enter-from, .grid-line-leave-to {
  opacity: 0;

  &.vertical {
    transform: scaleY(0);
  }

  &.horizontal {
    transform: scaleX(0);
  }
}

// 按钮与交互
.export-btn {
  border-radius: 14px !important;
  text-transform: none !important;
  font-weight: 700 !important;
  transition: all 0.3s $apple-ease !important;

  &:active {
    transform: scale(0.95);
  }
}

.shadow-teal {
  box-shadow: 0 8px 24px rgba(0, 150, 136, 0.3) !important;
}

// 背景装饰点缀
.empty-placeholder {
  text-align: center;

  .floating-blobs {
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(0, 150, 136, 0.1) 0%, transparent 70%);
    filter: blur(40px);
    animation: pulse 4s infinite alternate;
  }
}

@keyframes pulse {
  from {
    transform: scale(1);
    opacity: 0.5;
  }
  to {
    transform: scale(1.5);
    opacity: 0.8;
  }
}

// Slider 美化
:deep(.v-slider-thumb) {
  transition: transform 0.2s $apple-ease;

  &:hover {
    transform: scale(1.3);
  }
}
</style>