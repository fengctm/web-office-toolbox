/**
 * Electron 环境检测和工具函数
 * 支持 Web 和 Electron 双模式
 */

// 检测是否在 Electron 环境中
export const isElectron = () => {
    return window.isElectronEnv === true ||
        (window.electronAPI && typeof window.electronAPI.isElectron === 'function');
};

// 获取当前运行模式
export const getRuntimeMode = () => {
    return isElectron() ? 'electron' : 'web';
};

// 安全的文件对话框（自动适配双模式）
export const showOpenFileDialog = async (options = {}) => {
    if (isElectron()) {
        // Electron 模式：使用系统对话框
        const result = await window.electronAPI.showOpenDialog({
            properties: ['openFile'],
            filters: options.filters || [],
            ...options
        });
        return result;
    } else {
        // Web 模式：使用浏览器文件输入
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = options.multiple || false;

            if (options.filters && options.filters.length > 0) {
                const accept = options.filters
                    .map(filter => filter.extensions.map(ext => `.${ext}`).join(','))
                    .join(',');
                input.accept = accept;
            }

            input.onchange = (e) => {
                const files = Array.from(e.target.files);
                resolve({
                    canceled: false,
                    filePaths: files.map(f => f.name) // Web 模式只返回文件名
                });
            };

            input.onerror = () => reject(new Error('文件选择失败'));
            input.click();
        });
    }
};

// 安全的文件保存对话框（自动适配双模式）
export const showSaveFileDialog = async (options = {}) => {
    if (isElectron()) {
        // Electron 模式：使用系统对话框
        const result = await window.electronAPI.showSaveDialog({
            filters: options.filters || [],
            ...options
        });
        return result;
    } else {
        // Web 模式：返回建议的文件名
        return {
            canceled: false,
            filePath: options.defaultPath || 'untitled.txt'
        };
    }
};

// 读取文件内容（自动适配双模式）
export const readFileContent = async (file) => {
    if (isElectron()) {
        // Electron 模式：通过 IPC 读取
        const result = await window.electronAPI.readFile(file.path || file);
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.error);
        }
    } else {
        // Web 模式：使用 FileReader
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('读取文件失败'));
            reader.readAsText(file);
        });
    }
};

// 保存文件内容（自动适配双模式）
export const saveFileContent = async (filePath, content) => {
    if (isElectron()) {
        // Electron 模式：通过 IPC 保存到磁盘
        const result = await window.electronAPI.writeFile(filePath, content);
        if (!result.success) {
            throw new Error(result.error);
        }
    } else {
        // Web 模式：使用 Blob 和下载
        const blob = new Blob([content], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filePath;
        a.click();
        URL.revokeObjectURL(url);
    }
};

// 下载文件（Web 模式专用）
export const downloadFile = (content, filename, mimeType = 'application/octet-stream') => {
    if (isElectron()) {
        console.warn('downloadFile 在 Electron 模式下不推荐使用，请使用 saveFileContent');
    }

    const blob = new Blob([content], {type: mimeType});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

// 获取应用信息
export const getAppInfo = async () => {
    if (isElectron()) {
        const version = await window.electronAPI.getAppVersion();
        return {
            version,
            platform: 'electron',
            name: 'Web Office Toolbox'
        };
    } else {
        return {
            version: 'web',
            platform: 'browser',
            name: 'Web Office Toolbox'
        };
    }
};

// 窗口控制（仅 Electron）
export const minimizeWindow = () => {
    if (isElectron() && window.electronAPI.minimizeWindow) {
        window.electronAPI.minimizeWindow();
    }
};

export const maximizeWindow = () => {
    if (isElectron() && window.electronAPI.maximizeWindow) {
        window.electronAPI.maximizeWindow();
    }
};

export const closeWindow = () => {
    if (isElectron() && window.electronAPI.closeWindow) {
        window.electronAPI.closeWindow();
    }
};

// 工具函数：根据模式显示提示
export const getModeAwareMessage = (message) => {
    const mode = getRuntimeMode();
    if (mode === 'electron') {
        return message; // Electron 模式直接使用原消息
    } else {
        // Web 模式可能需要调整某些提示
        return message.replace(/系统对话框/g, '浏览器文件选择器')
            .replace(/本地文件系统/g, '浏览器下载');
    }
};

// 检查路径是否存在（仅 Electron）
export const pathExists = async (path) => {
    if (isElectron() && window.electronAPI.existsPath) {
        return await window.electronAPI.existsPath(path);
    }
    return false;
};
