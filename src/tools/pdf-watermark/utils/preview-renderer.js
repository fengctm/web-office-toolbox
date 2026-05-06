/**
 * 防抖预览渲染引擎
 *
 * 监听水印参数变化 → pdf-lib 生成带水印 PDF → PDF.js 渲染到 Canvas → 返回图片 dataURL
 */
import {ref, watch} from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import {createWatermarkedPdfBytes} from './watermark-generator.js'

// 配置 PDF.js Worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

/** 预览最多渲染的页数 */
const MAX_PREVIEW_PAGES = 3

/**
 * 水印预览 composable
 * @param {import('vue').Ref<ArrayBuffer|null>} originalPdfBytes - 缓存的原始 PDF 字节
 * @param {Object} config - 响应式水印配置（会被 watch）
 * @returns {{ previewPages: import('vue').Ref<string[]>, isGenerating: import('vue').Ref<boolean>, refresh: () => void }}
 */
export function useWatermarkPreview(originalPdfBytes, config) {
  const previewPages = ref([])
  const isGenerating = ref(false)

  let debounceTimer = null
  let renderVersion = 0 // 版本号，用于取消过期的渲染任务

  /**
   * 防抖刷新预览
   */
  function refresh() {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => render(), 300)
  }

  /**
   * 核心渲染流程
   */
  async function render() {
    const bytes = originalPdfBytes.value
    if (!bytes) {
      previewPages.value = []
      return
    }

    const currentVersion = ++renderVersion
    isGenerating.value = true

    try {
      // 1. pdf-lib 生成带水印的 PDF（预览用较低 scale，提升速度）
      const watermarkedBytes = await createWatermarkedPdfBytes(bytes, config, {
        scale: 1.5,
        maxPages: MAX_PREVIEW_PAGES
      })

      // 检查是否已过期
      if (currentVersion !== renderVersion) return

      // 2. PDF.js 渲染为图片
      const images = await renderPdfToImages(watermarkedBytes)

      // 再次检查
      if (currentVersion !== renderVersion) return

      previewPages.value = images
    } catch (err) {
      console.error('[preview-renderer] 渲染失败:', err)
    } finally {
      if (currentVersion === renderVersion) {
        isGenerating.value = false
      }
    }
  }

  /**
   * 用 PDF.js 将 PDF 字节流渲染为 JPEG dataURL 数组
   */
  async function renderPdfToImages(pdfBytes) {
    const loadingTask = pdfjsLib.getDocument({data: pdfBytes})
    const pdf = await loadingTask.promise

    const images = []
    const pageCount = Math.min(pdf.numPages, MAX_PREVIEW_PAGES)

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({scale: 1.5})

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({canvasContext: ctx, viewport}).promise
      images.push(canvas.toDataURL('image/jpeg', 0.85))
    }

    return images
  }

  // watch config 的所有属性，变化时触发防抖刷新
  watch(
    () => ({
      text: config.text,
      fontSize: config.fontSize,
      color: config.color,
      opacity: config.opacity,
      rotation: config.rotation,
      gap: config.gap,
      offsetX: config.offsetX,
      offsetY: config.offsetY
    }),
    () => refresh(),
    {deep: true}
  )

  // 当原始 PDF 加载完成时，首次渲染
  watch(() => originalPdfBytes.value, (newVal) => {
    if (newVal) {
      render()
    } else {
      previewPages.value = []
    }
  })

  return {previewPages, isGenerating, refresh}
}
