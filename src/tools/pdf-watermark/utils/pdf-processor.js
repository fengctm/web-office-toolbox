import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export class PDFProcessor {
  /**
   * 校验PDF文件
   * @param {File} file - 文件对象
   * @returns {Promise<boolean>} - 是否有效
   */
  static async validatePDF(file) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      
      // 检查是否加密
      const isEncrypted = pdfDoc.isEncrypted
      if (isEncrypted) {
        throw new Error('PDF文件已加密，无法处理')
      }

      // 检查页数
      const pageCount = pdfDoc.getPageCount()
      if (pageCount === 0) {
        throw new Error('PDF文件为空')
      }

      return true
    } catch (error) {
      if (error.message.includes('encrypted')) {
        throw new Error('PDF文件已加密')
      }
      throw new Error('PDF文件损坏或格式不正确')
    }
  }

  /**
   * 生成带水印的PDF
   * @param {File} file - 原始PDF文件
   * @param {Object} settings - 水印设置
   * @returns {Promise<Blob>} - 新PDF的Blob
   */
  static async generateWatermarkPDF(file, settings) {
    try {
      // 1. 加载原始PDF
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)

      // 2. 嵌入标准字体
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      // 3. 获取所有页面
      const pages = pdfDoc.getPages()

      // 4. 为每一页添加水印
      pages.forEach(page => {
        const { width, height } = page.getSize()
        
        // 计算水印网格
        const density = settings.density
        const fontSize = settings.fontSize
        const color = this.hexToRgb(settings.color)
        const opacity = settings.opacity
        const rotation = settings.rotation

        // 绘制网格水印
        for (let x = 0; x < width; x += width / density) {
          for (let y = 0; y < height; y += height / density) {
            page.drawText(settings.text, {
              x: x + settings.offset,
              y: y,
              size: fontSize,
              font: font,
              color: rgb(color.r, color.g, color.b),
              opacity: opacity,
              rotate: { type: 'degrees', angle: rotation }
            })
          }
        }
      })

      // 5. 生成新的PDF字节
      const pdfBytes = await pdfDoc.save()
      
      // 6. 转换为Blob
      return new Blob([pdfBytes], { type: 'application/pdf' })
    } catch (error) {
      throw new Error('水印生成失败: ' + error.message)
    }
  }

  /**
   * 下载PDF文件
   * @param {Blob} blob - PDF Blob
   * @param {string} fileName - 文件名
   */
  static async downloadPDF(blob, fileName) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Hex颜色转RGB
   * @param {string} hex - 十六进制颜色
   * @returns {Object} - RGB对象
   */
  static hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 }
  }
}
