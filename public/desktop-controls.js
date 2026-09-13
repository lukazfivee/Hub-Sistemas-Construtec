(function () {
  'use strict';
  const api = window.construtecDesktop;
  if (!api?.isDesktop) return;
  const controls = document.getElementById('desktop-controls');
  if (!controls || controls.dataset.bound) return;
  controls.dataset.bound = 'true';
  controls.hidden = false;
  document.documentElement.classList.add('hub-desktop');
  const maximize = document.getElementById('desktop-maximize');
  let receivedState = false;
  function render(state) {
    if (!state || typeof state.maximized !== 'boolean') return;
    maximize.setAttribute('aria-label', state.maximized ? 'Restaurar janela' : 'Maximizar janela');
    maximize.title = state.maximized ? 'Restaurar janela' : 'Maximizar janela';
    maximize.dataset.maximized = String(state.maximized);
  }
  function invoke(method) {
    // Window destruction can reject in-flight IPC; do not leak a rejection.
    Promise.resolve().then(() => api[method]()).catch(() => {});
  }
  document.getElementById('desktop-minimize').addEventListener('click', () => invoke('minimize'));
  maximize.addEventListener('click', () => invoke('toggleMaximize'));
  document.getElementById('desktop-close').addEventListener('click', () => invoke('close'));
  const unsubscribe = api.onWindowState(state => { receivedState = true; render(state); });
  Promise.resolve().then(() => api.getWindowState()).then(state => {
    if (!receivedState) render(state);
  }).catch(() => {});
  window.addEventListener('pagehide', () => unsubscribe(), { once: true });
  document.addEventListener('keydown', event => {
    if (event.key === 'F12' || (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'i')) {
      event.preventDefault();
      invoke('toggleDevTools');
    }
  });
})();
