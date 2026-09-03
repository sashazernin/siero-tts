const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

app.setName('siero-tts');

const BACKEND_PORT = 8000;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;
const workspaceRoot = path.join(__dirname, '..', '..', '..');
const isPackaged = app.isPackaged;
const isProd = isPackaged || process.argv.includes('--prod');
const APP_ICON = path.join(__dirname, '..', 'assets', 'icon.ico');
const LOADER_WIDTH = 420;
const LOADER_HEIGHT = 340;

let mainWindow = null;
let loaderWindow = null;
let backendProcess = null;
let logPath = null;

function getLogPath() {
  if (!logPath) {
    const logDir = app.getPath('userData');
    fs.mkdirSync(logDir, { recursive: true });
    logPath = path.join(logDir, 'siero-tts.log');
  }

  return logPath;
}

function writeLog(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  try {
    fs.appendFileSync(getLogPath(), line);
  } catch {
    // ignore disk errors
  }

  console.error(message);
}

function getBackendCommand() {
  if (!isProd) {
    return {
      command: process.platform === 'win32' ? 'npx.cmd' : 'npx',
      args: ['nx', 'serve', 'api'],
      cwd: workspaceRoot,
      shell: true,
      extraEnv: {},
    };
  }

  const apiDir = isPackaged
    ? path.join(process.resourcesPath, 'bin', 'api')
    : path.join(workspaceRoot, 'dist', 'apps', 'api');

  if (isPackaged) {
    return {
      command: process.execPath,
      args: [path.join(apiDir, 'main.js')],
      cwd: apiDir,
      shell: false,
      extraEnv: {
        ELECTRON_RUN_AS_NODE: '1',
      },
    };
  }

  return {
    command: process.platform === 'win32' ? 'node.exe' : 'node',
    args: ['main.js'],
    cwd: apiDir,
    shell: process.platform === 'win32',
    extraEnv: {},
  };
}

function getWebIndexPath() {
  if (isPackaged) {
    return path.join(process.resourcesPath, 'web', 'index.html');
  }

  return path.join(workspaceRoot, 'dist', 'apps', 'web', 'index.html');
}

function sendLoader(channel, payload) {
  if (!loaderWindow || loaderWindow.isDestroyed()) {
    return;
  }

  loaderWindow.webContents.send(channel, payload);
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

function waitForBackend(timeoutMs = 10 * 60 * 1000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(`${BACKEND_URL}/api/health`, (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          try {
            const data = JSON.parse(body);

            if (data.status === 'error') {
              reject(new Error(data.detail || 'API error'));
              return;
            }

            if (data.ready) {
              resolve();
              return;
            }

            sendLoader('loader-status', data.detail || 'Загрузка моделей Silero...');
            retry();
          } catch {
            retry();
          }
        });
      });

      request.on('error', retry);
      request.setTimeout(2000, () => {
        request.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - startedAt > timeoutMs) {
        reject(
          new Error(
            `API не запустился за 10 минут. Лог: ${getLogPath()}. Нужны Python 3.10+ и pip install -r apps/api/python/requirements.txt`,
          ),
        );
        return;
      }

      setTimeout(check, 1000);
    };

    check();
  });
}

function startBackend() {
  const { command, args, cwd, shell, extraEnv } = getBackendCommand();
  const currentLogPath = getLogPath();
  writeLog(`Starting API: ${command} ${args.join(' ')} cwd=${cwd}`);
  sendLoader('loader-log-path', currentLogPath);

  const logStream = fs.createWriteStream(currentLogPath, { flags: 'a' });

  backendProcess = spawn(command, args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    shell,
    env: {
      ...process.env,
      SIERO_LOG_FILE: currentLogPath,
      PORT: String(BACKEND_PORT),
      ...extraEnv,
    },
  });

  const writeBackendLog = (chunk) => {
    logStream.write(chunk);
  };

  backendProcess.stdout?.on('data', writeBackendLog);
  backendProcess.stderr?.on('data', writeBackendLog);
  backendProcess.on('close', () => {
    logStream.end();
  });

  backendProcess.on('error', (error) => {
    writeLog(`Failed to start backend: ${error.message}`);
    sendLoader('loader-error', `${error.message}\nЛог: ${currentLogPath}`);
  });

  backendProcess.on('exit', (code) => {
    writeLog(`API exited with code ${code ?? 'unknown'}`);
    if (!mainWindow) {
      sendLoader(
        'loader-error',
        `API завершился с кодом ${code ?? 'unknown'}.\nЛог: ${currentLogPath}`,
      );
    }
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
  sendLoader('loader-log-path', getLogPath());
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
  writeLog('App started');

  try {
    await createLoaderWindow();
    startBackend();
    await waitForBackend();
    await createWindow();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeLog(message);
    sendLoader('loader-error', `${message}\nЛог: ${getLogPath()}`);
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
