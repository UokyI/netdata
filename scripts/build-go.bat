@echo off
REM NetData Go 编译脚本 — 零依赖，单文件输出
REM 需要安装 Go: https://go.dev/dl/

echo ========================================
echo   NetData Go 编译
echo ========================================

REM 设置编译信息
set GOOS=windows
set GOARCH=amd64
set CGO_ENABLED=0

echo.
echo [1/3] 编译 Windows 64位...
go build -ldflags="-s -w" -o dist\netdata-server.exe main.go
echo       完成: dist\netdata-server.exe

echo.
echo [2/3] 编译 Windows 32位...
set GOARCH=386
go build -ldflags="-s -w" -o dist\netdata-server-x86.exe main.go
echo       完成: dist\netdata-server-x86.exe

echo.
echo [3/3] 编译 macOS (AMD64)...
set GOOS=darwin
set GOARCH=amd64
go build -ldflags="-s -w" -o dist\netdata-server-macos main.go
echo       完成: dist\netdata-server-macos

echo.
echo ========================================
echo   编译完成！
echo ========================================
dir dist\*.exe dist\netdata-server-macos 2>nul
echo.
pause
