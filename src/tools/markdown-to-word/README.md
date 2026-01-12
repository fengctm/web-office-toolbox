# Markdown 到 Word 排版工具

## 📋 功能概述

Markdown 到 Word 排版工具是一个纯前端的文档转换工具，可以将 Markdown 语法实时转换为 Word 友好的 HTML 格式，并支持一键复制富文本到
Word 中粘贴。所有处理都在浏览器中本地完成。

## 🎯 核心功能

### 1. 实时预览

- ✅ Markdown 语法实时解析
- ✅ Word 样式预览展示
- ✅ A4 纸张模拟环境
- ✅ 深色模式适配

### 2. 富文本复制

- ✅ 一键复制 Word 友好格式
- ✅ 自动应用 Word 样式
- ✅ 支持纯文本备份
- ✅ 浏览器兼容性检测

### 3. 用户体验

- ✅ 对称双栏布局
- ✅ Apple 风格动画
- ✅ Material Design 组件
- ✅ 非侵入式通知

## 🔧 技术实现

### 转换流程

```javascript
1. Markdown输入 → 2. marked解析 → 3. HTML渲染 → 4. 样式注入 → 5. 剪贴板API
```

### 关键技术栈

- **Markdown解析**: `marked.js`
- **富文本复制**: Clipboard API + ClipboardItem
- **样式优化**: Word 专用 CSS
- **UI框架**: Vuetify 3

### Word 样式优化

```css
/* 自动应用的 Word 样式 */
body { 
  font-family: "Calibri", "Microsoft YaHei", sans-serif; 
  font-size: 11pt; 
  line-height: 1.5; 
}
h1, h2, h3 { color: #2E74B5; }
table { border-collapse: collapse; width: 100%; }
blockquote { border-left: 3px solid #ccc; }
```

## 📦 组件结构（拆分后）

```
markdown-to-word/
├── index.vue                          # 主组件（整合所有子组件）
├── composables/
│   └── useMarkdownConverter.js        # Markdown 转换逻辑 composable
├── components/
│   ├── ToolbarSection.vue             # 顶部工具栏
│   ├── EditorSection.vue              # Markdown 编辑器
│   └── PreviewSection.vue             # Word 预览区域
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
用户输入 → EditorSection → useMarkdownConverter (解析)
                                ↓
PreviewSection ← index.vue → 样式注入 → 剪贴板API
                                ↓
NotificationSnackbar（通用组件）
```

### 组件职责

| 组件                     | 职责                     | 状态                         | 事件                         |
|------------------------|------------------------|----------------------------|----------------------------|
| `useMarkdownConverter` | Markdown解析、HTML转换、复制逻辑 | markdownText, renderedHtml | -                          |
| `ToolbarSection`       | 顶部操作按钮                 | 只读                         | load-demo                  |
| `EditorSection`        | Markdown输入区域           | 受控组件                       | update:markdownText, clear |
| `PreviewSection`       | Word预览展示               | 只读                         | copy                       |
| `NotificationSnackbar` | 通知提示                   | 受控                         | update:modelValue          |

## 🔍 使用流程

### 1. 输入 Markdown

- 在左侧编辑器输入 Markdown 语法
- 支持所有标准 Markdown 语法
- 实时预览右侧效果

### 2. 查看预览

- 右侧显示 Word 样式效果
- 模拟 A4 纸张环境
- 自动处理长文本换行

### 3. 复制到 Word

- 点击"复制富文本"按钮
- 直接在 Word 中粘贴 (Ctrl+V)
- 保持完整格式和样式

## 📝 支持的 Markdown 语法

### 基础语法

- ✅ 标题 (H1-H6)
- ✅ 段落和换行
- ✅ 粗体、斜体
- ✅ 列表 (有序/无序)
- ✅ 链接和图片
- ✅ 代码块和行内代码
- ✅ 引用块
- ✅ 水平分割线

### 扩展语法 (GFM)

- ✅ 表格
- ✅ 任务列表
- ✅ 删除线
- ✅ 自动链接

## ⚠️ 限制和注意事项

### 浏览器兼容性

- ✅ **现代浏览器**: Chrome 76+, Firefox 63+, Safari 13.1+
- ❌ **旧版浏览器**: 不支持 ClipboardItem API
- ⚠️ **降级处理**: 自动回退到纯文本复制

### 复制限制

- **富文本**: 需要 ClipboardItem 支持
- **纯文本**: 所有浏览器都支持
- **权限**: 可能需要用户授权

### 样式限制

- **Word**: 样式会自动应用
- **其他编辑器**: 可能有差异
- **图片**: 需要网络图片或 Base64

## 🛠️ 开发和扩展

### 添加新功能

1. **导出功能**: 下载为 .docx 文件
2. **模板系统**: 预设文档模板
3. **自定义样式**: 用户可配置 CSS
4. **批量处理**: 多个文档转换

### 代码优化方向

- Web Worker 处理大文档
- 增量更新减少重绘
- 语法高亮增强
- 撤销/重做历史

## 🔒 隐私和安全

- ✅ **本地处理**: 所有计算在浏览器中完成
- ✅ **零上传**: 不发送数据到任何服务器
- ✅ **临时存储**: 使用内存，不持久化数据
- ✅ **剪贴板安全**: 需要用户交互触发

## 📊 性能特点

| 指标       | 性能     | 说明     |
|----------|--------|--------|
| **解析速度** | < 10ms | 小文档    |
| **复制速度** | < 50ms | 取决于浏览器 |
| **内存占用** | 低      | 纯文本处理  |
| **响应性**  | 实时     | 输入即更新  |

## 🚀 部署和使用

### 在 Web Office Toolbox 中使用

1. 启动应用: `pnpm dev`
2. 访问首页
3. 找到 "Markdown到Word" 工具
4. 输入 Markdown 并复制

### 浏览器兼容性

- ✅ Chrome 76+
- ✅ Firefox 63+
- ✅ Safari 13.1+
- ✅ Edge 79+

### 降级方案

- 不支持 ClipboardItem: 复制 HTML 代码
- 用户可手动粘贴到支持 HTML 的编辑器

## 🎨 设计特色

### 布局设计

- **对称双栏**: 编辑器与预览并排
- **响应式**: 移动端垂直布局
- **A4 模拟**: 真实的纸张预览

### 交互体验

- **实时反馈**: 输入即时预览
- **Apple 动画**: 流畅的过渡效果
- **Material 组件**: 现代化 UI

### 视觉风格

- **浅色模式**: 纯白纸张效果
- **深色模式**: 深灰纸张，护眼设计
- **高对比度**: 确保可读性

## 📊 使用场景

### ✅ 适合场景

- 周报/月报编写
- 技术文档转换
- 会议记录整理
- 学习笔记归档

### ❌ 不适合场景

- 复杂排版需求
- 需要图片上传
- 多人协作编辑

---

**开发完成时间**: 2026-01-10  
**状态**: ✅ 功能完整，可投入使用  
**架构**: ✅ 模块化，符合项目规范