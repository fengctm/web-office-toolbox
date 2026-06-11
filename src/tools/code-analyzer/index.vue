<template>
  <v-container fluid class="code-analyzer">
    <!-- 隐私声明 -->
    <v-alert
      type="info"
      variant="tonal"
      density="compact"
      rounded="lg"
      class="mb-4"
      icon="mdi-shield-check"
    >
      <template #title>隐私声明</template>
      本工具纯前端实现，无后端服务。您选择的代码文件仅在浏览器本地处理，数据不会发送到任何服务器。
    </v-alert>

    <!-- 未扫描时：空状态 -->
    <v-card v-if="!analyzer.results.value" elevation="1" rounded="lg" class="empty-card">
      <v-card-text class="d-flex flex-column align-center justify-center" style="min-height: 50vh;">
        <v-icon size="80" color="teal" class="mb-4">mdi-file-tree-outline</v-icon>
        <h2 class="text-h5 font-weight-medium mb-2">代码项目分析工具</h2>
        <p class="text-body-1 text-medium-emphasis mb-6 text-center" style="max-width: 480px;">
          选择一个项目文件夹，自动扫描并统计所有代码文件的行数、类型分布、文件结构等信息。
        </p>
        <v-btn
          color="teal"
          size="large"
          rounded="lg"
          prepend-icon="mdi-folder-open"
          @click="openFolder"
        >
          选择文件夹开始分析
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- 已扫描：结果展示 -->
    <template v-if="analyzer.results.value">
      <!-- 文件类型标签 -->
      <v-card elevation="1" rounded="lg" class="mb-4">
        <v-card-title class="text-subtitle-1 font-weight-medium">文件类型明细</v-card-title>
        <v-divider />
        <v-card-text>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="[ext, info] in sortedExts"
              :key="ext"
              variant="tonal"
              color="teal"
              size="small"
            >
              {{ ext }}
              <template #append>
                <v-chip size="x-small" color="teal" class="ml-1">{{ info.count }}</v-chip>
              </template>
              <span class="text-caption text-medium-emphasis ml-1">
                {{ info.lines.toLocaleString('zh-CN') }} 行
              </span>
            </v-chip>
          </div>
        </v-card-text>
      </v-card>

      <!-- 统计概览 -->
      <StatsOverview
        :file-count="analyzer.allFiles.value.length"
        :total-files="analyzer.results.value.totalFiles"
        :total-lines="analyzer.results.value.totalLines"
        :type-count="Object.keys(analyzer.results.value.byExt).length"
        :elapsed="analyzer.results.value.elapsed"
        class="mb-4"
      />

      <!-- 图表 -->
      <FileCharts
        :by-ext="analyzer.results.value.byExt"
        :total-lines="analyzer.results.value.totalLines"
        :is-dark="isDark"
        class="mb-4"
      />

      <!-- 文件排行表 -->
      <FilesTable
        :files="analyzer.allFiles.value"
        :total-lines="analyzer.results.value.totalLines"
        @copy="copyToClipboard"
        class="mb-4"
      />

      <!-- 文件树 + 排除规则 -->
      <v-row>
        <v-col cols="12" md="6">
          <FileTree
            :tree-data="fileTree"
            @copy="copyToClipboard"
          />
        </v-col>
        <v-col cols="12" md="6">
          <ExclusionRules
            :exclusions="analyzer.exclusions.value"
            @add="handleAddExclusion"
            @remove="handleRemoveExclusion"
          />
        </v-col>
      </v-row>

      <!-- 操作栏 -->
      <div class="d-flex justify-center ga-3 mt-4 mb-2">
        <v-btn
          color="teal"
          variant="flat"
          prepend-icon="mdi-folder-open"
          @click="openFolder"
        >
          重新选择文件夹
        </v-btn>
        <v-btn
          color="teal"
          variant="outlined"
          prepend-icon="mdi-download"
          @click="handleExport"
        >
          导出 CSV
        </v-btn>
      </div>
    </template>

    <!-- 扫描进度遮罩 -->
    <v-overlay
      :model-value="analyzer.scanning.value"
      class="align-center justify-center"
      persistent
    >
      <v-card elevation="8" rounded="xl" class="pa-8 text-center" min-width="360">
        <v-icon size="48" color="teal" class="mb-3 spin-icon">mdi-loading</v-icon>
        <h3 class="text-h6 mb-2">正在扫描...</h3>
        <p class="text-body-2 text-medium-emphasis mb-4">
          {{ analyzer.progressText.value || '准备中' }}
        </p>
        <v-progress-linear
          indeterminate
          color="teal"
          rounded
          class="mb-4"
        />
        <v-btn variant="text" color="grey" size="small" @click="analyzer.cancelScan()">
          取消
        </v-btn>
      </v-card>
    </v-overlay>

    <!-- 提示 -->
    <v-snackbar v-model="snackbar.show" :timeout="3000" location="top right" :color="snackbar.color">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useCodeAnalyzer } from './composables/useCodeAnalyzer.js'
import StatsOverview from './components/StatsOverview.vue'
import FileCharts from './components/FileCharts.vue'
import FilesTable from './components/FilesTable.vue'
import FileTree from './components/FileTree.vue'
import ExclusionRules from './components/ExclusionRules.vue'

const analyzer = useCodeAnalyzer()

const snackbar = ref({ show: false, message: '', color: 'info' })

const isDark = ref(false)

const fileTree = computed(() => {
    if (!analyzer.allFiles.value.length) return {}
    return analyzer.buildFileTree(analyzer.allFiles.value)
})

const sortedExts = computed(() => {
    if (!analyzer.results.value) return []
    return Object.entries(analyzer.results.value.byExt).sort((a, b) => b[1].lines - a[1].lines)
})

function showMsg(msg, color = 'info') {
    snackbar.value = { show: true, message: msg, color }
}

async function openFolder() {
    try {
        if (!('showDirectoryPicker' in window)) {
            showMsg('您的浏览器不支持 File System Access API，请使用 Chrome 或 Edge', 'error')
            return
        }
        const dirHandle = await window.showDirectoryPicker({ mode: 'read' })
        await analyzer.startScan(dirHandle)
        showMsg('扫描完成', 'success')
    } catch (err) {
        if (err.name === 'AbortError') return
        showMsg('操作失败: ' + err.message, 'error')
    }
}

function handleAddExclusion(val) {
    const added = analyzer.addExclusion(val)
    showMsg(added ? `已添加排除规则: ${val}` : '该规则已存在')
}

function handleRemoveExclusion(index) {
    const removed = analyzer.removeExclusion(index)
    if (removed) showMsg(`已移除排除规则: ${removed}`)
}

function handleExport() {
    const ok = analyzer.exportCSV()
    if (ok) showMsg('已导出 CSV 文件', 'success')
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(
        () => showMsg('已复制到剪贴板'),
        () => showMsg('复制失败', 'error')
    )
}

function detectTheme() {
    isDark.value = document.documentElement.classList.contains('v-theme--dark')
}

let themeObserver = null

onMounted(async () => {
    await analyzer.init()
    detectTheme()
    themeObserver = new MutationObserver(detectTheme)
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onBeforeUnmount(() => {
    if (themeObserver) themeObserver.disconnect()
})
</script>

<style scoped>
.code-analyzer {
    animation: fadeIn 0.3s ease-out;
}

.empty-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
}
.v-theme--dark .empty-card {
    background: rgba(30, 30, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.05);
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.spin-icon {
    animation: spin 1.2s linear infinite;
}
</style>
