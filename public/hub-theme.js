// Runs synchronously in <head>, before styles, so persisted theme paints first.
(function () {
  'use strict';
  if (window.HubTheme) return;
  const key = 'construtec-theme';
  const root = document.documentElement;
  let theme = 'light';
  let bound = false;
  const valid = value => value === 'light' || value === 'dark';
  try {
    const saved = localStorage.getItem(key);
    const legacy = saved === null ? localStorage.getItem('construtec_theme') : null;
    theme = valid(saved) ? saved : valid(legacy) ? legacy : 'light';
    if (saved === null && valid(legacy)) localStorage.setItem(key, theme);
  } catch (_) { /* Restricted storage must never prevent rendering. */ }

  function paint() {
    root.dataset.theme = theme;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    // Existing portfolio CSS uses body.light-theme.
    document.body?.classList.toggle('light-theme', theme === 'light');
    const button = document.getElementById('hub-theme-toggle');
    if (button) {
      button.setAttribute('aria-pressed', String(theme === 'dark'));
      button.setAttribute('aria-label', theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro');
    }
  }
  function setTheme(next) {
    if (!valid(next)) return;
    theme = next;
    try { localStorage.setItem(key, theme); } catch (_) { /* Keep in-memory preference. */ }
    paint();
    window.dispatchEvent(new CustomEvent('theme.changed', { detail: { theme } }));
  }
  function bind() {
    paint();
    const button = document.getElementById('hub-theme-toggle');
    if (button && !bound) {
      button.addEventListener('click', () => setTheme(theme === 'dark' ? 'light' : 'dark'));
      bound = true;
    }
  }
  window.HubTheme = Object.freeze({ setTheme, getTheme: () => theme });
  paint();
  document.addEventListener('DOMContentLoaded', bind, { once: true });
  window.addEventListener('storage', event => {
    if (event.key === key && valid(event.newValue)) {
      theme = event.newValue;
      paint();
      window.dispatchEvent(new CustomEvent('theme.changed', { detail: { theme } }));
    }
  });
})();
