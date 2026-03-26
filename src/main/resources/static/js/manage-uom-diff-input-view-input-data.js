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

class UomDiffManualFloatingFilter {
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
    const parsedInput = UomDiffPage.parseInlineFilterExpression(value, fallbackOperator);

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

const UomDiffPage = {
  activeTab: 'control',
  grids: {},
  toolbarScope: '.screen-page-shell',
  gridManagerBootstrapped: false,
  gridManagerInitScheduled: false,
  apiBaseUrl: '',
  controlApiEndpoint: '/api/v1/gm-uom-diff-input-control/paginated',
  controlDownloadEndpoint: '/api/v1/gm-uom-diff-input-control/download',
  exclusionApiEndpoint: '/api/v1/gm-uom-diff-input-exclusion/paginated',
  exclusionDownloadEndpoint: '/api/v1/gm-uom-diff-input-exclusion/download',
  mainApiEndpoint: '/api/v1/gm-uom-diff-input-main/paginated',
  mainDownloadEndpoint: '/api/v1/gm-uom-diff-input-main/download',
  transactionApiEndpoint: '/api/v1/gm-uom-diff-input-transactionlvl/paginated',
  transactionDownloadEndpoint: '/api/v1/gm-uom-diff-input-transactionlvl/download',
  exclusionUpdateEndpoint: '/api/v1/gm-uom-diff-input-exclusion/updateGmUomDiffInputExclusion',
  pendingTerminationUpdateIds: [],

  init() {
    this.apiBaseUrl = String(window.API_BASE_URL || '').trim().replace(/\/$/, '');
    this.activeTab = this.resolveInitialTab();
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

  resolveInitialTab() {
    const params = new URLSearchParams(window.location.search || '');
    const requestedTab = String(params.get('tab') || '').trim().toLowerCase();
    if (['control', 'exclusion', 'main', 'transaction'].includes(requestedTab)) {
      return requestedTab;
    }
    return 'control';
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
        const ids = this.getSelectedIds();
        if (!ids.length) {
          this.showInfo('Select at least one row to update termination date.', 'error');
          return;
        }
        this.openUpdateTerminationModal(ids);
      });
    });

    this.pageShell.querySelectorAll('.gt-action-btn[data-action="refresh"]').forEach((button) => {
      button.addEventListener('click', () => this.resetActiveGridState());
    });

    this.pageShell.querySelectorAll('.gt-action-btn[data-action="execute"]').forEach((button) => {
      button.addEventListener('click', () => {
        const activeGrid = this.getActiveGrid();
        if (!activeGrid?.api) return;
        if (typeof activeGrid.api.applyPendingFloatingFilters === 'function') {
          activeGrid.api.applyPendingFloatingFilters();
          return;
        }
        if (this.activeTab === 'control') {
          this.loadControlGridData();
          return;
        }
        if (this.activeTab === 'exclusion') {
          this.loadExclusionGridData();
          return;
        }
        if (this.activeTab === 'main') {
          this.loadMainGridData();
          return;
        }
        if (this.activeTab === 'transaction') {
          this.loadTransactionGridData();
          return;
        }
        if (typeof activeGrid.api.onFilterChanged === 'function') {
          activeGrid.api.onFilterChanged();
        }
      });
    });

    this.pageShell.querySelectorAll('.gt-view-btn[data-density]').forEach((button) => {
      button.addEventListener('click', () => this.applyDensity(button.dataset.density));
    });

    const downloadBtn = this.pageShell.querySelector('.gt-view-btn[data-action="download"]');
    downloadBtn?.addEventListener('click', () => this.handleDownloadAction());

    this.cacheUpdateTerminationModalElements();
    this.updateTerminationCancelBtn?.addEventListener('click', () => this.closeUpdateTerminationModal());
    this.updateTerminationCloseEls?.forEach((el) =>
      el.addEventListener('click', () => this.closeUpdateTerminationModal())
    );
    this.updateTerminationDatePickerBtn?.addEventListener('click', () => this.openTerminationDatePicker());
    this.updateTerminationDateNativeInput?.addEventListener('change', () => this.syncTerminationDateFromNativePicker());
    this.updateTerminationSaveBtn?.addEventListener('click', () => this.handleUpdateTerminationDateSave());
    this.updateTerminationDateInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.closeUpdateTerminationModal();
    });
    this.updateTerminationDateInput?.addEventListener('input', () => {
      if (this.updateTerminationDateInput?.value.trim()) this.clearUpdateTerminationInlineError();
    });
    this.updateTerminationNotesInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.closeUpdateTerminationModal();
      if (event.key === 'Enter') this.handleUpdateTerminationDateSave();
    });
    this.updateTerminationNotesInput?.addEventListener('input', () => {
      if (this.updateTerminationNotesInput?.value.trim()) this.clearUpdateTerminationInlineError();
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
        rowData: [],
        rowSelection: 'single',
        suppressRowClickSelection: true
      },
      exclusion: {
        gridElementId: 'uomDiffExclusionGrid',
        columns: this.exclusionColumns(),
        rowData: [],
        rowSelection: 'multiple',
        suppressRowClickSelection: true
      },
      main: {
        gridElementId: 'uomDiffDataMainGrid',
        columns: this.mainColumns(),
        rowData: [],
        rowSelection: 'single',
        suppressRowClickSelection: true
      },
      transaction: {
        gridElementId: 'uomDiffTransactionGrid',
        columns: this.transactionColumns(),
        rowData: [],
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
      suppressNoRowsOverlay: true,
      suppressCellFocus: false,
      onCellValueChanged: (event) => this.handleCellValueChanged(tabKey, event),
      onSortChanged: () => {
        if (tabKey === 'control') this.loadControlGridData();
        if (tabKey === 'exclusion') this.loadExclusionGridData();
        if (tabKey === 'main') this.loadMainGridData();
        if (tabKey === 'transaction') this.loadTransactionGridData();
      },
      onGridReady: () => {
        this.refreshActiveGridLayout();
        if (tabKey === 'control') this.loadControlGridData();
        if (tabKey === 'exclusion') this.loadExclusionGridData();
        if (tabKey === 'main') this.loadMainGridData();
        if (tabKey === 'transaction') this.loadTransactionGridData();
      },
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
      components: {
        manualApplyFloatingFilter: UomDiffManualFloatingFilter
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

    if (gridApi) {
      gridApi.applyPendingFloatingFilters = () => this.applyPendingFilters();
    }

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

  getSelectedRows() {
    const activeGrid = this.getActiveGrid();
    if (!activeGrid?.api || typeof activeGrid.api.getSelectedRows !== 'function') return [];
    return activeGrid.api.getSelectedRows().filter(Boolean);
  },

  getSelectedIds() {
    return this.getSelectedRows()
      .map((row) => row?.uniqueId)
      .filter((value) => value != null && String(value).trim() !== '');
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
    if (this.activeTab === 'control') {
      this.loadControlGridData();
    }
    if (this.activeTab === 'exclusion') {
      this.loadExclusionGridData();
    }
    if (this.activeTab === 'main') {
      this.loadMainGridData();
    }
    if (this.activeTab === 'transaction') {
      this.loadTransactionGridData();
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

  async fetchJson(endpoint, options = {}) {
    const response = await fetch(endpoint, options);
    const text = await response.text();
    let payload = {};
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (error) {
        payload = { message: text };
      }
    }
    if (!response.ok) {
      const message = payload?.message || payload?.error || `Request failed: ${response.status}`;
      const err = new Error(message);
      err.status = response.status;
      throw err;
    }
    return payload;
  },

  cacheUpdateTerminationModalElements() {
    if (this.updateTerminationModal) return;
    this.updateTerminationModal = document.getElementById('updateTerminationDateModal');
    this.updateTerminationDialog = this.updateTerminationModal?.querySelector('.mf-action-modal__dialog');
    this.updateTerminationDateInput = document.getElementById('updateTerminationDateInput');
    this.updateTerminationDateNativeInput = document.getElementById('updateTerminationDateNativeInput');
    this.updateTerminationDatePickerBtn =
      this.updateTerminationModal?.querySelector('[data-action="open-termination-date-picker"]');
    this.updateTerminationNotesInput = document.getElementById('updateTerminationNotesInput');
    this.updateTerminationErrorMessage = document.getElementById('updateTerminationErrorMessage');
    this.updateTerminationSaveBtn =
      this.updateTerminationModal?.querySelector('[data-action="save-update-termination-modal"]');
    this.updateTerminationCancelBtn =
      this.updateTerminationModal?.querySelector('[data-action="cancel-update-termination-modal"]');
    this.updateTerminationCloseEls = this.updateTerminationModal
      ? Array.from(this.updateTerminationModal.querySelectorAll('[data-action="close-update-termination-modal"]'))
      : [];
  },

  showUpdateTerminationInlineError(message) {
    if (this.updateTerminationErrorMessage) {
      this.updateTerminationErrorMessage.textContent = message;
      this.updateTerminationErrorMessage.hidden = false;
    }
    this.updateTerminationDialog?.classList.add('has-inline-error');
  },

  clearUpdateTerminationInlineError() {
    if (this.updateTerminationErrorMessage) {
      this.updateTerminationErrorMessage.textContent = '';
      this.updateTerminationErrorMessage.hidden = true;
    }
    this.updateTerminationDialog?.classList.remove('has-inline-error');
  },

  openUpdateTerminationModal(ids) {
    this.cacheUpdateTerminationModalElements();
    if (!this.updateTerminationModal) return;
    this.pendingTerminationUpdateIds = ids;
    if (this.updateTerminationDateInput) this.updateTerminationDateInput.value = '';
    if (this.updateTerminationDateNativeInput) this.updateTerminationDateNativeInput.value = '';
    if (this.updateTerminationNotesInput) this.updateTerminationNotesInput.value = '';
    this.clearUpdateTerminationInlineError();
    this.updateTerminationModal.hidden = false;
    this.updateTerminationDateInput?.focus();
  },

  closeUpdateTerminationModal() {
    this.cacheUpdateTerminationModalElements();
    if (!this.updateTerminationModal) return;
    this.updateTerminationModal.hidden = true;
    this.pendingTerminationUpdateIds = [];
    if (this.updateTerminationDateInput) this.updateTerminationDateInput.value = '';
    if (this.updateTerminationDateNativeInput) this.updateTerminationDateNativeInput.value = '';
    if (this.updateTerminationNotesInput) this.updateTerminationNotesInput.value = '';
    this.clearUpdateTerminationInlineError();
  },

  getTodayDateOnly() {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  },

  parseMmDdYyyyDate(value) {
    const match = String(value || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return null;
    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (
      Number.isNaN(date.getTime())
      || date.getFullYear() !== year
      || date.getMonth() !== month - 1
      || date.getDate() !== day
    ) {
      return null;
    }
    return date;
  },

  formatDateAsMmDdYyyy(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  },

  formatDateAsIso(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  },

  openTerminationDatePicker() {
    this.cacheUpdateTerminationModalElements();
    if (!this.updateTerminationDateNativeInput) return;
    this.updateTerminationDateNativeInput.min = this.formatDateAsIso(this.getTodayDateOnly());
    const currentValue = this.updateTerminationDateInput?.value.trim();
    const parsedDate = currentValue ? this.parseMmDdYyyyDate(currentValue) : null;
    if (parsedDate) {
      this.updateTerminationDateNativeInput.value = this.formatDateAsIso(parsedDate);
    }
    if (typeof this.updateTerminationDateNativeInput.showPicker === 'function') {
      this.updateTerminationDateNativeInput.showPicker();
    } else {
      this.updateTerminationDateNativeInput.click();
    }
  },

  syncTerminationDateFromNativePicker() {
    const value = this.updateTerminationDateNativeInput?.value;
    if (!value) return;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, (month || 1) - 1, day || 1);
    if (this.updateTerminationDateInput) {
      this.updateTerminationDateInput.value = this.formatDateAsMmDdYyyy(date);
    }
  },

  resolveApiUrl(path) {
    const normalizedPath = String(path || '').trim();
    if (!normalizedPath) return this.apiBaseUrl;
    if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
    return `${this.apiBaseUrl}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`;
  },

  extractPagePayload(payload) {
    if (payload?.data && typeof payload.data === 'object') return payload.data;
    return payload;
  },

  normalizeControlRow(row) {
    return {
      uniqueId: row?.uniqueId ?? null,
      uomDiffInputUpdateDate: this.toUsDate(row?.uomDiffInputUpdateDate),
      uomDiffInputIncludeMonth: this.normalizeMonthDisplay(row?.uomDiffInputIncludeMonth),
      _controlMonthInvalid: false
    };
  },

  normalizeExclusionRow(row) {
    return {
      uniqueId: row?.uniqueId ?? null,
      organization: String(row?.organization ?? '').trim(),
      itemDiscontinuedFlag: String(row?.itemDiscontinuedFlag ?? '').trim(),
      invalidPrcaFlag: String(row?.invalidPrcaFlag ?? '').trim(),
      histRevenue: row?.histRevenue ?? '',
      disableDate: this.toUsDate(row?.disableDate),
      notes: String(row?.notes ?? row?.note ?? '').trim(),
      effectiveDate: this.toUsDate(row?.effectiveDate),
      terminationDate: this.toUsDate(row?.terminationDate)
    };
  },

  normalizeMainRow(row) {
    const uomStructureRaw = String(row?.uomStructure ?? '').trim();
    return {
      uniqueId: row?.uniqueId ?? null,
      uomDiffInputUpdateDate: this.toUsDate(row?.uomDiffInputUpdateDate),
      itemNum: row?.itemNum ?? '',
      uomStructure: uomStructureRaw.toLowerCase() === 'null' ? '' : uomStructureRaw,
      fromUom: String(row?.fromUom ?? '').trim(),
      toUom: String(row?.toUom ?? '').trim(),
      convFactorFromTo: row?.convFactorFromTo ?? '',
      convFactorFromPri: row?.convFactorFromPri ?? ''
    };
  },

  normalizeTransactionRow(row) {
    return {
      uniqueId: row?.uniqueId ?? null,
      uomDiffInputUpdateDate: this.toUsDate(row?.uomDiffInputUpdateDate),
      orderCompany: String(row?.orderCompany ?? '').trim(),
      orderNumber: String(row?.orderNumber ?? '').trim(),
      orderType: String(row?.orderType ?? '').trim(),
      lineNumber: row?.lineNumber ?? '',
      orderDate: this.toUsDate(row?.orderDate),
      prcaNum: row?.prcaNum ?? '',
      organization: String(row?.organization ?? '').trim(),
      invalidPrcaFlag: String(row?.invalidPrcaFlag ?? '').trim(),
      itemNum: row?.itemNum ?? '',
      itemDiscontinuedFlag: String(row?.itemDiscontinuedFlag ?? '').trim(),
      priceAsOfDate: this.toUsDate(row?.priceAsOfDate),
      uos: String(row?.uos ?? '').trim(),
      shippedQty: row?.shippedQty ?? '',
      histUnitPrice: row?.histUnitPrice ?? '',
      histExtendedPrice: row?.histExtendedPrice ?? ''
    };
  },

  toUsDate(value) {
    const raw = String(value || '').trim();
    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/);
    if (!isoMatch) return raw;
    return `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1]}`;
  },

  toIsoDate(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const usMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (usMatch) return `${usMatch[3]}-${usMatch[1]}-${usMatch[2]}`;
    return raw;
  },

  normalizeMonthDisplay(value) {
    const numeric = Number(value);
    if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 12) {
      return String(numeric).padStart(2, '0');
    }
    return String(value ?? '').trim();
  },

  getControlRequestParams() {
    const activeGrid = this.grids.control;
    const sortModel = activeGrid?.api?.getColumnState?.() || [];
    const sortedColumn = sortModel.find((column) => column.sort);
    const filterModel = activeGrid?.api?.getFilterModel?.() || {};
    const params = new URLSearchParams({
      page: '0',
      size: '10',
      sortBy: sortedColumn?.colId || 'uniqueId',
      sortDirection: String(sortedColumn?.sort || 'asc').toUpperCase()
    });

    Object.entries(filterModel).forEach(([field, model]) => {
      const normalized = this.normalizeControlFilterModel(model);
      if (!normalized) return;
      params.set(field, normalized.value);
      params.set(`${field}_op`, normalized.operator);
    });

    return params;
  },

  getExclusionRequestParams() {
    const activeGrid = this.grids.exclusion;
    const sortModel = activeGrid?.api?.getColumnState?.() || [];
    const sortedColumn = sortModel.find((column) => column.sort);
    const filterModel = activeGrid?.api?.getFilterModel?.() || {};
    const params = new URLSearchParams({
      page: '0',
      size: '10',
      sortBy: sortedColumn?.colId || 'uniqueId',
      sortDirection: String(sortedColumn?.sort || 'asc').toUpperCase()
    });

    Object.entries(filterModel).forEach(([field, model]) => {
      const normalized = this.normalizeControlFilterModel(model);
      if (!normalized) return;
      params.set(field, normalized.value);
      params.set(`${field}_op`, normalized.operator);
    });

    return params;
  },

  getMainRequestParams() {
    const activeGrid = this.grids.main;
    const sortModel = activeGrid?.api?.getColumnState?.() || [];
    const sortedColumn = sortModel.find((column) => column.sort);
    const filterModel = activeGrid?.api?.getFilterModel?.() || {};
    const params = new URLSearchParams({
      page: '0',
      size: '10',
      sortBy: sortedColumn?.colId || 'uniqueId',
      sortDirection: String(sortedColumn?.sort || 'asc').toUpperCase()
    });

    Object.entries(filterModel).forEach(([field, model]) => {
      const normalized = this.normalizeControlFilterModel(model);
      if (!normalized) return;
      params.set(field, normalized.value);
      params.set(`${field}_op`, normalized.operator);
    });

    return params;
  },

  getTransactionRequestParams() {
    const activeGrid = this.grids.transaction;
    const sortModel = activeGrid?.api?.getColumnState?.() || [];
    const sortedColumn = sortModel.find((column) => column.sort);
    const filterModel = activeGrid?.api?.getFilterModel?.() || {};
    const params = new URLSearchParams({
      page: '0',
      size: '10',
      sortBy: sortedColumn?.colId || 'uniqueId',
      sortDirection: String(sortedColumn?.sort || 'asc').toUpperCase()
    });

    Object.entries(filterModel).forEach(([field, model]) => {
      const normalized = this.normalizeControlFilterModel(model);
      if (!normalized) return;
      params.set(field, normalized.value);
      params.set(`${field}_op`, normalized.operator);
    });

    return params;
  },

  normalizeControlFilterModel(model) {
    if (!model || typeof model !== 'object') return null;
    const type = String(model.type || '').trim();
    const filterType = String(model.filterType || '').trim();
    let value = filterType === 'date' ? model.dateFrom : model.filter;
    if (value == null || value === '') return null;

    if (filterType === 'date') {
      value = this.toIsoDate(value);
    }

    const operatorMap = {
      equals: 'equals',
      notEqual: 'notEqual',
      greaterThan: 'greaterThan',
      greaterThanOrEqual: 'greaterThanOrEqual',
      lessThan: 'lessThan',
      lessThanOrEqual: 'lessThanOrEqual',
      contains: 'contains'
    };

    return {
      value: String(value).trim(),
      operator: operatorMap[type] || 'equals'
    };
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
      if (this.activeTab === 'control') {
        this.loadControlGridData();
      } else if (this.activeTab === 'exclusion') {
        this.loadExclusionGridData();
      } else if (this.activeTab === 'main') {
        this.loadMainGridData();
      } else if (this.activeTab === 'transaction') {
        this.loadTransactionGridData();
      } else if (typeof gridApi.onFilterChanged === 'function') {
        gridApi.onFilterChanged();
      }
      return;
    }

    gridApi.setFilterModel(nextModel);
    if (this.activeTab === 'control') {
      this.loadControlGridData();
    } else if (this.activeTab === 'exclusion') {
      this.loadExclusionGridData();
    } else if (this.activeTab === 'main') {
      this.loadMainGridData();
    } else if (this.activeTab === 'transaction') {
      this.loadTransactionGridData();
    }
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
      const apiDate = this.toIsoDate(value);
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

  async loadControlGridData() {
    const controlGrid = this.grids.control;
    if (!controlGrid?.api) return;

    try {
      const response = await fetch(`${this.resolveApiUrl(this.controlApiEndpoint)}?${this.getControlRequestParams().toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`Failed to load UOM Diff Input Control (${response.status})`);
      }

      const payload = await response.json();
      const pagePayload = this.extractPagePayload(payload);
      const rows = Array.isArray(pagePayload?.content)
        ? pagePayload.content.map((row) => this.normalizeControlRow(row))
        : [];

      controlGrid.api.setGridOption('rowData', rows);
      this.setGridEmptyState('control', rows.length > 0 ? 'data' : 'empty');
      this.refreshActiveGridLayout();
    } catch (error) {
      console.error('Failed to load UOM Diff Input Control:', error);
      controlGrid.api.setGridOption('rowData', []);
      this.setGridEmptyState('control', 'empty');
      this.showInfo(error?.message || 'Failed to load UOM Diff Input Control.', 'error');
    }
  },

  async loadExclusionGridData() {
    const exclusionGrid = this.grids.exclusion;
    if (!exclusionGrid?.api) return;

    try {
      const response = await fetch(`${this.resolveApiUrl(this.exclusionApiEndpoint)}?${this.getExclusionRequestParams().toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`Failed to load UOM Diff Input Exclusion (${response.status})`);
      }

      const payload = await response.json();
      const pagePayload = this.extractPagePayload(payload);
      const rows = Array.isArray(pagePayload?.content)
        ? pagePayload.content.map((row) => this.normalizeExclusionRow(row))
        : [];

      exclusionGrid.api.setGridOption('rowData', rows);
      this.setGridEmptyState('exclusion', rows.length > 0 ? 'data' : 'empty');
      this.refreshActiveGridLayout();
    } catch (error) {
      console.error('Failed to load UOM Diff Input Exclusion:', error);
      exclusionGrid.api.setGridOption('rowData', []);
      this.setGridEmptyState('exclusion', 'empty');
      this.showInfo(error?.message || 'Failed to load UOM Diff Input Exclusion.', 'error');
    }
  },

  async loadMainGridData() {
    const mainGrid = this.grids.main;
    if (!mainGrid?.api) return;

    try {
      const response = await fetch(`${this.resolveApiUrl(this.mainApiEndpoint)}?${this.getMainRequestParams().toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`Failed to load UOM Diff Input Main (${response.status})`);
      }

      const payload = await response.json();
      const pagePayload = this.extractPagePayload(payload);
      const rows = Array.isArray(pagePayload?.content)
        ? pagePayload.content.map((row) => this.normalizeMainRow(row))
        : [];

      mainGrid.api.setGridOption('rowData', rows);
      this.setGridEmptyState('main', rows.length > 0 ? 'data' : 'empty');
      this.refreshActiveGridLayout();
    } catch (error) {
      console.error('Failed to load UOM Diff Input Main:', error);
      mainGrid.api.setGridOption('rowData', []);
      this.setGridEmptyState('main', 'empty');
      this.showInfo(error?.message || 'Failed to load UOM Diff Input Main.', 'error');
    }
  },

  async loadTransactionGridData() {
    const transactionGrid = this.grids.transaction;
    if (!transactionGrid?.api) return;

    try {
      const response = await fetch(`${this.resolveApiUrl(this.transactionApiEndpoint)}?${this.getTransactionRequestParams().toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`Failed to load UOM Diff Input Transaction LVL (${response.status})`);
      }

      const payload = await response.json();
      const pagePayload = this.extractPagePayload(payload);
      const rows = Array.isArray(pagePayload?.content)
        ? pagePayload.content.map((row) => this.normalizeTransactionRow(row))
        : [];

      transactionGrid.api.setGridOption('rowData', rows);
      this.setGridEmptyState('transaction', rows.length > 0 ? 'data' : 'empty');
      this.refreshActiveGridLayout();
    } catch (error) {
      console.error('Failed to load UOM Diff Input Transaction LVL:', error);
      transactionGrid.api.setGridOption('rowData', []);
      this.setGridEmptyState('transaction', 'empty');
      this.showInfo(error?.message || 'Failed to load UOM Diff Input Transaction LVL.', 'error');
    }
  },

  async handleDownloadAction() {
    if (!['control', 'exclusion', 'main', 'transaction'].includes(this.activeTab)) {
      this.showInfo('CSV download is not configured for this tab yet.', 'warning');
      return;
    }

    try {
      let endpoint = this.controlDownloadEndpoint;
      let params = this.getControlRequestParams();

      if (this.activeTab === 'exclusion') {
        endpoint = this.exclusionDownloadEndpoint;
        params = this.getExclusionRequestParams();
      } else if (this.activeTab === 'main') {
        endpoint = this.mainDownloadEndpoint;
        params = this.getMainRequestParams();
      } else if (this.activeTab === 'transaction') {
        endpoint = this.transactionDownloadEndpoint;
        params = this.getTransactionRequestParams();
      }

      const response = await fetch(`${this.resolveApiUrl(endpoint)}?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: '*/*' },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`Download failed (${response.status})`);
      }

      const blob = await response.blob();
      const fallbackFileNames = {
        control: 'gm_uom_diff_input_control.csv',
        exclusion: 'gm_uom_diff_input_exclusion.csv',
        main: 'gm_uom_diff_input_main.csv',
        transaction: 'gm_uom_diff_input_transactionlvl.csv'
      };
      const fileName = this.getDownloadFileNameFromResponse(response)
        || fallbackFileNames[this.activeTab]
        || 'download.csv';
      this.triggerFileDownload(blob, fileName);
    } catch (error) {
      console.error(`UOM Diff ${this.activeTab} download failed:`, error);
      this.showInfo(error?.message || 'Download failed.', 'error');
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

  async handleUpdateTerminationDateSave() {
    const ids = this.pendingTerminationUpdateIds || [];
    if (!ids.length) {
      this.closeUpdateTerminationModal();
      return;
    }
    const dateText = (this.updateTerminationDateInput?.value ?? '').trim();
    const notes = (this.updateTerminationNotesInput?.value ?? '').trim();
    if (!dateText) {
      this.showUpdateTerminationInlineError('Termination Date is required.');
      this.updateTerminationDateInput?.focus();
      return;
    }
    if (!notes) {
      this.showUpdateTerminationInlineError('A note is required to update termination date.');
      this.updateTerminationNotesInput?.focus();
      return;
    }
    const parsedDate = this.parseMmDdYyyyDate(dateText);
    if (!parsedDate) {
      this.showUpdateTerminationInlineError('Termination Date must be in MM/DD/YYYY format.');
      this.updateTerminationDateInput?.focus();
      return;
    }
    if (parsedDate < this.getTodayDateOnly()) {
      this.showUpdateTerminationInlineError('Termination Date must be today or a future date.');
      this.updateTerminationDateInput?.focus();
      return;
    }

    this.clearUpdateTerminationInlineError();
    try {
      if (this.updateTerminationSaveBtn) this.updateTerminationSaveBtn.disabled = true;
      await this.fetchJson(this.resolveApiUrl(this.exclusionUpdateEndpoint), {
        method: 'PATCH',
        headers: {
          Accept: '*/*',
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          ids,
          notes,
          terminationDate: this.formatDateAsMmDdYyyy(parsedDate)
        })
      });
      this.closeUpdateTerminationModal();
      await this.loadExclusionGridData();
      this.showInfo('Termination date updated successfully.', 'success');
    } catch (error) {
      console.error('UOM Diff exclusion update termination failed:', error);
      this.showInfo(error?.message || 'Failed to update termination date.', 'error');
    } finally {
      if (this.updateTerminationSaveBtn) this.updateTerminationSaveBtn.disabled = false;
    }
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
      floatingFilter: true,
      floatingFilterComponent: 'manualApplyFloatingFilter'
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
        'disableDate',
        'orderDate',
        'priceAsOfDate'
      ].includes(normalizedField)
    ) {
      return 'date';
    }

    if (
      [
        'uomDiffInputIncludeMonth',
        'histRevenue',
        'itemNum',
        'uomStructure',
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
      { field: 'organization', headerName: 'Organization', minWidth: 170 },
      { field: 'effectiveDate', headerName: 'Effective Date', minWidth: 170 },
      { field: 'terminationDate', headerName: 'Termination Date', minWidth: 190 },
      { field: 'itemDiscontinuedFlag', headerName: 'Item Discontinued Flag', minWidth: 220 },
      { field: 'invalidPrcaFlag', headerName: 'Invalid PRCA Flag', minWidth: 180 },
      { field: 'histRevenue', headerName: 'Hist Revenue', minWidth: 160 },
      { field: 'disableDate', headerName: 'Disable Date', minWidth: 170 },
      { field: 'notes', headerName: 'Notes', minWidth: 200 }
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
    return [];
  },

  exclusionRows() {
    return [];
  },

  mainRows() {
    return [];
  },

  transactionRows() {
    return [];
  }
};

document.addEventListener('DOMContentLoaded', () => {
  UomDiffPage.init();
});
