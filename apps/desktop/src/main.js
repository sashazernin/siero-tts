const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const BACKEND_PORT = 8000;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;
const isDev = !app.isPackaged;
const APP_ICON = path.join(__dirname, '..', 'assets', 'icon.ico');

let mainWindow = null;
let backendProcess = null;

function getBackendCommand() {
  if (isDev) {
    return {
      command: process.platform === 'win32' ? 'npx.cmd' : 'npx',
      args: ['nx', 'serve', 'api'],
      cwd: path.join(__dirname, '..', '..'),
    };
  }

  const binaryName = process.platform === 'win32' ? 'main.exe' : 'main';
  return {
    command: path.join(process.resourcesPath, 'bin', 'api', binaryName),
    args: [],
    cwd: path.join(process.resourcesPath, 'bin', 'api'),
  };
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

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 900,
    minHeight: 700,
    icon: APP_ICON,
    title: 'siero-tts',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    await mainWindow.loadURL('http://localhost:4200');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    await mainWindow.loadFile(path.join(process.resourcesPath, 'web', 'index.html'));
  }
}

app.whenReady().then(async () => {
  try {
    startBackend();
    await waitForBackend();
    await createWindow();
  } catch (error) {
    console.error(error);
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
