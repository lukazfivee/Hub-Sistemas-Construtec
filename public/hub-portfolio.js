// ==========================================================================
// PORTAL HUB - COCKPIT CONSOLIDADO DA CARTEIRA DE OBRAS (MULTI-OBRAS)
// Módulo de Integração com o Centro de Custos v3
// Zero Emojis (Apenas Ícones SVG e Tipografia Corporativa)
// ==========================================================================

(function () {
  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  function formatCurrency(val) {
    return money.format(Number(val) || 0);
  }

  function getRiskBadge(portfolio) {
    const atRiskCount = Number(portfolio.atRiskCount) || 0;
    const isOver = Boolean(portfolio.isOverBudget);

    if (isOver || atRiskCount > 0) {
      const label = isOver
        ? 'Estouro de Orçamento Detectado'
        : `Atenção: ${atRiskCount} obra${atRiskCount > 1 ? 's' : ''} com consumo >80%`;
      return `<span class="hub-cockpit-badge warning">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        ${label}
      </span>`;
    }

    return `<span class="hub-cockpit-badge">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <path d="m9 12 2 2 4-4"></path>
      </svg>
      Carteira Saudável
    </span>`;
  }

  function renderCardMetrics(portfolio, isOnline) {
    const centroCard = document.getElementById('card-centro');
    if (!centroCard) return;

    let chip = centroCard.querySelector('.hub-card-portfolio-chip');

    if (!isOnline || !portfolio) {
      if (chip) chip.remove();
      return;
    }

    if (!chip) {
      chip = document.createElement('div');
      chip.className = 'hub-card-portfolio-chip';
      const body = centroCard.querySelector('.card-body');
      if (body) body.appendChild(chip);
    }

    const contratado = formatCurrency(portfolio.totalContractValue);
    const saldo = formatCurrency(portfolio.totalBalance);

    chip.innerHTML = `
      <div class="hub-chip-metric">
        <span>Contratado:</span> <strong>${contratado}</strong>
      </div>
      <div class="hub-chip-metric">
        <span>Saldo Livre:</span> <strong class="balance-val">${saldo}</strong>
      </div>
    `;
  }

  window.renderHubPortfolio = function (portfolio, isOnline) {
    renderCardMetrics(portfolio, isOnline);

    const container = document.getElementById('hub-portfolio-container');
    if (!container) return;

    if (!isOnline || !portfolio) {
      container.innerHTML = `
        <div class="hub-portfolio-cockpit" style="opacity: 0.75;">
          <div class="hub-cockpit-header">
            <div class="hub-cockpit-titles">
              <span class="hub-cockpit-eyebrow">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                Cockpit da Carteira de Obras
              </span>
              <h3 class="hub-cockpit-title">Consolidação Multi-Obras em Espera</h3>
            </div>
            <div class="hub-cockpit-actions">
              <span class="hub-cockpit-badge warning">Centro de Custos Offline</span>
            </div>
          </div>
          <div class="hub-offline-notice">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            Inicie o Centro de Custos v3 na porta 3333/3456 para carregar os indicadores financeiros e horas de equipe em tempo real.
          </div>
        </div>
      `;
      return;
    }

    const burnRate = Math.min(Math.max(Number(portfolio.burnRatePercent) || 0, 0), 100);
    const meterClass = burnRate > 95 ? 'danger' : burnRate > 80 ? 'warning' : '';
    const atRiskCount = Number(portfolio.atRiskCount) || 0;

    container.innerHTML = `
      <div class="hub-portfolio-cockpit" id="hub-portfolio-cockpit">
        <div class="hub-cockpit-header">
          <div class="hub-cockpit-titles">
            <span class="hub-cockpit-eyebrow">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              Cockpit da Carteira de Obras (Multi-Obras)
            </span>
            <h3 class="hub-cockpit-title">Saúde Financeira e Operacional da Esteira</h3>
          </div>
          <div class="hub-cockpit-actions">
            ${getRiskBadge(portfolio)}
          </div>
        </div>

        <div class="hub-cockpit-grid">
          <div class="hub-cockpit-card">
            <span class="hub-card-label">Valor Contratual</span>
            <span class="hub-card-val accent">${formatCurrency(portfolio.totalContractValue)}</span>
            <span class="hub-card-sub">${portfolio.integratedWorksCount || 1} obra(s) integrada(s)</span>
          </div>

          <div class="hub-cockpit-card">
            <span class="hub-card-label">Custo Base Orçado</span>
            <span class="hub-card-val">${formatCurrency(portfolio.totalBaseCost)}</span>
            <span class="hub-card-sub">Baselines vigentes</span>
          </div>

          <div class="hub-cockpit-card">
            <span class="hub-card-label">Realizado Líquido</span>
            <span class="hub-card-val">${formatCurrency(portfolio.totalRealizedCost)}</span>
            <span class="hub-card-sub">Deduzidos estornos</span>
          </div>

          <div class="hub-cockpit-card">
            <span class="hub-card-label">Saldo Disponível</span>
            <span class="hub-card-val positive">${formatCurrency(portfolio.totalBalance)}</span>
            <span class="hub-card-sub">Margem global livre</span>
          </div>

          <div class="hub-cockpit-card">
            <span class="hub-card-label">Horas da Equipe</span>
            <span class="hub-card-val">${portfolio.laborHours?.consumed || 0}h / ${portfolio.laborHours?.planned || 0}h</span>
            <span class="hub-card-sub">Saldo: ${portfolio.laborHours?.balance || 0}h restantes</span>
          </div>

          <div class="hub-cockpit-card">
            <span class="hub-card-label">Faturado Cliente</span>
            <span class="hub-card-val">${formatCurrency(portfolio.clientBilling?.totalBilled || 0)}</span>
            <span class="hub-card-sub">A faturar: ${formatCurrency(portfolio.clientBilling?.balanceToBill || 0)}</span>
          </div>
        </div>

        <div class="hub-cockpit-meter">
          <div class="hub-meter-info">
            <span><strong>Consumo Global do Orçamento:</strong> ${burnRate.toFixed(1)}% do custo base</span>
            <span>${atRiskCount > 0 ? `${atRiskCount} obra(s) requerem atenção` : 'Todas as obras dentro do limite planejado'}</span>
          </div>
          <div class="hub-meter-bar-track">
            <div class="hub-meter-bar-fill ${meterClass}" style="width: ${burnRate}%;"></div>
          </div>
        </div>
      </div>
    `;
  };
})();
