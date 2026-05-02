// 更新设备信息
        function updateDeviceInfo() {
            console.log('开始检测设备信息...');
            const ua = navigator.userAgent;
            console.log('User-Agent:', ua);
            
            let deviceType = 'Unknown';
            let defaultDeviceName = 'Unknown Device';
            
            // 更精确的设备类型检测
            if (/Android/i.test(ua)) {
                deviceType = 'Android';
                
                // 尝试获取Android设备型号
                const match = ua.match(/Android[\s\/]+([\d.]+);[\s]*([^;)]+)/);
                if (match && match[2]) {
                    defaultDeviceName = match[2].trim(); // 例如 "Pixel 5", "Samsung S21"
                    console.log('检测到Android设备型号:', defaultDeviceName);
                } else {
                    defaultDeviceName = 'Android Device';
                    console.log('检测到Android设备，但无法获取具体型号');
                }
            } else if (/iPhone|iPad|iPod/i.test(ua)) {
                deviceType = 'iOS';
                defaultDeviceName = 'Apple Device';
                console.log('检测到iOS设备');
            } else if (/Windows/i.test(ua)) {
                deviceType = 'Windows PC';
                defaultDeviceName = 'Windows PC';
                console.log('检测到Windows系统');
            } else if (/Macintosh/i.test(ua)) {
                deviceType = 'Mac';
                defaultDeviceName = 'Mac Computer';
                console.log('检测到Mac系统');
            } else if (/Linux/i.test(ua)) {
                deviceType = 'Linux';
                defaultDeviceName = 'Linux PC';
                console.log('检测到Linux系统');
            } else {
                deviceType = 'Desktop';
                defaultDeviceName = 'Desktop PC';
                console.log('检测到桌面设备');
            }
            
            console.log('设备类型:', deviceType);
            console.log('设备名称:', defaultDeviceName);
            
            // 更新DOM元素（只保留deviceType）
            const deviceTypeEl = document.getElementById('deviceType');
            
            if (deviceTypeEl) {
                deviceTypeEl.textContent = deviceType;
                console.log('已更新设备类型显示');
            } else {
                console.error('找不到deviceType元素');
            }
            
            // 保存设备信息到localStorage（供模态框使用）
            localStorage.setItem('netdata_device_name', defaultDeviceName);
            localStorage.setItem('netdata_device_id', deviceId);
            localStorage.setItem('netdata_screen_width', window.screen.width.toString());
            console.log('已保存设备信息到localStorage');
            
            // 设置默认设备名称（如果还没有设置过）
            const deviceNameInput = document.getElementById('deviceName');
            if (deviceNameInput && !deviceNameInput.dataset.hasBeenSet) {
                deviceNameInput.value = defaultDeviceName;
                deviceNameInput.dataset.hasBeenSet = 'true';
                console.log('已设置设备名称输入框:', defaultDeviceName);
            }
            
            // 设置默认消息内容（如果还没有设置过）
            const messageInput = document.getElementById('message');
            if (messageInput && !messageInput.dataset.hasBeenSet) {
                messageInput.value = `Hello from ${defaultDeviceName}!`;
                messageInput.dataset.hasBeenSet = 'true';
                console.log('已设置默认消息:', messageInput.value);
            }
            
            // ✅ 检测是否为移动设备，显示/隐藏文件上传按钮
            initMobileUpload();
            
            console.log('设备信息更新完成');
        }