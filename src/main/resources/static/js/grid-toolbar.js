(function (global) {
  const DEFAULT_DENSITY_PRESETS = {
    comfortable: { rowHeight: 50, headerHeight: 56, floatingFiltersHeight: 38 },
    compact: { rowHeight: 40, headerHeight: 48, floatingFiltersHeight: 38 },
    spacious: { rowHeight: 60, headerHeight: 64, floatingFiltersHeight: 38 }
  };

  function setDensity(options, mode) {
    const {
      gridApi,
      gridElement,
      presets = DEFAULT_DENSITY_PRESETS,
      densityModes = ['comfortable', 'compact', 'spacious'],
      densityClassPrefix = 'mfi-density',
      densityButtonSelector = '.gt-view-btn[data-density]'
    } = options;

    if (!gridApi || !gridElement) return;

    const preset = presets[mode] || presets.compact;
    densityModes.forEach(density => gridElement.classList.remove(`${densityClassPrefix}-${density}`));
    gridElement.classList.add(`${densityClassPrefix}-${mode}`);

    document.querySelectorAll(densityButtonSelector).forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.density === mode);
    });

    gridApi.setGridOption('rowHeight', preset.rowHeight);
    gridApi.setGridOption('headerHeight', preset.headerHeight);
    gridApi.setGridOption('floatingFiltersHeight', preset.floatingFiltersHeight);
    gridApi.refreshHeader();
    gridApi.resetRowHeights();
  }

  function stabilizeDensity(options, defaultMode = 'compact') {
    const applyDefaultDensity = () => setDensity(options, defaultMode);
    requestAnimationFrame(() => {
      applyDefaultDensity();
      requestAnimationFrame(applyDefaultDensity);
    });
  }

  function bindDensityControls(options) {
    const { defaultMode = 'compact', densityButtonSelector = '.gt-view-btn[data-density]' } = options;
    document.querySelectorAll(densityButtonSelector).forEach(btn => {
      btn.addEventListener('click', () => setDensity(options, btn.dataset.density));
    });
    stabilizeDensity(options, defaultMode);
  }

  function bindDownloadControl(options) {
    const {
      gridApi,
      fileName = 'grid-export.csv',
      downloadButtonSelector = '.gt-view-btn[data-action="download"]'
    } = options;

    const downloadBtn = document.querySelector(downloadButtonSelector);
    if (!downloadBtn) return;

    downloadBtn.addEventListener('click', () => {
      if (!gridApi || typeof gridApi.exportDataAsCsv !== 'function') return;
      gridApi.exportDataAsCsv({ fileName });
    });
  }

  global.GridToolbar = {
    DEFAULT_DENSITY_PRESETS,
    setDensity,
    stabilizeDensity,
    bindDensityControls,
    bindDownloadControl
  };
})(window);
