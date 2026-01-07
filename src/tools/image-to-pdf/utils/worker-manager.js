/**
 * PDF Worker Manager
 * 极简版：直接下载或预览
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

    init() {
        if (this.worker) this.terminate()
        const workerUrl = new URL('/workers/pdf-generator.js', import.meta.url)
        this.worker = new Worker(workerUrl, {type: 'module'})

        this.worker.onmessage = (e) => {
            const {type, data, message, error} = e.data
            switch (type) {
                case 'progress':
                    this.callbacks.onProgress?.(data);
                    break
                case 'complete':
                    this.handleComplete(e.data);
                    break
                case 'error':
                    this.callbacks.onError?.(message || '未知错误', error)
                    this.cleanup()
                    break
                case 'cancelled':
                    this.callbacks.onCancel?.()
                    this.cleanup()
                    break
            }
        }
    }

    async start(files, config) {
        if (this.isProcessing) throw new Error('任务正在处理中')
        this.isProcessing = true
        this.init()

        try {
            const transferables = []
            const fileData = await Promise.all(
                files.map(async (file) => {
                    const arrayBuffer = await file.arrayBuffer()
                    transferables.push(arrayBuffer)
                    return {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        arrayBuffer: arrayBuffer
                    }
                })
            )

            config.compressionQuality = config.compressionQuality ?? 0.92
            // 简化边距逻辑
            const margin = config.pageMargin ?? 0
            config.marginTop = config.marginTop ?? margin
            config.marginRight = config.marginRight ?? margin
            config.marginBottom = config.marginBottom ?? margin
            config.marginLeft = config.marginLeft ?? margin

            this.worker.postMessage({
                type: 'start',
                data: {files: fileData, config}
            }, transferables)

        } catch (error) {
            this.cleanup()
            throw error
        }
    }

    async generateFinalPDF(processedImages, config) {
        const {PDFDocument} = await import('pdf-lib')
        const pdfDoc = await PDFDocument.create()

        for (const imgData of processedImages) {
            try {
                const pdfImage = imgData.type === 'image/png'
                    ? await pdfDoc.embedPng(imgData.arrayBuffer)
                    : await pdfDoc.embedJpg(imgData.arrayBuffer)

                const page = pdfDoc.addPage([imgData.pageWidth, imgData.pageHeight])
                page.drawImage(pdfImage, {
                    x: imgData.x, y: imgData.y,
                    width: imgData.drawWidth, height: imgData.drawHeight
                })
            } catch (e) {
                console.error('图片嵌入失败', e)
            }
        }

        const pdfBytes = await pdfDoc.save({useObjectStreams: true, addDefaultPage: false})
        const blob = new Blob([pdfBytes], {type: 'application/pdf'})
        const fileName = config.fileName || `Document_${Date.now()}.pdf`

        this.handleDownload(blob, fileName)
    }

    /**
     * 核心修复：直接打开/下载
     */
    handleDownload(blob, fileName) {
        const url = URL.createObjectURL(blob)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

        if (isIOS) {
            // iOS Safari 最佳实践：直接跳转到 Blob URL，浏览器会自动识别为 PDF 预览
            // 这比 window.open 更不容易被拦截
            window.location.href = url
        } else {
            // 桌面端/安卓：静默下载
            const link = document.createElement('a')
            link.href = url
            link.download = fileName
            link.style.display = 'none'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }

        // 延迟释放，确保浏览器已读取数据
        setTimeout(() => URL.revokeObjectURL(url), 5000)
        this.callbacks.onComplete?.()
        this.cleanup()
    }

    handleComplete(data) {
        if (!data?.processedImages) return this.cleanup()
        this.generateFinalPDF(data.processedImages, data.config)
            .catch(err => {
                this.callbacks.onError?.('PDF生成失败', err)
                this.cleanup()
            })
    }

    cancel() {
        if (this.worker) this.worker.postMessage({type: 'cancel'})
    }

    cleanup() {
        this.isProcessing = false
        if (this.worker) {
            this.worker.terminate()
            this.worker = null
        }
    }

    // 链式调用注册
    onProgress(cb) {
        this.callbacks.onProgress = cb;
        return this
    }

    onComplete(cb) {
        this.callbacks.onComplete = cb;
        return this
    }

    onError(cb) {
        this.callbacks.onError = cb;
        return this
    }

    onCancel(cb) {
        this.callbacks.onCancel = cb;
        return this
    }
}

let managerInstance = null

export function getWorkerManager() {
    if (!managerInstance) managerInstance = new PDFWorkerManager()
    return managerInstance
}