class GtPageSelectHeader {
  init(params) {
    this.params = params;
    this.eGui = document.createElement('div');
    this.eGui.className = 'gt-header-select-all';

    this.checkbox = document.createElement('input');
    this.checkbox.type = 'checkbox';
    this.checkbox.className = 'gt-header-select-checkbox';
    this.checkbox.setAttribute('aria-label', 'Select visible rows');

    this.stopEvent = (event) => event.stopPropagation();
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

    for (let i = from; i < to; i += 1) {
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

    for (let i = from; i < to; i += 1) {
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

const MckBrandLogicPage = {
  activeTab: 'weighting',
  grids: {},
  toolbarScope: '.mck-brand-logic-shell',
  gridManagerBootstrapped: false,
  gridManagerInitScheduled: false,
  apiBaseUrl: '',
  tabs: {
    weighting: {
      title: 'GM Core MCKB Price Scoring Weighting',
      gridElementId: 'mckWeightingGrid',
      exportName: 'gm-core-mckb-price-scoring-weighting.csv',
      apiEndpoint: '/api/v1/scoring-weightings/paginated',
      paginationType: 'server',
      columns: [
        { field: 'effectiveDate', headerName: 'Effective Date', minWidth: 150 },
        { field: 'terminationDate', headerName: 'Termination Date', minWidth: 170 },
        { field: 'itemCategory', headerName: 'Item Category', minWidth: 170 },
        { field: 'itemNum', headerName: 'Item NUM', minWidth: 150 },
        { field: 'relativeProfitabilityWeighting', headerName: 'Relative Profitability Weighting', minWidth: 250 },
        { field: 'relativeShareWeighting', headerName: 'Relative  Share Weighting', minWidth: 220 },
        { field: 'relativeQualityWeighting', headerName: 'Relative Quality Weighting', minWidth: 220 }
      ]
    },
    'quality-tier': {
      title: 'GM Core Paramter MCKB Quality Tiers',
      gridElementId: 'mckQualityTierGrid',
      exportName: 'gm-core-paramter-mckb-quality-tiers.csv',
      columns: [
        { field: 'effectiveDate', headerName: 'Effective Date', minWidth: 150 },
        { field: 'terminationDate', headerName: 'Termination Date', minWidth: 170 },
        { field: 'itemCategory', headerName: 'Item Category', minWidth: 170 },
        { field: 'itemNum', headerName: 'Item NUM', minWidth: 150 },
        { field: 'qualityScore', headerName: 'Quality Score', minWidth: 170 },
        { field: 'qualityTier', headerName: 'Quality Tier', minWidth: 170 }
      ]
    },
    'relative-delta': {
      title: 'GM Core Paramter MCKB Relative Price Delta',
      gridElementId: 'mckRelativeDeltaGrid',
      exportName: 'gm-core-paramter-mckb-relative-price-delta.csv',
      columns: [
        { field: 'effectiveDate', headerName: 'Effective Date', minWidth: 150 },
        { field: 'terminationDate', headerName: 'Termination Date', minWidth: 170 },
        { field: 'itemCategory', headerName: 'Item Category', minWidth: 170 },
        { field: 'relativeAllowableMinPrice', headerName: 'Relative Allowable Min Price', minWidth: 230 },
        { field: 'relativeAllowableMaxPrice', headerName: 'Relative Allowable Max Price', minWidth: 230 }
      ]
    },
    'price-cap': {
      title: 'GM Core Parameter MCKB Price Change CAP',
      gridElementId: 'mckPriceCapGrid',
      exportName: 'gm-core-parameter-mckb-price-change-cap.csv',
      columns: [
        { field: 'effectiveDate', headerName: 'Effective Date', minWidth: 150 },
        { field: 'terminationDate', headerName: 'Termination Date', minWidth: 170 },
        { field: 'itemCategory', headerName: 'Item Category', minWidth: 170 },
        { field: 'mckBrandPriceChangeCap', headerName: 'MCK Brand Price Change Cap', minWidth: 230 }
      ]
    },
    'brand-multiplier': {
      title: 'GM Core Output Brand Multiplier',
      gridElementId: 'mckBrandMultiplierGrid',
      exportName: 'gm-core-output-brand-multiplier.csv',
      columns: [
        { field: 'uniqueId', headerName: 'Unique ID', minWidth: 140 },
        { field: 'mainLevel', headerName: 'Main Level', minWidth: 160 },
        { field: 'nbMainLevel', headerName: 'NB Main Level', minWidth: 170 },
        { field: 'effectiveDate', headerName: 'Effective Date', minWidth: 150 },
        { field: 'terminationDate', headerName: 'Termination Date', minWidth: 170 },
        { field: 'customerLevel', headerName: 'Customer Level', minWidth: 180 },
        { field: 'customerAttribute', headerName: 'Customer Attribute', minWidth: 190 }
      ]
    }
  },

  init() {
    this.apiBaseUrl = (window.API_BASE_URL || '').replace(/\/$/, '');
    this.cacheDom();
    this.bindTabs();
    this.bindToolbarActions();
    Object.keys(this.tabs).forEach((tabKey) => this.initGridForTab(tabKey));
    this.syncTabUi();
    this.syncTitle();
    this.syncGridManager();
    this.applyActiveDensity();
  },

  cacheDom() {
    this.pageShell = document.querySelector('.mck-brand-logic-shell');
    this.contentCard = document.querySelector('.mck-brand-logic-page .content-card');
    this.tabButtons = Array.from(document.querySelectorAll('.screen-tab-btn[data-mck-tab]'));
    this.tabPanels = Array.from(document.querySelectorAll('.screen-tab-panel[data-mck-panel]'));
    this.activeTabTitle = document.getElementById('mckActiveTabTitle');
    this.emptyStates = {
      weighting: document.getElementById('mckWeightingEmptyState')
    };
  },

  bindTabs() {
    this.tabButtons.forEach((button) => {
      button.addEventListener('click', () => this.activateTab(button.getAttribute('data-mck-tab')));
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

    scope.querySelectorAll('.gt-action-btn[data-action="add"]').forEach((button) => {
      button.addEventListener('click', () => {
        this.showInfo('Add flow for this screen is not configured yet.', 'warning');
      });
    });

    scope.querySelectorAll('.gt-action-btn[data-action="favorite"]').forEach((button) => {
      button.addEventListener('click', () => {
        this.showInfo('Favorite action is not configured yet.', 'warning');
      });
    });

    scope.querySelectorAll('.gt-action-btn[data-action="disable"]').forEach((button) => {
      button.addEventListener('click', () => {
        this.showInfo('Disable action is not configured yet.', 'warning');
      });
    });

    scope.querySelectorAll('.gt-action-btn[data-action="update-termination-date"]').forEach((button) => {
      button.addEventListener('click', () => {
        this.showInfo('Update Termination Date is not configured yet.', 'warning');
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
      const activeTabConfig = this.tabs[this.activeTab];
      if (!activeGrid?.api || typeof activeGrid.api.exportDataAsCsv !== 'function' || !activeTabConfig) return;
      activeGrid.api.exportDataAsCsv({ fileName: activeTabConfig.exportName });
    });
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

    window.PageToast.show({
      container,
      type: normalizedType,
      title,
      subtitle: String(message || '').trim(),
      icon: normalizedType === 'error' ? '!' : normalizedType === 'warning' ? 'i' : '✓',
      autoHideMs: 2400
    });
  },

  ensureToastContainer() {
    let container = document.getElementById('mckBrandLogicPageToastLayer');
    if (container) return container;

    container = document.createElement('div');
    container.id = 'mckBrandLogicPageToastLayer';
    container.className = 'app-page-toast-layer';
    document.body.appendChild(container);
    return container;
  },

  activateTab(tabKey) {
    if (!tabKey || tabKey === this.activeTab || !this.tabs[tabKey]) return;

    this.activeTab = tabKey;
    this.syncTabUi();
    this.syncTitle();
    this.initGridForTab(tabKey);
    this.syncGridManager();
    this.applyActiveDensity();
    this.refreshActiveGridLayout();
  },

  syncTabUi() {
    this.tabButtons.forEach((button) => {
      const isActive = button.getAttribute('data-mck-tab') === this.activeTab;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', String(isActive));
      button.tabIndex = isActive ? 0 : -1;
    });

    this.tabPanels.forEach((panel) => {
      const isActive = panel.getAttribute('data-mck-panel') === this.activeTab;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
      panel.style.display = isActive ? 'flex' : 'none';
    });
  },

  syncTitle() {
    if (!this.activeTabTitle) return;
    this.activeTabTitle.textContent = this.tabs[this.activeTab]?.title || '';
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
        densityClassPrefix: 'screen-density',
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
    if (typeof activeGrid.api.deselectAll === 'function') {
      activeGrid.api.deselectAll();
    }
    this.refreshActiveGridLayout();
  },

  initGridForTab(tabKey) {
    if (this.grids[tabKey]?.api) return;

    const tabConfig = this.tabs[tabKey];
    if (!tabConfig) return;

    const selectionColumn = {
      field: 'select',
      colId: 'select',
      headerName: '',
      width: 56,
      minWidth: 56,
      maxWidth: 56,
      pinned: 'left',
      sortable: false,
      suppressMenu: true,
      resizable: false,
      lockPosition: true,
      headerComponent: 'gtPageSelectHeader',
      checkboxSelection: true,
      floatingFilter: false,
      filter: false,
      suppressMovable: true
    };

    const gridApi = DynamicGrid.createGrid({
      gridElementId: tabConfig.gridElementId,
      pageSize: 20,
      paginationType: tabConfig.paginationType || 'client',
      useSpringPagination: tabConfig.paginationType === 'server',
      floatingFilter: true,
      manualFilterApply: true,
      gridOptions: {
        rowData: [],
        onGridReady: (params) => {
          if (tabConfig.paginationType !== 'server') return;
          params.api.setGridOption('datasource', this.buildDatasource(tabConfig));
        },
        rowSelection: 'multiple',
        suppressRowClickSelection: true,
        components: {
          gtPageSelectHeader: GtPageSelectHeader
        },
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
      columns: [selectionColumn, ...tabConfig.columns]
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

  buildDatasource(tabConfig) {
    return {
      rowCount: null,
      getRows: async (params) => {
        const pageSize = params.endRow - params.startRow || 20;
        const page = Math.floor(params.startRow / pageSize);
        const sortModel = Array.isArray(params.sortModel) ? params.sortModel[0] : null;
        const urlParams = new URLSearchParams({
          page: String(page),
          size: String(pageSize),
          sortBy: sortModel?.colId || 'effectiveDate',
          sortDirection: String(sortModel?.sort || 'asc').toUpperCase()
        });

        try {
          const response = await fetch(`${this.resolveApiUrl(tabConfig.apiEndpoint)}?${urlParams.toString()}`, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            credentials: 'same-origin'
          });

          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }

          const payload = await response.json();
          const rows = Array.isArray(payload?.content)
            ? payload.content.map((row) => this.transformWeightingRow(row))
            : [];
          const totalRows = Number.isFinite(payload?.totalElements) ? payload.totalElements : rows.length;
          this.syncNoRowsOverlay(params.api, rows.length);
          params.successCallback(rows, totalRows);
        } catch (error) {
          console.error(`Failed to load ${tabConfig.gridElementId}:`, error);
          this.syncNoRowsOverlay(params.api, 0);
          params.successCallback([], 0);
        }
      }
    };
  },

  syncNoRowsOverlay(gridApi, rowCount) {
    const emptyState = this.emptyStates?.weighting;
    if (emptyState) {
      emptyState.hidden = rowCount > 0;
    }
    if (!gridApi) return;
    if (rowCount > 0) {
      if (typeof gridApi.hideOverlay === 'function') gridApi.hideOverlay();
      return;
    }
    if (typeof gridApi.showNoRowsOverlay === 'function') {
      gridApi.showNoRowsOverlay();
    }
  },

  resolveApiUrl(path) {
    const normalizedPath = String(path || '').trim();
    if (!normalizedPath) return this.apiBaseUrl;
    if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
    return `${this.apiBaseUrl}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`;
  },

  transformWeightingRow(row) {
    if (!row || typeof row !== 'object') return row;

    return {
      effectiveDate: row.effectiveDate ?? '',
      terminationDate: row.terminationDate ?? '',
      itemCategory: row.itemCategory ?? '',
      itemNum: row.itemNum ?? '',
      relativeProfitabilityWeighting: row.relativeProfitabilityWeighting ?? '',
      relativeShareWeighting: row.relativeShareWeighting ?? '',
      relativeQualityWeighting: row.relativeQualityWeighting ?? ''
    };
  }

};

document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('.mck-brand-logic-shell')) return;
  MckBrandLogicPage.init();
});
