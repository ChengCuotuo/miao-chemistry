// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');

// 安全地向渲染进程暴露 API
contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('file-open-dialog'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  readGroupPointsConfig: () => ipcRenderer.invoke('read-group-points-config'),
});
