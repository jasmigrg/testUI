(function initBulkUploadModal(global) {
  function defaultFileValidator(file) {
    return Boolean(file) && (/\.csv$/i.test(file.name) || file.type === 'text/csv');
  }

  function formatFileSize(sizeInBytes) {
    if (!Number.isFinite(sizeInBytes) || sizeInBytes <= 0) return '';
    const kb = sizeInBytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  }

  function create(config) {
    const modal = document.getElementById(config.modalId);
    if (!modal) return null;

    const dropzone = document.getElementById(config.dropzoneId);
    const input = document.getElementById(config.inputId);
    const browseBtn = document.getElementById(config.browseBtnId);
    const nextBtn = document.getElementById(config.nextBtnId);
    const errorEl = document.getElementById(config.errorId);
    const fileCard = document.getElementById(config.fileCardId);
    const fileNameEl = document.getElementById(config.fileNameId);
    const fileSizeEl = document.getElementById(config.fileSizeId);
    const removeBtn = document.getElementById(config.fileRemoveBtnId);

    const closeButtons = Array.from(modal.querySelectorAll(config.closeSelector || '[data-bulk-close]'));

    const initialNextLabel = config.initialNextLabel || 'Next';
    const uploadLabel = config.uploadLabel || 'Upload';
    const validateFile = config.validateFile || defaultFileValidator;

    let selectedFile = null;

    function setFileCardVisible(isVisible) {
      if (!fileCard) return;
      fileCard.hidden = !isVisible;
      fileCard.style.display = isVisible ? 'flex' : 'none';
    }

    function clearState() {
      selectedFile = null;
      if (input) input.value = '';
      if (fileNameEl) fileNameEl.textContent = '';
      if (fileSizeEl) fileSizeEl.textContent = '';
      if (errorEl) errorEl.hidden = true;
      if (nextBtn) {
        nextBtn.textContent = initialNextLabel;
        nextBtn.disabled = false;
      }
      dropzone?.classList.remove('is-dragover');
      setFileCardVisible(false);
    }

    function close() {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
      clearState();
      config.onClose?.();
    }

    function open() {
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      clearState();
      config.onOpen?.();
    }

    function applyFile(file) {
      if (!file) return;

      if (!validateFile(file)) {
        selectedFile = null;
        if (errorEl) errorEl.hidden = false;
        if (nextBtn) {
          nextBtn.textContent = initialNextLabel;
          nextBtn.disabled = false;
        }
        setFileCardVisible(false);
        return;
      }

      selectedFile = file;
      if (fileNameEl) fileNameEl.textContent = file.name;
      if (fileSizeEl) fileSizeEl.textContent = formatFileSize(file.size);
      if (errorEl) errorEl.hidden = true;
      if (nextBtn) {
        nextBtn.textContent = uploadLabel;
        nextBtn.disabled = false;
      }
      setFileCardVisible(true);
    }

    browseBtn?.addEventListener('click', () => input?.click());
    input?.addEventListener('change', (event) => {
      applyFile(event.target.files && event.target.files[0] ? event.target.files[0] : null);
    });
    removeBtn?.addEventListener('click', clearState);

    dropzone?.addEventListener('dragover', (event) => {
      event.preventDefault();
      dropzone.classList.add('is-dragover');
    });
    dropzone?.addEventListener('dragleave', () => {
      dropzone.classList.remove('is-dragover');
    });
    dropzone?.addEventListener('drop', (event) => {
      event.preventDefault();
      dropzone.classList.remove('is-dragover');
      applyFile(event.dataTransfer?.files?.[0] || null);
    });

    nextBtn?.addEventListener('click', () => {
      if (!selectedFile) {
        input?.click();
        return;
      }
      config.onUpload?.(selectedFile, { close, clearState });
    });

    closeButtons.forEach((button) => {
      button.addEventListener('click', close);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !modal.hidden) {
        close();
      }
    });

    return {
      open,
      close,
      clearState,
      getSelectedFile: () => selectedFile
    };
  }

  global.BulkUploadModal = { create };
})(window);