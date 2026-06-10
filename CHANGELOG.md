# Changelog

## [1.0.0] - 2026-06-10

### Added
- 同 Wi-Fi 下电脑与 Android 设备双向通信
- **Go 后端**（`main.go`），编译后 ~6MB 单文件可执行，零依赖
- **Node.js 后端**（`server.js`），Express.js 开发/调试
- **Electron 桌面应用**（`electron-main.js`）
- RESTful API（7 个接口：info / send / data / ping / download / uploads / clear）
- 响应式 Web 界面，适配 PC / 平板 / 手机
- 桌面端拖拽文件自动发送
- 移动端选文件自动发送（兼容 Android Chrome 已知 Bug）
- 中文文件名完整支持（UTF-8 charset）
- **PWA 支持**（`manifest.json` + `sw.js`），Android 可添加到主屏幕
- 赞赏码展示（仅桌面端显示）
- Windows 防火墙自动配置（`firewall.js`）
- SVG → ICO/PNG 图标自动生成（`scripts/generate-icons.js`）
- **GitHub Actions 自动发布**（`.github/workflows/release.yml`）
  - 推送 tag 后自动编译 Win/Mac/Linux/ARM64 四平台
  - 自动打包 `public/` + 二进制，创建 Release

### Changed
- 默认端口从 3001 → 52587（避免常见冲突）
- 提取共享路由 `routes.js`，消除 server.js 与 electron-main.js 代码重复

### Fixed
- Android 端无法上传文件（隐藏 input + 重复事件监听器）
- Android Chrome 选文件需选两次（改用 `<label for>` 标准方案）
- 中文文件名乱码（JSON 响应缺 charset=utf-8）
- 移动端 JSON 消息发送失败（Go 后端仅处理 multipart 未处理 JSON）
- README.md 中文编码损坏

### Removed
- 支付中心（Stripe / 支付宝），改为静态赞赏码
- Stripe 依赖包及相关 API 路由
- 孤儿文件 `public/js/payment.js`
- 冗余测试文件、重复的 donate-qr.png

