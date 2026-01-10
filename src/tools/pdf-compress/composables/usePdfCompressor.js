/**
 * PDF 压缩器逻辑 composable
 * 负责 PDF 文件处理、信息解析、压缩算法和下载
 */

import { ref, computed, reactive } from 'vue'
import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'

// 配置 PDFJS Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

export function usePdfCompressor() {
  // 响应式状态
  const state = reactive({
    file: null,
    password: '',
    pageCount: 0,
    quality: 0.5, // 0.1 - 0.9
    processing: false,
    processStatus: '',
  })

  // 计算属性
  const qualityLabel = computed(() => {
    if (state.quality <= 0.3) return '深度压缩 (低画质)'
    if (state.quality <= 0.6) return '平衡模式 (推荐)'
    return '高清压缩 (高画质)'
  })

  const estimatedSize = computed(() => {
    if (!state.file) return '0 KB'
    // 估算算法：基于原始大小 * 质量系数 * 修正因子
    const base = state.file.size * state.quality * 0.8
    return formatBytes(Math.max(base, state.file.size * 0.1))
  })

  /**
   * 格式化文件大小
   */
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 处理文件选择
   */
  const handleFileSelected = async (result) => {
    const { file, password } = result
    state.file = file
    state.password = password || ''
    await loadFileInfo()
  }

  /**
   * 解析 PDF 信息（获取页数）
   */
  const loadFileInfo = async () => {
    state.processing = true
    state.processStatus = '正在解析文档...'

    try {
      const arrayBuffer = await state.file.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        password: state.password || ''
      })
      const pdf = await loadingTask.promise

      state.pageCount = pdf.numPages

      // 额外的处理时间，让用户看到进度
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (err) {
      throw new Error('无法解析 PDF: ' + err.message)
    } finally {
      state.processing = false
    }
  }

  /**
   * 核心压缩逻辑
   * 策略：将每一页重构为指定质量的图片再打包
   */
  const compressPdf = async () => {
    state.processing = true
    state.processStatus = '正在准备压缩引擎...'

    try {
      const arrayBuffer = await state.file.arrayBuffer()
      const pdfjs = await pdfjsLib.getDocument({
        data: arrayBuffer,
        password: state.password || ''
      }).promise
      
      const outPdf = await PDFDocument.create()

      for (let i = 1; i <= pdfjs.numPages; i++) {
        state.processStatus = `正在压缩第 ${i} / ${pdfjs.numPages} 页...`

        const page = await pdfjs.getPage(i)
        // 这里的 scale 决定了基础分辨率，配合 quality 达到压缩效果
        const viewport = page.getViewport({ scale: 1.5 })

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = viewport.width
        canvas.height = viewport.height

        await page.render({ canvasContext: ctx, viewport }).promise

        // 核心压缩：将页面转为低质量 JPG
        const imgData = canvas.toDataURL('image/jpeg', state.quality)
        const imgBytes = await fetch(imgData).then(res => res.arrayBuffer())
        const img = await outPdf.embedJpg(imgBytes)

        const newPage = outPdf.addPage([img.width, img.height])
        newPage.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
      }

      state.processStatus = '正在打包文档...'
      const finalBytes = await outPdf.save()
      const blob = new Blob([finalBytes], { type: 'application/pdf' })

      return blob
    } catch (err) {
      throw new Error('压缩失败: ' + err.message)
    } finally {
      // 不在这里关闭 processing，让调用者决定
    }
  }

  /**
   * 重置状态
   */
  const reset = () => {
    state.file = null
    state.password = ''
    state.pageCount = 0
    state.processing = false
    state.processStatus = ''
  }

  return {
    // 状态
    state,
    
    // 计算属性
    qualityLabel,
    estimatedSize,
    
    // 方法
    formatBytes,
    handleFileSelected,
    compressPdf,
    reset
  }
}