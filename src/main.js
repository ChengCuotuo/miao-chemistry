import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { encryptJSON, decryptJSON } from './utils.js';

const fs = require('fs').promises; // 使用 promise 版本的 fs 更方便

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    // 打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(__dirname, '../renderer/main_window/index.html'),
    );
  }

  // 拦截 Cmd+R、F5、Cmd+Shift+R 等刷新键
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // 需要拦截的组合键
    const isCmdR = input.meta && input.key.toLowerCase() === 'r';
    const isF5 = input.key === 'F5';
    const isCmdShiftR =
      input.meta && input.shift && input.key.toLowerCase() === 'r';

    if (isCmdR || isF5 || isCmdShiftR) {
      event.preventDefault();
      // 关键：让 webContents 忽略菜单快捷键
      mainWindow.webContents.setIgnoreMenuShortcuts(true);
    } else {
      // 恢复菜单快捷键的正常行为
      mainWindow.webContents.setIgnoreMenuShortcuts(false);
    }
  });
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

// ===============================================================================================
const userDataPath = app.getPath('userData');
const PASS_KEY = '@miao@';

// 确保文件存在，不存在则创建
async function ensureFileExists(filePath, defaultContent = '') {
  try {
    // 尝试访问文件
    console.log('尝试访问文件:', filePath);
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

// 监听渲染进程发来的 'file-open-dialog' 事件
ipcMain.handle('file-open-dialog', async (event, extensions) => {
  const filterExtensions = extensions.map((ext) => ext.replace('.', ''));
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'miao-default', extensions: filterExtensions }],
  });
  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});

// 监听渲染进程发来的 'read-full-path-file' 事件
ipcMain.handle('read-full-path-file', async (event, filePath) => {
  try {
    // 检查文件是否存在
    await fs.access(filePath, fs.constants.F_OK);
    const content = await fs.readFile(filePath);
    const name = path.basename(filePath);
    return { content, name };
  } catch (error) {
    console.error('读取文件失败:', error.message);
    throw error; // 将错误抛回给渲染进程
  }
});

// 监听渲染进程发来的 'read-file' 事件
ipcMain.handle('read-file', async (event, params) => {
  try {
    const { mainPath, fileName } = params || {};
    const filePath = path.join(userDataPath, mainPath, fileName);
    const content = await fs.readFile(filePath);
    const name = path.basename(filePath);
    return { content, name };
  } catch (error) {
    console.error('读取文件失败:', error);
    throw error; // 将错误抛回给渲染进程
  }
});

// 获取文件完整路径
ipcMain.handle('load-file-path', async (event, params) => {
  try {
    const { mainPath, fileName } = params || {};
    return path.join(userDataPath, mainPath, fileName);
  } catch (error) {
    console.error('获取文件路径失败:', error);
    throw error; // 将错误抛回给渲染进程
  }
});

// 写入文件
ipcMain.handle('write-file', async (event, params) => {
  const { mainPath, fileName, content = '' } = params || {};
  console.log('write-file called with:', {
    mainPath,
    fileName,
    contentLength: content?.length,
    contentType: Object.prototype.toString.call(content),
  });
  try {
    const filePath = path.join(userDataPath, mainPath, fileName);
    console.log('Full file path:', filePath);
    await ensureFileExists(filePath);

    // 处理 Uint8Array 类型的数据
    let writeContent = content;
    if (content && content.buffer && content.byteLength !== undefined) {
      // 这是一个 TypedArray，转换为 Buffer
      writeContent = Buffer.from(content);
      console.log('Converted to Buffer, length:', writeContent.length);
    }

    await fs.writeFile(filePath, writeContent);
    console.log('文件写入成功');
    return true;
  } catch (error) {
    console.error('写入文件失败:', error.message);
    return false;
  }
});

// 监听渲染进程发来的 'load-file' 事件
ipcMain.handle('load-file', async (event, params) => {
  const {
    mainPath,
    fileName,
    suffix = '.json',
    defaultContent = '{}',
  } = params || {};
  try {
    const filePath = path.join(userDataPath, mainPath, fileName + suffix);
    await ensureFileExists(filePath, defaultContent);
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('读取文件失败:', error);
    throw error; // 将错误抛回给渲染进程
  }
});

// 监听渲染进程发来的 'load-config-list' 事件
ipcMain.handle('load-config-list', async (event, params) => {
  const {
    mainPath,
    fileList = [],
    suffix = '.json',
    defaultContent = '{}',
  } = params || {};
  if (!mainPath || fileList.length === 0) {
    return {};
  } else {
    try {
      const allFileInfos = await Promise.all(
        fileList.map(async (fileName) => {
          const filePath = path.join(userDataPath, mainPath, fileName + suffix);
          await ensureFileExists(filePath, defaultContent);
          const content = await fs.readFile(filePath, 'utf-8');
          return {
            fileName,
            content,
          };
        }),
      );
      return (allFileInfos || []).reduce((prev, cur) => {
        prev[cur.fileName] = cur.content;
        return prev;
      }, {});
    } catch (error) {
      console.error('读取文件失败:', error);
      throw error; // 将错误抛回给渲染进程
    }
  }
});

// 写入配置文件
ipcMain.handle('write-config-file', async (event, params) => {
  const { mainPath, fileName, suffix, content = '' } = params || {};
  try {
    await fs.writeFile(
      path.join(userDataPath, mainPath, fileName + suffix),
      content,
      'utf8',
    );
    console.log('文件写入成功');
    return true;
  } catch (error) {
    console.error('写入文件失败:', error);
    return false;
  }
});

// 下载文件 - 根据文件路径下载文件
ipcMain.handle('download-file', async (event, params) => {
  const { filePath, fileName } = params;
  try {
    // 检查源文件是否存在
    await fs.access(filePath, fs.constants.F_OK);

    // 获取源文件名作为默认保存文件名
    const defaultFileName = fileName || path.basename(filePath);

    // 打开保存对话框让用户选择保存位置
    const result = await dialog.showSaveDialog({
      defaultPath: defaultFileName,
      filters: [{ name: 'All Files', extensions: ['*'] }],
    });

    // 如果用户取消对话框
    if (result.canceled || !result.filePath) {
      return { success: false, message: '用户取消保存' };
    }

    // 读取源文件内容
    const content = await fs.readFile(filePath);
    // content 是 Buffer 类型，需要转换为字符串
    const contentStr = content.toString('utf-8');
    const encryptedContent = await encryptJSON(contentStr);
    // 写入到目标位置
    await fs.writeFile(result.filePath, encryptedContent);

    console.log('文件下载成功:', result.filePath);
    return { success: true, savedPath: result.filePath };
  } catch (error) {
    console.error('下载文件失败:', error.message);
    return { success: false, message: error.message };
  }
});

// 加密内容
ipcMain.handle('decrypt-content', async (event, content) => {
  return await decryptJSON(content);
});
