import { ref } from 'vue'

/**
 * 图标生成 Composable
 */
export function useIconGenerator() {
  const isGenerating = ref(false)
  const progress = ref(0)
  const generatedIcons = ref([])

  /**
   * 绘制圆角
   */
  function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  /**
   * 应用圆角到 Canvas
   */
  function applyBorderRadius(canvas, radiusPercent) {
    if (radiusPercent <= 0) return canvas

    const radius = (radiusPercent / 100) * (canvas.width / 2)
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const ctx = tempCanvas.getContext('2d')

    // 绘制圆角路径
    drawRoundedRect(ctx, 0, 0, tempCanvas.width, tempCanvas.height, radius)

    // 使用 destination-in 混合模式裁剪
    ctx.globalCompositeOperation = 'destination-in'
    ctx.fillStyle = 'black'
    ctx.fill()

    // 合并原图和圆角蒙版
    const resultCanvas = document.createElement('canvas')
    resultCanvas.width = canvas.width
    resultCanvas.height = canvas.height
    const resultCtx = resultCanvas.getContext('2d')

    resultCtx.drawImage(canvas, 0, 0)
    resultCtx.globalCompositeOperation = 'destination-in'
    resultCtx.drawImage(tempCanvas, 0, 0)

    return resultCanvas
  }

  /**
   * 缩放 Canvas 到目标尺寸
   */
  function scaleCanvas(sourceCanvas, targetSize) {
    const targetCanvas = document.createElement('canvas')
    targetCanvas.width = targetSize
    targetCanvas.height = targetSize
    const ctx = targetCanvas.getContext('2d')

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(sourceCanvas, 0, 0, targetSize, targetSize)

    return targetCanvas
  }

  /**
   * Canvas 转 Blob
   */
  function canvasToBlob(canvas, mimeType, quality = 1.0) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to convert canvas to blob'))
          }
        },
        mimeType,
        quality
      )
    })
  }

  /**
   * Canvas 转 Data URL
   */
  function canvasToDataUrl(canvas, mimeType, quality = 1.0) {
    return canvas.toDataURL(mimeType, quality)
  }

  /**
   * 生成 PNG 图标
   */
  async function generatePng(sourceCanvas, size, borderRadius) {
    const scaledCanvas = scaleCanvas(sourceCanvas, size)
    const processedCanvas = applyBorderRadius(scaledCanvas, borderRadius)

    const blob = await canvasToBlob(processedCanvas, 'image/png')
    const dataUrl = canvasToDataUrl(processedCanvas, 'image/png')

    return {
      blob,
      dataUrl,
      size,
      format: 'png',
      fileName: `icon-${size}x${size}.png`
    }
  }

  /**
   * 生成 WebP 图标
   */
  async function generateWebp(sourceCanvas, size, borderRadius, quality = 0.9) {
    const scaledCanvas = scaleCanvas(sourceCanvas, size)
    const processedCanvas = applyBorderRadius(scaledCanvas, borderRadius)

    const blob = await canvasToBlob(processedCanvas, 'image/webp', quality)
    const dataUrl = canvasToDataUrl(processedCanvas, 'image/webp', quality)

    return {
      blob,
      dataUrl,
      size,
      format: 'webp',
      fileName: `icon-${size}x${size}.webp`
    }
  }

  /**
   * 生成 ICO 图标（浏览器兼容版本）
   * ICO 格式需要包含多个尺寸
   */
  async function generateIco(sourceCanvas, sizes, borderRadius) {
    // 生成多个尺寸的 PNG blobs
    const pngBlobs = await Promise.all(
      sizes.map(async (size) => {
        const scaledCanvas = scaleCanvas(sourceCanvas, size)
        const processedCanvas = applyBorderRadius(scaledCanvas, borderRadius)
        return canvasToBlob(processedCanvas, 'image/png')
      })
    )

    // 读取所有PNG数据为ArrayBuffer
    const pngBuffers = await Promise.all(
      pngBlobs.map(blob => blob.arrayBuffer())
    )

    // 构建ICO文件
    const icoFile = await createIcoFile(pngBuffers)

    const blob = new Blob([icoFile], { type: 'image/x-icon' })

    // 生成预览（使用第一个尺寸）
    const dataUrl = URL.createObjectURL(blob)

    const maxSize = Math.max(...sizes)

    return {
      blob,
      dataUrl,
      size: maxSize,
      format: 'ico',
      fileName: `favicon.ico`,
      sizes
    }
  }

  /**
   * 创建ICO文件格式
   * @param {ArrayBuffer[]} pngBuffers - PNG图片数据数组
   * @returns {ArrayBuffer} ICO文件数据
   */
  async function createIcoFile(pngBuffers) {
    // ICO文件头 (6 bytes)
    const header = new DataView(new ArrayBuffer(6))
    header.setUint16(0, 0, true)           // Reserved (must be 0)
    header.setUint16(2, 1, true)           // Type: 1 = ICO
    header.setUint16(4, pngBuffers.length, true) // Number of images

    // 计算数据区起始位置（文件头 + 目录项）
    const headerSize = 6
    const dirEntrySize = 16
    const dataStartOffset = headerSize + (dirEntrySize * pngBuffers.length)

    // 创建目录项和数据区
    const dirEntries = []
    const imageDataParts = []
    let currentOffset = dataStartOffset

    for (const pngBuffer of pngBuffers) {
      const pngData = new Uint8Array(pngBuffer)
      const size = pngData.length

      // 解析PNG尺寸（前8字节后是IHDR chunk）
      const width = pngData[16] | (pngData[17] << 8) | (pngData[18] << 16) | (pngData[19] << 24)
      const height = pngData[20] | (pngData[21] << 8) | (pngData[22] << 16) | (pngData[23] << 24)

      // 创建目录项 (16 bytes)
      const entry = new DataView(new ArrayBuffer(16))
      const w = width >= 256 ? 0 : width
      const h = height >= 256 ? 0 : height
      entry.setUint8(0, w)               // Width
      entry.setUint8(1, h)               // Height
      entry.setUint8(2, 0)               // Color palette count (0 = no palette)
      entry.setUint8(3, 0)               // Reserved
      entry.setUint16(4, 1, true)        // Color planes (must be 1)
      entry.setUint16(6, 32, true)       // Bits per pixel (32 for PNG)
      entry.setUint32(8, size, true)     // Size of image data
      entry.setUint32(12, currentOffset, true) // Offset to image data

      dirEntries.push(entry)
      imageDataParts.push(pngData)
      currentOffset += size
    }

    // 合并所有部分
    const totalSize = currentOffset
    const result = new Uint8Array(totalSize)

    let offset = 0

    // 写入文件头
    const headerBytes = new Uint8Array(header.buffer)
    result.set(headerBytes, offset)
    offset += headerSize

    // 写入目录项
    for (const entry of dirEntries) {
      const entryBytes = new Uint8Array(entry.buffer)
      result.set(entryBytes, offset)
      offset += dirEntrySize
    }

    // 写入图像数据
    for (const imageData of imageDataParts) {
      result.set(imageData, offset)
      offset += imageData.length
    }

    return result.buffer
  }

  /**
   * 生成 SVG 图标（封装 PNG）
   */
  async function generateSvg(sourceCanvas, size, borderRadius) {
    const scaledCanvas = scaleCanvas(sourceCanvas, size)
    const processedCanvas = applyBorderRadius(scaledCanvas, borderRadius)
    const dataUrl = canvasToDataUrl(processedCanvas, 'image/png')

    // 创建 SVG 包装
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <image width="${size}" height="${size}" xlink:href="${dataUrl}"/>
</svg>`

    const blob = new Blob([svgContent], { type: 'image/svg+xml' })

    return {
      blob,
      dataUrl: `data:image/svg+xml;base64,${btoa(svgContent)}`,
      size,
      format: 'svg',
      fileName: `icon-${size}x${size}.svg`
    }
  }

  /**
   * 生成单个图标
   */
  async function generateSingleIcon(sourceCanvas, size, format, options = {}) {
    const { borderRadius = 0, quality = 0.9 } = options

    switch (format) {
      case 'png':
        return generatePng(sourceCanvas, size, borderRadius)
      case 'webp':
        return generateWebp(sourceCanvas, size, borderRadius, quality)
      case 'svg':
        return generateSvg(sourceCanvas, size, borderRadius)
      case 'ico':
        // ICO 需要多个尺寸
        return generateIco(sourceCanvas, options.icoSizes || [16, 32, 48], borderRadius)
      default:
        throw new Error(`Unsupported format: ${format}`)
    }
  }

  /**
   * 批量生成图标
   */
  async function generateIcons(sourceCanvas, sizes, formats, options = {}) {
    isGenerating.value = true
    progress.value = 0
    generatedIcons.value = []

    try {
      const icons = []
      const total = sizes.length * formats.length
      let current = 0

      // 为每个格式生成图标
      for (const format of formats) {
        if (format === 'ico') {
          // ICO 特殊处理，包含多个尺寸
          const icon = await generateSingleIcon(sourceCanvas, 0, format, {
            ...options,
            icoSizes: sizes.slice(0, 6) // ICO 包含前 6 个尺寸
          })
          icons.push(icon)
          current++
          progress.value = Math.round((current / total) * 100)
        } else {
          // 其他格式为每个尺寸生成
          for (const size of sizes) {
            const icon = await generateSingleIcon(sourceCanvas, size, format, options)
            icons.push(icon)
            current++
            progress.value = Math.round((current / total) * 100)
          }
        }
      }

      generatedIcons.value = icons
      return icons
    } catch (error) {
      console.error('Error generating icons:', error)
      throw error
    } finally {
      isGenerating.value = false
      progress.value = 100
    }
  }

  return {
    isGenerating,
    progress,
    generatedIcons,
    generateIcons,
    generateSingleIcon
  }
}
