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
import { ref } from 'vue'
import { validateInput, processData } from './utils.js'

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
  name: '我的工具',
  icon: 'mdi-toolbox',
  description: '工具描述',
  enabled: true,
  component: () => import('../tools/my-tool/index.vue')
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
import { ref, computed, watch } from 'vue'

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
  const state = { input: input.value, result: result.value }
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
watch([input, result], saveState, { deep: true })

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
  const blob = new Blob([content], { type: 'text/plain' })
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
console.log('State:', { input: input.value, result: result.value })
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
    <v-alert type="error" :title="error.message" />
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

### 工具配置示例
```javascript
{
  code: 'your-tool',
  name: '你的工具',
  icon: 'mdi-tool-icon',
  description: '详细描述工具功能',
  enabled: true,
  component: () => import('../tools/your-tool/index.vue')
}
```

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
npm run dev
```

**记住：保持简单，专注功能，用户体验第一！**
