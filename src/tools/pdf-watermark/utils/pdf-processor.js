/**
 * PDF 导出处理器
 * 复用 watermark-generator.js 的统一渲染路径，确保导出与预览一致
 */
import {createWatermarkedPdfBytes} from './watermark-generator.js'

/**
 * 导出带水印的 PDF
 * @param {File|Blob|ArrayBuffer} pdfSource - 原始 PDF（File / Blob / ArrayBuffer）
 * @param {Object} watermarkConfig - 水印配置
 * @returns {Promise<Blob>} 带水印的 PDF Blob
 */
export async function exportWatermarkedPDF(pdfSource, watermarkConfig) {
  // 统一转为 ArrayBuffer
  let arrayBuffer
  if (pdfSource instanceof Blob) {
    arrayBuffer = await pdfSource.arrayBuffer()
  } else if (pdfSource instanceof ArrayBuffer) {
    arrayBuffer = pdfSource
  } else {
    arrayBuffer = pdfSource
  }

  // 使用 scale=2 保证导出清晰度
  const pdfBytes = await createWatermarkedPdfBytes(arrayBuffer, watermarkConfig, {scale: 2})

  return new Blob([pdfBytes], {type: 'application/pdf'})
}
