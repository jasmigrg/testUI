(function initPageToast(global) {
  const DEFAULT_STORAGE_KEY = 'pageToastPayload';
  const DEFAULT_MESSAGES = {
    LOAD_ERROR: 'Failed to load data.',
    BATCH_CREATE_SUCCESS: 'Batch created successfully.',
    BATCH_CREATE_ERROR: 'Failed to create batch.',
    UPLOAD_SUCCESS: 'File uploaded successfully.',
    UPLOAD_ERROR: 'File upload failed.',
    IMPORT_START_SUCCESS: 'Import started.',
    IMPORT_START_ERROR: 'Failed to start import.',
    BATCH_ROWS_LOAD_SUCCESS: 'Batch rows loaded successfully.',
    BATCH_ROWS_LOAD_ERROR: 'Failed to load selected batch rows.',
    BATCH_DELETE_SUCCESS: 'Batch removed from list.',
    BATCH_DELETE_ERROR: 'Failed to delete batch.',
    PROCESS_UPLOAD_ERROR: 'Failed to process upload',
    ROW_SAVE_SUCCESS: 'Row updated successfully.',
    ROW_SAVE_ERROR: 'Failed to update row.',
    SUBMIT_SUCCESS: 'Submitted successfully.',
    SUBMIT_ERROR: 'Submit failed.'
  };
  const TYPE_PRESETS = {
    success: { title: 'Success', icon: '✓' },
    error: { title: 'Error', icon: '!' },
    info: { title: 'Information', icon: 'i' },
    warning: { title: 'Warning', icon: '!' }
  };

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function show(config) {
    const container = config?.container || document.body;
    if (!container) return null;

    const rootId = 'appPageToastRoot';
    let root = document.getElementById(rootId);
    if (!root) {
      root = document.createElement('div');
      root.id = rootId;
      root.style.position = 'fixed';
      root.style.right = '12px';
      root.style.zIndex = '5000';
      root.style.display = 'flex';
      root.style.flexDirection = 'column';
      root.style.gap = '10px';
      root.style.pointerEvents = 'none';
      container.appendChild(root);
    }

    const header = document.querySelector('.app-header');
    const topOffset = header
      ? Math.ceil(header.getBoundingClientRect().bottom + 12)
      : 76;
    root.style.top = `${topOffset}px`;

    const toast = document.createElement('div');
    toast.className = `app-page-toast app-page-toast--${config.type || 'success'}`;
    toast.style.position = 'relative';
    toast.style.top = 'auto';
    toast.style.right = 'auto';
    toast.style.zIndex = '1';
    toast.style.pointerEvents = 'auto';
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

    root.appendChild(toast);
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

  function resolveMessage(payload, fallbackKey, messageMap = DEFAULT_MESSAGES) {
    const backendMessage = payload?.message
      || payload?.data?.message
      || (Array.isArray(payload?.errors) ? payload.errors[0]?.message : '')
      || payload?.error
      || '';
    if (backendMessage) return backendMessage;
    if (fallbackKey && messageMap && messageMap[fallbackKey]) return messageMap[fallbackKey];
    if (fallbackKey && DEFAULT_MESSAGES[fallbackKey]) return DEFAULT_MESSAGES[fallbackKey];
    return 'Something went wrong.';
  }

  function notify(options = {}) {
    const type = options.type || 'info';
    const preset = TYPE_PRESETS[type] || TYPE_PRESETS.info;
    return show({
      container: options.container || document.body,
      type,
      icon: options.icon || preset.icon,
      title: options.title || preset.title,
      subtitle: options.subtitle || options.message || '',
      autoHideMs: Number.isFinite(options.autoHideMs) ? options.autoHideMs : 3000
    });
  }

  global.PageToast = {
    show,
    notify,
    stash,
    consume,
    resolveMessage,
    messages: DEFAULT_MESSAGES
  };
})(window);
