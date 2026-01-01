// PDF Generator Worker - 异步处理图片转PDF
// 修复：默认边距改为0，支持无边距全屏显示

// 全局状态
let isCancelled = false

// 监听主线程消息
self.onmessage = async (e) => {
    const {type, data} = e.data

    switch (type) {
        case 'start':
            isCancelled = false
            await processImages(data)
            break
        case 'cancel':
            isCancelled = true
            break
    }
}

/**
 * 处理图片队列
 */
async function processImages({files, config}) {
    console.log('开始处理图片队列...', config)
    try {
        // 发送初始化消息
        self.postMessage({
            type: 'progress',
            data: {
                current: 0,
                total: files.length,
                percentage: 0,
                currentPage: 0,
                message: '开始处理图片...'
            }
        })

        // 处理每张图片
        const processedImages = []

        for (let i = 0; i < files.length; i++) {
            if (isCancelled) {
                self.postMessage({type: 'cancelled'})
                return
            }

            const fileData = files[i]

            // 发送当前进度
            self.postMessage({
                type: 'progress',
                data: {
                    current: i + 1,
                    total: files.length,
                    percentage: Math.round(((i + 1) / files.length) * 100),
                    currentPage: i + 1,
                    message: `正在处理: ${fileData.name}`
                }
            })

            try {
                // [修复] 使用 ?? (Nullish Coalescing) 确保显式传入 0 时有效
                // [修复] 默认值改为 0，实现默认全屏/无白边
                const margins = {
                    top: config.marginTop ?? 0,
                    right: config.marginRight ?? 0,
                    bottom: config.marginBottom ?? 0,
                    left: config.marginLeft ?? 0
                }

                // 处理单张图片
                const processed = await processImage(
                    fileData,
                    config.pageSize,
                    config.compressionQuality || 0.92,
                    margins
                )

                processedImages.push(processed)

                // 短暂延迟，避免阻塞主线程
                await new Promise(resolve => setTimeout(resolve, 10))
            } catch (error) {
                console.warn(`图片处理失败: ${fileData.name}`, error)
                // 继续处理下一张，不中断整体流程
                continue
            }
        }

        // 发送处理完成的消息，包含所有处理后的图片数据
        self.postMessage({
            type: 'complete',
            processedImages: processedImages,
            config: config
        })

    } catch (error) {
        self.postMessage({
            type: 'error',
            message: error.message,
            error: error
        })
    }
}

/**
 * 处理单张图片
 */
async function processImage(fileData, pageSize, compressionQuality = 0.92, margins = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
}) {
    try {
        // 1. 使用 Blob 和 ImageBitmap 获取原始图片尺寸
        const blob = new Blob([fileData.arrayBuffer], {type: fileData.type})
        const imageBitmap = await createImageBitmap(blob)
        const originalWidth = imageBitmap.width
        const originalHeight = imageBitmap.height

        // 2. 计算 PDF 页面布局（包含边距）
        const dimensions = calculateDimensions(originalWidth, originalHeight, pageSize, margins)

        // 3. 强制转换为 JPEG 以确保兼容性
        const canvas = new OffscreenCanvas(originalWidth, originalHeight)
        const ctx = canvas.getContext('2d')

        // 填充白色背景，防止 PNG 透明部分转 JPEG 变黑
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, originalWidth, originalHeight)

        // 绘制图片到画布
        ctx.drawImage(imageBitmap, 0, 0)

        // 转换为 JPEG Blob（质量可配置）
        const jpegBlob = await canvas.convertToBlob({
            type: 'image/jpeg',
            quality: compressionQuality
        })

        // 转换为 Uint8Array 传输给主线程
        const uint8Array = new Uint8Array(await jpegBlob.arrayBuffer())

        // 释放资源
        imageBitmap.close()

        return {
            name: fileData.name,
            type: 'image/jpeg',
            arrayBuffer: uint8Array,
            originalWidth,
            originalHeight,
            ...dimensions
        }
    } catch (error) {
        console.warn(`无法处理图片: ${fileData.name}`, error)
        // 降级处理
        try {
            const uint8Array = new Uint8Array(fileData.arrayBuffer)
            return {
                name: fileData.name,
                type: fileData.type,
                arrayBuffer: uint8Array,
                originalWidth: 595.28,
                originalHeight: 841.89,
                ...calculateDimensions(595.28, 841.89, pageSize, margins)
            }
        } catch (e) {
            throw new Error(`图片处理失败: ${fileData.name}`)
        }
    }
}

/**
 * 计算 PDF 页面尺寸和图片绘制位置
 */
function calculateDimensions(imgWidth, imgHeight, pageSize, margins = {top: 0, right: 0, bottom: 0, left: 0}) {
    let pageWidth, pageHeight, drawWidth, drawHeight, x, y

    // 将边距从 mm 转换为点（1 mm = 2.83465 点）
    const marginTop = margins.top * 2.83465
    const marginRight = margins.right * 2.83465
    const marginBottom = margins.bottom * 2.83465
    const marginLeft = margins.left * 2.83465

    switch (pageSize) {
        case 'A4':
            pageWidth = 595.28
            pageHeight = 841.89
            break
        case '图片原始尺寸':
            // 保持图片比例，限制最大宽度为 A4 宽度（可配置是否缩放）
            // 这里逻辑：如果图片很大，缩小到适应 A4 宽；如果很小，保持原样
            const maxWidth = 595.28 - marginLeft - marginRight
            const scale = Math.min(1, maxWidth / imgWidth)

            pageWidth = imgWidth * scale + marginLeft + marginRight
            pageHeight = imgHeight * scale + marginTop + marginBottom

            drawWidth = imgWidth * scale
            drawHeight = imgHeight * scale

            x = marginLeft + (pageWidth - marginLeft - marginRight - drawWidth) / 2
            y = marginBottom + (pageHeight - marginTop - marginBottom - drawHeight) / 2

            return {pageWidth, pageHeight, drawWidth, drawHeight, x, y}

        case '适应屏幕':
            pageWidth = 600
            pageHeight = 600
            break
        default:
            pageWidth = 595.28
            pageHeight = 841.89
    }

    // 计算可用区域（扣除边距）
    const availableWidth = pageWidth - marginLeft - marginRight
    const availableHeight = pageHeight - marginTop - marginBottom

    // 保持图片比例，缩放以适应可用区域 (Contain 模式)
    // 如果您希望图片拉伸填满(不考虑比例)，请将 scale 改为 width/availableWidth 和 height/availableHeight 分别计算
    const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight)
    drawWidth = imgWidth * scale
    drawHeight = imgHeight * scale

    // 计算居中位置
    x = marginLeft + (availableWidth - drawWidth) / 2
    y = marginBottom + (availableHeight - drawHeight) / 2

    return {pageWidth, pageHeight, drawWidth, drawHeight, x, y}
}

// 错误处理
self.onerror = (error) => {
    self.postMessage({
        type: 'error',
        message: 'Worker 线程错误',
        error: error
    })
    return true
}
