import {degrees, PDFDocument, rgb, StandardFonts} from 'pdf-lib'
import {generateWatermarkCanvas, drawWatermarkBackground, hexToRgba} from './watermark-generator.js'

/**
 * 导出带水印的PDF
 * @param {File|Blob} pdfFile - 原始PDF文件或Blob
 * @param {Object} watermarkConfig - 水印配置
 * @param {string} password - PDF密码（可选）
 * @returns {Promise<Blob>} - 导出的PDF Blob
 */
export const exportWatermarkedPDF = async (pdfFile, watermarkConfig, password = '') => {
    // 将File或Blob转换为ArrayBuffer
    let arrayBuffer
    if (pdfFile instanceof Blob) {
        arrayBuffer = await pdfFile.arrayBuffer()
    } else if (pdfFile instanceof File) {
        arrayBuffer = await pdfFile.arrayBuffer()
    } else {
        arrayBuffer = pdfFile
    }

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
 * 使用统一的水印布局计算
 */
async function addEnglishWatermark(pdfDoc, config) {
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const pages = pdfDoc.getPages()

    // 颜色转换
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : {r: 0, g: 0, b: 0}
    }
    const c = hexToRgb(config.color)

    // 为每一页添加水印
    pages.forEach(page => {
        const {width, height} = page.getSize()

        // 使用统一的布局计算
        const watermarks = calculateWatermarkPositions(config, width, height)

        watermarks.forEach(wm => {
            page.drawText(config.text, {
                x: wm.x,
                y: wm.y,
                size: config.fontSize,
                font: font,
                color: rgb(c.r, c.g, c.b),
                opacity: config.opacity,
                // 注意：这里取反角度是为了与 SVG/Canvas 预览保持一致
                // SVG: rotate(rotation) - 正角度=顺时针
                // Canvas: rotate(-rotation) - 正角度=逆时针（代码中已取反）
                // PDF: degrees(-rotation) - 正角度=逆时针
                // 这样三者都能正确显示相同的旋转方向
                rotate: degrees(-config.rotation),
            })
        })
    })
}

/**
 * 添加中文水印（使用Canvas渲染为图片）
 * 使用统一的水印生成器
 */
async function addChineseWatermarkAsImage(pdfDoc, config) {
    const pages = pdfDoc.getPages()

    // 为每一页创建水印图片
    for (const page of pages) {
        const {width, height} = page.getSize()

        // 1. 创建高分辨率 Canvas（PDF 页面尺寸 × 2）
        const scale = 2
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = width * scale
        canvas.height = height * scale

        // 清空画布（透明背景）
        ctx.fillStyle = 'rgba(0, 0, 0, 0)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // 2. 使用统一的水印生成器创建单元格
        const unitCanvas = await generateWatermarkCanvas(config, scale)

        // 3. 使用统一的绘制函数
        drawWatermarkBackground(canvas, unitCanvas, {
            ...config,
            gap: config.gap * scale,
            offsetX: config.offsetX * scale,
            offsetY: config.offsetY * scale
        })

        // 4. 转换为 PNG 并嵌入 PDF
        const pngDataUrl = canvas.toDataURL('image/png')
        const pngBytes = await fetch(pngDataUrl).then(res => res.arrayBuffer())
        const pngImage = await pdfDoc.embedPng(pngBytes)

        // 5. 将图片添加到 PDF 页面
        page.drawImage(pngImage, {
            x: 0,
            y: 0,
            width: width,
            height: height,
            opacity: 1
        })
    }
}

/**
 * 计算水印位置（用于英文水印）
 * 使用与统一生成器相同的逻辑
 */
function calculateWatermarkPositions(config, containerWidth, containerHeight) {
    const { gap, offsetX, offsetY } = config;

    const watermarks = [];

    // 计算需要覆盖的范围（超出容器边缘）
    const startX = -gap;
    const endX = containerWidth + gap;
    const startY = -gap;
    const endY = containerHeight + gap;

    // 遍历网格
    for (let x = startX; x <= endX; x += gap) {
        for (let y = startY; y <= endY; y += gap) {
            watermarks.push({
                x: x + offsetX,
                y: y + offsetY
            });
        }
    }

    return watermarks;
}
