import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';

// Add error logging
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logPath = path.join(__dirname, 'error.log');
const logStream = createWriteStream(logPath, { flags: 'a' });

console.log = (...args) => {
  logStream.write(`[${new Date().toISOString()}] INFO: ${args.join(' ')}\n`);
  process.stdout.write(args.join(' ') + '\n');
};

console.error = (...args) => {
  logStream.write(`[${new Date().toISOString()}] ERROR: ${args.join(' ')}\n`);
  process.stderr.write(args.join(' ') + '\n');
};

// 开发环境判断
const isDev = process.env.VITE_DEV_SERVER_URL ? true : false;

// 保持全局引用，避免被垃圾回收
let mainWindow;

// 创建主窗口
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: 'Web Office Toolbox',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false
        },
        icon: path.join(__dirname, '../public/favicon.ico'),
        show: false // 先隐藏，等加载完成再显示
    });

    // 窗口加载完成后显示
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // 加载应用
    if (isDev) {
        // 开发模式：加载 Vite 开发服务器
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        mainWindow.webContents.openDevTools();
    } else {
        // 生产模式：加载打包后的静态文件
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // 处理外部链接打开
    mainWindow.webContents.setWindowOpenHandler(({url}) => {
        shell.openExternal(url);
        return {action: 'deny'};
    });

    // 窗口关闭事件
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// IPC 处理：文件对话框
ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
});

// IPC 处理：文件系统操作
ipcMain.handle('read-file', async (event, filePath) => {
    try {
        const data = await fs.readFile(filePath);
        return {success: true, data: data.toString()};
    } catch (error) {
        return {success: false, error: error.message};
    }
});

ipcMain.handle('write-file', async (event, filePath, data) => {
    try {
        await fs.writeFile(filePath, data);
        return {success: true};
    } catch (error) {
        return {success: false, error: error.message};
    }
});

ipcMain.handle('exists-path', async (event, path) => {
    return await fs.pathExists(path);
});

// 应用生命周期
app.whenReady().then(() => {
    createWindow();

    // macOS 专用：激活应用时创建窗口
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// 关闭所有窗口时退出应用（非 macOS）
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 防止重复启动（仅 Windows/Linux）
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}
