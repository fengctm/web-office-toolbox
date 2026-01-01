# 图片转PDF模块部署指南

## 📋 部署前检查清单

### 环境要求
- [ ] Node.js 16+
- [ ] 现代浏览器（Chrome 80+, Firefox 75+, Edge 80+, Safari 14+）
- [ ] 至少 4GB 内存（处理大文件时）
- [ ] 稳定的网络连接（用于加载 CDN 资源）

### 依赖确认
```bash
# 检查 package.json 是否包含
"dependencies": {
  "pdf-lib": "^1.17.1",
  "vue": "^3.5.24",
  "vuetify": "^3.11.0-beta.1"
}
```

## 🚀 部署步骤

### 步骤1：安装依赖
```bash
# 在项目根目录运行
npm install

# 或使用 yarn
yarn install
```

### 步骤2：验证文件结构
确保以下文件存在且路径正确：

```
项目根目录/
├── public/
│   └── workers/
│       └── pdf-generator.js          ✅ Web Worker 文件
└── src/
    └── tools/
        └── image-to-pdf/
            ├── components/
            │   ├── MainContainer.vue ✅ 主组件
            │   ├── FileUpload.vue    ✅ 上传组件
            │   ├── ImageList.vue     ✅ 列表组件
            │   ├── PreviewExport.vue ✅ 预览组件
            │   ├── ExportProgressModal.vue ✅ 进度组件
            │   └── PerformanceMonitor.vue ✅ 监控组件
            ├── utils/
            │   └── worker-manager.js ✅ Worker 管理器
            └── workers/
                └── pdf-generator.js  ✅ Worker 逻辑
```

### 步骤3：验证工具配置
检查 `src/config/tools-config.js`：

```javascript
{
  code: 'image-to-pdf',
  name: '图片转PDF',
  icon: 'mdi-image',
  description: '将图片转换为PDF文件',
  enabled: true,
  category: 'PDF工具',
  tags: ['图片', 'PDF', '转换'],
  component: () => import('../tools/image-to-pdf/index.vue')
}
```

### 步骤4：启动开发服务器
```bash
npm run dev
```

访问 `http://localhost:5173` 并验证：
1. 首页显示"图片转PDF"工具
2. 点击工具能正常打开
3. 界面渲染正常，无控制台错误

## 🔧 配置优化

### Web Worker 路径配置
如果部署到子路径，需要调整 Worker URL：

```javascript
// src/tools/image-to-pdf/utils/worker-manager.js

// 当前实现（适用于根路径）
const workerUrl = '/workers/pdf-generator.js'

// 如果部署到子路径（如 /app/）
const basePath = import.meta.env.BASE_URL
const workerUrl = `${basePath}workers/pdf-generator.js`
```

### CDN 资源配置
pdf-lib 通过 CDN 加载，确保网络可访问：

```javascript
// public/workers/pdf-generator.js
const response = await fetch('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js')
```

如果需要使用私有 CDN，修改为：
```javascript
const response = await fetch('https://your-cdn.com/libs/pdf-lib@1.17.1/dist/pdf-lib.min.js')
```

## 🎯 功能验证

### 测试1：基础功能
1. ✅ 选择图片（支持多选）
2. ✅ 拖拽上传
3. ✅ 图片预览显示
4. ✅ 图片排序和移动
5. ✅ 删除图片

### 测试2：导出功能
1. ✅ 配置文件名和页面尺寸
2. ✅ 点击导出按钮
3. ✅ 进度条正常更新
4. ✅ 性能指标显示
5. ✅ PDF 文件正确下载

### 测试3：取消功能
1. ✅ 导出过程中点击取消
2. ✅ 状态正确恢复
3. ✅ 资源正确清理

### 测试4：错误处理
1. ✅ 选择非图片文件
2. ✅ 选择超大文件
3. ✅ 空文件导出
4. ✅ 查看错误提示

### 测试5：性能测试
1. ✅ 10张图片导出（< 5秒）
2. ✅ 50张图片导出（< 20秒）
3. ✅ 导出过程中UI保持响应
4. ✅ 内存使用不持续增长

