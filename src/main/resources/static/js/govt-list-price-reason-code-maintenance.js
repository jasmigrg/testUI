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

  getSelectableDisplayedRows() {
    if (!this.params?.api || typeof this.params.api.getDisplayedRowCount !== 'function') return [];

    const rows = [];
    const displayedRowCount = this.params.api.getDisplayedRowCount();
    for (let index = 0; index < displayedRowCount; index += 1) {
      const rowNode = this.params.api.getDisplayedRowAtIndex(index);
      if (!rowNode || rowNode.rowPinned || rowNode.group || rowNode.selectable === false) continue;
      rows.push(rowNode);
    }

    return rows;
  }

  toggleVisibleRows() {
    const shouldSelect = this.checkbox.checked;
    const displayedRows = this.getSelectableDisplayedRows();
    displayedRows.forEach((rowNode) => {
      rowNode.setSelected(shouldSelect);
    });

    this.syncState();
  }

  syncState() {
    if (!this.checkbox || !this.params?.api) return;

    const displayedRows = this.getSelectableDisplayedRows();
    const selectableCount = displayedRows.length;
    let selectedCount = 0;

    displayedRows.forEach((rowNode) => {
      if (rowNode.isSelected()) selectedCount += 1;
    });

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

const GovtListPriceReasonCodeMaintenancePage = {
  apiBaseUrl: '',
  listEndpoint: '/api/v1/user-defined-codes',
  deleteEndpoint: '/api/v1/user-defined-codes/bulk-filtered',
  downloadEndpoint: '/api/v1/user-defined-codes/export-filtered',
  productCode: '57',
  userDefinedCodes: 'R0',
  defaultDeleteUserId: 'system',
  gridApi: null,
  gridElement: null,
  pageRequestCache: new Map(),
  currentPageSize: 10,

  init() {
    this.apiBaseUrl = String(window.API_BASE_URL || '').trim();
    this.initGrid();
    this.bindToolbarActions();
    this.initViewActions();
  },

  initGrid() {
    const compactPreset = window.GridToolbar?.DEFAULT_DENSITY_PRESETS?.compact || {
      rowHeight: 40,
      headerHeight: 48,
      floatingFiltersHeight: 38
    };

    this.gridApi = DynamicGrid.createGrid({
      gridElementId: 'govtListPriceReasonCodeGrid',
      paginationType: 'server',
      pageSize: this.currentPageSize,
      floatingFilter: true,
      manualFilterApply: true,
      autoFitColumns: true,
      gridOptions: {
        rowHeight: compactPreset.rowHeight,
        headerHeight: compactPreset.headerHeight,
        floatingFiltersHeight: compactPreset.floatingFiltersHeight,
        rowSelection: 'multiple',
        suppressRowClickSelection: true,
        rowModelType: 'infinite',
        cacheBlockSize: this.currentPageSize,
        maxBlocksInCache: 10,
        onGridReady: (params) => {
          params.api.__lastKnownPageSize = this.currentPageSize;
          params.api.__isUpdatingPageSize = false;
          params.api.setGridOption('datasource', this.buildDatasource());
        },
        onPaginationChanged: (params) => this.handlePageSizeChange(params),
        components: {
          gtPageSelectHeader: GtPageSelectHeader
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
          resizable: true,
          unSortIcon: true,
          suppressFloatingFilterButton: false,
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
      columns: [
        {
          colId: 'select',
          headerName: '',
          checkboxSelection: true,
          headerComponent: 'gtPageSelectHeader',
          width: 52,
          minWidth: 52,
          maxWidth: 52,
          pinned: 'left',
          sortable: false,
          filter: false,
          floatingFilter: false,
          suppressHeaderMenuButton: true,
          resizable: false,
          editable: false,
          cellClass: 'cell-center'
        },
        this.buildColumn('userDefinedCode', 'Codes', 180, {
          sortField: 'id.userDefinedCode'
        }),
        this.buildColumn('description', 'Description 01', 220),
        this.buildColumn('description2', 'Description 02', 220),
        this.buildColumn('specialHandlingCode', 'Special Handling', 190, {
          cellClass: 'cell-center',
          valueFormatter: (params) => this.formatYn(params.value)
        }),
        this.buildColumn('hardCodedYn', 'Hard Coded', 150, {
          cellClass: 'cell-center',
          valueFormatter: (params) => this.formatYn(params.value)
        })
      ]
    });

    this.gridElement = document.getElementById('govtListPriceReasonCodeGrid');
    if (!this.gridApi) return;

    this.gridApi.applyPendingFloatingFilters = () => this.applyPendingFilters();

    setTimeout(() => {
      if (typeof GridManager !== 'undefined') {
        GridManager.init(this.gridApi, 'govtListPriceReasonCodeGrid');
      }
    }, 250);
  },

  buildColumn(field, headerName, minWidth, options = {}) {
    return {
      field,
      colId: field,
      headerName,
      minWidth,
      flex: 1,
      cellClass: options.cellClass || 'cell-left',
      sortField: options.sortField || field,
      valueFormatter: options.valueFormatter,
      filterParams: {
        buttons: ['apply', 'reset'],
        closeOnApply: true,
        maxNumConditions: 1,
        numAlwaysVisibleConditions: 1,
        filterOptions: ['contains', 'notContains', 'equals', 'notEqual']
      }
    };
  },

  buildDatasource() {
    return {
      rowCount: null,
      getRows: async (params) => {
        const pageSize = params.endRow - params.startRow || this.currentPageSize;
        const page = Math.floor((params.startRow || 0) / pageSize);
        const queryParams = this.buildQueryParams({
          page,
          size: pageSize,
          sortModel: params.sortModel,
          filterModel: params.filterModel
        });
        const cacheKey = queryParams.toString();

        try {
          let requestPromise = this.pageRequestCache.get(cacheKey);
          if (!requestPromise) {
            requestPromise = fetch(`${this.resolveApiUrl(this.listEndpoint)}?${cacheKey}`, {
              method: 'GET',
              headers: this.buildHeaders()
            }).then(async (response) => {
              if (!response.ok) {
                const message = await this.readErrorMessage(response, 'Unable to load user defined codes.');
                throw new Error(message);
              }
              return response.json();
            });
            this.pageRequestCache.set(cacheKey, requestPromise);
          }

          const payload = await requestPromise;
          const rows = Array.isArray(payload?.content) ? payload.content : [];
          const total = Number.isFinite(payload?.totalElements) ? payload.totalElements : rows.length;
          params.successCallback(rows, total);
          if (typeof this.gridApi?.hideOverlay === 'function') {
            this.gridApi.hideOverlay();
          }
        } catch (error) {
          this.pageRequestCache.delete(cacheKey);
          console.error(error);
          params.successCallback([], 0);
          if (typeof this.gridApi?.showNoRowsOverlay === 'function') {
            this.gridApi.showNoRowsOverlay();
          }
          this.showInfo(error?.message || 'Unable to load user defined codes.', 'error');
        }
      }
    };
  },

  buildQueryParams({ page = 0, size = this.currentPageSize, sortModel = [], filterModel = {} } = {}) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('size', String(size));

    const primarySort = Array.isArray(sortModel) && sortModel.length > 0 ? sortModel[0] : null;
    if (primarySort?.colId) {
      params.set('sortBy', this.mapSortField(primarySort.colId));
      params.set('sortDirection', String(primarySort.sort || 'asc').toUpperCase());
    }

    this.appendFilterParams(params, filterModel);
    return params;
  },

  appendFilterParams(params, filterModel = {}) {
    Object.entries(filterModel || {}).forEach(([field, model]) => {
      if (!model) return;

      const filterField = this.mapFilterField(field);
      const rawOperator = String(model.type || '').trim();
      const operator = this.mapFilterOperator(rawOperator);
      const transformValue = (value) => this.transformFilterValue(field, value);

      if (model.filterType === 'text') {
        const value = transformValue(model.filter);
        if (!value) return;
        params.set(filterField, value);
        if (operator) params.set(`${filterField}_op`, operator);
        return;
      }

      if (model.filterType === 'number') {
        const value = transformValue(model.filter);
        if (!value) return;
        params.set(filterField, value);
        if (operator) params.set(`${filterField}_op`, operator);
        return;
      }

      if (model.filterType === 'date') {
        const value = transformValue(model.dateFrom);
        if (!value) return;
        params.set(filterField, value);
        if (operator) params.set(`${filterField}_op`, operator);
      }
    });
  },

  mapFilterField(field) {
    return field === 'userDefinedCode' ? 'userDefinedCode' : field;
  },

  mapSortField(field) {
    if (field === 'userDefinedCode') return 'id.userDefinedCode';
    return field;
  },

  mapFilterOperator(operator) {
    const operatorMap = {
      contains: 'contains',
      notContains: 'notContains',
      equals: 'equals',
      notEqual: 'notEqual',
      greaterThan: 'greaterThan',
      lessThan: 'lessThan',
      greaterThanOrEqual: 'greaterThanOrEqual',
      lessThanOrEqual: 'lessThanOrEqual',
      blank: 'blank',
      notBlank: 'notBlank'
    };
    return operatorMap[operator] || operator || '';
  },

  transformFilterValue(field, value) {
    const normalizedValue = String(value ?? '').trim();
    if (!normalizedValue) return '';

    if (field === 'hardCodedYn') {
      if (normalizedValue.toUpperCase() === 'Y') return 'true';
      if (normalizedValue.toUpperCase() === 'N') return 'false';
    }

    return normalizedValue;
  },

  applyPendingFilters() {
    if (!this.gridApi || !Array.isArray(this.gridApi.__manualFloatingFilters)) return;

    const pendingFilters = [...this.gridApi.__manualFloatingFilters];
    pendingFilters.forEach((filterInstance) => {
      if (filterInstance && typeof filterInstance.apply === 'function') {
        filterInstance.apply();
      }
    });
  },

  handlePageSizeChange(params) {
    if (!params?.api || typeof params.api.paginationGetPageSize !== 'function') return;
    if (params.api.__isUpdatingPageSize) return;

    const newPageSize = params.api.paginationGetPageSize();
    const lastKnownPageSize = params.api.__lastKnownPageSize || this.currentPageSize;
    if (!newPageSize || newPageSize === lastKnownPageSize) return;

    params.api.__isUpdatingPageSize = true;
    params.api.__lastKnownPageSize = newPageSize;
    this.currentPageSize = newPageSize;
    this.pageRequestCache = new Map();

    setTimeout(() => {
      if (typeof params.api.updateGridOptions === 'function') {
        params.api.updateGridOptions({ cacheBlockSize: newPageSize });
      } else if (typeof params.api.setGridOption === 'function') {
        params.api.setGridOption('cacheBlockSize', newPageSize);
      }

      const currentPage =
        typeof params.api.paginationGetCurrentPage === 'function'
          ? params.api.paginationGetCurrentPage()
          : 0;

      if (currentPage > 0 && typeof params.api.paginationGoToFirstPage === 'function') {
        params.api.paginationGoToFirstPage();
      } else if (typeof params.api.purgeInfiniteCache === 'function') {
        params.api.purgeInfiniteCache();
      } else if (typeof params.api.refreshInfiniteCache === 'function') {
        params.api.refreshInfiniteCache();
      }

      params.api.__isUpdatingPageSize = false;
    }, 50);
  },

  bindToolbarActions() {
    document.querySelectorAll('.gt-action-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const actionId = button.dataset.actionId || button.dataset.action || button.id;
        switch (actionId) {
          case 'back':
            window.history.back();
            break;
          case 'add':
            window.location.assign(window.GLPRC_ADD_PAGE_URL || '/govt-list-price-reason-code-maintenance/add');
            break;
          case 'delete':
            this.deleteSelectedRows();
            break;
          case 'refresh':
            this.resetGridState();
            break;
          case 'execute':
            this.applyPendingFilters();
            break;
          case 'favorite':
            this.showInfo('Favorite action is not configured yet.', 'warning');
            break;
          default:
            break;
        }
      });
    });
  },

  async deleteSelectedRows() {
    if (!this.gridApi) return;
    const selectedRows = this.gridApi.getSelectedRows?.() || [];
    if (!selectedRows.length) {
      this.showInfo('Select at least one row to delete.', 'warning');
      return;
    }

    const ids = selectedRows
      .map((row) => String(row?.userDefinedCode || '').trim())
      .filter(Boolean);

    if (!ids.length) {
      this.showInfo('Unable to resolve selected code IDs for delete.', 'error');
      return;
    }

    const queryParams = new URLSearchParams();
    queryParams.set('ids', ids.join(','));
    this.appendFilterParams(queryParams, this.gridApi.getFilterModel?.() || {});

    try {
      const response = await fetch(`${this.resolveApiUrl(this.deleteEndpoint)}?${queryParams.toString()}`, {
        method: 'DELETE',
        headers: this.buildHeaders({ includeDeleteUserId: true })
      });

      if (!response.ok) {
        const message = await this.readErrorMessage(response, 'Unable to delete selected codes.');
        throw new Error(message);
      }

      const payload = await response.json().catch(() => ({}));
      this.gridApi.deselectAll?.();
      this.refreshGridData();
      this.showInfo(payload?.message || 'Selected codes deleted successfully.', 'success');
    } catch (error) {
      console.error(error);
      this.showInfo(error?.message || 'Unable to delete selected codes.', 'error');
    }
  },

  resetGridState() {
    if (!this.gridApi) return;
    this.pageRequestCache = new Map();

    const currentFilterModel = this.gridApi.getFilterModel?.() || {};
    const hasFilters = Object.keys(currentFilterModel).length > 0;
    const currentSortModel = this.gridApi.getSortModel?.() || [];
    const hasSort = Array.isArray(currentSortModel) && currentSortModel.length > 0;
    const currentPage = this.gridApi.paginationGetCurrentPage?.() || 0;

    if (hasFilters && typeof this.gridApi.setFilterModel === 'function') {
      this.gridApi.setFilterModel(null);
    }
    if (!hasFilters && hasSort && typeof this.gridApi.setSortModel === 'function') {
      this.gridApi.setSortModel(null);
    }
    if (!hasFilters && !hasSort && currentPage > 0 && typeof this.gridApi.paginationGoToFirstPage === 'function') {
      this.gridApi.paginationGoToFirstPage();
    }
    this.gridApi.deselectAll?.();
    this.refreshGridLayout();
  },

  refreshGridData() {
    this.pageRequestCache = new Map();
    if (typeof this.gridApi?.purgeInfiniteCache === 'function') {
      this.gridApi.purgeInfiniteCache();
      return;
    }
    if (typeof this.gridApi?.refreshInfiniteCache === 'function') {
      this.gridApi.refreshInfiniteCache();
    }
  },

  refreshGridLayout() {
    if (!this.gridApi || !this.gridElement) return;
    requestAnimationFrame(() => {
      this.gridApi.refreshHeader?.();
      this.gridApi.resetRowHeights?.();
      if (typeof this.gridApi.setGridOption === 'function') {
        this.gridApi.setGridOption('headerHeight', 48);
        this.gridApi.setGridOption('floatingFiltersHeight', 38);
      }
      if (typeof DynamicGrid?.scheduleSizeToFit === 'function') {
        DynamicGrid.scheduleSizeToFit(this.gridApi, this.gridElement);
      }
    });
  },

  initViewActions() {
    if (!this.gridApi) return;

    GridToolbar.bindDensityControls({
      gridApi: this.gridApi,
      gridElement: this.gridElement,
      densityClassPrefix: 'screen-density',
      defaultMode: 'compact'
    });

    const downloadButton = document.querySelector('.gt-view-btn[data-action="download"]');
    downloadButton?.addEventListener('click', () => this.handleDownloadAction());
  },

  async handleDownloadAction() {
    try {
      const sortModel = this.gridApi?.getSortModel?.() || [];
      const filterModel = this.gridApi?.getFilterModel?.() || {};
      const queryParams = this.buildQueryParams({
        page: 0,
        size: this.currentPageSize,
        sortModel,
        filterModel
      });
      queryParams.delete('page');
      queryParams.delete('size');

      const response = await fetch(`${this.resolveApiUrl(this.downloadEndpoint)}?${queryParams.toString()}`, {
        method: 'GET',
        headers: this.buildHeaders()
      });

      if (!response.ok) {
        const message = await this.readErrorMessage(response, 'Unable to download filtered codes.');
        throw new Error(message);
      }

      const blob = await response.blob();
      const fileName = this.getDownloadFileNameFromResponse(response) || 'govt-list-price-reason-code-maintenance.csv';
      this.downloadBlob(blob, fileName);
    } catch (error) {
      console.error(error);
      this.showInfo(error?.message || 'Unable to download filtered codes.', 'error');
    }
  },

  buildHeaders(options = {}) {
    const headers = {
      'X-Product-Code': this.productCode,
      'X-User-Defined-Codes': this.userDefinedCodes
    };

    if (options.includeDeleteUserId) {
      headers['X-User-Id'] = this.defaultDeleteUserId;
    }

    return headers;
  },

  resolveApiUrl(path) {
    const normalizedPath = String(path || '').trim();
    if (!normalizedPath) return this.apiBaseUrl;
    if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
    if (!this.apiBaseUrl) return normalizedPath;

    const base = this.apiBaseUrl.replace(/\/$/, '');
    const suffix = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    return `${base}${suffix}`;
  },

  formatYn(value) {
    if (value === 'Y' || value === 'N') return value;
    if (typeof value === 'boolean') return value ? 'Y' : 'N';
    const normalized = String(value || '').trim().toUpperCase();
    if (normalized === 'TRUE') return 'Y';
    if (normalized === 'FALSE') return 'N';
    return normalized || '';
  },

  async readErrorMessage(response, fallbackMessage) {
    try {
      const text = await response.text();
      if (!text) return fallbackMessage;
      try {
        const parsed = JSON.parse(text);
        return parsed?.message || fallbackMessage;
      } catch (_error) {
        return text;
      }
    } catch (_error) {
      return fallbackMessage;
    }
  },

  getDownloadFileNameFromResponse(response) {
    const disposition = response.headers.get('content-disposition') || '';
    const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i);
    return match ? decodeURIComponent(match[1].replace(/"/g, '').trim()) : '';
  },

  downloadBlob(blob, fileName) {
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  showInfo(message, type = 'success') {
    if (!window.PageToast?.show) return;
    const container = this.ensureToastContainer();
    if (!container) return;

    const titleMap = {
      success: 'Success',
      warning: 'Heads up',
      error: 'Action required'
    };

    window.PageToast.show({
      container,
      type,
      title: titleMap[type] || 'Success',
      subtitle: String(message || ''),
      duration: type === 'error' ? 3200 : 2200
    });
  },

  ensureToastContainer() {
    let container = document.getElementById('govtReasonMaintenanceToastLayer');
    if (container) return container;

    container = document.createElement('div');
    container.id = 'govtReasonMaintenanceToastLayer';
    container.className = 'app-page-toast-layer';
    document.body.appendChild(container);
    return container;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  GovtListPriceReasonCodeMaintenancePage.init();
});
