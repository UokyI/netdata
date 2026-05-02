const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    getAppInfo: () => ipcRenderer.invoke('get-app-info'),
    getServerInfo: () => ipcRenderer.invoke('get-server-info'),
    onNewData: (callback) => ipcRenderer.on('new-data', (event, data) => callback(data))
});
