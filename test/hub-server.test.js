const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
process.env.CONSTRUTEC_DESKTOP_ISOLATED = '1';
const { server, startServer } = require('../server');
let origin;
test.before(async () => { await startServer({ port: 0, control: false }); origin = `http://127.0.0.1:${server.address().port}`; });
test.after(() => new Promise(resolve => { server.close(resolve); server.closeIdleConnections(); }));
async function get(route, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(origin + route, { method }, res => {
      let body = ''; res.setEncoding('utf8'); res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    }); req.on('error', reject); req.end();
  });
}
test('status isolado mantém módulos pendentes sem sondar backends', async () => {
  const response = await get('/api/status?centroCustosUrl=http://127.0.0.1:1');
  assert.equal(response.status, 200);
  const data = JSON.parse(response.body);
  assert.equal(data.isolated, true); assert.equal(data.portfolio, null);
  assert.deepEqual(Object.keys(data.systems), ['orcamentos', 'centroCustos', 'chamados']);
  for (const system of Object.values(data.systems)) {
    assert.equal(system.online, false); assert.equal(system.statusLabel, 'Validação pendente');
  }
});
test('modo isolado não permite launch e portfolio não consulta dados', async () => {
  assert.equal((await get('/api/launch/orcamentos', 'POST')).status, 503);
  assert.equal(JSON.parse((await get('/api/portfolio-summary')).body).portfolio, null);
});
test('instância identifica PID próprio e serve fontes atuais em UTF-8', async () => {
  assert.equal(JSON.parse((await get('/api/hub-identity')).body).pid, process.pid);
  const index = await get('/'); assert.equal(index.status, 200);
  assert.match(index.headers['content-type'], /text\/html; charset=UTF-8/);
  assert.match(index.body, /hub-config.js/);
  const css = await get('/hub-pipeline.css'); assert.match(css.headers['content-type'], /text\/css/);
});

test('Arquivos estáticos são servidos com MIME e UTF-8 corretos', async () => {
  const indexRes = await get('/');
  assert.equal(indexRes.status, 200);
  assert.ok(indexRes.headers['content-type']?.includes('text/html'));
  assert.ok(indexRes.body.includes('hub-config.js'));
  assert.ok(indexRes.body.includes('hub-pipeline.css'));

  const cssRes = await get('/hub-pipeline.css');
  assert.equal(cssRes.status, 200);
  assert.ok(cssRes.headers['content-type']?.includes('text/css'));

  const jsRes = await get('/hub-config.js');
  assert.equal(jsRes.status, 200);
  assert.ok(jsRes.headers['content-type']?.includes('application/javascript'));
  assert.ok(jsRes.body.includes('SYSTEMS_META'));
});
test('porta ocupada rejeita boot em vez de reutilizar servidor alheio', async () => {
  const rival = http.createServer();
  await assert.rejects(new Promise((resolve, reject) => {
    rival.once('error', reject); rival.listen(server.address().port, '127.0.0.1', resolve);
  }), { code: 'EADDRINUSE' });
});
