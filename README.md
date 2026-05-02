# NetData - 同Wi-Fi下电脑与Android设备通信应用

## 📖 项目简介

这是一个基于Node.js的局域网双向通信应用，实现了在同一Wi-Fi网络下，电脑与Android移动设备之间的实时数据交互。通过美观的Web界面和RESTful API，支持文件传输、消息推送和数据同步等功能。

**使用方式**：
- 🌐 **纯Web模式**: 运行 `npm start`，通过浏览器访问（推荐）
- 💻 **Electron桌面应用**: 运行 `npm run electron:dev`，使用独立桌面窗口

---

## ✨ 核心功能

- ✅ **自动IP检测**: 自动获取电脑的局域网IP地址并显示访问URL
- ✅ **响应式Web界面**: 适配PC和移动端的美观管理界面
- ✅ **RESTful API**: 提供完整的API接口进行数据交互
- ✅ **大文件传输**: 支持最大10GB的文件传输（二进制直传 + 服务器存储）
- ✅ **拖拽发送**: 支持拖拽文件到输入框自动发送
- ✅ **跨平台**: 支持任何有浏览器的Android/iOS设备
- ✅ **实时状态**: 显示连接状态和数据传输情况
- ✅ **数据记录**: 保存所有接收到的数据并实时刷新
- ✅ **设备识别**: 自动识别设备类型（Mac/Linux/Windows）
- ✅ **智能轮询**: 2秒快速同步，仅数据变化时更新DOM

---

## 🔧 技术栈

### 后端
- **运行时**: Node.js (v14.0+)
- **框架**: Express.js
- **通信协议**: HTTP (RESTful API)
- **跨域支持**: CORS
- **文件上传**: multer（用于处理 multipart/form-data）
- **文件系统**: fs模块（用于文件存储）
- **依赖包**: 
  - `express` - Web框架
  - `cors` - 跨域支持
  - `multer` - 文件上传中间件
  - `electron-is-dev` - Electron开发环境检测
  - `os` - 操作系统信息

**Electron打包版本**:
- **主进程**: electron-main.js
- **渲染进程**: public/index.html
- **预加载脚本**: preload.js

### 前端
- **基础**: HTML5 + CSS3 + Vanilla JavaScript (无框架)
- **布局**: Flexbox + Grid + 响应式设计
- **特性**: 
  - 拖拽API (Drag & Drop)
  - Base64文件编码
  - LocalStorage设备ID
  - Fetch API

---

## 🚀 运行环境要求

### 系统要求
- **操作系统**: macOS, Linux, Windows
- **Node.js**: v14.0 或更高版本
- **npm**: v6.0 或更高版本
- **网络**: 局域网环境（同一Wi-Fi）

### 浏览器要求
- **桌面端**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **移动端**: Chrome Mobile, Safari iOS, Firefox Mobile

---

## 📦 安装步骤

### 1. 克隆仓库

```bash
git clone https://github.com/UokyI/netdata.git
cd netdata
```

### 2. 安装依赖

```bash
npm install
```

**安装的依赖**:
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^2.1.1"
  },
  "devDependencies": {
    "electron": "^41.4.0",
    "electron-builder": "^26.8.1",
    "electron-is-dev": "^3.0.1",
    "nodemon": "^3.0.1"
  }
}
```

### 3. 启动服务

本项目支持两种启动方式：

**方式一: 纯Web浏览器模式（推荐）**

直接启动HTTP服务器，通过浏览器访问：

```bash
npm start
```

或使用开发模式（支持自动重启）：

```bash
npm run dev
```

启动后，在浏览器中访问终端显示的URL（例如：`http://192.168.x.x:3001`）

**方式二: Electron桌面应用模式**

启动桌面应用程序：

```bash
npm run electron:dev
```

这会打开一个独立的桌面应用窗口，内置服务器和Web界面。

### 4. 访问服务

服务启动后，终端会显示访问地址：

```
🌐 局域网访问: http://192.168.x.x:3001
💡 Android设备可以通过此URL访问
```

