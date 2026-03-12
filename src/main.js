import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
const fs = require('fs').promises; // 使用 promise 版本的 fs 更方便

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // 打开开发者工具
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 监听渲染进程发来的 'file-open-dialog' 事件
ipcMain.handle('file-open-dialog', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
  });
  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});

// 监听渲染进程发来的 'read-file' 事件
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('读取文件失败:', error);
    throw error; // 将错误抛回给渲染进程
  }
});

async function ensureFileExists(filePath, defaultContent = '') {
  try {
    // 尝试访问文件
    await fs.access(filePath, fs.constants.F_OK);
    console.log('文件已存在');
    return true;
  } catch (error) {
    // 文件不存在，创建它
    if (error.code === 'ENOENT') {
      try {
        // 确保目录存在
        const dirPath = path.dirname(filePath);
        await fs.mkdir(dirPath, { recursive: true });

        // 创建文件并写入默认内容
        await fs.writeFile(filePath, defaultContent, 'utf8');
        console.log('文件创建成功');
        return true;
      } catch (createError) {
        console.error('创建文件失败:', createError);
        return false;
      }
    } else {
      // 其他错误（如权限问题）
      console.error('检查文件时出错:', error);
      return false;
    }
  }
}

ipcMain.handle('read-group-points-config', async (event) => {
  const filePath = path.join(__dirname, './group-points.json');
  try {
    await ensureFileExists(filePath, '{}');
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('读取文件失败:', error);
    throw error; // 将错误抛回给渲染进程
  }
});
