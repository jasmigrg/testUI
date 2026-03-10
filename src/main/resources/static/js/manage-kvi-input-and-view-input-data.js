const KviInputManagementPage = {
  activeTab: 'control',
  grids: {},
  toolbarScope: '.kvi-page-shell',
  gridManagerBootstrapped: false,
  gridManagerInitScheduled: false,

  init() {
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
    this.pageShell = document.querySelector('.kvi-page-shell');
    this.tabButtons = Array.from(document.querySelectorAll('.kvi-tab-btn[data-kvi-tab]'));
    this.tabPanels = Array.from(document.querySelectorAll('.kvi-tab-panel[data-kvi-panel]'));
  },

  bindTabs() {
    this.tabButtons.forEach((button) => {
      button.addEventListener('click', () => this.activateTab(button.dataset.kviTab));
    });
  },

  bindToolbarActions() {
    const scope = this.pageShell;
    if (!scope) return;

    scope.querySelector('[data-action="back"]')?.addEventListener('click', () => {
      window.location.assign('/');
    });

    scope.querySelector('[data-action="add"]')?.addEventListener('click', () => {
      if (this.activeTab === 'exclusion') {
        window.location.assign(window.KVI_INPUT_EXCLUSION_ADD_URL || '/kvi-input-exclusion/add');
        return;
      }
      this.showInfo('Add is only configured for KVI Input Exclusion.', 'info');
    });

    scope.querySelector('[data-action="favorite"]')?.addEventListener('click', () => {
      this.showInfo('Favorite action is not configured yet.', 'info');
    });

    scope.querySelector('[data-action="refresh"]')?.addEventListener('click', () => {
      this.resetActiveGridState();
    });

    scope.querySelector('[data-action="execute"]')?.addEventListener('click', () => {
      const activeGrid = this.getActiveGrid();
      if (!activeGrid?.api) return;
      if (typeof activeGrid.api.applyPendingFloatingFilters === 'function') {
        activeGrid.api.applyPendingFloatingFilters();
      }
    });

    scope.querySelectorAll('.gt-view-btn[data-density]').forEach((btn) => {
      btn.addEventListener('click', () => this.applyDensity(btn.dataset.density));
    });

    scope.querySelector('.gt-view-btn[data-action="download"]')?.addEventListener('click', () => {
      const activeGrid = this.getActiveGrid();
      if (!activeGrid?.api || typeof activeGrid.api.exportDataAsCsv !== 'function') return;
      activeGrid.api.exportDataAsCsv({
        fileName: `kvi-input-${this.activeTab}.csv`
      });
    });
  },

  activateTab(tabKey) {
    if (!tabKey || tabKey === this.activeTab) return;
    this.activeTab = tabKey;
    this.syncTabUi();
    this.syncToolbarForTab();
    this.syncGridManager();
    this.applyActiveDensity();
    this.refreshActiveGridLayout();
  },

  syncTabUi() {
    this.tabButtons.forEach((button) => {
      const isActive = button.dataset.kviTab === this.activeTab;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', String(isActive));
      button.tabIndex = isActive ? 0 : -1;
    });

    this.tabPanels.forEach((panel) => {
      const isActive = panel.dataset.kviPanel === this.activeTab;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
      panel.style.display = isActive ? 'flex' : 'none';
    });
  },

  getActiveGrid() {
    return this.grids[this.activeTab] || null;
  },

  syncToolbarForTab() {
    const addButton = this.pageShell?.querySelector('[data-action="add"]');
    if (!addButton) return;

    const shouldShowAdd = this.activeTab === 'exclusion';
    addButton.hidden = !shouldShowAdd;
    addButton.style.display = shouldShowAdd ? 'inline-flex' : 'none';
    addButton.setAttribute('aria-hidden', String(!shouldShowAdd));
  },

  getSelectedDensityMode() {
    return document.querySelector(`${this.toolbarScope} .gt-view-btn[data-density].is-active`)?.dataset?.density || 'compact';
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
      control: {
        gridElementId: 'kviInputControlGrid',
        pageSize: 10,
        columns: this.controlColumns(),
        rowData: this.controlRows()
      },
      data: {
        gridElementId: 'kviInputDataGrid',
        pageSize: 10,
        columns: this.dataColumns(),
        rowData: this.dataRows()
      },
      exclusion: {
        gridElementId: 'kviInputExclusionGrid',
        pageSize: 10,
        columns: this.exclusionColumns(),
        rowData: this.exclusionRows()
      }
    };

    const config = configByTab[tabKey];
    if (!config) return;

    const gridApi = DynamicGrid.createGrid({
      gridElementId: config.gridElementId,
      pageSize: config.pageSize,
      paginationType: 'client',
      floatingFilter: true,
      manualFilterApply: true,
      gridOptions: {
        rowData: config.rowData,
        animateRows: false,
        suppressCellFocus: false,
        defaultColDef: {
          sortable: true,
          unSortIcon: true,
          wrapHeaderText: true,
          autoHeaderHeight: true,
          resizable: true,
          editable: tabKey === 'control',
          filterParams: {
            buttons: ['apply', 'reset'],
            closeOnApply: true
          }
        },
        icons: {
          sortUnSort:
            '<span class="gt-sort-icon gt-sort-icon--none" aria-hidden="true"><svg viewBox="0 0 8 12" focusable="false"><path d="M4 1L7 4H1L4 1Z"></path><path d="M4 11L1 8H7L4 11Z"></path></svg></span>',
          sortAscending:
            '<span class="gt-sort-icon gt-sort-icon--asc" aria-hidden="true"><svg viewBox="0 0 8 12" focusable="false"><path d="M4 1L7 4H1L4 1Z"></path></svg></span>',
          sortDescending:
            '<span class="gt-sort-icon gt-sort-icon--desc" aria-hidden="true"><svg viewBox="0 0 8 12" focusable="false"><path d="M4 11L1 8H7L4 11Z"></path></svg></span>'
        }
      },
      columns: config.columns
    });

    const gridElement = document.getElementById(config.gridElementId);
    this.grids[tabKey] = {
      api: gridApi,
      element: gridElement,
      gridElementId: config.gridElementId
    };

    if (!this.gridManagerBootstrapped && !this.gridManagerInitScheduled && gridApi && typeof window.GridManager !== 'undefined') {
      this.gridManagerInitScheduled = true;
      setTimeout(() => {
        try {
          if (this.gridManagerBootstrapped) return;
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
    if (!this.gridManagerBootstrapped || typeof window.GridManager === 'undefined') return;

    const activeGrid = this.getActiveGrid();
    const instance = window.GridManager.currentInstance;
    if (!activeGrid?.api || !instance) return;

    instance.gridApi = activeGrid.api;
    instance.gridId = activeGrid.gridElementId;
    instance.apiConfig.screenId = window.GRID_PREF_SCREEN_ID_BY_GRID?.[activeGrid.gridElementId] || `id_${activeGrid.gridElementId}`;
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
  },

  controlColumns() {
    return [
      {
        field: 'kviInputUpdateDate',
        headerName: 'KVI Input Update Date',
        minWidth: 280,
        filter: 'agTextColumnFilter'
      },
      {
        field: 'kviInputIncludeMonth',
        headerName: 'KVI Input Include Month',
        minWidth: 280,
        filter: 'agNumberColumnFilter'
      }
    ];
  },

  dataColumns() {
    return [
      { field: 'kviInputUpdateDate', headerName: 'GM Input Update Date', minWidth: 150, filter: 'agTextColumnFilter' },
      { field: 'orderCompany', headerName: 'Order Company', minWidth: 130, filter: 'agTextColumnFilter' },
      { field: 'orderNumber', headerName: 'Order Number', minWidth: 140, filter: 'agTextColumnFilter' },
      { field: 'orderType', headerName: 'Order Type', minWidth: 120, filter: 'agTextColumnFilter' },
      { field: 'lineNumber', headerName: 'Line Number', minWidth: 120, filter: 'agNumberColumnFilter' },
      { field: 'lineType', headerName: 'Line Type', minWidth: 110, filter: 'agTextColumnFilter' },
      { field: 'lastStatus', headerName: 'Last Status', minWidth: 120, filter: 'agTextColumnFilter' },
      { field: 'nextStatus', headerName: 'Next Status', minWidth: 120, filter: 'agTextColumnFilter' },
      { field: 'shipTo', headerName: 'Ship To', minWidth: 130, filter: 'agTextColumnFilter' },
      { field: 'billTo', headerName: 'Bill To', minWidth: 130, filter: 'agTextColumnFilter' },
      { field: 'orderDate', headerName: 'Order Date', minWidth: 130, filter: 'agTextColumnFilter' },
      { field: 'prcaNum', headerName: 'PRCA Num', minWidth: 130, filter: 'agTextColumnFilter' },
      { field: 'organization', headerName: 'Organization', minWidth: 130, filter: 'agTextColumnFilter' },
      { field: 'customerSegment', headerName: 'Customer Segment', minWidth: 150, filter: 'agTextColumnFilter' },
      { field: 'customerMarket', headerName: 'Customer Market', minWidth: 150, filter: 'agTextColumnFilter' },
      { field: 'customerCluster', headerName: 'Customer Cluster', minWidth: 150, filter: 'agTextColumnFilter' },
      { field: 'itemNum', headerName: 'Item Num', minWidth: 130, filter: 'agTextColumnFilter' },
      { field: 'itemFamily', headerName: 'Item Family', minWidth: 220, filter: 'agTextColumnFilter' },
      { field: 'itemCategory', headerName: 'Item Category', minWidth: 180, filter: 'agTextColumnFilter' },
      { field: 'itemGroup', headerName: 'Item Group', minWidth: 180, filter: 'agTextColumnFilter' },
      { field: 'itemSubCategory', headerName: 'Item Sub Category', minWidth: 220, filter: 'agTextColumnFilter' },
      { field: 'itemDescription', headerName: 'Item Description', minWidth: 280, filter: 'agTextColumnFilter' },
      { field: 'itemVendorFamily', headerName: 'Item Vendor Family', minWidth: 170, filter: 'agTextColumnFilter' },
      { field: 'itemDiscontinuedFlag', headerName: 'Item Discontinued Flag', minWidth: 180, filter: 'agTextColumnFilter' },
      { field: 'itemSequesteredCommApriaFlag', headerName: 'Sequestered Comm Apria Flag', minWidth: 220, filter: 'agTextColumnFilter' },
      { field: 'itemUsedBiomedFlag', headerName: 'Used Biomed Flag', minWidth: 150, filter: 'agTextColumnFilter' },
      { field: 'likeItemGroup', headerName: 'Like Item Group', minWidth: 200, filter: 'agTextColumnFilter' },
      { field: 'histExtendedPrice', headerName: 'Hist Extended Price', minWidth: 150, filter: 'agNumberColumnFilter' }
    ];
  },

  exclusionColumns() {
    return [
      { field: 'organization', headerName: 'Organization', minWidth: 180, filter: 'agTextColumnFilter' },
      { field: 'itemDiscontinuedFlag', headerName: 'Item Discontinued Flag', minWidth: 210, filter: 'agTextColumnFilter' },
      { field: 'itemSequesteredCommApriaFlag', headerName: 'Sequestered Comm Apria Flag', minWidth: 260, filter: 'agTextColumnFilter' },
      { field: 'itemUsedBiomedFlag', headerName: 'Used Biomed Flag', minWidth: 180, filter: 'agTextColumnFilter' },
      { field: 'histRevenue', headerName: 'Hist Revenue', minWidth: 160, filter: 'agNumberColumnFilter' },
      { field: 'patientFlag', headerName: 'Patient Flag', minWidth: 150, filter: 'agTextColumnFilter' }
    ];
  },

  controlRows() {
    return [
      { kviInputUpdateDate: '03/09/2026', kviInputIncludeMonth: 16 }
    ];
  },

  dataRows() {
    return [
      {
        kviInputUpdateDate: '02/02/2026',
        orderCompany: '86701',
        orderNumber: '40154403',
        orderType: 'SZ',
        lineNumber: 2000,
        lineType: 'S',
        lastStatus: '620',
        nextStatus: '999',
        shipTo: '5503587',
        billTo: '70044045',
        orderDate: '02/03/2026',
        prcaNum: '20149976',
        organization: 'MMS',
        customerSegment: 'EC',
        customerMarket: 'EC HS',
        customerCluster: 'EC HS 7',
        itemNum: '1246811',
        itemFamily: 'Incontinence',
        itemCategory: 'Inco Wipes',
        itemGroup: 'Incontinence Wipes',
        itemSubCategory: 'Inco Wipes, Wipes, Personal Care: Skin C',
        itemDescription: 'WIPE, PRE-MOISPN LID UNSCENTED (48/PK 12PK/CS)',
        itemVendorFamily: '4272124',
        itemDiscontinuedFlag: 'N',
        itemSequesteredCommApriaFlag: 'N',
        itemUsedBiomedFlag: 'N',
        likeItemGroup: '1246811',
        histExtendedPrice: 11.4
      },
      {
        kviInputUpdateDate: '02/02/2026',
        orderCompany: '86701',
        orderNumber: '40192720',
        orderType: 'SZ',
        lineNumber: 5000,
        lineType: 'S',
        lastStatus: '620',
        nextStatus: '999',
        shipTo: '5503735',
        billTo: '20111472',
        orderDate: '02/03/2026',
        prcaNum: '6171629',
        organization: 'MMS',
        customerSegment: 'EC',
        customerMarket: 'EC HIT',
        customerCluster: 'EC HIT 0',
        itemNum: '68741',
        itemFamily: 'Nursing and Surgical Supplies',
        itemCategory: 'Needles & Syringes',
        itemGroup: 'Syringes w/o Needles',
        itemSubCategory: 'Syringe Bulb/Irrigation/Cath Tip',
        itemDescription: 'SYRINGE, IRR FLAT TOP 60CC (50/CS)',
        itemVendorFamily: '3885395',
        itemDiscontinuedFlag: 'N',
        itemSequesteredCommApriaFlag: 'N',
        itemUsedBiomedFlag: 'N',
        likeItemGroup: '3885395_N_503041_42142601_FC',
        histExtendedPrice: 6.4
      },
      {
        kviInputUpdateDate: '02/12/2026',
        orderCompany: '00001',
        orderNumber: '42596672',
        orderType: 'SZ',
        lineNumber: 4000,
        lineType: 'S',
        lastStatus: '620',
        nextStatus: '999',
        shipTo: '69133027',
        billTo: '4420811',
        orderDate: '02/12/2026',
        prcaNum: '20149976',
        organization: 'MMS',
        customerSegment: 'EC',
        customerMarket: 'EC HS',
        customerCluster: 'EC HS 7',
        itemNum: '1246811',
        itemFamily: 'Incontinence',
        itemCategory: 'Inco Wipes',
        itemGroup: 'Incontinence Wipes',
        itemSubCategory: 'Inco Wipes, Wipes, Personal Care: Skin C',
        itemDescription: 'WIPE, PRE-MOISPN LID UNSCENTED (48/PK 12PK/CS)',
        itemVendorFamily: '4272124',
        itemDiscontinuedFlag: 'N',
        itemSequesteredCommApriaFlag: 'N',
        itemUsedBiomedFlag: 'N',
        likeItemGroup: '1246811',
        histExtendedPrice: 11.4
      }
    ];
  },

  exclusionRows() {
    return [
      {
        organization: 'MMS',
        itemDiscontinuedFlag: 'N',
        itemSequesteredCommApriaFlag: 'N',
        itemUsedBiomedFlag: 'N',
        histRevenue: 0,
        patientFlag: 'N'
      },
      {
        organization: 'string',
        itemDiscontinuedFlag: 'string',
        itemSequesteredCommApriaFlag: 'string',
        itemUsedBiomedFlag: 'string',
        histRevenue: 0,
        patientFlag: 'string'
      }
    ];
  },

  showInfo(message, type = 'success') {
    if (window.GridManager?.currentInstance?.showToast) {
      window.GridManager.currentInstance.showToast(message, type, 2200);
      return;
    }
    console.info(message);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  KviInputManagementPage.init();
});
