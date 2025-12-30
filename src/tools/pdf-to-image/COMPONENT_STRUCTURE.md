# PDF转图片工具 - 组件结构说明

## 📋 概述

本工具已按照组件模块化原则进行了重构，将原本的大型单文件组件拆分为多个职责单一的子组件。

## 🏗️ 组件目录结构

```
src/tools/pdf-to-image/
├── index.vue                          # 入口组件（仅导入MainContainer）
├── components/                        # 组件目录
│   ├── FileUpload.vue                # 文件上传和解析组件
│   ├── PreviewGrid.vue               # 页面预览网格组件
│   ├── PreviewModal.vue              # 大图预览模态框
│   ├── ExportPanel.vue               # 导出控制面板
│   ├── TipsSection.vue               # 操作提示区域
│   ├── ExportProgressModal.vue       # 导出进度模态框
│   ├── NotificationSnackbar.vue      # 通知提示组件
│   └── MainContainer.vue             # 主容器（组合所有组件）
├── README.md                          # 工具说明文档
└── COMPONENT_STRUCTURE.md            # 本文件
```

## 📦 组件职责详解

### 1. FileUpload.vue - 文件上传组件
**职责**：处理PDF文件的选择、验证和解析

**主要功能**：
- 文件选择和验证（格式、大小）
- 文件信息显示（名称、大小、页数）
- PDF解析进度提示
- 错误处理

**Props**：
- 无（独立组件）

**Emits**：
- `file-uploaded(file)`: 文件上传完成
- `pdf-processed(pages)`: PDF解析完成
- `error(message)`: 错误信息
- `update:processing(isProcessing)`: 处理状态更新

**Exposed Methods**：
- `reset()`: 重置状态

### 2. PreviewGrid.vue - 预览网格组件
**职责**：显示PDF页面的缩略图网格

**主要功能**：
- 显示前12页的预览缩略图
- 响应式网格布局
- 页面点击触发预览
- 更多页面提示

**Props**：
- `pdfLoaded`: PDF是否已加载
- `totalPages`: 总页数

**Emits**：
- `open-preview(page)`: 打开预览

### 3. PreviewModal.vue - 预览模态框
**职责**：显示单个页面的大图预览

**主要功能**：
- 大图预览显示
- 页面导航（上一页/下一页）
- 当前页码显示
- 关闭功能

**Props**：
- `modelValue`: 是否显示模态框
- `currentPage`: 当前页码
- `totalPages`: 总页数

**Emits**：
- `update:modelValue(value)`: 更新显示状态
- `prev-page`: 上一页
- `next-page`: 下一页

### 4. ExportPanel.vue - 导出控制面板
**职责**：管理导出设置和触发导出

**主要功能**：
- 图片格式选择（PNG/JPG/WEBP）
- 图片质量调节（低/中/高）
- 导出范围选择（全部/当前页）
- 导出按钮和提示

**Props**：
- `pdfLoaded`: PDF是否已加载
- `totalPages`: 总页数
- `exporting`: 是否正在导出

**Emits**：
- `export-images(config)`: 触发导出

**Exposed Methods**：
- `exportConfig`: 导出配置对象

### 5. TipsSection.vue - 操作提示组件
**职责**：显示操作指引和状态提示

**主要功能**：
- 操作步骤指引
- 准备就绪提示
- 条件显示逻辑

**Props**：
- `pdfFile`: 当前PDF文件
- `pdfLoaded`: PDF是否已加载
- `totalPages`: 总页数
- `exporting`: 是否正在导出
- `processing`: 是否正在处理

### 6. ExportProgressModal.vue - 导出进度模态框
**职责**：显示导出进度和状态

**主要功能**：
- 循环进度指示器
- 格式和质量显示
- 取消导出功能

**Props**：
- `modelValue`: 是否显示模态框
- `format`: 导出格式
- `quality`: 导出质量

**Emits**：
- `update:modelValue(value)`: 更新显示状态
- `cancel`: 取消导出

### 7. NotificationSnackbar.vue - 通知提示组件
**职责**：显示全局通知消息

**主要功能**：
- 消息提示显示
- 颜色主题支持
- 自动消失

**Props**：
- `modelValue`: 是否显示
- `message`: 消息内容
- `color`: 颜色主题
- `timeout`: 显示时长

**Emits**：
- `update:modelValue(value)`: 更新显示状态

### 8. MainContainer.vue - 主容器组件
**职责**：组合所有子组件，管理全局状态

**主要功能**：
- 状态管理（文件、页数、加载状态等）
- 事件协调（子组件通信）
- 业务逻辑处理（模拟导出、下载等）
- 错误处理和通知

**状态管理**：
```javascript
const pdfFile = ref(null)           // PDF文件
const processing = ref(false)       // 处理中状态
const pdfLoaded = ref(false)        // PDF加载完成
const totalPages = ref(0)           // 总页数
const exporting = ref(false)        // 导出中状态
const previewDialog = ref(false)    // 预览模态框
const exportProgressDialog = ref(false) // 导出进度模态框
const currentPage = ref(1)          // 当前页码
const exportConfig = reactive({})   // 导出配置
const snackbar = ref({})            // 通知消息
```

