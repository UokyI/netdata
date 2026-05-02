const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const express = require('express');
const cors = require('cors');
const os = require('os');
const fs = require('fs');
const multer = require('multer'); // 添加 multer 用于处理文件上传

let mainWindow;
let server;

// 获取本机IP地址
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    let localIP = '127.0.0.1';
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                if (iface.address.startsWith('192.168.') || 
                    iface.address.startsWith('10.') || 
                    iface.address.startsWith('172.')) {
                    return iface.address;
                }
                localIP = iface.address;
            }
        }
    }
    
    return localIP;
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 创建上传目录
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 配置 multer 文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名：timestamp_randomId_originalName
        const uniqueId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${uniqueId}_${safeFileName}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 * 1024 } // 10GB 限制
});

// 启动 Express 服务器
function startExpressServer() {
    const PORT = process.env.PORT || 3001;
    const expressApp = express();
    
    // 中间件
    expressApp.use(cors());
    expressApp.use(express.json({ limit: '10gb' }));
    expressApp.use(express.urlencoded({ extended: true, limit: '10gb' }));
    expressApp.use(express.static(path.join(__dirname, 'public')));
    
    // 存储接收到的数据
    let receivedData = [];
    
    // API路由
    expressApp.get('/api/info', (req, res) => {
        const ip = getLocalIP();
        res.json({
            success: true,
            data: {
                ip: ip,
                port: PORT,
                accessUrl: `http://${ip}:${PORT}`,
                timestamp: new Date().toISOString(),
                message: 'Android设备可以通过此URL访问'
            }
        });
    });
    
    expressApp.post('/api/send', upload.single('file'), (req, res) => {
        const { device, message, type, fileName, fileSize, fileType } = req.body;
        
        const data = {
            id: receivedData.length + 1,
            device: device || 'Unknown Device',
            message: message || '',
            type: type || 'text',
            timestamp: new Date().toISOString(),
            receivedAt: Date.now()
        };
        
        if (type === 'file') {
            // ✅ 支持两种上传方式：FormData（推荐）和 Base64（兼容旧版本）
            if (req.file) {
                // 方式1：FormData 直接上传二进制文件
                console.log(`\n📁 文件已保存到: ${req.file.path}`);
                console.log(`   实际大小: ${formatFileSize(req.file.size)}`);
                
                data.fileName = req.file.originalname;
                data.fileSize = req.file.size;
                data.fileType = req.file.mimetype;
                data.filePath = req.file.path;
                data.downloadUrl = `/api/download/${path.basename(req.file.path)}`;
                
                console.log(`   📥 下载链接: http://localhost:${PORT}${data.downloadUrl}`);
            } else if (req.body.fileData) {
                // 方式2：Base64 编码（向后兼容）
                try {
                    const uniqueId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
                    const filePath = path.join(UPLOAD_DIR, `${uniqueId}_${safeFileName}`);
                    
                    const buffer = Buffer.from(req.body.fileData, 'base64');
                    fs.writeFileSync(filePath, buffer);
                    
                    console.log(`\n📁 文件已保存到: ${filePath}`);
                    console.log(`   实际大小: ${formatFileSize(buffer.length)}`);
                    
                    data.fileName = fileName;
                    data.fileSize = fileSize;
                    data.fileType = fileType;
                    data.filePath = filePath;
                    data.downloadUrl = `/api/download/${uniqueId}_${safeFileName}`;
                    
                    console.log(`   📥 下载链接: http://localhost:${PORT}${data.downloadUrl}`);
                } catch (error) {
                    console.error('❌ 文件保存失败:', error.message);
                    data.fileError = '文件保存失败';
                }
            }
        }
        
        receivedData.push(data);
        
        console.log(`\n📱 收到来自 ${data.device} 的数据:`);
        console.log(`   类型: ${data.type}`);
        console.log(`   内容: ${data.message}`);
        if (type === 'file') {
            console.log(`   文件名: ${data.fileName}`);
            console.log(`   文件大小: ${formatFileSize(data.fileSize)}`);
            console.log(`   文件类型: ${data.fileType}`);
            if (data.downloadUrl) {
                console.log(`   ✅ 文件已存储，可通过链接访问`);
            }
        }
        console.log(`   时间: ${data.timestamp}\n`);
        
        // 通过 IPC 发送数据到渲染进程
        if (mainWindow) {
            mainWindow.webContents.send('new-data', data);
        }
        
        res.json({
            success: true,
            message: '数据接收成功',
            data: data
        });
    });
    
    expressApp.get('/api/data', (req, res) => {
        res.json({
            success: true,
            count: receivedData.length,
            data: receivedData
        });
    });
    
    expressApp.delete('/api/data', (req, res) => {
        receivedData = [];
        res.json({
            success: true,
            message: '数据已清除'
        });
    });
    
    expressApp.get('/api/ping', (req, res) => {
        res.json({
            success: true,
            message: 'pong',
            timestamp: Date.now()
        });
    });
    
    // 文件下载接口
    expressApp.get('/api/download/:filename', (req, res) => {
        const filename = req.params.filename;
        const filePath = path.join(UPLOAD_DIR, filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: '文件不存在'
            });
        }
        
        try {
            res.download(filePath);
        } catch (error) {
            console.error('文件下载失败:', error.message);
            res.status(500).json({
                success: false,
                message: '文件下载失败'
            });
        }
    });
    
    // 获取上传文件列表（调试用）
    expressApp.get('/api/uploads', (req, res) => {
        try {
            const files = fs.readdirSync(UPLOAD_DIR);
            const fileStats = files.map(file => {
                const filePath = path.join(UPLOAD_DIR, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    size: stats.size,
                    sizeFormatted: formatFileSize(stats.size),
                    created: stats.birthtime
                };
            });
            
            res.json({
                success: true,
                count: files.length,
                totalSize: fileStats.reduce((sum, f) => sum + f.size, 0),
                files: fileStats
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });
    
    // 主页
    expressApp.get('/', (req, res) => {
        const ip = getLocalIP();
        res.send(`
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>NetData - Wi-Fi通信服务</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        padding: 20px;
                    }
                    .container {
                        background: white;
                        border-radius: 20px;
                        padding: 40px;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        max-width: 600px;
                        width: 100%;
                    }
                    h1 { color: #333; margin-bottom: 10px; font-size: 2em; }
                    .subtitle { color: #666; margin-bottom: 30px; }
                    .info-box {
                        background: #f0f4ff;
                        border-left: 4px solid #667eea;
                        padding: 20px;
                        margin-bottom: 20px;
                        border-radius: 8px;
                    }
                    .info-box h3 { color: #667eea; margin-bottom: 10px; }
                    .info-box p { color: #333; line-height: 1.6; margin-bottom: 8px; }
                    .qr-section { text-align: center; margin: 30px 0; }
                    .access-url {
                        background: #667eea;
                        color: white;
                        padding: 15px 25px;
                        border-radius: 10px;
                        font-size: 1.2em;
                        font-weight: bold;
                        display: inline-block;
                        margin: 10px 0;
                        word-break: break-all;
                    }
                    .instructions {
                        background: #fff5f5;
                        border: 2px solid #fc8181;
                        padding: 20px;
                        border-radius: 8px;
                        margin-top: 20px;
                    }
                    .instructions h3 { color: #c53030; margin-bottom: 15px; }
                    .instructions ol { color: #333; padding-left: 20px; }
                    .instructions li { margin-bottom: 10px; line-height: 1.6; }
                    .status {
                        display: flex;
                        align-items: center;
                        margin-top: 20px;
                        padding: 15px;
                        background: #f0fff4;
                        border-radius: 8px;
                    }
                    .status-dot {
                        width: 12px;
                        height: 12px;
                        background: #48bb78;
                        border-radius: 50%;
                        margin-right: 10px;
                        animation: pulse 2s infinite;
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                    .status-text { color: #22543d; font-weight: 500; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🌐 NetData 服务</h1>
                    <p class="subtitle">同Wi-Fi下电脑与Android设备通信</p>
                    
                    <div class="info-box">
                        <h3>📡 服务器信息</h3>
                        <p><strong>状态:</strong> ✅ 运行中</p>
                        <p><strong>端口:</strong> ${PORT}</p>
                        <p><strong>启动时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
                    </div>
                    
                    <div class="qr-section">
                        <h3 style="color: #333; margin-bottom: 15px;">Android设备访问地址</h3>
                        <div class="access-url">http://${ip}:${PORT}</div>
                        <p style="color: #666; margin-top: 15px; font-size: 0.9em;">
                            在Android浏览器中输入以上地址
                        </p>
                    </div>
                    
                    <div class="instructions">
                        <h3>📖 使用说明</h3>
                        <ol>
                            <li>确保Android设备连接到同一Wi-Fi网络</li>
                            <li>在Android浏览器中访问上方显示的URL</li>
                            <li>使用API接口进行数据传输</li>
                            <li>查看控制台查看接收到的数据</li>
                        </ol>
                    </div>
                    
                    <div class="status">
                        <div class="status-dot"></div>
                        <span class="status-text">等待Android设备连接...</span>
                    </div>
                </div>
            </body>
            </html>
        `);
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
