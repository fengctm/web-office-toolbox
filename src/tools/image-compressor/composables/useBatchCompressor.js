import { ref, computed } from 'vue'
import { compressFile, getExtension } from './useImageCompressor.js'

/**
 * 图片批量压缩 - 状态管理（单例模式）
 *
 * 所有 ref 在模块级别声明，确保多个组件调用 useBatchCompressor() 时共享同一份状态。
 * index.vue 添加文件后，BatchWorkbench 能看到相同的文件列表。
 */

/** 压缩状态常量 */
export const COMPRESS_STATUS = {
  PENDING: 'pending',
  COMPRESSING: 'compressing',
  DONE: 'done',
  FAILED: 'failed',
}

// ============ 模块级单例状态 ============

let fileIdCounter = 0

const batchFiles = ref([])
const compressing = ref(false)
const currentFileIndex = ref(-1)
const message = ref('')
const messageType = ref('info')

const totalFiles = computed(() => batchFiles.value.length)
const completedCount = computed(() =>
  batchFiles.value.filter(f => f.status === COMPRESS_STATUS.DONE).length
)
const failedCount = computed(() =>
  batchFiles.value.filter(f => f.status === COMPRESS_STATUS.FAILED).length
)
const pendingCount = computed(() =>
  batchFiles.value.filter(f => f.status === COMPRESS_STATUS.PENDING).length
)
const progress = computed(() =>
  totalFiles.value === 0
    ? 0
    : Math.round((completedCount.value + failedCount.value) / totalFiles.value * 100)
)
const totalOriginalSize = computed(() =>
  batchFiles.value.reduce((sum, f) => sum + (f.file?.size || 0), 0)
)
const totalResultSize = computed(() =>
  batchFiles.value.reduce((sum, f) => sum + (f.result?.blob?.size || 0), 0)
)
const sizeChangePercent = computed(() => {
  if (totalOriginalSize.value === 0) return 0
  return ((1 - totalResultSize.value / totalOriginalSize.value) * 100).toFixed(1)
})
const currentFileName = computed(() => {
  if (currentFileIndex.value < 0 || currentFileIndex.value >= batchFiles.value.length) return ''
  return batchFiles.value[currentFileIndex.value].file?.name || ''
})

// ============ 操作函数 ============

function showMessage(text, type = 'info') {
  message.value = text
  messageType.value = type
  setTimeout(() => { message.value = '' }, 3000)
}

function addFiles(fileList) {
  for (const file of fileList) {
    batchFiles.value = [...batchFiles.value, {
      id: ++fileIdCounter,
      file,
      status: COMPRESS_STATUS.PENDING,
      result: null,
      error: null,
    }]
  }
}

function removeFile(id) {
  const item = batchFiles.value.find(f => f.id === id)
  if (item?.status === COMPRESS_STATUS.COMPRESSING) return
  batchFiles.value = batchFiles.value.filter(f => f.id !== id)
}

function clearFiles() {
  batchFiles.value = []
  currentFileIndex.value = -1
}

function updateFile(id, updates) {
  batchFiles.value = batchFiles.value.map(f =>
    f.id === id ? { ...f, ...updates } : f
  )
}

async function compressSingle(id, settings) {
  const item = batchFiles.value.find(f => f.id === id)
  if (!item) return

  updateFile(id, { status: COMPRESS_STATUS.COMPRESSING, error: null })

  try {
    const result = await compressFile(item.file, settings)
    updateFile(id, { status: COMPRESS_STATUS.DONE, result })
    return result
  } catch (err) {
    updateFile(id, { status: COMPRESS_STATUS.FAILED, error: err.message })
    throw err
  }
}

async function compressAll(settings) {
  if (compressing.value) return
  if (pendingCount.value === 0 && failedCount.value === 0) {
    showMessage('没有需要压缩的文件', 'warning')
    return
  }

  compressing.value = true
  let successCount = 0
  let errorCount = 0

  // 重置失败的文件
  batchFiles.value = batchFiles.value.map(f =>
    f.status === COMPRESS_STATUS.FAILED
      ? { ...f, status: COMPRESS_STATUS.PENDING, error: null }
      : f
  )

  for (let i = 0; i < batchFiles.value.length; i++) {
    const item = batchFiles.value[i]
    if (item.status !== COMPRESS_STATUS.PENDING) continue

    currentFileIndex.value = i

    try {
      await compressSingle(item.id, settings)
      successCount++
    } catch {
      errorCount++
    }
  }

  currentFileIndex.value = -1
  compressing.value = false

  if (errorCount === 0) {
    showMessage(`全部压缩完成！共 ${successCount} 张`, 'success')
  } else {
    showMessage(`压缩完成：${successCount} 成功，${errorCount} 失败`, 'warning')
  }
}

function downloadSingle(id) {
  const item = batchFiles.value.find(f => f.id === id)
  if (!item?.result?.blob) return

  const originalName = item.file.name.replace(/\.[^.]+$/, '')
  const ext = getExtension(item.result.blob.type)
  const filename = `${originalName}_compressed.${ext}`

  const url = URL.createObjectURL(item.result.blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function downloadAll() {
  const completed = batchFiles.value.filter(
    f => f.status === COMPRESS_STATUS.DONE && f.result?.blob
  )
  if (completed.length === 0) {
    showMessage('没有可下载的文件', 'warning')
    return
  }

  if (completed.length === 1) {
    downloadSingle(completed[0].id)
    return
  }

  // 多文件打包 ZIP
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()

  for (const item of completed) {
    const originalName = item.file.name.replace(/\.[^.]+$/, '')
    const ext = getExtension(item.result.blob.type)
    zip.file(`${originalName}_compressed.${ext}`, item.result.blob)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(zipBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'compressed-images.zip'
  a.click()
  URL.revokeObjectURL(url)
  showMessage(`已打包 ${completed.length} 个文件`, 'success')
}

function reset() {
  batchFiles.value = []
  compressing.value = false
  currentFileIndex.value = -1
  message.value = ''
  fileIdCounter = 0
}

// ============ Composable 入口 ============

export function useBatchCompressor() {
  return {
    batchFiles,
    compressing,
    currentFileIndex,
    currentFileName,
    message,
    messageType,
    totalFiles,
    completedCount,
    failedCount,
    pendingCount,
    progress,
    totalOriginalSize,
    totalResultSize,
    sizeChangePercent,
    addFiles,
    removeFile,
    clearFiles,
    compressSingle,
    compressAll,
    downloadSingle,
    downloadAll,
    reset,
    showMessage,
  }
}
