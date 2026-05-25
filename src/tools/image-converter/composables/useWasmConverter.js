import { ref, readonly } from 'vue'

/**
 * WASM 模块加载和图片转换封装
 *
 * WASM 文件从 src/wasm/image-converter/ 加载，通过 Vite 的模块解析系统处理。
 * wasm-pack 生成的 JS 使用 new URL('...wasm', import.meta.url) 定位 WASM 二进制，
 * Vite 会自动将其作为静态资源处理并正确复制到构建产物中。
 */

let wasmModule = null
let wasmInitializing = null

const supportedInputFormats = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/bmp',
  'image/gif',
  'image/tiff',
  'image/x-icon',
  'image/x-tga',
  'image/x-portable-bitmap',
  'image/x-portable-graymap',
  'image/x-portable-pixmap',
]

const supportedExtensions = '.png,.jpg,.jpeg,.webp,.bmp,.gif,.tiff,.tif,.ico,.tga,.pnm,.pbm,.pgm,.ppm,.dds,.ff,.exr,.qoi'

/**
 * 初始化 WASM 模块（单例模式，防止并发初始化）
 */
async function initWasm() {
  if (wasmModule) return wasmModule
  if (wasmInitializing) return wasmInitializing

  wasmInitializing = (async () => {
    try {
      const module = await import('@/wasm/image-converter/image_converter_wasm.js')
      await module.default()
      wasmModule = module
      return module
    } catch (err) {
      wasmInitializing = null
      throw new Error(
        'WASM 模块加载失败。请确保已编译 Rust WASM 模块 (运行 wasm/build-wasm.ps1)。' +
        `\n原始错误: ${err.message}`
      )
    }
  })()

  return wasmInitializing
}

/**
 * WASM 图片转换器 composable
 */
export function useWasmConverter() {
  const loading = ref(false)
  const wasmReady = ref(false)
  const error = ref(null)

  /**
   * 确保 WASM 已加载
   */
  async function ensureWasm() {
    if (wasmReady.value) return
    loading.value = true
    error.value = null
    try {
      await initWasm()
      wasmReady.value = true
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 转换单张图片
   * @param {File} file - 输入图片文件
   * @param {string} format - 目标格式: 'jpeg' | 'png' | 'webp'
   * @param {number} quality - 压缩质量 1-100（PNG 忽略此参数）
   * @param {number[]} bgColor - 背景色 [R, G, B]（转 JPEG 时用于混合透明像素）
   * @returns {Promise<{blob: Blob, width: number, height: number}>}
   */
  async function convert(file, format, quality = 85, bgColor = [255, 255, 255]) {
    await ensureWasm()

    loading.value = true
    error.value = null
    try {
      const buffer = await file.arrayBuffer()
      const inputBytes = new Uint8Array(buffer)
      const bgColorArray = new Uint8Array(bgColor)

      const outputBytes = wasmModule.convert_image(inputBytes, format, quality, bgColorArray)

      const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`
      const blob = new Blob([outputBytes], { type: mimeType })

      // 同时解码获取尺寸信息
      const raw = wasmModule.decode_image(inputBytes)
      const width = raw.width()
      const height = raw.height()
      raw.free()

      return { blob, width, height }
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 仅解码图片（获取尺寸等信息，不做转换）
   */
  async function decode(file) {
    await ensureWasm()

    const buffer = await file.arrayBuffer()
    const inputBytes = new Uint8Array(buffer)
    const raw = wasmModule.decode_image(inputBytes)
    const info = {
      width: raw.width(),
      height: raw.height(),
      dataLen: raw.data_len(),
    }
    raw.free()
    return info
  }

  return {
    loading: readonly(loading),
    wasmReady: readonly(wasmReady),
    error: readonly(error),
    convert,
    decode,
    ensureWasm,
    supportedInputFormats,
    supportedExtensions,
  }
}
