const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

test('módulos locais abrem no Hub, voltam ao painel e respeitam isolamento', async () => {
  const nodes = Object.fromEntries(['hub-module-shell', 'hub-module-frame', 'hub-module-title', 'hub-main-deck', 'btn-close-module'].map(id => [id, {
    hidden: id === 'hub-module-shell', handlers: {},
    setAttribute() { this.hidden = true; }, removeAttribute() { this.hidden = false; },
    addEventListener(event, handler) { this.handlers[event] = handler; },
  }]));
  const hubState = { urls: {}, statuses: { orcamentos: true } };
  let ready;
  const window = {
    HubConfig: { hubState, showNotification() {}, isLocalUrl: url => new URL(url).hostname === 'localhost' },
    HubSettings: { loadSavedUrls() {}, initSettingsModal() {} },
    HubStatus: { startStatusPolling() {} }, addEventListener() {},
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8'), {
    window, document: { getElementById: id => nodes[id], addEventListener: (_, handler) => { ready = handler; } },
  });
  ready();
  for (const [launch, url] of [['launchOrcamentos', 'http://localhost:5173'], ['launchCentro', 'http://localhost:3456']]) {
    await window.HubApp[launch]();
    assert.equal(nodes['hub-module-frame'].src, url);
    assert.equal(nodes['hub-module-shell'].hidden, false);
    assert.equal(nodes['hub-main-deck'].hidden, true);
    nodes['btn-close-module'].handlers.click();
    assert.equal(nodes['hub-module-frame'].src, 'about:blank');
    assert.equal(nodes['hub-module-shell'].hidden, true);
    assert.equal(nodes['hub-main-deck'].hidden, false);
  }
  hubState.urls.centro = 'https://example.com';
  window.HubApp.launchCentro();
  assert.equal(nodes['hub-module-frame'].src, 'about:blank');
  hubState.urls.centro = 'http://localhost:3456';
  hubState.isolated = true;
  window.HubApp.launchCentro();
  assert.equal(nodes['hub-module-frame'].src, 'about:blank');
});
