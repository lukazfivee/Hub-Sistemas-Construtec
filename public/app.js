// ==========================================================================
// PORTAL HUB CONSTRUTEC - TELAS REAIS, CELULAR & NAVEGAÇÃO INTERATIVA
// ==========================================================================

const DEFAULT_URLS = {
  orcamentos: 'http://localhost:5173',
  centro: 'http://localhost:3333',
  chamados: 'http://localhost:3334',
};

const SYSTEMS_META = {
  orcamentos: {
    title: 'Construtec Orçamentos',
    stageText: 'Etapa 01 • Pontapé Inicial',
    viewId: 'view-preview-orcamentos',
  },
  centro: {
    title: 'Centro de Custos v3',
    stageText: 'Etapa 02 • Gestão da Obra',
    viewId: 'view-preview-centro',
  },
  chamados: {
    title: 'Chamados & Ordens de Serviço',
    stageText: 'Etapa 03 • Operação & Pós-Obra',
    viewId: 'view-preview-chamados',
  },
};

const state = {
  activeSystem: 'orcamentos',
  mobileView: 'sistemas', // 'sistemas' ou 'preview'
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

// Notificações breves, sem dependências externas.
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

function loadSavedSystemOrder() {
  const list = document.getElementById('systems-list');
  if (!list) return;

  try {
    const savedOrder = JSON.parse(localStorage.getItem(SYSTEM_ORDER_STORAGE_KEY) || '[]');
    if (!Array.isArray(savedOrder)) return;
    savedOrder.forEach((key) => {
      const card = list.querySelector(`.system-list-card[data-system="${key}"]`);
      if (card) list.append(card);
    });
  } catch (err) {
    console.warn('Erro ao recuperar a ordem dos módulos:', err);
  }
}

function saveSystemOrder() {
  const order = [...document.querySelectorAll('#systems-list .system-list-card')]
    .map((card) => card.dataset.system)
    .filter(Boolean);
  localStorage.setItem(SYSTEM_ORDER_STORAGE_KEY, JSON.stringify(order));
}

function initSystemReordering() {
  const list = document.getElementById('systems-list');
  if (!list) return;
  let draggedCard = null;

  list.querySelectorAll('.system-list-card').forEach((card) => {
    card.draggable = window.innerWidth > 900;

    card.addEventListener('dragstart', (event) => {
      if (window.innerWidth <= 900) {
        event.preventDefault();
        return;
      }
      draggedCard = card;
      card.classList.add('is-dragging');
      card.setAttribute('aria-grabbed', 'true');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', card.dataset.system || '');
    });

    card.addEventListener('dragend', () => {
      if (!draggedCard) return;
      draggedCard.classList.remove('is-dragging');
      draggedCard.removeAttribute('aria-grabbed');
      list.querySelectorAll('.drag-over').forEach((item) => item.classList.remove('drag-over'));
      draggedCard = null;
    });

    card.addEventListener('dragover', (event) => {
      if (!draggedCard || draggedCard === card) return;
      event.preventDefault();
      card.classList.add('drag-over');
      event.dataTransfer.dropEffect = 'move';
    });

    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
    card.addEventListener('drop', (event) => {
      event.preventDefault();
      if (!draggedCard || draggedCard === card) return;
      const insertAfter = event.clientY > card.getBoundingClientRect().top + card.offsetHeight / 2;
      list.insertBefore(draggedCard, insertAfter ? card.nextSibling : card);
      card.classList.remove('drag-over');
      saveSystemOrder();
      showNotification('Ordem dos módulos atualizada.', 'success');
    });
  });

  window.addEventListener('resize', () => {
    list.querySelectorAll('.system-list-card').forEach((card) => {
      card.draggable = window.innerWidth > 900;
    });
  });
}

// Carregar URLs salvas
function loadSavedUrls() {
  try {
    const saved = localStorage.getItem('construtec_hub_urls');
    if (saved) {
      const parsed = JSON.parse(saved);
      state.urls = { ...DEFAULT_URLS, ...parsed };
    }
  } catch (err) {
    console.warn('Erro ao ler URLs salvas:', err);
  }
}

// Salvar URLs no LocalStorage
function saveUrls(newUrls) {
  if (!Object.values(newUrls).every(isLocalUrl)) {
    showNotification('Use apenas URLs locais (localhost ou 127.0.0.1).', 'error');
    return false;
  }

  state.urls = { ...newUrls };
  localStorage.setItem('construtec_hub_urls', JSON.stringify(state.urls));
  updatePreviewMeta();
  updateIframeSource();
  checkSystemsStatus();
  showNotification('Portas e URLs atualizadas.', 'success');
  return true;
}

// Atualizar source do Iframe do Centro de Custos
function updateIframeSource() {
  const iframe = document.getElementById('iframe-centro');
  if (iframe && iframe.src !== state.urls.centro) {
    iframe.src = state.urls.centro;
  }
}

// Alternar abas no Celular (Módulos vs Pré-visualização)
function setMobileView(viewMode) {
  state.mobileView = viewMode;
  const layout = document.getElementById('hub-workspace-layout');
  const btnSistemas = document.getElementById('tab-btn-sistemas');
  const btnPreview = document.getElementById('tab-btn-preview');

  if (layout) layout.setAttribute('data-mobile-view', viewMode);

  if (btnSistemas && btnPreview) {
    btnSistemas.classList.toggle('active', viewMode === 'sistemas');
    btnPreview.classList.toggle('active', viewMode === 'preview');
  }
}

// Selecionar e ativar um sistema na prévia (1 clique ou hover)
function selectSystem(systemKey, shouldSwitchMobile = false) {
  if (!SYSTEMS_META[systemKey]) return;
  state.activeSystem = systemKey;

  // Atualizar cards da sidebar
  document.querySelectorAll('.system-list-card').forEach((card) => {
    card.classList.toggle('active', card.dataset.system === systemKey);
  });

  // Atualizar viewport de prévia
  document.querySelectorAll('.system-preview-view').forEach((view) => {
    view.classList.remove('active');
  });
  const targetView = document.getElementById(SYSTEMS_META[systemKey].viewId);
  if (targetView) targetView.classList.add('active');

  // Atualizar textos do header de prévia
  updatePreviewMeta();

  // No celular, se o usuário tocou em um card, muda automaticamente para a pré-visualização!
  if (shouldSwitchMobile && window.innerWidth <= 900) {
    setMobileView('preview');
  }
}

// Atualizar textos e badges da prévia ativa
function updatePreviewMeta() {
  const meta = SYSTEMS_META[state.activeSystem];
  const url = state.urls[state.activeSystem];
  const isDesktopApp = state.activeSystem === 'orcamentos';
  const displayUrl = isDesktopApp ? 'Aplicativo desktop local' : url;

  const titleEl = document.getElementById('preview-system-title');
  const stageEl = document.getElementById('preview-stage-badge');
  const urlEl = document.getElementById('preview-url-pill');
  const addressUrlText = document.getElementById('address-url-text');
  const modeText = document.getElementById('window-mode-text');
  const liveDot = document.getElementById('live-indicator-dot');

  if (titleEl) titleEl.textContent = meta.title;
  if (stageEl) stageEl.textContent = meta.stageText;
  if (urlEl) urlEl.textContent = displayUrl;
  if (addressUrlText) addressUrlText.textContent = displayUrl;

  if (state.activeSystem === 'centro') {
    if (modeText) modeText.textContent = 'Iframe Real Ao Vivo';
    if (liveDot) liveDot.style.background = '#10b981';
  } else if (state.activeSystem === 'orcamentos') {
    if (modeText) modeText.textContent = 'Mesa Operacional Real';
    if (liveDot) liveDot.style.background = '#01b7f1';
  } else {
    if (modeText) modeText.textContent = 'Em Preparação';
    if (liveDot) liveDot.style.background = '#f59e0b';
  }

  const openButton = document.getElementById('btn-open-current-system');
  if (openButton) {
    const canOpen = state.activeSystem === 'orcamentos'
      || (state.activeSystem !== 'chamados' && state.statuses[state.activeSystem]);
    openButton.disabled = !canOpen;
    openButton.title = isDesktopApp
      ? (state.statuses.orcamentos ? 'Orçamentos já está em execução' : 'Iniciar aplicativo Orçamentos')
      : (canOpen ? `Abrir ${meta.title}` : 'Inicie o módulo antes de abrir');
    const buttonText = openButton.querySelector('span');
    if (buttonText) buttonText.textContent = isDesktopApp
      ? (state.statuses.orcamentos ? 'Orçamentos em execução' : 'Iniciar aplicativo')
      : 'Abrir Sistema';
  }
}

async function launchOrcamentos() {
  try {
    const response = await fetch('/api/launch/orcamentos', { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Falha ao iniciar o aplicativo.');
    showNotification(data.alreadyRunning ? 'Construtec Orçamentos já está em execução.' : 'Iniciando Construtec Orçamentos...', 'success');
    window.setTimeout(checkSystemsStatus, 1200);
  } catch (error) {
    showNotification(error instanceof Error ? error.message : 'Falha ao iniciar o aplicativo.', 'error');
  }
}

// Abrir de fato o sistema (duplo clique ou botão Abrir)
function launchSystem(systemKey) {
  const key = systemKey || state.activeSystem;
  const url = state.urls[key];

  if (key === 'chamados') {
    alert('O módulo "Construtec Chamados & O.S." está em preparação e será conectado assim que sua pasta for adicionada à suíte.');
    return;
  }

  if (key === 'orcamentos') {
    void launchOrcamentos();
    return;
  }

  if (!state.statuses[key]) {
    showNotification(`${SYSTEMS_META[key].title} não está em execução neste computador. Inicie o módulo e teste as conexões novamente.`, 'error');
    return;
  }

  if (url && isLocalUrl(url)) {
    window.open(url, '_blank', 'noopener');
  }
}

// Relógio em tempo real
function startClock() {
  const timeEl = document.getElementById('hub-time');
  const dateEl = document.getElementById('hub-date');

  function update() {
    const now = new Date();
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('pt-BR');
    if (dateEl) dateEl.textContent = now.toLocaleDateString('pt-BR');
  }

  update();
  setInterval(update, 1000);
}

// Alternância de Tema Claro / Noturno
function initTheme() {
  const themeToggle = document.getElementById('hub-theme-toggle');
  const savedTheme = localStorage.getItem('construtec_theme');

  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  themeToggle?.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('construtec_theme', isDark ? 'dark' : 'light');
  });
}

// Testar conexões locais via API do Hub
async function checkSystemsStatus() {
  const refreshBtn = document.getElementById('btn-refresh-status');
  if (refreshBtn) refreshBtn.style.opacity = '0.5';

  try {
    const queryParams = new URLSearchParams({
      orcamentosUrl: state.urls.orcamentos,
      centroCustosUrl: state.urls.centro,
      chamadosUrl: state.urls.chamados,
    });

    const res = await fetch(`/api/status?${queryParams.toString()}`);
    if (!res.ok) throw new Error('Falha ao consultar API');

    const data = await res.json();

    // Orçamentos
    const miniOrc = document.getElementById('mini-status-orcamentos');
    if (miniOrc && data.systems?.orcamentos) {
      const isOnline = data.systems.orcamentos.online;
      state.statuses.orcamentos = isOnline;
      miniOrc.className = `system-status-mini ${isOnline ? 'online' : ''}`;
      miniOrc.textContent = isOnline ? 'Em execução' : 'Parado';
    }

    // Centro de Custos
    const miniCentro = document.getElementById('mini-status-centro');
    const iframeFallback = document.getElementById('iframe-centro-fallback');
    if (miniCentro && data.systems?.centroCustos) {
      const isOnline = data.systems.centroCustos.online;
      state.statuses.centro = isOnline;
      miniCentro.className = `system-status-mini ${isOnline ? 'online' : ''}`;
      miniCentro.textContent = isOnline ? 'Online' : 'Parado';

      if (iframeFallback) {
        iframeFallback.classList.toggle('oculto', isOnline);
      }
    }

    // Atualizar Cockpit Consolidado da Carteira de Obras
    if (typeof window.renderHubPortfolio === 'function') {
      window.renderHubPortfolio(data.portfolio, state.statuses.centro);
    }

    // Chamados
    const miniChamados = document.getElementById('mini-status-chamados');
    if (miniChamados && data.systems?.chamados) {
      const isOnline = data.systems.chamados.online;
      state.statuses.chamados = isOnline;
      miniChamados.className = `system-status-mini ${isOnline ? 'online' : 'preparing'}`;
      miniChamados.textContent = isOnline ? 'Online' : 'Em Preparação';
    }

    // Atualizar badge do mobile
    const mobileStatus = document.getElementById('mobile-tab-status');
    if (mobileStatus) {
      mobileStatus.textContent = state.statuses.centro ? 'Online' : 'Offline';
    }

    updatePreviewMeta();
  } catch (err) {
    console.warn('Erro ao checar status:', err);
  } finally {
    if (refreshBtn) refreshBtn.style.opacity = '1';
  }
}

// Modal de Configurações
function initSettingsModal() {
  const modal = document.getElementById('modal-settings');
  const btnOpen = document.getElementById('btn-open-settings');
  const btnClose = document.getElementById('btn-close-settings');
  const btnReset = document.getElementById('btn-reset-settings');
  const form = document.getElementById('form-settings');

  const inputOrc = document.getElementById('input-url-orcamentos');
  const inputCentro = document.getElementById('input-url-centro');
  const inputChamados = document.getElementById('input-url-chamados');

  function open() {
    if (inputOrc) inputOrc.value = state.urls.orcamentos;
    if (inputCentro) inputCentro.value = state.urls.centro;
    if (inputChamados) inputChamados.value = state.urls.chamados;
    modal?.classList.remove('oculto');
  }

  function close() {
    modal?.classList.add('oculto');
  }

  btnOpen?.addEventListener('click', open);
  btnClose?.addEventListener('click', close);

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });

  btnReset?.addEventListener('click', () => {
    if (inputOrc) inputOrc.value = DEFAULT_URLS.orcamentos;
    if (inputCentro) inputCentro.value = DEFAULT_URLS.centro;
    if (inputChamados) inputChamados.value = DEFAULT_URLS.chamados;
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const saved = saveUrls({
      orcamentos: inputOrc?.value?.trim() || DEFAULT_URLS.orcamentos,
      centro: inputCentro?.value?.trim() || DEFAULT_URLS.centro,
      chamados: inputChamados?.value?.trim() || DEFAULT_URLS.chamados,
    });
    if (saved) close();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal?.classList.contains('oculto')) {
      close();
    }
  });
}

