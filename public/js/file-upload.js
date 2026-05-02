        function initDropZone() {
            const fileInput = document.getElementById('fileInput');
            const messageTextarea = document.getElementById('message');
            
            if (!fileInput) {
                console.error('[NetData] 找不到文件输入元素');
                return;
            }
            
            if (!messageTextarea) {
                console.error('[NetData] 找不到消息输入框元素');
                return;
            }
            
            console.log('[NetData] 找到文件输入元素和消息输入框');
            
            // 文件选择器变化
            fileInput.addEventListener('change', (e) => {
                console.log('[NetData] 文件选择器变化, 文件数量:', e.target.files.length);
                handleFiles(e.target.files);
                fileInput.value = ''; // 清空以便重复选择同一文件
            });
            
            // textarea支持拖拽
            messageTextarea.addEventListener('dragenter', (e) => {
                e.preventDefault();
                e.stopPropagation();
                messageTextarea.classList.add('drag-over');
                console.log('[NetData] textarea dragenter事件触发');
            });
            
            messageTextarea.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                messageTextarea.classList.add('drag-over');
            });
            
            messageTextarea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                messageTextarea.classList.remove('drag-over');
            });
            
            messageTextarea.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                messageTextarea.classList.remove('drag-over');
                
                const files = e.dataTransfer.files;
                console.log('[NetData] textarea drop事件触发, 文件数量:', files.length);
                
                if (files.length > 0) {
                    // 处理文件并自动发送
                    handleFiles(files);
                    console.log('[NetData] handleFiles调用完成, pendingFiles数量:', pendingFiles.length);
                    
                    // 如果有文件且当前没有正在发送的文件，自动发送第一个
                    if (pendingFiles.length > 0) {
                        const lastFileIndex = pendingFiles.length - 1;
                        console.log('[NetData] 准备自动发送文件, 索引:', lastFileIndex);
                        setTimeout(() => {
                            console.log('[NetData] 开始执行sendFile, 索引:', lastFileIndex);
                            sendFile(lastFileIndex);
                        }, 100);
                    } else {
                        console.warn('[NetData] pendingFiles为空，无法自动发送');
                    }
                }
            });

            console.log('[NetData] 拖拽区域初始化完成');
        }
        
        // ✅ 初始化移动端文件上传功能
        function initMobileUpload() {
            const isMobile = checkIsMobile();
            const mobileUploadSection = document.getElementById('mobileUploadSection');
            const mobileUploadBtn = document.getElementById('mobileUploadBtn');
            const dragHint = document.getElementById('dragHint');
            const fileInput = document.getElementById('fileInput');
            
            console.log('[NetData] 设备类型检测:', isMobile ? '移动端' : '桌面端');
            
            if (isMobile) {
                // 移动端：显示文件上传按钮，隐藏拖拽提示
                if (mobileUploadSection) {
                    mobileUploadSection.style.display = 'block';
                }
                if (dragHint) {
                    dragHint.style.display = 'none';
                }
                
                // 绑定点击事件
                if (mobileUploadBtn && fileInput) {
                    mobileUploadBtn.addEventListener('click', () => {
                        console.log('[NetData] 📎 移动端点击文件上传按钮');
                        fileInput.click();
                    });
                    
                    // 监听文件选择
                    fileInput.addEventListener('change', (e) => {
                        console.log('[NetData] 📎 文件选择触发, 文件数量:', e.target.files.length);
                        if (e.target.files.length > 0) {
                            handleFiles(e.target.files);
                            
                            // 自动发送第一个文件
                            setTimeout(() => {
                                sendFile(0);
                            }, 100);
                        }
                    });
                }
                
                console.log('[NetData] ✅ 移动端文件上传功能已启用');
            } else {
                // 桌面端：隐藏文件上传按钮，显示拖拽提示
                if (mobileUploadSection) {
                    mobileUploadSection.style.display = 'none';
                }
                if (dragHint) {
                    dragHint.style.display = 'block';
                }
                
                console.log('[NetData] ✅ 桌面端拖拽模式已启用');
            }
        }
        
        // 检测是否为移动设备
        function checkIsMobile() {
            const ua = navigator.userAgent.toLowerCase();
            const isPhone = /android|webos|iphone|ipad|ipod|blackberry|windows phone/.test(ua);
            const isSmallScreen = window.innerWidth < 768; // 屏幕宽度小于768px
            
            return isPhone || isSmallScreen;
        }
        
        // 处理文件
        function handleFiles(files) {
            console.log('[NetData] handleFiles被调用, 文件数量:', files.length);
            const fileList = Array.from(files);
            
            fileList.forEach(file => {
                console.log('[NetData] 处理文件:', file.name, '大小:', file.size, '类型:', file.type);
                
                // 检查文件大小（限制为10GB）
                if (file.size > 10 * 1024 * 1024 * 1024) {
                    alert(`文件 "${file.name}" 超过10GB限制`);
                    return;
                }
                
                // 添加到待发送列表
                pendingFiles.push({
                    file: file,
                    id: Date.now() + Math.random(),
                    status: 'pending'
                });
                
                console.log('[NetData] 文件已添加到pendingFiles, 当前总数:', pendingFiles.length);
            });
            
            updateFileList();
            console.log('[NetData] 文件列表UI已更新');
        }
        
        // 更新文件列表显示
        function updateFileList() {
            const fileListEl = document.getElementById('fileList');
            
            if (pendingFiles.length === 0) {
                fileListEl.innerHTML = '';
                return;
            }
            
            let html = '';
            pendingFiles.forEach((item, index) => {
                const fileSize = formatFileSize(item.file.size);
                const fileIcon = getFileIcon(item.file.type);
                
                html += `
                    <div class="file-item" id="file-${item.id}">
                        <div class="file-icon">${fileIcon}</div>
                        <div class="file-info">
                            <div class="file-name">${item.file.name}</div>
                            <div class="file-size">${fileSize}</div>
                            ${item.status === 'sending' ? '<div class="file-progress"><div class="file-progress-bar" style="width: 50%"></div></div>' : ''}
                        </div>
                        <div class="file-actions">
                            ${item.status === 'pending' ? `<button class="file-btn file-btn-send" onclick="sendFile(${index})">发送</button>` : ''}
                            <button class="file-btn file-btn-remove" onclick="removeFile(${index})">移除</button>
                        </div>
                    </div>
                `;
            });
            
            fileListEl.innerHTML = html;
        }
        
        // 格式化文件大小
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        // 发送文件（按钮点击触发）
        async function sendFile(index) {
            console.log('[NetData] 📤 点击发送按钮，索引:', index);
            
            if (index < 0 || index >= pendingFiles.length) {
                console.error('[NetData] ❌ 文件索引无效:', index);
                return;
            }
            
            const item = pendingFiles[index];
            console.log('[NetData] 准备发送文件:', item.file.name);
            
            await sendFileItem(item, index);
        }
        
        // 获取文件图标
        function getFileIcon(mimeType) {
            if (mimeType.startsWith('image/')) return '🖼️';
            if (mimeType.startsWith('video/')) return '🎥';
            if (mimeType.startsWith('audio/')) return '🎵';
            if (mimeType.includes('pdf')) return '📄';
            if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
            if (mimeType.includes('text')) return '📝';
            return '📎';
        }
        
        // 发送单个文件 - 使用FormData直接上传二进制文件
        async function sendFileItem(item, index) {
            const responseEl = document.getElementById('fileResponse');
            
            // 如果找不到响应区域，至少要有日志输出
            if (!responseEl) {
                console.error('[NetData] ❌ 找不到 fileResponse 元素！');
            }
            
            // 更新状态为发送中
            item.status = 'sending';
            updateFileList();
            
            responseEl.innerHTML = '<div class="loading"><div class="spinner"></div> 正在发送文件...</div>';
            
            try {
                // ✅ 优化方案：使用 FormData 直接上传二进制文件，避免 Base64 编码
                const formData = new FormData();
                
                // 获取设备名称
                const deviceName = document.getElementById('deviceName').value;
                const deviceWithId = `${deviceName} (${deviceId.substr(-6)})`;
                
                // 添加文件信息
                formData.append('device', deviceWithId);
                formData.append('message', `[FILE] ${item.file.name} (${formatFileSize(item.file.size)})`);
                formData.append('type', 'file');
                formData.append('fileName', item.file.name);
                formData.append('fileSize', item.file.size.toString());
                formData.append('fileType', item.file.type || 'application/octet-stream');
                formData.append('file', item.file); // 直接附加二进制文件
                
                // 发送文件
                const response = await fetch(`${serverUrl}/api/send`, {
                    method: 'POST',
                    body: formData // 浏览器自动设置正确的 Content-Type
                });
                
                const data = await response.json();
                
                if (data.success) {
                    responseEl.innerHTML = `
                        <div class="response-box success">
<strong>✅ 文件发送成功!</strong><br>
文件名: ${item.file.name}<br>
大小: ${formatFileSize(item.file.size)}
                        </div>
                    `;
                    
                    // 从列表中移除已发送的文件
                    pendingFiles.splice(index, 1);
                    updateFileList();
                    
                    // 刷新消息窗口
                    loadReceivedData();
                } else {
                    throw new Error(data.message || '发送失败');
                }
            } catch (error) {
                item.status = 'pending';
                updateFileList();
                
                responseEl.innerHTML = `
                    <div class="response-box error">
<strong>❌ 发送失败:</strong> ${error.message}
                    </div>
                `;
            }
        }
        
        // 读取文件为Base64
        function readFileAsBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }
        
        // 移除文件
        function removeFile(index) {
            if (index < 0 || index >= pendingFiles.length) return;
            
            pendingFiles.splice(index, 1);
            updateFileList();
            
            const responseEl = document.getElementById('fileResponse');
            responseEl.innerHTML = '';
        }
        
        // 初始化应用
        function initApp() {
            console.log('[NetData] 开始初始化应用...');
            
            // 初始化拖拽区域
            initDropZone();
            console.log('[NetData] 拖拽区域初始化完成');
            
            // ✅ 初始化移动端文件上传功能
            initMobileUpload();
        }
