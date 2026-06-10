#!/bin/bash
# NetData Go 编译脚本 (macOS/Linux)
# 需要安装 Go: https://go.dev/dl/

echo "========================================"
echo "  NetData Go 编译"
echo "========================================"

# 确保 dist 目录存在
mkdir -p dist

# Windows
echo "[1/4] 编译 Windows 64位..."
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o dist/netdata-server.exe main.go
echo "      完成: dist/netdata-server.exe"

# macOS Intel
echo "[2/4] 编译 macOS Intel..."
GOOS=darwin GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o dist/netdata-server-macos-amd64 main.go
echo "      完成: dist/netdata-server-macos-amd64"

# macOS Apple Silicon
echo "[3/4] 编译 macOS Apple Silicon..."
GOOS=darwin GOARCH=arm64 CGO_ENABLED=0 go build -ldflags="-s -w" -o dist/netdata-server-macos-arm64 main.go
echo "      完成: dist/netdata-server-macos-arm64"

# Linux
echo "[4/4] 编译 Linux 64位..."
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o dist/netdata-server-linux main.go
echo "      完成: dist/netdata-server-linux"

echo ""
echo "========================================"
echo "  编译完成！"
echo "========================================"
ls -lh dist/
echo ""
