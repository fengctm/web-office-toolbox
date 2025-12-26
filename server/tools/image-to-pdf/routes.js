import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs-extra'
import { generatePDF, cleanupTempFiles } from './service.js'

const router = express.Router()

// 配置 multer 用于文件上传
const upload = multer({ 
  dest: 'uploads/temp/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB 限制
    files: 100 // 最多 100 个文件
  }
})

// 生成 PDF 的路由
router.post('/generate', upload.array('images', 100), async (req, res) => {
  try {
    const { order } = req.body
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有上传图片文件'
      })
    }

    if (!order) {
      return res.status(400).json({
        success: false,
        message: '缺少图片顺序参数'
      })
    }

    // 解析顺序数组
    let orderArray
    try {
      orderArray = JSON.parse(order)
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: '顺序参数格式错误'
      })
    }

    // 验证顺序数组
    if (!Array.isArray(orderArray) || orderArray.length !== req.files.length) {
      return res.status(400).json({
        success: false,
        message: '顺序数组与图片数量不匹配'
      })
    }

    // 创建输出目录
    const outputDir = path.join(process.cwd(), 'downloads', 'image-to-pdf')
    await fs.ensureDir(outputDir)

    // 生成 PDF
    const pdfFilePath = await generatePDF(req.files, orderArray, outputDir)

    // 清理临时文件
    await cleanupTempFiles(req.files)

    // 返回下载链接
    const fileUrl = `/downloads/image-to-pdf/${path.basename(pdfFilePath)}`

    res.json({
      success: true,
      fileUrl,
      message: 'PDF 生成成功'
    })

  } catch (error) {
    console.error('生成 PDF 错误:', error)
    
    // 清理临时文件
    if (req.files) {
      await cleanupTempFiles(req.files)
    }

    res.status(500).json({
      success: false,
      message: error.message || '生成 PDF 失败'
    })
  }
})

export default router
