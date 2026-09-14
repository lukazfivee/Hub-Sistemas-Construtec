const DEFAULT_CHAMADOS_URL = 'https://chamadopro-app.lucas-coelho5923.workers.dev';
const TRUSTED_CHAMADOS_HOST = 'chamadopro-app.lucas-coelho5923.workers.dev';

function getChamadosUrl(request, env) {
  const requested = new URL(request.url).searchParams.get('chamadosUrl');
  const candidate = requested || env.CHAMADOPRO_URL || DEFAULT_CHAMADOS_URL;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' || url.hostname !== TRUSTED_CHAMADOS_HOST) return null;
    return url.origin;
  } catch {
    return null;
  }
}

async function fetchJson(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: { Accept: 'application/json', ...(init.headers || {}) }
  });
  if (!response.ok) throw new Error(`ChamadoPro respondeu HTTP ${response.status}`);
  return response.json();
}

async function statusResponse(request, env) {
  const chamadosUrl = getChamadosUrl(request, env);
  if (!chamadosUrl) {
    return Response.json({ error: 'URL do ChamadoPro inválida.' }, { status: 400 });
  }

  let health = null;
  let integration = null;
  let recentes = [];
  try {
    health = await fetchJson(`${chamadosUrl}/v1/health`);
    if (env.HUB_INTEGRATION_KEY) {
      const headers = { 'X-Construtec-Hub-Key': env.HUB_INTEGRATION_KEY };
      integration = await fetchJson(`${chamadosUrl}/v1/integracao/hub/status`, { headers });
      const tickets = await fetchJson(`${chamadosUrl}/v1/integracao/hub/chamados?limit=5`, { headers });
      recentes = Array.isArray(tickets?.chamados) ? tickets.chamados : [];
    }
  } catch {
    health = null;
  }

  const online = Boolean(health?.ok || health?.database === 'connected');
  return Response.json({
    timestamp: new Date().toISOString(),
    portfolio: null,
    systems: {
      orcamentos: {
        id: 'orcamentos', title: 'Construtec Orçamentos', stage: '01',
        stageTitle: 'Pontapé Inicial', kind: 'desktop', url: 'http://localhost:5173',
        online: false, statusLabel: 'Disponível apenas no computador local'
      },
      centroCustos: {
        id: 'centroCustos', title: 'Centro de Custos v3', stage: '02',
        stageTitle: 'Gestão da Obra', url: 'http://localhost:3333',
        online: false, statusLabel: 'Disponível apenas no computador local'
      },
      chamados: {
        id: 'chamados', title: 'Chamados & Ordens de Serviço', stage: '03',
        stageTitle: 'Operação & Pós-Obra', url: chamadosUrl,
        online, statusLabel: online ? 'Online' : 'Offline',
        integration: integration?.tickets
          ? { ...integration.tickets, service: integration.service, database: integration.database, recentes }
          : null
      }
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/status' && request.method === 'GET') {
      return statusResponse(request, env);
    }
    if (url.pathname === '/api/portfolio-summary' && request.method === 'GET') {
      return Response.json({ portfolio: null });
    }
    if (url.pathname === '/api/launch/orcamentos' && request.method === 'POST') {
      return Response.json({ error: 'O módulo Orçamentos é local e deve ser aberto pelo Hub desktop.' }, { status: 501 });
    }
    if (url.pathname === '/') {
      return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
    }
    return env.ASSETS.fetch(request);
  }
};
