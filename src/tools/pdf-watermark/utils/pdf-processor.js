import {PDFDocument, rgb, degrees, StandardFonts} from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'

// 配置 pdfjs worker
if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

/**
 * 处理PDF文件并生成预览
 * @param {File} file - PDF文件
 * @param {string} password - 密码（可选）
 * @returns {Promise<File[]>} - 预览图片文件数组
 */
export const processPDF = async (file, password = '') => {
    const arrayBuffer = await file.arrayBuffer()
    const pdfPassword = password || undefined

    let pdf
    try {
        // 优先使用pdfjs加载（对加密支持更好）
        pdf = await pdfjsLib.getDocument({
            data: arrayBuffer,
            password: pdfPassword
        }).promise
    } catch (pdfjsError) {
        // 如果pdfjs失败，尝试pdf-lib
        console.warn('pdfjs加载失败，尝试pdf-lib:', pdfjsError.message)

        try {
            const pdfDoc = await PDFDocument.load(arrayBuffer, {
                ignoreEncryption: true,
                password: pdfPassword
            })
            const pageCount = pdfDoc.getPageCount()

            if (pageCount === 0) {
                throw new Error('PDF文件不包含任何页面')
            }

            // 重新用pdfjs加载验证
            pdf = await pdfjsLib.getDocument({
                data: arrayBuffer,
                password: pdfPassword
            }).promise

        } catch (pdfLibError) {
            // 如果都失败，检查是否是密码错误
            if (pdfjsError.message.includes('password') ||
                pdfLibError.message.includes('password') ||
                pdfjsError.message.includes('encrypted') ||
                pdfLibError.message.includes('encrypted')) {
                throw new Error('密码错误，请重新输入')
            }
            throw pdfjsError
        }
    }

    // 渲染预览图
    const pages = []
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({scale: 1.5})
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.height = viewport.height
        canvas.width = viewport.width

        await page.render({canvasContext: context, viewport}).promise

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8))
        pages.push(new File([blob], `page-${i}.jpg`, {type: 'image/jpeg'}))
    }

    return pages
}

/**
 * 导出带水印的PDF
 * @param {File} pdfFile - 原始PDF文件
 * @param {Object} watermarkConfig - 水印配置
 * @param {string} password - PDF密码（可选）
 * @returns {Promise<Blob>} - 导出的PDF Blob
 */
export const exportWatermarkedPDF = async (pdfFile, watermarkConfig, password = '') => {
    const arrayBuffer = await pdfFile.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer, {password})

    // 检查水印文本是否包含中文字符
    const hasChinese = /[\u4e00-\u9fa5]/.test(watermarkConfig.text)

    if (hasChinese) {
        await addChineseWatermarkAsImage(pdfDoc, watermarkConfig)
    } else {
        await addEnglishWatermark(pdfDoc, watermarkConfig)
    }

    const pdfBytes = await pdfDoc.save()
    return new Blob([pdfBytes], {type: 'application/pdf'})
}

/**
 * 添加英文水印（使用标准字体）
 */
async function addEnglishWatermark(pdfDoc, config) {
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const pages = pdfDoc.getPages()

    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : {r: 0, g: 0, b: 0}
    }
    const c = hexToRgb(config.color)

    pages.forEach(page => {
        const {width, height} = page.getSize()
        for (let x = -width; x < width * 2; x += config.gap) {
            for (let y = -height; y < height * 2; y += config.gap) {
                page.drawText(config.text, {
                    x: x + config.offsetX,
                    y: y + config.offsetY,
                    size: config.fontSize,
                    font: font,
                    color: rgb(c.r, c.g, c.b),
                    opacity: config.opacity,
                    rotate: degrees(config.rotation),
                })
            }
        }
    })
}

/**
 * 添加中文水印（使用Canvas渲染为图片）
 */
async function addChineseWatermarkAsImage(pdfDoc, config) {
    const pages = pdfDoc.getPages()

    // 解析颜色
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : {r: 255, g: 0, b: 0}
    }
    const color = hexToRgb(config.color)

    // 为每一页创建水印图片
    for (const page of pages) {
        const {width, height} = page.getSize()

        // 创建Canvas来渲染水印
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        // 设置Canvas尺寸（使用较高的分辨率）
        const scale = 2
        canvas.width = width * scale
        canvas.height = height * scale

        // 设置背景为透明
        ctx.fillStyle = 'rgba(0, 0, 0, 0)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // 完全匹配预览图的SVG背景实现逻辑
        const gap = config.gap * scale
        const offsetX = config.offsetX * scale
        const offsetY = config.offsetY * scale

        // 创建单个SVG单元格（与预览图完全一致）
        const unitCanvas = document.createElement('canvas')
        const unitCtx = unitCanvas.getContext('2d')
        unitCanvas.width = gap
        unitCanvas.height = gap

        // 设置背景为透明
        unitCtx.fillStyle = 'rgba(0, 0, 0, 0)'
        unitCtx.fillRect(0, 0, gap, gap)

        // 关键：字体大小不乘以scale，与预览图保持一致
        const fontSize = config.fontSize
        unitCtx.font = `bold ${fontSize}px "Microsoft YaHei", "SimHei", "Noto Sans CJK SC", sans-serif`
        unitCtx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${config.opacity})`
        unitCtx.textAlign = 'center'
        unitCtx.textBaseline = 'middle'

        // 计算旋转中心
        const half = gap / 2
        const rotationRad = (config.rotation * Math.PI) / 180

        // 保存状态
        unitCtx.save()
        unitCtx.translate(half, half)
        unitCtx.rotate(rotationRad)
        unitCtx.fillText(config.text, 0, 0)
        unitCtx.restore()

        // 计算需要多少个单元格来覆盖整个页面
        const cols = Math.ceil(canvas.width / gap) + 2
        const rows = Math.ceil(canvas.height / gap) + 2

        // 绘制重复的背景
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * gap + offsetX
                const y = row * gap + offsetY

                if (x < canvas.width && y < canvas.height) {
                    ctx.drawImage(unitCanvas, x, y)
                }
            }
        }

        // 转换为PNG图片
        const pngDataUrl = canvas.toDataURL('image/png')
        const pngBytes = await fetch(pngDataUrl).then(res => res.arrayBuffer())
        const pngImage = await pdfDoc.embedPng(pngBytes)

        // 将图片添加到PDF页面
        page.drawImage(pngImage, {
            x: 0,
            y: 0,
            width: width,
            height: height,
            opacity: 1
        })
    }
}
