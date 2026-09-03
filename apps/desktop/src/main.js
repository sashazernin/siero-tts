const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const BACKEND_PORT = 8000;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;
const workspaceRoot = path.join(__dirname, '..', '..', '..');
const isPackaged = app.isPackaged;
const isProd = isPackaged || process.argv.includes('--prod');
const APP_ICON = path.join(__dirname, '..', 'assets', 'icon.ico');
const LOADER_WIDTH = 360;
const LOADER_HEIGHT = 220;

let mainWindow = null;
let loaderWindow = null;
let backendProcess = null;

function getBackendCommand() {
  const nodeCommand = process.platform === 'win32' ? 'node.exe' : 'node';

  if (!isProd) {
    return {
      command: process.platform === 'win32' ? 'npx.cmd' : 'npx',
      args: ['nx', 'serve', 'api'],
      cwd: workspaceRoot,
    };
  }

  if (isPackaged) {
    return {
      command: nodeCommand,
      args: ['main.js'],
      cwd: path.join(process.resourcesPath, 'bin', 'api'),
    };
  }

  return {
    command: nodeCommand,
    args: ['main.js'],
    cwd: path.join(workspaceRoot, 'dist', 'apps', 'api'),
  };
}

function getWebIndexPath() {
  if (isPackaged) {
    return path.join(process.resourcesPath, 'web', 'index.html');
  }

  return path.join(workspaceRoot, 'dist', 'apps', 'web', 'index.html');
}

function registerWindowShortcuts(win) {
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') {
      return;
    }

    const ctrl = input.control || input.meta;

    if (input.key === 'F11') {
      event.preventDefault();
      win.setFullScreen(!win.isFullScreen());
      return;
    }

    if (ctrl && input.shift && input.key.toLowerCase() === 'i') {
      event.preventDefault();
      win.webContents.toggleDevTools();
      return;
    }

    if (ctrl && input.key === 'F5') {
      event.preventDefault();
      win.webContents.reloadIgnoringCache();
    }
  });
}

function waitForBackend(timeoutMs = 120000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(`${BACKEND_URL}/api/health`, (response) => {
        response.resume();
        if (response.statusCode === 200) {
          resolve();
          return;
        }

        retry();
      });

      request.on('error', retry);
      request.setTimeout(2000, () => {
        request.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error('Backend startup timeout'));
        return;
      }

      setTimeout(check, 1000);
    };

    check();
  });
}

function startBackend() {
  const { command, args, cwd } = getBackendCommand();

  backendProcess = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    windowsHide: true,
    shell: process.platform === 'win32',
  });

  backendProcess.on('error', (error) => {
    console.error('Failed to start backend:', error);
  });
}

function stopBackend() {
  if (!backendProcess) {
    return;
  }

  backendProcess.kill();
  backendProcess = null;
}

function closeLoader() {
  if (!loaderWindow || loaderWindow.isDestroyed()) {
    loaderWindow = null;
    return;
  }

  loaderWindow.close();
  loaderWindow = null;
}

async function createLoaderWindow() {
  loaderWindow = new BrowserWindow({
    width: LOADER_WIDTH,
    height: LOADER_HEIGHT,
    center: true,
    frame: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    autoHideMenuBar: true,
    show: false,
    backgroundColor: '#0d0d12',
    icon: APP_ICON,
    title: 'siero-tts',
    webPreferences: {
      preload: path.join(__dirname, 'loader-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  loaderWindow.on('closed', () => {
    loaderWindow = null;
  });

  await loaderWindow.loadFile(path.join(__dirname, 'loader.html'));
  loaderWindow.show();
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 900,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    icon: APP_ICON,
    title: 'siero-tts',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  registerWindowShortcuts(mainWindow);
  mainWindow.setMenuBarVisibility(false);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    closeLoader();
  });

  if (!isProd) {
    await mainWindow.loadURL('http://127.0.0.1:4200');
    return;
  }

  await mainWindow.loadFile(getWebIndexPath());
}

ipcMain.on('loader-close', () => {
  stopBackend();
  app.quit();
});

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);

  try {
    await createLoaderWindow();
    startBackend();
    await waitForBackend();
    await createWindow();
  } catch (error) {
    console.error(error);
    stopBackend();
    app.quit();
  }
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackend();
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});
