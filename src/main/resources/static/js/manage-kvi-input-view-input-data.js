class KviInputManualFloatingFilter {
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
    const parsedInput = KviInputPage.parseInlineFilterExpression(value, fallbackOperator);

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

const KviInputPage = {
  activeTab: 'control',
  grids: {},
  toolbarScope: '.screen-page-shell',
  gridManagerBootstrapped: false,
  gridManagerInitScheduled: false,
  apiBaseUrl: '',

  init() {
    this.apiBaseUrl = (window.API_BASE_URL || '').replace(/\/$/, '');
    this.activeTab = this.resolveInitialTab();
    this.cacheDom();
    this.bindTabs();
    this.bindToolbarActions();
    this.initGridForTab(this.activeTab);
    this.syncTabUi();
    this.syncToolbarForTab();
    this.syncGridManager();
    this.applyActiveDensity();
  },

  cacheDom() {
    this.pageShell = document.querySelector('.screen-page-shell');
    this.tabButtons = Array.from(document.querySelectorAll('.screen-tab-btn[data-kvi-tab]'));
    this.tabPanels = Array.from(document.querySelectorAll('.screen-tab-panel[data-kvi-panel]'));
    this.emptyStates = {
      control: document.getElementById('kviInputControlEmptyState'),
      data: document.getElementById('kviInputDataEmptyState'),
      exclusion: document.getElementById('kviInputExclusionEmptyState')
    };
  },

  resolveInitialTab() {
    const params = new URLSearchParams(window.location.search || '');
    const requestedTab = String(params.get('tab') || '').trim().toLowerCase();
    if (requestedTab === 'control' || requestedTab === 'data' || requestedTab === 'exclusion') {
      return requestedTab;
    }
    return 'control';
  },

  bindTabs() {
    this.tabButtons.forEach((button) => {
      button.addEventListener('click', () => this.activateTab(button.getAttribute('data-kvi-tab')));
    });
  },

  bindToolbarActions() {
    const scope = this.pageShell;
    if (!scope) return;

    scope.querySelectorAll('.gt-action-btn[data-action="back"]').forEach((button) => {
      button.addEventListener('click', () => {
        this.showInfo('Main navigation for this screen is still being worked on.', 'warning');
      });
    });

    scope.querySelectorAll('.gt-action-btn[data-action="favorite"]').forEach((button) => {
      button.addEventListener('click', () => {
        this.showInfo('Favorite action is not configured yet.', 'warning');
      });
    });

    scope.querySelectorAll('.gt-action-btn[data-action="add"]').forEach((button) => {
      button.addEventListener('click', () => {
        const addUrl = String(window.KVI_INPUT_EXCLUSION_ADD_PAGE_URL || '').trim();
        if (addUrl) {
          window.location.assign(addUrl);
          return;
        }
        this.showInfo('KVI Input Exclusion add screen is not configured yet.', 'warning');
      });
    });

    scope.querySelectorAll('.gt-action-btn[data-action="refresh"]').forEach((button) => {
      button.addEventListener('click', () => this.resetActiveGridState());
    });

    scope.querySelectorAll('.gt-action-btn[data-action="execute"]').forEach((button) => {
      button.addEventListener('click', () => {
        const activeGrid = this.getActiveGrid();
        if (!activeGrid?.api) return;
        if (typeof activeGrid.api.applyPendingFloatingFilters === 'function') {
          activeGrid.api.applyPendingFloatingFilters();
        }
      });
    });

    scope.querySelectorAll('.gt-view-btn[data-density]').forEach((button) => {
      button.addEventListener('click', () => this.applyDensity(button.dataset.density));
    });

    const downloadBtn = scope.querySelector('.gt-view-btn[data-action="download"]');
    downloadBtn?.addEventListener('click', async () => {
      await this.downloadActiveTabCsv();
    });
  },

  async downloadActiveTabCsv() {
    const exportConfigByTab = {
      control: {
        endpoint: '/api/v1/kviInputControl/export-csv',
        fallbackFileName: 'kvi-input-control.csv',
        sortFieldMap: this.controlSortFieldMap(),
        dateFields: new Set(['kviInputUpdateDate', 'kvi_input_update_date'])
      },
      data: {
        endpoint: '/api/v1/kviInputData/export-csv',
        fallbackFileName: 'kvi-input-data.csv',
        sortFieldMap: this.dataSortFieldMap(),
        dateFields: new Set(['effectiveDate', 'terminationDate', 'effective_date', 'termination_date'])
      },
      exclusion: {
        endpoint: '/api/v1/kviInputExclusion/export-csv',
        fallbackFileName: 'kvi-input-exclusion.csv',
        sortFieldMap: this.exclusionSortFieldMap(),
        dateFields: new Set(['effectiveDate', 'terminationDate', 'effective_date', 'termination_date'])
      }
    };

    const exportConfig = exportConfigByTab[this.activeTab];
    if (!exportConfig) return;

    try {
      const activeGrid = this.getActiveGrid();
      const queryParams = this.buildTabQueryParams(
        {
          sortFieldMap: exportConfig.sortFieldMap,
          dateFields: exportConfig.dateFields
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
      console.error('KVI input export failed:', error);
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
      urlParams.append('page', String(pageNum));
      urlParams.append(tabConfig.pageSizeParam || 'size', String(pageSize || 20));
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

        const finalValue = tabConfig.dateFields.has(field) || tabConfig.dateFields.has(filterField)
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

  getActiveGrid() {
    return this.grids[this.activeTab] || null;
  },

  setGridEmptyState(tabKey, mode = 'hidden') {
    const emptyState = this.emptyStates?.[tabKey];
    if (!emptyState) return;
    emptyState.hidden = mode !== 'empty';
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
        densityClassPrefix: 'kvi-density',
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
      control: {
        gridElementId: 'kviInputControlGrid',
        columns: this.controlColumns(),
        apiEndpoint: `${this.apiBaseUrl}/api/v1/kviInputControl`,
        pageSizeParam: 'size',
        sortFieldMap: this.controlSortFieldMap(),
        dateFields: new Set(['kviInputUpdateDate']),
        dataTransformer: (row) => this.transformControlRow(row)
      },
      data: {
        gridElementId: 'kviInputDataGrid',
        columns: this.dataColumns(),
        apiEndpoint: `${this.apiBaseUrl}/api/v1/kviInputData`,
        pageSizeParam: 'size',
        sortFieldMap: this.dataSortFieldMap(),
        dateFields: new Set(['gmInputUpdateDate', 'orderDate']),
        dataTransformer: (row) => this.transformDataRow(row)
      },
      exclusion: {
        gridElementId: 'kviInputExclusionGrid',
        columns: this.exclusionColumns(),
        apiEndpoint: `${this.apiBaseUrl}/api/v1/kviInputExclusion`,
        pageSizeParam: 'size',
        sortFieldMap: this.exclusionSortFieldMap(),
        dateFields: new Set(),
        dataTransformer: (row) => this.transformExclusionRow(row)
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
          const datasource = this.buildDatasource(tabConfig);
          params.api.setGridOption('datasource', datasource);
        },
        onCellValueChanged: (event) => {
          this.handleCellValueChanged(tabKey, event);
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
          manualApplyFloatingFilter: KviInputManualFloatingFilter
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

    if (!this.gridManagerBootstrapped && !this.gridManagerInitScheduled && gridApi && window.GridManager) {
      this.gridManagerInitScheduled = true;
      setTimeout(() => {
        try {
          if (this.gridManagerBootstrapped || !window.GridManager) return;
          const activeGrid = this.getActiveGrid();
          if (!activeGrid?.api) return;
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
    if (!this.gridManagerBootstrapped || !window.GridManager) return;

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

  getDownloadFileName() {
    if (this.activeTab === 'control') return 'kvi-input-control.csv';
    if (this.activeTab === 'data') return 'kvi-input-data.csv';
    return 'kvi-input-exclusion.csv';
  },

  controlColumns() {
    return [
      { field: 'kviInputUpdateDate', headerName: 'KVI Input Update Date', minWidth: 210, editable: false },
      {
        field: 'kviInputIncludeMonth',
        headerName: 'KVI Input Include Month',
        minWidth: 210,
        editable: true,
        cellClassRules: {
          'kvi-input-cell-error': (params) => Boolean(params?.data?._controlMonthInvalid)
        }
      }
    ].map((column) => this.buildFilterableColumn(column));
  },

  dataColumns() {
    return [
      { field: 'gmInputUpdateDate', headerName: 'GM Input Update Date', minWidth: 200 },
      { field: 'orderCompany', headerName: 'Order Company', minWidth: 150 },
      { field: 'orderNumber', headerName: 'Order Number', minWidth: 150 },
      { field: 'orderType', headerName: 'Order Type', minWidth: 130 },
      { field: 'lineNumber', headerName: 'Line Number', minWidth: 130 },
      { field: 'lineType', headerName: 'Line Type', minWidth: 120 },
      { field: 'lastStatus', headerName: 'Last Status', minWidth: 130 },
      { field: 'nextStatus', headerName: 'Next Status', minWidth: 130 },
      { field: 'shipTo', headerName: 'Ship To', minWidth: 130 },
      { field: 'billTo', headerName: 'Bill To', minWidth: 130 },
      { field: 'orderDate', headerName: 'Order Date', minWidth: 150 },
      { field: 'prcaNum', headerName: 'PRCA Num', minWidth: 130 },
      { field: 'organization', headerName: 'Organisation', minWidth: 140 },
      { field: 'customerSegment', headerName: 'Customer Segment', minWidth: 170 },
      { field: 'customerMarket', headerName: 'Customer Market', minWidth: 170 },
      { field: 'customer340bFlag', headerName: 'Customer 340B Flag', minWidth: 190 },
      { field: 'patientFlag', headerName: 'Patient Flag', minWidth: 140 },
      { field: 'itemNumber', headerName: 'Item Number', minWidth: 140 },
      { field: 'itemFamily', headerName: 'Item Family', minWidth: 170 },
      { field: 'itemCategory', headerName: 'Item Category', minWidth: 170 },
      { field: 'itemGroup', headerName: 'Item Group', minWidth: 180 },
      { field: 'itemSubCategory', headerName: 'Item Sub Category', minWidth: 210 },
      { field: 'itemDescription', headerName: 'Item Description', minWidth: 260 },
      { field: 'itemVendorFamily', headerName: 'Item Vendor Family', minWidth: 180 },
      { field: 'itemDiscontinuedFlag', headerName: 'Item Discontinued Flag', minWidth: 200 },
      { field: 'itemSequesteredCoramApriaFlag', headerName: 'Item Sequestered Coram Apria Flag', minWidth: 260 },
      { field: 'itemUsedBiomedFlag', headerName: 'Item Used Biomed Flag', minWidth: 190 },
      { field: 'likeItemGroup', headerName: 'Like Item Group', minWidth: 180 },
      { field: 'histExtendedPrice', headerName: 'Hist Extended Price', minWidth: 170 }
    ].map((column) => this.buildFilterableColumn(column));
  },

  exclusionColumns() {
    return [
      { field: 'organization', headerName: 'Organization', minWidth: 150 },
      { field: 'itemDiscontinuedFlag', headerName: 'Item Discontinued Flag', minWidth: 210 },
      { field: 'itemSequesteredCoramApriaFlag', headerName: 'Item Sequestered Coram Apria Flag', minWidth: 250 },
      { field: 'itemUsedBiomedFlag', headerName: 'Used Biomed Flag', minWidth: 180 },
      { field: 'histRevenue', headerName: 'Hist Revenue', minWidth: 150 },
      { field: 'invalidPrcaFlag', headerName: 'Invalid PRCA Flag', minWidth: 150 }
    ].map((column) => this.buildFilterableColumn(column));
  },

  controlSortFieldMap() {
    return {
      kviInputUpdateDate: 'kvi_input_update_date',
      kviInputIncludeMonth: 'kvi_input_include_month'
    };
  },

  dataSortFieldMap() {
    return {
      gmInputUpdateDate: 'kvi_input_update_date',
      orderCompany: 'order_company',
      orderNumber: 'order_number',
      orderType: 'order_type',
      lineNumber: 'line_number',
      lineType: 'line_type',
      lastStatus: 'last_status',
      nextStatus: 'next_status',
      shipTo: 'ship_to',
      billTo: 'bill_to',
      orderDate: 'order_date',
      prcaNum: 'prca_num',
      organization: 'organization',
      customerSegment: 'customer_segment',
      customerMarket: 'customer_market',
      customer340bFlag: 'customer_340b_flag',
      patientFlag: 'invalid_prca_flag',
      itemNumber: 'item_num',
      itemFamily: 'item_family',
      itemCategory: 'item_category',
      itemGroup: 'item_group',
      itemSubCategory: 'item_sub_category',
      itemDescription: 'item_description',
      itemVendorFamily: 'item_vendor_family',
      itemDiscontinuedFlag: 'item_discontinued_flag',
      itemSequesteredCoramApriaFlag: 'item_sequestered_coram_apria_flag',
      itemUsedBiomedFlag: 'item_used_biomed_flag',
      likeItemGroup: 'like_item_group',
      histExtendedPrice: 'hist_extended_price'
    };
  },

  exclusionSortFieldMap() {
    return {
      itemDiscontinuedFlag: 'item_discontinued_flag',
      itemSequesteredCoramApriaFlag: 'item_sequestered_coram_apria_flag',
      itemUsedBiomedFlag: 'item_used_biomed_flag',
      histRevenue: 'hist_revenue',
      invalidPrcaFlag: 'invalid_prca_flag'
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
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T].*)?$/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }
    const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (usMatch) {
      return `${usMatch[3]}-${usMatch[1].padStart(2, '0')}-${usMatch[2].padStart(2, '0')}`;
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
        this.showInfo(`${field}: ${builtModel.invalidReason}`, 'error');
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
      return { isInvalid: true, invalidReason: 'Enter a value after the operator.' };
    }

    if (
      kind === 'text' &&
      ['greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual'].includes(parsed.type)
    ) {
      return { isInvalid: true, invalidReason: 'Text filters support contains, =, and != only.' };
    }

    if (kind === 'date') {
      const apiDate = this.toApiDate(value);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(apiDate)) {
        return { isInvalid: true, invalidReason: 'Enter a valid date in MM/DD/YYYY format.' };
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
        return { isInvalid: true, invalidReason: 'Enter a valid number.' };
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
    if (op === 'lessThan') return 'lt';
    if (op === 'lessThanOrEqual') return 'lte';
    if (op === 'contains') return 'like';
    if (op === 'startsWith' || op === 'endsWith') return 'like';
    if (op === 'notEqual') return 'neq';
    if (op === 'blank' || op === 'notBlank') return null;

    if (field === 'kviInputUpdateDate' || field === 'orderDate') return 'eq';
    return 'like';
  },

  getFieldFilterKind(field) {
    const normalizedField = String(field || '').trim();

    if (['kviInputUpdateDate', 'gmInputUpdateDate', 'orderDate'].includes(normalizedField)) {
      return 'date';
    }

    if (
      [
        'kviInputIncludeMonth',
        'orderCompany',
        'orderNumber',
        'lineNumber',
        'shipTo',
        'billTo',
        'prcaNum',
        'itemNumber',
        'likeItemGroup',
        'histExtendedPrice',
        'histRevenue'
      ].includes(normalizedField)
    ) {
      return 'number';
    }

    return 'text';
  },

  buildFilterableColumn(column) {
    const field = String(column?.field || '').trim();
    if (!field || field === 'select') return column;

    const kind = this.getFieldFilterKind(field);
    const alignmentClass = kind === 'text' ? 'cell-align-left' : 'cell-align-right';

    if (kind === 'date') {
      return {
        ...column,
        cellClass: alignmentClass,
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
        cellClass: alignmentClass,
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
      cellClass: alignmentClass,
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

  getValue(row, candidates) {
    for (const candidate of candidates) {
      if (row?.[candidate] !== undefined && row?.[candidate] !== null) {
        return row[candidate];
      }
    }
    return undefined;
  },

  transformControlRow(row) {
    if (!row || typeof row !== 'object') return row;
    return {
      kviInputUpdateDate: this.formatDateValue(this.getValue(row, ['kviInputUpdateDate', 'kvi_input_update_date'])),
      kviInputIncludeMonth: this.formatControlMonthDisplay(
        this.getValue(row, ['kviInputIncludeMonth', 'kvi_input_include_month'])
      )
    };
  },

  formatControlMonthDisplay(value) {
    const raw = String(value ?? '').trim();
    if (!/^\d+$/.test(raw)) return raw;
    const numeric = Number(raw);
    if (!Number.isInteger(numeric) || numeric < 1 || numeric > 12) return raw;
    return String(numeric).padStart(2, '0');
  },

  transformDataRow(row) {
    if (!row || typeof row !== 'object') return row;
    return {
      gmInputUpdateDate: this.formatDateValue(this.getValue(row, ['gmInputUpdateDate', 'kviInputUpdateDate', 'gm_input_update_date', 'kvi_input_update_date'])),
      orderCompany: this.getValue(row, ['orderCompany', 'order_company']),
      orderNumber: this.getValue(row, ['orderNumber', 'order_number']),
      orderType: this.getValue(row, ['orderType', 'order_type']),
      lineNumber: this.getValue(row, ['lineNumber', 'line_number']),
      lineType: this.getValue(row, ['lineType', 'line_type']),
      lastStatus: this.getValue(row, ['lastStatus', 'last_status']),
      nextStatus: this.getValue(row, ['nextStatus', 'next_status']),
      shipTo: this.getValue(row, ['shipTo', 'ship_to']),
      billTo: this.getValue(row, ['billTo', 'bill_to']),
      orderDate: this.formatDateValue(this.getValue(row, ['orderDate', 'order_date'])),
      prcaNum: this.getValue(row, ['prcaNum', 'prca_num']),
      organization: this.getValue(row, ['organization', 'organisation']),
      customerSegment: this.getValue(row, ['customerSegment', 'customer_segment']),
      customerMarket: this.getValue(row, ['customerMarket', 'customer_market']),
      customer340bFlag: this.getValue(row, ['customer340bFlag', 'customer340BFlag', 'customer_340b_flag']),
      patientFlag: this.getValue(row, ['patientFlag', 'invalidPrcaFlag', 'patient_flag', 'invalid_prca_flag']),
      itemNumber: this.getValue(row, ['itemNumber', 'itemNum', 'item_number', 'item_num']),
      itemFamily: this.getValue(row, ['itemFamily', 'item_family']),
      itemCategory: this.getValue(row, ['itemCategory', 'item_category']),
      itemGroup: this.getValue(row, ['itemGroup', 'item_group']),
      itemSubCategory: this.getValue(row, ['itemSubCategory', 'item_sub_category']),
      itemDescription: this.getValue(row, ['itemDescription', 'item_description']),
      itemVendorFamily: this.getValue(row, ['itemVendorFamily', 'item_vendor_family']),
      itemDiscontinuedFlag: this.getValue(row, ['itemDiscontinuedFlag', 'item_discontinued_flag']),
      itemSequesteredCoramApriaFlag: this.getValue(row, ['itemSequesteredCoramApriaFlag', 'itemSequesteredCommApriaFlag', 'item_sequestered_coram_apria_flag']),
      itemUsedBiomedFlag: this.getValue(row, ['itemUsedBiomedFlag', 'item_used_biomed_flag']),
      likeItemGroup: this.getValue(row, ['likeItemGroup', 'like_item_group']),
      histExtendedPrice: this.getValue(row, ['histExtendedPrice', 'hist_extended_price'])
    };
  },

  transformExclusionRow(row) {
    if (!row || typeof row !== 'object') return row;
    return {
      organization: this.getValue(row, ['organization', 'organisation']),
      itemDiscontinuedFlag: this.getValue(row, ['itemDiscontinuedFlag', 'item_discontinued_flag']),
      itemSequesteredCoramApriaFlag: this.getValue(row, ['itemSequesteredCoramApriaFlag', 'itemSequesteredCommApriaFlag', 'item_sequestered_coram_apria_flag']),
      itemUsedBiomedFlag: this.getValue(row, ['itemUsedBiomedFlag', 'item_used_biomed_flag']),
      histRevenue: this.getValue(row, ['histRevenue', 'hist_revenue']),
      invalidPrcaFlag: this.getValue(row, ['invalidPrcaFlag', 'patientFlag', 'patient_flag', 'invalid_prca_flag'])
    };
  },

  handleCellValueChanged(tabKey, event) {
    if (tabKey !== 'control') return;
    if (!event?.data || event.colDef?.field !== 'kviInputIncludeMonth') return;

    const previousValue = event.oldValue;
    const nextValue = event.newValue;
    if (String(previousValue ?? '') === String(nextValue ?? '')) return;

    if (!this.isValidControlMonth(nextValue)) {
      this.applyControlRowUpdate(event.node, {
        ...event.data,
        kviInputIncludeMonth: nextValue,
        _controlMonthInvalid: true
      });
      this.showInfo('KVI Input Include Month must be a whole number between 1 and 12.', 'error');
      return;
    }

    const updatedRow = {
      ...event.data,
      kviInputIncludeMonth: this.formatControlMonthDisplay(nextValue),
      _controlMonthInvalid: false,
      kviInputUpdateDate: this.getTodayUsDate()
    };

    const persistResult = this.persistControlRowUpdate(updatedRow);
    if (persistResult && typeof persistResult.then === 'function') {
      persistResult
        .then((savedRow) => {
          this.applyControlRowUpdate(event.node, savedRow || updatedRow);
        })
        .catch((error) => {
          console.error('KVI input control update failed:', error);
          this.applyControlRowUpdate(event.node, {
            ...event.data,
            kviInputIncludeMonth: previousValue,
            _controlMonthInvalid: false
          });
          this.showInfo('Failed to save KVI Input Include Month.', 'error');
        });
      return;
    }

    this.applyControlRowUpdate(event.node, persistResult || updatedRow);
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
    let container = document.getElementById('kviInputMainPageToastLayer');
    if (container) return container;

    container = document.createElement('div');
    container.id = 'kviInputMainPageToastLayer';
    container.className = 'app-page-toast-layer';
    document.body.appendChild(container);
    return container;
  },

  applyControlRowUpdate(rowNode, rowData) {
    if (!rowNode?.data || !rowData) return;
    Object.assign(rowNode.data, {
      kviInputUpdateDate: rowData.kviInputUpdateDate,
      kviInputIncludeMonth: rowData.kviInputIncludeMonth,
      _controlMonthInvalid: Boolean(rowData._controlMonthInvalid)
    });
    rowNode.setData({ ...rowNode.data });
  },

  isValidControlMonth(value) {
    const raw = String(value ?? '').trim();
    if (!/^\d+$/.test(raw)) return false;
    const numeric = Number(raw);
    return Number.isInteger(numeric) && numeric >= 1 && numeric <= 12;
  },

  persistControlRowUpdate(rowData) {
    const payload = this.buildControlUpdatePayload(rowData);
    const controlUpdateUrl = this.resolveApiUrl('/api/v1/kviInputControl');

    return fetch(controlUpdateUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`KVI input control update failed: ${response.status}`);
        }
        return response.json().catch(() => ({}));
      })
      .then((responseBody) => {
        const rows = this.extractRowsFromResponse(responseBody);
        if (rows.length > 0) {
          return this.transformControlRow(rows[0]);
        }
        if (responseBody?.data && !Array.isArray(responseBody.data)) {
          return this.transformControlRow(responseBody.data);
        }
        return this.transformControlRow({
          kviInputUpdateDate: this.toApiDate(rowData.kviInputUpdateDate),
          kviInputIncludeMonth: rowData.kviInputIncludeMonth
        });
      });
  },

  buildControlUpdatePayload(rowData) {
    return {
      kviInputIncludeMonth: Number(String(rowData.kviInputIncludeMonth).trim())
    };
  },

  getTodayUsDate() {
    const today = new Date();
    return `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
  },

  buildDatasource(tabConfig) {
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
              tabConfig.gridElementId === 'kviInputControlGrid'
                ? 'control'
                : tabConfig.gridElementId === 'kviInputDataGrid'
                  ? 'data'
                  : 'exclusion',
              rows.length
            );
            requestAnimationFrame(() => {
              this.setGridEmptyState(
                tabConfig.gridElementId === 'kviInputControlGrid'
                  ? 'control'
                  : tabConfig.gridElementId === 'kviInputDataGrid'
                    ? 'data'
                    : 'exclusion',
                params.startRow === 0 && rows.length === 0 ? 'empty' : 'hidden'
              );
            });
          })
          .catch((error) => {
            console.error('KVI input datasource fetch failed:', error);
            params.failCallback();
            this.syncNoRowsOverlay(
              params.api,
              tabConfig.gridElementId === 'kviInputControlGrid'
                ? 'control'
                : tabConfig.gridElementId === 'kviInputDataGrid'
                  ? 'data'
                  : 'exclusion',
              0
            );
            requestAnimationFrame(() => {
              this.setGridEmptyState(
                tabConfig.gridElementId === 'kviInputControlGrid'
                  ? 'control'
                  : tabConfig.gridElementId === 'kviInputDataGrid'
                    ? 'data'
                    : 'exclusion',
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
  KviInputPage.init();
});
