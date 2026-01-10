/**
 * PDF 合并器逻辑 composable
 * 负责 PDF 解析、信息提取、合并和下载
 */

import {computed, ref} from 'vue'
import {PDFDocument} from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'

// 配置 PDF.js Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

export function usePdfMerger() {
    // 状态变量
    const pdfList = ref([]) // { id, file, password, pageCount, thumbnail }
    const isProcessing = ref(false)
    const processStatus = ref('')

    // 计算属性
    const hasEnoughFiles = computed(() => pdfList.value.length >= 2)
    const previewFiles = computed(() => {
        // 返回包含密码信息的对象数组，PDFPreview 组件可以获取密码
        return pdfList.value.map(item => ({
            file: item.file,
            password: item.password
        }))
    })

    /**
     * 格式化文件大小
     */
    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    /**
     * 获取 PDF 信息（页数和缩略图）
     * @param {File} file - PDF 文件
     * @param {string} password - 密码（可选）
     */
    const getPdfInfo = async (file, password = '') => {
        const arrayBuffer = await file.arrayBuffer()
        const loadingTask = pdfjsLib.getDocument({data: arrayBuffer, password})
        const pdf = await loadingTask.promise

        // 渲染第一页作为缩略图
        const page = await pdf.getPage(1)
        const viewport = page.getViewport({scale: 0.5})

        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')
        await page.render({canvasContext: ctx, viewport}).promise

        const thumbnail = canvas.toDataURL('image/jpeg', 0.7)

        return {pageCount: pdf.numPages, thumbnail}
    }

    /**
     * 添加文件到列表
     * @param {File} file - PDF 文件
     * @param {string} password - 密码（可选）
     * @param {Function} showSnackbar - 通知回调
     */
    const addFile = async (file, password, showSnackbar) => {
        isProcessing.value = true
        processStatus.value = '正在解析文件信息...'

        try {
            const {pageCount, thumbnail} = await getPdfInfo(file, password)

            const newItem = {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                file,
                password: password || '',
                pageCount,
                thumbnail
            }

            pdfList.value.push(newItem)
            showSnackbar('文件添加成功', 'success')
        } catch (error) {
            console.error('解析失败:', error)
            showSnackbar('文件解析失败，请检查密码或文件完整性', 'error')
            throw error
        } finally {
            isProcessing.value = false
        }
    }

    /**
     * 从列表中移除文件
     * @param {number} index - 索引
     * @param {Function} showSnackbar - 通知回调
     */
    const removeFile = (index, showSnackbar) => {
        const fileName = pdfList.value[index].file.name
        pdfList.value.splice(index, 1)
        showSnackbar(`已移除: ${fileName}`, 'info')
    }

    /**
     * 重新排序文件列表
     * @param {Array} newList - 新的排序列表
     */
    const updateFileOrder = (newList) => {
        pdfList.value = newList
    }

    /**
     * 清空列表
     * @param {Function} showSnackbar - 通知回调
     */
    const clearAll = (showSnackbar) => {
        pdfList.value = []
        showSnackbar('已清空所有文件', 'info')
    }

    /**
     * 执行合并操作
     * @param {Function} showSnackbar - 通知回调
     */
    const mergePdfs = async (showSnackbar) => {
        if (!hasEnoughFiles.value) {
            showSnackbar('请至少添加 2 个 PDF 文件', 'warning')
            return
        }

        isProcessing.value = true
        processStatus.value = '正在组装文档...'

        try {
            const mergedPdf = await PDFDocument.create()

            for (let i = 0; i < pdfList.value.length; i++) {
                const item = pdfList.value[i]
                processStatus.value = `正在处理第 ${i + 1} / ${pdfList.value.length} 个文件...`

                const arrayBuffer = await item.file.arrayBuffer()

                // 加载 PDF (带密码)
                const srcPdf = await PDFDocument.load(arrayBuffer, {
                    ignoreEncryption: false,
                    password: item.password || undefined
                })

                // 复制所有页面
                const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices())
                copiedPages.forEach((page) => mergedPdf.addPage(page))
            }

            processStatus.value = '正在生成最终文件...'
            const pdfBytes = await mergedPdf.save()

            // 下载文件
            const blob = new Blob([pdfBytes], {type: 'application/pdf'})
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `Merged_${Date.now()}.pdf`
            link.click()
            URL.revokeObjectURL(url)

            showSnackbar('合并成功！文件已下载', 'success')
            processStatus.value = '合并完成！'

            setTimeout(() => {
                isProcessing.value = false
            }, 1000)
        } catch (error) {
            console.error('合并错误:', error)
            showSnackbar('合并失败，请检查文件是否损坏或密码是否正确', 'error')
            isProcessing.value = false
            throw error
        }
    }

    return {
        // 状态
        pdfList,
        isProcessing,
        processStatus,

        // 计算属性
        hasEnoughFiles,
        previewFiles,

        // 方法
        formatSize,
        addFile,
        removeFile,
        updateFileOrder,
        clearAll,
        mergePdfs
    }
}