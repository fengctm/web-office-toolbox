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
    // PDF 工具系列
    {
        code: 'pdf-to-image',
        name: 'PDF转图片',
        icon: 'mdi-file-pdf-box',
        description: '将PDF文件转换为高质量图片，支持JPG/PNG/WEBP格式，本地处理保护隐私',
        enabled: true,
        category: 'PDF工具',
        tags: ['PDF', '图片', '转换', '本地处理'],
        component: () => import('../tools/pdf-to-image/index.vue')
    },
    {
        code: 'image-to-pdf',
        name: '图片转PDF',
        icon: 'mdi-image',
        description: '将图片转换为PDF文件',
        enabled: true,
        category: 'PDF工具',
        tags: ['图片', 'PDF', '转换'],
        component: () => import('../tools/image-to-pdf/index.vue')
    },
    {
        code: 'pdf-watermark',
        name: 'PDF添加水印',
        icon: 'mdi-watermark',
        description: '为PDF文件添加水印',
        enabled: true,
        category: 'PDF工具',
        tags: ['PDF', '水印', '添加'],
        component: () => import('../tools/pdf-watermark/index.vue')
    },
    {
        code: 'pdf-compress',
        name: 'PDF压缩',
        icon: 'mdi-zip-box',
        description: '压缩PDF文件大小',
        enabled: true,
        category: 'PDF工具',
        tags: ['PDF', '压缩', '优化'],
        component: () => import('../tools/pdf-compress/index.vue')
    },
    {
        code: 'pdf-merge',
        name: 'PDF智能组装台',
        icon: 'mdi-call-merge',
        description: '在PDF中插入页面或合并多个PDF文件',
        enabled: true,
        category: 'PDF工具',
        tags: ['PDF', '插入', '拼接', '合并'],
        component: () => import('../tools/pdf-merge/index.vue')
    },
    // 其他工具
    {
        code: 'markdown-to-word',
        name: 'Markdown转Word',
        icon: 'mdi-language-markdown',
        description: '将Markdown转换为Word格式富文本，支持实时预览和一键复制，可直接粘贴到Word保持格式',
        enabled: true,
        category: '文档处理',
        tags: ['Markdown', 'Word', '富文本', '实时预览', '复制'],
        component: () => import('../tools/markdown-to-word/index.vue')
    },
    {
        code: 'svg-to-image',
        name: 'SVG转图片',
        icon: 'mdi-svg',
        description: '将SVG转换为图片格式',
        enabled: true,
        category: '图片处理',
        tags: ['SVG', '图片', '转换'],
        component: () => import('../tools/svg-to-image/index.vue')
    },
    {
        code: 'lan-transfer',
        name: '局域网互传',
        icon: 'mdi-network',
        description: '局域网内文件传输',
        enabled: true,
        category: '文件传输',
        tags: ['局域网', '传输', '文件'],
        component: () => import('../tools/lan-transfer/index.vue')
    },
    {
        code: 'image-split',
        name: '图片分割',
        icon: 'mdi-image-filter-hdr',
        description: '将图片按指定规则分割成多个小图',
        enabled: true,
        category: '图片处理',
        tags: ['图片', '分割', '切割'],
        component: () => import('../tools/image-split/index.vue')
    },
    {
        code: 'score-calculator',
        name: '分数计算',
        icon: 'mdi-calculator',
        description: '支持分数运算、转换和化简',
        enabled: true,
        category: '数学计算',
        tags: ['分数', '计算', '数学'],
        component: () => import('../tools/score-calculator/index.vue')
    },
    {
        code: 'ai-prompt-generator',
        name: 'AI提示词生成器',
        icon: 'mdi-robot',
        description: '帮助生成高质量的AI提示词',
        enabled: true,
        category: 'AI工具',
        tags: ['AI', '提示词', '生成'],
        component: () => import('../tools/ai-prompt-generator/index.vue')
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
            toolsConfig[index] = {...toolConfig, enabled: toolConfig.enabled !== false}
        } else {
            toolsConfig.push({...toolConfig, enabled: toolConfig.enabled !== false})
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
