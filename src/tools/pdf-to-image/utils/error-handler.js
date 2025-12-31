/**
 * PDF转图片工具 - 错误处理模块
 * 提供统一的错误处理、浏览器兼容性检查和用户友好的错误提示
 */

/**
 * 自定义错误类
 */
export class PDFToolError extends Error {
  constructor(message, type = 'general', details = null) {
    super(message)
    this.type = type
    this.details = details
    this.name = 'PDFToolError'
  }
}

/**
 * 浏览器兼容性检查
 * @returns {Object} 检查结果和错误信息
 */
export const validateBrowserSupport = () => {
  const errors = []
  const warnings = []

  // 检查PDF.js支持（检查全局变量）
  if (typeof window === 'undefined') {
    errors.push({
      type: 'pdfjs-not-loaded',
      message: 'PDF渲染引擎未加载',
      solution: '请检查网络连接，或刷新页面重试'
    })
  }
  
  // 检查pdfjs是否可用（在实际使用时检查，这里只做基本检查）
  // 注意：pdfjsLib是模块导入，无法在此直接检查，会在使用时暴露问题

  // 检查Canvas支持
  if (!window.HTMLCanvasElement || !document.createElement('canvas').getContext) {
    errors.push({
      type: 'canvas-unsupported',
      message: '浏览器不支持Canvas',
      solution: '请使用现代浏览器（Chrome、Edge、Firefox、Safari）'
    })
  }

  // 检查File API支持
  if (!window.File || !window.FileReader) {
    errors.push({
      type: 'file-api-unsupported',
      message: '浏览器不支持文件API',
      solution: '请升级浏览器版本'
    })
  }

  // 检查Blob支持
  if (!window.Blob || !window.URL) {
    errors.push({
      type: 'blob-unsupported',
      message: '浏览器不支持Blob下载',
      solution: '无法下载文件，请使用现代浏览器'
    })
  }

  // 检查Web Worker支持（警告而非错误）
  if (typeof Worker === 'undefined') {
    warnings.push({
      type: 'worker-unsupported',
      message: '浏览器不支持Web Worker',
      solution: '处理大文件时可能会阻塞界面，建议使用Chrome或Firefox'
    })
  }

  // 检查ZIP支持（在实际使用时检查）
  // 注意：JSZip是模块导入，无法在此直接检查，会在使用时暴露问题

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 文件验证
 * @param {File} file - 要验证的文件
 * @returns {Object} 验证结果
 */
export const validateFile = (file) => {
  if (!file) {
    return {
      valid: false,
      error: new PDFToolError('未选择文件', 'no-file')
    }
  }

  // 验证文件类型
  const isPDF = file.type === 'application/pdf' || 
                file.name.toLowerCase().endsWith('.pdf')
  
  if (!isPDF) {
    return {
      valid: false,
      error: new PDFToolError(
        '请选择PDF格式的文件',
        'invalid-format',
        { fileName: file.name, fileType: file.type }
      )
    }
  }

  // 验证文件大小 (50MB限制)
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    return {
      valid: false,
      error: new PDFToolError(
        `文件大小超过限制 (${formatFileSize(maxSize)})`,
        'size-limit',
        { fileSize: file.size, maxSize }
      )
    }
  }

  // 验证文件是否为空
  if (file.size === 0) {
    return {
      valid: false,
      error: new PDFToolError('文件为空', 'empty-file')
    }
  }

  return { valid: true }
}

/**
 * PDF解析错误处理
 * @param {Error} error - 原始错误
 * @returns {PDFToolError} 标准化错误
 */
export const handlePDFError = (error) => {
  const message = error.message || ''

  if (message.includes('Invalid PDF')) {
    return new PDFToolError(
      'PDF文件损坏或格式无效',
      'invalid-pdf',
      { originalError: error.message }
    )
  }

  if (message.includes('password') || message.includes('Password')) {
    return new PDFToolError(
      'PDF文件受密码保护，暂不支持加密文件',
      'password-protected',
      { originalError: error.message }
    )
  }

  if (message.includes('arrayBuffer') || message.includes('read')) {
    return new PDFToolError(
      '文件读取失败，请重新选择文件',
      'read-error',
      { originalError: error.message }
    )
  }

  if (message.includes('worker')) {
    return new PDFToolError(
      'PDF渲染引擎加载失败，请检查网络连接',
      'worker-error',
      { originalError: error.message }
    )
  }

  if (message.includes('memory') || message.includes('out of memory')) {
    return new PDFToolError(
      '内存不足，请尝试较小的PDF文件',
      'memory-error',
      { originalError: error.message }
    )
  }

  return new PDFToolError(
    `PDF解析失败: ${error.message}`,
    'parse-error',
    { originalError: error.message }
  )
}

/**
 * 导出错误处理
 * @param {Error} error - 原始错误
 * @returns {PDFToolError} 标准化错误
 */
