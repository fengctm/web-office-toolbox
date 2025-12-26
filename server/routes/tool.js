import express from 'express'
const router = express.Router()

let toolRegistry

router.get('/', async (req, res) => {
  if (!toolRegistry) {
    toolRegistry = (await import('../services/toolRegistry.js')).default
  }
  const tools = toolRegistry.getTools()
  res.json(tools)
})

router.get('/:code', async (req, res) => {
  if (!toolRegistry) {
    toolRegistry = (await import('../services/toolRegistry.js')).default
  }
  const tool = toolRegistry.getTool(req.params.code)
  if (tool) {
    res.json(tool)
  } else {
    res.status(404).json({ error: 'Tool not found' })
  }
})

// 动态加载工具路由
router.use('/:toolCode', async (req, res, next) => {
  const { toolCode } = req.params
  
  try {
    // 尝试加载工具模块
    const toolModule = await import(`../tools/${toolCode}/index.js`)
    const tool = toolModule.default
    
    // 将工具路由挂载到 /api/tools/:toolCode
    if (tool.routes) {
      // 移除工具代码前缀，因为路由已经挂载到 /api/tools/:toolCode
      const toolRouter = express.Router()
      toolRouter.use('/', tool.routes)
      return toolRouter(req, res, next)
    }
    
    next()
  } catch (error) {
    // 如果工具不存在，继续执行
    console.log(`Tool ${toolCode} routes not found:`, error.message)
    next()
  }
})

export default router
