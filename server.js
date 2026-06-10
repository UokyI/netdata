// NetData - 独立服务器入口（纯 Web 模式）
// 使用方式: npm start

const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

const { getLocalIP, registerApiRoutes } = require('./routes');
const { ensureFirewallRule } = require('./firewall');

const app = express();
const PORT = process.env.PORT || 52587;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10gb' }));
app.use(express.urlencoded({ extended: true, limit: '10gb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 注册所有 API 路由
registerApiRoutes(app);

// 自动配置防火墙（Windows）
ensureFirewallRule();

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