## 📊 性能基准测试

### 测试环境
- 浏览器：Chrome 120
- 内存：16GB
- CPU：8核
- 图片：平均 2MB/张

### 预期结果
| 图片数量 | 导出时间 | 内存峰值 | UI响应 |
|---------|---------|---------|--------|
| 5张 | 1-2秒 | < 50MB | ✅ 流畅 |
| 10张 | 2-4秒 | < 80MB | ✅ 流畅 |
| 20张 | 5-8秒 | < 120MB | ✅ 流畅 |
| 50张 | 12-18秒 | < 200MB | ✅ 流畅 |

如果性能不达标，检查：
1. 图片是否过大（建议 < 5MB/张）
2. 浏览器是否为最新版本
3. 是否有其他资源占用内存

## 🐛 故障排除

### 问题1：Worker 加载失败
**现象**: 点击导出无反应，控制台报错

**排查**:
```bash
# 检查 Worker 文件是否存在
ls public/workers/pdf-generator.js

# 检查文件权限
chmod 644 public/workers/pdf-generator.js
```

**解决**: 确保 Worker 文件在正确位置且可访问

### 问题2：PDF 生成失败
**现象**: 进度条到100%后无下载

**排查**:
1. 检查浏览器控制台错误
2. 验证 pdf-lib 是否正确加载
3. 检查图片格式是否支持

**解决**: 清除浏览器缓存，重新加载页面

### 问题3：内存溢出
**现象**: 浏览器崩溃或卡死

**解决**:
1. 减少单次导出数量（< 30张）
2. 关闭其他标签页
3. 使用压缩后的图片
4. 升级浏览器版本

### 问题4：导出速度慢
**现象**: 进度条长时间不动

**排查**:
1. 检查图片大小
2. 检查网络连接（CDN资源）
3. 检查浏览器性能

**解决**: 
- 使用 Chrome/Edge 浏览器
- 压缩图片后再上传
- 确保网络连接正常

## 📈 监控和维护

### 性能监控
模块内置性能监控，可实时查看：
- 内存使用情况
- FPS（帧率）
- 处理速度
- 预计剩余时间

### 日志收集
建议添加错误上报：

```javascript
// 在 worker-manager.js 的 onError 中
onError((errorMessage, error) => {
  console.error('导出失败:', error)
  
  // 上报到监控平台
  if (window.Sentry) {
    Sentry.captureException(error)
  }
  
  showSnackbar('导出失败: ' + errorMessage, 'error')
})
```

### 用户反馈
建议收集：
- 导出成功率
- 平均导出时间
- 失败原因统计
- 用户设备信息

## 🔄 升级和更新

### 更新 Worker 代码
```bash
# 修改 public/workers/pdf-generator.js 后
# 无需重启服务，浏览器会自动重新加载
# 用户需要刷新页面以获取新版本
```

### 更新组件代码
```bash
# 修改组件后，Vite 会热重载
# 立即生效，无需刷新
```

### 版本管理
建议在工具配置中添加版本号：

```javascript
{
  code: 'image-to-pdf',
  version: '2.0.0',  // 新增版本号
  // ... 其他配置
}
```

## 🎓 最佳实践

### 用户引导
1. **首次使用**: 显示操作提示
2. **大文件处理**: 提示分批处理
3. **性能建议**: 显示最佳实践

### 错误提示
1. **清晰明确**: 说明具体错误
2. **提供解决方案**: 告诉用户如何解决
3. **友好语气**: 避免技术术语

### 性能优化
1. **图片预处理**: 压缩到合适尺寸
2. **分批处理**: 大文件分多次导出
3. **浏览器选择**: 推荐 Chrome/Edge

## 📞 技术支持

如果遇到问题，请提供：
1. 浏览器类型和版本
2. 操作系统
3. 图片数量和大小
4. 错误截图或日志
5. 复现步骤

---

**部署完成！** 模块已优化为高性能异步处理，支持大文件导出，用户体验大幅提升。
