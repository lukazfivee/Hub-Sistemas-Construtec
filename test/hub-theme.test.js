const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../public/hub-theme.js'), 'utf8');
function setup(values = {}, denied = false) {
  const storage = new Map(Object.entries(values));
  const events = {};
  const clicks = [];
  const attrs = {};
  const classes = new Set();
  const root = { dataset: {}, style: {}, classList: { toggle: (name, yes) => yes ? classes.add(name) : classes.delete(name) } };
  const button = { setAttribute: (k, v) => { attrs[k] = v; }, addEventListener: (_, cb) => clicks.push(cb) };
  const document = { documentElement: root, body: null, getElementById: () => null, addEventListener: (k, cb) => { events[k] = cb; } };
  const window = { addEventListener: (k, cb) => { events[k] = cb; }, dispatchEvent: () => {} };
  const context = vm.createContext({ document, window, CustomEvent: class {}, localStorage: {
    getItem: k => { if (denied) throw Error('denied'); return storage.get(k) ?? null; },
    setItem: (k, v) => { if (denied) throw Error('denied'); storage.set(k, v); },
  } });
  vm.runInContext(source, context);
  return { storage, root, window, attrs, classes, context, clicks, mount() {
    document.body = { classList: root.classList };
    document.getElementById = () => button;
    events.DOMContentLoaded();
  } };
}
test('legacy migration paints dark before DOM readiness and survives a restart', () => {
  const app = setup({ construtec_theme: 'dark', financial: 'unchanged' });
  assert.equal(app.root.dataset.theme, 'dark');
  assert.equal(app.root.style.colorScheme, 'dark');
  assert.equal(app.storage.get('construtec-theme'), 'dark');
  assert.equal(app.storage.get('financial'), 'unchanged');
  assert.equal(setup(Object.fromEntries(app.storage)).root.dataset.theme, 'dark');
});
test('canonical preference wins, one click toggles once and synchronizes legacy CSS', () => {
  const app = setup({ 'construtec-theme': 'light', construtec_theme: 'dark' });
  app.mount();
  vm.runInContext(source, app.context);
  assert.equal(app.clicks.length, 1);
  app.clicks[0]();
  assert.equal(app.storage.get('construtec-theme'), 'dark');
  assert.equal(app.attrs['aria-pressed'], 'true');
  assert.equal(app.classes.has('light-theme'), false);
  app.clicks[0]();
  assert.equal(app.classes.has('light-theme'), true);
});
test('unavailable storage and invalid preference do not break the theme control', () => {
  const app = setup({}, true);
  app.mount();
  app.clicks[0]();
  assert.equal(app.root.dataset.theme, 'dark');
  app.window.HubTheme.setTheme('invalid');
  assert.equal(app.root.dataset.theme, 'dark');
  assert.equal(setup({ 'construtec-theme': 'bad', construtec_theme: 'dark' }).root.dataset.theme, 'light');
});
