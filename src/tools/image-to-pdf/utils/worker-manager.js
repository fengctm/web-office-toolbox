/**
 * PDF Worker Manager
 * 修复：针对新版 Safari/iOS 的下载策略优化
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

        // 确保路径正确
        const workerUrl = new URL('/workers/pdf-generator.js', import.meta.url)
        this.worker = new Worker(workerUrl, {type: 'module'})

        this.worker.onmessage = (e) => {
            const message = e.data
            const type = message.type
            const data = message.data

            switch (type) {
                case 'progress':
                    this.callbacks.onProgress?.(data)
                    break
                case 'complete':
                    this.handleComplete(message)
                    break
                case 'error':
                    this.callbacks.onError?.(message.message || '未知错误', message.error)
                    this.cleanup()
                    break
                case 'cancelled':
                    this.callbacks.onCancel?.()
                    this.cleanup()
                    break
            }
        }

        this.worker.onerror = (err) => {
            this.callbacks.onError?.('Worker 内部错误', err)
            this.cleanup()
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

            if (!config.compressionQuality) {
                config.compressionQuality = 0.92
            }

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
        const {PDFDocument, rgb} = await import('pdf-lib')
        const pdfDoc = await PDFDocument.create()

        for (let i = 0; i < processedImages.length; i++) {
            const imgData = processedImages[i]
            let pdfImage

            try {
                if (imgData.type === 'image/png') {
                    pdfImage = await pdfDoc.embedPng(imgData.arrayBuffer)
                } else {
                    pdfImage = await pdfDoc.embedJpg(imgData.arrayBuffer)
                }

                const page = pdfDoc.addPage([imgData.pageWidth, imgData.pageHeight])
                page.drawImage(pdfImage, {
                    x: imgData.x,
                    y: imgData.y,
                    width: imgData.drawWidth,
                    height: imgData.drawHeight
                })

                // 添加页码 (颜色稍微柔和一点，适配深色背景阅读)
                page.drawText(`${i + 1}/${processedImages.length}`, {
                    x: imgData.pageWidth / 2 - 10,
                    y: 15,
                    size: 9,
                    color: rgb(0.5, 0.5, 0.5)
                })
            } catch (embedError) {
                console.error(`第 ${i + 1} 张图片嵌入失败:`, embedError)
            }
        }

        const pdfBytes = await pdfDoc.save()
        const blob = new Blob([pdfBytes], {type: 'application/pdf'})

        const autoFileName = config.fileName || `图片转PDF_${processedImages.length}张.pdf`

        // 触发下载/预览逻辑
        this.handleDownload(blob, autoFileName)
    }

    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    }

    /**
     * 核心：修复 Safari 下载问题
     */
    handleDownload(blob, fileName) {
        const url = URL.createObjectURL(blob)

        // 1. 桌面端 / Android：尝试标准下载
        if (!this.isIOS()) {
            const link = document.createElement('a')
            link.href = url
            link.download = fileName
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            setTimeout(() => URL.revokeObjectURL(url), 1000)
            return
        }

        // 2. iOS Safari 策略
        // 使用 window.open 强制在新标签页打开，确保工具栏可见
        // 不要使用 <a> 标签点击，否则经常在当前页预览且无工具栏
        const opened = window.open(url, '_blank')

        if (opened) {
            // 成功打开新窗口
            this.showIOSSuccessGuide(fileName, () => {
                URL.revokeObjectURL(url)
                this.callbacks.onComplete?.()
                this.cleanup()
            })
        } else {
            // 弹窗被拦截（极其罕见，通常是用户没在点击事件中触发）
            console.error('无法打开新窗口，可能是被拦截')
            this.showIOSManualLink(url, fileName)
        }
    }

    /**
     * iOS 成功打开预览后的引导界面
     */
    showIOSSuccessGuide(fileName, cleanupCallback) {
        // 创建全屏遮罩
        const overlay = document.createElement('div')
        overlay.className = 'ios-download-guide-overlay'

        // 内部 HTML 结构
        overlay.innerHTML = `
            <div class="guide-card">
                <div class="icon-success">✓</div>
                <h2 class="guide-title">PDF 已生成</h2>
                <p class="guide-filename">${fileName}</p>
                
                <div class="guide-steps">
                    <p>请在新打开的页面中进行操作：</p>
                    <div class="step-item">
                        <span class="step-num">1</span>
                        <span>点击底部中间的<span class="highlight">分享图标</span> <span style="font-size:20px; vertical-align: middle;">⎋</span></span>
                    </div>
                    <div class="step-item">
                        <span class="step-num">2</span>
                        <span>向下滑动并选择 <span class="highlight">"存储到"文件"</span></span>
                    </div>
                </div>

                <button class="btn-close" id="guideCloseBtn">我知道了</button>
            </div>
        `

        // 插入样式
        const style = document.createElement('style')
        style.textContent = `
            .ios-download-guide-overlay {
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(8px);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                animation: fadeIn 0.3s ease;
            }
            .guide-card {
                background: #ffffff;
                width: 90%;
                max-width: 400px;
                border-radius: 24px;
                padding: 32px 24px;
                box-sizing: border-box;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                animation: slideUp 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
            }
            .icon-success {
                width: 60px; height: 60px;
                background: #e8f5e9;
                color: #43a047;
                font-size: 32px;
                font-weight: bold;
                line-height: 60px;
                border-radius: 50%;
                margin: 0 auto 16px;
            }
            .guide-title {
                margin: 0 0 8px;
                color: #1d1b20;
                font-size: 22px;
            }
            .guide-filename {
                margin: 0 0 24px;
                color: #49454f;
                font-size: 14px;
                word-break: break-all;
                padding: 0 10px;
            }
            .guide-steps {
                text-align: left;
                background: #f7f2fa;
                padding: 20px;
                border-radius: 16px;
                margin-bottom: 24px;
            }
            .guide-steps p {
                margin: 0 0 12px;
                font-size: 14px;
                color: #322f35;
                font-weight: 500;
            }
            .step-item {
                display: flex;
                align-items: flex-start;
                margin-bottom: 10px;
                font-size: 13px;
                color: #49454f;
                line-height: 1.5;
            }
            .step-item:last-child { margin-bottom: 0; }
            .step-num {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 18px; height: 18px;
                background: #6750a4;
                color: white;
                border-radius: 50%;
                font-size: 11px;
                margin-right: 8px;
                margin-top: 2px;
            }
            .highlight { color: #6750a4; font-weight: 600; }
            .btn-close {
                width: 100%;
                padding: 14px;
                background: #6750a4;
                color: white;
                border: none;
                border-radius: 20px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: opacity 0.2s;
            }
            .btn-close:active { opacity: 0.8; }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `

        document.head.appendChild(style)
        document.body.appendChild(overlay)

        // 绑定关闭事件
        document.getElementById('guideCloseBtn').onclick = () => {
            overlay.remove()
            style.remove()
            cleanupCallback()
        }
    }

    /**
     * 极罕见降级方案：如果 window.open 失败，显示手动链接
     */
    showIOSManualLink(url, fileName) {
        alert('Safari 拦截了自动打开，请点击下方的链接手动打开。')
        const a = document.createElement('a')
        a.href = url
        a.textContent = `点此打开: ${fileName}`
        a.target = '_blank'
        a.style.display = 'block'
        a.style.marginTop = '20px'
        a.style.padding = '20px'
        a.style.background = '#eee'
        document.body.appendChild(a)
        // 不立即 revoke，等用户操作
        setTimeout(() => URL.revokeObjectURL(url), 60000)
    }

    handleComplete(data) {
        if (!data?.processedImages) {
            this.callbacks.onError?.('数据损坏')
            return
        }
        this.generateFinalPDF(data.processedImages, data.config)
            .catch(err => {
                // 这里的 catch 已经在 generateFinalPDF 内部处理了大部分，主要是兜底
                this.callbacks.onError?.('PDF处理异常', err)
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