**注意**: 
- 默认端口为3001（如被占用会自动切换）
- 确保防火墙允许该端口访问
- **重要**: `192.168.x.x` 是示例地址，实际使用时请查看终端显示的你的电脑真实局域网IP

---

## 📱 Android设备连接

### 连接步骤

1. **确保网络环境**
   - Android设备和电脑连接到**同一Wi-Fi网络**
   - 确认网络可以互相访问

2. **获取访问地址**
   - 查看电脑终端显示的URL（例如: `http://192.168.x.x:3001`）
   - **注意**: IP地址是动态获取的，以终端实际显示为准

3. **在Android设备上访问**
   - 打开手机浏览器（Chrome/Firefox等）
   - 输入终端显示的URL地址
   - 开始使用Web界面

### 示例代码（Android原生应用）

#### Java示例

```
OkHttpClient client = new OkHttpClient();

// 发送数据（将192.168.x.x替换为你的实际IP地址）
RequestBody body = RequestBody.create(
    MediaType.parse("application/json"),
    "{\"device\":\"MyApp\",\"message\":\"Hello from Android\",\"type\":\"text\"}"
);

Request request = new Request.Builder()
    .url("http://192.168.x.x:3001/api/send")  // 修改为终端显示的实际IP
    .post(body)
    .build();

client.newCall(request).enqueue(new Callback() {
    @Override
    public void onResponse(Call call, Response response) throws IOException {
        String result = response.body().string();
        Log.d("NetData", "发送成功: " + result);
    }
    
    @Override
    public void onFailure(Call call, IOException e) {
        Log.e("NetData", "发送失败", e);
    }
});
```

#### Kotlin示例

```
val client = OkHttpClient()

val body = RequestBody.create(
    MediaType.parse("application/json"),
    """{"device":"MyApp","message":"Hello","type":"text"}"""
)

val request = Request.Builder()
    .url("http://192.168.x.x:3001/api/send")  // 修改为终端显示的实际IP
    .post(body)
    .build()

client.newCall(request).enqueue(object : Callback {
    override fun onResponse(call: Call, response: Response) {
        val result = response.body?.string()
        Log.d("NetData", "发送成功: $result")
    }
    
    override fun onFailure(call: Call, e: IOException) {
        Log.e("NetData", "发送失败", e)
    }
})
```

---

## 📡 API 接口文档

### 基础信息

- **Base URL**: `http://192.168.x.x:3001`（请将 `192.168.x.x` 替换为你的实际局域网IP）
- **Content-Type**: `application/json`
- **CORS**: 已启用，支持跨域请求

**如何获取你的IP地址**:
启动服务后，终端会显示类似以下信息：
```
🌐 局域网访问: http://192.168.x.x:3001
```
使用显示的完整URL作为API的Base URL。

---

### 1. 获取服务器信息

**接口**: `GET /api/info`

**描述**: 返回服务器的IP、端口等基本信息

**响应示例**:
```
{
  "success": true,
  "data": {
    "ip": "192.168.x.x",
    "port": 3001,
    "accessUrl": "http://192.168.x.x:3001",
    "timestamp": "2026-05-01T06:00:00.000Z",
    "message": "Android设备可以通过此URL访问"
  }
}
```

**注意**: `ip` 字段的值会根据你的网络环境动态变化，请以实际输出为准。

---

### 2. 发送数据到电脑

**接口**: `POST /api/send`

**描述**: 从客户端发送数据到服务器

**请求体**:
```
{
  "device": "Android Device",
  "message": "Hello from mobile!",
  "type": "text"
}
```

**文件传输请求体（FormData - 推荐）**:
```
const formData = new FormData();
formData.append('device', 'Android Device');
formData.append('message', '[FILE] test.mp3 (5.2 MB)');
formData.append('type', 'file');
formData.append('fileName', 'test.mp3');
formData.append('fileSize', '5452800');
formData.append('fileType', 'audio/mpeg');
formData.append('file', fileObject); // 直接附加二进制文件

// fetch发送
fetch('http://192.168.x.x:3001/api/send', {
    method: 'POST',
    body: formData
});
```

