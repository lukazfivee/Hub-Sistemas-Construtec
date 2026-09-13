// ==========================================================================
// SUÍTE CONSTRUTEC - CONTROLADOR DO PORTAL HUB (DESTILADO)
// Launcher & Cockpit de Esteira • Acesso em 1 Clique
// Zero Emojis • Limite: MAX_LINES <= 350
// ==========================================================================

(function () {
  const { hubState, showNotification, isLocalUrl } = window.HubConfig;

  function integrationPending() {
    if (!window.construtecDesktop?.isDesktop && !hubState.isolated) return false;
    showNotification('Integração dos módulos pendente de validação.', 'info');
    return true;
  }

  async function launchOrcamentos() {
    if (integrationPending()) return;
    const orcUrl = hubState.urls.orcamentos || 'http://localhost:5173';
    if (hubState.statuses.orcamentos) {
      if (isLocalUrl(orcUrl)) {
        window.open(orcUrl, '_blank', 'noopener');
      }
      return;
    }
    try {
      const response = await fetch('/api/launch/orcamentos', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao iniciar o aplicativo.');
      showNotification(data.alreadyRunning ? 'Construtec Orçamentos já está ativo.' : 'Iniciando Construtec Orçamentos...', 'success');
      window.setTimeout(() => {
        window.HubStatus.checkSystemsStatus();
        if (isLocalUrl(orcUrl)) {
          window.open(orcUrl, '_blank', 'noopener');
        }
      }, 1800);
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Falha ao iniciar Orçamentos.', 'error');
    }
  }

  function launchCentro() {
    if (integrationPending()) return;
    const url = hubState.urls.centro || 'http://localhost:3333';
    if (isLocalUrl(url)) {
      window.open(url, '_blank', 'noopener');
    }
  }

  function infoChamados() {
    if (integrationPending()) return;
    showNotification('Módulo Chamados & O.S. em preparação. A pasta do projeto será conectada em breve.', 'info');
  }

  function initInteractions() {
    // Ação 01: Construtec Orçamentos
    document.getElementById('btn-action-orcamentos')?.addEventListener('click', (e) => {
      e.stopPropagation();
      launchOrcamentos();
    });
    document.getElementById('card-orcamentos')?.addEventListener('click', () => {
      launchOrcamentos();
    });

    // Ação 02: Centro de Custos v3
    document.getElementById('btn-action-centro')?.addEventListener('click', (e) => {
      e.stopPropagation();
      launchCentro();
    });
    document.getElementById('card-centro')?.addEventListener('click', () => {
      launchCentro();
    });

    // Ação 03: Chamados & O.S.
    document.getElementById('btn-action-chamados')?.addEventListener('click', (e) => {
      e.stopPropagation();
      infoChamados();
    });
    document.getElementById('card-chamados')?.addEventListener('click', () => {
      infoChamados();
    });

    // Refresh manual de conexão
    document.getElementById('btn-refresh-status')?.addEventListener('click', window.HubStatus.checkSystemsStatus);

    // Atalhos Globais de Teclado
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      if (e.altKey && e.key === '1') {
        e.preventDefault();
        launchOrcamentos();
      } else if (e.altKey && e.key === '2') {
        e.preventDefault();
        launchCentro();
      } else if (e.altKey && e.key === '3') {
        e.preventDefault();
        infoChamados();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.HubSettings.loadSavedUrls();
    window.HubSettings.initSettingsModal();
    initInteractions();
    window.HubStatus.startStatusPolling(10000);
  });

  window.HubApp = {
    launchOrcamentos,
    launchCentro,
    infoChamados,
  };
})();
