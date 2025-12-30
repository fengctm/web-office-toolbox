// 工具配置系统
// 每个工具的配置格式：
// {
//   code: '工具代码',
//   name: '工具名称',
//   icon: 'Vuetify图标',
//   description: '工具描述',
//   enabled: true,  // 是否启用
//   component: () => import('工具组件路径')
// }

export const toolsConfig = [
  {
    code: 'example-counter',
    name: '示例计数器',
    icon: 'mdi-counter',
    description: '这是一个示例计数器工具，用于演示工具箱的基本功能',
    enabled: true,
    component: () => import('../tools/example-counter/index.vue')
  }
]

// 工具注册器
export const toolRegistry = {
  // 获取所有启用的工具
  getEnabledTools() {
    return toolsConfig.filter(tool => tool.enabled)
  },
  
  // 根据代码获取工具
  getToolByCode(code) {
    return toolsConfig.find(tool => tool.code === code && tool.enabled)
  },
  
  // 添加新工具（动态注册）
  registerTool(toolConfig) {
    if (!toolConfig.code || !toolConfig.name || !toolConfig.component) {
      console.error('工具配置缺少必要字段', toolConfig)
      return false
    }
    
    // 检查是否已存在
    const exists = toolsConfig.find(t => t.code === toolConfig.code)
    if (exists) {
      console.warn(`工具 ${toolConfig.code} 已存在，将被覆盖`)
      const index = toolsConfig.findIndex(t => t.code === toolConfig.code)
      toolsConfig[index] = { ...toolConfig, enabled: toolConfig.enabled !== false }
    } else {
      toolsConfig.push({ ...toolConfig, enabled: toolConfig.enabled !== false })
    }
    
    return true
  },
  
  // 启用/禁用工具
  toggleTool(code, enabled) {
    const tool = toolsConfig.find(t => t.code === code)
    if (tool) {
      tool.enabled = enabled
      return true
    }
    return false
  }
}

export default toolsConfig
