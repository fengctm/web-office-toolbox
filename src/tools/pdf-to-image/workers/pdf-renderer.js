/**
 * PDF渲染Web Worker
 * 在后台线程中处理PDF渲染，避免阻塞UI
 */

// 配置pdfjs worker
importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js')

// 存储PDF文档实例
let pdfDoc = null

/**
 * 加载PDF文档
 */
const loadPDF = async (arrayBuffer) => {
  try {
    const loadingTask = self.PDFJS.getDocument({ data: arrayBuffer })
    pdfDoc = await loadingTask.promise
    return {
      success: true,
      numPages: pdfDoc.numPages
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 渲染单个页面
 */
const renderPage = async (pageNum, scale = 2.0) => {
  if (!pdfDoc) {
    throw new Error('PDF文档未加载')
  }

  const page = await pdfDoc.getPage(pageNum)
  const viewport = page.getViewport({ scale })

  // 创建离屏Canvas
  const canvas = new OffscreenCanvas(viewport.width, viewport.height)
  const ctx = canvas.getContext('2d')

  // 渲染配置
  const renderContext = {
    canvasContext: ctx,
    viewport: viewport
  }

  // 渲染页面
  await page.render(renderContext).promise

  // 转换为Blob
  const blob = await canvas.convertToBlob({ type: 'image/png' })
  const arrayBuffer = await blob.arrayBuffer()

  return {
    pageNum,
    width: viewport.width,
    height: viewport.height,
    data: arrayBuffer
  }
}

/**
 * 批量渲染页面
 */
const renderBatch = async (pages, scale = 2.0, format = 'png', quality = 0.92) => {
  const results = []
  
  for (let i = 0; i < pages.length; i++) {
    const pageNum = pages[i]
    
    // 渲染页面
    const result = await renderPage(pageNum, scale)
    
    // 转换为指定格式
    const imageData = await convertToFormat(result.data, format, quality)
    
    results.push({
      pageNum,
      imageData,
      width: result.width,
      height: result.height
    })

    // 发送进度更新
    self.postMessage({
      type: 'progress',
      progress: ((i + 1) / pages.length) * 100,
      currentPage: i + 1,
      totalPages: pages.length
    })
  }

  return results
}

/**
 * 转换图片格式
 */
const convertToFormat = async (arrayBuffer, format, quality) => {
  // 创建ImageBitmap
  const blob = new Blob([arrayBuffer], { type: 'image/png' })
  const bitmap = await createImageBitmap(blob)

  // 创建Canvas
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0)

  // 转换为指定格式
  const type = `image/${format}`
  const convertedBlob = await canvas.convertToBlob({ 
    type, 
    quality 
  })

  // 转换为base64
  const base64 = await blobToBase64(convertedBlob)
  return base64
}

/**
 * Blob转Base64
 */
const blobToBase64 = (blob) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.readAsDataURL(blob)
  })
}

/**
 * 清理资源
 */
const cleanup = () => {
  pdfDoc = null
}

// Worker消息处理
self.onmessage = async (e) => {
  const { type, payload } = e.data

  try {
    switch (type) {
      case 'load':
        const loadResult = await loadPDF(payload.arrayBuffer)
        self.postMessage({ type: 'loaded', ...loadResult })
        break

      case 'render':
        const renderResult = await renderPage(payload.pageNum, payload.scale)
        self.postMessage({ type: 'rendered', ...renderResult })
        break

      case 'renderBatch':
        const batchResult = await renderBatch(
          payload.pages,
          payload.scale,
          payload.format,
          payload.quality
        )
        self.postMessage({ type: 'batchComplete', results: batchResult })
        break

      case 'cleanup':
        cleanup()
        self.postMessage({ type: 'cleaned' })
        break

      default:
        throw new Error(`未知消息类型: ${type}`)
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message,
      details: error.stack
    })
  }
}

// Worker错误处理
self.onerror = (error) => {
  self.postMessage({
    type: 'error',
    error: error.message || 'Worker运行错误'
  })
}

// 处理导入脚本失败的情况
self.onmessageerror = (error) => {
  self.postMessage({
    type: 'error',
    error: '消息处理失败',
    details: error.message
  })
}
