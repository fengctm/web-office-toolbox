# 创建新工具完整指南

## 📋 工具创建流程总结

基于对现有代码的分析，创建新工具需要以下步骤：

### 1. 创建工具目录和文件

```bash
# 在 src/tools/ 目录下创建工具文件夹
mkdir src/tools/你的工具代码/

# 创建主组件文件
touch src/tools/你的工具代码/index.vue
```

### 2. 编写工具组件

创建 `index.vue` 文件，遵循以下结构：

```vue

<template>
  <v-card class="your-tool" elevation="2">
    <v-card-item>
      <v-card-title class="d-flex align-center">
        <v-icon color="teal" class="mr-2">mdi-图标名称</v-icon>
        工具名称
      </v-card-title>
      <v-card-subtitle>
        工具描述
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <!-- 工具的主要功能区域 -->
      <!-- 输入框、按钮、输出区域等 -->

      <!-- 状态提示 -->
      <v-alert
          v-if="message"
          :type="messageType"
          :text="message"
          density="compact"
          class="mt-3"
      />
    </v-card-text>
  </v-card>
</template>

<script setup>
  import {ref} from 'vue'

  // 1. 响应式状态
  const input = ref('')
  const output = ref('')
  const message = ref('')
  const messageType = ref('info')

  // 2. 显示消息函数
  const showMessage = (text, type = 'info') => {
    message.value = text
    messageType.value = type
    setTimeout(() => {
      message.value = ''
    }, 3000)
  }

  // 3. 核心功能函数
  const handleAction = () => {
    if (!input.value) {
      showMessage('请输入内容', 'warning')
      return
    }

    try {
      // 实现你的逻辑
      output.value = process(input.value)
      showMessage('操作成功', 'success')
    } catch (error) {
      showMessage('操作失败: ' + error.message, 'error')
    }
  }

  // 4. 辅助函数
  const clearAll = () => {
    input.value = ''
    output.value = ''
    showMessage('已清空', 'info')
  }

  const copyResult = async () => {
    if (!output.value) {
      showMessage('没有可复制的内容', 'warning')
      return
    }

    try {
      await navigator.clipboard.writeText(output.value)
      showMessage('已复制到剪贴板', 'success')
    } catch (error) {
      showMessage('复制失败', 'error')
    }
  }

  // 5. 处理函数（占位）
  const process = (value) => {
    // TODO: 实现实际的处理逻辑
    return value
  }
</script>

<style scoped>
  .your-tool {
    border-radius: 12px;
    overflow: hidden;
  }

  /* 响应式调整 */
  @media (max-width: 600px) {
    /* 移动端优化 */
  }
</style>
```

### 3. 注册工具到配置

编辑 `src/config/tools-config.js`，在 `toolsConfig` 数组中添加：

```javascript
{
    code: '你的工具代码',        // 唯一标识符，小写英文，用连字符连接
        name
:
    '工具名称',            // 显示名称
        icon
:
    'mdi-图标名称',        // Vuetify图标
        description
:
    '详细描述',     // 工具功能描述
        enabled
:
    true,              // 是否启用
        category
:
    '分类名称',       // 可选：分类
        tags
:
    ['标签1', '标签2'],   // 可选：标签
        component
:
    () => import('../tools/你的工具代码/index.vue')
}
```

## 📁 现有工具结构参考

### 简单工具（示例计数器）

```
src/tools/example-counter/
└── index.vue          # 单文件组件
```

### 复杂工具（PDF转图片）

```
src/tools/pdf-to-image/
├── index.vue          # 入口文件（导入MainContainer）
├── components/        # 组件目录
│   ├── FileUpload.vue
│   ├── PreviewGrid.vue
│   ├── PreviewModal.vue
│   ├── ExportPanel.vue
│   ├── TipsSection.vue
│   ├── ExportProgressModal.vue
│   ├── NotificationSnackbar.vue
│   └── MainContainer.vue
├── README.md
└── COMPONENT_STRUCTURE.md
```

## 🎯 工具设计最佳实践

### UI设计规范

