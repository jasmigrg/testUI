class GtPageSelectHeader {
  init(params) {
    this.params = params;
    this.eGui = document.createElement('div');
    this.eGui.className = 'gt-header-select-all';

    this.checkbox = document.createElement('input');
    this.checkbox.type = 'checkbox';
    this.checkbox.className = 'gt-header-select-checkbox';
    this.checkbox.setAttribute('aria-label', 'Select visible rows');

    this.stopEvent = (e) => e.stopPropagation();
    this.onToggle = () => this.toggleVisibleRows();
    this.onSync = () => this.syncState();

    this.checkbox.addEventListener('click', this.stopEvent);
    this.checkbox.addEventListener('mousedown', this.stopEvent);
    this.checkbox.addEventListener('change', this.onToggle);

    this.params.api.addEventListener('selectionChanged', this.onSync);
    this.params.api.addEventListener('paginationChanged', this.onSync);
    this.params.api.addEventListener('filterChanged', this.onSync);
    this.params.api.addEventListener('sortChanged', this.onSync);

    this.eGui.appendChild(this.checkbox);
    this.syncState();
  }

  getGui() {
    return this.eGui;
  }

  toggleVisibleRows() {
    const shouldSelect = this.checkbox.checked;
    const pageSize = this.params.api.paginationGetPageSize?.() || 20;
    const currentPage = this.params.api.paginationGetCurrentPage?.() || 0;
    const from = currentPage * pageSize;
    const to = from + pageSize;

    for (let i = from; i < to; i++) {
      const rowNode = this.params.api.getDisplayedRowAtIndex(i);
      if (!rowNode) continue;
      if (rowNode.rowPinned || rowNode.group || rowNode.selectable === false) continue;
      rowNode.setSelected(shouldSelect);
    }

    this.syncState();
  }

  syncState() {
    if (!this.checkbox || !this.params?.api) return;

    const pageSize = this.params.api.paginationGetPageSize?.() || 20;
    const currentPage = this.params.api.paginationGetCurrentPage?.() || 0;
    const from = currentPage * pageSize;
    const to = from + pageSize;
    let selectableCount = 0;
    let selectedCount = 0;

    for (let i = from; i < to; i++) {
      const rowNode = this.params.api.getDisplayedRowAtIndex(i);
      if (!rowNode) continue;
      if (rowNode.rowPinned || rowNode.group || rowNode.selectable === false) continue;
      selectableCount += 1;
      if (rowNode.isSelected()) selectedCount += 1;
    }

    this.checkbox.indeterminate =
      selectableCount > 0 && selectedCount > 0 && selectedCount < selectableCount;
    this.checkbox.checked = selectableCount > 0 && selectedCount === selectableCount;
  }

  destroy() {
    if (!this.checkbox) return;
    this.checkbox.removeEventListener('click', this.stopEvent);
    this.checkbox.removeEventListener('mousedown', this.stopEvent);
    this.checkbox.removeEventListener('change', this.onToggle);

    if (this.params?.api) {
      this.params.api.removeEventListener('selectionChanged', this.onSync);
      this.params.api.removeEventListener('paginationChanged', this.onSync);
      this.params.api.removeEventListener('filterChanged', this.onSync);
      this.params.api.removeEventListener('sortChanged', this.onSync);
    }
  }
}

class KviMappingManualFloatingFilter {
  init(params) {
    this.params = params;
    this.currentValue = '';
    this.gui = document.createElement('div');
    this.gui.className = 'mfi-manual-floating-filter';

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.className = 'mfi-floating-filter-input';
    this.input.setAttribute(
      'aria-label',
      `${params.column.getColDef().headerName || params.column.getColId()} filter`
    );
    this.input.dataset.colId = params.column.getColId();

    this.onKeyDown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (this.params?.api && typeof this.params.api.applyPendingFloatingFilters === 'function') {
          this.params.api.applyPendingFloatingFilters();
        } else {
          this.apply();
        }
      }
    };

    this.input.addEventListener('keydown', this.onKeyDown);
    this.gui.appendChild(this.input);

    if (!params.api.__manualFloatingFilters) {
      params.api.__manualFloatingFilters = [];
    }
    params.api.__manualFloatingFilters.push(this);
  }

  getGui() {
    return this.gui;
  }

  onParentModelChanged(parentModel) {
    let next = '';
    if (parentModel && parentModel.rawInput != null) {
      next = String(parentModel.rawInput);
    } else if (parentModel && parentModel.dateFrom != null && this.isNumericOrDateFilter()) {
      next = this.rebuildOperatorInput(
        parentModel.type,
        this.normalizeDateValueForDisplay(parentModel.dateFrom)
      );
    } else if (parentModel && parentModel.filter != null && this.isNumericOrDateFilter()) {
      next = this.rebuildOperatorInput(parentModel.type, parentModel.filter);
    } else if (parentModel && parentModel.filter != null) {
      next = String(parentModel.filter);
    }
    this.currentValue = next;
    if (this.input && this.input.value !== next) {
      this.input.value = next;
    }
  }

  apply() {
    if (!this.input) return;
    const value = this.input.value.trim();
    this.currentValue = value;
    const fallbackOperator = this.isNumericOrDateFilter() ? 'equals' : 'contains';
    const parsedInput = KviMappingLogicPage.parseInlineFilterExpression(value, fallbackOperator);

    this.params.parentFilterInstance((instance) => {
      if (!instance) return;
      instance.onFloatingFilterChanged(parsedInput.type, parsedInput.value || null);
    });
  }

  isNumericOrDateFilter() {
    const filter = this.params?.column?.getColDef?.()?.filter;
    return filter === 'agNumberColumnFilter' || filter === 'agDateColumnFilter';
  }

  rebuildOperatorInput(type, value) {
    const prefixMap = {
      equals: '',
      notEqual: '!=',
      greaterThan: '>',
      lessThan: '<',
      greaterThanOrEqual: '>=',
      lessThanOrEqual: '<='
    };
    const prefix = prefixMap[String(type || '').trim()] ?? '';
    return `${prefix}${value == null ? '' : String(value)}`;
  }

  normalizeDateValueForDisplay(value) {
    const raw = String(value == null ? '' : value).trim();
    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/);
    if (!isoMatch) return raw;
    return `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1]}`;
  }

  destroy() {
    if (this.input && this.onKeyDown) {
      this.input.removeEventListener('keydown', this.onKeyDown);
    }
    const list = this.params?.api?.__manualFloatingFilters;
    if (Array.isArray(list)) {
      const idx = list.indexOf(this);
      if (idx >= 0) list.splice(idx, 1);
    }
  }
}

