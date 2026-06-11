import { ref, computed } from 'vue'
import { useWasmConverter } from './useWasmConverter.js'
import { formatFileSize } from '@/utils-scripts/ImageHelper.js'

/**
 * 图片格式转换工具 - 状态管理（单例模式）
 *
 * 所有 ref 在模块级别声明，确保多个组件调用 useImageConverter() 时共享同一份状态。
 * index.vue 添加文件后，MainContainer 能看到相同的文件列表。
 */

/** 转换状态常量 */
export const CONVERT_STATUS = {
  PENDING: 'pending',
  CONVERTING: 'converting',
  DONE: 'done',
  FAILED: 'failed',
}

/** 支持的输出格式配置 */
export const OUTPUT_FORMATS = [
  { value: 'jpeg', label: 'JPEG', mime: 'image/jpeg', ext: 'jpg', hasQuality: true },
  { value: 'png', label: 'PNG', mime: 'image/png', ext: 'png', hasQuality: false },
  { value: 'webp', label: 'WebP', mime: 'image/webp', ext: 'webp', hasQuality: true },
]

/** 背景色预设 */
export const BG_COLORS = [
  { label: '白色', value: [255, 255, 255] },
  { label: '黑色', value: [0, 0, 0] },
  { label: '透明灰', value: [200, 200, 200] },
]

// ============ 模块级单例状态 ============

let fileIdCounter = 0

const files = ref([])
const outputFormat = ref('jpeg')
const quality = ref(85)
const bgColor = ref([255, 255, 255])
const converting = ref(false)
const currentFileIndex = ref(-1)
const message = ref('')
const messageType = ref('info')

const totalFiles = computed(() => files.value.length)
const completedCount = computed(() =>
  files.value.filter(f => f.status === CONVERT_STATUS.DONE).length
)
const failedCount = computed(() =>
  files.value.filter(f => f.status === CONVERT_STATUS.FAILED).length
)
const pendingCount = computed(() =>
  files.value.filter(f => f.status === CONVERT_STATUS.PENDING).length
)
const progress = computed(() =>
  totalFiles.value === 0 ? 0 : Math.round((completedCount.value + failedCount.value) / totalFiles.value * 100)
)
const totalOriginalSize = computed(() =>
  files.value.reduce((sum, f) => sum + (f.file?.size || 0), 0)
)
const totalResultSize = computed(() =>
  files.value.reduce((sum, f) => sum + (f.result?.blob?.size || 0), 0)
)
const sizeChangePercent = computed(() => {
  if (totalOriginalSize.value === 0) return 0
  return ((1 - totalResultSize.value / totalOriginalSize.value) * 100).toFixed(1)
})
const currentFormat = computed(() =>
  OUTPUT_FORMATS.find(f => f.value === outputFormat.value)
)

// ============ 操作函数 ============

function showMessage(text, type = 'info') {
  message.value = text
  messageType.value = type
  setTimeout(() => { message.value = '' }, 3000)
}

function addFiles(fileList) {
  for (const file of fileList) {
    files.value = [...files.value, {
      id: ++fileIdCounter,
      file,
      status: CONVERT_STATUS.PENDING,
      result: null,
      error: null,
    }]
  }
}

function removeFile(id) {
  files.value = files.value.filter(f => f.id !== id)
}

function clearFiles() {
  files.value = []
  currentFileIndex.value = -1
}

function updateFile(id, updates) {
  files.value = files.value.map(f => f.id === id ? { ...f, ...updates } : f)
}

async function convertSingle(id) {
  const item = files.value.find(f => f.id === id)
  if (!item) return

  updateFile(id, { status: CONVERT_STATUS.CONVERTING, error: null })

  try {
    const { convert } = useWasmConverter()
    const result = await convert(
      item.file,
      outputFormat.value,
      quality.value,
      bgColor.value
    )
    updateFile(id, { status: CONVERT_STATUS.DONE, result })
    return result
  } catch (err) {
    updateFile(id, { status: CONVERT_STATUS.FAILED, error: err.message })
    throw err
  }
}

async function convertAll() {
  if (converting.value) return
  if (pendingCount.value === 0 && failedCount.value === 0) {
    showMessage('没有需要转换的文件', 'warning')
    return
  }

  converting.value = true
  let successCount = 0
  let errorCount = 0

  // 重置失败的文件
  files.value = files.value.map(f =>
    f.status === CONVERT_STATUS.FAILED ? { ...f, status: CONVERT_STATUS.PENDING, error: null } : f
  )

  for (let i = 0; i < files.value.length; i++) {
    const item = files.value[i]
    if (item.status !== CONVERT_STATUS.PENDING) continue

    currentFileIndex.value = i

    try {
      await convertSingle(item.id)
      successCount++
    } catch {
      errorCount++
    }
  }

  currentFileIndex.value = -1
  converting.value = false

  if (errorCount === 0) {
    showMessage(`全部转换完成！共 ${successCount} 张`, 'success')
  } else {
    showMessage(`转换完成：${successCount} 成功，${errorCount} 失败`, 'warning')
  }
}

function downloadSingle(id) {
  const item = files.value.find(f => f.id === id)
  if (!item?.result?.blob) return

  const originalName = item.file.name.replace(/\.[^.]+$/, '')
  const ext = currentFormat.value.ext
  const filename = `${originalName}.${ext}`

  const url = URL.createObjectURL(item.result.blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function downloadAll() {
  const completed = files.value.filter(f => f.status === CONVERT_STATUS.DONE && f.result?.blob)
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
  const ext = currentFormat.value.ext

  for (const item of completed) {
    const originalName = item.file.name.replace(/\.[^.]+$/, '')
    zip.file(`${originalName}.${ext}`, item.result.blob)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(zipBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = `converted-images.zip`
  a.click()
  URL.revokeObjectURL(url)
  showMessage(`已打包 ${completed.length} 个文件`, 'success')
}

function reset() {
  files.value = []
  outputFormat.value = 'jpeg'
  quality.value = 85
  bgColor.value = [255, 255, 255]
  converting.value = false
  currentFileIndex.value = -1
  message.value = ''
  fileIdCounter = 0
}

// ============ Composable 入口 ============

export function useImageConverter() {
  const { supportedInputFormats, supportedExtensions } = useWasmConverter()

  return {
    files,
    addFiles,
    removeFile,
    clearFiles,
    outputFormat,
    quality,
    bgColor,
    currentFormat,
    converting,
    currentFileIndex,
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
    convertSingle,
    convertAll,
    downloadSingle,
    downloadAll,
    reset,
    showMessage,
    supportedInputFormats,
    supportedExtensions,
  }
}
