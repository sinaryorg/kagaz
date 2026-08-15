const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

const browserPreloadPath = 'file:///' + path.join(__dirname, 'browserPreload.cjs').replace(/\\/g, '/');

contextBridge.exposeInMainWorld('electronAPI', {
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  readVaultFiles: (dirPath) => ipcRenderer.invoke('fs:readVaultFiles', dirPath),
  saveVaultFile: (filePath, content) => ipcRenderer.invoke('fs:saveVaultFile', { filePath, content }),
  downloadUpdate: (url) => ipcRenderer.invoke('updater:download', { url }),
  installUpdate: (filePath) => ipcRenderer.invoke('updater:install', { filePath }),
  onUpdateProgress: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('updater:progress', listener);
    return () => ipcRenderer.removeListener('updater:progress', listener);
  },
  onSpellcheckWordAdded: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('spellcheck:word-added', listener);
    return () => ipcRenderer.removeListener('spellcheck:word-added', listener);
  },
  browserPreloadPath,
});
