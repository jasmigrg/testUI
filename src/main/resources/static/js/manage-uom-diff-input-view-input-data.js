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
    const pageSize = this.params.api.paginationGetPageSize?.() || 10;
    const currentPage = this.params.api.paginationGetCurrentPage?.() || 0;
    const from = currentPage * pageSize;
    const to = from + pageSize;

    for (let index = from; index < to; index += 1) {
      const rowNode = this.params.api.getDisplayedRowAtIndex(index);
      if (!rowNode) continue;
      if (rowNode.rowPinned || rowNode.group || rowNode.selectable === false) continue;
      rowNode.setSelected(shouldSelect);
    }

    this.syncState();
  }

  syncState() {
    if (!this.checkbox || !this.params?.api) return;

    const pageSize = this.params.api.paginationGetPageSize?.() || 10;
    const currentPage = this.params.api.paginationGetCurrentPage?.() || 0;
    const from = currentPage * pageSize;
    const to = from + pageSize;
    let selectableCount = 0;
    let selectedCount = 0;

    for (let index = from; index < to; index += 1) {
      const rowNode = this.params.api.getDisplayedRowAtIndex(index);
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

const UomDiffPage = {
  activeTab: 'control',
  grids: {},
  toolbarScope: '.screen-page-shell',
  gridManagerBootstrapped: false,
  gridManagerInitScheduled: false,

  init() {
    this.cacheDom();
    this.bindTabs();
    this.bindToolbarActions();
    this.initGridForTab(this.activeTab);
    this.syncTabUi();
    this.syncToolbarForTab();
    this.syncGridManager();
    this.applyActiveDensity();
    this.refreshActiveGridLayout();
  },

  cacheDom() {
    this.pageShell = document.querySelector('.screen-page-shell');
    this.tabButtons = Array.from(document.querySelectorAll('.screen-tab-btn[data-uom-diff-tab]'));
    this.tabPanels = Array.from(document.querySelectorAll('.screen-tab-panel[data-uom-diff-panel]'));
    this.emptyStates = {
      control: document.getElementById('uomDiffControlEmptyState'),
      exclusion: document.getElementById('uomDiffExclusionEmptyState'),
      main: document.getElementById('uomDiffDataMainEmptyState'),
      transaction: document.getElementById('uomDiffTransactionEmptyState')
    };
  },

  bindTabs() {
    this.tabButtons.forEach((button) => {
      button.addEventListener('click', () => this.activateTab(button.getAttribute('data-uom-diff-tab')));
    });
  },

  bindToolbarActions() {
    if (!this.pageShell) return;

    this.pageShell.querySelectorAll('.gt-action-btn[data-action="back"]').forEach((button) => {
      button.addEventListener('click', () => {
        this.showInfo('Main navigation for this screen is still being worked on.', 'warning');
      });
    });

    this.pageShell.querySelectorAll('.gt-action-btn[data-action="favorite"]').forEach((button) => {
      button.addEventListener('click', () => {
        this.showInfo('Favorite action is not configured yet.', 'warning');
      });
    });

    this.pageShell.querySelectorAll('.gt-action-btn[data-action="add"]').forEach((button) => {
      button.addEventListener('click', () => {
        const addUrl = String(window.UOM_DIFF_EXCLUSION_ADD_PAGE_URL || '').trim();
        if (addUrl) {
          window.location.assign(addUrl);
          return;
        }
        this.showInfo('UOM Diff Input Exclusion add screen is not configured yet.', 'warning');
      });
    });

    this.pageShell.querySelectorAll('.gt-action-btn[data-action="disable"]').forEach((button) => {
      button.addEventListener('click', () => {
        this.showInfo('Disable action will be wired once the exclusion APIs are ready.', 'warning');
      });
    });

    this.pageShell.querySelectorAll('.gt-action-btn[data-action="update-termination"]').forEach((button) => {
      button.addEventListener('click', () => {
        this.showInfo('Update Termination Date will be wired once the exclusion APIs are ready.', 'warning');
      });
    });

    this.pageShell.querySelectorAll('.gt-action-btn[data-action="refresh"]').forEach((button) => {
      button.addEventListener('click', () => this.resetActiveGridState());
    });

    this.pageShell.querySelectorAll('.gt-action-btn[data-action="execute"]').forEach((button) => {
      button.addEventListener('click', () => {
        const activeGrid = this.getActiveGrid();
        if (!activeGrid?.api) return;
        if (typeof activeGrid.api.onFilterChanged === 'function') {
          activeGrid.api.onFilterChanged();
        }
      });
    });

    this.pageShell.querySelectorAll('.gt-view-btn[data-density]').forEach((button) => {
      button.addEventListener('click', () => this.applyDensity(button.dataset.density));
    });

    const downloadBtn = this.pageShell.querySelector('.gt-view-btn[data-action="download"]');
    downloadBtn?.addEventListener('click', () => {
      this.showInfo('CSV download will be wired once the UOM Diff export APIs are ready.', 'warning');
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
      const isActive = button.getAttribute('data-uom-diff-tab') === this.activeTab;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', String(isActive));
      button.tabIndex = isActive ? 0 : -1;
    });

    this.tabPanels.forEach((panel) => {
      const isActive = panel.getAttribute('data-uom-diff-panel') === this.activeTab;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
      panel.style.display = isActive ? 'flex' : 'none';
    });
  },

  syncToolbarForTab() {
    if (!this.pageShell) return;

    this.pageShell.querySelectorAll('.uom-diff-tab-action-toolbar[data-uom-diff-actions]').forEach((toolbar) => {
      const isActive = toolbar.getAttribute('data-uom-diff-actions') === this.activeTab;
      toolbar.hidden = !isActive;
      toolbar.style.display = isActive ? 'flex' : 'none';
      toolbar.setAttribute('aria-hidden', String(!isActive));
    });
  },

  initGridForTab(tabKey) {
    if (this.grids[tabKey]?.api) return;

    const configByTab = {
      control: {
        gridElementId: 'uomDiffControlGrid',
        columns: this.controlColumns(),
        rowData: this.controlRows(),
        rowSelection: 'single',
        suppressRowClickSelection: true
      },
      exclusion: {
        gridElementId: 'uomDiffExclusionGrid',
        columns: this.exclusionColumns(),
        rowData: this.exclusionRows(),
        rowSelection: 'multiple',
        suppressRowClickSelection: true
      },
      main: {
        gridElementId: 'uomDiffDataMainGrid',
        columns: this.mainColumns(),
        rowData: this.mainRows(),
        rowSelection: 'single',
        suppressRowClickSelection: true
      },
      transaction: {
        gridElementId: 'uomDiffTransactionGrid',
        columns: this.transactionColumns(),
        rowData: this.transactionRows(),
        rowSelection: 'single',
        suppressRowClickSelection: true
      }
    };

    const tabConfig = configByTab[tabKey];
    if (!tabConfig) return;

    const gridElement = document.getElementById(tabConfig.gridElementId);
    if (!gridElement || !window.agGrid?.createGrid) return;

    const gridApi = window.agGrid.createGrid(gridElement, {
      columnDefs: tabConfig.columns,
      rowData: tabConfig.rowData,
      rowSelection: tabConfig.rowSelection,
      suppressRowClickSelection: tabConfig.suppressRowClickSelection,
      animateRows: false,
      pagination: true,
      paginationPageSize: 10,
      paginationPageSizeSelector: [10, 20, 50],
      suppressCellFocus: false,
      onCellValueChanged: (event) => this.handleCellValueChanged(tabKey, event),
      onGridReady: () => this.refreshActiveGridLayout(),
      onFirstDataRendered: () => this.refreshActiveGridLayout(),
      icons: {
        sortUnSort:
          '<span class="gt-sort-icon gt-sort-icon--none" aria-hidden="true"><svg viewBox="0 0 8 12" focusable="false"><path d="M4 1L7 4H1L4 1Z"></path><path d="M4 11L1 8H7L4 11Z"></path></svg></span>',
        sortAscending:
          '<span class="gt-sort-icon gt-sort-icon--asc" aria-hidden="true"><svg viewBox="0 0 8 12" focusable="false"><path d="M4 1L7 4H1L4 1Z"></path></svg></span>',
        sortDescending:
          '<span class="gt-sort-icon gt-sort-icon--desc" aria-hidden="true"><svg viewBox="0 0 8 12" focusable="false"><path d="M4 11L1 8H7L4 11Z"></path></svg></span>'
      },
      localeText: {
        equals: 'Equals',
        notEqual: 'Does not equal',
        greaterThan: 'Greater than',
        lessThan: 'Less than',
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
        filter: true,
        floatingFilter: true,
        resizable: true,
        wrapHeaderText: true,
        autoHeaderHeight: true,
        filterParams: {
          buttons: ['apply', 'reset'],
          closeOnApply: true,
          maxNumConditions: 1,
          numAlwaysVisibleConditions: 1
        }
      }
    });

    this.grids[tabKey] = {
      api: gridApi,
      element: gridElement,
      gridElementId: tabConfig.gridElementId
    };

    this.setGridEmptyState(tabKey, Array.isArray(tabConfig.rowData) && tabConfig.rowData.length > 0 ? 'data' : 'empty');

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
      if (typeof activeGrid.api.sizeColumnsToFit === 'function') {
        activeGrid.api.sizeColumnsToFit();
      }
    });
  },

  resetActiveGridState() {
    const activeGrid = this.getActiveGrid();
    if (!activeGrid?.api) return;

    const currentFilterModel =
      typeof activeGrid.api.getFilterModel === 'function' ? activeGrid.api.getFilterModel() || {} : {};
    const hasFilters = Object.keys(currentFilterModel).length > 0;
    const currentPage =
      typeof activeGrid.api.paginationGetCurrentPage === 'function'
        ? activeGrid.api.paginationGetCurrentPage()
        : 0;

    if (hasFilters && typeof activeGrid.api.setFilterModel === 'function') {
      activeGrid.api.setFilterModel(null);
    }
    if (currentPage > 0 && typeof activeGrid.api.paginationGoToFirstPage === 'function') {
      activeGrid.api.paginationGoToFirstPage();
    }
    if (typeof activeGrid.api.deselectAll === 'function') {
      activeGrid.api.deselectAll();
    }
    this.refreshActiveGridLayout();
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
    let container = document.getElementById('uomDiffMainPageToastLayer');
    if (container) return container;

    container = document.createElement('div');
    container.id = 'uomDiffMainPageToastLayer';
    container.className = 'app-page-toast-layer';
    document.body.appendChild(container);
    return container;
  },

  handleCellValueChanged(tabKey, event) {
    if (tabKey !== 'control') return;
    if (!event?.data || event.colDef?.field !== 'uomDiffInputIncludeMonth') return;

    const previousValue = String(event.oldValue ?? '').trim();
    const nextValue = String(event.newValue ?? '').trim();
    if (previousValue === nextValue) return;

    if (!this.isValidControlMonth(nextValue)) {
      this.applyControlRowUpdate(event.node, {
        ...event.data,
        uomDiffInputIncludeMonth: nextValue,
        _controlMonthInvalid: true
      });
      this.showInfo('UOM Diff Input Include Month must be a 2-digit month between 01 and 12.', 'error');
      return;
    }

    this.applyControlRowUpdate(event.node, {
      ...event.data,
      uomDiffInputIncludeMonth: nextValue,
      uomDiffInputUpdateDate: this.getTodayUsDate(),
      _controlMonthInvalid: false
    });
  },

  applyControlRowUpdate(rowNode, rowData) {
    if (!rowNode?.data || !rowData) return;
    Object.assign(rowNode.data, {
      uomDiffInputUpdateDate: rowData.uomDiffInputUpdateDate,
      uomDiffInputIncludeMonth: rowData.uomDiffInputIncludeMonth,
      _controlMonthInvalid: Boolean(rowData._controlMonthInvalid)
    });
    rowNode.setData({ ...rowNode.data });
  },

  isValidControlMonth(value) {
    return /^(0[1-9]|1[0-2])$/.test(String(value ?? '').trim());
  },

  getTodayUsDate() {
    const today = new Date();
    return `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
  },

  buildSelectColumn() {
    return {
      field: 'select',
      headerName: '',
      width: 72,
      minWidth: 72,
      maxWidth: 72,
      pinned: 'left',
      lockPinned: true,
      sortable: false,
      filter: false,
      resizable: false,
      suppressMenu: true,
      headerComponent: GtPageSelectHeader,
      checkboxSelection: true
    };
  },

  buildFilterableColumn(column) {
    const field = String(column?.field || '').trim();
    if (!field || field === 'select') return column;

    const kind = this.getFieldFilterKind(field);
    const alignmentClass = kind === 'text' ? 'cell-align-left' : 'cell-align-right';
    const base = {
      ...column,
      cellClass: alignmentClass,
      floatingFilter: true
    };

    if (kind === 'date') {
      return {
        ...base,
        filter: 'agDateColumnFilter',
        filterParams: {
          buttons: ['apply', 'reset'],
          closeOnApply: true,
          maxNumConditions: 1,
          numAlwaysVisibleConditions: 1,
          comparator: this.dateFilterComparator
        }
      };
    }

    if (kind === 'number') {
      return {
        ...base,
        filter: 'agNumberColumnFilter',
        filterParams: {
          buttons: ['apply', 'reset'],
          closeOnApply: true,
          maxNumConditions: 1,
          numAlwaysVisibleConditions: 1
        }
      };
    }

    return {
      ...base,
      filter: 'agTextColumnFilter',
      filterParams: {
        buttons: ['apply', 'reset'],
        closeOnApply: true,
        maxNumConditions: 1,
        numAlwaysVisibleConditions: 1
      }
    };
  },

  dateFilterComparator(filterLocalDateAtMidnight, cellValue) {
    const parts = String(cellValue || '').trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!parts) return 0;
    const cellDate = new Date(Number(parts[3]), Number(parts[1]) - 1, Number(parts[2]));
    const cellTime = cellDate.setHours(0, 0, 0, 0);
    const filterTime = filterLocalDateAtMidnight.setHours(0, 0, 0, 0);
    if (cellTime === filterTime) return 0;
    return cellTime < filterTime ? -1 : 1;
  },

  getFieldFilterKind(field) {
    const normalizedField = String(field || '').trim();

    if (
      [
        'uomDiffInputUpdateDate',
        'effectiveDate',
        'terminationDate',
        'orderDate',
        'priceAsOfDate'
      ].includes(normalizedField)
    ) {
      return 'date';
    }

    if (
      [
        'uomDiffInputIncludeMonth',
        'itemNum',
        'convFactorFromTo',
        'convFactorFromPri',
        'lineNumber',
        'prcaNum',
        'shippedQty',
        'histUnitPrice',
        'histExtendedPrice'
      ].includes(normalizedField)
    ) {
      return 'number';
    }

    return 'text';
  },

  controlColumns() {
    return [
      {
        field: 'uomDiffInputUpdateDate',
        headerName: 'UOM Diff Input Update Date',
        minWidth: 220,
        editable: false
      },
      {
        field: 'uomDiffInputIncludeMonth',
        headerName: 'UOM Diff Input Include Month',
        minWidth: 240,
        editable: true,
        cellClassRules: {
          'uom-diff-cell-error': (params) => Boolean(params?.data?._controlMonthInvalid)
        }
      }
    ].map((column) => this.buildFilterableColumn(column));
  },

  exclusionColumns() {
    return [
      this.buildSelectColumn(),
      { field: 'dataExclusionField', headerName: 'DATA Exclusion Field', minWidth: 220 },
      { field: 'effectiveDate', headerName: 'Effective Date', minWidth: 170 },
      { field: 'terminationDate', headerName: 'Termination Date', minWidth: 190 },
      { field: 'organization', headerName: 'Organization', minWidth: 170 },
      { field: 'itemDiscontinuedFlag', headerName: 'ITEM Discontinued Flag', minWidth: 220 }
    ].map((column) => this.buildFilterableColumn(column));
  },

  mainColumns() {
    return [
      { field: 'uomDiffInputUpdateDate', headerName: 'UOM Diff Input Update Date', minWidth: 220 },
      { field: 'itemNum', headerName: 'Item Num', minWidth: 150 },
      { field: 'uomStructure', headerName: 'UOM Structure', minWidth: 170 },
      { field: 'fromUom', headerName: 'From UOM', minWidth: 150 },
      { field: 'toUom', headerName: 'To UOM', minWidth: 150 },
      { field: 'convFactorFromTo', headerName: 'Conv Factor From/To', minWidth: 210 },
      { field: 'convFactorFromPri', headerName: 'Conv Factor From/PRI', minWidth: 210 }
    ].map((column) => this.buildFilterableColumn(column));
  },

  transactionColumns() {
    return [
      { field: 'uomDiffInputUpdateDate', headerName: 'UOM Diff Input Update Date', minWidth: 220 },
      { field: 'orderCompany', headerName: 'Order Company', minWidth: 150 },
      { field: 'orderNumber', headerName: 'Order Number', minWidth: 160 },
      { field: 'orderType', headerName: 'Order Type', minWidth: 140 },
      { field: 'lineNumber', headerName: 'Line Number', minWidth: 140 },
      { field: 'orderDate', headerName: 'Order Date', minWidth: 150 },
      { field: 'prcaNum', headerName: 'PRCA Num', minWidth: 140 },
      { field: 'organization', headerName: 'Organization', minWidth: 160 },
      { field: 'invalidPrcaFlag', headerName: 'Invalid PRCA Flag', minWidth: 180 },
      { field: 'itemNum', headerName: 'Item Num', minWidth: 150 },
      { field: 'itemDiscontinuedFlag', headerName: 'Item Discontinued Flag', minWidth: 210 },
      { field: 'priceAsOfDate', headerName: 'Price as of Date', minWidth: 170 },
      { field: 'uos', headerName: 'UOS', minWidth: 120 },
      { field: 'shippedQty', headerName: 'Shipped Qty', minWidth: 150 },
      { field: 'histUnitPrice', headerName: 'HIST Unit Price', minWidth: 170 },
      { field: 'histExtendedPrice', headerName: 'HIST Extended Price', minWidth: 190 }
    ].map((column) => this.buildFilterableColumn(column));
  },

  controlRows() {
    return Array.from({ length: 12 }, (_, index) => ({
      uomDiffInputUpdateDate: `03/${String(index + 10).padStart(2, '0')}/2026`,
      uomDiffInputIncludeMonth: String((index % 12) + 1).padStart(2, '0'),
      _controlMonthInvalid: false
    }));
  },

  exclusionRows() {
    return Array.from({ length: 24 }, (_, index) => ({
      dataExclusionField: 'XX',
      effectiveDate: `03/${String((index % 20) + 1).padStart(2, '0')}/2026`,
      terminationDate: `03/${String((index % 20) + 1).padStart(2, '0')}/2029`,
      organization: 'XX',
      itemDiscontinuedFlag: 'XX'
    }));
  },

  mainRows() {
    return Array.from({ length: 24 }, (_, index) => ({
      uomDiffInputUpdateDate: `03/${String((index % 20) + 1).padStart(2, '0')}/2026`,
      itemNum: 1000 + index,
      uomStructure: 'XX',
      fromUom: 'XX',
      toUom: 'XX',
      convFactorFromTo: Number((1.1 + index * 0.05).toFixed(2)),
      convFactorFromPri: Number((0.95 + index * 0.04).toFixed(2))
    }));
  },

  transactionRows() {
    return Array.from({ length: 24 }, (_, index) => ({
      uomDiffInputUpdateDate: `03/${String((index % 20) + 1).padStart(2, '0')}/2026`,
      orderCompany: 'XX',
      orderNumber: 'XX',
      orderType: 'XX',
      lineNumber: index + 1,
      orderDate: `03/${String((index % 20) + 1).padStart(2, '0')}/2026`,
      prcaNum: 5000 + index,
      organization: 'XX',
      invalidPrcaFlag: 'XX',
      itemNum: 1000 + index,
      itemDiscontinuedFlag: 'XX',
      priceAsOfDate: `03/${String((index % 20) + 1).padStart(2, '0')}/2026`,
      uos: 'XX',
      shippedQty: 10 + index,
      histUnitPrice: Number((8.5 + index * 0.15).toFixed(2)),
      histExtendedPrice: Number((85 + index * 2.5).toFixed(2))
    }));
  }
};

document.addEventListener('DOMContentLoaded', () => {
  UomDiffPage.init();
});
