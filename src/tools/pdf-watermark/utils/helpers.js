/**
 * 通知管理工具
 */

/**
 * 显示通知
 * @param {Object} notification - 通知状态对象
 * @param {string} message - 消息内容
 * @param {string} color - 颜色（info/success/error/warning）
 * @param {number} duration - 持续时间（毫秒）
 */
export const showNotification = (notification, message, color = 'info', duration = 4000) => {
  notification.message = message
  notification.color = color
  notification.show = true

  // 4秒后自动关闭
  setTimeout(() => {
    notification.show = false
  }, duration)
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} - 格式化后的大小
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 颜色转换工具
 */

/**
 * 判断错误是否为密码相关
 * @param {Error} error - 错误对象
 * @returns {boolean} - 是否为密码错误
 */
export const isPasswordError = (error) => {
  const message = error.message.toLowerCase()
  return message.includes('password') || 
         message.includes('encrypted') || 
         message.includes('密码错误')
}

/**
 * 格式化用户友好的错误消息
 * @param {Error} error - 错误对象
 * @returns {string} - 格式化后的错误消息
 */
export const formatErrorMessage = (error) => {
  if (isPasswordError(error)) {
    return '密码错误，请重新输入'
  }
  
  if (error.message.includes('PDF文件不包含任何页面')) {
    return 'PDF文件不包含任何页面'
  }
  
  if (error.message.includes('cancelled')) {
    return '操作已取消'
  }
  
  return error.message || '未知错误'
}
