/**
 * SVG 转换器逻辑 composable
 * 负责 SVG 代码处理、图像转换和文件下载
 */

import {ref} from 'vue'

export function useSvgConverter() {
    // 状态变量
    const svgCode = ref('')
    const exportFormat = ref('PNG')
    const isFullscreen = ref(false)

    /**
     * 处理 SVG 代码输入 - 自动清理
     */
    const handleSvgInput = () => {
        if (svgCode.value) {
            svgCode.value = svgCode.value.trim()
        }
    }

    /**
     * 将 SVG 代码转换为图像并下载
     * @param {Function} showSnackbar - 通知回调
     */
    const handleDownloadImage = async (showSnackbar) => {
        if (!svgCode.value) {
            showSnackbar('请先输入SVG代码', 'warning')
            return
        }

        try {
            // 创建临时容器来解析SVG
            const parser = new DOMParser()
            const svgDoc = parser.parseFromString(svgCode.value, 'image/svg+xml')
            const svgElement = svgDoc.documentElement

            // 检查解析是否成功
            if (svgElement.nodeName === 'parsererror') {
                throw new Error('SVG代码格式错误，请检查')
            }

            // 获取SVG尺寸，如果没有则使用默认值
            const width = parseInt(svgElement.getAttribute('width')) || 500
            const height = parseInt(svgElement.getAttribute('height')) || 500

            // 创建Canvas
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')

            // 如果是JPG格式，先填充白色背景
            if (exportFormat.value === 'JPG') {
                ctx.fillStyle = '#FFFFFF'
                ctx.fillRect(0, 0, width, height)
            }

            // 将SVG转换为图片
            const svgString = new XMLSerializer().serializeToString(svgElement)
            const svgBlob = new Blob([svgString], {type: 'image/svg+xml'})
            const url = URL.createObjectURL(svgBlob)

            const img = new Image()
            img.onload = () => {
                ctx.drawImage(img, 0, 0, width, height)
                URL.revokeObjectURL(url)

                // 转换为指定格式并下载
                const mimeType = {
                    'PNG': 'image/png',
                    'JPG': 'image/jpeg',
                    'WEBP': 'image/webp'
                }[exportFormat.value]

                canvas.toBlob((blob) => {
                    const downloadUrl = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = downloadUrl
                    link.download = `converted.${exportFormat.value.toLowerCase()}`
                    link.click()
                    URL.revokeObjectURL(downloadUrl)
                    showSnackbar('图片下载成功！', 'success')
                }, mimeType, 0.95)
            }

            img.onerror = () => {
                URL.revokeObjectURL(url)
                throw new Error('SVG渲染失败，请检查代码')
            }

            img.src = url

        } catch (error) {
            console.error('转换失败:', error)
            showSnackbar(error.message || '转换失败', 'error')
        }
    }

    /**
     * 下载原始 SVG 文件
     * @param {Function} showSnackbar - 通知回调
     */
    const handleDownloadSvg = (showSnackbar) => {
        if (!svgCode.value) {
            showSnackbar('请先输入SVG代码', 'warning')
            return
        }

        try {
            const blob = new Blob([svgCode.value], {type: 'image/svg+xml'})
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'image.svg'
            link.click()
            URL.revokeObjectURL(url)
            showSnackbar('SVG文件下载成功！', 'success')
        } catch (error) {
            console.error('下载失败:', error)
            showSnackbar('下载失败', 'error')
        }
    }

    /**
     * 清空输入
     * @param {Function} showSnackbar - 通知回调
     */
    const handleClear = (showSnackbar) => {
        svgCode.value = ''
        showSnackbar('已清空输入', 'info')
    }

    /**
     * 显示帮助信息
     */
    const handleHelp = () => {
        const helpText = `
使用说明：
1. 在左侧粘贴SVG代码（以 <svg> 开头）
2. 右侧实时预览效果
3. 选择导出格式（PNG/JPG/WEBP）
4. 点击"下载图像"转换并下载
5. 点击"保存为.svg文件"下载原始代码

提示：
- JPG格式会自动添加白色背景
- 点击预览区可全屏查看
- 支持深色模式
- 所有处理在本地完成，保护隐私
    `.trim()

        alert(helpText)
    }

    return {
        // 状态
        svgCode,
        exportFormat,
        isFullscreen,

        // 方法
        handleSvgInput,
        handleDownloadImage,
        handleDownloadSvg,
        handleClear,
        handleHelp
    }
}