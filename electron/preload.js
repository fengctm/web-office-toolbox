import {contextBridge, ipcRenderer} from 'electron';

// 安全地暴露 Electron API 给前端
contextBridge.exposeInMainWorld('electronAPI', {
    // 文件对话框
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),

    // 文件系统操作
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),
    existsPath: (path) => ipcRenderer.invoke('exists-path', path),

    // 应用信息
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),

    // 窗口控制
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
    closeWindow: () => ipcRenderer.invoke('close-window'),

    // 检测是否在 Electron 环境中
    isElectron: () => true
});

// 检测是否在 Electron 环境中
window.isElectronEnv = true;
