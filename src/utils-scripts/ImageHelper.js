/**
 * 图片处理工具类
 * 用于检测图片格式、动图等
 */

/**
 * 检测图片是否为动图
 * @param {File} file - 图片文件
 * @returns {Promise<boolean>} - 是否为动图
 */
export async function isAnimatedImage(file) {
  if (!file || !file.type) {
    return false
  }

  if (file.type === 'image/gif') {
    return await detectAnimatedGif(file)
  }

  if (file.type === 'image/webp') {
    return await detectAnimatedWebP(file)
  }

  return false
}

/**
 * 检测 GIF 是否为动图（解析文件头中的图形控制扩展块）
 * @param {File} file - GIF 文件
 * @returns {Promise<boolean>}
 */
async function detectAnimatedGif(file) {
  try {
    // 只读取前 64KB，包含足够的信息来判断是否为动图
    const arrayBuffer = await file.slice(0, Math.min(file.size, 65536)).arrayBuffer()
    const data = new Uint8Array(arrayBuffer)

    // 检查 GIF 文件头 (GIF8)
    if (data[0] !== 0x47 || data[1] !== 0x49 || data[2] !== 0x46 || data[3] !== 0x38) {
      return false
    }

    let frameCount = 0
    let i = 0

    // 查找图形控制扩展块 (0x21 0xF9)
    // 这个块存在于每个有延迟时间的帧之前
    while (i < data.length - 2) {
      if (data[i] === 0x21 && data[i + 1] === 0xF9) {
        frameCount++
        if (frameCount > 1) {
          return true // 找到多个帧，确认为动图
        }
        // 跳过扩展块（第3个字节是块大小，加上块大小、终止字节等）
        i += 3 + (data[i + 2] || 0)
      } else {
        i++
      }
    }

    return frameCount > 1
  } catch (error) {
    console.warn('GIF 动图检测失败:', error)
    return false
  }
}

/**
 * 检测 WebP 是否为动图（检查 VP8X 扩展块动画标志位）
 * @param {File} file - WebP 文件
 * @returns {Promise<boolean>}
 */
async function detectAnimatedWebP(file) {
  try {
    // WebP 文件头只需要前 32 字节
    const arrayBuffer = await file.slice(0, 32).arrayBuffer()
    const data = new Uint8Array(arrayBuffer)

    // 检查 RIFF 文件头 (0x52494646 = "RIFF")
    if (data[0] !== 0x52 || data[1] !== 0x49 || data[2] !== 0x46 || data[3] !== 0x46) {
      return false
    }

    // 检查 WEBP 标识 (0x57454250 = "WEBP")
    if (data[8] !== 0x57 || data[9] !== 0x45 || data[10] !== 0x42 || data[11] !== 0x50) {
      return false
    }

    // 查找 VP8X 扩展块 (0x56503858 = "VP8X")
    for (let i = 12; i < data.length - 4; i++) {
      if (data[i] === 0x56 && data[i + 1] === 0x50 && data[i + 2] === 0x38 && data[i + 3] === 0x58) {
        // VP8X 块的第 5 个字节是标志位字节
        const flags = data[i + 4]
        // 第 2 位 (0x02) 是动画标志位
        return (flags & 0x02) !== 0
      }
    }

    return false
  } catch (error) {
    console.warn('WebP 动图检测失败:', error)
    return false
  }
}

/**
 * 格式化文件大小显示
 * @param {number} bytes - 字节数
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
