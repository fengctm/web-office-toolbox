# 工具开发指南

## 📋 概述

Web Office Toolbox 采用模块化设计，每个工具都是独立的 Vue 组件。本指南将帮助你快速创建新工具。

## 🏗️ 工具结构

### 标准目录结构

```
src/tools/
├── your-tool/              # 工具目录
│   ├── index.vue          # 工具主组件
│   ├── README.md          # 工具说明文档（可选）
│   └── assets/            # 静态资源（可选）
│       └── images/
└── README.md              # 工具开发指南
```

### 最小化要求

只需要一个 `index.vue` 文件即可创建一个工具。

### 📁 复杂代码分离（推荐）

当工具的JavaScript代码过多时，建议将复杂逻辑分离到独立的JS文件中：

**目录结构：**

```
src/tools/
├── your-tool/
│   ├── index.vue          # 工具主组件
│   ├── utils.js           # 工具函数（可选）
│   ├── processor.js       # 核心处理逻辑（可选）
│   └── README.md          # 工具说明文档（可选）
```

**示例：**

```javascript
// src/tools/your-tool/utils.js
export const validateInput = (input) => {
    return input && input.length > 0
}

export const processData = async (data) => {
    // 复杂的处理逻辑
    return result
}

// src/tools/your-tool/index.vue
<script setup>
    import {ref} from 'vue'
    import {validateInput, processData} from './utils.js'

    const input = ref('')
    const result = ref(null)

    const handleProcess = async () => {
    if (validateInput(input.value)) {
    result.value = await processData(input.value)
}
}
</script>
```

**优势：**

- ✅ 代码更清晰，易于维护
- ✅ 便于单元测试
- ✅ 组件文件更简洁
- ✅ 逻辑可复用

## 🚀 快速开始（3步）

### 步骤 1：创建工具目录

```bash
mkdir src/tools/my-tool
touch src/tools/my-tool/index.vue
```

### 步骤 2：实现工具组件

```vue

<template>
  <v-card class="my-tool" elevation="2">
    <v-card-item>
      <v-card-title>
        <v-icon color="teal" class="mr-2">mdi-toolbox</v-icon>
        我的工具
      </v-card-title>
      <v-card-subtitle>
        工具描述
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <!-- 工具内容 -->
      <div>这里是工具的主要功能区域</div>
    </v-card-text>
  </v-card>
</template>

<script setup>
  // 工具逻辑
</script>

<style scoped>
  /* 工具样式 */
  .my-tool {
    border-radius: 12px;
  }
</style>
```

### 步骤 3：注册工具

在 `src/config/tools-config.js` 中添加：

```javascript
{
    code: 'my-tool',
        name
:
    '我的工具',
        icon
:
    'mdi-toolbox',
        description
:
    '工具描述',
        enabled
:
    true,
        component
:
    () => import('../tools/my-tool/index.vue')
}
```

**完成！** 工具会自动出现在首页。

## 📝 工具组件规范

### 组件结构

```vue

<template>
  <v-card class="tool-container" elevation="2">
    <!-- 1. 标题区域 -->
    <v-card-item>
      <v-card-title>
        <v-icon color="teal" class="mr-2">mdi-icon-name</v-icon>
        工具名称
      </v-card-title>
      <v-card-subtitle>
        简短描述
      </v-card-subtitle>
    </v-card-item>

    <!-- 2. 主要功能区域 -->
    <v-card-text>
      <!-- 输入区域 -->
      <!-- 处理逻辑展示 -->
      <!-- 结果输出 -->
    </v-card-text>

    <!-- 3. 操作按钮 -->
    <v-card-actions>
      <v-btn color="teal" @click="handleAction">执行</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
  import {ref, computed, watch} from 'vue'

  // 1. 响应式状态
  const input = ref('')
  const result = ref(null)
  const loading = ref(false)

  // 2. 计算属性
  const isValid = computed(() => {
    return input.value && input.value.length > 0
  })

  // 3. 核心功能函数
  const processData = async () => {
    loading.value = true
    try {
      // 处理逻辑
      result.value = await someProcessing(input.value)
    } catch (error) {
      console.error('处理失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 4. 事件处理
  const handleAction = () => {
    if (isValid.value) {
      processData()
    }
  }

  // 5. 自动保存/恢复状态
  const saveState = () => {
    const state = {input: input.value, result: result.value}
    localStorage.setItem('tool-state', JSON.stringify(state))
  }

  const loadState = () => {
    const saved = localStorage.getItem('tool-state')
    if (saved) {
      const state = JSON.parse(saved)
      input.value = state.input || ''
      result.value = state.result || null
    }
  }

  // 监听变化自动保存
  watch([input, result], saveState, {deep: true})

  // 组件挂载时加载状态
  loadState()
</script>

<style scoped>
  .tool-container {
    border-radius: 12px;
    overflow: hidden;
  }

  /* 响应式设计 */
  @media (max-width: 600px) {
    /* 移动端优化 */
  }
</style>
```

