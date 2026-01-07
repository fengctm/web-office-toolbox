# Web Office Toolbox - Electron 双模式部署指南

## 🎯 项目概述

本项目支持 **双模式运行**：
- **Web 模式**：浏览器运行，纯前端
- **Electron 模式**：桌面应用，系统集成

## 📋 环境要求

### Web 模式
- Node.js 16+
- 任意现代浏览器

### Electron 模式
- Node.js 16+
- 需要安装 Electron 依赖
- Windows / macOS / Linux

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装所有依赖（包括 Electron）
npm install
```

### 2. 运行模式

#### Web 模式（传统方式）
```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

#### Electron 模式（桌面应用）
```bash
# 开发模式（自动启动 Vite + Electron）
npm run electron:dev

# 构建安装包
npm run electron:build

# 仅打包（不安装）
npm run electron:pack

# 一键构建所有
npm run build:all
```

## 📁 项目结构（双模式）

```
web-office-toolbox/
├── src/                    # 前端源代码（共享）
│   ├── utils/
│   │   └── electron-utils.js  # 双模式工具库
│   └── ...                 # 其他 Vue 组件
├── electron/               # Electron 专用
│   ├── main.js            # 主进程
│   ├── preload.js         # 预加载脚本
│   └── vite.config.js     # Electron 构建配置
├── dist/                   # Web 构建输出
├── dist-electron/          # Electron 主进程构建
├── release/                # 最终安装包
└── package.json           # 双模式配置
```

## 🎨 双模式特性对比

| 特性 | Web 模式 | Electron 模式 |
|------|----------|---------------|
| **文件对话框** | 浏览器选择器 | 系统原生对话框 |
| **文件读写** | 浏览器下载 | 直接访问磁盘 |
| **运行环境** | 浏览器 | 桌面应用 |
| **安装方式** | 访问 URL | 安装程序 |
| **离线支持** | 需要网络 | 完全离线 |
| **系统集成** | 无 | 托盘、快捷键等 |

## 🔧 核心功能（自动适配）

### 1. 文件操作
```javascript
import { showOpenFileDialog, readFileContent, saveFileContent } from '@/utils/electron-utils';

// 自动适配双模式
const result = await showOpenFileDialog({
  filters: [{ name: 'PDF', extensions: ['pdf'] }]
});

if (!result.canceled) {
  const content = await readFileContent(result.filePaths[0]);
  // 处理文件...
}
```

### 2. 环境检测
```javascript
import { isElectron, getRuntimeMode } from '@/utils/electron-utils';

if (isElectron()) {
  console.log('运行在 Electron 中');
} else {
  console.log('运行在浏览器中');
}

const mode = getRuntimeMode(); // 'electron' 或 'web'
```

### 3. 窗口控制（仅 Electron）
```javascript
import { minimizeWindow, closeWindow } from '@/utils/electron-utils';

// 在 Electron 中有效，在 Web 中无副作用
minimizeWindow();
```

## 🛠️ 开发指南

### 添加新工具（无需修改）

现有工具**无需任何修改**即可在双模式下运行：
- ✅ PDF 工具
- ✅ 图片处理
- ✅ 文件压缩
- ✅ Markdown 转换

### 增强工具功能（可选）

如果需要针对 Electron 优化：

```javascript
// 在工具组件中
import { isElectron, getRuntimeMode } from '@/utils/electron-utils';

export default {
  setup() {
    const mode = computed(() => getRuntimeMode());
    
    // 根据模式调整行为
    const handleExport = async () => {
      if (isElectron()) {
        // Electron：直接保存到磁盘
        await saveFileContent(filePath, content);
      } else {
        // Web：触发下载
        downloadFile(content, 'output.pdf');
      }
    };
    
    return { mode, handleExport };
  }
};
```

## 📦 构建输出

### Web 模式
- **输出目录**：`dist/`
- **部署方式**：静态服务器、CDN、GitHub Pages
- **文件**：HTML、CSS、JS、资源文件

### Electron 模式
- **输出目录**：`release/`
- **Windows**：`.exe`, `.msi`
- **macOS**：`.dmg`, `.app`
- **Linux**：`.AppImage`, `.deb`

## 🔒 安全考虑

### Web 模式
- ✅ 沙箱环境
- ✅ 无系统访问权限
- ✅ 用户手动选择文件

### Electron 模式
- ✅ 上下文隔离
- ✅ 预加载脚本安全
- ⚠️ 需要用户确认文件操作

## 🎯 使用场景建议

### 选择 Web 模式
- 快速原型验证
- 无需安装
- 跨平台共享
- 内部工具部署

### 选择 Electron 模式
- 离线使用
- 频繁文件操作
- 系统集成需求
- 桌面应用体验

## 🔍 故障排除

### Electron 构建失败
```bash
# 1. 清理缓存
rm -rf dist/ dist-electron/ node_modules/.vite/

# 2. 重新安装
npm install

# 3. 重新构建
npm run electron:build
```

### 开发模式无法启动
```bash
# 检查端口占用
lsof -i :5173

# 手动启动 Vite
npm run dev

# 然后在另一个终端
electron .
```

### Windows 构建问题
```bash
# 需要安装 Windows Build Tools
npm install --global windows-build-tools

# 或者使用管理员权限运行
npm run electron:build
```

## 📞 获取帮助

如果遇到问题：
1. 检查控制台错误信息
2. 确认依赖安装完整
3. 查看 Electron 官方文档
4. 提交 Issue

## 🎉 总结

**双模式优势**：
- ✅ 灵活性：根据需求选择运行方式
- ✅ 一致性：同一套代码，两种体验
- ✅ 可扩展：轻松添加新工具
- ✅ 用户友好：降低使用门槛

**推荐开发流程**：
1. 使用 Web 模式快速开发和测试
2. 功能完善后构建 Electron 应用
3. 根据用户反馈选择部署方式

开始使用：`npm run electron:dev` 🚀
