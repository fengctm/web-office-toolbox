import { ref, reactive, readonly } from 'vue'

// ===== 常量 =====
const SUPPORTED_EXTENSIONS = new Set([
    '.js', '.ts', '.jsx', '.tsx', '.vue', '.mjs', '.cjs',
    '.py', '.pyw',
    '.java', '.kt', '.kts', '.scala', '.groovy',
    '.go',
    '.rs', '.rlib',
    '.c', '.h', '.cpp', '.hpp', '.cc', '.cxx', '.hxx',
    '.cs',
    '.php',
    '.rb', '.erb',
    '.swift',
    '.sql',
    '.html', '.htm', '.css', '.scss', '.sass', '.less', '.styl',
    '.xml', '.svg',
    '.json', '.jsonc', '.json5',
    '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf',
    '.md', '.mdx', '.rst', '.txt',
    '.sh', '.bash', '.zsh', '.fish', '.bat', '.cmd', '.ps1',
    '.r', '.R', '.dart', '.lua', '.pl', '.pm', '.ex', '.exs',
    '.hs', '.ml', '.fs', '.fsx',
    '.proto', '.graphql', '.gql',
    '.dockerfile', '.makefile', '.cmake',
])

const DEFAULT_EXCLUSIONS = [
    '.git', 'node_modules', '__pycache__', '.venv', 'venv', 'env', '.env',
    'dist', 'build', '.next', '.nuxt', 'coverage', '.cache',
    'vendor', '.gradle', 'target', '.idea', '.vscode',
]

// ===== IndexedDB =====
function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('CodeAnalyzerDB', 1)
        req.onupgradeneeded = (e) => {
            const d = e.target.result
            if (!d.objectStoreNames.contains('settings')) {
                d.createObjectStore('settings')
            }
        }
        req.onsuccess = (e) => resolve(e.target.result)
        req.onerror = () => reject(req.error)
    })
}

async function loadExclusionsFromDB() {
    try {
        const db = await openDB()
        return new Promise((resolve) => {
            const tx = db.transaction('settings', 'readonly')
            const store = tx.objectStore('settings')
            const req = store.get('exclusions')
            req.onsuccess = () => resolve(req.result || null)
            req.onerror = () => resolve(null)
        })
    } catch {
        return null
    }
}

async function saveExclusionsToDB(exclusions) {
    try {
        const db = await openDB()
        const tx = db.transaction('settings', 'readwrite')
        tx.objectStore('settings').put(exclusions, 'exclusions')
    } catch { /* ignore */ }
}

// ===== Web Worker (inline) =====
const workerCode = `
self.onmessage = async function(e) {
    const { type, data } = e.data;
    if (type === 'scan') {
        const { dirHandle, exclusions, supportedExts } = data;
        const exclusionSet = new Set(exclusions);
        const extSet = new Set(supportedExts);
        const results = [];
        let fileCount = 0;

        async function walk(handle, path) {
            for await (const [name, child] of handle.entries()) {
                if (child.kind === 'file') {
                    fileCount++;
                    const ext = '.' + name.split('.').pop().toLowerCase();
                    const nameLC = name.toLowerCase();
                    if (extSet.has(ext) || nameLC === 'dockerfile' || nameLC === 'makefile' || nameLC === 'cmakelists.txt') {
                        try {
                            const file = await child.getFile();
                            const text = await file.text();
                            const lines = text.split('\\n').length;
                            results.push({ name, path: path ? path + '/' + name : name, ext, lines, size: file.size });
                        } catch { /* skip unreadable */ }
                    }
                    if (fileCount % 50 === 0) {
                        self.postMessage({ type: 'progress', data: { fileCount, scanned: results.length } });
                    }
                } else if (child.kind === 'directory') {
                    if (exclusionSet.has(name) || exclusionSet.has(name.toLowerCase())) continue;
                    if (name.startsWith('.') && name !== '.env' && exclusionSet.has(name)) continue;
                    await walk(child, path ? path + '/' + name : name);
                }
            }
        }

        try {
            await walk(dirHandle, '');
            self.postMessage({ type: 'done', data: { results, fileCount } });
        } catch (err) {
            self.postMessage({ type: 'error', data: err.message });
        }
    }
};
`

function createWorker() {
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    return new Worker(URL.createObjectURL(blob))
}

