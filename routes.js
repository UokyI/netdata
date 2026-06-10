// NetData 共享路由模块
// 被 server.js 和 electron-main.js 共同引用，避免代码重复

const os = require('os');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, 'uploads');

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 获取本机局域网IP
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

// 配置 multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        const uniqueId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${uniqueId}_${safeFileName}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 * 1024 } // 10GB
});

// 生成首页 HTML（无SPA时的后备页面）
function landingPageHtml(ip, port) {
    return `<!DOCTYPE html>
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
            min-height: 100vh; display: flex; justify-content: center;
            align-items: center; padding: 20px;
        }
        .container {
            background: white; border-radius: 20px; padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 600px; width: 100%;
        }
        h1 { color: #333; margin-bottom: 10px; font-size: 2em; }
        .subtitle { color: #666; margin-bottom: 30px; }
        .info-box {
            background: #f0f4ff; border-left: 4px solid #667eea;
            padding: 20px; margin-bottom: 20px; border-radius: 8px;
        }
        .info-box h3 { color: #667eea; margin-bottom: 10px; }
        .info-box p { color: #333; line-height: 1.6; margin-bottom: 8px; }
        .qr-section { text-align: center; margin: 30px 0; }
        .access-url {
            background: #667eea; color: white; padding: 15px 25px;
            border-radius: 10px; font-size: 1.2em; font-weight: bold;
            display: inline-block; margin: 10px 0; word-break: break-all;
        }
        .instructions {
            background: #fff5f5; border: 2px solid #fc8181;
            padding: 20px; border-radius: 8px; margin-top: 20px;
        }
        .instructions h3 { color: #c53030; margin-bottom: 15px; }
        .instructions ol { color: #333; padding-left: 20px; }
        .instructions li { margin-bottom: 10px; line-height: 1.6; }
        .status {
            display: flex; align-items: center; margin-top: 20px;
            padding: 15px; background: #f0fff4; border-radius: 8px;
        }
        .status-dot {
            width: 12px; height: 12px; background: #48bb78;
            border-radius: 50%; margin-right: 10px; animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
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
            <p><strong>端口:</strong> ${port}</p>
            <p><strong>启动时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
        </div>
        <div class="qr-section">
            <h3 style="color: #333; margin-bottom: 15px;">Android设备访问地址</h3>
            <div class="access-url">http://${ip}:${port}</div>
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
</html>`;
}

// 注册所有 API 路由
// options.onDataReceived(data) — 可选回调，收到数据时触发（用于 Electron IPC）
function registerApiRoutes(app, options = {}) {
    const PORT = process.env.PORT || 3001;
    let receivedData = [];

    // 获取或设置数据存储（允许外部访问以支持 IPC）
    app.locals.receivedData = receivedData;

    // 1. 服务器信息
    app.get('/api/info', (req, res) => {
        const ip = getLocalIP();
        res.json({
            success: true,
            data: {
                ip, port: PORT,
                accessUrl: `http://${ip}:${PORT}`,
                timestamp: new Date().toISOString(),
                message: 'Android设备可以通过此URL访问'
            }
        });
    });

    // 2. 接收设备发送的数据
    app.post('/api/send', upload.single('file'), (req, res) => {
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
            if (req.file) {
                console.log(`\n📁 文件已保存到: ${req.file.path}`);
                console.log(`   实际大小: ${formatFileSize(req.file.size)}`);

                data.fileName = req.file.originalname;
                data.fileSize = req.file.size;
                data.fileType = req.file.mimetype;
                data.filePath = req.file.path;
                data.downloadUrl = `/api/download/${path.basename(req.file.path)}`;
                console.log(`   📥 下载链接: http://localhost:${PORT}${data.downloadUrl}`);
            } else if (req.body.fileData) {
                try {
                    const uniqueId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    const safeFileName = (fileName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
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
        app.locals.receivedData = receivedData;

        console.log(`\n📱 收到来自 ${data.device} 的数据:`);
        console.log(`   类型: ${data.type} | 内容: ${data.message}`);
        if (type === 'file') {
            console.log(`   文件名: ${data.fileName} | 大小: ${formatFileSize(data.fileSize)}`);
            if (data.downloadUrl) console.log(`   ✅ 文件已存储，可通过链接访问`);
        }
        console.log(`   时间: ${data.timestamp}\n`);

        // 回调（如 Electron IPC）
        if (options.onDataReceived) {
            options.onDataReceived(data);
        }

        res.json({ success: true, message: '数据接收成功', data });
    });

    // 3. 获取所有数据
    app.get('/api/data', (req, res) => {
        res.json({ success: true, count: receivedData.length, data: receivedData });
    });

    // 4. 清除数据
    app.delete('/api/data', (req, res) => {
        receivedData = [];
        app.locals.receivedData = receivedData;
        res.json({ success: true, message: '数据已清除' });
    });

    // 5. 心跳
    app.get('/api/ping', (req, res) => {
        res.json({ success: true, message: 'pong', timestamp: Date.now() });
    });

    // 6. 文件下载
    app.get('/api/download/:filename', (req, res) => {
        const filename = req.params.filename;
        if (path.basename(filename) !== filename) {
            return res.status(400).json({ success: false, message: '无效的文件名' });
        }
        const filePath = path.join(UPLOAD_DIR, filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: '文件不存在' });
        }
        const stat = fs.statSync(filePath);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', stat.size);

        const readStream = fs.createReadStream(filePath);
        readStream.on('error', (error) => {
            console.error('文件读取失败:', error.message);
            if (!res.headersSent) {
                res.status(500).json({ success: false, message: '文件读取失败' });
            } else { res.end(); }
        });
        readStream.pipe(res);
    });

    // 7. 上传文件列表（调试）
    app.get('/api/uploads', (req, res) => {
        try {
            const files = fs.readdirSync(UPLOAD_DIR);
            const fileStats = files.filter(f => f !== '.gitkeep').map(file => {
                const fp = path.join(UPLOAD_DIR, file);
                const stats = fs.statSync(fp);
                return {
                    name: file, size: stats.size,
                    sizeFormatted: formatFileSize(stats.size),
                    created: stats.birthtime
                };
            });
            res.json({
                success: true, count: files.length,
                totalSize: fileStats.reduce((sum, f) => sum + f.size, 0),
                files: fileStats
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 首页（后备页面）
    app.get('/', (req, res) => {
        res.send(landingPageHtml(getLocalIP(), PORT));
    });
}

module.exports = { getLocalIP, formatFileSize, registerApiRoutes };
