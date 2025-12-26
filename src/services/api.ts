import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api'

export const api = {
  getTools: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tools`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch tools:', error)
      // 返回默认工具列表作为降级方案 - 只保留图片转PDF工具
      return [
        {
          code: 'image-to-pdf',
          name: '图片转换PDF',
          description: '将多张图片按顺序合并为 PDF 文件',
          icon: 'mdi-image-multiple',
          enabled: true
        }
      ]
    }
  },

  getTool: async (code: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tools/${code}`)
      return response.data
    } catch (error) {
      console.error(`Failed to fetch tool ${code}:`, error)
      // 返回降级数据 - 只保留图片转PDF工具
      const toolMap: Record<string, any> = {
        'image-to-pdf': {
          code: 'image-to-pdf',
          name: '图片转换PDF',
          description: '将多张图片按顺序合并为 PDF 文件',
          icon: 'mdi-image-multiple',
          enabled: true
        }
      }
      return toolMap[code] || null
    }
  }
}
