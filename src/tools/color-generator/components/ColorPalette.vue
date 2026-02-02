<template>
  <div v-if="colors" class="color-palette">
    <v-card class="palette-section" elevation="2">
      <v-card-item>
        <v-card-title class="d-flex align-center">
          <v-icon color="teal" class="mr-2">mdi-palette</v-icon>
          主色调
        </v-card-title>
        <v-card-subtitle>
          您的输入颜色将作为整个配色方案的基础
        </v-card-subtitle>
      </v-card-item>
      <v-card-text>
        <ColorCard
          :color="colors.main"
          label="主色调"
          subtitle="输入的基础颜色"
          icon="mdi-circle"
        />
      </v-card-text>
    </v-card>

    <v-card class="palette-section" elevation="2">
      <v-card-item>
        <v-card-title class="d-flex align-center">
          <v-icon color="grey-darken-3" class="mr-2">mdi-format-header-1</v-icon>
          排版色彩
        </v-card-title>
        <v-card-subtitle>
          标题、正文、辅助文本和链接的颜色规范
        </v-card-subtitle>
      </v-card-item>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <ColorCard
              :color="colors.typography.heading1"
              label="标题 1-3级"
              subtitle="主色 + 极低亮度 (L: 10%)"
              icon="mdi-format-header-1"
            />
          </v-col>
          <v-col cols="12" md="6">
            <ColorCard
              :color="colors.typography.headingBody"
              label="标题 4-6级 / 正文"
              subtitle="主色 + 较低亮度 (L: 20%)"
              icon="mdi-format-header-3"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6">
            <ColorCard
              :color="colors.typography.secondaryText"
              label="辅助文本 / 提示"
              subtitle="主色 + 中等亮度 (L: 50%)"
              icon="mdi-text"
            />
          </v-col>
          <v-col cols="12" md="6">
            <ColorCard
              :color="colors.typography.linkText"
              label="链接文本"
              subtitle="主色原生或略加亮"
              icon="mdi-link"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card class="palette-section" elevation="2">
      <v-card-item>
        <v-card-title class="d-flex align-center">
          <v-icon color="primary" class="mr-2">mdi-gesture-tap-button</v-icon>
          按钮状态
        </v-card-title>
        <v-card-subtitle>
          主按钮在不同交互状态下的颜色变化
        </v-card-subtitle>
      </v-card-item>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <ColorCard
              :color="colors.buttons.normal"
              label="主按钮 (Normal)"
              subtitle="使用主色本身"
              icon="mdi-cursor-default-click"
            />
          </v-col>
          <v-col cols="12" md="6">
            <ColorCard
              :color="colors.buttons.hover"
              label="按钮悬浮 (Hover)"
              subtitle="主色亮度 + 10%"
              icon="mdi-mouse"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6">
            <ColorCard
              :color="colors.buttons.active"
              label="按钮激活 (Active)"
              subtitle="主色亮度 - 10%"
              icon="mdi-gesture-tap"
            />
          </v-col>
          <v-col cols="12" md="6">
            <ColorCard
              :color="colors.buttons.disabled"
              label="禁用状态 (Disabled)"
              subtitle="主色 + 极低饱和度"
              icon="mdi-cancel"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6">
            <ColorCard
              :color="colors.buttons.onPrimary"
              label="按钮文字 (On-Primary)"
              subtitle="纯白"
              icon="mdi-format-size"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card class="palette-section" elevation="2">
      <v-card-item>
        <v-card-title class="d-flex align-center">
          <v-icon color="blue-grey" class="mr-2">mdi-floor-plan</v-icon>
          表面背景
        </v-card-title>
        <v-card-subtitle>
          页面、卡片和深色区块的背景颜色
        </v-card-subtitle>
      </v-card-item>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <ColorCard
              :color="colors.surfaces.pageBackground"
              label="全页背景"
              subtitle="极淡主色 (L: 98%)"
              icon="mdi-web"
            />
          </v-col>
          <v-col cols="12" md="6">
            <ColorCard
              :color="colors.surfaces.cardBackground"
              label="卡片/容器背景"
              subtitle="纯白"
              icon="mdi-card"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6">
            <ColorCard
              :color="colors.surfaces.darkSurface"
              label="深色区块背景"
              subtitle="极深主色"
              icon="mdi-moon-waning-crescent"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card class="palette-section" elevation="2">
      <v-card-item>
        <v-card-title class="d-flex align-center">
          <v-icon color="amber-darken-2" class="mr-2">mdi-toolbox</v-icon>
          工具色彩
        </v-card-title>
        <v-card-subtitle>
          阴影、边框、成功、错误和焦点指示色
        </v-card-subtitle>
      </v-card-item>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <ColorCard
              :color="colors.utilities.shadow"
              label="阴影 (Shadows)"
              subtitle="主色 + 透明度 15%"
              icon="mdi-box-shadow"
              :show-rgba="true"
            />
          </v-col>
          <v-col cols="12" md="6">
            <ColorCard
              :color="colors.utilities.border"
              label="通用边框"
              subtitle="浅主色 (L: 92%)"
              icon="mdi-border-color"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6">
            <ColorCard
              :color="colors.utilities.success"
              label="成功提醒"
              subtitle="翠绿色 (与蓝互补)"
              icon="mdi-check-circle"
            />
          </v-col>
          <v-col cols="12" md="6">
            <ColorCard
              :color="colors.utilities.error"
              label="错误提醒"
              subtitle="鲜红色"
              icon="mdi-alert-circle"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6">
            <ColorCard
              :color="colors.utilities.focus"
              label="焦点环 (Focus)"
              subtitle="主色 + 50% 透明度"
              icon="mdi-focus-field"
              :show-rgba="true"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card class="palette-section" elevation="2">
      <v-card-item>
        <v-card-title class="d-flex align-center">
          <v-icon color="teal" class="mr-2">mdi-content-copy</v-icon>
          一键复制全部
        </v-card-title>
        <v-card-subtitle>
          将完整的配色方案复制为 CSS 变量或 JSON 格式
        </v-card-subtitle>
      </v-card-item>
      <v-card-text>
        <v-btn
          block
          variant="tonal"
          color="teal"
          class="mb-2"
          @click="copyAsCSS"
        >
          <v-icon class="mr-2">mdi-css3</v-icon>
          复制为 CSS 变量
        </v-btn>
        <v-btn
          block
          variant="tonal"
          color="blue"
          @click="copyAsJSON"
        >
          <v-icon class="mr-2">mdi-code-json</v-icon>
          复制为 JSON
        </v-btn>
      </v-card-text>
    </v-card>

    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      timeout="2000"
      location="bottom center"
    >
      {{ snackbarText }}
    </v-snackbar>
  </div>
  <div v-else class="color-palette-loading">
    <v-progress-circular indeterminate color="teal" size="64" />
    <p class="mt-4 text-grey">正在加载颜色...</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ColorCard from './ColorCard.vue'

