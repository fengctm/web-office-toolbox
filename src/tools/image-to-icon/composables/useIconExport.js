import { ref } from 'vue'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'

/**
 * 图标导出 Composable
 */
export function useIconExport() {
  const isExporting = ref(false)
  const exportProgress = ref(0)

  /**
   * 下载单个图标
   */
  function downloadSingleIcon(icon) {
    saveAs(icon.blob, icon.fileName)
  }

  /**
   * 生成 README 文件内容
   */
  function generateReadme(groupedIcons, baseFileName) {
    let content = `图标导出说明\n`
    content += `${'='.repeat(50)}\n\n`
    content += `基础文件名: ${baseFileName}\n`
    content += `导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`

    Object.entries(groupedIcons).forEach(([format, icons]) => {
      content += `\n【${format.toUpperCase()} 格式】\n`
      content += `${'-'.repeat(30)}\n`
      icons.forEach(icon => {
        if (format === 'ico' && icon.sizes) {
          content += `  - ${icon.fileName} (包含尺寸: ${icon.sizes.join(', ')}px)\n`
        } else {
          content += `  - ${icon.fileName} (${icon.size}x${icon.size})\n`
        }
      })
    })

    content += `\n${'='.repeat(50)}\n`
    content += `使用说明:\n`
    content += `1. PNG: 通用格式，支持透明背景\n`
    content += `2. WebP: 现代格式，体积更小，质量更好\n`
    content += `3. ICO: Windows 网站图标格式\n`
    content += `4. SVG: 矢量格式（封装 PNG，非真正矢量）\n`

    return content
  }

  /**
   * 打包下载所有图标
   */
  async function downloadAllIcons(icons, baseFileName = 'icon') {
    isExporting.value = true
    exportProgress.value = 0

    try {
      const zip = new JSZip()

      // 按格式分组
      const groupedIcons = icons.reduce((groups, icon) => {
        if (!groups[icon.format]) {
          groups[icon.format] = []
        }
        groups[icon.format].push(icon)
        return groups
      }, {})

      // 添加文件到 ZIP（按格式分文件夹）
      Object.entries(groupedIcons).forEach(([format, formatIcons]) => {
        const folder = zip.folder(format)
        formatIcons.forEach((icon, index) => {
          folder.file(icon.fileName, icon.blob)
        })

        // 更新进度
        exportProgress.value = Math.round(
          (Object.keys(groupedIcons).indexOf(format) / Object.keys(groupedIcons).length) * 80
        )
      })

      // 生成 README
      const readmeContent = generateReadme(groupedIcons, baseFileName)
      zip.file('README.txt', readmeContent)

      exportProgress.value = 90

      // 生成 ZIP 文件
      const content = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      })

      exportProgress.value = 100

      // 下载（不添加 -icons 后缀）
      saveAs(content, `${baseFileName}.zip`)

      return true
    } catch (error) {
      console.error('Error exporting icons:', error)
      throw error
    } finally {
      isExporting.value = false
      exportProgress.value = 0
    }
  }

  /**
   * 生成 HTML 代码（用于网站 favicon）
   */
  function generateFaviconHtml(icons) {
    const pngIcon = icons.find(i => i.format === 'png' && i.size === 32)
    const icoIcon = icons.find(i => i.format === 'ico')
    const svgIcon = icons.find(i => i.format === 'svg')

    let html = '<!-- Favicon HTML Code -->\n'

    if (icoIcon) {
      html += `<link rel="icon" type="image/x-icon" href="/favicon.ico">\n`
    }

    if (pngIcon) {
      html += `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n`
    }

    const png192 = icons.find(i => i.format === 'png' && i.size === 192)
    if (png192) {
      html += `<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png">\n`
    }

    if (svgIcon) {
      html += `<link rel="icon" type="image/svg+xml" href="/favicon.svg">\n`
    }

    html += '<!-- Apple Touch Icon -->\n'
    const png180 = icons.find(i => i.format === 'png' && i.size === 180)
    if (png180) {
      html += `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">\n`
    }

    return html
  }

  return {
    isExporting,
    exportProgress,
    downloadSingleIcon,
    downloadAllIcons,
    generateFaviconHtml
  }
}
