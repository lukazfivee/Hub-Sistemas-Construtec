// ==========================================================================
// PORTAL HUB CONSTRUTEC - ELECTRON PRELOAD
// Contexto seguro isolado para desktop
// Limite: MAX_LINES <= 350
// ==========================================================================

const { contextBridge, shell } = require('electron');

contextBridge.exposeInMainWorld('construtecDesktop', {
  isDesktop: true,
  openExternal: (url) => shell.openExternal(url),
});
