// NetData - 同Wi-Fi下设备通信服务 (Go 版)
// 零依赖，标准库即可编译。编译后 ~7MB。

package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"
)

// ========== 配置 ==========
const (
	defaultPort = "52587"
	uploadDir   = "uploads"
	publicDir   = "public"
	maxFileSize = 10 << 30 // 10GB
)

var (
	port         = defaultPort
	receivedData []DataItem
	mu           sync.Mutex
)

// ========== 数据结构 ==========
type DataItem struct {
	ID          int    `json:"id"`
	Device      string `json:"device"`
	Message     string `json:"message"`
	Type        string `json:"type"`
	Timestamp   string `json:"timestamp"`
	ReceivedAt  int64  `json:"receivedAt"`
	FileName    string `json:"fileName,omitempty"`
	FileSize    int64  `json:"fileSize,omitempty"`
	FileType    string `json:"fileType,omitempty"`
	DownloadURL string `json:"downloadUrl,omitempty"`
}

type FileInfo struct {
	Name          string `json:"name"`
	Size          int64  `json:"size"`
	SizeFormatted string `json:"sizeFormatted"`
	Created       string `json:"created"`
}

// ========== 工具函数 ==========

func getLocalIP() string {
	interfaces, _ := net.Interfaces()
	for _, iface := range interfaces {
		addrs, _ := iface.Addrs()
		for _, addr := range addrs {
			ipNet, ok := addr.(*net.IPNet)
			if !ok || ipNet.IP.IsLoopback() || ipNet.IP.To4() == nil {
				continue
			}
			ip := ipNet.IP.String()
			if strings.HasPrefix(ip, "192.168.") || strings.HasPrefix(ip, "10.") || strings.HasPrefix(ip, "172.") {
				return ip
			}
		}
	}
	return "127.0.0.1"
}

func formatFileSize(bytes int64) string {
	if bytes == 0 {
		return "0 Bytes"
	}
	units := []string{"Bytes", "KB", "MB", "GB"}
	k := 1024.0
	i := 0
	size := float64(bytes)
	for size >= k && i < len(units)-1 {
		size /= k
		i++
	}
	return fmt.Sprintf("%.2f %s", size, units[i])
}

func jsonResponse(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(data)
}

// ========== Windows 防火墙 ==========

func ensureFirewall() {
	if runtime.GOOS != "windows" {
		return
	}
	ruleName := "NetData Server"
	checkCmd := exec.Command("netsh", "advfirewall", "firewall", "show", "rule", "name="+ruleName)
	if err := checkCmd.Run(); err == nil {
		log.Printf("🔒 防火墙规则已存在: %s (端口 %s)", ruleName, port)
		return
	}
	addCmd := exec.Command("netsh", "advfirewall", "firewall", "add", "rule",
		"name="+ruleName, "dir=in", "action=allow", "protocol=TCP", "localport="+port)
	addCmd.Stdout = os.Stdout
	addCmd.Stderr = os.Stderr
	if err := addCmd.Run(); err != nil {
		log.Printf("⚠️  无法自动配置防火墙 (需管理员权限): netsh advfirewall firewall add rule name=\"%s\" dir=in action=allow protocol=TCP localport=%s", ruleName, port)
	} else {
		log.Printf("✅ 已自动添加防火墙规则: %s (端口 %s)", ruleName, port)
	}
}

// ========== 首页 ==========

func landingPage(ip string) string {
	return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>NetData - Wi-Fi通信服务</title><style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;justify-content:center;align-items:center;padding:20px}