**文件传输请求体（Base64 - 兼容旧版本）**:
```
{
  "device": "Android Device",
  "message": "[FILE] test.mp3 (5.2 MB)",
  "type": "file",
  "fileName": "test.mp3",
  "fileSize": 5452800,
  "fileType": "audio/mpeg",
  "fileData": "base64encodeddata..."
}
```

**响应示例**:
```
{
  "success": true,
  "message": "数据接收成功",
  "data": {
    "id": 1,
    "device": "Android Device",
    "message": "Hello from mobile!",
    "type": "text",
    "timestamp": "2026-05-01T06:00:00.000Z",
    "receivedAt": 1777615200000
  }
}
```

**文件存储说明**:
- **方式1（推荐）**: FormData 直接上传二进制文件，无 Base64 编码开销
  - 使用 `multipart/form-data` 格式
  - 文件通过 multer 中间件自动保存到 `uploads/` 目录
  - 传输效率比 Base64 高约 33%
  
- **方式2（兼容）**: Base64 编码后 JSON 传输
  - 向后兼容旧的客户端实现
  - 适合小文件（< 10MB）
  - Base64 编码会增加约 33% 的数据量
  
- **通用规则**:
  - 文件名格式：`{timestamp}_{randomId}_{originalName}`（避免重名）
  - 服务器只存储文件元数据和下载链接，不存储完整文件内容到内存
  - 支持最大10GB文件传输
  - 通过 `/api/download/:filename` 接口下载文件

---

### 3. 获取所有接收的数据

**接口**: `GET /api/data`

**描述**: 返回服务器接收到的所有数据列表

**响应示例**:
```
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 1,
      "device": "Android Device",
      "message": "Hello!",
      "type": "text",
      "timestamp": "2026-05-01T06:00:00.000Z",
      "receivedAt": 1777615200000
    },
    {
      "id": 2,
      "device": "File Sender",
      "message": "[FILE] video.mp4 (86.07 MB)",
      "type": "file",
      "fileName": "video.mp4",
      "fileSize": 90246756,
      "fileType": "video/mp4",
      "downloadUrl": "/api/download/1777620780341_abc123_video.mp4",
      "timestamp": "2026-05-01T07:33:00.341Z",
      "receivedAt": 1777620780341
    }
  ]
}
```

**文件下载说明**:
- 文件类型消息包含 `downloadUrl` 字段
- 通过 `window.open(downloadUrl, '_blank')` 下载文件
- 文件大小以字节为单位

---

### 4. 清除所有数据

**接口**: `DELETE /api/data`

**描述**: 清除服务器存储的所有数据

**响应示例**:
```json
{
  "success": true,
  "message": "所有数据已清除"
}
```

---

### 5. 心跳检测

**接口**: `GET /api/ping`

**描述**: 测试服务器连通性

**响应示例**:
```json
{
  "success": true,
  "message": "pong",
  "timestamp": 1777615200000
}
```

---

### 6. 文件下载

**接口**: `GET /api/download/:filename`

**描述**: 下载已上传的文件

**参数**:
- `filename`: 文件名（包含唯一ID前缀）

**示例**:
```
# 从消息中获取 downloadUrl，例如：/api/download/1777620780341_abc123_video.mp4
curl -O http://192.168.x.x:3001/api/download/1777620780341_abc123_video.mp4
```

**响应**: 
- 成功：直接下载文件
- 失败：返回404错误

---

### 7. 查看上传文件列表

**接口**: `GET /api/uploads`

**描述**: 查看所有已上传的文件信息（调试用）

**响应示例**:
```json
{
  "success": true,
  "count": 3,
  "totalSize": 95000000,
  "files": [
    {
      "name": "1777620780341_abc123_video.mp4",
      "size": 90246756,
      "sizeFormatted": "86.07 MB",
      "created": "2026-05-01T07:33:00.000Z"
    },
    {
      "name": "1777620955130_def456_test.pdf",
      "size": 1572864,
      "sizeFormatted": "1.5 MB",
      "created": "2026-05-01T07:35:55.000Z"
    }
  ]
}
```

