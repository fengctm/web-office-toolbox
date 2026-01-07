<template>
  <PageTransition>
    <div class="tool-page">
      <!-- 顶部导航栏 -->
      <v-app-bar flat border>
        <v-btn
            icon
            variant="text"
            @click="goBack"
            class="mr-2"
        >
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>

        <v-app-bar-title>
          <v-icon start :icon="tool?.icon" color="teal"></v-icon>
          {{ tool?.name || '工具加载中...' }}
        </v-app-bar-title>

        <v-spacer></v-spacer>

        <v-btn
            icon
            variant="text"
            @click="refresh"
        >
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-app-bar>

      <!-- 工具内容区域 -->
      <v-container class="tool-content" v-if="tool">
        <!-- 工具描述 -->
        <v-row class="mb-6">
          <v-col cols="12">
            <v-card elevation="2" class="description-card">
              <v-card-text class="text-body-1">
                {{ tool.description }}
              </v-card-text>
              <v-card-actions>
                <v-chip
                    color="teal"
                    size="small"
                    variant="outlined"
                    class="mr-2"
                >
                  <v-icon start icon="mdi-code-tags"></v-icon>
                  {{ tool.code }}
                </v-chip>
                <v-chip
                    color="blue"
                    size="small"
                    variant="outlined"
                >
                  <v-icon start icon="mdi-shield-check"></v-icon>
                  本地运行
                </v-chip>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <!-- 动态工具组件 -->
        <v-row>
          <v-col cols="12">
            <component
                :is="toolComponent"
                v-if="toolComponent"
                @update:loading="updateLoading"
            />
            <v-card v-else elevation="2" class="pa-8 text-center">
              <v-progress-circular
                  indeterminate
                  color="teal"
                  size="64"
                  class="mb-4"
              />
              <div class="text-grey">正在加载工具组件...</div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>

      <!-- 加载状态 -->
      <v-container v-else class="fill-height justify-center">
        <v-card elevation="2" class="pa-8 text-center" max-width="400">
          <v-icon
              size="64"
              color="error"
              icon="mdi-alert-circle-outline"
              class="mb-4"
          />
          <h3 class="text-h6 mb-2">工具未找到</h3>
          <p class="text-grey mb-4">
            该工具可能已被禁用或不存在
          </p>
          <v-btn
              color="teal"
              variant="tonal"
              @click="goBack"
          >
            返回首页
          </v-btn>
        </v-card>
      </v-container>

      <!-- 全局加载遮罩 -->
      <v-overlay
          v-model="loading"
          class="align-center justify-center"
      >
        <v-card elevation="4" class="pa-6">
          <v-progress-circular
              indeterminate
              color="teal"
              size="48"
              class="mr-4"
          />
          <span class="text-body-1">处理中...</span>
        </v-card>
      </v-overlay>

      <!-- 全局提示 -->
      <v-snackbar
          v-model="snackbar.show"
          :color="snackbar.color"
          :timeout="3000"
          location="top right"
      >
        {{ snackbar.message }}
      </v-snackbar>
    </div>
  </PageTransition>
</template>

<script setup>
import {onMounted, ref, shallowRef} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {toolRegistry} from '../config/tools-config.js'
import PageTransition from '../components/PageTransition.vue'

const route = useRoute()
const router = useRouter()

const tool = ref(null)
const toolComponent = shallowRef(null)
const loading = ref(false)
const snackbar = ref({
  show: false,
  message: '',
  color: 'info'
})

// 加载工具数据
const loadTool = async () => {
  const code = route.params.code
  const toolData = toolRegistry.getToolByCode(code)

  if (!toolData) {
    tool.value = null
    toolComponent.value = null
    return
  }

  tool.value = toolData

  try {
    loading.value = true
    // 动态导入组件
    const module = await toolData.component()
    toolComponent.value = module.default || module
  } catch (error) {
    console.error('加载工具组件失败:', error)
    showSnackbar('工具组件加载失败', 'error')
  } finally {
    loading.value = false
  }
}

// 导航相关
const goBack = () => {
  router.back()
}

const refresh = async () => {
  await loadTool()
  showSnackbar('已刷新', 'success')
}

// 工具组件通信
const updateLoading = (value) => {
  loading.value = value
}

// 显示提示
const showSnackbar = (message, color = 'info') => {
  snackbar.value = {
    show: true,
    message,
    color
  }
}

// 监听路由变化
onMounted(() => {
  loadTool()
})
</script>

<style scoped>
.tool-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
  transition: background 0.3s ease;
}

.tool-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.description-card {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

/* 深色模式适配 - 使用直接选择器 */
.v-theme--dark .tool-page {
  background: linear-gradient(135deg, #121212 0%, #1e1e1e 100%);
}

.v-theme--dark .description-card {
  background: rgba(30, 30, 30, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* 确保工具详情页的所有文本在深色模式下都有正确的颜色 */
.v-theme--dark .tool-page .text-body-1,
.v-theme--dark .tool-page .text-h6,
.v-theme--dark .tool-page .text-grey {
  color: #e0e0e0;
}

.v-theme--dark .tool-page .text-grey {
  color: #aaa !important;
}

/* 加载动画 */
.v-progress-circular {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