.container{background:#fff;border-radius:20px;padding:40px;box-shadow:0 20px 60px rgba(0,0,0,.3);max-width:600px;width:100%}
h1{color:#333;margin-bottom:10px;font-size:2em}.subtitle{color:#666;margin-bottom:30px}
.info-box{background:#f0f4ff;border-left:4px solid #667eea;padding:20px;margin-bottom:20px;border-radius:8px}
.info-box h3{color:#667eea;margin-bottom:10px}.info-box p{color:#333;line-height:1.6;margin-bottom:8px}
.qr-section{text-align:center;margin:30px 0}
.access-url{background:#667eea;color:#fff;padding:15px 25px;border-radius:10px;font-size:1.2em;font-weight:700;display:inline-block;margin:10px 0;word-break:break-all}
.instructions{background:#fff5f5;border:2px solid #fc8181;padding:20px;border-radius:8px;margin-top:20px}
.instructions h3{color:#c53030;margin-bottom:15px}.instructions ol{color:#333;padding-left:20px}
.instructions li{margin-bottom:10px;line-height:1.6}
.status{display:flex;align-items:center;margin-top:20px;padding:15px;background:#f0fff4;border-radius:8px}
.status-dot{width:12px;height:12px;background:#48bb78;border-radius:50%;margin-right:10px;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
.status-text{color:#22543d;font-weight:500}
</style></head><body><div class="container"><h1>🌐 NetData 服务</h1><p class="subtitle">同Wi-Fi下电脑与Android设备通信</p>
<div class="info-box"><h3>📡 服务器信息</h3><p><strong>状态:</strong> ✅ 运行中</p><p><strong>端口:</strong> ` + port + `</p><p><strong>启动时间:</strong> ` + time.Now().Format("2006-01-02 15:04:05") + `</p></div>
<div class="qr-section"><h3 style="color:#333;margin-bottom:15px">Android设备访问地址</h3><div class="access-url">http://` + ip + `:` + port + `</div><p style="color:#666;margin-top:15px;font-size:.9em">在Android浏览器中输入以上地址</p></div>
<div class="instructions"><h3>📖 使用说明</h3><ol><li>确保Android设备连接到同一Wi-Fi网络</li><li>在Android浏览器中访问上方显示的URL</li><li>使用API接口进行数据传输</li><li>查看控制台查看接收到的数据</li></ol></div>
<div class="status"><div class="status-dot"></div><span class="status-text">等待Android设备连接...</span></div></div></body></html>`
}

// ========== API 路由 ==========

func handleInfo(w http.ResponseWriter, r *http.Request) {
	ip := getLocalIP()
	jsonResponse(w, map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"ip":        ip,
			"port":      port,
			"accessUrl": fmt.Sprintf("http://%s:%s", ip, port),
			"timestamp": time.Now().Format(time.RFC3339),
			"message":   "Android设备可以通过此URL访问",
		},
	})
}

func handleSend(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var device, message, msgType, fileName, fileTypeStr string
	var fileSize int64

	contentType := r.Header.Get("Content-Type")

	if strings.HasPrefix(contentType, "multipart/form-data") {
		// ====== FormData 文件上传 ======
		if err := r.ParseMultipartForm(maxFileSize); err != nil {
			jsonResponse(w, map[string]interface{}{"success": false, "message": "文件解析失败: " + err.Error()})
			return
		}

		device = r.FormValue("device")
		message = r.FormValue("message")
		msgType = r.FormValue("type")
		fileName = r.FormValue("fileName")
		fileSize, _ = strconv.ParseInt(r.FormValue("fileSize"), 10, 64)
		fileTypeStr = r.FormValue("fileType")
	} else {
		// ====== JSON 文本消息 ======
		body, err := io.ReadAll(r.Body)
		if err != nil {
			jsonResponse(w, map[string]interface{}{"success": false, "message": "请求体读取失败"})
			return
		}
		var req map[string]interface{}
		if err := json.Unmarshal(body, &req); err != nil {
			jsonResponse(w, map[string]interface{}{"success": false, "message": "JSON 解析失败"})
			return
		}
		device, _ = req["device"].(string)
		message, _ = req["message"].(string)
		msgType, _ = req["type"].(string)
		if msgType == "" {
			msgType = "text"
		}
	}

	if device == "" {
		device = "Unknown Device"
	}
	if msgType == "" {
		msgType = "text"
	}

	mu.Lock()
	item := DataItem{
		ID:         len(receivedData) + 1,
		Device:     device,
		Message:    message,
		Type:       msgType,
		Timestamp:  time.Now().Format(time.RFC3339),
		ReceivedAt: time.Now().UnixMilli(),
	}

	if msgType == "file" {
		// FormData 文件上传
		file, header, err := r.FormFile("file")
		if err == nil {
			defer file.Close()

			uniqueID := fmt.Sprintf("%d_%s", time.Now().UnixMilli(), randomString(9))
			safeName := sanitizeFilename(header.Filename)
			savedName := uniqueID + "_" + safeName
			savePath := filepath.Join(uploadDir, savedName)

			dst, err := os.Create(savePath)
			if err == nil {
				written, _ := io.Copy(dst, file)
				dst.Close()

				item.FileName = header.Filename
				item.FileSize = written
				item.FileType = header.Header.Get("Content-Type")
				item.DownloadURL = "/api/download/" + savedName

				log.Printf("\n📁 文件已保存: %s (%s)", savePath, formatFileSize(written))
				log.Printf("   📥 下载链接: http://localhost:%s%s", port, item.DownloadURL)
			} else {
				item.Message = "[FILE] 保存失败: " + err.Error()
			}
		} else {
			// 兼容 Base64（从 JSON body 读取，但 Go 的 ParseMultipartForm 已处理）
			item.FileName = fileName
			item.FileSize = fileSize
			item.FileType = fileTypeStr
		}
	}

	receivedData = append(receivedData, item)
	mu.Unlock()

	log.Printf("\n📱 收到来自 %s 的数据: 类型=%s 内容=%s", device, msgType, message)
	if msgType == "file" {
		log.Printf("   文件名: %s 大小: %s", item.FileName, formatFileSize(item.FileSize))
		if item.DownloadURL != "" {
			log.Printf("   ✅ 文件已存储，可通过链接访问")
		}
	}

	jsonResponse(w, map[string]interface{}{
		"success": true,
		"message": "数据接收成功",
		"data":    item,
	})
}

func handleData(w http.ResponseWriter, r *http.Request) {
	mu.Lock()
	defer mu.Unlock()
	jsonResponse(w, map[string]interface{}{
		"success": true,
		"count":   len(receivedData),
		"data":    receivedData,
	})
}

func handleClearData(w http.ResponseWriter, r *http.Request) {
	mu.Lock()
	receivedData = nil
	mu.Unlock()
	jsonResponse(w, map[string]interface{}{
		"success": true,
		"message": "数据已清除",
	})
}

func handlePing(w http.ResponseWriter, r *http.Request) {
	jsonResponse(w, map[string]interface{}{
		"success":   true,
		"message":   "pong",
		"timestamp": time.Now().UnixMilli(),
	})
}

func handleDownload(w http.ResponseWriter, r *http.Request) {
	filename := filepath.Base(r.URL.Path[len("/api/download/"):])
	if filename == "." || filename == "/" {
		http.Error(w, "无效的文件名", http.StatusBadRequest)
		return
	}

	filePath := filepath.Join(uploadDir, filename)
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		jsonResponse(w, map[string]interface{}{"success": false, "message": "文件不存在"})
		return
	}

	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	http.ServeFile(w, r, filePath)
}

func handleUploadsList(w http.ResponseWriter, r *http.Request) {
	entries, err := os.ReadDir(uploadDir)
	if err != nil {
		jsonResponse(w, map[string]interface{}{"success": false, "message": err.Error()})
		return
	}

	var files []FileInfo
	var totalSize int64
	for _, entry := range entries {
		if entry.Name() == ".gitkeep" {
			continue
		}
		info, _ := entry.Info()
		files = append(files, FileInfo{
			Name:          info.Name(),
			Size:          info.Size(),
			SizeFormatted: formatFileSize(info.Size()),
			Created:       info.ModTime().Format(time.RFC3339),
		})
		totalSize += info.Size()
	}

	jsonResponse(w, map[string]interface{}{
		"success":   true,
		"count":     len(files),
		"totalSize": totalSize,
		"files":     files,
	})
}

// ========== 辅助函数 ==========

func randomString(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[time.Now().UnixNano()%int64(len(letters))]
		time.Sleep(1) // 简单去重
	}
	return string(b)
}

func sanitizeFilename(name string) string {
	result := strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '.' || r == '_' || r == '-' {
			return r
		}
		return '_'
	}, name)
	return result
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// ========== 主入口 ==========

func main() {
	if envPort := os.Getenv("PORT"); envPort != "" {
		port = envPort
	}

	// 确保上传目录存在
	os.MkdirAll(uploadDir, 0755)

	// 自动配置防火墙
	ensureFirewall()

	// 路由
	mux := http.NewServeMux()

	// API 路由
	mux.HandleFunc("/api/info", handleInfo)
	mux.HandleFunc("/api/send", handleSend)
	mux.HandleFunc("/api/data", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handleData(w, r)
		case http.MethodDelete:
			handleClearData(w, r)
		default:
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/ping", handlePing)
	mux.HandleFunc("/api/download/", handleDownload)
	mux.HandleFunc("/api/uploads", handleUploadsList)

	// 静态文件 (public/)
	fs := http.FileServer(http.Dir(publicDir))
	mux.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 先尝试静态文件
		path := filepath.Join(publicDir, r.URL.Path)
		if _, err := os.Stat(path); err == nil && r.URL.Path != "/" {
			fs.ServeHTTP(w, r)
			return
		}
		// 首页
		if r.URL.Path == "/" {
			// 如果有 public/index.html 就返回它
			if _, err := os.Stat(filepath.Join(publicDir, "index.html")); err == nil {
				http.ServeFile(w, r, filepath.Join(publicDir, "index.html"))
				return
			}
			// 否则返回内置首页
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			fmt.Fprint(w, landingPage(getLocalIP()))
			return
		}
		fs.ServeHTTP(w, r)
	}))

	// 启动
	addr := "0.0.0.0:" + port
	ip := getLocalIP()

	fmt.Println(strings.Repeat("=", 50))
	fmt.Println("🚀 NetData 服务已启动 (Go)")
	fmt.Println(strings.Repeat("=", 50))
	fmt.Printf("📡 本地访问: http://localhost:%s\n", port)
	fmt.Printf("🌐 局域网访问: http://%s:%s\n", ip, port)
	fmt.Printf("\n📱 Android设备可以在浏览器中输入: http://%s:%s\n", ip, port)
	fmt.Println(strings.Repeat("=", 50))
	fmt.Println("\n按 Ctrl+C 停止服务\n")

	handler := corsMiddleware(mux)
	server := &http.Server{
		Addr:         addr,
		Handler:      handler,
		ReadTimeout:  30 * time.Minute, // 大文件上传需要
		WriteTimeout: 30 * time.Minute,
		IdleTimeout:  60 * time.Second,
	}

	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("服务启动失败: %v", err)
	}
}
