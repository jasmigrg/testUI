class AllGuidanceManualFloatingFilter {
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
      } else {
        this.apply();
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
        AllGuidanceInquiryPage.normalizeDateValueForDisplay(parentModel.dateFrom)
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
    const parsedInput = AllGuidanceInquiryPage.parseInlineFilterExpression(value, fallbackOperator);

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

const AllGuidanceInquiryPage = {
  gridApi: null,
  gridElement: null,
  apiBaseUrl: '',
  guidanceApiEndpoint: '/api/v1/guidance-engine/all-guidance',
  allRows: [],
  filteredRows: [],

  columnDefs: [
    { field: 'sortSequence', headerName: 'Sort Sequence', minWidth: 140 },
    { field: 'overrideLevel', headerName: 'Override Level', minWidth: 150 },
    { field: 'mainLevel', headerName: 'Main Level', minWidth: 130 },
    { field: 'effectiveDate', headerName: 'Effective Date', minWidth: 140 },
    { field: 'terminationDate', headerName: 'Termination Date', minWidth: 160 },
    { field: 'customerCluster', headerName: 'Customer Cluster', minWidth: 160 },
    { field: 'customerMarket', headerName: 'Customer Market', minWidth: 160 },
    { field: 'itemNum', headerName: 'Item Num', minWidth: 130 },
    { field: 'itemSubCategory', headerName: 'Item Sub Category', minWidth: 170 },
    { field: 'baseCost', headerName: 'Base Cost', minWidth: 130 },
    { field: 'targetCost', headerName: 'Target Cost', minWidth: 130 },
    { field: 'premiumCost', headerName: 'Premium Cost', minWidth: 140 },
    { field: 'baseMargin', headerName: 'Base Margin', minWidth: 140 },
    { field: 'targetMargin', headerName: 'Target Margin', minWidth: 150 },
    { field: 'premiumMargin', headerName: 'Premium Margin', minWidth: 160 },
    { field: 'basePrice', headerName: 'Base Price', minWidth: 130 },
    { field: 'targetPrice', headerName: 'Target Price', minWidth: 140 },
    { field: 'premiumPrice', headerName: 'Premium Price', minWidth: 150 },
    { field: 'unitOfMeasure', headerName: 'Unit Of Measure', minWidth: 150 },
    { field: 'uniqueId', headerName: 'Unique ID', minWidth: 130 }
  ],

  init() {
    this.apiBaseUrl = String(window.API_BASE_URL || '').trim().replace(/\/$/, '');
    this.cacheDom();
    this.syncDefaultPriceDate();
    this.initGrid();
    this.bindForm();
    this.bindActions();
    this.applyGridRows([]);
    this.applyDefaultDensity();
  },

  cacheDom() {
    this.gridElement = document.getElementById('allGuidanceInquiryGrid');
    this.form = document.getElementById('allGuidanceInquiryForm');
    this.accountInput = document.getElementById('allGuidanceAccountNumber');
    this.itemInput = document.getElementById('allGuidanceItemNumber');
    this.uomInput = document.getElementById('allGuidanceUom');
    this.priceDateDisplayInput = document.getElementById('allGuidancePriceDateDisplay');
    this.priceDateNativeInput = document.getElementById('allGuidancePriceDateNative');
    this.priceDatePickerBtn = document.getElementById('allGuidancePriceDatePickerBtn');
  },

  markFieldInvalid(element) {
    element?.classList.add('agi-input--invalid');
  },

  clearFieldInvalid(element) {
    element?.classList.remove('agi-input--invalid');
  },

  clearAllFieldValidation() {
    [
      this.accountInput,
      this.itemInput,
      this.uomInput,
      this.priceDateDisplayInput
    ].forEach((element) => this.clearFieldInvalid(element));
  },

  showInfo(message, type = 'success') {
    if (!window.PageToast?.show) return;

    let container = document.getElementById('allGuidanceInquiryToastLayer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'allGuidanceInquiryToastLayer';
      container.className = 'app-page-toast-layer';
      document.body.appendChild(container);
    }

    window.PageToast.show({
      container,
      type,
      title: type === 'error' ? 'Action required' : type === 'warning' ? 'Heads up' : 'Success',
      subtitle: String(message || '').trim(),
      duration: type === 'error' ? 3200 : 2400
    });
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

  getFieldFilterKind(field) {
    if ([
      'sortSequence',
      'overrideLevel',
      'mainLevel',
      'itemNum',
      'baseCost',
      'targetCost',
      'premiumCost',
      'baseMargin',
      'targetMargin',
      'premiumMargin',
      'basePrice',
      'targetPrice',
      'premiumPrice',
      'uniqueId'
    ].includes(field)) {
      return 'number';
    }

    if (['effectiveDate', 'terminationDate'].includes(field)) {
      return 'date';
    }

    return 'text';
  },

  buildAlignedColumn(column) {
    const field = String(column?.field || '').trim();
    if (!field) return column;

    const kind = this.getFieldFilterKind(field);
    const baseClass = kind === 'text' ? 'cell-align-left' : 'cell-align-right';
    const alignedColumn = {
      ...column,
      cellClass: baseClass
    };

    if (field === 'overrideLevel') {
      alignedColumn.cellClassRules = {
        ...(column.cellClassRules || {}),
        'agi-override-level-cell': (params) => {
          const value = params?.value;
          return value != null && String(value).trim() !== '';
        }
      };
    }

    return alignedColumn;
  },

  getNumericFilterValue(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return null;

    const normalized = raw.replace(/[%,$\s]/g, '').replace(/,/g, '');
    const numeric = Number(normalized);
    return Number.isNaN(numeric) ? null : numeric;
  },

  normalizeDateValueForDisplay(value) {
    const raw = String(value == null ? '' : value).trim();
    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/);
    if (!isoMatch) return raw;
    return `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1]}`;
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

  buildFilterableColumn(column) {
    const field = String(column?.field || '').trim();
    if (!field) return column;

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

  formatDateAsMmDdYyyy(date) {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  },

  formatDateAsYmd(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  },

  formatTimestampForFileName(date = new Date()) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
  },

  getTodayDateOnly() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  },

  formatCurrency(value) {
    return Number(value || 0).toFixed(2);
  },

  formatPercent(value) {
    return `${Number(value || 0).toFixed(2)}%`;
  },

  parseMmDdYyyyDate(value) {
    const match = String(value || '').trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;

    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }

    return date;
  },

  formatDateInputValue(rawValue) {
    const digits = String(rawValue ?? '').replace(/\D/g, '').slice(0, 8);
    if (!digits) return '';
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  },

  normalizeNullableValue(value) {
    if (value == null) return '';
    return String(value).trim();
  },

  normalizeDisplayDate(value) {
    const raw = String(value == null ? '' : value).trim();
    if (!raw) return '';

    const usMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (usMatch) {
      const month = String(Number(usMatch[1])).padStart(2, '0');
      const day = String(Number(usMatch[2])).padStart(2, '0');
      return `${month}/${day}/${usMatch[3]}`;
    }

    return this.normalizeDateValueForDisplay(raw);
  },

  formatNumericValue(value) {
    if (value == null || value === '') return '';
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return String(value);
    return String(numeric);
  },

  getDisplayedRowsForExport() {
    if (!this.gridApi || typeof this.gridApi.forEachNodeAfterFilterAndSort !== 'function') return [];
    const rows = [];
    this.gridApi.forEachNodeAfterFilterAndSort((node) => {
      if (node?.group || node?.rowPinned) return;
      if (node?.data) rows.push(node.data);
    });
    return rows;
  },

  escapeCsvValue(value) {
    const raw = String(value == null ? '' : value);
    if (!/[",\n]/.test(raw)) return raw;
    return `"${raw.replace(/"/g, '""')}"`;
  },

  downloadCsv(rows) {
    const exportRows = Array.isArray(rows) ? rows : [];
    const headers = this.columnDefs.map((column) => column.headerName);
    const fields = this.columnDefs.map((column) => column.field);
    const csvLines = [
      headers.map((value) => this.escapeCsvValue(value)).join(','),
      ...exportRows.map((row) => fields.map((field) => this.escapeCsvValue(row?.[field] ?? '')).join(','))
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `all_guidance_inquiry_${this.formatTimestampForFileName()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  },

  mapApiRow(row, index) {
    return {
      sortSequence: index + 1,
      overrideLevel: this.formatNumericValue(row?.overrideLevel),
      mainLevel: this.formatNumericValue(row?.mainLevel),
      effectiveDate: this.normalizeDisplayDate(row?.effectiveDate),
      terminationDate: this.normalizeDisplayDate(row?.terminationDate),
      customerCluster: this.normalizeNullableValue(row?.customerCluster),
      customerMarket: this.normalizeNullableValue(row?.customerMarket),
      itemNum: this.formatNumericValue(row?.itemNum),
      itemSubCategory: this.normalizeNullableValue(row?.itemSubCategory),
      baseCost: this.formatNumericValue(row?.baseCost),
      targetCost: this.formatNumericValue(row?.targetCost),
      premiumCost: this.formatNumericValue(row?.premiumCost),
      baseMargin: this.formatNumericValue(row?.baseMargin),
      targetMargin: this.formatNumericValue(row?.targetMargin),
      premiumMargin: this.formatNumericValue(row?.premiumMargin),
      basePrice: this.formatNumericValue(row?.basePrice),
      targetPrice: this.formatNumericValue(row?.targetPrice),
      premiumPrice: this.formatNumericValue(row?.premiumPrice),
      unitOfMeasure: this.normalizeNullableValue(row?.unitOfMeasure),
      uniqueId: this.formatNumericValue(row?.uniqueId),
      source: this.normalizeNullableValue(row?.source),
      customerSegment: this.normalizeNullableValue(row?.customerSegment)
    };
  },

  async fetchGuidanceRows(params) {
    const queryParams = new URLSearchParams({
      accountNumber: params.accountNumber,
      itemNumber: params.itemNumber,
      priceDate: params.priceDate
    });

    if (params.unitOfMeasure) {
      queryParams.set('unitOfMeasure', params.unitOfMeasure);
    }

    const response = await fetch(`${this.resolveApiUrl(this.guidanceApiEndpoint)}?${queryParams.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin'
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.message || `Request failed (${response.status})`);
    }
    if (payload && payload.status === false) {
      throw new Error(payload.message || 'Failed to load all guidance inquiry data.');
    }

    const rows = Array.isArray(payload?.data) ? payload.data : [];
    return rows.map((row, index) => this.mapApiRow(row, index));
  },

  syncDefaultPriceDate() {
    const today = this.getTodayDateOnly();
    if (this.priceDateDisplayInput) this.priceDateDisplayInput.value = this.formatDateAsMmDdYyyy(today);
    if (this.priceDateNativeInput) this.priceDateNativeInput.value = this.formatDateAsYmd(today);
  },

  syncPriceDateFromNativePicker() {
    const value = this.priceDateNativeInput?.value;
    if (!value) return;

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, (month || 1) - 1, day || 1);
    if (this.priceDateDisplayInput) {
      this.priceDateDisplayInput.value = this.formatDateAsMmDdYyyy(date);
    }
  },

  openPriceDatePicker() {
    if (!this.priceDateNativeInput) return;
    if (typeof this.priceDateNativeInput.showPicker === 'function') {
      this.priceDateNativeInput.showPicker();
    } else {
      this.priceDateNativeInput.click();
    }
  },

  initGrid() {
    const compactPreset = window.GridToolbar?.DEFAULT_DENSITY_PRESETS?.compact || {
      rowHeight: 40,
      headerHeight: 48,
      floatingFiltersHeight: 38
    };

    this.gridApi = DynamicGrid.createGrid({
      gridElementId: 'allGuidanceInquiryGrid',
      paginationType: 'client',
      pageSize: 10,
      pageSizeSelector: [10, 20, 50, 100],
      floatingFilter: true,
      manualFilterApply: true,
      gridOptions: {
        rowData: [],
        rowHeight: compactPreset.rowHeight,
        headerHeight: compactPreset.headerHeight,
        floatingFiltersHeight: compactPreset.floatingFiltersHeight,
        animateRows: false,
        suppressRowClickSelection: true,
        components: {
          manualApplyFloatingFilter: AllGuidanceManualFloatingFilter
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
      columns: this.columnDefs.map((column) => this.buildFilterableColumn(column))
    });

    if (this.gridApi) {
      this.gridApi.applyPendingFloatingFilters = () => {
        const filters = this.gridApi.__manualFloatingFilters;
        if (Array.isArray(filters)) {
          filters.forEach((filter) => filter?.apply?.());
        }
      };
    }

    if (window.GridToolbar && this.gridApi && this.gridElement) {
      window.GridToolbar.bindDensityControls({
        gridApi: this.gridApi,
        gridElement: this.gridElement,
        defaultMode: 'compact',
        densityClassPrefix: 'screen-density'
      });
    }

    setTimeout(() => {
      if (typeof GridManager !== 'undefined' && this.gridApi) {
        GridManager.init(this.gridApi, 'allGuidanceInquiryGrid');
      }
    }, 300);
  },

  applyGridRows(rows) {
    this.allRows = Array.isArray(rows) ? rows.slice() : [];
    this.filteredRows = this.allRows.slice();
    if (!this.gridApi) return;

    if (typeof this.gridApi.setGridOption === 'function') {
      this.gridApi.setGridOption('rowData', this.filteredRows);
    } else if (typeof this.gridApi.setRowData === 'function') {
      this.gridApi.setRowData(this.filteredRows);
    }

    if (typeof this.gridApi.paginationGoToFirstPage === 'function') {
      this.gridApi.paginationGoToFirstPage();
    }
    if (typeof this.gridApi.refreshCells === 'function') {
      this.gridApi.refreshCells({ force: true });
    }
  },

  applyFormFilters() {
    this.clearAllFieldValidation();

    const accountNumber = String(this.accountInput?.value || '').trim();
    const itemNumber = String(this.itemInput?.value || '').trim();
    const unitOfMeasure = String(this.uomInput?.value || '').trim();
    const priceDateText = String(this.priceDateDisplayInput?.value || '').trim();

    if (!accountNumber) {
      this.markFieldInvalid(this.accountInput);
      this.showInfo('Account Number is required.', 'error');
      this.accountInput?.focus();
      return;
    }

    if (!itemNumber) {
      this.markFieldInvalid(this.itemInput);
      this.showInfo('Item Number is required.', 'error');
      this.itemInput?.focus();
      return;
    }

    if (priceDateText && !this.parseMmDdYyyyDate(priceDateText)) {
      this.markFieldInvalid(this.priceDateDisplayInput);
      this.showInfo('Price Date must be in MM/DD/YYYY format.', 'error');
      this.priceDateDisplayInput?.focus();
      return;
    }

    if (!priceDateText) {
      this.markFieldInvalid(this.priceDateDisplayInput);
      this.showInfo('Price Date is required.', 'error');
      this.priceDateDisplayInput?.focus();
      return;
    }

    const requestParams = {
      accountNumber,
      itemNumber,
      priceDate: priceDateText,
      unitOfMeasure
    };

    this.loadGuidanceRows(requestParams);
  },

  async loadGuidanceRows(requestParams) {
    try {
      const rows = await this.fetchGuidanceRows(requestParams);
      this.applyGridRows(rows);
      this.resetGridState(false);
      if (!rows.length) {
        this.showInfo('No rows matched the selected criteria.', 'warning');
      }
    } catch (error) {
      console.error('All guidance inquiry load failed:', error);
      this.applyGridRows([]);
      this.showInfo(error?.message || 'Failed to load all guidance inquiry data.', 'error');
    }
  },

  resetFormAndGrid() {
    this.syncDefaultPriceDate();
  },

  resetGridState(clearRows = false) {
    if (!this.gridApi) return;
    if (typeof this.gridApi.setFilterModel === 'function') this.gridApi.setFilterModel(null);
    if (typeof this.gridApi.setSortModel === 'function') this.gridApi.setSortModel(null);
    if (typeof this.gridApi.paginationGoToFirstPage === 'function') this.gridApi.paginationGoToFirstPage();
    const floatingFilters = Array.isArray(this.gridApi.__manualFloatingFilters)
      ? this.gridApi.__manualFloatingFilters
      : [];
    floatingFilters.forEach((filter) => {
      if (filter?.input) {
        filter.input.value = '';
      }
      if (typeof filter?.apply === 'function') {
        filter.apply();
      }
    });
    if (typeof this.gridApi.onFilterChanged === 'function') this.gridApi.onFilterChanged();
    if (clearRows) this.applyGridRows([]);
  },

  bindForm() {
    this.form?.addEventListener('submit', (event) => {
      event.preventDefault();
      this.applyFormFilters();
    });

    this.form?.addEventListener('reset', () => {
      setTimeout(() => this.resetFormAndGrid(), 0);
    });

    this.priceDatePickerBtn?.addEventListener('click', () => this.openPriceDatePicker());
    this.priceDateNativeInput?.addEventListener('change', () => this.syncPriceDateFromNativePicker());

    [this.accountInput, this.itemInput, this.uomInput, this.priceDateDisplayInput].forEach((element) => {
      element?.addEventListener('input', () => {
        if (element === this.priceDateDisplayInput) {
          element.value = this.formatDateInputValue(element.value);
        }
        this.clearFieldInvalid(element);
      });
      element?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
        }
      });
    });
  },

  bindActions() {
    const backBtn = document.querySelector('.gt-action-btn[data-action="back"]');
    const favoriteBtn = document.querySelector('.gt-action-btn[data-action="favorite"]');
    const refreshBtn = document.querySelector('.gt-action-btn[data-action="refresh"]');
    const executeBtn = document.querySelector('.gt-action-btn[data-action="execute"]');
    const downloadBtn = document.querySelector('.gt-view-btn[data-action="download"]');

    backBtn?.addEventListener('click', () => window.location.assign('/'));
    favoriteBtn?.addEventListener('click', () => this.showInfo('Favorite action is not configured yet.', 'warning'));
    refreshBtn?.addEventListener('click', () => this.resetGridState(false));
    executeBtn?.addEventListener('click', () => {
      if (this.gridApi && typeof this.gridApi.applyPendingFloatingFilters === 'function') {
        this.gridApi.applyPendingFloatingFilters();
      }
    });
    downloadBtn?.addEventListener('click', () => {
      const rows = this.getDisplayedRowsForExport();
      if (!rows.length) {
        this.showInfo('No rows available to download.', 'warning');
        return;
      }
      this.downloadCsv(rows);
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
        densityClassPrefix: 'screen-density'
      },
      defaultMode
    );
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('.all-guidance-page')) return;
  AllGuidanceInquiryPage.init();
});
