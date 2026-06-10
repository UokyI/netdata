// NetData - Electron 桌面应用主进程
// 使用方式: npm run electron:dev

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const express = require('express');
const cors = require('cors');

require('dotenv').config();

const { getLocalIP, registerApiRoutes } = require('./routes');

let mainWindow;
let server;

// 启动 Express 服务器
function startExpressServer() {
    const PORT = process.env.PORT || 3001;
    const expressApp = express();

    // 中间件
    expressApp.use(cors());
    expressApp.use(express.json({ limit: '10gb' }));
    expressApp.use(express.urlencoded({ extended: true, limit: '10gb' }));
    expressApp.use(express.static(path.join(__dirname, 'public')));

    // 注册 API 路由，并传入数据回调以支持 IPC 推送
    registerApiRoutes(expressApp, {
        onDataReceived: (data) => {
            if (mainWindow) {
                mainWindow.webContents.send('new-data', data);
            }
        }
    });

    return new Promise((resolve, reject) => {
        server = expressApp.listen(PORT, '0.0.0.0', () => {
            const ip = getLocalIP();
            console.log('\n' + '='.repeat(50));
            console.log('🚀 NetData 服务已启动');
            console.log('='.repeat(50));
            console.log(`📡 本地访问: http://localhost:${PORT}`);
            console.log(`🌐 局域网访问: http://${ip}:${PORT}`);
            console.log(`\n📱 Android设备可以在浏览器中输入: http://${ip}:${PORT}`);
            console.log('='.repeat(50));
            console.log('\n按 Ctrl+C 停止服务\n');
            resolve(server);
        });
        server.on('error', reject);
    });
}

// 创建浏览器窗口
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false,
        backgroundColor: '#ffffff'
    });
    
    // 加载应用
    const PORT = process.env.PORT || 3001;
    
    // 等待服务器完全启动后再加载页面
    setTimeout(() => {
        mainWindow.loadURL(`http://localhost:${PORT}/index.html`).catch(err => {
            console.error('加载页面失败:', err);
            // 重试一次
            setTimeout(() => {
                mainWindow.loadURL(`http://localhost:${PORT}/index.html`);
            }, 1000);
        });
    }, 500);
    
    // 窗口准备好后显示
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // 开发环境下打开开发者工具
        if (isDev) {
            mainWindow.webContents.openDevTools();
        }
    });
    
    // 窗口关闭事件
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    
    // 防止导航到其他页面
    mainWindow.webContents.on('will-navigate', (event, url) => {
        event.preventDefault();
    });
    
    // 处理加载错误
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('页面加载失败:', errorCode, errorDescription);
    });
}

// 应用就绪
app.whenReady().then(async () => {
    try {
        // 先启动 Express 服务器
        await startExpressServer();
        
        // 再创建窗口
        createWindow();
        
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    } catch (error) {
        console.error('启动失败:', error);
        app.quit();
    }
});

// 所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 优雅退出
app.on('before-quit', () => {
    if (server) {
        server.close();
    }
});

// 处理 IPC 消息
ipcMain.handle('get-app-info', () => {
    return {
        platform: process.platform,
        version: app.getVersion(),
        isDev: isDev
    };
});

// 获取服务器信息（局域网IP和端口）
ipcMain.handle('get-server-info', () => {
    const ip = getLocalIP();
    const PORT = process.env.PORT || 3001;
    return {
        ip: ip,
        port: PORT,
        accessUrl: `http://${ip}:${PORT}`
    };
});
