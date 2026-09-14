// ==========================================================================
// PORTAL HUB CONSTRUTEC - MONITORAMENTO EM TEMPO REAL DOS SERVIÇOS
// Telemetria das Portas Locais & Sincronização da Esteira
// Zero Emojis • Limite: MAX_LINES <= 350
// ==========================================================================

(function () {
  const { hubState } = window.HubConfig;

  function renderPending() {
    hubState.isolated = true;
    for (const module of ['orcamentos', 'centro', 'chamados']) {
      hubState.statuses[module] = false;
      const badge = document.getElementById(`status-${module}`);
      if (badge) { badge.className = 'service-status-badge preparing'; badge.textContent = 'Validação pendente'; }
      const port = document.getElementById(`port-tag-${module}`);
      if (port) port.textContent = 'Integração pendente';
      const button = document.getElementById(`btn-action-${module}`);
      button?.classList.remove('primary');
      const label = button?.querySelector('span');
      if (label) label.textContent = 'Consultar disponibilidade';
    }
    const global = document.getElementById('hub-global-status-text');
    if (global) global.textContent = 'Integração pendente de validação';
    const dot = document.getElementById('hub-global-dot');
    if (dot) dot.className = 'hub-pulse-dot warning';
    const portfolio = document.getElementById('hub-portfolio-container');
    if (portfolio) portfolio.textContent = 'Indicadores financeiros aguardando validação da integração.';
    document.querySelector('.hub-card-portfolio-chip')?.remove();
  }

  async function checkSystemsStatus() {
    const refreshBtn = document.getElementById('btn-refresh-status');
    if (refreshBtn) refreshBtn.style.opacity = '0.5';

    try {
      const queryParams = new URLSearchParams({
        orcamentosUrl: hubState.urls.orcamentos,
        centroCustosUrl: hubState.urls.centro,
        chamadosUrl: hubState.urls.chamados,
      });

      const res = await fetch(`/api/status?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Falha ao consultar status');

      const data = await res.json();
      if (data.isolated || window.construtecDesktop?.isDesktop) {
        renderPending();
        return;
      }
      hubState.isolated = false;

      // 1. Orçamentos
      const isOrcOnline = Boolean(data.systems?.orcamentos?.online);
      hubState.statuses.orcamentos = isOrcOnline;
      const statusOrc = document.getElementById('status-orcamentos');
      const portOrc = document.getElementById('port-tag-orcamentos');
      const btnOrc = document.getElementById('btn-action-orcamentos');

      if (statusOrc) {
        statusOrc.className = `service-status-badge ${isOrcOnline ? 'online' : ''}`;
        statusOrc.textContent = isOrcOnline ? 'Online' : 'Parado';
      }
      if (portOrc) {
        portOrc.textContent = isOrcOnline ? 'Em execução • :5173' : 'Desktop • :5173';
      }
      if (btnOrc) {
        const btnText = btnOrc.querySelector('span');
        if (btnText) btnText.textContent = isOrcOnline ? 'Orçamentos Ativo' : 'Iniciar Orçamentos';
        btnOrc.classList.toggle('primary', isOrcOnline);
      }

      // 2. Centro de Custos
      const isCentroOnline = Boolean(data.systems?.centroCustos?.online);
      hubState.statuses.centro = isCentroOnline;
      const statusCentro = document.getElementById('status-centro');
      const portCentro = document.getElementById('port-tag-centro');
      const btnCentro = document.getElementById('btn-action-centro');

      if (statusCentro) {
        statusCentro.className = `service-status-badge ${isCentroOnline ? 'online' : ''}`;
        statusCentro.textContent = isCentroOnline ? 'Online' : 'Parado';
      }
      if (portCentro) {
        portCentro.textContent = isCentroOnline ? 'Produção Ativa • :3333' : 'Porta :3333 (Parado)';
      }
      if (btnCentro) {
        btnCentro.classList.toggle('primary', isCentroOnline);
      }

      // 3. Chamados & O.S.
      let isChamadosOnline = Boolean(data.systems?.chamados?.online);
      const chamadosIntegration = data.systems?.chamados?.integration;
      // Fallback do health-check público: Workers diferentes podem não conseguir
      // fazer subrequests entre si, mas o endpoint público do ChamadoPro aceita CORS.
      if (!isChamadosOnline && /^https:\/\//i.test(hubState.urls.chamados || '')) {
        try {
          const healthResponse = await fetch(`${hubState.urls.chamados}/v1/health`, { cache: 'no-store' });
          const health = await healthResponse.json();
          isChamadosOnline = healthResponse.ok && Boolean(health?.ok || health?.database === 'connected');
        } catch {
          isChamadosOnline = false;
        }
      }
      hubState.statuses.chamados = isChamadosOnline;
      const statusChamados = document.getElementById('status-chamados');
      if (statusChamados) {
        statusChamados.className = `service-status-badge ${isChamadosOnline ? 'online' : 'preparing'}`;
        statusChamados.textContent = isChamadosOnline ? (chamadosIntegration ? 'Online • API' : 'Online') : 'Offline';
      }
      const chamadosCard = document.getElementById('card-chamados');
      if (chamadosCard) chamadosCard.classList.toggle('disabled-state', !isChamadosOnline);
      const chamadosButton = document.getElementById('btn-action-chamados');
      if (chamadosButton) {
        chamadosButton.disabled = !isChamadosOnline;
        chamadosButton.classList.toggle('disabled', !isChamadosOnline);
        const buttonText = chamadosButton.querySelector('span');
        if (buttonText) buttonText.textContent = isChamadosOnline ? 'Abrir ChamadoPro' : 'ChamadoPro Offline';
      }
      const chamadosPort = document.getElementById('port-tag-chamados');
      if (chamadosPort) {
        chamadosPort.textContent = chamadosIntegration
          ? `${chamadosIntegration.abertos} abertos • ${chamadosIntegration.em_andamento} em andamento`
          : (isChamadosOnline ? 'API online • chave do Hub pendente' : 'API do ChamadoPro indisponível');
      }
      const chamadosSummary = document.getElementById('chamados-live-summary');
      if (chamadosSummary) {
        chamadosSummary.className = `chamados-live-summary ${chamadosIntegration ? 'is-connected' : ''}`;
        chamadosSummary.textContent = chamadosIntegration
          ? `${chamadosIntegration.total} total • ${chamadosIntegration.abertos} abertos • ${chamadosIntegration.em_andamento} em andamento • ${chamadosIntegration.concluidos} concluídos`
          : (isChamadosOnline
            ? 'API online. Configure CONSTRUTEC_CHAMADOS_INTEGRATION_KEY para carregar os indicadores.'
            : 'O ChamadoPro não respondeu ao teste de saúde.');
      }

      // 4. Status Global no Topbar
      const globalDot = document.getElementById('hub-global-dot');
      const globalText = document.getElementById('hub-global-status-text');
      if (globalDot && globalText) {
        if (isCentroOnline && isOrcOnline && isChamadosOnline) {
          globalDot.className = 'hub-pulse-dot';
          globalText.textContent = 'Esteira completa online';
        } else if (isCentroOnline) {
          globalDot.className = 'hub-pulse-dot';
          globalText.textContent = 'Centro de Custos Online (:3333)';
        } else if (isOrcOnline) {
          globalDot.className = 'hub-pulse-dot';
          globalText.textContent = 'Construtec Orçamentos Online (:5173)';
        } else if (isChamadosOnline) {
          globalDot.className = 'hub-pulse-dot';
          globalText.textContent = 'ChamadoPro Online (API HTTPS)';
        } else {
          globalDot.className = 'hub-pulse-dot warning';
          globalText.textContent = 'Aguardando Inicialização dos Serviços';
        }
      }

      // 5. Cockpit Multi-Obras
      if (typeof window.renderHubPortfolio === 'function') {
        window.renderHubPortfolio(data.portfolio, isCentroOnline);
      }
    } catch (err) {
      console.warn('Erro ao atualizar status dos serviços:', err);
    } finally {
      if (refreshBtn) refreshBtn.style.opacity = '1';
    }
  }

  function startStatusPolling(intervalMs = 10000) {
    if (window.construtecDesktop?.isDesktop) renderPending();
    checkSystemsStatus();
    return setInterval(checkSystemsStatus, intervalMs);
  }

  window.HubStatus = {
    checkSystemsStatus,
    startStatusPolling,
  };
})();
