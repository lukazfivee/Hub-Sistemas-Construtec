const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const ORCAMENTOS_DIR = path.resolve(__dirname, '..', 'Construtec orçamentos');
let orcamentosProcess;

function isOrcamentosRunning() {
  return Boolean(orcamentosProcess && orcamentosProcess.exitCode === null && !orcamentosProcess.killed);
}

function getOrcamentosDir() {
  const nested = path.join(ORCAMENTOS_DIR, 'construtec-orcamentos');
  if (fs.existsSync(path.join(nested, 'node_modules', 'electron'))) {
    return nested;
  }
  return ORCAMENTOS_DIR;
}

function startOrcamentos() {
  if (isOrcamentosRunning()) return { started: false, alreadyRunning: true };
  const targetDir = getOrcamentosDir();
  if (!fs.existsSync(path.join(targetDir, 'package.json'))) {
    throw new Error('Projeto Construtec Orçamentos não encontrado ao lado do Portal Hub.');
  }

  const isWindows = process.platform === 'win32';
  const devScript = path.join(targetDir, 'scripts', 'dev.ps1');

  if (isWindows && fs.existsSync(devScript)) {
    orcamentosProcess = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', devScript], {
      cwd: targetDir,
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    });
  } else {
    const cmd = isWindows ? (process.env.ComSpec || 'cmd.exe') : 'npm';
    const args = isWindows ? ['/d', '/s', '/c', 'npm', 'run', 'dev'] : ['run', 'dev'];

    orcamentosProcess = spawn(cmd, args, {
      cwd: targetDir,
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    });
  }

  if (typeof orcamentosProcess.unref === 'function') {
    orcamentosProcess.unref();
  }
  orcamentosProcess.once('error', () => { orcamentosProcess = undefined; });
  orcamentosProcess.once('exit', () => { orcamentosProcess = undefined; });
  return { started: true, alreadyRunning: false };
}

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function normalizeLocalUrl(value) {
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol) || !LOCAL_HOSTS.has(parsed.hostname)) {
      return null;
    }
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

// Teste de conexão local assíncrono com timeout de 1.2s
function checkServiceHealth(targetUrl, timeoutMs = 1200) {
  return new Promise((resolve) => {
    try {
      const normalizedUrl = normalizeLocalUrl(targetUrl);
      if (!normalizedUrl) {
        return resolve({ online: false, reason: 'URL local inválida', url: targetUrl });
      }

      const parsed = new URL(normalizedUrl);
      const client = http.get({
        hostname: parsed.hostname,
        port: parsed.port || 80,
        path: parsed.pathname || '/',
        timeout: timeoutMs,
      }, (res) => {
        resolve({ online: true, statusCode: res.statusCode, url: normalizedUrl });
        res.resume();
      });

      client.on('timeout', () => {
        client.destroy();
        resolve({ online: false, reason: 'Timeout', url: normalizedUrl });
      });

      client.on('error', () => {
        resolve({ online: false, reason: 'Indisponível', url: normalizedUrl });
      });
    } catch (err) {
      resolve({ online: false, reason: err.message, url: targetUrl });
    }
  });
}

// Consulta de resumo consolidado da carteira no Centro de Custos

