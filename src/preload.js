// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');

// 安全地向渲染进程暴露 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 打开文件选择对话框
  openFileDialog: () => ipcRenderer.invoke('file-open-dialog'),
  // 读取文件内容
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  // 从文件加载配置列表
  loadConfigFromFile: (params) =>
    ipcRenderer.invoke('load-config-list', params),
  writeConfigToFile: (filePath, content) =>
    ipcRenderer.invoke('write-file', filePath, content),
});
