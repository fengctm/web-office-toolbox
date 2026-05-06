/**
 * 统一水印生成器 - 预览与导出共用同一条渲染路径
 *
 * 所有文字（中英文）统一通过 Canvas → PNG → 嵌入 PDF 方式，
 * 确保 "所见即所得" —— 预览和导出 100% 一致。
 */
import {PDFDocument} from 'pdf-lib'

// ── 高质量字体栈 ──────────────────────────────────────────────
const FONT_STACK = '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", "SimHei", Arial, sans-serif'

/**
 * 用 pdf-lib 生成带水印的 PDF 字节流
 * @param {ArrayBuffer} originalBytes - 原始 PDF 的 ArrayBuffer
 * @param {Object} config - 水印配置
 * @param {string} config.text - 水印文字
 * @param {number} config.fontSize - 字体大小（PDF 点）
 * @param {string} config.color - 十六进制颜色（如 '#ff0000'）
 * @param {number} config.opacity - 不透明度 (0-1)
 * @param {number} config.rotation - 旋转角度（度）
 * @param {number} config.gap - 水印间距
 * @param {number} config.offsetX - X 轴偏移
 * @param {number} config.offsetY - Y 轴偏移
 * @param {Object} [options]
 * @param {number} [options.scale=2] - Canvas 缩放倍数（导出用 2，预览用 1.5）
 * @param {number} [options.maxPages] - 最多处理的页数（预览可限制）
 * @returns {Promise<Uint8Array>} 带水印的 PDF 字节流
 */
export async function createWatermarkedPdfBytes(originalBytes, config, options = {}) {
  const {scale = 2, maxPages} = options

  const pdfDoc = await PDFDocument.load(originalBytes, {ignoreEncryption: true})
  const pages = pdfDoc.getPages()
  const pageCount = maxPages ? Math.min(pages.length, maxPages) : pages.length

  for (let i = 0; i < pageCount; i++) {
    const page = pages[i]
    const {width, height} = page.getSize()

    // 创建整页透明水印层
    const watermarkCanvas = createPageWatermarkCanvas(config, width, height, scale)

    // Canvas → PNG → 嵌入 PDF
    const pngDataUrl = watermarkCanvas.toDataURL('image/png')
    const pngBytes = await dataUrlToArrayBuffer(pngDataUrl)
    const pngImage = await pdfDoc.embedPng(pngBytes)

    // 叠加到页面（保持透明度）
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width,
      height,
      opacity: 1 // 透明度已在 Canvas 中处理
    })
  }

  return pdfDoc.save()
}

/**
 * 创建整页水印 Canvas
 * @param {Object} config - 水印配置
 * @param {number} pageWidth - PDF 页面宽度（点）
 * @param {number} pageHeight - PDF 页面高度（点）
 * @param {number} scale - 缩放倍数
 * @returns {HTMLCanvasElement}
 */
function createPageWatermarkCanvas(config, pageWidth, pageHeight, scale) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  canvas.width = pageWidth * scale
  canvas.height = pageHeight * scale

  // 透明背景
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 绘制水印网格
  drawWatermarkGrid(ctx, config, canvas.width, canvas.height, scale)

  return canvas
}

/**
 * 在 Canvas 上绘制水印网格
 */
function drawWatermarkGrid(ctx, config, canvasWidth, canvasHeight, scale) {
  const {text, fontSize, color, opacity, rotation, gap, offsetX, offsetY} = config

  const scaledFontSize = fontSize * scale
  const scaledGap = gap * scale
  const scaledOffsetX = offsetX * scale
  const scaledOffsetY = offsetY * scale

  ctx.save()
  ctx.font = `bold ${scaledFontSize}px ${FONT_STACK}`
  ctx.fillStyle = hexToRgba(color, opacity)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const rotationRad = (rotation * Math.PI) / 180

  // 覆盖范围超出画布边缘，确保旋转后无空白
  const startX = -scaledGap * 2
  const endX = canvasWidth + scaledGap * 2
  const startY = -scaledGap * 2
  const endY = canvasHeight + scaledGap * 2

  for (let x = startX; x <= endX; x += scaledGap) {
    for (let y = startY; y <= endY; y += scaledGap) {
      const drawX = x + scaledOffsetX
      const drawY = y + scaledOffsetY

      ctx.save()
      ctx.translate(drawX, drawY)
      ctx.rotate(rotationRad)
      ctx.fillText(text, 0, 0)
      ctx.restore()
    }
  }

  ctx.restore()
}

// ── 辅助函数 ──────────────────────────────────────────────────

/**
 * 十六进制颜色 → rgba 字符串
 */
function hexToRgba(hex, opacity) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return `rgba(255, 0, 0, ${opacity})`
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * Data URL → ArrayBuffer
 */
async function dataUrlToArrayBuffer(dataUrl) {
  const res = await fetch(dataUrl)
  return res.arrayBuffer()
}

/**
 * 检查水印配置是否有效
 */
export function isValidWatermarkConfig(config) {
  return config
    && config.text
    && config.text.trim().length > 0
    && config.gap > 0
    && config.fontSize > 0
}
