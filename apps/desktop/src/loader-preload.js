const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('loaderAPI', {
  close: () => ipcRenderer.send('loader-close'),
});
