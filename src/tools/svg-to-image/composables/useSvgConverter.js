/**
 * SVG 转换器增强状态与核心逻辑 composable
 */

import { ref, reactive, computed, watch } from 'vue'
import { parseSvgMetadata, SAMPLE_SVGS } from '../utils/svgUtils.js'

export function useSvgConverter() {
  // SVG 源码（默认加载精美的科技指南针示例）
  const svgCode = ref(SAMPLE_SVGS[0].code)

  // 语法解析与元数据提取
  const metadata = ref(parseSvgMetadata(svgCode.value))

  // 监听源码变更，防抖实时解析元数据
  let parseTimer = null
  watch(
    () => svgCode.value,
    (newVal) => {
      clearTimeout(parseTimer)
      parseTimer = setTimeout(() => {
        metadata.value = parseSvgMetadata(newVal)
        if (metadata.value.valid && exportConfig.scale === 'custom') {
          if (!exportConfig.customWidth) exportConfig.customWidth = metadata.value.width
          if (!exportConfig.customHeight) exportConfig.customHeight = metadata.value.height
        }
      }, 80)
    },
    { immediate: true }
  )

  // 导出配置
  const exportConfig = reactive({
    format: 'PNG',
    scale: 2, // 默认 2x 高清
    customWidth: 500,
    customHeight: 500,
    lockAspect: true,
    quality: 0.95
  })

  // 布局状态与偏好记忆
  const layoutDirection = ref(localStorage.getItem('svg_tool_direction') || 'horizontal')
  const splitRatio = ref(Number(localStorage.getItem('svg_tool_split_ratio')) || 45)
  const isWorkbenchMaximized = ref(false)
  const isFullscreen = ref(false)
  const isExporting = ref(false)

  // 切换布局方向
  const toggleLayoutDirection = () => {
    layoutDirection.value = layoutDirection.value === 'horizontal' ? 'vertical' : 'horizontal'
    localStorage.setItem('svg_tool_direction', layoutDirection.value)
  }

  // 切换工作台最大化视口
  const toggleWorkbenchMaximized = () => {
    isWorkbenchMaximized.value = !isWorkbenchMaximized.value
  }

  // 监听分栏比例保存
  watch(
    () => splitRatio.value,
    (val) => {
      localStorage.setItem('svg_tool_split_ratio', String(val))
    }
  )

  /**
   * 将 SVG 代码高保真转换为位图并下载
   * @param {Function} showSnackbar - 提示回调
   */
  const handleDownloadImage = async (showSnackbar) => {
    if (!svgCode.value || !metadata.value.valid) {
      showSnackbar?.('SVG 代码存在格式错误，无法导出', 'warning')
      return
    }

    isExporting.value = true

    try {
      // 1. 确定导出分辨率像素尺寸
      const baseW = metadata.value.width || 500
      const baseH = metadata.value.height || 500
      let targetW = baseW
      let targetH = baseH

      if (exportConfig.scale === 'custom') {
        targetW = exportConfig.customWidth || baseW
        targetH = exportConfig.customHeight || baseH
      } else {
        const mult = Number(exportConfig.scale) || 1
        targetW = Math.round(baseW * mult)
        targetH = Math.round(baseH * mult)
      }

      // 2. 创建并解析带有明确宽高的 SVG 字符串用于 Image 渲染
      const parser = new DOMParser()
      const svgDoc = parser.parseFromString(svgCode.value, 'image/svg+xml')
      const svgEl = svgDoc.documentElement

      svgEl.setAttribute('width', String(targetW))
      svgEl.setAttribute('height', String(targetH))

      // 3. 创建离屏 Canvas
      const canvas = document.createElement('canvas')
      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext('2d')

      // JPG 格式预先填充纯白背景
      if (exportConfig.format === 'JPG') {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, targetW, targetH)
      }

      // 4. 将 SVG 序列化为 Blob URL 并加载为 Image
      const svgStr = new XMLSerializer().serializeToString(svgEl)
      const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)

      const img = new Image()

      await new Promise((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, targetW, targetH)
          URL.revokeObjectURL(url)
          resolve()
        }
        img.onerror = (e) => {
          URL.revokeObjectURL(url)
          reject(new Error('SVG 栅格化渲染失败，请检查 SVG 语法或外部链接资源'))
        }
        img.src = url
      })

      // 5. 导出对应格式的 Blob 并触发下载
      const mimeType = {
        PNG: 'image/png',
        JPG: 'image/jpeg',
        WEBP: 'image/webp'
      }[exportConfig.format] || 'image/png'

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            showSnackbar?.('生成图像数据失败', 'error')
            isExporting.value = false
            return
          }
          const downloadUrl = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = `svg_export_${targetW}x${targetH}.${exportConfig.format.toLowerCase()}`
          link.click()
          URL.revokeObjectURL(downloadUrl)
          showSnackbar?.(`成功导出 ${targetW}×${targetH} px 高清图像！`, 'success')
          isExporting.value = false
        },
        mimeType,
        exportConfig.quality
      )
    } catch (err) {
      console.error('导出失败:', err)
      showSnackbar?.(err.message || '导出图像时发生异常', 'error')
      isExporting.value = false
    }
  }

  /**
   * 下载原始 .svg 文本文件
   * @param {Function} showSnackbar - 提示回调
   */
  const handleDownloadSvg = (showSnackbar) => {
    if (!svgCode.value) {
      showSnackbar?.('SVG 代码为空', 'warning')
      return
    }

    try {
      const blob = new Blob([svgCode.value], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'vector_graphic.svg'
      link.click()
      URL.revokeObjectURL(url)
      showSnackbar?.('SVG 源文件下载成功！', 'success')
    } catch (err) {
      showSnackbar?.('下载 SVG 失败', 'error')
    }
  }

  /**
   * 帮助弹窗
   */
  const handleHelp = () => {
    const helpText = `
SVG 图像转换与可视化编辑器使用指南：

1. 【专业代码编辑】
   - 支持 XML/SVG 语法高亮、自动行号、代码折叠与格式化美化。
   - 实时语法校验：若标签不闭合或格式有误，底部状态栏与画布会给出明确提示。

2. 【超大视野与灵活布局】
   - 拖拽中间分栏条可自由调整左右/上下区域占比，双击分栏条可一键 50% 复位。
   - 顶部工具栏支持一键切换「左右分栏」与「上下分栏」。
   - 点击「沉浸工作台」图标可使工作区铺满视口，最大化利用大屏幕。

3. 【交互式预览画布】
   - 鼠标滚轮可无级缩放画布（10% ~ 1000%）。
   - 按住鼠标左键即可拖动画布平移，配合悬浮胶囊可一键适应视口或复位 100%。
   - 支持在透明棋盘格、纯白、纯黑及自定义背景之间自由切换。

4. 【高清位图与源码导出】
   - 支持 1x、2x、3x、4x 或自定义像素超采样高清渲染，告别模糊锯齿。
   - 支持 PNG、JPG（纯白底）、WEBP（支持压缩质量调节）与 .SVG 矢量文件。
    `.trim()

    alert(helpText)
  }

  return {
    svgCode,
    metadata,
    exportConfig,
    layoutDirection,
    splitRatio,
    isWorkbenchMaximized,
    isFullscreen,
    isExporting,
    toggleLayoutDirection,
    toggleWorkbenchMaximized,
    handleDownloadImage,
    handleDownloadSvg,
    handleHelp
  }
}