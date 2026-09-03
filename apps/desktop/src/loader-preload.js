const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('loaderAPI', {
  close: () => ipcRenderer.send('loader-close'),
  onStatus: (callback) => ipcRenderer.on('loader-status', (_event, text) => callback(text)),
  onError: (callback) => ipcRenderer.on('loader-error', (_event, text) => callback(text)),
  onLogPath: (callback) => ipcRenderer.on('loader-log-path', (_event, text) => callback(text)),
});
