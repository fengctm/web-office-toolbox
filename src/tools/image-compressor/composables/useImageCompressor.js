import { ref, computed } from 'vue'

export function useImageCompressor() {
  const originalFile = ref(null)
  const originalUrl = ref('')
  const result = ref(null)
  const resultUrl = ref('')
  const compressing = ref(false)
  const progressText = ref('')

  const compressionRatio = computed(() => {
    if (!originalFile.value || !result.value) return 0
    return ((1 - result.value.blob.size / originalFile.value.size) * 100).toFixed(1)
  })

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('图片加载失败')) }
      img.src = url
    })
  }

  function getScaleDimensions(img, maxDim, scale) {
    let width = img.width * scale
    let height = img.height * scale
    if (maxDim > 0 && (width > maxDim || height > maxDim)) {
      const ratio = Math.min(maxDim / width, maxDim / height)
      width *= ratio
      height *= ratio
    }
    return { width: Math.round(width), height: Math.round(height) }
  }

  function drawToCanvas(img, width, height) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, width, height)
    return canvas
  }

  function canvasToBlob(canvas, mimeType, quality) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), mimeType, quality)
    })
  }

  function getExtension(mimeType) {
    const map = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp'
    }
    return map[mimeType] || 'jpg'
  }

  async function compressByQuality(quality = 0.8, maxDim = 0, format = 'image/jpeg') {
    if (!originalFile.value) {
      throw new Error('请先选择图片')
    }

    compressing.value = true
    progressText.value = '正在加载图片...'
    result.value = null
    if (resultUrl.value) {
      URL.revokeObjectURL(resultUrl.value)
      resultUrl.value = ''
    }

    try {
      const img = await loadImage(originalFile.value)
      progressText.value = '正在处理...'

      const dims = getScaleDimensions(img, maxDim, 1)
      const canvas = drawToCanvas(img, dims.width, dims.height)

      progressText.value = '正在压缩...'
      const blob = await canvasToBlob(canvas, format, quality)

      result.value = {
        blob,
        width: dims.width,
        height: dims.height,
        quality
      }
      resultUrl.value = URL.createObjectURL(blob)
      progressText.value = ''
    } catch (err) {
      progressText.value = ''
      throw err
    } finally {
      compressing.value = false
    }
  }

  async function compressToTargetSize(targetKB = 200, options = {}) {
    if (!originalFile.value) {
      throw new Error('请先选择图片')
    }

    const {
      maxDim = 0,
      format = 'image/jpeg',
      maxIterations = 10
    } = options

    compressing.value = true
    progressText.value = '启动深度压缩...'
    result.value = null
    if (resultUrl.value) {
      URL.revokeObjectURL(resultUrl.value)
      resultUrl.value = ''
    }

    try {
      const img = await loadImage(originalFile.value)
      const targetBytes = targetKB * 1024

      if (targetBytes >= originalFile.value.size) {
        const dims = getScaleDimensions(img, maxDim, 1)
        result.value = {
          blob: originalFile.value,
          width: dims.width,
          height: dims.height,
          quality: 1.0
        }
        resultUrl.value = URL.createObjectURL(originalFile.value)
        progressText.value = ''
        compressing.value = false
        return
      }

      let bestBlob = null
      let resultQuality = 0.9
      let resultWidth = img.width
      let resultHeight = img.height

      let currentScale = 1.0
      let currentQuality = 0.9

      for (let i = 0; i < 5; i++) {
        const dims = getScaleDimensions(img, maxDim, currentScale)
        const canvas = drawToCanvas(img, dims.width, dims.height)
        const blob = await canvasToBlob(canvas, format, currentQuality)

        progressText.value = `尝试压缩: ${(blob.size / 1024).toFixed(1)} KB`

        if (blob.size <= targetBytes) {
          bestBlob = blob
          resultQuality = currentQuality
          resultWidth = dims.width
          resultHeight = dims.height
          currentQuality += 0.05
          if (currentQuality > 1) break
        } else {
          currentQuality -= 0.15
        }

        if (currentQuality < 0.3) break
      }

      if (!bestBlob || bestBlob.size > targetBytes) {
        currentScale = 0.9
        for (let i = 0; i < maxIterations; i++) {
          const dims = getScaleDimensions(img, maxDim, currentScale)
          const canvas = drawToCanvas(img, dims.width, dims.height)
          const blob = await canvasToBlob(canvas, format, 0.5)

          progressText.value = `调整尺寸: ${dims.width} x ${dims.height}`

          if (blob.size <= targetBytes) {
            bestBlob = blob
            resultQuality = 0.5
            resultWidth = dims.width
            resultHeight = dims.height
            break
          }
          currentScale *= 0.8
        }
      }

      if (!bestBlob) {
        throw new Error('无法压缩至该目标大小，请尝试调大目标值')
      }

      result.value = {
        blob: bestBlob,
        width: resultWidth,
        height: resultHeight,
        quality: resultQuality
      }
      resultUrl.value = URL.createObjectURL(bestBlob)
      progressText.value = ''
    } catch (err) {
      progressText.value = ''
      throw err
    } finally {
      compressing.value = false
    }
  }

  function setFile(file) {
    if (originalUrl.value) {
      URL.revokeObjectURL(originalUrl.value)
    }
    if (resultUrl.value) {
      URL.revokeObjectURL(resultUrl.value)
    }
    originalFile.value = file
    originalUrl.value = URL.createObjectURL(file)
    result.value = null
    resultUrl.value = ''
  }

  function reset() {
    if (originalUrl.value) {
      URL.revokeObjectURL(originalUrl.value)
    }
    if (resultUrl.value) {
      URL.revokeObjectURL(resultUrl.value)
    }
    originalFile.value = null
    originalUrl.value = ''
    result.value = null
    resultUrl.value = ''
    compressing.value = false
    progressText.value = ''
  }

  function download(filename = 'compressed.jpg') {
    if (!resultUrl.value || !result.value) return
    const ext = getExtension(result.value.blob.type)
    const finalName = filename.includes('.') ? filename : `${filename}.${ext}`
    const a = document.createElement('a')
    a.href = resultUrl.value
    a.download = finalName
    a.click()
  }

  return {
    originalFile,
    originalUrl,
    result,
    resultUrl,
    compressing,
    progressText,
    compressionRatio,
    compressByQuality,
    compressToTargetSize,
    setFile,
    reset,
    download
  }
}