// Eventos de Navegação, Clique Simples e Duplo Clique
function initInteractions() {
  const systemCards = document.querySelectorAll('.system-list-card');

  systemCards.forEach((card) => {
    const sysKey = card.dataset.system;

    // 1 clique: seleciona e abre a pré-visualização (no mobile vai para a aba de preview)
    card.addEventListener('click', () => {
      selectSystem(sysKey, true);
    });

    // Hover no desktop: pré-visualiza suavemente
    card.addEventListener('mouseenter', () => {
      if (window.innerWidth > 900) {
        selectSystem(sysKey, false);
      }
    });

    // Duplo clique: abre o sistema de fato!
    card.addEventListener('dblclick', () => {
      launchSystem(sysKey);
    });
  });

  // Botão primário "Abrir Sistema"
  document.getElementById('btn-open-current-system')?.addEventListener('click', () => {
    launchSystem(state.activeSystem);
  });

  // Botão de voltar no mobile
  document.getElementById('btn-back-to-list')?.addEventListener('click', () => {
    setMobileView('sistemas');
  });

  // Abas do Celular
  document.getElementById('tab-btn-sistemas')?.addEventListener('click', () => {
    setMobileView('sistemas');
  });
  document.getElementById('tab-btn-preview')?.addEventListener('click', () => {
    setMobileView('preview');
  });

  // Botão de testar conexões
  document.getElementById('btn-refresh-status')?.addEventListener('click', checkSystemsStatus);

  // Navegação por teclado (Enter abre, Setas alternam)
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

    const keys = ['orcamentos', 'centro', 'chamados'];
    const currentIndex = keys.indexOf(state.activeSystem);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % keys.length;
      selectSystem(keys[nextIndex], false);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + keys.length) % keys.length;
      selectSystem(keys[prevIndex], false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      launchSystem(state.activeSystem);
    } else if (e.altKey && e.key === '1') {
      e.preventDefault();
      selectSystem('orcamentos', true);
      launchSystem('orcamentos');
    } else if (e.altKey && e.key === '2') {
      e.preventDefault();
      selectSystem('centro', true);
      launchSystem('centro');
    } else if (e.altKey && e.key === '3') {
      e.preventDefault();
      selectSystem('chamados', true);
      launchSystem('chamados');
    }
  });
}

// Inicialização Principal
document.addEventListener('DOMContentLoaded', () => {
  loadSavedUrls();
  loadSavedSystemOrder();
  startClock();
  initTheme();
  setMobileView('sistemas');
  updatePreviewMeta();
  initSettingsModal();
  initInteractions();
  initSystemReordering();

  // Verificação inicial de conexões
  checkSystemsStatus();

  // Polling automático de saúde das portas a cada 10s
  setInterval(checkSystemsStatus, 10000);
});