// ===== Composable =====
export function useCodeAnalyzer() {
    // 状态
    const scanning = ref(false)
    const progressText = ref('')
    const scannedFileCount = ref(0)
    const matchedFileCount = ref(0)

    const results = ref(null)       // { results, totalFiles, totalLines, elapsed, byExt }
    const allFiles = ref([])
    const exclusions = ref([...DEFAULT_EXCLUSIONS])

    let worker = null

    // 初始化：加载已保存的排除规则
    async function init() {
        const saved = await loadExclusionsFromDB()
        if (saved) {
            exclusions.value = saved
        }
    }

    // 排除规则操作
    function addExclusion(rule) {
        const val = rule.trim()
        if (!val) return false
        if (!exclusions.value.includes(val)) {
            exclusions.value.push(val)
            saveExclusionsToDB([...exclusions.value])
            return true
        }
        return false
    }

    function removeExclusion(index) {
        const removed = exclusions.value.splice(index, 1)
        saveExclusionsToDB([...exclusions.value])
        return removed[0]
    }

    // 扫描
    async function startScan(dirHandle) {
        if (!('showDirectoryPicker' in window)) {
            throw new Error('您的浏览器不支持 File System Access API，请使用 Chrome 或 Edge')
        }

        scanning.value = true
        progressText.value = '准备中...'
        scannedFileCount.value = 0
        matchedFileCount.value = 0
        results.value = null

        return new Promise((resolve, reject) => {
            worker = createWorker()
            const startTime = performance.now()

            worker.onmessage = (e) => {
                const { type, data } = e.data
                if (type === 'progress') {
                    scannedFileCount.value = data.fileCount
                    matchedFileCount.value = data.scanned
                    progressText.value = `已扫描 ${data.fileCount.toLocaleString()} 个文件，匹配 ${data.scanned.toLocaleString()} 个`
                } else if (type === 'done') {
                    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1)
                    const processed = processResults(data.results, data.fileCount, parseFloat(elapsed))
                    scanning.value = false
                    progressText.value = `扫描完成，共 ${data.fileCount.toLocaleString()} 个文件`
                    worker.terminate()
                    worker = null
                    resolve(processed)
                } else if (type === 'error') {
                    scanning.value = false
                    worker.terminate()
                    worker = null
                    reject(new Error(data))
                }
            }

            worker.onerror = (err) => {
                scanning.value = false
                worker.terminate()
                worker = null
                reject(new Error('Worker 错误: ' + err.message))
            }

            worker.postMessage({
                type: 'scan',
                data: {
                    dirHandle,
                    exclusions: [...exclusions.value],
                    supportedExts: [...SUPPORTED_EXTENSIONS],
                }
            })
        })
    }

    // 处理结果
    function processResults(rawResults, totalFiles, elapsed) {
        const sorted = rawResults.sort((a, b) => b.lines - a.lines)
        const totalLines = rawResults.reduce((s, f) => s + f.lines, 0)

        // 按扩展名分组
        const byExt = {}
        for (const f of rawResults) {
            if (!byExt[f.ext]) byExt[f.ext] = { count: 0, lines: 0 }
            byExt[f.ext].count++
            byExt[f.ext].lines += f.lines
        }

        const data = { results: sorted, totalFiles, totalLines, elapsed, byExt }
        allFiles.value = sorted
        results.value = data
        return data
    }

    // 构建文件树
    function buildFileTree(files) {
        const tree = {}
        for (const f of files) {
            const parts = f.path.split('/')
            let node = tree
            for (let i = 0; i < parts.length - 1; i++) {
                if (!node[parts[i]]) node[parts[i]] = { _children: {}, _lines: 0 }
                node[parts[i]]._lines += f.lines
                node = node[parts[i]]._children
            }
            node[parts[parts.length - 1]] = { _file: true, _lines: f.lines, _ext: f.ext }
        }
        return tree
    }

    // 导出 CSV
    function exportCSV() {
        if (!results.value) return null
        const { byExt, totalLines } = results.value
        const files = allFiles.value
        const rows = [['文件路径', '扩展名', '行数', '大小(bytes)', '占比(%)']]
        for (const f of files) {
            const pct = totalLines > 0 ? (f.lines / totalLines * 100).toFixed(2) : '0.00'
            rows.push([f.path, f.ext, String(f.lines), String(f.size), pct])
        }
        rows.push([])
        rows.push(['=== 汇总 ==='])
        rows.push(['总文件数', String(files.length)])
        rows.push(['总行数', String(totalLines)])
        rows.push([])
        rows.push(['=== 按类型统计 ==='])
        rows.push(['扩展名', '文件数', '总行数', '平均行数'])
        for (const [ext, info] of Object.entries(byExt).sort((a, b) => b[1].lines - a[1].lines)) {
            rows.push([ext, String(info.count), String(info.lines), String(Math.round(info.lines / info.count))])
        }

        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `code-stats-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
        return true
    }

    // 取消扫描
    function cancelScan() {
        if (worker) {
            worker.terminate()
            worker = null
            scanning.value = false
        }
    }

    // 重置
    function reset() {
        cancelScan()
        results.value = null
        allFiles.value = []
        progressText.value = ''
        scannedFileCount.value = 0
        matchedFileCount.value = 0
    }

    return {
        // 状态
        scanning: readonly(scanning),
        progressText: readonly(progressText),
        scannedFileCount: readonly(scannedFileCount),
        matchedFileCount: readonly(matchedFileCount),
        results: readonly(results),
        allFiles: readonly(allFiles),
        exclusions,
        // 方法
        init,
        startScan,
        cancelScan,
        reset,
        addExclusion,
        removeExclusion,
        buildFileTree,
        exportCSV,
        // 常量
        SUPPORTED_EXTENSIONS,
        DEFAULT_EXCLUSIONS,
    }
}