### 事件通信

```javascript
// 通知父组件加载状态
const emit = defineEmits(['update:loading'])

const handleProcess = async () => {
    emit('update:loading', true)
    // 处理逻辑
    emit('update:loading', false)
}
```

## 🎨 UI 设计规范

### 颜色系统

- **主色调**：Teal (#009688)
- **成功**：Success (#4caf50)
- **错误**：Error (#f44336)
- **警告**：Warning (#ff9800)
- **信息**：Info (#2196f3)

### 组件使用

```vue
<!-- 按钮 -->
<v-btn color="teal" variant="tonal">操作</v-btn>

<!-- 输入框 -->
<v-text-field
    v-model="input"
    label="输入"
    variant="outlined"
    density="comfortable"
/>

<!-- 卡片 -->
<v-card elevation="2" class="rounded-lg">

  <!-- 提示 -->
  <v-snackbar v-model="show" color="success" timeout="3000">
    操作成功
  </v-snackbar>
```

### 动画效果

```css
/* 入场动画 */
.tool-container {
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

## 🔧 功能模式

### 1. 文件处理模式

```javascript
const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
        const content = e.target.result
        // 处理文件内容
    }
    reader.readAsText(file)
}

const downloadFile = (content, filename) => {
    const blob = new Blob([content], {type: 'text/plain'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}
```

### 2. 实时处理模式

```javascript
const input = ref('')
const result = computed(() => {
    if (!input.value) return ''
    // 实时处理逻辑
    return process(input.value)
})
```

### 3. 批量处理模式

```javascript
const files = ref([])
const results = ref([])

const processBatch = async () => {
    for (const file of files.value) {
        const result = await processFile(file)
        results.value.push(result)
    }
}
```

## 📦 常用工具库

### 浏览器 API

```javascript
// 本地存储
localStorage.setItem('key', JSON.stringify(data))
JSON.parse(localStorage.getItem('key'))

// 剪贴板
navigator.clipboard.writeText(text)

// 文件下载
URL.createObjectURL(blob)
```

### 处理函数

```javascript
// 防抖
const debounce = (fn, delay) => {
    let timer
    return (...args) => {
        clearTimeout(timer)
        timer = setTimeout(() => fn(...args), delay)
    }
}

// 节流
const throttle = (fn, delay) => {
    let last = 0
    return (...args) => {
        const now = Date.now()
        if (now - last > delay) {
            fn(...args)
            last = now
        }
    }
}
```

## 🎯 最佳实践

### ✅ 应该做的

1. **状态管理**：使用 `ref` 和 `computed` 管理状态
2. **错误处理**：使用 try-catch 处理异常
3. **用户反馈**：使用 snackbar 提供操作反馈
4. **性能优化**：大量数据使用虚拟滚动
5. **响应式**：适配不同屏幕尺寸
6. **无障碍**：提供适当的 ARIA 标签

### ❌ 避免做的

1. **不要直接修改 props**
2. **不要在模板中写复杂逻辑**
3. **不要忽略错误处理**
4. **不要使用全局变量**
5. **不要阻塞主线程**（使用 Web Worker 处理复杂计算）

## 🔍 调试技巧

### 1. 使用 Vue DevTools

```javascript
// 在组件中添加调试信息
console.log('Component mounted')
console.log('State:', {input: input.value, result: result.value})
```

### 2. 性能监控

```javascript
const start = performance.now()
// 执行操作
const end = performance.now()
console.log(`操作耗时: ${end - start}ms`)
```

### 3. 错误边界

```vue

<template>
  <div v-if="error" class="error-boundary">
    <v-alert type="error" :title="error.message"/>
  </div>
  <div v-else>
    <!-- 正常内容 -->
  </div>
</template>

<script setup>
  const error = ref(null)

  try {
    // 可能出错的代码
  } catch (e) {
    error.value = e
  }
</script>
```

## 📚 示例工具

项目包含一个完整的示例计数器工具，位于 `src/tools/example-counter/index.vue`。

### 示例功能

- ✅ 状态管理
- ✅ 本地存储
- ✅ 历史记录
- ✅ 用户反馈
- ✅ 响应式设计
- ✅ 深色模式适配

## 🚀 发布新工具

### 检查清单

- [ ] 功能完整且稳定
- [ ] 错误处理完善
- [ ] 移动端适配
- [ ] 深色模式适配
- [ ] 性能优化
- [ ] 添加工具配置
- [ ] 更新文档
- [ ] 组件模块化（复杂工具）

### 工具配置示例

```javascript
{
    code: 'your-tool',
        name
:
    '你的工具',
        icon
:
    'mdi-tool-icon',
        description
:
    '详细描述工具功能',
        enabled
:
    true,
        component
:
    () => import('../tools/your-tool/index.vue')
}
```

## 🏗️ 组件模块化开发

### 为什么需要组件模块化？

当工具的Vue组件代码过多（通常超过200行）时，应该采用组件模块化的方式：

**优势：**

- ✅ **代码清晰**：每个组件职责单一，易于理解和维护
- ✅ **易于测试**：独立组件便于单元测试
- ✅ **可复用性**：子组件可以在不同工具间共享
- ✅ **团队协作**：多人开发时减少代码冲突
- ✅ **性能优化**：可以按需加载子组件

### 标准组件目录结构

```
src/tools/
└── your-tool/
    ├── index.vue              # 主组件（入口）
    ├── components/            # 组件目录
    │   ├── FileUpload.vue     # 文件上传组件
    │   ├── PreviewGrid.vue    # 预览网格组件
    │   ├── PreviewModal.vue   # 预览模态框
    │   ├── ExportPanel.vue    # 导出控制面板
    │   ├── TipsSection.vue    # 操作提示区域
    │   ├── ProgressModal.vue  # 进度模态框
    │   ├── Notification.vue   # 通知提示
    │   └── MainContainer.vue  # 主容器（组合所有组件）
    ├── utils.js               # 工具函数（可选）
    ├── processor.js           # 核心处理逻辑（可选）
    └── README.md              # 工具说明文档
```

### 组件拆分原则

#### 1. 按功能区域拆分

- **文件上传**：FileUpload.vue
- **数据展示**：PreviewGrid.vue, DataList.vue
- **交互模态框**：PreviewModal.vue, EditModal.vue
- **控制面板**：ExportPanel.vue, SettingsPanel.vue
- **提示信息**：TipsSection.vue, NotificationSnackbar.vue

#### 2. 按交互复杂度拆分

- **简单组件**：按钮、标签、简单表单
- **复杂组件**：数据表格、图表、文件上传器
- **容器组件**：负责状态管理和组件组合

#### 3. 按数据流向拆分

- **展示组件**：只接收props，不管理状态
- **交互组件**：通过事件与父组件通信
- **容器组件**：管理全局状态，协调子组件

### 组件通信模式

#### 父组件 → 子组件（Props）

```vue
<!-- MainContainer.vue -->
<template>
  <FileUpload
      @file-uploaded="handleFileUploaded"
      @error="handleError"
  />
</template>
```

#### 子组件 → 父组件（Emits）

```vue
<!-- FileUpload.vue -->
<script setup>
  const emit = defineEmits(['file-uploaded', 'error'])

  const handleUpload = (file) => {
    emit('file-uploaded', file)
  }
</script>
```

#### 兄弟组件通信（通过父组件）

```vue
<!-- MainContainer.vue -->
<template>
  <FileUpload @file-uploaded="handleFileUploaded"/>
  <PreviewGrid :file="currentFile"/>
</template>

<script setup>
  const currentFile = ref(null)

  const handleFileUploaded = (file) => {
    currentFile.value = file
  }
</script>
```

### 状态管理最佳实践

#### 1. 集中式状态管理

```vue
<!-- MainContainer.vue -->
<script setup>
  // 所有状态集中在父组件
  const pdfFile = ref(null)
  const totalPages = ref(0)
  const pdfLoaded = ref(false)
  const exporting = ref(false)
  // ...
</script>
```

#### 2. 状态传递

```vue
<!-- 传递给子组件 -->
<PreviewGrid
    :pdf-loaded="pdfLoaded"
    :total-pages="totalPages"
    @open-preview="handleOpenPreview"
/>
```

#### 3. 事件更新状态

```vue
<!-- 子组件触发事件 -->
<script setup>
  const emit = defineEmits(['pdf-processed'])

  const processPDF = async () => {
    // 处理逻辑
    emit('pdf-processed', totalPages)
  }
</script>
```

### 组件拆分示例

#### 原始大型组件

```vue
<!-- 不推荐：一个文件包含所有逻辑 -->
<template>
  <div>
    <!-- 文件上传 -->
    <v-file-input/>

    <!-- 预览网格 -->
    <v-row>
      <v-col v-for="page in pages"/>
    </v-row>

    <!-- 导出面板 -->
    <v-expansion-panels>
      <!-- ... -->
    </v-expansion-panels>

    <!-- 模态框 -->
    <v-dialog>
      <!-- ... -->
    </v-dialog>
  </div>
</template>

<script setup>
  // 所有状态和逻辑都在这里
  const file = ref(null)
  const pages = ref([])
  const dialog = ref(false)
  // 200+ 行代码...
</script>
```

#### 模块化拆分后

```vue
<!-- 推荐：主组件组合子组件 -->
<template>
  <v-card>
    <FileUpload @file-uploaded="handleFileUploaded"/>
    <PreviewGrid :pages="pages" @open-preview="openPreview"/>
    <ExportPanel @export="handleExport"/>
    <PreviewModal v-model="dialog" :page="currentPage"/>
  </v-card>
</template>

<script setup>
  import FileUpload from './components/FileUpload.vue'
  import PreviewGrid from './components/PreviewGrid.vue'
  import ExportPanel from './components/ExportPanel.vue'
  import PreviewModal from './components/PreviewModal.vue'

  // 简洁的状态管理
  const file = ref(null)
  const pages = ref([])
  const dialog = ref(false)
  const currentPage = ref(1)

  // 事件处理
  const handleFileUploaded = (f) => {
    file.value = f
  }
  const openPreview = (page) => {
    currentPage.value = page;
    dialog.value = true
  }
  const handleExport = (config) => { /* 导出逻辑 */
  }
</script>
```

### 组件设计规范

#### 1. 单一职责原则

```javascript
// ✅ 好：每个组件只做一件事
FileUpload.vue        // 只负责文件上传
PreviewGrid.vue       // 只负责预览展示
ExportPanel.vue       // 只负责导出设置

// ❌ 坏：一个组件做太多事
CombinedTool.vue      // 包含上传、预览、导出、设置...
```

#### 2. 明确的接口定义

```vue

<script setup>
  // Props 定义
  const props = defineProps({
    pdfLoaded: {
      type: Boolean,
      default: false
    },
    totalPages: {
      type: Number,
      default: 0
    }
  })

  // Emits 定义
  const emit = defineEmits(['open-preview', 'export-images'])
</script>
```

#### 3. 样式隔离

```vue

<style scoped>
  /* 组件私有样式 */
  .upload-section {
    background: rgba(0, 150, 136, 0.03);
  }

  /* 避免全局样式污染 */
</style>
```

### 实际案例：PDF转图片工具

#### 组件拆分结构

```
pdf-to-image/
├── index.vue                    # 入口（仅导入MainContainer）
├── components/
│   ├── FileUpload.vue          # 文件上传和解析
│   ├── PreviewGrid.vue         # 页面预览网格
│   ├── PreviewModal.vue        # 大图预览模态框
│   ├── ExportPanel.vue         # 导出设置面板
│   ├── TipsSection.vue         # 操作提示
│   ├── ExportProgressModal.vue # 导出进度
│   ├── NotificationSnackbar.vue # 通知提示
│   └── MainContainer.vue       # 主容器（组合所有）
```

#### 组件职责划分

- **FileUpload**: 处理文件选择、验证、解析
- **PreviewGrid**: 显示页面缩略图、触发预览
- **PreviewModal**: 大图查看、页面导航
- **ExportPanel**: 导出格式、质量、范围设置
- **TipsSection**: 操作指引、状态提示
- **ExportProgressModal**: 导出进度显示
- **NotificationSnackbar**: 全局通知
- **MainContainer**: 状态管理、事件协调

### 性能优化建议

#### 1. 按需加载

```javascript
// 动态导入大组件
const PreviewModal = defineAsyncComponent(() =>
    import('./components/PreviewModal.vue')
)
```

#### 2. 虚拟滚动

```vue
<!-- 大量数据时使用虚拟滚动 -->
<v-virtual-scroll
    :items="pages"
    height="400"
    item-height="80"
>
  <template #default="{ item }">
    <!-- 预览项 -->
  </template>
</v-virtual-scroll>
```

#### 3. 防抖节流

```javascript
// 文件上传防抖
const debouncedUpload = debounce(handleFileUpload, 300)

// 搜索节流
const throttledSearch = throttle(searchPages, 500)
```

### 测试策略

#### 1. 组件单元测试

```javascript
// FileUpload.test.js
import {mount} from '@vue/test-utils'
import FileUpload from './FileUpload.vue'

test('文件验证', async () => {
    const wrapper = mount(FileUpload)
    await wrapper.find('input[type="file"]').trigger('change')
    expect(wrapper.emitted('error')).toBeTruthy()
})
```

#### 2. 集成测试

```javascript
// MainContainer.test.js
import {mount} from '@vue/test-utils'
import MainContainer from './MainContainer.vue'

test('完整工作流程', async () => {
    const wrapper = mount(MainContainer)
    // 模拟：上传 → 解析 → 预览 → 导出
    // 验证：状态变化、事件触发
})
```

### 开发工作流

#### 1. 设计阶段

- 确定组件边界
- 定义Props和Emits接口
- 规划状态管理方案

#### 2. 实现阶段

- 从简单组件开始
- 逐步构建复杂组件
- 最后组合成主容器

#### 3. 优化阶段

- 检查性能瓶颈
- 优化组件通信
- 添加错误处理

### 常见反模式

#### ❌ 反模式1：过度嵌套

```vue
<!-- 嵌套太深，难以维护 -->
<Parent>
  <Child>
    <GrandChild>
      <GreatGrandChild>...</GreatGrandChild>
    </GrandChild>
  </Child>
</Parent>
```

#### ❌ 反模式2：Props钻取

```vue
<!-- Props层层传递 -->
<A :data="data">
  <B :data="data">
    <C :data="data">
      <!-- 实际只有C需要data -->
    </C>
  </B>
</A>
```

#### ✅ 解决方案：Provide/Inject

```vue
<!-- 父组件提供 -->
<script setup>
  provide('pdfData', data)
</script>

<!-- 深层子组件注入 -->
<script setup>
  const data = inject('pdfData')
</script>
```

---

**记住：组件模块化不是目标，而是手段。目的是让代码更易维护、测试和扩展。**

## 💡 灵感来源

### 常见工具类型

- **文本处理**：格式转换、编码解码、正则测试
- **文件处理**：格式转换、压缩、合并、拆分
- **图片处理**：压缩、格式转换、尺寸调整
- **数据处理**：JSON格式化、CSV转换、数据验证
- **开发工具**：代码格式化、时间戳转换、颜色选择器
- **办公工具**：PDF处理、Excel操作、文档转换

### 参考资源

- [Vuetify 3 组件文档](https://vuetifyjs.com/)
- [Vue 3 Composition API](https://vuejs.org/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

## 🎉 开始创造

现在你已经了解了所有规则，开始创建你的第一个工具吧！

```bash
# 创建工具目录
mkdir src/tools/my-first-tool

# 创建组件文件
touch src/tools/my-first-tool/index.vue

# 在 tools-config.js 中添加配置
# 然后启动开发服务器
pnpm dev
```

**记住：保持简单，专注功能，用户体验第一！**
