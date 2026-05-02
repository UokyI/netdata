/**
 * NetData - 连接设置功能
 * 提供客户端连接信息展示和二维码扫码功能
 */

// ========== 连接设置相关功能 ==========

// 获取局域网访问URL（优先返回非localhost的IP地址）
function getAccessUrl() {
    // 在Electron环境中，从服务器获取真实的局域网IP
    if (window.electronAPI && window.electronAPI.getServerInfo) {
        // 如果是Electron环境，尝试从服务器获取
        return new Promise((resolve) => {
            window.electronAPI.getServerInfo().then(info => {
                if (info && info.ip) {
                    resolve(`http://${info.ip}:${info.port || 3001}`);
                } else {
                    // 降级：使用location.hostname
                    const hostname = window.location.hostname;
                    if (hostname === 'localhost' || hostname === '127.0.0.1') {
                        // 如果只有localhost，显示提示
                        resolve('请查看控制台获取局域网IP');
                    } else {
                        resolve(window.location.origin);
                    }
                }
            }).catch(() => {
                resolve(window.location.origin);
            });
        });
    } else {
        // 浏览器环境，直接使用location.origin
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            // 尝试从页面其他位置获取已知的局域网IP
            return Promise.resolve(getLocalIpAddress() || window.location.origin);
        }
        return Promise.resolve(window.location.origin);
    }
}

// 获取本地局域网IP地址
function getLocalIpAddress() {
    // 尝试从服务器响应中获取真实IP
    // 这里可以检查页面上是否已经显示了局域网IP
    const urlElements = document.querySelectorAll('.url-display, #modalAccessUrl, #hintUrl');
    for (const el of urlElements) {
        const text = el.textContent;
        const ipMatch = text.match(/http:\/\/(\d+\.\d+\.\d+\.\d+):/);
        if (ipMatch && ipMatch[1] !== '127.0.0.1') {
            return `http://${ipMatch[1]}:${window.location.port || '3001'}`;
        }
    }
    return null;
}

// 显示首次使用提示
async function showFirstTimeHint() {
    // 检查是否已经显示过
    const hasSeenHint = localStorage.getItem('netdata_has_seen_hint');
    
    if (!hasSeenHint) {
        const hintEl = document.getElementById('firstTimeHint');
        const urlDisplay = document.getElementById('hintUrl');
        
        if (hintEl && urlDisplay) {
            // 获取局域网IP URL
            const url = await getAccessUrl();
            urlDisplay.textContent = typeof url === 'string' ? url : '获取中...';
            hintEl.style.display = 'block';
            
            // 5秒后自动隐藏
            setTimeout(() => {
                dismissFirstTimeHint(true);
            }, 5000);
        }
    }
}

// 关闭首次使用提示
function dismissFirstTimeHint(autoDismiss = false) {
    const hintEl = document.getElementById('firstTimeHint');
    if (hintEl) {
        hintEl.style.display = 'none';
    }
    
    // 记录用户已看过提示
    localStorage.setItem('netdata_has_seen_hint', 'true');
    
    if (autoDismiss) {
        console.log('[NetData] 💡 首次使用提示自动关闭');
    }
}

// 从提示条复制URL
async function copyFromHint() {
    const url = await getAccessUrl();
    const urlStr = typeof url === 'string' ? url : '请等待URL加载完成';
    copyToClipboard(urlStr, 'URL已复制到剪贴板');
}

// 从提示条显示二维码
async function showQRCodeFromHint() {
    await openSettingsModal();
}

// 打开设置模态框
async function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const urlDisplay = document.getElementById('modalAccessUrl');
    
    if (modal && urlDisplay) {
        // 获取局域网IP URL
        const url = await getAccessUrl();
        urlDisplay.textContent = typeof url === 'string' ? url : '获取中...';
        
        modal.style.display = 'flex';
        
        // 更新设备信息
        updateModalDeviceInfo();
        
        // 生成二维码（延迟100ms确保DOM已渲染）
        setTimeout(() => {
            generateQRCode(typeof url === 'string' ? url : window.location.origin);
        }, 100);
        
        console.log('[NetData] ⚙️ 设置模态框已打开');
    }
}

// 更新模态框中的设备信息
function updateModalDeviceInfo() {
    const deviceNameEl = document.getElementById('modalDeviceName');
    const deviceIdEl = document.getElementById('modalDeviceId');
    const deviceTypeEl = document.getElementById('modalDeviceType');
    
    // 从localStorage或当前状态获取设备信息
    const deviceName = localStorage.getItem('netdata_device_name') || document.getElementById('deviceName')?.value || '-';
    const deviceId = localStorage.getItem('netdata_device_id') || '-';
    const deviceType = document.getElementById('deviceType')?.textContent || '-';
    
    if (deviceNameEl) deviceNameEl.textContent = deviceName;
    if (deviceIdEl) deviceIdEl.textContent = deviceId;
    if (deviceTypeEl) deviceTypeEl.textContent = deviceType;
    
    console.log('[NetData] 📱 模态框设备信息已更新');
}

// 关闭设置模态框
function closeSettingsModal(event) {
    // 如果传入了event，只在点击背景时关闭
    if (event && event.target !== event.currentTarget) {
        return;
    }
    
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.style.display = 'none';
        console.log('[NetData] ⚙️ 设置模态框已关闭');
    }
}

// 生成二维码
function generateQRCode(url) {
    const qrcodeContainer = document.getElementById('modalQrcode');
    
    if (!qrcodeContainer) return;
    
    // 清空之前的二维码
    qrcodeContainer.innerHTML = '';
    
    // 使用 QRCode.js 生成二维码
    try {
        new QRCode(qrcodeContainer, {
            text: url,
            width: 180,
            height: 180,
            colorDark: '#2d3748',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
        
        console.log('[NetData] 📱 二维码已生成');
    } catch (error) {
        console.error('[NetData] ❌ 二维码生成失败:', error);
        qrcodeContainer.innerHTML = '<div style="color: red; font-size: 0.9em;">二维码生成失败</div>';
    }
}

// 从模态框复制URL
async function copyFromModal() {
    const url = await getAccessUrl();
    copyToClipboard(url, 'URL已复制到剪贴板');
}

// 在新标签页打开URL
async function openInNewTab() {
    const url = await getAccessUrl();
    window.open(url, '_blank');
    console.log('[NetData] 🌐 在新标签页打开:', url);
}

// 刷新二维码
async function refreshQRCode() {
    const url = await getAccessUrl();
    generateQRCode(url);
    console.log('[NetData] 🔄 二维码已刷新');
}

// 通用剪贴板复制函数
function copyToClipboard(text, successMsg = '已复制') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        // 现代浏览器 API
        navigator.clipboard.writeText(text).then(() => {
            showToast(successMsg);
        }).catch(err => {
            console.error('复制失败:', err);
            fallbackCopy(text, successMsg);
        });
    } else {
        // 降级方案
        fallbackCopy(text, successMsg);
    }
}

// 降级复制方法
function fallbackCopy(text, successMsg) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showToast(successMsg);
    } catch (err) {
        console.error('复制失败:', err);
        showToast('复制失败，请手动复制', 'error');
    }
    
    document.body.removeChild(textarea);
}

// 显示提示消息（Toast）
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : '#f56565'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 99999;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 2000);
}

console.log('[NetData] ✅ 连接设置功能已加载');
