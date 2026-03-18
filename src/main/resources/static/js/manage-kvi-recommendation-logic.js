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

class KviManualFloatingFilter {
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
    const parsedInput = KviRecommendationLogicPage.parseInlineFilterExpression(value, fallbackOperator);

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

const KviRecommendationLogicPage = {
  activeTab: 'parameter',
  grids: {},
  toolbarScope: '.screen-page-shell',
  gridManagerBootstrapped: false,
  gridManagerInitScheduled: false,
  kviApiBaseUrl: '',

  init() {
    this.kviApiBaseUrl = (window.API_BASE_URL || window.KVI_API_BASE_URL || '').replace(/\/$/, '');
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
      parameter: document.getElementById('kviRecommendationParameterEmptyState'),
      output: document.getElementById('kviRecommendationOutputEmptyState')
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
        const addUrl = window.KVI_ADD_PAGE_URL || '/manage-kvi-recommendation-logic-view-output-data/add';
        window.location.assign(addUrl);
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
    downloadBtn?.addEventListener('click', () => {
      const activeGrid = this.getActiveGrid();
      if (!activeGrid?.api || typeof activeGrid.api.exportDataAsCsv !== 'function') return;
      activeGrid.api.exportDataAsCsv({
        fileName: this.activeTab === 'parameter'
          ? 'kvi-recommendation-parameter.csv'
          : 'kvi-recommendation-output.csv'
      });
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
    let container = document.getElementById('kviRecommendationMainPageToastLayer');
    if (container) return container;

    container = document.createElement('div');
    container.id = 'kviRecommendationMainPageToastLayer';
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
      parameter: {
        gridElementId: 'kviParameterGrid',
        columns: this.parameterColumns(),
        apiEndpoint: `${this.kviApiBaseUrl}/api/v1/kviRecommendationParameter`,
        pageSizeParam: 'size',
        sortFieldMap: this.parameterSortFieldMap(),
        dataTransformer: (row) => this.transformParameterRow(row)
      },
      output: {
        gridElementId: 'kviOutputGrid',
        columns: this.outputColumns(),
        apiEndpoint: `${this.kviApiBaseUrl}/api/v1/kviRecommendationOutput`,
        pageSizeParam: 'size',
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
          manualApplyFloatingFilter: KviManualFloatingFilter
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
      { field: 'prcaMinThreshold', headerName: 'PRCA Min Threshold', minWidth: 190 },
      { field: 'dedupMethod', headerName: 'Dedup Method', minWidth: 170 }
    ].map((column) => this.buildFilterableColumn(column));
  },

  outputColumns() {
    return [
      { field: 'prcaNum', headerName: 'PRCA Num', minWidth: 130 },
      { field: 'customerCluster', headerName: 'Customer Cluster', minWidth: 170 },
      { field: 'effectiveDate', headerName: 'Effective Date', minWidth: 150 },
      { field: 'terminationDate', headerName: 'Termination Date', minWidth: 170 },
      { field: 'itemNum', headerName: 'Item Num', minWidth: 130 },
      { field: 'itemFamily', headerName: 'Item Family', minWidth: 150 },
      { field: 'itemCategory', headerName: 'Item Category', minWidth: 160 },
      { field: 'itemGroup', headerName: 'Item Group', minWidth: 150 },
      { field: 'itemSubCategory', headerName: 'Item Sub Category', minWidth: 190 },
      { field: 'likeItemGroup', headerName: 'Like Item Group', minWidth: 170 },
      { field: 'itemDescription', headerName: 'Item Description', minWidth: 210 },
      { field: 'itemSegmentation', headerName: 'Item Segmentation', minWidth: 180 },
      { field: 'finalBaseMargin', headerName: 'Final Base Margin', minWidth: 170 },
      { field: 'finalTargetMargin', headerName: 'Final Target Margin', minWidth: 180 },
      { field: 'finalPremiumMargin', headerName: 'Final Premium Margin', minWidth: 190 }
    ].map((column) => this.buildFilterableColumn(column));
  },

  parameterSortFieldMap() {
    return {
      effectiveDate: 'effective_date',
      terminationDate: 'termination_date',
      prcaMinThreshold: 'prca_min_threshold',
      dedupMethod: 'dedup_method'
    };
  },

  outputSortFieldMap() {
    return {
      prcaNum: 'prca_num',
      customerCluster: 'customer_cluster',
      effectiveDate: 'effective_date',
      terminationDate: 'termination_date',
      itemNum: 'item_num',
      itemFamily: 'item_family',
      itemCategory: 'item_category',
      itemGroup: 'item_group',
      itemSubCategory: 'item_sub_category',
      likeItemGroup: 'like_item_group',
      itemDescription: 'item_description',
      itemSegmentation: 'item_segmentation',
      finalBaseMargin: 'final_base_margin',
      finalTargetMargin: 'final_target_margin',
      finalPremiumMargin: 'final_premium_margin'
    };
  },

  buildParameterRows(count) {
    const methods = ['Highest PRCA', 'Lowest PRCA', 'Latest Effective', 'Manual Override'];
    return Array.from({ length: count }, (_, index) => ({
      effectiveDate: `0${(index % 9) + 1}/01/2026`,
      terminationDate: `12/${String(20 + (index % 8)).padStart(2, '0')}/2026`,
      prcaMinThreshold: (5 + index * 0.75).toFixed(2),
      dedupMethod: methods[index % methods.length]
    }));
  },

  buildOutputRows(count) {
    const categories = ['Surgical', 'Lab', 'Office', 'Pharma'];
    const groups = ['Group A', 'Group B', 'Group C'];
    const segments = ['Core', 'Value', 'Strategic'];

    return Array.from({ length: count }, (_, index) => ({
      prcaNum: `PRCA-${1200 + index}`,
      customerCluster: `Cluster ${String.fromCharCode(65 + (index % 5))}`,
      effectiveDate: `01/${String((index % 27) + 1).padStart(2, '0')}/2026`,
      terminationDate: `12/${String((index % 27) + 1).padStart(2, '0')}/2026`,
      itemNum: `${500000 + index}`,
      itemFamily: `Family ${1 + (index % 7)}`,
      itemCategory: categories[index % categories.length],
      itemGroup: groups[index % groups.length],
      itemSubCategory: `SubCat ${1 + (index % 6)}`,
      likeItemGroup: `Like Group ${1 + (index % 4)}`,
      itemDescription: `KVI Recommended Item ${index + 1}`,
      itemSegmentation: segments[index % segments.length],
      finalBaseMargin: `${(12 + (index % 9) * 0.9).toFixed(2)}%`,
      finalTargetMargin: `${(15 + (index % 10) * 0.8).toFixed(2)}%`,
      finalPremiumMargin: `${(18 + (index % 11) * 0.85).toFixed(2)}%`
    }));
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

    // Backend contract for KVI output supports eq/gt/gte/ls/lte/like/neq.
    // Fall back by field type when AG Grid sends unknown operator names.
    if (field === 'effective_date' || field === 'termination_date') return 'eq';
    return 'like';
  },

  transformParameterRow(row) {
    if (!row || typeof row !== 'object') return row;
    return {
      ...row,
      effectiveDate: this.formatDateValue(row.effectiveDate || row.effective_date),
      terminationDate: this.formatDateValue(row.terminationDate || row.termination_date),
      prcaMinThreshold: row.prcaMinThreshold ?? row.prca_min_threshold,
      dedupMethod: row.dedupMethod ?? row.dedup_method
    };
  },

  transformOutputRow(row) {
    if (!row || typeof row !== 'object') return row;
    return {
      ...row,
      effectiveDate: this.formatIsoDate(row.effectiveDate),
      terminationDate: this.formatIsoDate(row.terminationDate)
    };
  },

  getFieldFilterKind(field) {
    const normalizedField = String(field || '').trim();

    if (['effectiveDate', 'terminationDate'].includes(normalizedField)) {
      return 'date';
    }

    if (
      [
        'prcaMinThreshold',
        'itemNum',
        'finalBaseMargin',
        'finalTargetMargin',
        'finalPremiumMargin'
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
            this.syncNoRowsOverlay(
              params.api,
              tabConfig.gridElementId === 'kviParameterGrid' ? 'parameter' : 'output',
              rows.length
            );
            requestAnimationFrame(() => {
              this.setGridEmptyState(
                tabConfig.gridElementId === 'kviParameterGrid' ? 'parameter' : 'output',
                params.startRow === 0 && rows.length === 0 ? 'empty' : 'hidden'
              );
            });
          })
          .catch((error) => {
            console.error('KVI datasource fetch failed:', error);
            params.failCallback();
            this.syncNoRowsOverlay(
              params.api,
              tabConfig.gridElementId === 'kviParameterGrid' ? 'parameter' : 'output',
              0
            );
            requestAnimationFrame(() => {
              this.setGridEmptyState(
                tabConfig.gridElementId === 'kviParameterGrid' ? 'parameter' : 'output',
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
  KviRecommendationLogicPage.init();
});
