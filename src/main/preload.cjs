'use strict';
// Sandboxed preload: exposes a narrow, promise-based API to the renderer.
// Nothing else from Node or Electron is reachable from page scripts.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('roseflow', {
  progress: {
    load: () => ipcRenderer.invoke('progress:load'),
    save: (doc) => ipcRenderer.invoke('progress:save', doc),
    reset: () => ipcRenderer.invoke('progress:reset'),
  },
  links: {
    open: (url) => ipcRenderer.invoke('links:open', String(url)),
  },
  app: {
    info: () => ipcRenderer.invoke('app:info'),
  },
});