const KviMappingLogicPage = {
  activeTab: 'parameter',
  grids: {},
  toolbarScope: '.screen-page-shell',
  gridManagerBootstrapped: false,
  gridManagerInitScheduled: false,
  apiBaseUrl: '',

  init() {
    this.apiBaseUrl = (window.API_BASE_URL || '').replace(/\/$/, '');
    this.cacheDom();
    this.bindTabs();
    this.bindToolbarActions();
    this.initGridForTab('parameter');
    this.initGridForTab('output');
    this.syncTabUi();
    this.syncToolbarForTab();
    this.syncGridManager();
    this.applyActiveDensity();
  },

  cacheDom() {
    this.pageShell = document.querySelector('.screen-page-shell');
    this.contentCard = document.querySelector('.screen-page .content-card');
    this.tabButtons = Array.from(document.querySelectorAll('.screen-tab-btn[data-kvi-tab]'));
    this.tabPanels = Array.from(document.querySelectorAll('.screen-tab-panel[data-kvi-panel]'));
    this.emptyStates = {
      parameter: document.getElementById('kviMappingParameterEmptyState'),
      output: document.getElementById('kviMappingOutputEmptyState')
    };
  },

  bindTabs() {
    this.tabButtons.forEach((button) => {
      button.addEventListener('click', () => this.activateTab(button.getAttribute('data-kvi-tab')));
    });
  },

  bindToolbarActions() {
    const scope = this.pageShell;
    if (!scope) return;

    scope.querySelectorAll('.gt-action-btn[data-action="back"]').forEach((backBtn) => {
      backBtn.addEventListener('click', () => {
        this.showInfo('Main navigation for this screen is still being worked on.', 'warning');
      });
    });

    scope.querySelectorAll('.gt-action-btn[data-action="add"]').forEach((addBtn) => {
      addBtn.addEventListener('click', () => {
        const addUrl = String(window.KVI_MAPPING_ADD_PAGE_URL || '').trim();
        if (addUrl) {
          window.location.assign(addUrl);
          return;
        }
        this.showInfo('KVI Mapping add screen is not configured yet.', 'warning');
      });
    });

    scope.querySelectorAll('.gt-action-btn[data-action="favorite"]').forEach((favBtn) => {
      favBtn.addEventListener('click', () => {
        this.showInfo('Favorite action is not configured yet.', 'warning');
      });
    });

    scope.querySelectorAll('.gt-action-btn[data-action="refresh"]').forEach((refreshBtn) => {
      refreshBtn.addEventListener('click', () => {
        this.resetActiveGridState();
      });
    });

    scope.querySelectorAll('.gt-action-btn[data-action="execute"]').forEach((executeBtn) => {
      executeBtn.addEventListener('click', () => {
        const activeGrid = this.getActiveGrid();
        if (!activeGrid?.api) return;
        if (typeof activeGrid.api.applyPendingFloatingFilters === 'function') {
          activeGrid.api.applyPendingFloatingFilters();
        }
      });
    });

    scope.querySelectorAll('.gt-view-btn[data-density]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.applyDensity(btn.dataset.density);
      });
    });

    const downloadBtn = scope.querySelector('.gt-view-btn[data-action="download"]');
    downloadBtn?.addEventListener('click', async () => {
      await this.downloadActiveTabCsv();
    });
  },

  async downloadActiveTabCsv() {
    const exportConfigByTab = {
      parameter: {
        gridKey: 'parameter',
        endpoint: '/api/v1/kviMappingParameter/export-csv',
        fallbackFileName: 'kvi-mapping-parameter.csv',
        sortFieldMap: this.parameterSortFieldMap()
      },
      output: {
        gridKey: 'output',
        endpoint: '/api/v1/kviMappingOutput/export-csv',
        fallbackFileName: 'kvi-mapping-output.csv',
        sortFieldMap: this.outputSortFieldMap()
      }
    };

    const exportConfig = exportConfigByTab[this.activeTab];
    if (!exportConfig) return;

    try {
      const activeGrid = this.grids[exportConfig.gridKey];
      const queryParams = this.buildTabQueryParams(
        {
          sortFieldMap: exportConfig.sortFieldMap
        },
        {
          filterModel: typeof activeGrid?.api?.getFilterModel === 'function'
            ? activeGrid.api.getFilterModel()
            : {}
        },
        {
          includePaging: false,
          includeSort: false
        }
      );
      const response = await fetch(
        this.resolveApiUrl(`${exportConfig.endpoint}?${queryParams.toString()}`),
        {
          method: 'GET',
          headers: {
            Accept: '*/*'
          },
          credentials: 'same-origin'
        }
      );

      if (!response.ok) {
        throw new Error(await this.extractDownloadErrorMessage(response));
      }

      const blob = await response.blob();
      const fileName =
        this.getDownloadFileNameFromResponse(response) || exportConfig.fallbackFileName;
      this.triggerFileDownload(blob, fileName);
    } catch (error) {
      console.error('KVI mapping export failed:', error);
      this.showInfo(error?.message || 'Download failed.', 'error');
    }
  },

  buildTabQueryParams(tabConfig, params, options = {}) {
    const {
      includePaging = true,
      includeSort = true
    } = options;
    const pageSize = params?.endRow - params?.startRow;
    const pageNum = Math.floor((params?.startRow || 0) / (pageSize || 20));
    const urlParams = new URLSearchParams();

    if (includePaging) {
      urlParams.append('page', String(pageNum + 1));
      urlParams.append(tabConfig.pageSizeParam || 'pageSize', String(pageSize || 20));
    }

    if (includeSort && params?.sortModel && params.sortModel.length > 0) {
      const sortModel = params.sortModel[0];
      const sortField = (tabConfig.sortFieldMap && tabConfig.sortFieldMap[sortModel.colId]) || sortModel.colId;
      urlParams.append('sortBy', sortField);
      urlParams.append('sortDir', sortModel.sort);
    }

    if (params?.filterModel) {
      Object.keys(params.filterModel).forEach((field) => {
        const filter = params.filterModel[field];
        const filterField = (tabConfig.sortFieldMap && tabConfig.sortFieldMap[field]) || field;
        const sourceValue = filter?.rawInput ?? filter?.filter ?? filter?.dateFrom;
        if (sourceValue === undefined || sourceValue === null || String(sourceValue).trim() === '') return;

        const parsed = this.parseInlineFilterExpression(sourceValue, filter?.type);
        if (!parsed.value) return;

        const finalValue = (filterField === 'effective_date' || filterField === 'termination_date')
          ? this.toApiDate(parsed.value)
          : parsed.value;
        const apiOperator = this.mapOperatorToApi(parsed.type, filterField);

        urlParams.append(filterField, finalValue);
        if (apiOperator) {
          urlParams.append(`${filterField}_op`, apiOperator);
        }
      });
    }

    return urlParams;
  },

  resolveApiUrl(path) {
    const normalizedPath = String(path || '').trim();
    if (!normalizedPath) return this.apiBaseUrl;
    if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
    if (!this.apiBaseUrl) return normalizedPath;
    return `${this.apiBaseUrl}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`;
  },

  async extractDownloadErrorMessage(response) {
    if (!response) return 'Download failed.';

    try {
      const contentType = response.headers?.get?.('content-type') || '';
      if (contentType.includes('application/json')) {
        const payload = await response.json();
        return payload?.message || payload?.error || 'Download failed.';
      }

      const text = await response.text();
      return text || 'Download failed.';
    } catch (error) {
      return 'Download failed.';
    }
  },

  getDownloadFileNameFromResponse(response) {
    const disposition = response?.headers?.get?.('content-disposition') || '';
    if (!disposition) return '';

    const utfMatch = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
    if (utfMatch?.[1]) {
      try {
        return decodeURIComponent(utfMatch[1].trim());
      } catch (error) {
        return utfMatch[1].trim();
      }
    }

    const plainMatch = disposition.match(/filename\s*=\s*"?([^\";]+)"?/i);
    return plainMatch?.[1]?.trim() || '';
  },

  triggerFileDownload(blob, fileName) {
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName || 'download.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
  },

  showInfo(message, type = 'success') {
    if (!window.PageToast?.show) return;

    const container = this.ensureToastContainer();
    if (!container) return;

    const normalizedType = ['success', 'error', 'warning'].includes(type) ? type : 'success';
    const title = normalizedType === 'error'
      ? 'Action required'
      : normalizedType === 'warning'
        ? 'Heads up'
        : 'Success';
    const subtitle = String(message || '').trim();

    window.PageToast.show({
      container,
      type: normalizedType,
      title,
      subtitle,
      icon: normalizedType === 'error' ? '!' : normalizedType === 'warning' ? 'i' : '✓',
      autoHideMs: 2400
    });
  },

  ensureToastContainer() {
    let container = document.getElementById('kviMappingMainPageToastLayer');
    if (container) return container;

    container = document.createElement('div');
    container.id = 'kviMappingMainPageToastLayer';
    container.className = 'app-page-toast-layer';
    document.body.appendChild(container);
    return container;
  },

  showFilterValidationMessage(message) {
    this.showInfo(String(message || '').trim(), 'error');
  },

  activateTab(tabKey) {
    if (!tabKey || tabKey === this.activeTab) return;

    this.activeTab = tabKey;
    this.syncTabUi();
    this.syncToolbarForTab();
    this.initGridForTab(tabKey);
    this.syncGridManager();
    this.applyActiveDensity();
    this.refreshActiveGridLayout();
  },

  syncTabUi() {
    this.tabButtons.forEach((button) => {
      const isActive = button.getAttribute('data-kvi-tab') === this.activeTab;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', String(isActive));
      button.tabIndex = isActive ? 0 : -1;
    });

    this.tabPanels.forEach((panel) => {
      const isActive = panel.getAttribute('data-kvi-panel') === this.activeTab;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
      panel.style.display = isActive ? 'flex' : 'none';
    });
  },

  getActiveGrid() {
    return this.grids[this.activeTab] || null;
  },

  setGridEmptyState(tabKey, mode = 'hidden') {
    const emptyState = this.emptyStates?.[tabKey];
    if (!emptyState) return;
    emptyState.hidden = mode !== 'empty';
  },

  syncToolbarForTab() {
    const scope = this.pageShell;
    if (!scope) return;

    scope.querySelectorAll('.kvi-tab-action-toolbar[data-kvi-actions]').forEach((toolbar) => {
      const isActive = toolbar.getAttribute('data-kvi-actions') === this.activeTab;
      toolbar.hidden = !isActive;
      toolbar.style.display = isActive ? 'flex' : 'none';
      toolbar.setAttribute('aria-hidden', String(!isActive));
    });
  },

  getSelectedDensityMode() {
    const activeBtn = document.querySelector(`${this.toolbarScope} .gt-view-btn[data-density].is-active`);
    return activeBtn?.dataset?.density || 'compact';
  },

  applyDensity(mode) {
    const activeGrid = this.getActiveGrid();
    if (!(window.GridToolbar && activeGrid?.api && activeGrid?.element)) return;

    window.GridToolbar.setDensity(
      {
        gridApi: activeGrid.api,
        gridElement: activeGrid.element,
        densityClassPrefix: 'grid-density',
        densityButtonSelector: `${this.toolbarScope} .gt-view-btn[data-density]`
      },
      mode || this.getSelectedDensityMode()
    );
  },

  applyActiveDensity() {
    const mode = this.getSelectedDensityMode();
    requestAnimationFrame(() => {
      this.applyDensity(mode);
      setTimeout(() => this.applyDensity(mode), 120);
    });
  },

  refreshActiveGridLayout() {
    const activeGrid = this.getActiveGrid();
    if (!activeGrid?.api || !activeGrid?.element) return;

    requestAnimationFrame(() => {
      if (typeof activeGrid.api.refreshHeader === 'function') {
        activeGrid.api.refreshHeader();
      }
      if (typeof activeGrid.api.resetRowHeights === 'function') {
        activeGrid.api.resetRowHeights();
      }
      if (typeof DynamicGrid?.scheduleSizeToFit === 'function') {
        DynamicGrid.scheduleSizeToFit(activeGrid.api, activeGrid.element);
      } else if (typeof activeGrid.api.sizeColumnsToFit === 'function') {
        try {
          activeGrid.api.sizeColumnsToFit();
        } catch (error) {
          console.warn('sizeColumnsToFit skipped on tab switch:', error);
        }
      }
    });
  },

  resetActiveGridState() {
    const activeGrid = this.getActiveGrid();
    if (!activeGrid?.api) return;

    const currentFilterModel =
      typeof activeGrid.api.getFilterModel === 'function' ? activeGrid.api.getFilterModel() || {} : {};
    const hasFilters = Object.keys(currentFilterModel).length > 0;
    const currentSortModel =
      typeof activeGrid.api.getSortModel === 'function' ? activeGrid.api.getSortModel() || [] : [];
    const hasSort = Array.isArray(currentSortModel) && currentSortModel.length > 0;
    const currentPage =
      typeof activeGrid.api.paginationGetCurrentPage === 'function'
        ? activeGrid.api.paginationGetCurrentPage()
        : 0;

    if (hasFilters && typeof activeGrid.api.setFilterModel === 'function') {
      activeGrid.api.setFilterModel(null);
    }
    if (!hasFilters && hasSort && typeof activeGrid.api.setSortModel === 'function') {
      activeGrid.api.setSortModel(null);
    }
    if (!hasFilters && !hasSort && currentPage > 0 && typeof activeGrid.api.paginationGoToFirstPage === 'function') {
      activeGrid.api.paginationGoToFirstPage();
    }
    if (typeof activeGrid.api.deselectAll === 'function') {
      activeGrid.api.deselectAll();
    }
    this.refreshActiveGridLayout();
  },

  initGridForTab(tabKey) {
    if (this.grids[tabKey]?.api) return;

    const configByTab = {
      parameter: {
        gridElementId: 'kviMappingParameterGrid',
        columns: this.parameterColumns(),
        apiEndpoint: `${this.apiBaseUrl}/api/v1/kviMappingParameter`,
        pageSizeParam: 'pageSize',
        sortFieldMap: this.parameterSortFieldMap(),
        dataTransformer: (row) => this.transformParameterRow(row)
      },
      output: {
        gridElementId: 'kviMappingOutputGrid',
        columns: this.outputColumns(),
        apiEndpoint: `${this.apiBaseUrl}/api/v1/kviMappingOutput`,
        pageSizeParam: 'pageSize',
        sortFieldMap: this.outputSortFieldMap(),
        dataTransformer: (row) => this.transformOutputRow(row)
      }
    };

    const tabConfig = configByTab[tabKey];
    if (!tabConfig) return;

    const gridApi = DynamicGrid.createGrid({
      gridElementId: tabConfig.gridElementId,
      pageSize: 20,
      paginationType: 'server',
      useSpringPagination: true,
      floatingFilter: true,
      manualFilterApply: true,
      apiEndpoint: tabConfig.apiEndpoint,
      dataTransformer: tabConfig.dataTransformer,
      gridOptions: {
        onGridReady: (params) => {
          const datasource = this.buildKviDatasource(tabConfig);
          params.api.setGridOption('datasource', datasource);
        },
        rowSelection: 'multiple',
        suppressRowClickSelection: true,
        icons: {
          sortUnSort:
            '<span class="gt-sort-icon gt-sort-icon--none" aria-hidden="true"><svg viewBox="0 0 8 12" focusable="false"><path d="M4 1L7 4H1L4 1Z"></path><path d="M4 11L1 8H7L4 11Z"></path></svg></span>',
          sortAscending:
            '<span class="gt-sort-icon gt-sort-icon--asc" aria-hidden="true"><svg viewBox="0 0 8 12" focusable="false"><path d="M4 1L7 4H1L4 1Z"></path></svg></span>',
          sortDescending:
            '<span class="gt-sort-icon gt-sort-icon--desc" aria-hidden="true"><svg viewBox="0 0 8 12" focusable="false"><path d="M4 11L1 8H7L4 11Z"></path></svg></span>'
        },
        components: {
          gtPageSelectHeader: GtPageSelectHeader,
          manualApplyFloatingFilter: KviMappingManualFloatingFilter
        },
        localeText: {
          equals: 'Equals',
          notEqual: 'Does not equal',
          greaterThan: 'Greater than',
          lessThan: 'Less than',
          after: 'Greater than',
          before: 'Less than',
          greaterThanOrEqual: 'Greater than or equal',
          lessThanOrEqual: 'Less than or equal',
          contains: 'Contains',
          notContains: 'Does not contain',
          startsWith: 'Begins with',
          endsWith: 'Ends with'
        },
        defaultColDef: {
          sortable: true,
          unSortIcon: true,
          wrapHeaderText: true,
          autoHeaderHeight: true,
          filterParams: {
            buttons: ['apply', 'reset'],
            closeOnApply: true,
            maxNumConditions: 1,
            numAlwaysVisibleConditions: 1
          }
        }
      },
      columns: tabConfig.columns
    });

    const gridElement = document.getElementById(tabConfig.gridElementId);
    this.grids[tabKey] = {
      api: gridApi,
      element: gridElement,
      gridElementId: tabConfig.gridElementId
    };

    if (gridApi) {
      gridApi.applyPendingFloatingFilters = () => this.applyPendingFilters();
    }

    if (
      !this.gridManagerBootstrapped &&
      !this.gridManagerInitScheduled &&
      gridApi &&
      typeof window.GridManager !== 'undefined'
    ) {
      this.gridManagerInitScheduled = true;
      setTimeout(() => {
        try {
          if (this.gridManagerBootstrapped || typeof window.GridManager === 'undefined') return;
          const activeGrid = this.getActiveGrid();
          if (!activeGrid?.api || typeof window.GridManager === 'undefined') return;
          window.GridManager.init(activeGrid.api, activeGrid.gridElementId);
          this.gridManagerBootstrapped = true;
          this.syncGridManager();
        } finally {
          this.gridManagerInitScheduled = false;
        }
      }, 300);
    }
  },

  syncGridManager() {
    if (!this.gridManagerBootstrapped || typeof window.GridManager === 'undefined') return;

    const activeGrid = this.getActiveGrid();
    const instance = window.GridManager.currentInstance;
    if (!activeGrid?.api || !instance) return;

    instance.gridApi = activeGrid.api;
    instance.gridId = activeGrid.gridElementId;
    instance.apiConfig.screenId = `id_${activeGrid.gridElementId}`;
    instance.currentPreferenceKey = 'default';
    instance.currentPreferenceId = null;
    instance.savedPreferences = {
      default: {
        name: 'Default Preference',
        visibleColumns: []
      }
    };

    instance.populateColumnsMenu();
    instance.initializeDefaultPreference();

    if (typeof instance.fetchPreferences === 'function') {
      Promise.resolve(instance.fetchPreferences())
        .then(() => {
          if (typeof instance.loadPreferencesList === 'function') {
            instance.loadPreferencesList();
          }
        })
        .catch((error) => {
          console.warn('GridManager preference sync skipped:', error);
        });
    }
  },

  parameterColumns() {
    return [
      { field: 'effectiveDate', headerName: 'Effective Date', minWidth: 150 },
      { field: 'terminationDate', headerName: 'Termination Date', minWidth: 170 },
      { field: 'revenuePenetrationPctl', headerName: 'Revenue Penetration PCTL', minWidth: 230 },
      { field: 'prcaPenetrationPctl', headerName: 'PRCA Penetration PCTL', minWidth: 210 },
      { field: 'revenuePenetrationAdj', headerName: 'Revenue Penetration ADJ', minWidth: 220 },
      { field: 'prcaPenetrationAdj', headerName: 'PRCA Penetration ADJ', minWidth: 200 }
    ].map((column) => this.buildFilterableColumn(column));
  },

  outputColumns() {
    return [
      { field: 'itemNum', headerName: 'Item Num', minWidth: 130 },
      { field: 'customerCluster', headerName: 'Customer Cluster', minWidth: 180 },
      { field: 'effectiveDate', headerName: 'Effective Date', minWidth: 150 },
      { field: 'terminationDate', headerName: 'Termination Date', minWidth: 170 },
      { field: 'itemSegmentation', headerName: 'Item Segmentation', minWidth: 190 }
    ].map((column) => this.buildFilterableColumn(column));
  },

  parameterSortFieldMap() {
    return {
      effectiveDate: 'effective_date',
      terminationDate: 'termination_date',
      revenuePenetrationPctl: 'revenue_penetration_pctl',
      prcaPenetrationPctl: 'prca_penetration_pctl',
      revenuePenetrationAdj: 'revenue_penetration_adj',
      prcaPenetrationAdj: 'prca_penetration_adj'
    };
  },

  outputSortFieldMap() {
    return {
      itemNum: 'item_num',
      customerCluster: 'customer_cluster',
      effectiveDate: 'effective_date',
      terminationDate: 'termination_date',
      itemSegmentation: 'item_segmentation'
    };
  },

  formatIsoDate(value) {
    if (!value || typeof value !== 'string') return value;
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return value;
    return `${match[2]}/${match[3]}/${match[1]}`;
  },

  formatDateValue(value) {
    if (!value) return value;
    if (Array.isArray(value) && value.length >= 3) {
      const [year, month, day] = value;
      return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
    }
    return this.formatIsoDate(value);
  },

  toApiDate(value) {
    if (!value) return value;
    const trimmed = String(value).trim();
    const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T].*)?$/);
    if (iso) {
      return `${iso[1]}-${iso[2]}-${iso[3]}`;
    }
    const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (us) {
      const month = us[1].padStart(2, '0');
      const day = us[2].padStart(2, '0');
      return `${us[3]}-${month}-${day}`;
    }
    return trimmed;
  },

  applyPendingFilters() {
    const activeGrid = this.getActiveGrid();
    const gridApi = activeGrid?.api;
    if (!gridApi || typeof gridApi.getFilterModel !== 'function' || typeof gridApi.setFilterModel !== 'function') {
      return;
    }

    const nextModel = { ...(gridApi.getFilterModel() || {}) };
    const pendingFilters = Array.isArray(gridApi.__manualFloatingFilters)
      ? [...gridApi.__manualFloatingFilters]
      : [];

    for (const floatingFilter of pendingFilters) {
      const field = String(
        floatingFilter?.input?.dataset?.colId ||
          floatingFilter?.params?.column?.getColId?.() ||
          ''
      ).trim();

      if (!field || field === 'select') continue;

      const rawInput = String(floatingFilter?.input?.value || '').trim();
      const builtModel = this.buildManualFilterModel(field, rawInput);

      if (builtModel?.isInvalid) {
        this.showFilterValidationMessage(`${field}: ${builtModel.invalidReason}`);
        return;
      }

      if (!builtModel) {
        delete nextModel[field];
        continue;
      }

      nextModel[field] = builtModel;
    }

    const previousSerialized = JSON.stringify(gridApi.getFilterModel() || {});
    const nextSerialized = JSON.stringify(nextModel);

    if (previousSerialized === nextSerialized) {
      if (typeof gridApi.refreshInfiniteCache === 'function') {
        gridApi.refreshInfiniteCache();
      }
      return;
    }

    gridApi.setFilterModel(nextModel);
  },

  parseInlineFilterExpression(rawValue, defaultType) {
    const raw = String(rawValue ?? '').trim();
    if (!raw) return { value: '', type: defaultType || 'contains' };

    const operators = ['!=', '<>', '>=', '<=', '>', '<', '='];
    const token = operators.find((op) => raw.startsWith(op));
    if (!token) {
      return { value: raw, type: defaultType || 'contains' };
    }

    const value = raw.slice(token.length).trim();
    let type = defaultType || 'contains';
    if (token === '=') type = 'equals';
    else if (token === '>') type = 'greaterThan';
    else if (token === '>=') type = 'greaterThanOrEqual';
    else if (token === '<') type = 'lessThan';
    else if (token === '<=') type = 'lessThanOrEqual';
    else if (token === '!=' || token === '<>') type = 'notEqual';

    return { value, type };
  },

  buildManualFilterModel(field, rawInput) {
    if (!rawInput) return null;

    const kind = this.getFieldFilterKind(field);
    const parsed = this.parseInlineFilterExpression(rawInput, kind === 'text' ? 'contains' : 'equals');
    const value = String(parsed.value || '').trim();

    if (!value) {
      return {
        isInvalid: true,
        invalidReason: 'Enter a value after the operator.'
      };
    }

    if (
      kind === 'text' &&
      ['greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual'].includes(parsed.type)
    ) {
      return {
        isInvalid: true,
        invalidReason: 'Text filters support contains, =, and != only.'
      };
    }

    if (kind === 'date') {
      const apiDate = this.toApiDate(value);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(apiDate)) {
        return {
          isInvalid: true,
          invalidReason: 'Enter a valid date in MM/DD/YYYY format.'
        };
      }
      return {
        filterType: 'date',
        type: parsed.type || 'equals',
        dateFrom: apiDate,
        dateTo: null,
        rawInput
      };
    }

    if (kind === 'number') {
      const normalizedNumber = value.replace(/[%,$\s]/g, '').replace(/,/g, '');
      if (normalizedNumber === '' || Number.isNaN(Number(normalizedNumber))) {
        return {
          isInvalid: true,
          invalidReason: 'Enter a valid number.'
        };
      }
      return {
        filterType: 'number',
        type: parsed.type || 'equals',
        filter: normalizedNumber,
        rawInput
      };
    }

    return {
      filterType: 'text',
      type: parsed.type || 'contains',
      filter: value,
      rawInput
    };
  },

  mapOperatorToApi(operator, field) {
    const op = String(operator || '').trim();
    if (!op) return null;

    if (op === 'equals') return 'eq';
    if (op === 'greaterThan') return 'gt';
    if (op === 'greaterThanOrEqual') return 'gte';
    if (op === 'lessThan') return 'ls';
    if (op === 'lessThanOrEqual') return 'lte';
    if (op === 'contains') return 'like';
    if (op === 'startsWith' || op === 'endsWith') return 'like';
    if (op === 'notEqual') return 'neq';
    if (op === 'blank' || op === 'notBlank') return null;

    if (field === 'effective_date' || field === 'termination_date') return 'eq';
    return 'like';
  },

  transformParameterRow(row) {
    if (!row || typeof row !== 'object') return row;
    return {
      effectiveDate: this.formatDateValue(row.effectiveDate || row.effective_date),
      terminationDate: this.formatDateValue(row.terminationDate || row.termination_date),
      revenuePenetrationPctl: row.revenuePenetrationPctl ?? row.revenue_penetration_pctl,
      prcaPenetrationPctl: row.prcaPenetrationPctl ?? row.prca_penetration_pctl,
      revenuePenetrationAdj: row.revenuePenetrationAdj ?? row.revenue_penetration_adj,
      prcaPenetrationAdj: row.prcaPenetrationAdj ?? row.prca_penetration_adj
    };
  },

  transformOutputRow(row) {
    if (!row || typeof row !== 'object') return row;
    return {
      itemNum: row.itemNum ?? row.item_num,
      customerCluster: row.customerCluster ?? row.customer_cluster,
      effectiveDate: this.formatDateValue(row.effectiveDate || row.effective_date),
      terminationDate: this.formatDateValue(row.terminationDate || row.termination_date),
      itemSegmentation: row.itemSegmentation ?? row.item_segmentation
    };
  },

  getFieldFilterKind(field) {
    const normalizedField = String(field || '').trim();

    if (['effectiveDate', 'terminationDate'].includes(normalizedField)) {
      return 'date';
    }

    if (
      [
        'itemNum',
        'revenuePenetrationPctl',
        'prcaPenetrationPctl',
        'revenuePenetrationAdj',
        'prcaPenetrationAdj'
      ].includes(normalizedField)
    ) {
      return 'number';
    }

    return 'text';
  },

  buildFilterableColumn(column) {
    const field = String(column?.field || '').trim();
    if (!field) return column;

    const kind = this.getFieldFilterKind(field);

    if (kind === 'date') {
      return {
        ...column,
        filter: 'agDateColumnFilter',
        filterParams: {
          buttons: ['apply', 'reset'],
          closeOnApply: true,
          maxNumConditions: 1,
          numAlwaysVisibleConditions: 1,
          filterOptions: [
            'equals',
            'notEqual',
            'greaterThan',
            'lessThan',
            'greaterThanOrEqual',
            'lessThanOrEqual'
          ]
        }
      };
    }

    if (kind === 'number') {
      return {
        ...column,
        filter: 'agNumberColumnFilter',
        filterParams: {
          buttons: ['apply', 'reset'],
          closeOnApply: true,
          maxNumConditions: 1,
          numAlwaysVisibleConditions: 1,
          filterOptions: [
            'equals',
            'notEqual',
            'greaterThan',
            'lessThan',
            'greaterThanOrEqual',
            'lessThanOrEqual'
          ]
        }
      };
    }

    return {
      ...column,
      filter: 'agTextColumnFilter',
      filterParams: {
        buttons: ['apply', 'reset'],
        closeOnApply: true,
        maxNumConditions: 1,
        numAlwaysVisibleConditions: 1,
        filterOptions: ['contains', 'equals', 'notEqual']
      }
    };
  },

  buildKviDatasource(tabConfig) {
    return {
      rowCount: null,
      getRows: (params) => {
        const pageSize = params.endRow - params.startRow;
        const urlParams = this.buildTabQueryParams(tabConfig, params, {
          includePaging: true,
          includeSort: true
        });
        const apiUrl = `${tabConfig.apiEndpoint}?${urlParams.toString()}`;

        fetch(apiUrl)
          .then((response) => response.json())
          .then((responseBody) => {
            let rows = this.extractRowsFromResponse(responseBody);
            if (tabConfig.dataTransformer) {
              rows = rows.map(tabConfig.dataTransformer);
            }

            const total = this.extractTotalFromResponse(responseBody);
            const lastRow = Number.isFinite(total)
              ? total
              : (rows.length < pageSize ? params.startRow + rows.length : -1);

            params.successCallback(rows, lastRow);
            this.syncNoRowsOverlay(
              params.api,
              tabConfig.gridElementId === 'kviMappingParameterGrid' ? 'parameter' : 'output',
              rows.length
            );
            requestAnimationFrame(() => {
              this.setGridEmptyState(
                tabConfig.gridElementId === 'kviMappingParameterGrid' ? 'parameter' : 'output',
                params.startRow === 0 && rows.length === 0 ? 'empty' : 'hidden'
              );
            });
          })
          .catch((error) => {
            console.error('KVI mapping datasource fetch failed:', error);
            params.failCallback();
            this.syncNoRowsOverlay(
              params.api,
              tabConfig.gridElementId === 'kviMappingParameterGrid' ? 'parameter' : 'output',
              0
            );
            requestAnimationFrame(() => {
              this.setGridEmptyState(
                tabConfig.gridElementId === 'kviMappingParameterGrid' ? 'parameter' : 'output',
                'error'
              );
            });
          });
      }
    };
  },

  syncNoRowsOverlay(gridApi, tabKey, rowCount) {
    this.setGridEmptyState(tabKey, rowCount > 0 ? 'hidden' : 'empty');
    if (!gridApi) return;
    if (rowCount > 0) {
      if (typeof gridApi.hideOverlay === 'function') gridApi.hideOverlay();
      return;
    }
    if (typeof gridApi.showNoRowsOverlay === 'function') {
      gridApi.showNoRowsOverlay();
    }
  },

  extractRowsFromResponse(responseBody) {
    if (!responseBody) return [];
    if (Array.isArray(responseBody)) return responseBody;
    if (Array.isArray(responseBody.data)) return responseBody.data;
    if (responseBody.data && Array.isArray(responseBody.data.content)) return responseBody.data.content;
    if (Array.isArray(responseBody.content)) return responseBody.content;
    return [];
  },

  extractTotalFromResponse(responseBody) {
    if (!responseBody || typeof responseBody !== 'object') return null;
    if (typeof responseBody.total === 'number') return responseBody.total;
    if (typeof responseBody.totalElements === 'number') return responseBody.totalElements;
    if (responseBody.data && typeof responseBody.data.total === 'number') return responseBody.data.total;
    if (responseBody.data && typeof responseBody.data.totalElements === 'number') {
      return responseBody.data.totalElements;
    }
    return null;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  KviMappingLogicPage.init();
});
