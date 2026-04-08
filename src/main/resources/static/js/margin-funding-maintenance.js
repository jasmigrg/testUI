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
      if (rowNode.rowPinned || rowNode.group || rowNode.selectable === false) {
        continue;
      }
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
      if (rowNode.rowPinned || rowNode.group || rowNode.selectable === false) {
        continue;
      }

      selectableCount += 1;
      if (rowNode.isSelected()) {
        selectedCount += 1;
      }
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

class MarginFundingItemManualFloatingFilter {
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
      if (event.key !== 'Enter') return;
      event.preventDefault();
      if (this.params?.api && typeof this.params.api.applyPendingFloatingFilters === 'function') {
        this.params.api.applyPendingFloatingFilters();
        return;
      }
      this.apply();
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
        MarginFundingMaintenanceManager.normalizeDateValueForDisplay(parentModel.dateFrom)
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
    const parsedInput = MarginFundingMaintenanceManager.parseInlineFilterExpression(
      value,
      fallbackOperator
    );

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

  destroy() {
    if (this.input && this.onKeyDown) {
      this.input.removeEventListener('keydown', this.onKeyDown);
    }

    const list = this.params?.api?.__manualFloatingFilters;
    if (Array.isArray(list)) {
      const index = list.indexOf(this);
      if (index >= 0) list.splice(index, 1);
    }
  }
}

