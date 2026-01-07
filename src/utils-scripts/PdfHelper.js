import {PDFDocument} from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'

// 配置 Worker (建议在项目入口处也配置一次)
// 如果是在 Vite 环境下，可以使用以下方式配置：
// pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

export class PDFHelper {
    /**
     * 1. 验证是否为合法的 PDF 文件
     * @param {File|Blob|ArrayBuffer} file
     * @returns {Promise<boolean>}
     */
    static async isValidPDF(file) {
        try {
            const buffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer()
            const header = new Uint8Array(buffer.slice(0, 5))
            const headerString = String.fromCharCode(...header)
            return headerString === '%PDF-'
        } catch (e) {
            return false
        }
    }

    /**
     * 2. 解析 PDF (获取 pdfjs 实例)
     * 自动处理加密检测
     * @returns {Promise<{pdf: any, isEncrypted: boolean}>}
     */
    static async getPdfjsInstance(file, password = '') {
        const data = file instanceof ArrayBuffer ? file : await file.arrayBuffer()
        try {
            const loadingTask = pdfjsLib.getDocument({
                data,
                password,
                // 允许处理损坏的 PDF
                stopAtErrors: false
            })
            const pdf = await loadingTask.promise
            return {pdf, isEncrypted: false}
        } catch (err) {
            if (err.name === 'PasswordException') {
                return {pdf: null, isEncrypted: true, message: err.message}
            }
            throw err
        }
    }

    /**
     * 3. 验证密码是否正确
     * @returns {Promise<boolean>}
     */
    static async verifyPassword(file, password) {
        try {
            const {isEncrypted} = await this.getPdfjsInstance(file, password)
            // 如果没有报错且返回 isEncrypted 为 false，说明密码正确解开了文档
            return !isEncrypted
        } catch (e) {
            return false
        }
    }

    /**
     * 4. 获取 PDF 基本信息
     * 包括：页数、元数据、是否加密、各页尺寸
     */
    static async getInfo(file, password = '') {
        const {pdf, isEncrypted} = await this.getPdfjsInstance(file, password)
        if (isEncrypted) return {isEncrypted: true, pageCount: 0}

        const meta = await pdf.getMetadata()
        const numPages = pdf.numPages
        const pages = []

        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i)
            const {width, height, rotation} = page.getViewport({scale: 1})
            pages.push({index: i, width, height, rotation})
        }

        return {
            isEncrypted: false,
            pageCount: numPages,
            title: meta.info?.Title || '',
            author: meta.info?.Author || '',
            creator: meta.info?.Creator || '',
            pages
        }
    }

    /**
     * 5. 将 PDF 转换为图片序列 (预览用)
     * @param {number} scale 缩放比例，默认 1.5
     */
    static async renderToImages(file, password = '', scale = 1.5) {
        const {pdf} = await this.getPdfjsInstance(file, password)
        const images = []

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            const viewport = page.getViewport({scale})

            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d')
            canvas.width = viewport.width
            canvas.height = viewport.height

            await page.render({canvasContext: context, viewport}).promise

            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
            images.push(new File([blob], `page-${i}.jpg`, {type: 'image/jpeg'}))
        }

        return images
    }

    /**
     * 6. 导出/保存 PDF (使用 pdf-lib)
     * 可以用来脱密保存（如果提供了正确密码）或单纯另存为
     */
    static async exportPDF(file, password = '', fileName = 'export.pdf') {
        const data = file instanceof ArrayBuffer ? file : await file.arrayBuffer()

        // 加载
        const pdfDoc = await PDFDocument.load(data, {
            password,
            ignoreEncryption: false
        })

        // 保存 (默认会去除加密，除非你手动设置新的加密)
        const pdfBytes = await pdfDoc.save()
        const blob = new Blob([pdfBytes], {type: 'application/pdf'})

        return {
            blob,
            url: URL.createObjectURL(blob),
            fileName
        }
    }

    /**
     * 7. 页面操作：删除指定页面
     * @param {number[]} pageIndexes 要删除的索引数组 (从 0 开始)
     */
    static async removePages(file, password = '', pageIndexes = []) {
        const data = file instanceof ArrayBuffer ? file : await file.arrayBuffer()
        const pdfDoc = await PDFDocument.load(data, {password})

        // 降序删除，防止索引偏移
        const sortedIndices = [...pageIndexes].sort((a, b) => b - a)
        sortedIndices.forEach(index => pdfDoc.removePage(index))

        const pdfBytes = await pdfDoc.save()
        return new Blob([pdfBytes], {type: 'application/pdf'})
    }

    /**
     * 8. 强力解密模式 (当 pdf-lib 不支持 AES-256 时使用)
     * 逻辑：通过 PDF.js 渲染每页为高保真图片，再重组
     */
    static async flattenPDF(file, password = '') {
        const images = await this.renderToImages(file, password, 2.0)
        const pdfDoc = await PDFDocument.create()

        for (const imgFile of images) {
            const imgData = await imgFile.arrayBuffer()
            const embeddedImg = await pdfDoc.embedJpg(imgData)
            const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height])
            page.drawImage(embeddedImg, {
                x: 0, y: 0,
                width: embeddedImg.width,
                height: embeddedImg.height
            })
        }

        const pdfBytes = await pdfDoc.save()
        return new Blob([pdfBytes], {type: 'application/pdf'})
    }
}