export const handleExportError = (error) => {
  const message = error.message || ''

  if (message.includes('cancelled') || message.includes('取消')) {
    return new PDFToolError('导出已取消', 'cancelled')
  }

  if (message.includes('canvas') || message.includes('toDataURL')) {
    return new PDFToolError(
      '图片转换失败，可能是浏览器兼容性问题',
      'canvas-error',
      { originalError: error.message }
    )
  }

  if (message.includes('zip') || message.includes('ZIP')) {
    return new PDFToolError(
      '打包失败，请重试',
      'zip-error',
      { originalError: error.message }
    )
  }

  if (message.includes('download') || message.includes('save')) {
    return new PDFToolError(
      '文件下载失败，可能被浏览器阻止',
      'download-error',
      { originalError: error.message }
    )
  }

  if (message.includes('memory') || message.includes('quota')) {
    return new PDFToolError(
      '处理过程中内存不足，请尝试分批导出',
      'memory-error',
      { originalError: error.message }
    )
  }

  return new PDFToolError(
    `导出失败: ${error.message}`,
    'export-error',
    { originalError: error.message }
  )
}

/**
 * 格式化错误消息为用户友好的提示
 * @param {PDFToolError} error - 错误对象
 * @returns {Object} 用户友好的提示信息
 */
export const formatUserFriendlyError = (error) => {
  const baseMessage = error.message

  const errorMessages = {
    'no-file': {
      message: '请先选择PDF文件',
      suggestion: '点击上方的"选择PDF文件"按钮',
      severity: 'warning'
    },
    'invalid-format': {
      message: '文件格式不正确',
      suggestion: '请选择PDF格式的文件',
      severity: 'error'
    },
    'size-limit': {
      message: '文件过大',
      suggestion: '建议选择50MB以内的PDF文件',
      severity: 'error'
    },
    'empty-file': {
      message: '文件为空',
      suggestion: '请选择包含内容的PDF文件',
      severity: 'error'
    },
    'invalid-pdf': {
      message: 'PDF文件损坏',
      suggestion: '请尝试重新导出PDF文件，或使用其他PDF文件',
      severity: 'error'
    },
    'password-protected': {
      message: 'PDF受密码保护',
      suggestion: '请移除密码保护后再尝试',
      severity: 'error'
    },
    'read-error': {
      message: '文件读取失败',
      suggestion: '请重新选择文件，或检查文件权限',
      severity: 'error'
    },
    'worker-error': {
      message: '渲染引擎加载失败',
      suggestion: '请检查网络连接，或刷新页面重试',
      severity: 'warning'
    },
    'memory-error': {
      message: '内存不足',
      suggestion: '请尝试较小的文件，或关闭其他标签页释放内存',
      severity: 'error'
    },
    'canvas-error': {
      message: '图片转换失败',
      suggestion: '请尝试其他图片格式，或使用现代浏览器',
      severity: 'error'
    },
    'zip-error': {
      message: '打包失败',
      suggestion: '请重试，或分批导出',
      severity: 'warning'
    },
    'download-error': {
      message: '下载失败',
      suggestion: '请检查浏览器是否阻止下载，或尝试其他浏览器',
      severity: 'warning'
    },
    'cancelled': {
      message: '导出已取消',
      suggestion: '您可以随时重新开始导出',
      severity: 'info'
    },
    'general': {
      message: baseMessage,
      suggestion: '请刷新页面重试，或联系技术支持',
      severity: 'error'
    }
  }

  const result = errorMessages[error.type] || errorMessages['general']
  
  return {
    title: result.message,
    message: baseMessage,
    suggestion: result.suggestion,
    severity: result.severity,
    details: error.details
  }
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 性能监控和内存保护
 */
export const PerformanceMonitor = {
  startTime: 0,
  memoryWarnings: 0,
  
  start() {
    this.startTime = performance.now()
    this.memoryWarnings = 0
  },

  checkMemory() {
    if (performance.memory) {
      const used = performance.memory.usedJSHeapSize
      const limit = performance.memory.jsHeapSizeLimit
      const ratio = used / limit
      
      if (ratio > 0.9) {
        this.memoryWarnings++
        if (this.memoryWarnings > 3) {
          throw new PDFToolError(
            '内存使用过高，为保护系统稳定性已停止处理',
            'memory-error',
            { memoryRatio: ratio }
          )
        }
        return {
          warning: true,
          message: `内存使用率: ${(ratio * 100).toFixed(1)}%`
        }
      }
    }
    return { warning: false }
  },

  getElapsedTime() {
    return ((performance.now() - this.startTime) / 1000).toFixed(2)
  }
}

/**
 * 错误上报（可扩展为发送到服务器）
 */
export const reportError = (error, context = {}) => {
  console.error('PDF工具错误:', {
    error: error.message,
    type: error.type,
    details: error.details,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  })

  // 这里可以添加错误上报逻辑
  // 例如：发送到错误监控服务
}

/**
 * 创建错误处理包装器
 * @param {Function} fn - 要包装的函数
 * @param {Object} options - 配置选项
 * @returns {Function} 包装后的函数
 */
export const withErrorHandling = (fn, options = {}) => {
  const { onError, onFinally, context = {} } = options

  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      const handledError = error instanceof PDFToolError ? error : handlePDFError(error)
      
      if (onError) {
        onError(handledError)
      } else {
        reportError(handledError, context)
      }
      
      throw handledError
    } finally {
      if (onFinally) {
        onFinally()
      }
    }
  }
}

export default {
  PDFToolError,
  validateBrowserSupport,
  validateFile,
  handlePDFError,
  handleExportError,
  formatUserFriendlyError,
  formatFileSize,
  PerformanceMonitor,
  reportError,
  withErrorHandling
}