## 🔄 数据流和通信

### 完整工作流程

```
1. 用户选择PDF文件
   ↓
2. FileUpload 组件验证并上传
   ↓
3. MainContainer 接收文件，更新状态
   ↓
4. 用户点击"解析PDF"
   ↓
5. FileUpload 模拟解析，返回页数
   ↓
6. MainContainer 更新页数，显示预览网格
   ↓
7. 用户点击页面缩略图
   ↓
8. PreviewGrid 触发 open-preview 事件
   ↓
9. MainContainer 更新当前页码，显示预览模态框
   ↓
10. 用户配置导出设置
    ↓
11. ExportPanel 触发 export-images 事件
    ↓
12. MainContainer 显示导出进度，模拟处理
    ↓
13. 完成后显示通知
```

### 组件通信示例

#### 父组件 → 子组件（Props）
```vue
<!-- MainContainer.vue -->
<PreviewGrid
  :pdf-loaded="pdfLoaded"
  :total-pages="totalPages"
  @open-preview="handleOpenPreview"
/>
```

#### 子组件 → 父组件（Emits）
```vue
<!-- FileUpload.vue -->
<script setup>
const emit = defineEmits(['pdf-processed'])

const processPDF = async () => {
  const pages = Math.floor(Math.random() * 46) + 5
  emit('pdf-processed', pages)
}
</script>
```

## 🎯 重构优势

### 1. 代码可维护性
- **之前**：单文件800+行，难以定位问题
- **之后**：每个文件100-150行，职责清晰

### 2. 可测试性
```javascript
// 可以独立测试每个组件
test('FileUpload 验证PDF格式', () => {
  // 测试逻辑
})
```

### 3. 可复用性
- FileUpload 可用于其他需要PDF上传的工具
- NotificationSnackbar 可作为全局通知组件
- PreviewModal 可用于图片预览

### 4. 开发体验
- 更快的热重载（只重载修改的组件）
- 更清晰的错误堆栈
- 更好的代码提示

### 5. 性能优化
- 按需加载子组件
- 减少初始包大小
- 更好的内存管理

## 📝 开发规范

### 新增组件原则
1. **单一职责**：每个组件只做一件事
2. **明确接口**：定义清晰的Props和Emits
3. **样式隔离**：使用scoped样式
4. **文档注释**：关键逻辑添加注释

### 组件命名规范
- **展示组件**：使用名词，如 `PreviewGrid`
- **交互组件**：使用动词+名词，如 `FileUpload`
- **模态框**：使用 Modal 后缀，如 `PreviewModal`
- **面板**：使用 Panel 后缀，如 `ExportPanel`

### 状态管理规范
1. **集中管理**：状态在MainContainer中定义
2. **单向流动**：Props向下，Events向上
3. **响应式更新**：使用ref和reactive
4. **及时清理**：组件卸载时清理状态

## 🔧 扩展指南

### 添加新功能
1. **确定功能边界**：是否需要新组件？
2. **更新状态管理**：在MainContainer添加状态
3. **组件通信**：定义Props和Emits
4. **测试验证**：独立测试新组件

### 重构现有功能
1. **识别复杂组件**：超过200行的组件
2. **拆分逻辑**：按功能拆分为子组件
3. **更新通信**：使用事件和props
4. **验证功能**：确保行为一致

## 📊 代码统计

| 组件 | 代码行数 | 职责 |
|------|----------|------|
| index.vue | ~10 | 入口 |
| FileUpload.vue | ~120 | 文件上传 |
| PreviewGrid.vue | ~80 | 预览网格 |
| PreviewModal.vue | ~70 | 大图预览 |
| ExportPanel.vue | ~100 | 导出设置 |
| TipsSection.vue | ~50 | 操作提示 |
| ExportProgressModal.vue | ~60 | 进度显示 |
| NotificationSnackbar.vue | ~30 | 通知提示 |
| MainContainer.vue | ~150 | 状态管理 |
| **总计** | **~670** | **8个子组件** |

**对比**：
- 原始单文件：~800行
- 拆分后：~670行（更清晰，更易维护）

## 🚀 使用示例

### 基本使用
```vue
<template>
  <MainContainer />
</template>

<script setup>
import MainContainer from './components/MainContainer.vue'
</script>
```

### 自定义扩展
```vue
<template>
  <MainContainer @custom-event="handleCustom" />
</template>

<script setup>
import MainContainer from './components/MainContainer.vue'

const handleCustom = (data) => {
  // 自定义逻辑
}
</script>
```

## ✅ 验证清单

- [x] 所有组件已创建
- [x] 组件职责清晰
- [x] Props和Emits定义完整
- [x] 样式隔离
- [x] 主组件正确组合子组件
- [x] 数据流正确
- [x] 错误处理完善
- [x] 文档已更新

---

**重构完成！** 现在这个工具具有了更好的代码结构、可维护性和可扩展性。