const MarginFundingMaintenanceManager = {
  gridApi: null,
  gridElement: null,
  apiBaseUrl: '',
  itemApiEndpoint: '/margin-funding/item',
  bulkUpdateEndpoint: '/api/v1/margin-funding/item/bulk-update',
  downloadEndpoint: '/v1/margin-funding/item/download-csv',
  pageRequestCache: new Map(),

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
      duration: normalizedType === 'error' ? 3200 : 2400
    });
  },

  ensureToastContainer() {
    let container = document.getElementById('marginFundingItemMaintenancePageToastLayer');
    if (container) return container;

    container = document.createElement('div');
    container.id = 'marginFundingItemMaintenancePageToastLayer';
    container.className = 'app-page-toast-layer';
    document.body.appendChild(container);
    return container;
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

  formatDateFromTimestamp(timestamp) {
    if (!timestamp) return '';

    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) return '';

    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${month}/${day}/${year}`;
  },

  formatTimeFromTimestamp(timestamp) {
    if (!timestamp) return '';

    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) return '';

    return parsed.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  },

  formatUpdatedAt(timestamp) {
    const formattedDate = this.formatDateFromTimestamp(timestamp);
    const formattedTime = this.formatTimeFromTimestamp(timestamp);
    if (!formattedDate) return '';
    if (!formattedTime) return formattedDate;
    return `${formattedDate} ${formattedTime}`;
  },

  parseInlineFilterExpression(rawValue, defaultType = 'contains') {
    const raw = String(rawValue ?? '').trim();
    if (!raw) return { value: '', type: defaultType };

    const operators = ['!=', '<>', '>=', '<=', '>', '<', '='];
    const token = operators.find((operator) => raw.startsWith(operator));
    if (!token) {
      return { value: raw, type: defaultType };
    }

    const value = raw.slice(token.length).trim();
    let type = defaultType;

    if (token === '=') type = 'equals';
    else if (token === '>') type = 'greaterThan';
    else if (token === '>=') type = 'greaterThanOrEqual';
    else if (token === '<') type = 'lessThan';
    else if (token === '<=') type = 'lessThanOrEqual';
    else if (token === '!=' || token === '<>') type = 'notEqual';

    return { value, type };
  },

  mapColumnToApiField(colId, context = 'filter') {
    const fieldMap = {
      uniqueKey: 'uniqueKeyId',
      userId: 'userId',
      programId: 'programId',
      workStnId: 'workStationId',
      effectiveDate: 'effectiveDate',
      terminationDate: 'terminationDate',
      disableDate: 'disableDate',
      vendorProgram: 'recordId',
      vendorFamilyNumber: 'vendorFamilyNumber',
      vendorFamilyName: 'vendorFamilyName',
      itemNumber: 'itemNum',
      itemDescription: 'itemDescription',
      distributionNonContract: 'distFeeNoncontractPercentage',
      distributionContract: 'distFeeContractPercentage',
      marginFundingPercentType: 'marginFundingPctType',
      notes: 'notes',
      updatedAtDisplay: 'updatedAt'
    };

    return fieldMap[colId] || colId;
  },

  getFieldFilterKind(field) {
    const normalizedField = String(field || '').trim();

    if (['effectiveDate', 'terminationDate', 'disableDate', 'updatedAtDisplay'].includes(normalizedField)) {
      return 'date';
    }

    if (
      [
        'uniqueKey',
        'vendorProgram',
        'vendorFamilyNumber',
        'itemNumber',
        'distributionNonContract',
        'distributionContract'
      ].includes(normalizedField)
    ) {
      return 'number';
    }

    return 'text';
  },

  buildAlignedColumn(column) {
    const field = String(column?.field || column?.colId || '').trim();
    if (!field || field === 'select') return column;

    const kind = this.getFieldFilterKind(field);
    return {
      ...column,
      cellClass: kind === 'text' ? 'cell-align-left' : 'cell-align-right'
    };
  },

  getNumericFilterValue(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return null;

    const normalized = raw.replace(/[%,$\s]/g, '').replace(/,/g, '');
    const numeric = Number(normalized);
    return Number.isNaN(numeric) ? null : numeric;
  },

  dateFilterComparator(filterLocalDateAtMidnight, cellValue) {
    const raw = String(cellValue || '').trim();
    const usDateMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!usDateMatch) return 0;

    const cellDate = new Date(
      Number(usDateMatch[3]),
      Number(usDateMatch[1]) - 1,
      Number(usDateMatch[2])
    );
    const cellTime = cellDate.setHours(0, 0, 0, 0);
    const filterTime = filterLocalDateAtMidnight.setHours(0, 0, 0, 0);
    if (cellTime === filterTime) return 0;
    return cellTime < filterTime ? -1 : 1;
  },

  normalizeDateValueForDisplay(value) {
    const raw = String(value == null ? '' : value).trim();
    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/);
    if (!isoMatch) return raw;
    return `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1]}`;
  },

  normalizeApiDateValue(value) {
    const raw = String(value == null ? '' : value).trim();
    if (!raw) return '';

    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    const usMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (usMatch) {
      return `${usMatch[3]}-${usMatch[1]}-${usMatch[2]}`;
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;

    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  },

  normalizeFilterModel(field, model) {
    if (!model || typeof model !== 'object') return null;

    const kind = this.getFieldFilterKind(field);
    const filterType = String(model.filterType || '').trim();

    if (kind === 'date' || filterType === 'date') {
      const rawDate = model.dateFrom || model.filter;
      const normalizedDate = this.normalizeApiDateValue(rawDate);
      if (!normalizedDate) return null;
      return {
        value: normalizedDate,
        operator: String(model.type || 'equals').trim() || 'equals'
      };
    }

    if (kind === 'number' || filterType === 'number') {
      const rawValue = model.filter;
      if (rawValue == null || String(rawValue).trim() === '') return null;
      return {
        value: String(rawValue).trim(),
        operator: String(model.type || 'equals').trim() || 'equals'
      };
    }

    const rawInput = String(model.rawInput ?? model.filter ?? '').trim();
    if (!rawInput) return null;

    const parsed = this.parseInlineFilterExpression(rawInput, 'contains');
    if (!parsed.value) return null;

    return {
      value: parsed.value,
      operator: parsed.type
    };
  },

  buildFilterableColumn(column) {
    const field = String(column?.field || column?.colId || '').trim();
    if (!field || field === 'select') return column;

    const aligned = this.buildAlignedColumn(column);
    const kind = this.getFieldFilterKind(field);

    if (kind === 'date') {
      return {
        ...aligned,
        filter: 'agDateColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'manualApplyFloatingFilter',
        filterParams: {
          buttons: ['apply', 'reset'],
          closeOnApply: true,
          maxNumConditions: 1,
          numAlwaysVisibleConditions: 1,
          comparator: this.dateFilterComparator,
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
        ...aligned,
        filter: 'agNumberColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'manualApplyFloatingFilter',
        filterValueGetter: (params) => this.getNumericFilterValue(params?.data?.[field]),
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
      ...aligned,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'manualApplyFloatingFilter',
      filterParams: {
        buttons: ['apply', 'reset'],
        closeOnApply: true,
        maxNumConditions: 1,
        numAlwaysVisibleConditions: 1,
        filterOptions: ['contains', 'equals', 'notEqual', 'notContains', 'startsWith', 'endsWith']
      }
    };
  },

  mapApiRow(row) {
    return {
      uniqueKey: row?.unique_key_id ?? '',
      userId: row?.user_id ?? '',
      programId: row?.program_id ?? '',
      workStnId: row?.work_station_id ?? '',
      effectiveDate: this.normalizeDateValueForDisplay(row?.effective_date),
      terminationDate: this.normalizeDateValueForDisplay(row?.termination_date),
      disableDate: this.normalizeDateValueForDisplay(row?.disable_date),
      updatedAtDisplay: row?.updated_at ?? '',
      vendorProgram: row?.record_id ?? '',
      vendorFamilyNumber: row?.vendor_family_number ?? '',
      vendorFamilyName: row?.vendor_family_name ?? '',
      itemNumber: row?.item_num ?? '',
      itemDescription: row?.item_description ?? '',
      distributionNonContract: row?.dist_fee_noncontract_percentage ?? '',
      distributionContract: row?.dist_fee_contract_percentage ?? '',
      marginFundingPercentType: row?.margin_funding_pct_type ?? '',
      notes: row?.notes ?? ''
    };
  },

  buildDatasource() {
    return {
      rowCount: null,
      getRows: async (params) => {
        const requestedBlockSize = params.endRow - params.startRow || 20;
        const selectedPageSize =
          typeof this.gridApi?.paginationGetPageSize === 'function'
            ? this.gridApi.paginationGetPageSize() || requestedBlockSize
            : requestedBlockSize;
        const page = Math.floor((params.startRow || 0) / selectedPageSize);
        const sortModel = Array.isArray(params.sortModel) ? params.sortModel[0] : null;
        const queryParams = new URLSearchParams({
          page: String(page),
          size: String(selectedPageSize),
          sortBy: this.mapColumnToApiField(sortModel?.colId || 'uniqueKey', 'sort'),
          sortDirection: String(sortModel?.sort || 'asc').toUpperCase()
        });

        Object.entries(params.filterModel || {}).forEach(([field, model]) => {
          const parsed = this.normalizeFilterModel(field, model);
          if (!parsed?.value) return;
          const apiField = this.mapColumnToApiField(field, 'filter');
          queryParams.set(apiField, parsed.value);
          queryParams.set(`${apiField}_op`, parsed.operator);
        });

        try {
          const cacheKey = queryParams.toString();
          let requestPromise = this.pageRequestCache.get(cacheKey);

          if (!requestPromise) {
            const requestUrl = `${this.resolveApiUrl(this.itemApiEndpoint)}?${queryParams.toString()}`;
            requestPromise = fetch(requestUrl, {
              method: 'GET',
              headers: { Accept: 'application/json' },
              credentials: 'same-origin'
            }).then(async (response) => {
              if (!response.ok) {
                throw new Error(`Failed to load margin funding item data (${response.status})`);
              }

              const payload = await response.json();
              const rows = Array.isArray(payload?.content) ? payload.content.map((row) => this.mapApiRow(row)) : [];
              const totalRows = Number(
                payload?.totalElements ?? payload?.total_elements ?? rows.length ?? 0
              );

              return {
                rows,
                totalRows
              };
            });

            this.pageRequestCache.set(cacheKey, requestPromise);
          }

          const { rows, totalRows } = await requestPromise;
          const pageStart = page * selectedPageSize;
          const sliceStart = Math.max(0, (params.startRow || 0) - pageStart);
          const sliceEnd = Math.min(sliceStart + requestedBlockSize, rows.length);
          const blockRows = rows.slice(sliceStart, sliceEnd);
          params.successCallback(blockRows, totalRows);
          if (typeof this.gridApi?.hideOverlay === 'function') {
            this.gridApi.hideOverlay();
          }
        } catch (error) {
          this.pageRequestCache.delete(queryParams.toString());
          console.error('Margin funding item maintenance load failed:', error);
          params.successCallback([], 0);
          if (typeof this.gridApi?.showNoRowsOverlay === 'function') {
            this.gridApi.showNoRowsOverlay();
          }
        }
      }
    };
  },

  resetGridState() {
    if (!this.gridApi) return;

    this.pageRequestCache = new Map();

    if (typeof this.gridApi.setFilterModel === 'function') {
      this.gridApi.setFilterModel(null);
    }
    if (typeof this.gridApi.setSortModel === 'function') {
      this.gridApi.setSortModel(null);
    }
    if (typeof this.gridApi.onFilterChanged === 'function') {
      this.gridApi.onFilterChanged();
    }
    if (typeof this.gridApi.paginationGoToFirstPage === 'function') {
      this.gridApi.paginationGoToFirstPage();
    }
    if (typeof this.gridApi.deselectAll === 'function') {
      this.gridApi.deselectAll();
    }
  },

  getSelectedUniqueKeys() {
    if (!this.gridApi || typeof this.gridApi.getSelectedRows !== 'function') return [];

    return this.gridApi.getSelectedRows()
      .map((row) => row?.uniqueKey)
      .filter((value) => value !== null && value !== undefined && value !== '');
  },

  getSelectedRows() {
    if (!this.gridApi || typeof this.gridApi.getSelectedRows !== 'function') return [];
    return this.gridApi.getSelectedRows().filter(Boolean);
  },

  hasDisabledRowsSelected() {
    return this.getSelectedRows().some((row) => String(row.disableDate || '').trim() !== '');
  },

  refreshGridData() {
    if (!this.gridApi) return;

    this.pageRequestCache = new Map();

    if (typeof this.gridApi.refreshInfiniteCache === 'function') {
      this.gridApi.refreshInfiniteCache();
    } else if (typeof this.gridApi.refreshServerSideStore === 'function') {
      this.gridApi.refreshServerSideStore({ purge: true });
    }

    if (typeof this.gridApi.deselectAll === 'function') {
      this.gridApi.deselectAll();
    }
  },

  scheduleInitialGridRefresh() {
    if (!this.gridApi || this._didInitialGridRefresh) return;
    this._didInitialGridRefresh = true;

    setTimeout(() => {
      if (!this.gridApi) return;
      if (typeof this.gridApi.resetRowHeights === 'function') {
        this.gridApi.resetRowHeights();
      }
      if (typeof this.gridApi.redrawRows === 'function') {
        this.gridApi.redrawRows();
      }
      if (typeof this.gridApi.refreshCells === 'function') {
        this.gridApi.refreshCells({ force: true });
      }
    }, 250);
  },

  async postGridAction(url, payload) {
    const response = await fetch(this.resolveApiUrl(url), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const responseBody = await this.readJsonSafely(response);
    if (!response.ok) {
      const errorMessage = this.extractErrorMessage(responseBody)
        || `Request failed: ${response.status}`;
      throw new Error(errorMessage);
    }
    return responseBody;
  },

  async readJsonSafely(response) {
    try {
      return await response.json();
    } catch (error) {
      return null;
    }
  },

  extractErrorMessage(payload) {
    if (!payload || typeof payload !== 'object') return '';
    const message = payload.message;
    return typeof message === 'string' ? message.trim() : '';
  },

  getCurrentRequestParams() {
    const sortModel = typeof this.gridApi?.getSortModel === 'function'
      ? (this.gridApi.getSortModel() || [])[0]
      : null;
    const pageSize = typeof this.gridApi?.paginationGetPageSize === 'function'
      ? this.gridApi.paginationGetPageSize() || 20
      : 20;
    const page = typeof this.gridApi?.paginationGetCurrentPage === 'function'
      ? this.gridApi.paginationGetCurrentPage() || 0
      : 0;

    const queryParams = new URLSearchParams({
      page: String(page),
      size: String(pageSize),
      sortBy: this.mapColumnToApiField(sortModel?.colId || 'uniqueKey', 'sort'),
      sortDirection: String(sortModel?.sort || 'asc').toUpperCase()
    });

    const filterModel = typeof this.gridApi?.getFilterModel === 'function'
      ? this.gridApi.getFilterModel() || {}
      : {};

    Object.entries(filterModel).forEach(([field, model]) => {
      const parsed = this.normalizeFilterModel(field, model);
      if (!parsed?.value) return;
      const apiField = this.mapColumnToApiField(field, 'filter');
      queryParams.set(apiField, parsed.value);
      queryParams.set(`${apiField}_op`, parsed.operator);
    });

    return queryParams;
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
    link.download = fileName || 'margin-funding-item-maintenance.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
  },

  async handleDownloadAction() {
    try {
      const queryParams = this.getCurrentRequestParams();
      const response = await fetch(
        `${this.resolveApiUrl(this.downloadEndpoint)}?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: { Accept: '*/*' },
          credentials: 'same-origin'
        }
      );

      if (!response.ok) {
        throw new Error(`Download failed (${response.status})`);
      }

      const blob = await response.blob();
      const fileName =
        this.getDownloadFileNameFromResponse(response) || 'margin-funding-item-maintenance.csv';
      this.triggerFileDownload(blob, fileName);
    } catch (error) {
      console.error('Margin funding item maintenance download failed:', error);
      this.showInfo(error?.message || 'Download failed.', 'error');
    }
  },

  cacheDisableModalElements() {
    if (this.disableModal) return;
    this.disableModal = document.getElementById('disableRecordModal');
    this.disableDialog = this.disableModal?.querySelector('.mf-action-modal__dialog');
    this.disableNotesInput = document.getElementById('disableRecordNotesInput');
    this.disableErrorMessage = document.getElementById('disableRecordErrorMessage');
    this.disableSaveBtn = this.disableModal?.querySelector('[data-action="save-disable-modal"]');
    this.disableCancelBtn = this.disableModal?.querySelector('[data-action="cancel-disable-modal"]');
    this.disableCloseEls = this.disableModal
      ? Array.from(this.disableModal.querySelectorAll('[data-action="close-disable-modal"]'))
      : [];
  },

  showDisableInlineError() {
    if (this.disableErrorMessage) {
      this.disableErrorMessage.hidden = false;
    }
    this.disableDialog?.classList.add('has-inline-error');
  },

  clearDisableInlineError() {
    if (this.disableErrorMessage) {
      this.disableErrorMessage.hidden = true;
    }
    this.disableDialog?.classList.remove('has-inline-error');
  },

  openDisableModal(uniqueKeys) {
    this.cacheDisableModalElements();
    if (!this.disableModal) return;

    this.pendingDisableUniqueKeys = uniqueKeys;
    if (this.disableNotesInput) {
      this.disableNotesInput.value = '';
      this.disableNotesInput.focus();
    }
    this.clearDisableInlineError();
    this.disableModal.hidden = false;
  },

  closeDisableModal() {
    this.cacheDisableModalElements();
    if (!this.disableModal) return;

    this.disableModal.hidden = true;
    this.pendingDisableUniqueKeys = [];
    if (this.disableNotesInput) {
      this.disableNotesInput.value = '';
    }
    this.clearDisableInlineError();
  },

  cacheUpdateTerminationModalElements() {
    if (this.updateTerminationModal) return;
    this.updateTerminationModal = document.getElementById('updateTerminationDateModal');
    this.updateTerminationDialog = this.updateTerminationModal?.querySelector('.mf-action-modal__dialog');
    this.updateTerminationDateInput = document.getElementById('updateTerminationDateInput');
    this.updateTerminationDateNativeInput = document.getElementById('updateTerminationDateNativeInput');
    this.updateTerminationNotesInput = document.getElementById('updateTerminationNotesInput');
    this.updateTerminationErrorMessage = document.getElementById('updateTerminationErrorMessage');
    this.updateTerminationSaveBtn =
      this.updateTerminationModal?.querySelector('[data-action="save-update-termination-modal"]');
    this.updateTerminationCancelBtn =
      this.updateTerminationModal?.querySelector('[data-action="cancel-update-termination-modal"]');
    this.updateTerminationCloseEls = this.updateTerminationModal
      ? Array.from(this.updateTerminationModal.querySelectorAll('[data-action="close-update-termination-modal"]'))
      : [];
    this.updateTerminationDatePickerBtn =
      this.updateTerminationModal?.querySelector('[data-action="open-termination-date-picker"]');
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
      this.updateTerminationErrorMessage.hidden = true;
      this.updateTerminationErrorMessage.textContent = '';
    }
    this.updateTerminationDialog?.classList.remove('has-inline-error');
  },

  getTodayDateOnly() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  },

  formatDateAsYmd(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  },

  formatDateAsMmDdYyyy(date) {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  },

  parseMmDdYyyyDate(value) {
    const match = String(value || '').trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;

    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    return date;
  },

  openUpdateTerminationModal(uniqueKeys) {
    this.cacheUpdateTerminationModalElements();
    if (!this.updateTerminationModal) return;

    this.pendingTerminationUpdateUniqueKeys = uniqueKeys;
    const today = this.getTodayDateOnly();
    const ymd = this.formatDateAsYmd(today);
    if (this.updateTerminationDateNativeInput) {
      this.updateTerminationDateNativeInput.min = ymd;
      this.updateTerminationDateNativeInput.value = '';
    }
    if (this.updateTerminationDateInput) {
      this.updateTerminationDateInput.value = '';
    }
    if (this.updateTerminationNotesInput) {
      this.updateTerminationNotesInput.value = '';
    }
    this.clearUpdateTerminationInlineError();
    this.updateTerminationModal.hidden = false;
    this.updateTerminationDateInput?.focus();
  },

  closeUpdateTerminationModal() {
    this.cacheUpdateTerminationModalElements();
    if (!this.updateTerminationModal) return;

    this.updateTerminationModal.hidden = true;
    this.pendingTerminationUpdateUniqueKeys = [];
    if (this.updateTerminationDateInput) this.updateTerminationDateInput.value = '';
    if (this.updateTerminationDateNativeInput) this.updateTerminationDateNativeInput.value = '';
    if (this.updateTerminationNotesInput) this.updateTerminationNotesInput.value = '';
    this.clearUpdateTerminationInlineError();
  },

  openTerminationDatePicker() {
    this.cacheUpdateTerminationModalElements();
    if (!this.updateTerminationDateNativeInput) return;

    const picker = this.updateTerminationDateNativeInput;
    if (typeof picker.showPicker === 'function') {
      picker.showPicker();
    } else {
      picker.click();
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

  async handleUpdateTerminationDateSave() {
    const uniqueKeys = this.pendingTerminationUpdateUniqueKeys || [];
    if (!uniqueKeys.length) {
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
      await this.postGridAction(
        this.bulkUpdateEndpoint,
        uniqueKeys.map((uniqueKeyId) => ({
          uniqueKeyId,
          terminationDate: this.formatDateAsYmd(parsedDate),
          notes
        }))
      );
      this.closeUpdateTerminationModal();
      this.refreshGridData();
      this.showInfo('Termination date updated successfully.', 'success');
    } catch (error) {
      console.error('Update termination date failed:', error);
      this.showInfo(error?.message || 'Failed to update termination date.', 'error');
    } finally {
      if (this.updateTerminationSaveBtn) this.updateTerminationSaveBtn.disabled = false;
    }
  },

  async handleDisableSave() {
    const uniqueKeys = this.pendingDisableUniqueKeys || [];
    if (!uniqueKeys.length) {
      this.closeDisableModal();
      return;
    }

    const notes = (this.disableNotesInput?.value ?? '').trim();
    if (!notes) {
      this.showDisableInlineError();
      this.disableNotesInput?.focus();
      return;
    }
    this.clearDisableInlineError();

    try {
      if (this.disableSaveBtn) this.disableSaveBtn.disabled = true;
      const disableDate = this.formatDateAsYmd(this.getTodayDateOnly());
      await this.postGridAction(
        this.bulkUpdateEndpoint,
        uniqueKeys.map((uniqueKeyId) => ({
          uniqueKeyId,
          disableDate,
          notes
        }))
      );
      this.closeDisableModal();
      this.refreshGridData();
      this.showInfo('Selected rows disabled successfully.', 'success');
    } catch (error) {
      console.error('Disable action failed:', error);
      this.showInfo(error?.message || 'Failed to disable selected rows.', 'error');
    } finally {
      if (this.disableSaveBtn) this.disableSaveBtn.disabled = false;
    }
  },

  handleDisableAction() {
    const uniqueKeys = this.getSelectedUniqueKeys();
    if (!uniqueKeys.length) {
      this.showInfo('Select at least one row to disable.', 'error');
      return;
    }
    if (this.hasDisabledRowsSelected()) {
      this.showInfo('Disabled rows cannot be edited. Remove already-disabled rows from selection.', 'error');
      return;
    }
    this.openDisableModal(uniqueKeys);
  },

  handleUpdateTerminationDateAction() {
    const uniqueKeys = this.getSelectedUniqueKeys();
    if (!uniqueKeys.length) {
      this.showInfo('Select at least one row to update termination date.', 'error');
      return;
    }
    if (this.hasDisabledRowsSelected()) {
      this.showInfo('Disabled rows cannot be edited. Remove already-disabled rows from selection.', 'error');
      return;
    }
    this.openUpdateTerminationModal(uniqueKeys);
  },

  initViewActions() {
    const backBtn = document.querySelector('.gt-action-btn[data-action="back"]');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.location.assign('/');
      });
    }

    const addBtn = document.querySelector('.gt-action-btn[data-action="add"]');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        window.location.assign(
          window.MFI_ADD_PAGE_URL || '/margin-funding-maintenance/add'
        );
      });
    }

    const favoriteBtn = document.querySelector('.gt-action-btn[data-action="favorite"]');
    if (favoriteBtn) {
      favoriteBtn.addEventListener('click', () => {
        this.showInfo('Favorite action is not configured yet.', 'warning');
      });
    }

    if (window.GridToolbar && this.gridApi && this.gridElement) {
      window.GridToolbar.bindDensityControls({
        gridApi: this.gridApi,
        gridElement: this.gridElement,
        defaultMode: 'compact',
        densityClassPrefix: 'mfi-density'
      });
    }

    const executeBtn = document.querySelector('.gt-action-btn[data-action="execute"]');
    if (executeBtn) {
      executeBtn.addEventListener('click', () => {
        if (this.gridApi && typeof this.gridApi.applyPendingFloatingFilters === 'function') {
          this.gridApi.applyPendingFloatingFilters();
        }
      });
    }

    const refreshBtn = document.querySelector('.gt-action-btn[data-action="refresh"]');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.resetGridState());
    }

    const downloadBtn = document.querySelector('.gt-view-btn[data-action="download"]');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.handleDownloadAction());
    }

    const disableBtn = document.querySelector('.gt-action-btn[data-action="disable"]');
    if (disableBtn) {
      disableBtn.addEventListener('click', () => this.handleDisableAction());
    }

    this.cacheDisableModalElements();
    this.disableCancelBtn?.addEventListener('click', () => this.closeDisableModal());
    this.disableCloseEls?.forEach((el) => el.addEventListener('click', () => this.closeDisableModal()));
    this.disableSaveBtn?.addEventListener('click', () => this.handleDisableSave());
    this.disableNotesInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.closeDisableModal();
      if (event.key === 'Enter') this.handleDisableSave();
    });
    this.disableNotesInput?.addEventListener('input', () => {
      if (this.disableNotesInput?.value.trim()) {
        this.clearDisableInlineError();
      }
    });

    const updateTerminationBtn = document.querySelector('.gt-action-btn[data-action="update-termination-date"]');
    if (updateTerminationBtn) {
      updateTerminationBtn.addEventListener('click', () => this.handleUpdateTerminationDateAction());
    }

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
      if (this.updateTerminationDateInput?.value.trim()) {
        this.clearUpdateTerminationInlineError();
      }
    });
    this.updateTerminationNotesInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.closeUpdateTerminationModal();
      if (event.key === 'Enter') this.handleUpdateTerminationDateSave();
    });
    this.updateTerminationNotesInput?.addEventListener('input', () => {
      if (this.updateTerminationNotesInput?.value.trim()) {
        this.clearUpdateTerminationInlineError();
      }
    });
  },

  applyDefaultDensity() {
    if (!(window.GridToolbar && this.gridApi && this.gridElement)) return;

    const activeDensityBtn = document.querySelector('.gt-view-btn[data-density].is-active');
    const defaultMode = activeDensityBtn?.dataset?.density || 'compact';
    window.GridToolbar.stabilizeDensity(
      {
        gridApi: this.gridApi,
        gridElement: this.gridElement,
        densityClassPrefix: 'mfi-density'
      },
      defaultMode
    );
  },

  init() {
    this.apiBaseUrl = String(window.API_BASE_URL || '').trim().replace(/\/$/, '');
    this.gridElement = document.getElementById('mfiGrid');

    const gridConfig = {
      gridElementId: 'mfiGrid',
      pageSize: 20,
      floatingFilter: true,
      manualFilterApply: true,
      paginationType: 'server',
      useSpringPagination: true,
      gridOptions: {
        onPaginationChanged: (params) => {
          if (!params?.api || typeof params.api.paginationGetPageSize !== 'function') return;
          if (params.api.__isUpdatingPageSize) return;

          const newPageSize = params.api.paginationGetPageSize();
          const lastKnownPageSize = params.api.__lastKnownPageSize || 20;
          if (newPageSize === lastKnownPageSize) return;

          params.api.__isUpdatingPageSize = true;
          params.api.__lastKnownPageSize = newPageSize;
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
        onGridReady: (params) => {
          params.api.__lastKnownPageSize = 20;
          params.api.__isUpdatingPageSize = false;
        },
        rowSelection: 'multiple',
        suppressRowClickSelection: true,
        isRowSelectable: (rowNode) => {
          const row = rowNode?.data;
          return String(row?.disableDate || '').trim() === '';
        },
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
          manualApplyFloatingFilter: MarginFundingItemManualFloatingFilter
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
          suppressFloatingFilterButton: false,
          floatingFilterComponent: 'manualApplyFloatingFilter',
          floatingFilterComponentParams: {
            suppressFilterButton: false
          },
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
          field: 'select',
          headerName: '',
          checkboxSelection: true,
          cellClassRules: {
            'is-selection-locked': (params) => {
              const row = params?.data;
              return String(row?.disableDate || '').trim() !== '';
            }
          },
          headerComponent: 'gtPageSelectHeader',
          width: 44,
          minWidth: 44,
          maxWidth: 44,
          pinned: 'left',
          sortable: false,
          filter: false,
          floatingFilter: false,
          resizable: false,
          suppressSizeToFit: true
        },
        { field: 'uniqueKey', headerName: 'Unique Key', minWidth: 150 },
        { field: 'vendorFamilyNumber', headerName: 'Vendor Family Number', minWidth: 170 },
        { field: 'vendorFamilyName', headerName: 'Vendor Family Name', minWidth: 190 },
        { field: 'vendorProgram', headerName: 'Vendor Program', minWidth: 160 },
        { field: 'itemNumber', headerName: 'Item Number', minWidth: 130 },
        { field: 'itemDescription', headerName: 'Item Description', minWidth: 220 },
        { field: 'distributionNonContract', headerName: 'Distribution Fee Non-Contract %', minWidth: 220 },
        { field: 'distributionContract', headerName: 'Distribution Fee Contract %', minWidth: 200 },
        { field: 'marginFundingPercentType', headerName: 'Margin Funding Percent Type', minWidth: 220 },
        { field: 'effectiveDate', headerName: 'Effective Date', minWidth: 140 },
        { field: 'terminationDate', headerName: 'Termination Date', minWidth: 160 },
        { field: 'disableDate', headerName: 'Disable Date', minWidth: 140 },
        { field: 'notes', headerName: 'Notes', minWidth: 180 },
        { field: 'userId', headerName: 'User ID', minWidth: 120 },
        {
          field: 'updatedAtDisplay',
          headerName: 'Updated At',
          minWidth: 220,
          valueFormatter: (params) => this.formatUpdatedAt(params.value)
        },
        { field: 'workStnId', headerName: 'Work Stn ID', minWidth: 130 },
        { field: 'programId', headerName: 'Program ID', minWidth: 130 }
      ].map((column) => this.buildFilterableColumn(column))
    };

    this.gridApi = DynamicGrid.createGrid(gridConfig);
    this.gridApi?.setGridOption?.('datasource', this.buildDatasource());

    if (this.gridApi) {
      this.gridApi.applyPendingFloatingFilters = () => {
        const filters = this.gridApi.__manualFloatingFilters;
        if (Array.isArray(filters)) {
          filters.forEach((filter) => filter?.apply?.());
        }
      };
    }

    window.gridApi = this.gridApi;
    this.initViewActions();

    if (this.gridApi && typeof this.gridApi.addEventListener === 'function') {
      this.gridApi.addEventListener('firstDataRendered', () => {
        this.applyDefaultDensity();
        this.scheduleInitialGridRefresh();
      });
    }

    this.applyDefaultDensity();
    setTimeout(() => this.applyDefaultDensity(), 150);

    setTimeout(() => {
      if (window.gridApi && typeof GridManager !== 'undefined') {
        GridManager.init(window.gridApi, 'mfiGrid');
      }
    }, 500);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  MarginFundingMaintenanceManager.init();
});