const props = defineProps({
  colors: {
    type: Object,
    required: true
  }
})

const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const showMessage = (text, color = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  showSnackbar.value = true
}

const copyAsCSS = async () => {
  const c = props.colors
  const css = `:root {
  /* 主色调 */
  --color-primary: ${c.main.hex};
  --color-primary-rgb: ${c.main.r}, ${c.main.g}, ${c.main.b};

  /* 排版色彩 */
  --color-heading-1: ${c.typography.heading1.hex};
  --color-heading-body: ${c.typography.headingBody.hex};
  --color-secondary-text: ${c.typography.secondaryText.hex};
  --color-link-text: ${c.typography.linkText.hex};

  /* 按钮状态 */
  --color-btn-normal: ${c.buttons.normal.hex};
  --color-btn-hover: ${c.buttons.hover.hex};
  --color-btn-active: ${c.buttons.active.hex};
  --color-btn-disabled: ${c.buttons.disabled.hex};
  --color-btn-on-primary: ${c.buttons.onPrimary.hex};

  /* 表面背景 */
  --color-page-bg: ${c.surfaces.pageBackground.hex};
  --color-card-bg: ${c.surfaces.cardBackground.hex};
  --color-dark-surface: ${c.surfaces.darkSurface.hex};

  /* 工具色彩 */
  --color-shadow: ${c.utilities.shadow.rgba};
  --color-border: ${c.utilities.border.hex};
  --color-success: ${c.utilities.success.hex};
  --color-error: ${c.utilities.error.hex};
  --color-focus: ${c.utilities.focus.rgba};
}`
  try {
    await navigator.clipboard.writeText(css)
    showMessage('CSS 变量已复制到剪贴板')
  } catch (error) {
    showMessage('复制失败', 'error')
  }
}

const copyAsJSON = async () => {
  const json = JSON.stringify(props.colors, null, 2)
  try {
    await navigator.clipboard.writeText(json)
    showMessage('JSON 已复制到剪贴板')
  } catch (error) {
    showMessage('复制失败', 'error')
  }
}
</script>

<style scoped>
.color-palette {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.palette-section {
  border-radius: 12px;
  overflow: hidden;
}

.color-palette-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  min-height: 200px;
}
</style>
