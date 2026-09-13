const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../public/desktop-controls.js'), 'utf8');
test('desktop buttons dispatch only their capability; state updates icon and dispose unsubscribes', async () => {
  const nodes = Object.fromEntries(['desktop-controls', 'desktop-maximize', 'desktop-minimize', 'desktop-close'].map(id => [id, {
    hidden: true, dataset: {}, attrs: {}, handlers: {},
    setAttribute(k, v) { this.attrs[k] = v; }, addEventListener(k, cb) { this.handlers[k] = cb; },
  }]));
  const calls = [];
  let stateListener;
  let onExit;
  const api = { isDesktop: true, minimize: () => calls.push('minimize'), toggleMaximize: () => calls.push('maximize'), close: () => calls.push('close'),
    getWindowState: async () => ({ maximized: false }),
    onWindowState: cb => { stateListener = cb; return () => calls.push('unsubscribe'); },
  };
  const context = vm.createContext({ window: { construtecDesktop: api, addEventListener: (_, cb) => { onExit = cb; } },
    document: { getElementById: id => nodes[id], documentElement: { classList: { add() {} } }, addEventListener() {} } });
  vm.runInContext(source, context);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(nodes['desktop-controls'].hidden, false);
  assert.equal(nodes['desktop-maximize'].attrs['aria-label'], 'Maximizar janela');
  stateListener({ maximized: true });
  assert.equal(nodes['desktop-maximize'].dataset.maximized, 'true');
  assert.equal(nodes['desktop-maximize'].attrs['aria-label'], 'Restaurar janela');
  for (const id of ['desktop-minimize', 'desktop-maximize', 'desktop-close']) nodes[id].handlers.click();
  await new Promise(resolve => setImmediate(resolve));
  onExit();
  assert.deepEqual(calls, ['minimize', 'maximize', 'close', 'unsubscribe']);
});
test('standalone web does not access desktop DOM or invoke IPC', () => {
  vm.runInNewContext(source, { window: {}, document: { getElementById() { throw Error('must not run'); } } });
});
