(function initPageToast(global) {
  const DEFAULT_STORAGE_KEY = 'pageToastPayload';

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function show(config) {
    const container = config?.container;
    if (!container) return null;

    const toast = document.createElement('div');
    toast.className = `app-page-toast app-page-toast--${config.type || 'success'}`;
    toast.innerHTML = `
      <span class="app-page-toast-icon" aria-hidden="true">${escapeHtml(config.icon || '✓')}</span>
      <div class="app-page-toast-text">
        <strong>${escapeHtml(config.title || '')}</strong>
        <span>${escapeHtml(config.subtitle || '')}</span>
      </div>
      <button type="button" class="app-page-toast-close" aria-label="Close message">×</button>
    `;

    const closeButton = toast.querySelector('.app-page-toast-close');
    closeButton?.addEventListener('click', () => toast.remove());

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('is-visible'), 20);

    const autoHideMs = Number.isFinite(config.autoHideMs) ? config.autoHideMs : 6000;
    if (autoHideMs > 0) {
      setTimeout(() => toast.remove(), autoHideMs);
    }

    return toast;
  }

  function stash(payload, key = DEFAULT_STORAGE_KEY) {
    try {
      sessionStorage.setItem(key, JSON.stringify(payload));
    } catch (error) {
      console.warn('Unable to stash page toast payload', error);
    }
  }

  function consume(key = DEFAULT_STORAGE_KEY) {
    try {
      const raw = sessionStorage.getItem(key);
      sessionStorage.removeItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn('Unable to consume page toast payload', error);
      return null;
    }
  }

  global.PageToast = {
    show,
    stash,
    consume
  };
})(window);