- **主色调**：Teal (#009688)
- **卡片圆角**：12px
- **按钮样式**：使用 `variant="tonal"`
- **输入框**：使用 `variant="outlined"`
- **间距**：使用 Vuetify 的间距类（mb-4, mt-3 等）

### 状态管理

```javascript
// 使用 ref 管理状态
const input = ref('')
const output = ref('')
const loading = ref(false)
const message = ref('')
const messageType = ref('info')

// 消息显示（3秒自动消失）
const showMessage = (text, type = 'info') => {
    message.value = text
    messageType.value = type
    setTimeout(() => {
        message.value = ''
    }, 3000)
}
```

### 错误处理

```javascript
try {
    // 可能出错的代码
    result = process(input)
} catch (error) {
    showMessage('错误: ' + error.message, 'error')
}
```

### 用户反馈

```javascript
// 成功
showMessage('操作成功', 'success')

// 警告
showMessage('请输入内容', 'warning')

// 错误
showMessage('操作失败', 'error')

// 信息
showMessage('操作完成', 'info')
```

### 复制功能

```javascript
const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text)
        showMessage('已复制到剪贴板', 'success')
    } catch (error) {
        showMessage('复制失败', 'error')
    }
}
```

### 清空功能

```javascript
const clearAll = () => {
    input.value = ''
    output.value = ''
    showMessage('已清空', 'info')
}
```

## 🔧 工具类型示例

### 1. 文本处理工具

- 输入：文本区域
- 功能：格式化、转换、清理
- 输出：文本区域
- 按钮：格式化、清空、复制

### 2. 数据转换工具

- 输入：文本/数字/JSON
- 功能：格式转换
- 输出：转换后的数据
- 按钮：转换、验证、清空、复制

### 3. 时间日期工具

- 输入：时间戳/日期字符串
- 功能：格式转换、时区处理
- 输出：转换结果
- 按钮：转换、当前时间、清空、复制

### 4. 颜色工具

- 输入：颜色值（HEX/RGB/HSL）
- 功能：格式转换、预览
- 输出：所有格式的颜色值
- 按钮：转换、清空、复制

## 📦 新增工具清单

### 已创建的空壳工具

1. ✅ **文本格式化器** (`text-formatter`)
    - 功能：文本清理、格式转换
    - 状态：基础框架完成

2. ✅ **JSON格式化器** (`json-formatter`)
    - 功能：JSON格式化、验证
    - 状态：基础框架完成

3. ✅ **时间戳转换器** (`timestamp-converter`)
    - 功能：时间戳 ↔ 日期时间转换
    - 状态：基础框架完成

4. ✅ **颜色转换器** (`color-converter`)
    - 功能：HEX/RGB/HSL相互转换
    - 状态：基础框架完成

### 待添加功能

- [ ] 在工具中添加实际的处理逻辑
- [ ] 添加更多输入验证
- [ ] 优化移动端体验
- [ ] 添加深色模式适配测试
- [ ] 添加单元测试

## 🚀 下一步工作

### 完善现有工具

1. **文本格式化器**
    - 添加大小写转换
    - 添加去除空格功能
    - 添加正则替换

2. **JSON格式化器**
    - 添加JSON压缩功能
    - 添加语法高亮
    - 添加数据校验

3. **时间戳转换器**
    - 添加更多时区支持
    - 添加时间计算功能
    - 添加相对时间显示

4. **颜色转换器**
    - 添加颜色选择器
    - 添加调色板功能
    - 添加颜色对比度检查

### 创建新工具建议

- **CSV转换器**：CSV ↔ JSON转换
- **正则测试器**：正则表达式测试工具
- **编码解码器**：Base64、URL编码等
- **哈希计算器**：MD5、SHA等哈希计算
- **单位转换器**：长度、重量、温度等
- **二维码生成器**：文本生成二维码

## 💡 开发提示

### 快速测试

```bash
# 启动开发服务器
pnpm dev

# 访问 http://localhost:5173 查看效果
```

### 调试技巧

```javascript
// 在组件中添加调试信息
console.log('Input:', input.value)
console.log('Output:', output.value)

// 使用 Vue DevTools 查看组件状态
```

### 性能优化

- 大量数据使用虚拟滚动
- 复杂计算使用防抖/节流
- 大文件处理使用 Web Worker

### 代码复用

- 将通用逻辑提取到 `utils.js`
- 将复杂组件拆分为子组件
- 共享样式提取到公共文件

---

## 📚 参考资源

- [Vue 3 Composition API](https://vuejs.org/)
- [Vuetify 3 Components](https://vuetifyjs.com/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

**记住：保持简单，专注功能，用户体验第一！**
