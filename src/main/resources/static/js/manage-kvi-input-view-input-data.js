const KviInputPage = {
  activeTab: 'control',
  grids: {},
  toolbarScope: '.screen-page-shell',
  gridManagerBootstrapped: false,
  gridManagerInitScheduled: false,
  apiBaseUrl: '',
  controlUpdateUrl: '',

  init() {
    this.apiBaseUrl = (window.API_BASE_URL || '').replace(/\/$/, '');
    this.controlUpdateUrl = String(window.KVI_INPUT_CONTROL_UPDATE_URL || '').trim();
    this.cacheDom();
    this.bindTabs();
    this.bindToolbarActions();
    this.initGridForTab('control');
    this.initGridForTab('data');
    this.initGridForTab('exclusion');
    this.syncTabUi();
    this.syncToolbarForTab();
    this.syncGridManager();
    this.applyActiveDensity();
  },

  cacheDom() {
    this.pageShell = document.querySelector('.screen-page-shell');
    this.tabButtons = Array.from(document.querySelectorAll('.screen-tab-btn[data-kvi-tab]'));
    this.tabPanels = Array.from(document.querySelectorAll('.screen-tab-panel[data-kvi-panel]'));
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

    scope.querySelectorAll('.gt-action-btn[data-action="favorite"]').forEach((button) => {
      button.addEventListener('click', () => {
        window.PageToast?.info?.('Favorite action is not configured yet.');
      });
    });

    scope.querySelectorAll('.gt-action-btn[data-action="add"]').forEach((button) => {
      button.addEventListener('click', () => {
        const addUrl = String(window.KVI_INPUT_EXCLUSION_ADD_PAGE_URL || '').trim();
        if (addUrl) {
          window.location.assign(addUrl);
          return;
        }
        window.PageToast?.info?.('KVI Input Exclusion add screen is not configured yet.');
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
    downloadBtn?.addEventListener('click', () => {
      const activeGrid = this.getActiveGrid();
      if (!activeGrid?.api || typeof activeGrid.api.exportDataAsCsv !== 'function') return;
      activeGrid.api.exportDataAsCsv({ fileName: this.getDownloadFileName() });
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
          params.api.setGridOption('datasource', this.buildDatasource(tabConfig));
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
        editable: true
      }
    ];
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
    ];
  },

  exclusionColumns() {
    return [
      { field: 'organization', headerName: 'Organization', minWidth: 150 },
      { field: 'itemDiscontinuedFlag', headerName: 'Item Discontinued Flag', minWidth: 210 },
      { field: 'itemSequesteredCommApriaFlag', headerName: 'Sequestered Comm Apria Flag', minWidth: 250 },
      { field: 'itemUsedBiomedFlag', headerName: 'Used Biomed Flag', minWidth: 180 },
      { field: 'histRevenue', headerName: 'Hist Revenue', minWidth: 150 },
      { field: 'patientFlag', headerName: 'Patient Flag', minWidth: 150 }
    ];
  },

  controlSortFieldMap() {
    return {
      kviInputUpdateDate: 'kviInputUpdateDate',
      kviInputIncludeMonth: 'kviInputIncludeMonth'
    };
  },

  dataSortFieldMap() {
    return {
      gmInputUpdateDate: 'kviInputUpdateDate',
      orderCompany: 'orderCompany',
      orderNumber: 'orderNumber',
      orderType: 'orderType',
      lineNumber: 'lineNumber',
      lineType: 'lineType',
      lastStatus: 'lastStatus',
      nextStatus: 'nextStatus',
      shipTo: 'shipTo',
      billTo: 'billTo',
      orderDate: 'orderDate',
      prcaNum: 'prcaNum',
      organization: 'organization',
      customerSegment: 'customerSegment',
      customerMarket: 'customerMarket',
      customer340bFlag: 'customer340bFlag',
      patientFlag: 'invalidPrcaFlag',
      itemNumber: 'itemNum',
      itemFamily: 'itemFamily',
      itemCategory: 'itemCategory',
      itemGroup: 'itemGroup',
      itemSubCategory: 'itemSubCategory',
      itemDescription: 'itemDescription',
      itemVendorFamily: 'itemVendorFamily',
      itemDiscontinuedFlag: 'itemDiscontinuedFlag',
      itemSequesteredCoramApriaFlag: 'itemSequesteredCoramApriaFlag',
      itemUsedBiomedFlag: 'itemUsedBiomedFlag',
      likeItemGroup: 'likeItemGroup',
      histExtendedPrice: 'histExtendedPrice'
    };
  },

  exclusionSortFieldMap() {
    return {
      organization: 'organization',
      itemDiscontinuedFlag: 'itemDiscontinuedFlag',
      itemSequesteredCommApriaFlag: 'itemSequesteredCoramApriaFlag',
      itemUsedBiomedFlag: 'itemUsedBiomedFlag',
      histRevenue: 'histRevenue',
      patientFlag: 'invalidPrcaFlag'
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
    const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (usMatch) {
      return `${usMatch[3]}-${usMatch[1].padStart(2, '0')}-${usMatch[2].padStart(2, '0')}`;
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
      kviInputIncludeMonth: this.getValue(row, ['kviInputIncludeMonth', 'kvi_input_include_month'])
    };
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
      itemSequesteredCommApriaFlag: this.getValue(row, ['itemSequesteredCommApriaFlag', 'itemSequesteredCoramApriaFlag', 'item_sequestered_coram_apria_flag']),
      itemUsedBiomedFlag: this.getValue(row, ['itemUsedBiomedFlag', 'item_used_biomed_flag']),
      histRevenue: this.getValue(row, ['histRevenue', 'hist_revenue']),
      patientFlag: this.getValue(row, ['patientFlag', 'invalidPrcaFlag', 'patient_flag', 'invalid_prca_flag'])
    };
  },

  handleCellValueChanged(tabKey, event) {
    if (tabKey !== 'control') return;
    if (!event?.data || event.colDef?.field !== 'kviInputIncludeMonth') return;

    const previousValue = event.oldValue;
    const nextValue = event.newValue;
    if (String(previousValue ?? '') === String(nextValue ?? '')) return;

    const updatedRow = {
      ...event.data,
      kviInputIncludeMonth: nextValue,
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
            kviInputIncludeMonth: previousValue
          });
          window.PageToast?.error?.('Failed to save KVI Input Include Month.');
        });
      return;
    }

    this.applyControlRowUpdate(event.node, persistResult || updatedRow);
  },

  applyControlRowUpdate(rowNode, rowData) {
    if (!rowNode?.data || !rowData) return;
    Object.assign(rowNode.data, {
      kviInputUpdateDate: rowData.kviInputUpdateDate,
      kviInputIncludeMonth: rowData.kviInputIncludeMonth
    });
    rowNode.setData({ ...rowNode.data });
  },

  persistControlRowUpdate(rowData) {
    const payload = this.buildControlUpdatePayload(rowData);
    if (!this.controlUpdateUrl) {
      return payload;
    }

    return fetch(this.controlUpdateUrl, {
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
        return payload;
      });
  },

  buildControlUpdatePayload(rowData) {
    return {
      kviInputUpdateDate: this.toApiDate(rowData.kviInputUpdateDate),
      kviInputIncludeMonth: rowData.kviInputIncludeMonth
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
        const pageNum = Math.floor(params.startRow / (pageSize || 20));
        const urlParams = new URLSearchParams();

        urlParams.append('page', String(pageNum));
        urlParams.append(tabConfig.pageSizeParam || 'size', String(pageSize));

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
            console.error('KVI input datasource fetch failed:', error);
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
  KviInputPage.init();
});
