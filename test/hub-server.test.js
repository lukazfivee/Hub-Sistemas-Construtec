const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const HUB_URL = 'http://127.0.0.1:3000';

function get(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`${HUB_URL}${urlPath}`, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

test('GET /api/status retorna estrutura completa da esteira de 3 etapas', async () => {
  const res = await get('/api/status');
  assert.equal(res.statusCode, 200);
  assert.ok(res.headers['content-type']?.includes('application/json'));

  const data = JSON.parse(res.body);
  assert.ok(data.timestamp);
  assert.ok('portfolio' in data);
  assert.ok(data.systems);

  const { orcamentos, centroCustos, chamados } = data.systems;

  // Etapa 01: Orçamentos
  assert.equal(orcamentos.id, 'orcamentos');
  assert.equal(orcamentos.stage, '01');
  assert.equal(orcamentos.stageTitle, 'Pontapé Inicial');
  assert.ok(typeof orcamentos.online === 'boolean');
  assert.ok(orcamentos.statusLabel);

  // Etapa 02: Centro de Custos
  assert.equal(centroCustos.id, 'centroCustos');
  assert.equal(centroCustos.stage, '02');
  assert.equal(centroCustos.stageTitle, 'Gestão da Obra');
  assert.ok(typeof centroCustos.online === 'boolean');
  assert.ok(centroCustos.statusLabel);

  // Etapa 03: Chamados & O.S.
  assert.equal(chamados.id, 'chamados');
  assert.equal(chamados.stage, '03');
  assert.equal(chamados.stageTitle, 'Operação & Pós-Obra');
  assert.ok(typeof chamados.online === 'boolean');
  assert.ok(chamados.statusLabel);
});

test('GET /api/portfolio-summary responde com propriedade portfolio', async () => {
  const res = await get('/api/portfolio-summary');
  assert.equal(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.ok('portfolio' in data);
});

test('Arquivos estáticos são servidos com MIME e UTF-8 corretos', async () => {
  const indexRes = await get('/');
  assert.equal(indexRes.statusCode, 200);
  assert.ok(indexRes.headers['content-type']?.includes('text/html'));
  assert.ok(indexRes.body.includes('esteira-deck'));
  assert.ok(indexRes.body.includes('hub-config.js'));
  assert.ok(indexRes.body.includes('hub-pipeline.css'));

  const cssRes = await get('/hub-pipeline.css');
  assert.equal(cssRes.statusCode, 200);
  assert.ok(cssRes.headers['content-type']?.includes('text/css'));
  assert.ok(cssRes.body.includes('.esteira-deck'));

  const jsRes = await get('/hub-config.js');
  assert.equal(jsRes.statusCode, 200);
  assert.ok(jsRes.headers['content-type']?.includes('application/javascript'));
  assert.ok(jsRes.body.includes('SYSTEMS_META'));
});

test('Electron permite URLs locais e mantém links externos fora da suíte', async () => {
  const source = await require('node:fs').promises.readFile(require('node:path').join(__dirname, '..', 'desktop', 'main.js'), 'utf8');
  assert.match(source, /isLocalAppUrl/);
  assert.match(source, /return \{ action: 'allow' \}/);
  assert.match(source, /shell\.openExternal/);
});
