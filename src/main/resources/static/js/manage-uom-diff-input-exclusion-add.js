const UOM_DIFF_EXCLUSION_ADD_FIELD_DEFS = [
  { field: 'organization', headerName: 'Organization', minWidth: 180 },
  { field: 'itemDiscontinuedFlag', headerName: 'Item Discontinued Flag', minWidth: 210 },
  { field: 'invalidPrcaFlag', headerName: 'Invalid PRCA Flag', minWidth: 170 },
  { field: 'histRevenue', headerName: 'Hist Revenue', minWidth: 170, type: 'number' },
  { field: 'effectiveDate', headerName: 'Effective Date', minWidth: 180, type: 'date' },
  { field: 'terminationDate', headerName: 'Termination Date', minWidth: 190, type: 'date' }
];

const UOM_DIFF_EXCLUSION_ADD_DATE_FIELDS = new Set(['effectiveDate', 'terminationDate']);
const UOM_DIFF_EXCLUSION_ADD_NUMBER_FIELDS = new Set(['histRevenue']);
const UOM_DIFF_EXCLUSION_ADD_FLAG_FIELDS = new Set(['itemDiscontinuedFlag', 'invalidPrcaFlag']);

const UomDiffInputExclusionAddPage = {
  gridApi: null,
  gridElement: null,
  detachCommunityPaste: null,
  apiBaseUrl: '',
  createEndpoint: '/api/v1/gm-uom-diff-input-exclusion',
  maxPasteRows: 5000,
  maxPasteCols: 10,
  maxPasteCells: 50000,

  init() {
    this.apiBaseUrl = String(window.API_BASE_URL || '').trim().replace(/\/$/, '');
    this.initGrid();
    this.bindToolbarActions();
    this.initViewActions();
  },

  createBlankRow() {
    const row = {};
    UOM_DIFF_EXCLUSION_ADD_FIELD_DEFS.forEach(({ field }) => {
      row[field] = '';
    });
    row.uploadStatus = '';
    row.uploadErrors = [];
    row.errorMessages = [];
    row.fieldErrorMessages = {};
    row.editedFields = [];
    row.wasEditedAfterError = false;
    return row;
  },

  initialRows() {
    return [this.createBlankRow()];
  },

  initGrid() {
    const dateComparator = window.GridFilterOperatorUtils?.createUsDateComparator
      ? window.GridFilterOperatorUtils.createUsDateComparator((value) => this.usDateToIso(value))
      : null;

    this.gridApi = DynamicGrid.createGrid({
      gridElementId: 'uomDiffExclusionAddGrid',
      paginationType: 'client',
      pageSize: 20,
      floatingFilter: true,
      manualFilterApply: true,
      gridOptions: {
        rowData: this.initialRows(),
        rowSelection: 'multiple',
        suppressRowClickSelection: true,
        singleClickEdit: false,
        enableRangeSelection: true,
        suppressClipboardPaste: false,
        copyHeadersToClipboard: false,
        enableBrowserTooltips: true,
        stopEditingWhenCellsLoseFocus: true,
        onCellValueChanged: (event) => this.onCellValueChanged(event),
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
          contains: 'Contains',
          notContains: 'Does not contain',
          startsWith: 'Begins with',
          endsWith: 'Ends with',
          greaterThan: 'Greater than',
          lessThan: 'Less than',
          greaterThanOrEqual: 'Greater than or equal to',
          lessThanOrEqual: 'Less than or equal to',
          after: 'Greater than',
          before: 'Less than'
        },
        defaultColDef: {
          sortable: true,
          unSortIcon: true,
          wrapHeaderText: true,
          autoHeaderHeight: true,
          editable: true,
          resizable: true
        }
      },
      columns: [
        {
          field: 'select',
          headerName: '',
          checkboxSelection: true,
          headerCheckboxSelection: true,
          headerCheckboxSelectionFilteredOnly: true,
          width: 44,
          minWidth: 44,
          maxWidth: 44,
          pinned: 'left',
          sortable: false,
          filter: false,
          floatingFilter: false,
          resizable: false,
          editable: false,
          suppressSizeToFit: true
        },
        ...UOM_DIFF_EXCLUSION_ADD_FIELD_DEFS.map((column) => this.buildColumn(column, dateComparator))
      ]
    });

    this.gridElement = document.getElementById('uomDiffExclusionAddGrid');
    if (!this.gridApi) return;

    if (typeof this.detachCommunityPaste === 'function') {
      this.detachCommunityPaste();
      this.detachCommunityPaste = null;
    }

    if (window.CommunityGridPaste?.attach) {
      const pasteableFields = UOM_DIFF_EXCLUSION_ADD_FIELD_DEFS.map((column) => column.field);
      this.detachCommunityPaste = window.CommunityGridPaste.attach({
        gridElement: this.gridElement,
        gridApi: this.gridApi,
        editableFieldOrder: pasteableFields,
        maxRows: this.maxPasteRows,
        maxCols: this.maxPasteCols,
        maxCells: this.maxPasteCells,
        showInfo: (message, type) => this.showInfo(message, type),
        ensureRowCapacity: (rowCount, startRowIndex) => this.ensureRowCapacityForPaste(rowCount, startRowIndex),
        normalizeRow: (row) => this.normalizeRow(row),
        validateRow: () => ({ isValid: true, errors: [] }),
        resolveHeaderField: (header, allowedFields) => this.resolvePasteHeaderField(header, allowedFields),
        requireHeaderMapping: false,
        headerMatchThreshold: 3
      });
    }

    this.gridApi.applyPendingFloatingFilters = () => this.applyAdvancedFilters();
    if (typeof this.gridApi.addEventListener === 'function') {
      this.gridApi.addEventListener('firstDataRendered', () => this.applyDefaultDensity());
      this.gridApi.addEventListener('firstDataRendered', () => {
        if (typeof this.gridApi.deselectAll === 'function') this.gridApi.deselectAll();
      });
    }

    this.applyDefaultDensity();
    setTimeout(() => {
      if (typeof GridManager !== 'undefined' && this.gridApi) {
        GridManager.init(this.gridApi, 'uomDiffExclusionAddGrid');
      }
    }, 300);
  },

  buildColumn(column, dateComparator) {
    const config = {
      field: column.field,
      headerName: column.headerName,
      minWidth: column.minWidth,
      cellClass: column.type === 'date' || column.type === 'number' ? 'cell-align-right' : 'cell-align-left',
      cellClassRules: this.validationCellRules(column.field),
      tooltipValueGetter: (params) => this.getCellErrorTooltip(params, column.field)
    };

    if (column.type === 'date') {
      config.filter = 'agDateColumnFilter';
      config.filterParams = {
        ...(dateComparator ? { comparator: dateComparator } : {}),
        buttons: ['apply', 'reset'],
        closeOnApply: true,
        maxNumConditions: 1,
        numAlwaysVisibleConditions: 1,
        defaultOption: 'equals',
        filterOptions: [
          'equals',
          'notEqual',
          'greaterThan',
          'lessThan',
          'greaterThanOrEqual',
          'lessThanOrEqual'
        ]
      };
    } else if (column.type === 'number') {
      config.filter = 'agNumberColumnFilter';
      config.filterValueGetter = (params) => this.numberFilterValue(params?.data?.[column.field]);
      config.filterParams = {
        buttons: ['apply', 'reset'],
        closeOnApply: true,
        maxNumConditions: 1,
        numAlwaysVisibleConditions: 1,
        defaultOption: 'equals',
        filterOptions: ['equals', 'notEqual', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual']
      };
    } else {
      config.filter = 'agTextColumnFilter';
      config.filterParams = {
        buttons: ['apply', 'reset'],
        closeOnApply: true,
        maxNumConditions: 1,
        numAlwaysVisibleConditions: 1,
        defaultOption: 'contains',
        filterOptions: ['contains', 'equals', 'notEqual', 'notContains', 'startsWith', 'endsWith']
      };
    }

    if (UOM_DIFF_EXCLUSION_ADD_FLAG_FIELDS.has(column.field)) {
      config.valueSetter = (params) => this.setFlagCellValue(params, column.field);
    }

    return config;
  },

  validationCellRules(field) {
    return {
      'screen-add-cell-error': (params) => Array.isArray(params.data?.uploadErrors) && params.data.uploadErrors.includes(field)
    };
  },

  getCellErrorTooltip(params, field) {
    const row = params?.data;
    if (!row || !field) return '';
    const fieldMessage = row.fieldErrorMessages?.[field];
    if (fieldMessage) return fieldMessage;
    if (Array.isArray(row.uploadErrors) && row.uploadErrors.includes(field) && Array.isArray(row.errorMessages) && row.errorMessages.length > 0) {
      return row.errorMessages.join('\n');
    }
    return '';
  },

  bindToolbarActions() {
    document.addEventListener('click', (event) => {
      const actionButton = event.target.closest('.gt-action-btn[data-action]');
      if (!actionButton) return;

      switch (actionButton.dataset.action) {
        case 'back':
          window.location.href = window.UOM_DIFF_LIST_PAGE_URL || '/manage-uom-diff-input-view-input-data?tab=exclusion';
          break;
        case 'delete':
          this.deleteSelectedRows();
          break;
        case 'submit':
          this.submitRows();
          break;
        case 'execute':
          this.applyAdvancedFilters();
          break;
        default:
          break;
      }
    });
  },

  initViewActions() {
    if (!this.gridApi || !this.gridElement || typeof GridToolbar === 'undefined') return;
    GridToolbar.bindDensityControls({
      gridApi: this.gridApi,
      gridElement: this.gridElement,
      defaultMode: 'compact',
      densityClassPrefix: 'uom-diff-density'
    });
  },

  applyDefaultDensity() {
    if (!this.gridApi || !this.gridElement || typeof GridToolbar === 'undefined') return;
    GridToolbar.stabilizeDensity({
      gridApi: this.gridApi,
      gridElement: this.gridElement,
      defaultMode: 'compact',
      densityClassPrefix: 'uom-diff-density'
    });
  },

  ensureRowCapacityForPaste(rowCountToPaste, startRowIndex = null) {
    if (!this.gridApi || rowCountToPaste <= 0) return;
    const focused = this.gridApi.getFocusedCell?.();
    const resolvedStartRowIndex = Number.isInteger(startRowIndex)
      ? startRowIndex
      : (Number.isInteger(focused?.rowIndex) ? focused.rowIndex : 0);
    const requiredRows = resolvedStartRowIndex + rowCountToPaste;
    const currentRows = typeof this.gridApi.getDisplayedRowCount === 'function'
      ? this.gridApi.getDisplayedRowCount()
      : this.getGridRows().length;
    const missingRows = requiredRows - currentRows;
    if (missingRows > 0) {
      this.gridApi.applyTransaction({ add: Array.from({ length: missingRows }, () => this.createBlankRow()) });
    }
  },

  deleteSelectedRows() {
    const selectedRows = this.gridApi?.getSelectedRows?.() || [];
    if (selectedRows.length === 0) {
      this.showInfo('Select at least one row to delete.', 'warning');
      return;
    }
    this.gridApi?.applyTransaction?.({ remove: selectedRows });
  },

  normalizeRow(row) {
    const normalized = { ...this.createBlankRow(), ...row };
    UOM_DIFF_EXCLUSION_ADD_FIELD_DEFS.forEach(({ field }) => {
      const value = normalized[field];
      if (UOM_DIFF_EXCLUSION_ADD_DATE_FIELDS.has(field)) {
        normalized[field] = this.toUsDate(value || '');
      } else if (UOM_DIFF_EXCLUSION_ADD_NUMBER_FIELDS.has(field)) {
        normalized[field] = String(value ?? '').trim().replace(/,/g, '');
      } else if (UOM_DIFF_EXCLUSION_ADD_FLAG_FIELDS.has(field)) {
        normalized[field] = this.normalizeFlagValue(value) ?? String(value ?? '').trim().toUpperCase();
      } else {
        normalized[field] = String(value ?? '').trim();
      }
    });
    return normalized;
  },

  normalizeFlagValue(value) {
    const normalized = String(value ?? '').trim().toUpperCase();
    if (!normalized) return '';
    if (normalized === 'Y' || normalized === 'N') return normalized;
    return null;
  },

  setFlagCellValue(params, field) {
    if (!params?.data || !field) return false;
    const normalized = this.normalizeFlagValue(params.newValue);
    if (normalized == null) {
      this.showInfo('Flag fields only accept Y or N.', 'error');
      return false;
    }
    params.data[field] = normalized;
    return true;
  },

  onCellValueChanged(event) {
    const field = event?.colDef?.field;
    const rowNode = event?.node;
    if (!field || !rowNode?.data) return;

    const normalized = this.normalizeRow(rowNode.data);
    Object.assign(rowNode.data, this.buildEditedRowState(normalized, field));
    if (this.gridApi?.refreshCells) this.gridApi.refreshCells({ rowNodes: [rowNode], force: true });
  },

  buildEditedRowState(row, editedField) {
    const nextFieldErrorMessages = { ...(row.fieldErrorMessages || {}) };
    delete nextFieldErrorMessages[editedField];

    const nextUploadErrors = Array.isArray(row.uploadErrors)
      ? row.uploadErrors.filter((field) => field !== editedField)
      : [];

    const nextEditedFields = Array.from(new Set([...(Array.isArray(row.editedFields) ? row.editedFields : []), editedField]));

    return {
      ...row,
      uploadStatus: nextUploadErrors.length > 0 ? 'error' : '',
      uploadErrors: nextUploadErrors,
      fieldErrorMessages: nextFieldErrorMessages,
      errorMessages: nextUploadErrors.length > 0 ? row.errorMessages : [],
      editedFields: nextEditedFields,
      wasEditedAfterError: true
    };
  },

  normalizeHeader(header) {
    if (window.CsvUploadUtils?.normalizeHeader) return window.CsvUploadUtils.normalizeHeader(header);
    return String(header || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  },

  resolvePasteHeaderField(header, allowedFields = null) {
    const normalizedHeader = this.normalizeHeader(header);
    if (!normalizedHeader) return '';

    const match = UOM_DIFF_EXCLUSION_ADD_FIELD_DEFS.find(({ field, headerName }) => (
      this.normalizeHeader(field) === normalizedHeader || this.normalizeHeader(headerName) === normalizedHeader
    ));

    if (!match) return '';
    if (Array.isArray(allowedFields) && allowedFields.length > 0 && !allowedFields.includes(match.field)) {
      return '';
    }
    return match.field;
  },

  toUsDate(value) {
    return String(value || '').trim();
  },

  parseUsDate(value) {
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

  usDateToIso(value) {
    const normalized = this.toUsDate(value);
    if (!normalized) return '';
    const [mm, dd, yyyy] = normalized.split('/');
    return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  },

  numberFilterValue(value) {
    const raw = String(value ?? '').replace(/,/g, '').trim();
    if (!raw) return null;
    const numeric = Number(raw);
    return Number.isFinite(numeric) ? numeric : null;
  },

  resolveApiUrl(path) {
    const normalizedPath = String(path || '').trim();
    if (!normalizedPath) return this.apiBaseUrl;
    if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
    return `${this.apiBaseUrl}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`;
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

  async postRow(endpoint, row) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify(this.toBackendRecord(row))
    });

    const text = await response.text();
    let payload = {};
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (error) {
        payload = { message: text };
      }
    }

    if (!response.ok || payload?.status === false) {
      const err = new Error(this.sanitizeSubmitMessage(payload?.message || payload?.error || `Request failed: ${response.status}`));
      err.status = response.status;
      err.payload = payload;
      throw err;
    }

    return payload;
  },

  getGridRows() {
    const rows = [];
    this.gridApi?.forEachNode?.((node) => {
      if (node?.data) rows.push(node.data);
    });
    return rows;
  },

  applyAdvancedFilters() {
    if (typeof this.gridApi?.onFilterChanged === 'function') this.gridApi.onFilterChanged();
  },

  isRowEmpty(row) {
    return UOM_DIFF_EXCLUSION_ADD_FIELD_DEFS.every(({ field }) => !String(row?.[field] || '').trim());
  },

  validateRowsForSubmit(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      this.showInfo('Paste or enter at least one row before submitting.', 'error');
      return false;
    }

    for (const row of rows) {
      if (!this.normalizeFlagValue(row.itemDiscontinuedFlag)) {
        this.showInfo('Item Discontinued Flag only accepts Y or N.', 'error');
        return false;
      }

      if (!this.normalizeFlagValue(row.invalidPrcaFlag)) {
        this.showInfo('Invalid PRCA Flag only accepts Y or N.', 'error');
        return false;
      }
    }

    return true;
  },

  mapErrorField(field) {
    const normalized = this.normalizeHeader(field);
    const match = UOM_DIFF_EXCLUSION_ADD_FIELD_DEFS.find((column) => (
      this.normalizeHeader(column.field) === normalized || this.normalizeHeader(column.headerName) === normalized
    ));
    return match?.field || this.inferFieldFromMessage(field);
  },

  inferFieldFromMessage(message) {
    const normalized = this.normalizeHeader(message);
    if (!normalized) return '';
    if (normalized.includes('organization')) return 'organization';
    if (normalized.includes('itemdiscontinuedflag')) return 'itemDiscontinuedFlag';
    if (normalized.includes('invalidprcaflag')) return 'invalidPrcaFlag';
    if (normalized.includes('histrevenue')) return 'histRevenue';
    if (normalized.includes('effectivedate')) return 'effectiveDate';
    if (normalized.includes('terminationdate')) return 'terminationDate';
    if (normalized.includes('dateformat') || normalized.includes('date')) return 'effectiveDate';
    return '';
  },

  sanitizeSubmitMessage(message) {
    const raw = String(message || '').trim();
    const normalized = raw.toLowerCase();
    if (!raw) return 'Row failed validation. Review the highlighted values and try again.';
    if (
      normalized.includes('sql')
      || normalized.includes('jdbc')
      || normalized.includes('constraint')
      || normalized.includes('could not execute')
      || normalized.includes('statement')
    ) {
      return 'Row failed validation. Review the highlighted values and try again.';
    }
    if (normalized.includes('date') && (normalized.includes('format') || normalized.includes('parse'))) {
      return 'Date must be in MM/DD/YYYY format.';
    }
    return raw;
  },

  extractFieldErrorMessages(payload, fallbackMessage = '') {
    const messagesByField = {};
    const assignMessage = (field, message) => {
      const mappedField = this.mapErrorField(field);
      const sanitized = this.sanitizeSubmitMessage(message);
      if (!mappedField || !sanitized) return;
      messagesByField[mappedField] = sanitized;
    };

    if (payload?.fieldErrors && typeof payload.fieldErrors === 'object' && !Array.isArray(payload.fieldErrors)) {
      Object.entries(payload.fieldErrors).forEach(([field, message]) => assignMessage(field, message));
    }

    if (Array.isArray(payload?.errors)) {
      payload.errors.forEach((entry) => {
        if (typeof entry === 'string') {
          assignMessage(this.inferFieldFromMessage(entry), entry);
          return;
        }
        if (entry && typeof entry === 'object') {
          const field = entry.field || entry.name || entry.path || '';
          const message = entry.message || entry.defaultMessage || entry.errorMessage || entry.description || '';
          assignMessage(field || this.inferFieldFromMessage(message), message);
        }
      });
    }

    if (Object.keys(messagesByField).length === 0 && fallbackMessage) {
      const inferredField = this.inferFieldFromMessage(fallbackMessage);
      if (inferredField) {
        messagesByField[inferredField] = this.sanitizeSubmitMessage(fallbackMessage);
      }
    }

    return messagesByField;
  },

  buildErrorRowState(row, error) {
    const payload = error?.payload || {};
    const fallbackMessage = this.sanitizeSubmitMessage(error?.message || payload?.message || '');
    const fieldErrorMessages = this.extractFieldErrorMessages(payload, fallbackMessage);
    let uploadErrors = Object.keys(fieldErrorMessages);
    let errorMessages = [];

    if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
      errorMessages = payload.errors
        .map((entry) => {
          if (typeof entry === 'string') return this.sanitizeSubmitMessage(entry);
          if (entry && typeof entry === 'object') {
            return this.sanitizeSubmitMessage(entry.message || entry.defaultMessage || entry.errorMessage || entry.description || '');
          }
          return '';
        })
        .filter(Boolean);
    }

    if (errorMessages.length === 0 && fallbackMessage) {
      errorMessages = [fallbackMessage];
    }

    if (uploadErrors.length === 0) {
      uploadErrors = UOM_DIFF_EXCLUSION_ADD_FIELD_DEFS.map(({ field }) => field);
      uploadErrors.forEach((field) => {
        fieldErrorMessages[field] = fieldErrorMessages[field] || fallbackMessage || 'Row failed validation.';
      });
    }

    return {
      ...row,
      uploadStatus: 'error',
      uploadErrors,
      errorMessages,
      fieldErrorMessages,
      wasEditedAfterError: false
    };
  },

  toBackendRecord(row) {
    const histRevenueRaw = String(row.histRevenue ?? '').replace(/,/g, '').trim();
    return {
      organization: String(row.organization || '').trim(),
      itemDiscontinuedFlag: this.normalizeFlagValue(row.itemDiscontinuedFlag),
      invalidPrcaFlag: this.normalizeFlagValue(row.invalidPrcaFlag),
      histRevenue: histRevenueRaw === '' ? '' : Number(histRevenueRaw),
      effectiveDate: this.toUsDate(row.effectiveDate),
      terminationDate: this.toUsDate(row.terminationDate)
    };
  },

  async submitRows() {
    if (!this.gridApi) return;
    const selectedNodes = this.gridApi.getSelectedNodes?.() || [];
    const sourceNodes = selectedNodes.length > 0
      ? selectedNodes
      : this.collectNonEmptyRowNodes();
    const rows = sourceNodes
      .map((node) => this.normalizeRow(node?.data))
      .filter((row) => !this.isRowEmpty(row));

    if (!this.validateRowsForSubmit(rows)) return;

    const successfulRows = [];
    let failureCount = 0;

    try {
      for (const node of sourceNodes) {
        const row = this.normalizeRow(node?.data);
        if (!node?.data || this.isRowEmpty(row)) continue;

        try {
          await this.postRow(this.resolveApiUrl(this.createEndpoint), row);
          successfulRows.push(node.data);
        } catch (error) {
          failureCount += 1;
          console.error('UOM Diff exclusion add submit failed for row:', error);
          const erroredRow = this.buildErrorRowState(row, error);
          Object.assign(node.data, erroredRow);
          node.setData({ ...node.data });
        }
      }

      if (successfulRows.length > 0) {
        this.gridApi.applyTransaction?.({ remove: successfulRows });
      }

      if ((this.gridApi.getDisplayedRowCount?.() || 0) === 0) {
        this.gridApi.setGridOption?.('rowData', [this.createBlankRow()]);
      }

      if (successfulRows.length > 0 && failureCount === 0) {
        this.showInfo(
          successfulRows.length === 1
            ? 'GM UOM Diff Input Exclusion created successfully'
            : `${successfulRows.length} rows submitted successfully.`,
          'success'
        );
        return;
      }

      if (successfulRows.length > 0 && failureCount > 0) {
        this.showInfo(`${successfulRows.length} rows submitted. ${failureCount} rows need correction.`, 'warning');
        return;
      }

      this.showInfo('Some rows need correction before they can be submitted.', 'error');
    } finally {
      if (typeof this.gridApi?.refreshCells === 'function') {
        this.gridApi.refreshCells({ force: true });
      }
    }
  },

  collectNonEmptyRowNodes() {
    const nodes = [];
    this.gridApi?.forEachNode?.((node) => {
      if (!node?.data) return;
      if (!this.isRowEmpty(this.normalizeRow(node.data))) nodes.push(node);
    });
    return nodes;
  },

  showInfo(message, type = 'success') {
    if (!window.PageToast?.show) return;

    let container = document.getElementById('uomDiffExclusionAddPageToastLayer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'uomDiffExclusionAddPageToastLayer';
      container.className = 'app-page-toast-layer';
      document.body.appendChild(container);
    }

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
  }
};

document.addEventListener('DOMContentLoaded', () => {
  UomDiffInputExclusionAddPage.init();
});
