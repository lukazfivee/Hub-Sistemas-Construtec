// ==========================================================================
// PORTAL HUB CONSTRUTEC - MODAL DE CONFIGURAÇÃO DE PORTAS & CONEXÕES
// Triplo Fechamento: Botão "×", clique no backdrop e tecla Escape
// Limite: MAX_LINES <= 350
// ==========================================================================

(function () {
  const { DEFAULT_URLS, hubState, isAllowedSystemUrl, showNotification } = window.HubConfig;

  function loadSavedUrls() {
    try {
      const saved = localStorage.getItem('construtec_hub_urls');
      if (saved) {
        const parsed = JSON.parse(saved);
        const candidate = { ...DEFAULT_URLS, ...parsed };
        if (candidate.centro === 'http://localhost:3333') candidate.centro = DEFAULT_URLS.centro;
        // Impede que uma URL salva em outro card troque os destinos da esteira.
        hubState.urls = Object.fromEntries(
          Object.entries(DEFAULT_URLS).map(([key, fallback]) => [
            key,
            isAllowedSystemUrl(candidate[key], key) ? candidate[key] : fallback,
          ])
        );
      }
    } catch (err) {
      console.warn('Erro ao ler URLs salvas:', err);
    }
  }

  function saveUrls(newUrls) {
    if (!Object.entries(newUrls).every(([key, value]) => isAllowedSystemUrl(value, key))) {
      showNotification('Use URLs locais; o ChamadoPro também aceita o endereço oficial em HTTPS.', 'error');
      return false;
    }

    hubState.urls = { ...newUrls };
    localStorage.setItem('construtec_hub_urls', JSON.stringify(hubState.urls));
    if (typeof window.HubApp?.updatePreviewMeta === 'function') {
      window.HubApp.updatePreviewMeta();
    }
    if (typeof window.HubApp?.updateIframeSource === 'function') {
      window.HubApp.updateIframeSource();
    }
    if (typeof window.HubStatus?.checkSystemsStatus === 'function') {
      window.HubStatus.checkSystemsStatus();
    }
    showNotification('Portas e URLs atualizadas com sucesso.', 'success');
    return true;
  }

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
      if (inputOrc) inputOrc.value = hubState.urls.orcamentos;
      if (inputCentro) inputCentro.value = hubState.urls.centro;
      if (inputChamados) inputChamados.value = hubState.urls.chamados;
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

  window.HubSettings = {
    loadSavedUrls,
    saveUrls,
    initSettingsModal,
  };
})();
