const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('node:path');
const { installControls } = require('./window-controls');
const HUB_ORIGIN = 'http://127.0.0.1:3010';
if (process.env.CONSTRUTEC_DESKTOP_USER_DATA && path.isAbsolute(process.env.CONSTRUTEC_DESKTOP_USER_DATA)) {
  app.setPath('userData', process.env.CONSTRUTEC_DESKTOP_USER_DATA);
}
let mainWindow;
let server;
let creating;

async function createWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) { mainWindow.focus(); return; }
  if (creating) return creating;
  creating = (async () => {
    if (!server) {
      process.env.PORT = '3010';
      process.env.CONSTRUTEC_DESKTOP_ISOLATED = '1';
      const hub = require('../server');
      await hub.startServer({ port: 3010, control: false });
      server = hub.server;
    }
    mainWindow = new BrowserWindow({
      width: 1400, height: 900, minWidth: 1024, minHeight: 700,
      title: 'Portal Hub Construtec', frame: false,
      icon: path.join(__dirname, '..', 'public', 'assets', 'construtec-favicon.png'),
      backgroundColor: '#071926', autoHideMenuBar: true,
      webPreferences: { preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false, contextIsolation: true, sandbox: true },
    });
    const removeControls = installControls({ window: mainWindow, ipcMain, shell, origin: HUB_ORIGIN });
    mainWindow.once('closed', () => { removeControls(); mainWindow = null; });
    await mainWindow.loadURL(HUB_ORIGIN);
  })();
  try { await creating; } finally { creating = null; }
}
function openWindow() {
  createWindow().catch(() => {
    dialog.showErrorBox('Portal Hub indisponível',
      'Não foi possível iniciar a instância própria do Hub na porta 3010. Verifique se a porta está ocupada e tente novamente.');
    app.quit();
  });
}
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); }
  });
  app.whenReady().then(openWindow);
  app.on('activate', openWindow);
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  app.on('before-quit', () => { if (server) { server.close(); server.closeIdleConnections(); } });
}
