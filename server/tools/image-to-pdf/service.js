import { PDFDocument, rgb } from 'pdf-lib'
import fs from 'fs-extra'
import path from 'path'
import sharp from 'sharp'

/**
 * 生成 PDF 服务
 * @param {Array} imageFiles - 图片文件数组
 * @param {Array} order - 图片顺序数组
 * @param {String} outputDir - 输出目录
 * @returns {Promise<String>} - 生成的 PDF 文件路径
 */
export async function generatePDF(imageFiles, order, outputDir) {
  try {
    // 确保输出目录存在
    await fs.ensureDir(outputDir)

    // 创建 PDF 文档
    const pdfDoc = await PDFDocument.create()
    
    // 按顺序处理图片
    for (const index of order) {
      const imageFile = imageFiles[index]
      if (!imageFile) continue

      // 读取图片 buffer
      const imageBuffer = await fs.readFile(imageFile.path)
      
      // 判断图片类型并嵌入到 PDF
      let embeddedImage
      if (imageFile.mimetype === 'image/png') {
        embeddedImage = await pdfDoc.embedPng(imageBuffer)
      } else {
        embeddedImage = await pdfDoc.embedJpg(imageBuffer)
      }

      // 获取图片尺寸
      const { width, height } = embeddedImage

      // 创建 A4 页面 (595.28 x 841.89 points)
      const page = pdfDoc.addPage([595.28, 841.89])
      
      // 计算缩放比例，使图片等比缩放并居中
      const pageWidth = 595.28
      const pageHeight = 841.89
      const margin = 40 // 边距

      const availableWidth = pageWidth - 2 * margin
      const availableHeight = pageHeight - 2 * margin

      // 计算缩放比例
      const widthRatio = availableWidth / width
      const heightRatio = availableHeight / height
      const scale = Math.min(widthRatio, heightRatio)

      // 计算居中位置
      const scaledWidth = width * scale
      const scaledHeight = height * scale
      const x = (pageWidth - scaledWidth) / 2
      const y = (pageHeight - scaledHeight) / 2

      // 绘制图片
      page.drawImage(embeddedImage, {
        x,
        y,
        width: scaledWidth,
        height: scaledHeight
      })
    }

    // 生成 PDF 文件名
    const timestamp = Date.now()
    const pdfFileName = `image-to-pdf-${timestamp}.pdf`
    const pdfFilePath = path.join(outputDir, pdfFileName)

    // 保存 PDF
    const pdfBytes = await pdfDoc.save()
    await fs.writeFile(pdfFilePath, pdfBytes)

    return pdfFilePath
  } catch (error) {
    console.error('PDF 生成失败:', error)
    throw new Error(`PDF 生成失败: ${error.message}`)
  }
}

/**
 * 清理临时文件
 * @param {Array} imageFiles - 图片文件数组
 */
export async function cleanupTempFiles(imageFiles) {
  try {
    for (const file of imageFiles) {
      if (file.path && await fs.pathExists(file.path)) {
        await fs.remove(file.path)
      }
    }
  } catch (error) {
    console.error('清理临时文件失败:', error)
  }
}
