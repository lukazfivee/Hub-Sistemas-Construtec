// ==========================================================================
// PORTAL HUB CONSTRUTEC - MONITORAMENTO EM TEMPO REAL DOS SERVIÇOS
// Telemetria das Portas Locais & Sincronização da Esteira
// Zero Emojis • Limite: MAX_LINES <= 350
// ==========================================================================

(function () {
  const { hubState } = window.HubConfig;

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

      // 3. Chamados
      const statusChamados = document.getElementById('status-chamados');
      if (statusChamados) {
        statusChamados.className = 'service-status-badge preparing';
        statusChamados.textContent = 'Em Preparação';
      }

      // 4. Status Global no Topbar
      const globalDot = document.getElementById('hub-global-dot');
      const globalText = document.getElementById('hub-global-status-text');
      if (globalDot && globalText) {
        if (isCentroOnline && isOrcOnline) {
          globalDot.className = 'hub-pulse-dot';
          globalText.textContent = 'Orçamentos e Centro de Custos Online';
        } else if (isCentroOnline) {
          globalDot.className = 'hub-pulse-dot';
          globalText.textContent = 'Centro de Custos Online (:3333)';
        } else if (isOrcOnline) {
          globalDot.className = 'hub-pulse-dot';
          globalText.textContent = 'Construtec Orçamentos Online (:5173)';
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
    checkSystemsStatus();
    return setInterval(checkSystemsStatus, intervalMs);
  }

  window.HubStatus = {
    checkSystemsStatus,
    startStatusPolling,
  };
})();
