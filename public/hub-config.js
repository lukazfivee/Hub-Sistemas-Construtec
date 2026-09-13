// ==========================================================================
// PORTAL HUB CONSTRUTEC - CONFIGURAÇÃO, ESTADO E UTILITÁRIOS
// Zero Emojis (Tipografia técnica corporativa e SVG)
// Limite: MAX_LINES <= 350
// ==========================================================================

(function () {
  const DEFAULT_URLS = {
    orcamentos: 'http://localhost:5173',
    centro: 'http://localhost:3333',
    chamados: 'https://chamadopro-app.lucas-coelho5923.workers.dev',
  };

  const CHAMADOS_REMOTE_HOSTS = new Set(['chamadopro-app.lucas-coelho5923.workers.dev']);

  const SYSTEMS_META = {
    orcamentos: {
      id: 'orcamentos',
      title: 'Construtec Orçamentos',
      stageText: 'Etapa 01 • Pontapé Inicial',
      pipelineLabel: '01. Orçamentos',
      flowNote: 'Selo RFC 8785 • SHA-256',
      viewId: 'view-preview-orcamentos',
      shortcut: 'Alt+1',
    },
    centro: {
      id: 'centro',
      title: 'Centro de Custos v3',
      stageText: 'Etapa 02 • Gestão da Obra',
      pipelineLabel: '02. Centro de Custos',
      flowNote: 'Baselines & Curva S',
      viewId: 'view-preview-centro',
      shortcut: 'Alt+2',
    },
    chamados: {
      id: 'chamados',
      title: 'Chamados & Ordens de Serviço',
      stageText: 'Etapa 03 • Operação & Pós-Obra',
      pipelineLabel: '03. Chamados & O.S.',
      flowNote: 'Garantia & Assistência',
      viewId: 'view-preview-chamados',
      shortcut: 'Alt+3',
    },
  };

  const hubState = {
    activeSystem: 'orcamentos',
    mobileView: 'sistemas',
    urls: { ...DEFAULT_URLS },
    statuses: {
      orcamentos: false,
      centro: false,
      chamados: false,
    },
  };

  const SYSTEM_ORDER_STORAGE_KEY = 'construtec_hub_system_order';

  function isLocalUrl(value) {
    try {
      const parsed = new URL(value);
      return ['http:', 'https:'].includes(parsed.protocol)
        && ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
    } catch {
      return false;
    }
  }

  function isAllowedSystemUrl(value, systemKey) {
    if (isLocalUrl(value)) return true;
    if (systemKey !== 'chamados') return false;
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'https:' && CHAMADOS_REMOTE_HOSTS.has(parsed.hostname);
    } catch {
      return false;
    }
  }

  function showNotification(message, variant = 'info') {
    const container = document.getElementById('hub-notifications');
    if (!container) return;

    const notice = document.createElement('div');
    notice.className = `hub-notification ${variant}`;
    notice.setAttribute('role', 'status');
    notice.innerHTML = '<p></p><button class="hub-notification-close" type="button" aria-label="Fechar notificação">×</button><span class="hub-notification-life"></span>';
    notice.querySelector('p').textContent = message;

    const dismiss = () => {
      if (notice.classList.contains('is-leaving')) return;
      notice.classList.add('is-leaving');
      window.setTimeout(() => notice.remove(), 190);
    };

    notice.querySelector('.hub-notification-close')?.addEventListener('click', dismiss);
    container.append(notice);
    window.setTimeout(dismiss, 3400);
  }

  window.HubConfig = {
    DEFAULT_URLS,
    SYSTEMS_META,
    SYSTEM_ORDER_STORAGE_KEY,
    hubState,
    isLocalUrl,
    isAllowedSystemUrl,
    showNotification,
  };
})();