---

## 💡 使用场景

### 1. 文件传输
- 从电脑发送文件到手机
- 支持图片、文档、音频、视频等任意文件类型
- 最大支持10GB文件传输

### 2. 消息推送
- 电脑向手机推送通知
- 实时消息提醒
- 远程消息传递

### 3. 数据同步
- 两设备间的数据同步
- 剪贴板共享
- 文本内容传输

### 4. 调试工具
- 移动应用开发调试
- API测试
- 网络请求调试

### 5. 远程控制
- 简单的远程控制功能
- 自动化脚本触发
- 设备状态监控

---

## 🎨 功能特性详解

### 拖拽文件自动发送

**操作流程**:
1. 打开Web界面（使用终端显示的URL，如 `http://192.168.x.x:3001`）
2. 将文件拖拽到消息输入框或指定区域
3. 松开鼠标，文件自动开始发送
4. 等待发送完成，查看结果

**技术实现**:
- 智能事件拦截策略（仅在非目标区域阻止默认行为）
- Base64文件编码并保存到文件系统
- 自动发送机制（延迟100ms确保UI更新）
- 进度提示和结果反馈
- 2秒智能轮询，数据变化时立即更新DOM

**注意事项**:
- 文件大小限制: 10GB
- 建议使用小文件测试（<100MB）
- 大文件传输需要更长时间（Base64编码 + 磁盘写入）
- 文件存储在 `uploads/` 目录，定期清理

---

### 设备自动识别

**识别内容**:
- 设备类型: Mac / Linux / Windows
- 设备名称: 自动生成（可手动修改）
- 设备ID: 唯一标识符（存储在LocalStorage）
- 屏幕宽度: 用于响应式布局

**设备命名规则**:
- Mac: "Mac Computer"
- Linux: "Linux PC"
- Windows: "Desktop PC"
- 其他: "Unknown Device"

---

### 响应式设计

**断点设计**:
- **宽屏PC** (≥1200px): 
  - 双栏布局
  - 顶部设备信息横幅
  - 完整功能展示
  
- **平板** (768px - 1199px):
  - 单栏布局
  - 侧边设备信息卡片
  - 优化的触摸体验
  
- **手机** (<768px):
  - 紧凑布局
  - 垂直堆叠
  - 大按钮设计

---

## ⚙️ 配置说明

### 端口配置

**修改端口**（默认3001）:

编辑 `electron-main.js` 或 `server.js`:
```javascript
const PORT = 3001; // 改为你想要的端口
```

**端口选择建议**:
- 3000-3010: 常用开发端口
- 8080-8090: 备选端口
- 避免使用1024以下特权端口

### 文件大小限制

**当前配置**: 10GB

**修改位置**:

前端 (`public/index.html`):
```javascript
if (file.size > 10 * 1024 * 1024 * 1024) {
    alert(`文件 "${file.name}" 超过10GB限制`);
    return;
}
```

后端 (`electron-main.js`):
```javascript
app.use(express.json({ limit: '10gb' }));
app.use(express.urlencoded({ extended: true, limit: '10gb' }));
```

**存储考虑**:
- **二进制直传（推荐）**: 文件直接保存到磁盘，无内存占用
- **Base64编码（兼容）**: Base64编码会增加约33%的数据量
- 文件保存到 `uploads/` 目录（不占用内存）
- 定期清理不需要的文件以释放磁盘空间
- 建议设备具备足够RAM用于大文件处理（至少512MB）

---

## 🔒 安全说明

### ⚠️ 重要提示

**使用环境**:
- ✅ 仅用于受信任的局域网环境
- ❌ 禁止在公共网络暴露
- ❌ 不建议直接在互联网使用

**生产环境建议**:
1. **添加身份验证**
   - Basic Auth
   - Token认证
   - Session管理

2. **启用HTTPS**
   - 使用自签名证书（内网）
   - 或使用Let's Encrypt（公网）

