// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');

// 安全地向渲染进程暴露 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 打开文件选择对话框
  openFileDialog: (extensions) =>
    ipcRenderer.invoke('file-open-dialog', extensions),

  // 读取文件内容（包含完整路径）
  readFullPathFile: (filePath) =>
    ipcRenderer.invoke('read-full-path-file', filePath),
  // 读取文件内容（不包含完整路径）
  readFile: (params) => ipcRenderer.invoke('read-file', params),
  // 获取图片地址
  loadFilePath: (params) => ipcRenderer.invoke('load-file-path', params),
  // 写入文件
  writeToFile: (filePath, content) =>
    ipcRenderer.invoke('write-file', filePath, content),

  // 加载配置文件
  loadFile: (params) => ipcRenderer.invoke('load-file', params),
  // 从文件加载配置列表
  loadConfigFromFile: (params) =>
    ipcRenderer.invoke('load-config-list', params),
  // 写入配置文件
  writeConfigToFile: (filePath, content) =>
    ipcRenderer.invoke('write-config-file', filePath, content),
});
