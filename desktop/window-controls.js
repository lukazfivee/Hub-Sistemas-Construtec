function installControls({ window, ipcMain, shell, origin }) {
  const contents = window.webContents;
  const state = () => ({ maximized: window.isMaximized(), fullscreen: window.isFullScreen() });
  const trusted = event => {
    if (event.sender !== contents || event.senderFrame !== contents.mainFrame) return false;
    try { return new URL(event.senderFrame.url).origin === origin; } catch { return false; }
  };
  let lastDevToolsToggle = 0;
  const DEBOUNCE_MS = 200;
  const actions = {
    minimize: () => window.minimize(),
    toggleMaximize: () => window.isMaximized() ? window.unmaximize() : window.maximize(),
    toggleFullscreen: () => window.setFullScreen(!window.isFullScreen()),
    close: () => window.close(),
    getWindowState: () => {},
    toggleDevTools: () => {
      if (Date.now() - lastDevToolsToggle < DEBOUNCE_MS) return;
      lastDevToolsToggle = Date.now();
      contents.toggleDevTools();
    },
  };
  ipcMain.handle('hub:window', (event, ...args) => {
    if (!trusted(event) || args.length !== 1 || typeof args[0] !== 'string'
      || !Object.hasOwn(actions, args[0])) throw new Error('Comando de janela não autorizado');
    actions[args[0]]();
    return window.isDestroyed() ? null : state();
  });
  ipcMain.handle('hub:external', async (event, ...args) => {
    if (!trusted(event) || args.length !== 1 || typeof args[0] !== 'string' || args[0].length > 2048)
      throw new Error('Link não autorizado');
    let url;
    try { url = new URL(args[0]); } catch { throw new Error('Link inválido'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
      throw new Error('Link não autorizado');
    await shell.openExternal(url.href);
  });
  const emit = () => { if (!contents.isDestroyed()) contents.send('hub:state', state()); };
  for (const event of ['maximize', 'unmaximize', 'enter-full-screen', 'leave-full-screen']) window.on(event, emit);
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  const guard = (event, target) => {
    const url = typeof target === 'string' ? target : target.url;
    try { if (new URL(url).origin === origin) return; } catch { /* block malformed */ }
    event.preventDefault();
  };
  contents.on('will-navigate', guard);
  contents.on('will-redirect', guard);
  contents.on('will-attach-webview', event => event.preventDefault());
  contents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown' || input.isAutoRepeat) return;
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      event.preventDefault(); lastDevToolsToggle = Date.now(); contents.toggleDevTools();
    } else if (input.key === 'F11') {
      event.preventDefault(); window.setFullScreen(!window.isFullScreen());
    }
  });
  return () => { ipcMain.removeHandler('hub:window'); ipcMain.removeHandler('hub:external'); };
}
module.exports = { installControls };
