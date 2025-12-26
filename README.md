# Web Office Toolbox

一个基于 Vue 3 + Vuetify + Node.js 构建的现代化 Web 办公工具箱。

## 项目特性

### 🏗️ 架构设计
- **前后端一体**：Node.js + Vue 3 单页应用
- **工具模块化**：每个工具独立解耦，支持热插拔
- **自动注册**：后端自动扫描工具目录，无需手动配置
- **低耦合扩展**：新增工具无需修改核心代码

### 🎨 界面设计
- **Material Design**：基于 Vuetify 3 组件库
- **Teal 主题**：Google 风格，专业克制
- **流畅动画**：细腻的过渡效果和交互反馈
- **响应式布局**：完美适配移动端和桌面端

### 🔧 技术栈
- **前端**：Vue 3 + Vuetify 3 + TypeScript
- **后端**：Node.js + Express + SQLite
- **通信**：HTTP + JSON
- **状态管理**：Composition API

## 项目结构

```
WebOfficeToolbox/
├── src/                    # 前端代码
│   ├── app/
│   │   └── App.vue        # 根组件
│   ├── pages/
│   │   ├── Home.vue       # 首页（工具展示）
│   │   └── ToolContainer.vue  # 工具容器
│   ├── components/
│   │   ├── ToolCard.vue   # 工具卡片
│   │   ├── ToolGrid.vue   # 工具网格
│   │   ├── PageTransition.vue  # 页面过渡
│   │   └── UserAvatar.vue # 用户头像
│   ├── tools/             # 工具模块目录
│   │   └── README.md      # 工具开发文档
│   ├── services/
│   │   └── api.ts         # API 服务
│   ├── router.ts          # 路由配置
│   └── main.js            # 入口文件
│
├── server/                # 后端代码
│   ├── app.js             # Express 应用
│   ├── routes/
│   │   ├── tool.js        # 工具路由
│   │   └── upload.js      # 上传路由
│   ├── services/
│   │   └── toolRegistry.js  # 工具注册器
│   └── tools/             # 工具实现目录
│       ├── tool-pdf/
│       │   └── config.json
│       ├── tool-image/
│       │   └── config.json
│       └── tool-excel/
│           └── config.json
│
├── public/                # 静态资源
├── package.json           # 项目配置
└── vite.config.js         # Vite 配置
```

## 快速开始

### 环境要求
- Node.js 16+
- npm 或 pnpm

### 安装依赖
```bash
# 前端依赖
npm install

# 后端依赖（进入 server 目录）
cd server
# 注意：后端依赖已在根目录安装
```

### 启动服务
```bash
# 启动后端（端口 3000）
cd server
node app.js

# 启动前端（端口 5173）
npm run dev
```

### 访问应用
- 前端：http://localhost:5173
- 后端 API：http://localhost:3000/api

## 核心功能

### 工具展示
- **首页工具网格**：居中展示所有可用工具
- **工具卡片**：图标、名称、描述、悬停动画
- **点击交互**：点击卡片进入工具详情页

### 工具详情
- **页面过渡**：流畅的 slide 动画
- **返回功能**：一键返回首页
- **状态管理**：加载中、未找到、正常状态
- **工具信息**：显示工具名称、图标、描述

### 工具扩展
1. **后端配置**：在 `server/tools/` 创建工具目录 + `config.json`
2. **前端组件**：在 `src/tools/` 创建对应目录 + 组件
3. **自动注册**：重启后端服务自动扫描
4. **无需修改**：不影响现有代码

## 设计原则

### 架构原则
- ✅ 工具之间完全解耦
- ✅ 每个工具独立模块
- ✅ 新增工具不影响现有工具
- ✅ 工具支持注册/注销/显示控制

### 技术原则
- ✅ 前后端统一 JSON 通信
- ✅ Node + Vue 前后端一体
- ✅ SQLite 存储工具配置
- ✅ 不考虑性能极限
- ✅ 不考虑安全/权限（内网应用）

## 开发指南

### 添加新工具
1. **后端配置**：
   ```bash
   mkdir server/tools/tool-new
   echo '{"name":"新工具","description":"工具描述","icon":"mdi-new","enabled":true}' > server/tools/tool-new/config.json
   ```

2. **前端组件**：
   ```bash
   mkdir src/tools/tool-new
   # 创建 index.vue 和 config.json
   ```

3. **重启服务**：
   ```bash
   # 后端会自动扫描新工具
   ```

### 工具配置格式
```json
{
  "name": "工具名称",
  "description": "工具描述",
  "icon": "mdi-xxx",
  "enabled": true
}
```

### API 接口
- `GET /api/tools` - 获取所有工具列表
- `GET /api/tools/:code` - 获取指定工具详情

## 主题与视觉

### 颜色系统
- **主色调**：Teal (#009688)
- **辅助色**：Teal Dark (#00796b)
- **强调动画**：Ripple、Hover、Scale

### 动画效果
- **页面切换**：Slide + Fade
- **卡片悬停**：上浮 + 阴影 + 图标脉冲
- **按钮交互**：Ripple + 位移
- **图标动画**：Float 呼吸效果

### 响应式设计
- **移动端**：单列布局，紧凑间距
- **平板**：双列布局
- **桌面**：三列布局

## 验收标准

✅ **已完成**：
- [x] 首页工具卡片居中展示
- [x] Vuetify + teal 主题生效
- [x] 动画流畅、统一
- [x] 工具模块结构清晰
- [x] 新增工具无需修改核心代码

✅ **架构优势**：
- 模块化设计，易于维护
- 自动注册机制，扩展性强
- 统一的组件规范
- 完整的开发文档

## 下一步扩展

### 可扩展方向
1. **具体工具实现**：PDF 转换、图片处理、Excel 操作
2. **工具级子页面**：每个工具独立的 UI 界面
3. **文件处理流水线**：上传 → 处理 → 下载
4. **AI 工具集成**：调用 AI API 进行智能处理
5. **批量处理**：支持多文件同时处理
6. **历史记录**：记录用户操作历史

### 技术优化
1. **性能优化**：懒加载、缓存策略
2. **错误处理**：完善的异常捕获和用户提示
3. **状态管理**：Pinia 集中状态管理
4. **测试覆盖**：单元测试、E2E 测试
5. **部署优化**：Docker 容器化部署

## 许可证

MIT License

## 贡献指南

欢迎提交 Issue 和 Pull Request！

---

**项目状态**：✅ 架构完成，可直接扩展开发具体工具功能