3. **添加速率限制**
   ```javascript
   const rateLimit = require('express-rate-limit');
   app.use(rateLimit({
     windowMs: 15 * 60 * 1000, // 15分钟
     max: 100 // 最多100个请求
   }));
   ```

4. **文件类型白名单**
   ```javascript
   const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
   if (!allowedTypes.includes(file.type)) {
     return res.status(400).json({ error: '不支持的文件类型' });
   }
   ```

---

## 🐛 故障排查

### 问题1: 无法访问Web界面

**可能原因**:
- 服务未启动
- 端口被占用
- 防火墙阻止

**解决方法**:
```bash
# 1. 检查服务是否运行
ps aux | grep node

# 2. 查看端口占用
lsof -i :3001

# 3. 检查防火墙设置
sudo ufw status  # Linux
pfctl -s rules   # macOS

# 4. 更换端口
# 编辑 electron-main.js 或 server.js，修改 PORT 常量
```

---

### 问题2: Android设备无法连接

**可能原因**:
- 不在同一Wi-Fi网络
- IP地址错误
- 网络隔离

**解决方法**:
```bash
# 1. 确认你的实际IP地址（查看服务启动时的终端输出）
ifconfig | grep inet  # macOS/Linux
ip addr show          # Linux

# 2. 测试连通性（在手机上用ping工具）
ping <your-actual-ip>  # 替换为你的实际IP

# 3. 检查路由器设置
# - 确保AP隔离已关闭
# - 确保设备可以互访
```

---

### 问题3: 文件拖拽不工作

**可能原因**:
- 浏览器不支持拖拽API
- JavaScript被禁用
- 页面未完全加载

**解决方法**:
```bash
# 1. 强制刷新页面
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# 2. 检查控制台错误
F12 → Console → 查看错误信息

# 3. 尝试不同浏览器
# 推荐使用Chrome或Firefox
```

---

### 问题4: 大文件传输失败

**可能原因**:
- Base64编码导致数据量增加（约33%）
- 网络超时
- 请求体大小限制

**解决方法**:
```
// 1. 使用 FormData 直接上传二进制文件（推荐）
const formData = new FormData();
formData.append('file', fileObject); // 不经过Base64编码
fetch('/api/send', { method: 'POST', body: formData });

// 2. 确认请求体限制已配置为10GB
app.use(express.json({ limit: '10gb' }));

// 3. 定期清理上传文件
rm -rf uploads/*
touch uploads/.gitkeep
```

---

### 问题5: 手机端访问看不到数据

**可能原因**:
- 手机和电脑不在同一Wi-Fi网络
- IP地址错误
- 服务器未启动或防火墙阻止
- 数据被清空

**解决方法**:
```bash
# 1. 确认服务正在运行
ps aux | grep electron

# 2. 查看终端显示的实际IP地址
# 启动时会显示：🌐 局域网访问: http://192.168.x.x:3001

# 3. 测试API连通性（在手机浏览器访问）
http://192.168.x.x:3001/api/info

# 4. 检查数据是否存在
http://192.168.x.x:3001/api/data

# 5. 确保智能轮询正常工作
# 前端每2秒自动检查新数据
# 打开浏览器控制台查看日志：[NetData] 🔄 轮询检查...
```

---

## 📊 性能优化

### 前端优化

1. **懒加载**: 按需加载资源
2. **防抖节流**: 优化频繁触发的事件
3. **虚拟滚动**: 大数据列表优化
4. **缓存策略**: LocalStorage缓存设备信息

### 后端优化

