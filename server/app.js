import express from 'express'
import path from 'path'
import fs from 'fs'
import cors from 'cors'

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

// 静态文件服务 - 提供下载文件
const downloadsDir = path.join(process.cwd(), 'downloads')
app.use('/downloads', express.static(downloadsDir))

// 确保下载目录存在
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, {recursive: true})
}

// 动态加载工具路由
async function loadToolRoutes() {
    try {
        const toolRoutes = (await import('./routes/tool.js')).default
        app.use('/api/tools', toolRoutes)
        console.log('✓ Tool routes loaded')
    } catch (error) {
        console.error('Failed to load tool routes:', error.message)
    }

    try {
        const uploadRoutes = (await import('./routes/upload.js')).default
        app.use('/api/upload', uploadRoutes)
        console.log('✓ Upload routes loaded')
    } catch (error) {
        console.error('Failed to load upload routes:', error.message)
    }
}

// 初始化工具注册器
async function initializeRegistry() {
    try {
        const toolRegistry = (await import('./services/toolRegistry.js')).default
        console.log('✓ Tool registry initialized')
        const tools = toolRegistry.getTools()
        console.log(`✓ Found ${tools.length} tools:`, tools.map(t => t.name))
    } catch (error) {
        console.error('Failed to initialize tool registry:', error.message)
    }
}

// 启动服务器
async function startServer() {
    try {
        await loadToolRoutes()
        await initializeRegistry()

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`)
            console.log(`📁 Downloads directory: ${downloadsDir}`)
        })
    } catch (error) {
        console.error('Failed to start server:', error)
        process.exit(1)
    }
}

try {
    // 启动
    startServer()
} catch (e) {
    console.log(e)
}

export default app
