const KviMappingLogicPage = {
  activeTab: 'parameter',
  grids: {},
  toolbarScope: '.kvi-page-shell',
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
    this.pageShell = document.querySelector('.kvi-page-shell');
    this.tabButtons = Array.from(document.querySelectorAll('.kvi-tab-btn[data-kvi-tab]'));
    this.tabPanels = Array.from(document.querySelectorAll('.kvi-tab-panel[data-kvi-panel]'));
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
        window.location.assign('/');
      });
    });

    scope.querySelectorAll('.gt-action-btn[data-action="add"]').forEach((button) => {
      button.addEventListener('click', () => {
        const addUrl = String(window.KVI_MAPPING_ADD_PAGE_URL || '').trim();
        if (addUrl) {
          window.location.assign(addUrl);
          return;
        }
        if (window.PageToast?.warn) {
          window.PageToast.warn('Add page is not configured for KVI Mapping yet.');
        }
      });
    });

    scope.querySelectorAll('.gt-action-btn[data-action="favorite"]').forEach((button) => {
      button.addEventListener('click', () => {
        if (window.PageToast?.info) {
          window.PageToast.info('Favorites action is not configured yet.');
        }
      });
    });

    scope.querySelectorAll('.gt-action-btn[data-action="refresh"]').forEach((button) => {
      button.addEventListener('click', () => {
        this.resetActiveGridState();
      });
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
      button.addEventListener('click', () => {
        this.applyDensity(button.dataset.density);
      });
    });

    const downloadBtn = scope.querySelector('.gt-view-btn[data-action="download"]');
    downloadBtn?.addEventListener('click', () => {
      const activeGrid = this.getActiveGrid();
      if (!activeGrid?.api || typeof activeGrid.api.exportDataAsCsv !== 'function') return;
      activeGrid.api.exportDataAsCsv({
        fileName: this.activeTab === 'parameter'
          ? 'kvi-mapping-parameter.csv'
          : 'kvi-mapping-output.csv'
      });
    });
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

    if (typeof activeGrid.api.setFilterModel === 'function') {
      activeGrid.api.setFilterModel(null);
    }
    if (typeof activeGrid.api.setSortModel === 'function') {
      activeGrid.api.setSortModel(null);
    }
    if (typeof activeGrid.api.onFilterChanged === 'function') {
      activeGrid.api.onFilterChanged();
    }
    if (typeof activeGrid.api.paginationGoToFirstPage === 'function') {
      activeGrid.api.paginationGoToFirstPage();
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
          const datasource = this.buildDatasource(tabConfig);
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
        defaultColDef: {
          sortable: true,
          unSortIcon: true,
          wrapHeaderText: true,
          autoHeaderHeight: true,
          filterParams: {
            buttons: ['apply', 'reset'],
            closeOnApply: true
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
      { field: 'effectiveDate', headerName: 'Effective Date', minWidth: 150, filter: 'agDateColumnFilter' },
      { field: 'terminationDate', headerName: 'Termination Date', minWidth: 170, filter: 'agDateColumnFilter' },
      { field: 'revenuePenetrationPctl', headerName: 'Revenue Penetration PCTL', minWidth: 230, filter: 'agNumberColumnFilter' },
      { field: 'prcaPenetrationPctl', headerName: 'PRCA Penetration PCTL', minWidth: 210, filter: 'agNumberColumnFilter' },
      { field: 'revenuePenetrationAdj', headerName: 'Revenue Penetration ADJ', minWidth: 220, filter: 'agNumberColumnFilter' },
      { field: 'prcaPenetrationAdj', headerName: 'PRCA Penetration ADJ', minWidth: 200, filter: 'agNumberColumnFilter' }
    ];
  },

  outputColumns() {
    return [
      { field: 'itemNum', headerName: 'Item Num', minWidth: 130, filter: 'agNumberColumnFilter' },
      { field: 'customerCluster', headerName: 'Customer Cluster', minWidth: 180 },
      { field: 'effectiveDate', headerName: 'Effective Date', minWidth: 150, filter: 'agDateColumnFilter' },
      { field: 'terminationDate', headerName: 'Termination Date', minWidth: 170, filter: 'agDateColumnFilter' },
      { field: 'itemSegmentation', headerName: 'Item Segmentation', minWidth: 190 }
    ];
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
    const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (us) {
      const month = us[1].padStart(2, '0');
      const day = us[2].padStart(2, '0');
      return `${us[3]}-${month}-${day}`;
    }
    return trimmed;
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

  mapOperatorToApi(operator, field) {
    const op = String(operator || '').trim();
    if (!op) return null;
    const normalizedOp = op.toLowerCase().replace(/[\s_-]/g, '');

    if (normalizedOp === 'equals' || normalizedOp === 'eq') return 'eq';
    if (normalizedOp === 'greaterthan' || normalizedOp === 'gt') return 'gt';
    if (normalizedOp === 'greaterthanorequal' || normalizedOp === 'gte') return 'gte';
    if (normalizedOp === 'lessthan' || normalizedOp === 'ls') return 'ls';
    if (normalizedOp === 'lessthanorequal' || normalizedOp === 'lte') return 'lte';
    if (normalizedOp === 'contains' || normalizedOp === 'startswith' || normalizedOp === 'endswith' || normalizedOp === 'like') return 'like';
    if (normalizedOp === 'notequal' || normalizedOp === 'neq' || normalizedOp === 'ne') return 'neq';
    if (normalizedOp === 'blank' || normalizedOp === 'notblank') return null;

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

  buildDatasource(tabConfig) {
    return {
      rowCount: null,
      getRows: (params) => {
        const pageSize = params.endRow - params.startRow;
        const pageNum = Math.floor(params.startRow / (pageSize || 20));
        const urlParams = new URLSearchParams();

        urlParams.append('page', String(pageNum));
        urlParams.append(tabConfig.pageSizeParam || 'pageSize', String(pageSize));

        if (params.sortModel && params.sortModel.length > 0) {
          const sortModel = params.sortModel[0];
          const sortField = (tabConfig.sortFieldMap && tabConfig.sortFieldMap[sortModel.colId]) || sortModel.colId;
          urlParams.append('sortBy', sortField);
          urlParams.append('sortDir', sortModel.sort);
        }

        if (params.filterModel) {
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
          })
          .catch((error) => {
            console.error('KVI mapping datasource fetch failed:', error);
            params.failCallback();
          });
      }
    };
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