1. **文件二进制直传**: 使用 multer 处理 multipart/form-data，无 Base64 编码开销
2. **文件系统存储**: 大文件直接保存到磁盘，避免内存溢出
3. **连接池**: 复用数据库连接
4. **压缩**: 启用gzip压缩
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```
5. **限流**: 防止滥用
6. **异步处理**: 非阻塞I/O
7. **智能轮询**: 仅数据变化时更新DOM，减少不必要的渲染

---

## 🧪 测试

### 手动测试API

你可以使用curl或Postman等工具测试API：

**1. 测试服务器连通性**:
```bash
curl http://192.168.x.x:3001/api/ping
```

**2. 获取服务器信息**:
```bash
curl http://192.168.x.x:3001/api/info
```

**3. 发送测试数据**:
```bash
curl -X POST http://192.168.x.x:3001/api/send \
  -H "Content-Type: application/json" \
  -d '{"device":"Test","message":"Hello","type":"text"}'
```

**4. 查看所有数据**:
```bash
curl http://192.168.x.x:3001/api/data
```

**预期输出**:
```
{
  "success": true,
  "message": "pong",
  "timestamp": 1777615200000
}
```

**注意**: URL中的IP地址会根据你的网络环境自动变化。

---

## 📝 开发指南

### 项目结构

```
netdata/
├── electron-main.js       # Electron主进程（服务器）
├── preload.js            # Electron预加载脚本
├── server.js             # 独立服务器入口（可选）
├── package.json          # 项目配置和依赖
├── .gitignore            # Git忽略配置
├── README.md             # 项目文档
├── uploads/              # 上传文件存储目录
│   └── .gitkeep          # Git保留目录
└── public/               # 静态文件目录
    ├── index.html        # Web界面主文件
    ├── css/              # 样式文件
    │   └── main.css      # 主要样式
    └── js/               # JavaScript文件
        ├── device-info.js        # 设备信息检测
        ├── connection-settings.js # 连接设置和二维码
        └── file-upload.js        # 文件上传和拖拽
```

**关键文件说明**:
- `electron-main.js`: Express服务器、API路由、文件存储逻辑
- `server.js`: 独立Node.js服务器（不使用Electron时）
- `preload.js`: Electron IPC通信桥接
- `public/index.html`: Web界面主文件
- `public/css/main.css`: 全局样式
- `public/js/device-info.js`: 设备信息检测功能
- `public/js/connection-settings.js`: 连接设置和二维码功能
- `public/js/file-upload.js`: 文件上传和拖拽功能
- `uploads/`: 存储接收到的文件

### 开发流程

1. **克隆仓库**
   ```bash
   git clone https://github.com/UokyI/netdata.git
   cd netdata
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动服务**

   **纯Web模式**（浏览器访问）:
   ```bash
   npm start        # 正常启动
   npm run dev      # 开发模式（自动重启，推荐）
   ```
   
   **Electron桌面应用模式**:
   ```bash
   npm run electron:dev
   ```

4. **修改代码**
   - **后端**: 
     - Electron模式: 修改 `electron-main.js`
     - 纯Web模式: 修改 `server.js`
   - **前端**: 
     - 页面结构: `public/index.html`
     - 全局样式: `public/css/main.css`
     - 功能模块: 
       - `public/js/device-info.js` (设备信息检测)
       - `public/js/connection-settings.js` (连接设置与二维码)
       - `public/js/file-upload.js` (文件上传与拖拽处理)

5. **提交更改**
   ```bash
   git add .
   git commit -m "描述你的更改"
   git push
   ```

---

## 📞 支持与贡献

### 遇到问题？

1. **查看文档**: 本README包含了大部分常见问题
2. **提交Issue**: [GitHub Issues](https://github.com/UokyI/netdata/issues)
3. **查看现有Issue**: 可能已经有解决方案

### 贡献代码

欢迎贡献！请遵循以下步骤：

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

---

## 📄 许可证

ISC License

**权限说明**:
- ✅ 商业使用
- ✅ 修改
- ✅ 分发
- ✅ 私人使用
- ❌ 责任限制
- ❌ 损害赔偿

---

## 🙏 致谢

感谢所有使用和改进本项目的开发者！

---

## 📧 联系方式

- **作者**: UokyI
- **项目主页**: [https://github.com/UokyI/netdata](https://github.com/UokyI/netdata)
- **问题反馈**: [Issues](https://github.com/UokyI/netdata/issues)

---

**祝你使用愉快！** 🎉
