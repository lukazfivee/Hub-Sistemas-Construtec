// ==========================================================================
// PORTAL HUB CONSTRUTEC - ELECTRON MAIN PROCESS
// Launcher Desktop Executivo
// Limite: MAX_LINES <= 350
// ==========================================================================

const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow;

function isLocalAppUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol)
      && ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

function checkServerReady(port = 3000, maxRetries = 20) {
  return new Promise((resolve) => {
    let retries = 0;
    const check = () => {
      const req = http.get(`http://127.0.0.1:${port}/api/status`, (res) => {
        res.resume();
        resolve(true);
      });
      req.on('error', () => {
        retries += 1;
        if (retries >= maxRetries) return resolve(false);
        setTimeout(check, 300);
      });
      req.setTimeout(500, () => {
        req.destroy();
        retries += 1;
        if (retries >= maxRetries) return resolve(false);
        setTimeout(check, 300);
      });
    };
    check();
  });
}

async function createWindow() {
  require('../server');

  await checkServerReady(3000);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Portal Hub Construtec',
    icon: path.join(__dirname, '..', 'public', 'assets', 'construtec-favicon.png'),
    backgroundColor: '#071926',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isLocalAppUrl(url)) return { action: 'allow' };
    shell.openExternal(url);
    return { action: 'deny' };
  });

  await mainWindow.loadURL('http://127.0.0.1:3000');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
