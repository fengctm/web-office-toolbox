/**
 * PDF Worker Manager
 * 管理 Web Worker 的生命周期，处理图片转 PDF 的异步操作
 */

export class PDFWorkerManager {
    constructor() {
        this.worker = null
        this.isProcessing = false
        this.callbacks = {
            onProgress: null,
            onComplete: null,
            onError: null,
            onCancel: null
        }
    }

    /**
     * 初始化 Worker
     */
    init() {
        if (this.worker) {
            this.terminate()
        }

        // 创建 Worker 实例
        const workerUrl = '/workers/pdf-generator.js'
        this.worker = new Worker(workerUrl, {type: 'module'})

        // 监听 Worker 消息
        this.worker.onmessage = (e) => {
            const {type, data} = e.data

            switch (type) {
                case 'progress':
                    // 确保 data 存在，避免解构错误
                    if (data) {
                        this.callbacks.onProgress?.(data)
                    } else {
                        this.callbacks.onProgress?.({
                            current: 0,
                            total: 0,
                            percentage: 0,
                            currentPage: 0,
                            message: '处理中...'
                        })
                    }
                    break
                case 'complete':
                    this.handleComplete(data)
                    break
                case 'cancelled':
                    this.callbacks.onCancel?.()
                    this.cleanup()
                    break
                case 'error':
                    this.callbacks.onError?.(data?.message || '未知错误', data?.error)
                    this.cleanup()
                    break
            }
        }

        // 监听 Worker 错误
        this.worker.onerror = (error) => {
            this.callbacks.onError?.('Worker 线程错误', error)
            this.cleanup()
        }

        // 监听 Worker 终止
        this.worker.onmessageerror = (error) => {
            this.callbacks.onError?.('Worker 消息错误', error)
            this.cleanup()
        }
    }

    /**
     * 开始处理图片
     * @param {Array} files - 文件对象数组
     * @param {Object} config - 配置对象
     */
    async start(files, config) {
        if (this.isProcessing) {
            throw new Error('Worker 已在处理中')
        }

        this.isProcessing = true
        this.init()

        // 准备文件数据（只传递必要信息）
        const fileData = await Promise.all(
            files.map(async (file) => ({
                name: file.name,
                type: file.type,
                size: file.size,
                arrayBuffer: await file.arrayBuffer()
            }))
        )

        // 发送开始消息
        this.worker.postMessage({
            type: 'start',
            data: {
                files: fileData,
                config,
                id: Date.now()
            }
        })
    }

    /**
     * 取消处理
     */
    cancel() {
        if (this.worker && this.isProcessing) {
            this.worker.postMessage({type: 'cancel'})
        }
    }

    /**
     * 处理完成
     */
    handleComplete(data) {
        if (!data || !data.processedImages) {
            this.callbacks.onError?.('Worker 返回数据格式错误', new Error('缺少 processedImages'))
            this.cleanup()
            return
        }

        const {processedImages, config} = data

        // 使用 pdf-lib 在主线程生成最终 PDF
        this.generateFinalPDF(processedImages, config)
            .then(() => {
                this.callbacks.onComplete?.()
                this.cleanup()
            })
            .catch((error) => {
                this.callbacks.onError?.('PDF 生成失败', error)
                this.cleanup()
            })
    }

    /**
     * 生成最终 PDF 文件
     */
    async generateFinalPDF(processedImages, config) {
        // 动态导入 pdf-lib（在主线程）
        const {PDFDocument, rgb} = await import('pdf-lib')

        const pdfDoc = await PDFDocument.create()

        for (const imgData of processedImages) {
            // 嵌入图片
            let pdfImage
            if (imgData.type === 'image/png') {
                pdfImage = await pdfDoc.embedPng(imgData.arrayBuffer)
            } else {
                pdfImage = await pdfDoc.embedJpg(imgData.arrayBuffer)
            }

            // 创建页面
            const page = pdfDoc.addPage([imgData.pageWidth, imgData.pageHeight])

            // 绘制图片
            page.drawImage(pdfImage, {
                x: imgData.x,
                y: imgData.y,
                width: imgData.drawWidth,
                height: imgData.drawHeight
            })

            // 添加页码
            const currentPage = processedImages.indexOf(imgData) + 1
            const totalPages = processedImages.length
            page.drawText(`${currentPage}/${totalPages}`, {
                x: imgData.pageWidth - 60,
                y: 20,
                size: 10,
                color: rgb(0.5, 0.5, 0.5)
            })
        }

        // 生成 PDF 字节
        const pdfBytes = await pdfDoc.save()

        // 创建 Blob 并下载
        const blob = new Blob([pdfBytes], {type: 'application/pdf'})
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${config.fileName || '图片转PDF'}.pdf`
        link.click()

        // 清理 URL
        URL.revokeObjectURL(url)
    }

    /**
     * 清理资源
     */
    cleanup() {
        this.isProcessing = false
        if (this.worker) {
            this.worker.terminate()
            this.worker = null
        }
    }

    /**
     * 终止 Worker
     */
    terminate() {
        if (this.worker) {
            this.worker.terminate()
            this.worker = null
        }
        this.isProcessing = false
    }

    /**
     * 设置回调函数
     */
    onProgress(callback) {
        this.callbacks.onProgress = callback
        return this
    }

    onComplete(callback) {
        this.callbacks.onComplete = callback
        return this
    }

    onError(callback) {
        this.callbacks.onError = callback
        return this
    }

    onCancel(callback) {
        this.callbacks.onCancel = callback
        return this
    }

    /**
     * 获取处理状态
     */
    getProcessingState() {
        return this.isProcessing
    }
}

// 单例模式导出
let instance = null

export function getWorkerManager() {
    if (!instance) {
        instance = new PDFWorkerManager()
    }
    return instance
}

export function destroyWorkerManager() {
    if (instance) {
        instance.terminate()
        instance = null
    }
}
