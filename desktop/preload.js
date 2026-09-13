const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('construtecDesktop', {
  isDesktop: true,
  minimize: () => ipcRenderer.invoke('hub:window', 'minimize'),
  toggleMaximize: () => ipcRenderer.invoke('hub:window', 'toggleMaximize'),
  close: () => ipcRenderer.invoke('hub:window', 'close'),
  toggleFullscreen: () => ipcRenderer.invoke('hub:window', 'toggleFullscreen'),
  getWindowState: () => ipcRenderer.invoke('hub:window', 'getWindowState'),
  toggleDevTools: () => ipcRenderer.invoke('hub:window', 'toggleDevTools'),
  openExternal: url => ipcRenderer.invoke('hub:external', url),
  onWindowState: callback => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, state) => callback({ maximized: !!state.maximized, fullscreen: !!state.fullscreen });
    ipcRenderer.on('hub:state', listener);
    return () => ipcRenderer.removeListener('hub:state', listener);
  },
});
