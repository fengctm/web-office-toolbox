# 工具模块目录

这个目录用于存放所有独立的工具模块。

## 目录结构

```
src/tools/
├── tool-pdf/          # PDF 工具
│   ├── index.vue     # 工具主组件
│   └── config.json   # 工具配置
├── tool-image/       # 图像工具
│   ├── index.vue
│   └── config.json
└── tool-excel/       # Excel 工具
    ├── index.vue
    └── config.json
```

## 工具配置规范

每个工具需要包含 `config.json` 文件：

```json
{
  "name": "工具名称",
  "description": "工具描述",
  "icon": "mdi-xxx",
  "enabled": true
}
```

## 工具开发规范

1. **独立性**：每个工具相互独立，不依赖其他工具
2. **命名规范**：目录名以 `tool-` 开头，如 `tool-pdf`
3. **组件规范**：使用 Vue 3 + Composition API
4. **样式规范**：遵循 Vuetify 设计系统
5. **通信规范**：通过 API 与后端通信

## 添加新工具步骤

1. 在 `server/tools/` 创建工具目录
2. 添加 `config.json` 配置文件
3. 在 `src/tools/` 创建对应目录
4. 开工具组件和逻辑
5. 重启后端服务（自动扫描）

## 示例工具

当前已包含：
- PDF 工具 (tool-pdf)
- 图像工具 (tool-image)
- Excel 工具 (tool-excel)

这些工具仅作为架构演示，具体功能待实现。
