import fs from 'fs'
import path from 'path'

class ToolRegistry {
  constructor() {
    this.tools = []
    this.toolsDir = path.join(import.meta.dirname, '../tools')
    this.init()
  }

  init() {
    this.scanTools()
    this.setupDatabase()
  }

  scanTools() {
    if (!fs.existsSync(this.toolsDir)) {
      fs.mkdirSync(this.toolsDir, { recursive: true })
      return
    }

    const toolDirs = fs.readdirSync(this.toolsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    for (const toolDir of toolDirs) {
      const toolPath = path.join(this.toolsDir, toolDir)
      const configPath = path.join(toolPath, 'config.json')
      
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
          this.tools.push({
            code: toolDir.replace('tool-', ''),
            name: config.name,
            description: config.description,
            icon: config.icon,
            enabled: config.enabled !== false
          })
        } catch (error) {
          console.error(`Failed to read config for ${toolDir}:`, error.message)
        }
      }
    }
  }

  setupDatabase() {
    // Database setup skipped for now due to sqlite3 installation issues
    // Will use in-memory storage for demo purposes
  }

  getTools() {
    return this.tools.filter(tool => tool.enabled)
  }

  getTool(code) {
    return this.tools.find(tool => tool.code === code && tool.enabled)
  }
}

export default new ToolRegistry()