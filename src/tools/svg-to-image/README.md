# SVG 转图片工具

## 📋 功能概述

SVG 转图片工具是一个纯前端的转换工具，可以将 SVG 代码转换为 PNG、JPG 或 WEBP 格式的图片文件。所有处理都在浏览器中本地完成，无需上传到服务器。

## 🎯 核心功能

### 1. SVG 代码输入

- 支持粘贴或输入 SVG 源代码
- 实时预览 SVG 渲染效果
- 代码自动修剪和格式化

### 2. 多格式转换

- **PNG**: 无损格式，支持透明背景
- **JPG**: 有损格式，自动添加白色背景
- **WEBP**: 现代格式，高压缩比

### 3. 文件下载

- 转换后自动下载图片文件
- 支持下载原始 SVG 文件
- 智能文件命名

### 4. 用户体验

- 实时预览区域
- 全屏查看模式
- 操作反馈通知
- 错误提示和处理

## 🔧 技术实现

### 核心算法流程

```javascript
1.
输入验证
   ↓
2.
SVG
解析(DOMParser)
   ↓
3.
尺寸提取(width / height)
   ↓
4.
Canvas
创建
   ↓
5.
JPG
背景填充(可选)
   ↓
6.
SVG → Image
转换
   ↓
7.
Canvas → Blob
导出
   ↓
8.
文件下载
```

### 关键代码片段

```javascript
// SVG 解析和验证
const parser = new DOMParser()
const svgDoc = parser.parseFromString(svgCode, 'image/svg+xml')
const svgElement = svgDoc.documentElement

// Canvas 渲染
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

// JPG 白色背景处理
if (format === 'JPG') {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)
}

// 格式转换
canvas.toBlob((blob) => {
    // 下载文件
}, mimeType, 0.95)
```

## 🎨 UI 设计

### 布局结构

- **左侧**: 输入区域 + 导出设置
- **右侧**: 实时预览区域
- **全屏**: Apple 风格的缩放动画

### 设计特色

- 棋盘格背景预览
- 毛玻璃工具栏
- 流畅的过渡动画
- 深色模式适配

## 📦 组件结构（拆分后）

```
svg-to-image/
├── index.vue                          # 主组件（整合所有子组件）
├── composables/
│   └── useSvgConverter.js            # SVG 转换逻辑 composable
├── components/
│   ├── InputSection.vue              # 输入区域组件
│   ├── PreviewSection.vue            # 预览区域组件
│   └── FullscreenPreview.vue         # 全屏预览组件
└── README.md                          # 本文档
```

### 架构优势

- **关注点分离**: 逻辑、UI、状态管理分离
- **可维护性**: 每个组件职责单一，易于修改
- **可复用性**: 组件可在其他工具中复用
- **可测试性**: 独立组件便于单元测试
- **开发效率**: 并行开发，减少冲突

### 数据流向

```
用户操作 → InputSection → index.vue → useSvgConverter
                                      ↓
PreviewSection ← index.vue → FullscreenPreview
                                      ↓
NotificationSnackbar（通用组件）
```

### 组件职责

| 组件 | 职责 | 状态 | 事件 |
|------|------|------|------|
| `useSvgConverter` | 核心转换逻辑 | svgCode, exportFormat, isFullscreen | - |
| `InputSection` | 输入表单和设置 | 受控组件 | update:svgCode, clear, download |
| `PreviewSection` | 实时预览展示 | 只读 | fullscreen |
| `FullscreenPreview` | 全屏查看模式 | 受控 | close |
| `NotificationSnackbar` | 全局通知 | 受控 | update:modelValue

## 🔍 使用示例

### 示例 1: 基本图形

```svg

<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="20" width="160" height="160" fill="#009688" rx="10"/>
    <circle cx="100" cy="100" r="50" fill="#fff"/>
    <text x="100" y="110" text-anchor="middle" fill="#009688" font-size="24">SVG</text>
</svg>
```

### 示例 2: 带渐变的复杂图形

```svg

<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#009688;stop-opacity:1"/>
            <stop offset="100%" style="stop-color:#00796b;stop-opacity:1"/>
        </linearGradient>
    </defs>
    <circle cx="100" cy="100" r="80" fill="url(#grad1)"/>
</svg>
```

## ⚠️ 限制和注意事项

### SVG 支持限制

- 不支持外部资源引用（图片、字体）
- 不支持复杂的 JavaScript 交互
- 某些 CSS 样式可能无法正确渲染

### 浏览器兼容性

- 需要支持 Canvas API
- 需要支持 Blob API
- 现代浏览器（Chrome 50+, Firefox 45+, Safari 10+）

### 性能考虑

- 大尺寸 SVG 可能导致内存占用
- 复杂渐变和滤镜可能影响转换速度
- 建议 SVG 文件大小 < 2MB

## 🛠️ 开发和扩展

### 添加新功能

1. **自定义尺寸**: 允许用户设置输出图片尺寸
2. **质量调节**: JPG/WEBP 质量滑块
3. **批量处理**: 支持多个 SVG 同时转换
4. **高级选项**: 背景色自定义、边距设置

### 代码优化方向

- 添加 Web Worker 支持大文件处理
- 实现 SVG 验证和清理
- 添加撤销/重做功能
- 支持 SVG 编辑功能

## 🔒 隐私和安全

- ✅ **本地处理**: 所有计算在浏览器中完成
- ✅ **零上传**: 不发送数据到任何服务器
- ✅ **临时存储**: 使用内存，不持久化数据
- ✅ **可清除**: 用户可随时清除所有数据

## 📊 测试覆盖

### 功能测试

- ✅ 基本 SVG 转换
- ✅ 复杂 SVG (带渐变)
- ✅ 错误输入处理
- ✅ 空输入处理
- ✅ 多格式导出

### 兼容性测试

- ✅ 深色模式
- ✅ 响应式布局
- ✅ 移动端适配
- ✅ 浏览器兼容性

## 🚀 部署和使用

### 在 Web Office Toolbox 中使用

1. 启动应用: `pnpm dev`
2. 访问首页
3. 找到 "SVG转图片" 工具
4. 粘贴 SVG 代码
5. 选择格式并下载

### 独立使用

可以直接打开 `test-svg-tool.html` 进行功能测试。

## 📝 更新日志

### v1.0 (当前)

- ✅ 基本 SVG 转换功能
- ✅ PNG/JPG/WEBP 格式支持
- ✅ 实时预览
- ✅ 全屏查看
- ✅ 用户反馈系统
- ✅ 错误处理
- ✅ 深色模式适配

---

**开发完成时间**: 2026-01-03  
**开发者**: AI Assistant  
**状态**: ✅ 功能完整，可投入使用
