const express = require('express');
const cors = require('cors');
const os = require('os');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001; // 使用3001端口，或从环境变量读取

// 中间件
app.use(cors());
app.use(express.json({ limit: '10gb' })); // 增加到10GB以支持大文件传输
app.use(express.urlencoded({ extended: true, limit: '10gb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 获取本机IP地址
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    let localIP = '127.0.0.1';
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // 跳过内部地址和非IPv4地址
            if (iface.family === 'IPv4' && !iface.internal) {
                // 优先选择常见的局域网网段
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

// 存储接收到的数据
let receivedData = [];

// API路由

// 1. 获取服务器信息
app.get('/api/info', (req, res) => {
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

// 2. Android设备发送数据到电脑
app.post('/api/send', (req, res) => {
    const { device, message, type, fileId, fileName, fileSize, fileType, fileData } = req.body;
    
    const data = {
        id: receivedData.length + 1,
        device: device || 'Unknown Device',
        message: message || '',
        type: type || 'text',
        timestamp: new Date().toISOString(),
        receivedAt: Date.now()
    };
    
    // 如果是文件类型，保存完整的文件信息
    if (type === 'file') {
        data.fileId = fileId;
        data.fileName = fileName;
        data.fileSize = fileSize;
        data.fileType = fileType;
        data.fileData = fileData; // Base64编码的文件数据
    }
    
    receivedData.push(data);
    
    console.log(`\n📱 收到来自 ${data.device} 的数据:`);
    console.log(`   类型: ${data.type}`);
    console.log(`   内容: ${data.message}`);
    if (type === 'file') {
        console.log(`   文件名: ${fileName}`);
        console.log(`   文件大小: ${fileSize} bytes`);
        console.log(`   文件类型: ${fileType}`);
    }
    console.log(`   时间: ${data.timestamp}\n`);
    
    res.json({
        success: true,
        message: '数据接收成功',
        data: data
    });
});

// 3. 获取所有接收到的数据
app.get('/api/data', (req, res) => {
    res.json({
        success: true,
        count: receivedData.length,
        data: receivedData
    });
});

// 4. 清除所有数据
app.delete('/api/data', (req, res) => {
    receivedData = [];
    res.json({
        success: true,
        message: '数据已清除'
    });
});

// 5. 心跳检测
app.get('/api/ping', (req, res) => {
    res.json({
        success: true,
        message: 'pong',
        timestamp: Date.now()
    });
});

// 主页
app.get('/', (req, res) => {
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
                h1 {
                    color: #333;
                    margin-bottom: 10px;
                    font-size: 2em;
                }
                .subtitle {
                    color: #666;
                    margin-bottom: 30px;
                }
                .info-box {
                    background: #f0f4ff;
                    border-left: 4px solid #667eea;
                    padding: 20px;
                    margin-bottom: 20px;
                    border-radius: 8px;
                }
                .info-box h3 {
                    color: #667eea;
                    margin-bottom: 10px;
                }
                .info-box p {
                    color: #333;
                    line-height: 1.6;
                    margin-bottom: 8px;
                }
                .qr-section {
                    text-align: center;
                    margin: 30px 0;
                }
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
                .instructions h3 {
                    color: #c53030;
                    margin-bottom: 15px;
                }
                .instructions ol {
                    color: #333;
                    padding-left: 20px;
                }
                .instructions li {
                    margin-bottom: 10px;
                    line-height: 1.6;
                }
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
                .status-text {
                    color: #22543d;
                    font-weight: 500;
                }
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

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIP();
    console.log('\n' + '='.repeat(50));
    console.log('🚀 NetData 服务已启动');
    console.log('='.repeat(50));
    console.log(`📡 本地访问: http://localhost:${PORT}`);
    console.log(`🌐 局域网访问: http://${ip}:${PORT}`);
    console.log(`\n📱 Android设备可以在浏览器中输入: http://${ip}:${PORT}`);
    console.log('='.repeat(50));
    console.log('\n按 Ctrl+C 停止服务\n');
});

// 优雅退出
process.on('SIGINT', () => {
    console.log('\n\n服务已停止');
    process.exit(0);
});