async function fetchPortfolioSummary(centroCustosUrl, timeoutMs = 1800) {
  if (!process.env.CONSTRUTEC_INTEGRATION_KEY) return null;
  try {
    const normalizedUrl = normalizeLocalUrl(centroCustosUrl);
    if (!normalizedUrl) return null;
    const target = `${normalizedUrl}/api/integracao/orcamentos/portfolio-summary`;
    const res = await fetch(target, {
      headers: {
        'X-Construtec-Integration-Key': process.env.CONSTRUTEC_INTEGRATION_KEY,
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.portfolio || null;
  } catch {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1:3000'}`);
  const pathname = parsedUrl.pathname;

  if (pathname === '/api/launch/orcamentos' && req.method === 'POST') {
    try {
      const result = startOrcamentos();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8', 'Cache-Control': 'no-cache' });
      return res.end(JSON.stringify(result));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=UTF-8', 'Cache-Control': 'no-cache' });
      return res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Falha ao iniciar Orçamentos.' }));
    }
  }

  if (pathname === '/api/portfolio-summary') {
    const customCentroCustosUrl = normalizeLocalUrl(parsedUrl.searchParams.get('centroCustosUrl')) || 'http://localhost:3333';
    const portfolio = await fetchPortfolioSummary(customCentroCustosUrl);
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    });
    return res.end(JSON.stringify({ portfolio }));
  }

  // Endpoint de status da esteira e sistemas
  if (pathname === '/api/status') {
    const searchParams = parsedUrl.searchParams;
    const customOrcamentosUrl = normalizeLocalUrl(searchParams.get('orcamentosUrl')) || 'http://localhost:5173';
    const customCentroCustosUrl = normalizeLocalUrl(searchParams.get('centroCustosUrl')) || 'http://localhost:3333';
    const customChamadosUrl = normalizeLocalUrl(searchParams.get('chamadosUrl')) || 'http://localhost:3334';

    const [orcamentosStatus, initialCentroStatus, chamadosStatus] = await Promise.all([
      checkServiceHealth(customOrcamentosUrl),
      checkServiceHealth(customCentroCustosUrl),
      checkServiceHealth(customChamadosUrl),
    ]);

    let centroStatus = initialCentroStatus;
    let effectiveCentroUrl = customCentroCustosUrl;

    if (!centroStatus.online && (customCentroCustosUrl.includes(':3333') || customCentroCustosUrl.includes(':3456'))) {
      const altPort = customCentroCustosUrl.includes(':3333') ? '3456' : '3333';
      const altUrl = customCentroCustosUrl.replace(/:(3333|3456)/, `:${altPort}`);
      const altStatus = await checkServiceHealth(altUrl);
      if (altStatus.online) {
        centroStatus = altStatus;
        effectiveCentroUrl = altUrl;
      }
    }

    let portfolio = null;
    if (centroStatus.online) {
      portfolio = await fetchPortfolioSummary(effectiveCentroUrl);
    }

    const isOrcOnline = isOrcamentosRunning() || Boolean(orcamentosStatus?.online);

    const responseData = {
      timestamp: new Date().toISOString(),
      portfolio,
      systems: {
        orcamentos: {
          id: 'orcamentos',
          title: 'Construtec Orçamentos',
          stage: '01',
          stageTitle: 'Pontapé Inicial',
          kind: 'desktop',
          url: customOrcamentosUrl,
          online: isOrcOnline,
          statusLabel: isOrcOnline ? (isOrcamentosRunning() ? 'Aplicativo em execução' : 'Online (:5173)') : 'Parado',
        },
        centroCustos: {
          id: 'centroCustos',
          title: 'Centro de Custos v3',
          stage: '02',
          stageTitle: 'Gestão da Obra',
          url: effectiveCentroUrl,
          online: centroStatus.online,
          statusLabel: centroStatus.online ? 'Online' : 'Parado',
        },
        chamados: {
          id: 'chamados',
          title: 'Chamados & Ordens de Serviço',
          stage: '03',
          stageTitle: 'Operação & Pós-Obra',
          url: customChamadosUrl,
          online: chamadosStatus.online,
          statusLabel: chamadosStatus.online ? 'Online' : 'Em Preparação',
        },
      },
    };

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    });
    return res.end(JSON.stringify(responseData));
  }

  // Arquivos estáticos
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = 'index.html';
  }

  let filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback para index.html (SPA)
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
        return res.end('Erro interno do servidor');
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
      });
      res.end(content);
    });
  });
});

server.listen(PORT, '127.0.0.1', async () => {
  try {
    await require('./lib/localControl').registerControl('portal-hub', () => {
      server.close(() => process.exit(0));
      server.closeIdleConnections();
    });
  } catch (error) {
    console.error('Falha no controle local:', error.message);
    server.close();
    process.exitCode = 1;
  }
  console.log(`=======================================================`);
  console.log(`  PORTAL HUB CONSTRUTEC (ESTEIRA OPERACIONAL)`);
  console.log(`  Disponível em: http://localhost:${PORT}`);
  console.log(`  Sem dependências externas • Inicialização Instantânea`);
  console.log(`=======================================================`);
});
