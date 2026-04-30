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

    for (let index = from; index < to; index += 1) {
      const rowNode = this.params.api.getDisplayedRowAtIndex(index);
      if (!rowNode || rowNode.rowPinned || rowNode.group || rowNode.selectable === false) continue;
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

    for (let index = from; index < to; index += 1) {
      const rowNode = this.params.api.getDisplayedRowAtIndex(index);
      if (!rowNode || rowNode.rowPinned || rowNode.group || rowNode.selectable === false) continue;
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

const GOVT_REASON_ADD_FIELD_ALIASES = {
  code: ['userDefinedCode'],
  description01: ['description'],
  description02: ['description2'],
  specialHandling: ['specialHandlingCode'],
  hardCoded: ['hardCodedYn']
};

const GovtListPriceReasonCodeMaintenanceAddPage = {
  apiBaseUrl: '',
  createEndpoint: '/api/v1/bulk-create',
  productCode: '57',
  userDefinedCodes: 'R0',
  detachCommunityPaste: null,
  maxPasteRows: 5000,
  maxPasteCols: 5,
  maxPasteCells: 25000,
  gridApi: null,
  gridElement: null,
  codeInput: null,

  init() {
    this.apiBaseUrl = String(window.API_BASE_URL || '').trim();
    this.codeInput = document.getElementById('govtReasonCodeInput');
    this.initGrid();
    this.bindToolbarActions();
    this.initViewActions();
  },

  createBlankRow(codeValue = '') {
    return {
      code: codeValue,
      description01: '',
      description02: '',
      specialHandling: '',
      hardCoded: '',
      uploadStatus: '',
      uploadErrors: [],
      errorMessages: [],
      fieldErrorMessages: {},
      editedFields: [],
      wasEditedAfterError: false
    };
  },

  initGrid() {
    this.gridApi = DynamicGrid.createGrid({
      gridElementId: 'govtListPriceReasonCodeAddGrid',
      paginationType: 'client',
      pageSize: 10,
      floatingFilter: true,
      manualFilterApply: true,
      gridOptions: {
        rowData: [this.createBlankRow()],
        rowSelection: 'multiple',
        suppressRowClickSelection: true,
        singleClickEdit: true,
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
        components: {
          gtPageSelectHeader: GtPageSelectHeader
        },
        defaultColDef: {
          sortable: true,
          resizable: true,
          editable: true,
          unSortIcon: true,
          suppressFloatingFilterButton: false,
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
        this.buildColumn('code', 'Codes', 180),
        this.buildColumn('description01', 'Description 01', 210),
        this.buildColumn('description02', 'Description 02', 210),
        this.buildColumn('specialHandling', 'Special Handling', 190),
        this.buildColumn('hardCoded', 'Hard Coded', 150)
      ]
    });

    this.gridElement = document.getElementById('govtListPriceReasonCodeAddGrid');
    if (!this.gridApi) return;

    if (typeof this.detachCommunityPaste === 'function') {
      this.detachCommunityPaste();
      this.detachCommunityPaste = null;
    }

    if (window.CommunityGridPaste?.attach) {
      const editableFields = ['code', 'description01', 'description02', 'specialHandling', 'hardCoded'];
      this.detachCommunityPaste = window.CommunityGridPaste.attach({
        gridElement: this.gridElement,
        gridApi: this.gridApi,
        editableFieldOrder: editableFields,
        maxRows: this.maxPasteRows,
        maxCols: this.maxPasteCols,
        maxCells: this.maxPasteCells,
        showInfo: (message, type) => this.showInfo(message, type),
        ensureRowCapacity: (rowCount, startRowIndex) => this.ensureRowCapacityForPaste(rowCount, startRowIndex),
        normalizeRow: (row) => this.normalizeRow(row),
        validateRow: () => ({ isValid: true, errors: [] }),
        resolveHeaderField: (header, allowedFields) => this.resolvePasteHeaderField(header, allowedFields),
        requireHeaderMapping: false,
        headerMatchThreshold: 2,
        onApplied: () => this.gridApi?.refreshCells?.({ force: true })
      });
    }

    setTimeout(() => {
      if (typeof GridManager !== 'undefined') {
        GridManager.init(this.gridApi, 'govtListPriceReasonCodeAddGrid');
      }
    }, 250);
  },

  buildColumn(field, headerName, minWidth) {
    return {
      field,
      headerName,
      minWidth,
      flex: 1,
      cellClass: field === 'specialHandling' || field === 'hardCoded' ? 'cell-center' : 'cell-left',
      cellClassRules: this.validationCellRules(field),
      tooltipValueGetter: (params) => this.getCellErrorTooltip(params, field),
      filterParams: {
        buttons: ['apply', 'reset'],
        closeOnApply: true,
        maxNumConditions: 1,
        numAlwaysVisibleConditions: 1,
        filterOptions: ['contains', 'notContains', 'equals', 'notEqual']
      }
    };
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
    document.querySelectorAll('.gt-action-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const actionId = button.dataset.actionId || button.dataset.action || button.id;
        switch (actionId) {
          case 'back':
            window.location.assign(window.GLPRC_LIST_PAGE_URL || '/govt-list-price-reason-code-maintenance');
            break;
          case 'delete':
            this.deleteSelectedRows();
            break;
          case 'submit':
            this.submitPrototype();
            break;
          case 'execute':
            this.gridApi?.applyPendingFloatingFilters?.();
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

  deleteSelectedRows() {
    if (!this.gridApi) return;
    const selectedRows = this.gridApi.getSelectedRows?.() || [];
    if (!selectedRows.length) {
      this.showInfo('Select at least one row to delete.', 'warning');
      return;
    }

    this.gridApi.applyTransaction({ remove: selectedRows });

    const remainingRows = [];
    this.gridApi.forEachNode((node) => remainingRows.push(node.data));
    if (!remainingRows.length) {
      this.gridApi.applyTransaction({ add: [this.createBlankRow(this.codeInput?.value?.trim() || '')] });
    }

    this.showInfo(`${selectedRows.length} row(s) removed from the grid.`, 'success');
  },

  submitPrototype() {
    if (!this.gridApi) return;

    this.gridApi.stopEditing?.();
    this.seedCodeInputIntoGrid();

    const submitEntries = this.getGridRows()
      .map((row, index) => ({ row: this.normalizeRow(row), rowIndex: index }))
      .filter(({ row }) => !this.isRowEmpty(row));

    if (!submitEntries.length) {
      this.showInfo('Enter at least one row before submitting.', 'warning');
      return;
    }

    submitEntries.forEach(({ rowIndex }) => this.clearRowErrors(rowIndex));

    const payload = {
      records: submitEntries.map(({ row }) => this.toBackendRecord(row))
    };

    fetch(this.resolveApiUrl(this.createEndpoint), {
      method: 'POST',
      headers: this.buildHeaders({ contentTypeJson: true }),
      body: JSON.stringify(payload)
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body?.message || 'Unable to create government list price reason code records.');
        }
        return body;
      })
      .then((responsePayload) => this.applySubmitResults(responsePayload, submitEntries))
      .catch((error) => {
        console.error(error);
        this.showInfo(error?.message || 'Unable to create government list price reason code records.', 'error');
      });
  },

  getGridRows() {
    const rows = [];
    this.gridApi?.forEachNode?.((node) => rows.push(node.data || {}));
    return rows;
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
    if (missingRows > 0) this.appendBlankRows(missingRows);
  },

  appendBlankRows(count) {
    if (!this.gridApi || !Number.isInteger(count) || count <= 0) return;
    this.gridApi.applyTransaction({ add: Array.from({ length: count }, () => this.createBlankRow()) });
  },

  normalizeRow(row) {
    return {
      ...this.createBlankRow(),
      ...(row || {}),
      code: String(row?.code || '').trim(),
      description01: String(row?.description01 || '').trim(),
      description02: String(row?.description02 || '').trim(),
      specialHandling: String(row?.specialHandling || '').trim(),
      hardCoded: this.formatHardCodedDisplay(row?.hardCoded)
    };
  },

  formatHardCodedDisplay(value) {
    if (value === true) return 'Y';
    if (value === false) return 'N';

    const normalized = String(value || '').trim().toUpperCase();
    if (normalized === 'TRUE') return 'Y';
    if (normalized === 'FALSE') return 'N';
    return normalized;
  },

  parseHardCodedBoolean(value) {
    if (value === true || value === false) return value;

    const normalized = String(value || '').trim().toUpperCase();
    if (!normalized) return null;
    if (normalized === 'Y' || normalized === 'TRUE') return true;
    if (normalized === 'N' || normalized === 'FALSE') return false;
    return null;
  },

  resolvePasteHeaderField(header, allowedFields = null) {
    const normalizedHeader = this.normalizeFieldName(header);
    const allowed = Array.isArray(allowedFields) && allowedFields.length > 0
      ? allowedFields
      : ['code', 'description01', 'description02', 'specialHandling', 'hardCoded'];

    const matches = allowed.find((field) => {
      if (this.normalizeFieldName(field) === normalizedHeader) return true;

      const aliases = GOVT_REASON_ADD_FIELD_ALIASES[field] || [];
      if (aliases.some((alias) => this.normalizeFieldName(alias) === normalizedHeader)) return true;

      const headerLabels = {
        code: 'Codes',
        description01: 'Description 01',
        description02: 'Description 02',
        specialHandling: 'Special Handling',
        hardCoded: 'Hard Coded'
      };

      return this.normalizeFieldName(headerLabels[field] || '') === normalizedHeader;
    });

    return matches || '';
  },

  isRowEmpty(row) {
    return !['code', 'description01', 'description02', 'specialHandling', 'hardCoded']
      .some((field) => String(row?.[field] || '').trim() !== '');
  },

  seedCodeInputIntoGrid() {
    const topCode = String(this.codeInput?.value || '').trim();
    if (!topCode || !this.gridApi) return;

    const firstRowNode = this.gridApi.getDisplayedRowAtIndex?.(0);
    if (!firstRowNode?.data || String(firstRowNode.data.code || '').trim()) return;

    firstRowNode.setData({
      ...firstRowNode.data,
      code: topCode
    });
  },

  toBackendRecord(row) {
    const record = {
      userDefinedCode: row.code,
      description: row.description01
    };

    if (row.description02) record.description2 = row.description02;
    if (row.specialHandling) record.specialHandlingCode = row.specialHandling;
    if (String(row.hardCoded || '').trim()) {
      const hardCodedBoolean = this.parseHardCodedBoolean(row.hardCoded);
      if (hardCodedBoolean !== null) {
        record.hardCodedYn = hardCodedBoolean;
      }
    }

    return record;
  },

  mapErrorField(field) {
    const normalized = this.normalizeFieldName(field);
    const match = Object.entries(GOVT_REASON_ADD_FIELD_ALIASES).find(([localField, aliases]) =>
      this.normalizeFieldName(localField) === normalized
      || aliases.some((alias) => this.normalizeFieldName(alias) === normalized)
    );
    return match?.[0] || '';
  },

  normalizeFieldName(value) {
    return String(value || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
  },

  extractFieldErrorMessages(item) {
    const messagesByField = {};
    const assignMessage = (field, message) => {
      const mappedField = this.mapErrorField(field);
      if (!mappedField || message == null || message === '') return;
      messagesByField[mappedField] = String(message);
    };

    if (Array.isArray(item?.errorFields) && Array.isArray(item?.errorMessages) && item.errorFields.length === item.errorMessages.length) {
      item.errorFields.forEach((field, index) => assignMessage(field, item.errorMessages[index]));
    }

    return messagesByField;
  },

  mergeBackendDataIntoRow(row, backendData) {
    return {
      ...row,
      code: backendData?.userDefinedCode ?? row.code,
      description01: backendData?.description ?? row.description01,
      description02: backendData?.description2 ?? row.description02,
      specialHandling: backendData?.specialHandlingCode ?? row.specialHandling,
      hardCoded: this.formatHardCodedDisplay(backendData?.hardCodedYn ?? row.hardCoded)
    };
  },

  applySubmitResults(responsePayload, submitEntries) {
    const results = Array.isArray(responsePayload?.results) ? responsePayload.results : [];
    const resultsByRowNumber = new Map(results.map((item) => [Number(item?.rowNumber), item]));
    let successCount = 0;
    let errorCount = 0;

    submitEntries.forEach(({ row, rowIndex }, index) => {
      const result = resultsByRowNumber.get(index + 1);
      const mergedRow = result?.data ? this.mergeBackendDataIntoRow(row, result.data) : row;
      const fieldErrorMessages = this.extractFieldErrorMessages(result);
      const uploadErrors = Array.from(new Set([
        ...(Array.isArray(result?.errorFields) ? result.errorFields.map((field) => this.mapErrorField(field)).filter(Boolean) : []),
        ...Object.keys(fieldErrorMessages)
      ]));
      const isError = String(result?.status || '').trim().toUpperCase() === 'ERROR' || uploadErrors.length > 0;

      this.updateRow(rowIndex, {
        ...mergedRow,
        uploadStatus: isError ? 'error' : 'success',
        uploadErrors,
        errorMessages: Array.isArray(result?.errorMessages) ? result.errorMessages : [],
        fieldErrorMessages,
        editedFields: [],
        wasEditedAfterError: false
      });

      if (isError) errorCount += 1;
      else successCount += 1;
    });

    this.gridApi?.refreshCells?.({ force: true });

    if (successCount > 0 && errorCount > 0) {
      this.showInfo(`${successCount} row(s) submitted successfully. ${errorCount} row(s) need review.`, 'warning');
      return;
    }

    if (errorCount > 0) {
      this.showInfo(`${errorCount} row(s) need review.`, 'error');
      return;
    }

    this.showInfo(`${successCount} row(s) submitted successfully.`, 'success');
  },

  updateRow(rowIndex, nextRow) {
    const rowNode = this.gridApi?.getDisplayedRowAtIndex?.(rowIndex);
    if (!rowNode) return;
    rowNode.setData({
      ...this.createBlankRow(),
      ...nextRow
    });
  },

  clearRowErrors(rowIndex) {
    const rowNode = this.gridApi?.getDisplayedRowAtIndex?.(rowIndex);
    if (!rowNode?.data) return;

    rowNode.setData({
      ...rowNode.data,
      uploadStatus: '',
      uploadErrors: [],
      errorMessages: [],
      fieldErrorMessages: {},
      editedFields: [],
      wasEditedAfterError: false
    });
  },

  onCellValueChanged(event) {
    const field = event?.colDef?.field;
    const rowNode = event?.node;
    if (!field || !rowNode?.data) return;

    const nextFieldErrorMessages = { ...(rowNode.data.fieldErrorMessages || {}) };
    delete nextFieldErrorMessages[field];

    const nextUploadErrors = Array.isArray(rowNode.data.uploadErrors)
      ? rowNode.data.uploadErrors.filter((errorField) => errorField !== field)
      : [];

    rowNode.setData({
      ...rowNode.data,
      uploadStatus: nextUploadErrors.length > 0 ? 'error' : '',
      uploadErrors: nextUploadErrors,
      fieldErrorMessages: nextFieldErrorMessages,
      editedFields: Array.from(new Set([...(Array.isArray(rowNode.data.editedFields) ? rowNode.data.editedFields : []), field])),
      wasEditedAfterError: true
    });

    this.gridApi?.refreshCells?.({ rowNodes: [rowNode], force: true });
  },

  buildHeaders(options = {}) {
    const headers = {
      Accept: 'application/json',
      'X-Product-Code': this.productCode,
      'X-User-Defined-Codes': this.userDefinedCodes
    };

    if (options.contentTypeJson) {
      headers['Content-Type'] = 'application/json';
    }

    const currentUserId = String(document.getElementById('currentUserId')?.value || '').trim();
    const workStationId = String(window.WORK_STATION_ID || window.WORKSTATION_ID || '').trim();
    const programId = String(window.PROGRAM_ID || '').trim();

    if (currentUserId) headers['X-User-Id'] = currentUserId;
    if (workStationId) headers['X-WorkStation-Id'] = workStationId;
    if (programId) headers['X-Program-Id'] = programId;

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

  initViewActions() {
    if (!this.gridApi) return;

    GridToolbar.bindDensityControls({
      gridApi: this.gridApi,
      gridElement: this.gridElement,
      densityClassPrefix: 'screen-density',
      defaultMode: 'compact'
    });

    GridToolbar.bindDownloadControl({
      gridApi: this.gridApi,
      fileName: 'govt-list-price-reason-code-maintenance-add.csv'
    });
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
    let container = document.getElementById('govtReasonMaintenanceAddToastLayer');
    if (container) return container;

    container = document.createElement('div');
    container.id = 'govtReasonMaintenanceAddToastLayer';
    container.className = 'app-page-toast-layer';
    document.body.appendChild(container);
    return container;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  GovtListPriceReasonCodeMaintenanceAddPage.init();
});
