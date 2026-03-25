const CUSTOMER_GPO_FIELD_DEFS = [
  { field: 'uniqueKeyId', headerName: 'Unique Key ID', minWidth: 150, editable: false },
  { field: 'customerPriority', headerName: 'Customer Priority', minWidth: 160 },
  { field: 'itemPriority', headerName: 'Item Priority', minWidth: 140 },
  { field: 'accountType', headerName: 'Account Type', minWidth: 140 },
  { field: 'accountTypeDescription', headerName: 'Account Type Description (from UD 56/AT)', minWidth: 280 },
  { field: 'customerNumber', headerName: 'Customer Number', minWidth: 160 },
  { field: 'accountName', headerName: 'Account Name', minWidth: 180 },
  { field: 'gpoNumber', headerName: 'GPO Number', minWidth: 140 },
  { field: 'gpoName', headerName: 'GPO Name', minWidth: 150 },
  { field: 'progNum', headerName: 'Prog Num', minWidth: 130 },
  { field: 'programType', headerName: 'Program Type', minWidth: 150 },
  { field: 'progSubNum', headerName: 'Prog Sub Num', minWidth: 150 },
  { field: 'programSubType', headerName: 'Program Sub Type', minWidth: 170 },
  { field: 'effectiveFrom', headerName: 'Effective From', minWidth: 150, type: 'date' },
  { field: 'terminationDate', headerName: 'Termination Date', minWidth: 150, type: 'date' },
  { field: 'disableDate', headerName: 'Disable Date', minWidth: 140, type: 'date' },
  { field: 'productFamily', headerName: 'Product Family', minWidth: 160 },
  { field: 'productCategory', headerName: 'Product Category', minWidth: 160 },
  { field: 'productGroup', headerName: 'Product Group', minWidth: 150 },
  { field: 'productSubCategory', headerName: 'Product Sub Category', minWidth: 180 },
  { field: 'mckBrandContractPercent', headerName: 'McK Brand Contract %', minWidth: 180, type: 'number' },
  { field: 'mckBrandNonContractPercent', headerName: 'McK Brand Non Contract %', minWidth: 200, type: 'number' },
  { field: 'allOtherContractPercent', headerName: 'All Other Contract %', minWidth: 180, type: 'number' },
  { field: 'allOtherNonContractPercent', headerName: 'All Other Non Contract %', minWidth: 200, type: 'number' },
  { field: 'notes', headerName: 'Notes', minWidth: 180 },
  { field: 'createdByUser', headerName: 'Created By User', minWidth: 160, editable: false },
  { field: 'createdDate', headerName: 'Created Date', minWidth: 140, editable: false, type: 'date' },
  { field: 'createTime', headerName: 'Create Time', minWidth: 130, editable: false },
  { field: 'dateUpdated', headerName: 'Date Updated', minWidth: 140, editable: false, type: 'date' },
  { field: 'timeUpdated', headerName: 'Time Updated', minWidth: 140, editable: false },
  { field: 'programId', headerName: 'Program ID', minWidth: 130 },
  { field: 'userId', headerName: 'User ID', minWidth: 120 },
  { field: 'workStnId', headerName: 'Work Stn ID', minWidth: 140 }
];

const CUSTOMER_GPO_DATE_FIELDS = new Set(['effectiveFrom', 'terminationDate', 'disableDate', 'createdDate', 'dateUpdated']);
const CUSTOMER_GPO_NUMBER_FIELDS = new Set([
  'mckBrandContractPercent',
  'mckBrandNonContractPercent',
  'allOtherContractPercent',
  'allOtherNonContractPercent'
]);

const CUSTOMER_GPO_BACKEND_ALIASES = {
  mckBrandContractPercent: ['mckBrandContractPct'],
  mckBrandNonContractPercent: ['mckBrandNonContractPct'],
  allOtherContractPercent: ['allOtherContractPct'],
  allOtherNonContractPercent: ['allOtherNonContractPct'],
  workStnId: ['workStationId'],
  createdDate: ['createDate']
};

const CUSTOMER_GPO_OUTBOUND_FIELDS = [
  { localField: 'userId', backendField: 'userId', useContextFallback: 'userId' },
  { localField: 'programId', backendField: 'programId', useContextFallback: 'programId' },
  { localField: 'workStnId', backendField: 'workStationId', useContextFallback: 'workStationId' },
  { localField: 'effectiveFrom', backendField: 'effectiveFrom' },
  { localField: 'terminationDate', backendField: 'terminationDate' },
  { localField: 'disableDate', backendField: 'disableDate' },
  { localField: 'customerPriority', backendField: 'customerPriority' },
  { localField: 'itemPriority', backendField: 'itemPriority' },
  { localField: 'accountType', backendField: 'accountType' },
  { localField: 'accountTypeDescription', backendField: 'accountTypeDescription' },
  { localField: 'customerNumber', backendField: 'customerNumber' },
  { localField: 'accountName', backendField: 'accountName' },
  { localField: 'gpoNumber', backendField: 'gpoNumber' },
  { localField: 'gpoName', backendField: 'gpoName' },
  { localField: 'progNum', backendField: 'progNum' },
  { localField: 'programType', backendField: 'programType' },
  { localField: 'progSubNum', backendField: 'progSubNum' },
  { localField: 'programSubType', backendField: 'programSubType' },
  { localField: 'productFamily', backendField: 'productFamily' },
  { localField: 'productCategory', backendField: 'productCategory' },
  { localField: 'productGroup', backendField: 'productGroup' },
  { localField: 'productSubCategory', backendField: 'productSubCategory' },
  { localField: 'mckBrandContractPercent', backendField: 'mckBrandContractPct' },
  { localField: 'mckBrandNonContractPercent', backendField: 'mckBrandNonContractPct' },
  { localField: 'allOtherContractPercent', backendField: 'allOtherContractPct' },
  { localField: 'allOtherNonContractPercent', backendField: 'allOtherNonContractPct' },
  { localField: 'notes', backendField: 'notes' },
  { localField: 'createdByUser', backendField: 'createdByUser' },
  { localField: 'createdDate', backendField: 'createDate' }
];

const CustomerGpoAdjustmentsAddPage = {
  entityName: '',
  gridApi: null,
  gridElement: null,
  bulkUploadModal: null,
  uploadedRows: [],
  uploadFilter: 'all',
  selectedJobId: null,
  jobRows: [],
  detachCommunityPaste: null,
  pollTimer: null,
  maxPasteRows: 5000,
  maxPasteCols: 40,
  maxPasteCells: 200000,

  init() {
    this.entityName = String(window.CUSTOMER_GPO_ADJUSTMENTS_ENTITY_NAME || 'customer-gpo-adjustment').trim();
    this.cacheDom();
    this.initGrid();
    this.initBatchSectionControls();
    this.initBatchTable();
    this.initBulkUploadModal();
    this.bindBulkUploadAction();
    this.bindToolbarActions();
    this.initViewActions();
    this.restoreJobs();
  },

  cacheDom() {
    this.uploadStatusRow = document.getElementById('customerGpoUploadStatusRow');
    this.uploadStatusInputs = Array.from(document.querySelectorAll('input[name="customerGpoUploadStatus"]'));
    this.batchSection = document.querySelector('.bulk-upload-batch-section');
    this.batchCollapseBtn = document.getElementById('bulkUploadBatchCollapseBtn');
    this.batchInfoText = this.batchSection?.querySelector('.bulk-upload-batch-info-text') || null;
    this.batchTableBody = document.getElementById('bulkUploadBatchTableBody');
    if (this.uploadStatusRow) this.uploadStatusRow.hidden = true;
  },

  initialRows() {
    return [this.createBlankRow()];
  },

  createBlankRow() {
    const row = {};
    CUSTOMER_GPO_FIELD_DEFS.forEach(({ field }) => {
      row[field] = '';
    });
    row.uploadStatus = '';
    row.uploadErrors = [];
    row.errorMessages = [];
    row.fieldErrorMessages = {};
    row.editedFields = [];
    row.wasEditedAfterError = false;
    row.mainTableId = null;
    row.isBackendRow = false;
    return row;
  },

  initGrid() {
    const dateComparator = window.GridFilterOperatorUtils?.createUsDateComparator
      ? window.GridFilterOperatorUtils.createUsDateComparator((value) => this.usDateToIso(value))
      : null;

    this.gridApi = DynamicGrid.createGrid({
      gridElementId: 'customerGpoAdjustmentsAddGrid',
      paginationType: 'client',
      pageSize: 20,
      floatingFilter: true,
      manualFilterApply: true,
      gridOptions: {
        rowData: this.initialRows(),
        rowSelection: 'multiple',
        isRowSelectable: (node) => this.canSelectRow(node?.data),
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
        defaultColDef: {
          sortable: true,
          unSortIcon: true,
          wrapHeaderText: true,
          autoHeaderHeight: true,
          editable: (params) => this.isEditableCell(params),
          resizable: true
        },
      },
      columns: [
        {
          field: 'select',
          headerName: '',
          checkboxSelection: (params) => this.canSelectRow(params?.data),
          headerCheckboxSelection: (params) => this.hasSelectableRows(params?.api),
          headerCheckboxSelectionFilteredOnly: true,
          showDisabledCheckboxes: true,
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
        ...CUSTOMER_GPO_FIELD_DEFS.map((column) => this.buildColumn(column, dateComparator))
      ]
    });

    this.gridElement = document.getElementById('customerGpoAdjustmentsAddGrid');
    if (!this.gridApi) return;

    if (typeof this.detachCommunityPaste === 'function') {
      this.detachCommunityPaste();
      this.detachCommunityPaste = null;
    }
    if (window.CommunityGridPaste?.attach) {
      const pasteableFields = CUSTOMER_GPO_FIELD_DEFS.filter((column) => column.editable !== false).map((column) => column.field);
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
        resolveHeaderField: (header) => this.resolvePasteHeaderField(header, pasteableFields),
        requireHeaderMapping: true,
        headerMatchThreshold: 3,
        onApplied: () => this.syncUploadedRowsFromGrid(true)
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
        GridManager.init(this.gridApi, 'customerGpoAdjustmentsAddGrid');
      }
    }, 300);
  },

  buildColumn(column, dateComparator) {
    const config = {
      field: column.field,
      headerName: column.headerName,
      minWidth: column.minWidth,
      cellClass: column.type === 'date' || column.type === 'number' ? 'cell-align-right' : 'cell-align-left',
      editable: column.editable !== false ? (params) => this.isEditableCell(params, column.field) : false,
      cellClassRules: this.validationCellRules(column.field),
      tooltipValueGetter: (params) => this.getCellErrorTooltip(params, column.field)
    };

    if (column.type === 'date') {
      config.filter = 'agDateColumnFilter';
      if (dateComparator) config.filterParams = { comparator: dateComparator };
    } else if (column.type === 'number') {
      config.filter = 'agNumberColumnFilter';
      config.filterValueGetter = (params) => this.numberFilterValue(params?.data?.[column.field]);
    }
    return config;
  },

  validationCellRules(field) {
    return {
      'screen-add-cell-error': (params) => Array.isArray(params.data?.uploadErrors) && params.data.uploadErrors.includes(field)
    };
  },

  isSuccessfulUploadRow(row) {
    return String(row?.uploadStatus || '').trim().toLowerCase() === 'success';
  },

  isErrorUploadRow(row) {
    return String(row?.uploadStatus || '').trim().toLowerCase() === 'error';
  },

  isProcessingUploadRow(row) {
    return String(row?.uploadStatus || '').trim().toLowerCase() === 'processing';
  },

  isReadyForResubmitRow(row) {
    return Boolean(row?.isBackendRow)
      && !this.isSuccessfulUploadRow(row)
      && Boolean(row?.wasEditedAfterError)
      && (!Array.isArray(row?.uploadErrors) || row.uploadErrors.length === 0);
  },

  canSelectRow(row) {
    if (!row) return false;
    if (!row.isBackendRow) return true;
    if (this.isSuccessfulUploadRow(row)) return false;
    return this.isReadyForResubmitRow(row);
  },

  hasSelectableRows(gridApi) {
    if (!gridApi || typeof gridApi.forEachNodeAfterFilterAndSort !== 'function') return false;
    let hasSelectable = false;
    gridApi.forEachNodeAfterFilterAndSort((node) => {
      if (!hasSelectable && this.canSelectRow(node?.data)) hasSelectable = true;
    });
    return hasSelectable;
  },

  isEditableCell(params, fieldOverride = '') {
    const field = fieldOverride || params?.colDef?.field;
    const row = params?.data;
    if (!field || !row) return false;
    const column = CUSTOMER_GPO_FIELD_DEFS.find((item) => item.field === field);
    if (column?.editable === false) return false;
    if (!row.isBackendRow) return true;
    return !this.isSuccessfulUploadRow(row) && !this.isProcessingUploadRow(row);
  },

  initBatchSectionControls() {
    if (!this.batchSection || !this.batchCollapseBtn) return;
    this.setBatchSectionCollapsed(true);
    this.batchCollapseBtn.addEventListener('click', () => {
      const isCollapsed = !this.batchSection.classList.contains('is-collapsed');
      this.setBatchSectionCollapsed(isCollapsed);
    });
  },

  setBatchSectionCollapsed(isCollapsed) {
    if (!this.batchSection || !this.batchCollapseBtn) return;
    this.batchSection.classList.toggle('is-collapsed', isCollapsed);
    this.batchCollapseBtn.setAttribute('aria-expanded', String(!isCollapsed));
    this.batchCollapseBtn.setAttribute('aria-label', isCollapsed ? 'Expand unfinished uploads' : 'Collapse unfinished uploads');
  },

  initBatchTable() {
    if (!this.batchTableBody) return;
    this.batchTableBody.addEventListener('click', (event) => {
      const removeBtn = event.target.closest('[data-job-remove]');
      if (removeBtn) {
        this.removeStoredJob(removeBtn.getAttribute('data-job-remove'));
        return;
      }

      const jobLink = event.target.closest('[data-job-link]');
      if (jobLink) {
        this.loadJobResults(jobLink.getAttribute('data-job-link'));
      }
    });
  },

  initBulkUploadModal() {
    if (!window.BulkUploadModal?.create) return;
    this.bulkUploadModal = window.BulkUploadModal.create({
      modalId: 'bulkUploadModal',
      dropzoneId: 'bulkUploadDropzone',
      inputId: 'bulkUploadInput',
      browseBtnId: 'bulkUploadBrowseBtn',
      nextBtnId: 'bulkUploadNextBtn',
      errorId: 'bulkUploadError',
      fileCardId: 'bulkUploadFileCard',
      fileNameId: 'bulkUploadSelectedFile',
      fileSizeId: 'bulkUploadFileSize',
      fileRemoveBtnId: 'bulkUploadFileRemoveBtn',
      initialNextLabel: 'Upload',
      uploadLabel: 'Upload',
      validateFile: (file) => /\.csv$/i.test(file.name) || file.type === 'text/csv',
      onUpload: (file, controls) => {
        return this.processUploadedCsv(file).then((success) => {
          if (success) controls.close();
          return success;
        });
      }
    });
  },

  bindBulkUploadAction() {
    const bulkUploadButton = document.querySelector('[data-action="bulk-upload"]');
    if (bulkUploadButton && this.bulkUploadModal) {
      bulkUploadButton.addEventListener('click', () => this.bulkUploadModal.open());
    }

    this.uploadStatusInputs.forEach((input) => {
      input.addEventListener('change', () => {
        if (!input.checked) return;
        this.uploadFilter = input.value;
        this.clearColumnFilters();
        this.applyUploadFilter();
      });
    });
  },

  bindToolbarActions() {
    document.addEventListener('click', (event) => {
      const actionButton = event.target.closest('.gt-action-btn[data-action]');
      if (!actionButton) return;

      switch (actionButton.dataset.action) {
        case 'back':
          window.location.href = window.CUSTOMER_GPO_ADJUSTMENTS_LIST_PAGE_URL || '/adjustments';
          break;
        case 'delete':
          this.deleteSelectedRows();
          break;
        case 'saveDraft':
          this.saveDraft();
          break;
        case 'submit':
          this.processGridRows();
          break;
        case 'execute':
          this.executeFilters();
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
      densityClassPrefix: 'kvi-density'
    });
  },

  applyDefaultDensity() {
    if (!this.gridApi || !this.gridElement || typeof GridToolbar === 'undefined') return;
    GridToolbar.stabilizeDensity({
      gridApi: this.gridApi,
      gridElement: this.gridElement,
      defaultMode: 'compact',
      densityClassPrefix: 'kvi-density'
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
    if (missingRows > 0) this.appendBlankRows(missingRows);
  },

  appendBlankRows(count) {
    if (!this.gridApi || !Number.isInteger(count) || count <= 0) return;
    this.gridApi.applyTransaction({ add: Array.from({ length: count }, () => this.createBlankRow()) });
  },

  syncUploadedRowsFromGrid(forceRebuild = false) {
    if (forceRebuild || this.uploadedRows.length === 0 || !this.selectedJobId) {
      const rows = this.getGridRows()
        .map((row) => this.normalizeRow(row))
        .filter((row) => !this.isRowEmpty(row))
        .map((row) => ({
          ...row,
          uploadStatus: '',
          uploadErrors: [],
          errorMessages: [],
          fieldErrorMessages: {},
          editedFields: [],
          wasEditedAfterError: false
        }));
      this.uploadedRows = rows;
    }

    if (this.uploadStatusRow) this.uploadStatusRow.hidden = this.uploadedRows.length === 0;
    if (this.uploadFilter !== 'all') this.applyUploadFilter();
  },

  getBulkUploadBaseUrl() {
    const baseUrl = String(window.API_BASE_URL || '').trim().replace(/\/$/, '');
    return baseUrl
      ? `${baseUrl}/api/foundational/api/bulk-upload`
      : '/api/foundational/api/bulk-upload';
  },

  getCurrentUser() {
    const currentUserId = document.getElementById('currentUserId')?.value;
    return String(currentUserId || window.GRID_PREF_TEST_USER_ID || 'test-user');
  },

  getStorageKey() {
    return `customer-gpo-adjustments-jobs:${this.entityName}`;
  },

  readStoredJobs() {
    try {
      const payload = window.localStorage?.getItem(this.getStorageKey());
      const rows = payload ? JSON.parse(payload) : [];
      return Array.isArray(rows) ? rows : [];
    } catch (error) {
      console.warn('Failed to read stored jobs', error);
      return [];
    }
  },

  writeStoredJobs(rows) {
    try {
      window.localStorage?.setItem(this.getStorageKey(), JSON.stringify(rows));
    } catch (error) {
      console.warn('Failed to write stored jobs', error);
    }
  },

  addStoredJob(jobId, seed = {}) {
    if (!jobId) return;
    const existing = this.readStoredJobs();
    const next = [
      {
        jobId: String(jobId),
        entityName: this.entityName,
        status: seed.status || 'PENDING_UPLOAD',
        programId: seed.programId || this.resolveUploadContext().programId,
        workStationId: seed.workStationId || this.resolveUploadContext().workStationId,
        updatedAt: seed.updatedAt || new Date().toISOString()
      },
      ...existing.filter((row) => String(row.jobId) !== String(jobId))
    ];
    this.jobRows = next;
    this.writeStoredJobs(next);
    this.renderStoredJobs(next);
    this.updateBatchInfoCount(this.countUnfinishedJobs(next));
  },

  removeStoredJob(jobId) {
    if (!jobId) return;
    const next = this.readStoredJobs().filter((row) => String(row.jobId) !== String(jobId));
    this.writeStoredJobs(next);
    this.jobRows = next;
    this.renderStoredJobs(next);
    this.updateBatchInfoCount(this.countUnfinishedJobs(next));
    if (String(this.selectedJobId || '') === String(jobId)) {
      this.selectedJobId = null;
      this.uploadedRows = [];
      this.applyUploadFilter();
    }
    this.showInfo('Job removed from this list.', 'success');
  },

  restoreJobs() {
    this.jobRows = this.readStoredJobs();
    this.renderStoredJobs(this.jobRows);
    this.updateBatchInfoCount(this.countUnfinishedJobs(this.jobRows));
    this.refreshStoredJobStatuses();
  },

  countUnfinishedJobs(rows) {
    return rows.filter((row) => this.isActionableJob(row)).length;
  },

  startPollingIfNeeded() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  },

  async refreshStoredJobStatuses() {
    const stored = this.readStoredJobs();
    if (stored.length === 0) {
      this.jobRows = [];
      this.renderStoredJobs([]);
      this.updateBatchInfoCount(0);
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
      return;
    }

    const next = await Promise.all(stored.map(async (row) => {
      try {
        const status = await this.fetchJobStatus(row.jobId);
        return this.normalizeJobRow(status);
      } catch (error) {
        return {
          ...row,
          status: row.status || 'UNKNOWN',
          errorMessage: error?.message || 'Failed to refresh status'
        };
      }
    }));

    this.jobRows = next;
    this.writeStoredJobs(next);
    this.renderStoredJobs(next);
    this.updateBatchInfoCount(this.countUnfinishedJobs(next));
    this.startPollingIfNeeded();
  },

  renderStoredJobs(rows) {
    if (!this.batchTableBody) return;
    const visibleRows = this.getVisibleBatchRows(rows);
    if (!visibleRows || visibleRows.length === 0) {
      this.batchTableBody.innerHTML = '<div class="bulk-upload-batch-empty">No upload tracked yet.</div>';
      return;
    }

    this.batchTableBody.innerHTML = visibleRows.map((row) => `
      <div class="bulk-upload-batch-row" role="listitem">
        <span class="bulk-upload-batch-cell"><button type="button" class="bulk-upload-batch-number-link" data-job-link="${this.escapeHtml(row.jobId)}">${this.escapeHtml(row.jobId)}</button></span>
        <span class="bulk-upload-batch-cell">${this.escapeHtml(row.status || '')}</span>
        <span class="bulk-upload-batch-cell">${this.escapeHtml(row.totalRows ?? '')}</span>
        <span class="bulk-upload-batch-cell">${this.escapeHtml(row.processedRows ?? '')}</span>
        <span class="bulk-upload-batch-cell">${this.escapeHtml(row.successCount ?? '')}</span>
        <span class="bulk-upload-batch-cell">${this.escapeHtml(row.errorCount ?? '')}</span>
        <span class="bulk-upload-batch-cell">${this.escapeHtml(row.programId || '')}</span>
        <span class="bulk-upload-batch-cell">${this.escapeHtml(row.workStationId || '')}</span>
        <span class="bulk-upload-batch-cell">${this.escapeHtml(this.formatDateTime(row.createdAt))}</span>
        <span class="bulk-upload-batch-cell">${this.escapeHtml(this.formatDateTime(row.updatedAt || row.completedAt || row.createdAt))}</span>
        <span class="bulk-upload-batch-cell"><button type="button" class="bulk-upload-batch-delete-btn" data-job-remove="${this.escapeHtml(row.jobId)}" aria-label="Remove job">🗑</button></span>
      </div>
    `).join('');
  },

  getVisibleBatchRows(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return [];
    return rows[0] ? [rows[0]] : [];
  },

  isSuccessfulBatchStatus(status) {
    const normalized = String(status || '').trim().toUpperCase();
    return ['SUCCESS', 'COMPLETED', 'VALID'].includes(normalized);
  },

  updateBatchInfoCount(count) {
    if (!this.batchInfoText) return;
    this.batchInfoText.textContent = `You have [${count}] batches to review.`;
  },

  escapeHtml(value) {
    return String(value == null ? '' : value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  },

  formatDateTime(value) {
    if (!value) return '';
    const raw = String(value).trim();
    if (/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}$/.test(raw)) {
      return raw;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return raw;
    return `${this.toUsDate(date.toISOString())} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }
    return payload;
  },

  normalizeJobRow(status) {
    return {
      jobId: String(status?.jobId || ''),
      entityName: status?.entityName || this.entityName,
      sourceType: status?.sourceType || '',
      programId: status?.programId || '',
      workStationId: status?.workStationId || status?.workstationId || status?.workStnId || '',
      status: status?.status || '',
      totalRows: status?.totalRows ?? '',
      successCount: status?.successCount ?? '',
      errorCount: status?.errorCount ?? '',
      warningCount: status?.warningCount ?? '',
      processedRows: status?.processedRows ?? '',
      progressPercentage: status?.progressPercentage ?? '',
      createdAt: status?.createdAt || '',
      startedAt: status?.startedAt || '',
      completedAt: status?.completedAt || '',
      updatedAt: status?.updatedAt || '',
      errorMessage: status?.errorMessage || '',
      batchJobExecutionId: status?.batchJobExecutionId ?? ''
    };
  },

  async fetchJobStatus(jobId) {
    const endpoint = `${this.getBulkUploadBaseUrl()}/jobs/status?jobId=${encodeURIComponent(jobId)}`;
    return this.fetchJson(endpoint, { method: 'GET', headers: { Accept: 'application/json' } });
  },

  async fetchJobResults(jobId, onlyErrors = false) {
    const endpoint = onlyErrors
      ? `${this.getBulkUploadBaseUrl()}/jobs/errors?jobId=${encodeURIComponent(jobId)}&page=0&size=100`
      : `${this.getBulkUploadBaseUrl()}/jobs/results?jobId=${encodeURIComponent(jobId)}&page=0&size=100`;
    return this.fetchJson(endpoint, { method: 'GET', headers: { Accept: 'application/json' } });
  },

  isTerminalStatus(status) {
    return ['COMPLETED', 'FAILED'].includes(String(status || '').toUpperCase());
  },

  isActionableJob(row) {
    if (!row) return false;
    if (!this.isTerminalStatus(row.status)) return true;
    return Number(row.errorCount || 0) > 0;
  },

  toUploadStatus(value) {
    const normalized = String(value || '').trim().toUpperCase();
    if (['SUCCESS', 'COMPLETED', 'VALID'].includes(normalized)) return 'success';
    if (['ERROR', 'FAILED', 'INVALID'].includes(normalized)) return 'error';
    return '';
  },

  mapErrorField(field) {
    const normalized = this.normalizeHeader(field);
    const match = CUSTOMER_GPO_FIELD_DEFS.find((column) => this.normalizeHeader(column.headerName) === normalized || this.normalizeHeader(column.field) === normalized);
    return match?.field || '';
  },

  extractFieldErrorMessages(item) {
    const messagesByField = {};
    const assignMessage = (field, message) => {
      const mappedField = this.mapErrorField(field);
      if (!mappedField || message == null || message === '') return;
      messagesByField[mappedField] = String(message);
    };

    if (item?.fieldErrors && typeof item.fieldErrors === 'object' && !Array.isArray(item.fieldErrors)) {
      Object.entries(item.fieldErrors).forEach(([field, message]) => assignMessage(field, message));
    }

    if (Array.isArray(item?.fieldErrors)) {
      item.fieldErrors.forEach((entry) => {
        if (!entry || typeof entry !== 'object') return;
        assignMessage(entry.field || entry.name || entry.key, entry.message || entry.errorMessage || entry.reason);
      });
    }

    if (Array.isArray(item?.errors)) {
      item.errors.forEach((entry) => {
        if (!entry || typeof entry !== 'object') return;
        assignMessage(entry.field || entry.name || entry.key, entry.message || entry.errorMessage || entry.reason);
      });
    }

    if (Array.isArray(item?.errorFields) && Array.isArray(item?.errorMessages) && item.errorFields.length === item.errorMessages.length) {
      item.errorFields.forEach((field, index) => assignMessage(field, item.errorMessages[index]));
    }

    return messagesByField;
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

  getFieldValue(source, field) {
    if (!source || typeof source !== 'object') return '';

    if (source[field] != null) return source[field];

    const aliases = CUSTOMER_GPO_BACKEND_ALIASES[field] || [];
    for (const alias of aliases) {
      if (source[alias] != null) return source[alias];
    }

    const normalizedField = this.normalizeHeader(field);
    for (const [key, value] of Object.entries(source)) {
      if (this.normalizeHeader(key) === normalizedField) return value;
    }

    const column = CUSTOMER_GPO_FIELD_DEFS.find((item) => item.field === field);
    if (column) {
      const normalizedHeader = this.normalizeHeader(column.headerName);
      for (const [key, value] of Object.entries(source)) {
        if (this.normalizeHeader(key) === normalizedHeader) return value;
      }
    }

    return '';
  },

  toBackendDataShape(source) {
    const mapped = this.createBlankRow();
    CUSTOMER_GPO_FIELD_DEFS.forEach(({ field }) => {
      mapped[field] = this.getFieldValue(source, field);
    });
    return mapped;
  },

  resolveUploadInstructions(response, file) {
    const instructions = response?.uploadInstructions;
    const method = String(instructions?.method || 'PUT').toUpperCase();
    const headers = {};
    const assignHeader = (key, value) => {
      if (!key || value == null || value === '') return;
      headers[key] = value;
    };

    if (instructions?.headers && typeof instructions.headers === 'object' && !Array.isArray(instructions.headers)) {
      Object.entries(instructions.headers).forEach(([key, value]) => assignHeader(key, value));
    }

    if (Array.isArray(instructions?.headers)) {
      instructions.headers.forEach((entry) => {
        assignHeader(entry?.name || entry?.key, entry?.value);
      });
    }

    if (!Object.keys(headers).some((key) => key.toLowerCase() === 'content-type')) {
      headers['Content-Type'] = file.type || 'text/csv';
    }

    return { method, headers };
  },

  normalizeResultRow(item) {
    const baseRow = this.normalizeRow(this.toBackendDataShape(item?.data || {}));
    const mainTableId = item?.mainTableId ?? null;
    const createTime = String(item?.data?.createTime ?? item?.createTime ?? '').trim();
    const updatedAt = String(item?.data?.updatedAt ?? item?.updatedAt ?? '').trim();
    const { datePart: createdDatePart, timePart: createTimePart } = this.splitBackendDateTime(createTime);
    const { datePart: updatedDatePart, timePart: updatedTimePart } = this.splitBackendDateTime(updatedAt);
    const fieldErrorMessages = this.extractFieldErrorMessages(item);
    const uploadErrors = Array.from(new Set([
      ...(Array.isArray(item?.errorFields) ? item.errorFields.map((field) => this.mapErrorField(field)).filter(Boolean) : []),
      ...Object.keys(fieldErrorMessages)
    ]));
    const uploadStatus = this.toUploadStatus(item?.status)
      || (uploadErrors.length > 0 || (Array.isArray(item?.errorMessages) && item.errorMessages.length > 0) ? 'error' : 'success');

    return {
      ...baseRow,
      uniqueKeyId: baseRow.uniqueKeyId || (mainTableId == null ? '' : String(mainTableId)),
      createdDate: baseRow.createdDate || createdDatePart,
      createTime: baseRow.createTime || createTimePart,
      dateUpdated: baseRow.dateUpdated || updatedDatePart,
      timeUpdated: baseRow.timeUpdated || updatedTimePart,
      uploadStatus,
      uploadErrors,
      errorMessages: Array.isArray(item?.errorMessages) ? item.errorMessages : [],
      fieldErrorMessages,
      editedFields: [],
      wasEditedAfterError: false,
      rowNumber: item?.rowNumber ?? null,
      mainTableId,
      isBackendRow: true
    };
  },

  splitBackendDateTime(value) {
    const raw = String(value || '').trim();
    if (!raw) return { datePart: '', timePart: '' };
    const [dateToken = '', timeToken = ''] = raw.split(/\s+/, 2);
    return {
      datePart: this.toUsDate(dateToken),
      timePart: timeToken
    };
  },

  async loadJobResults(jobId, options = {}) {
    if (!jobId) return;
    const { showToast = true, resetUploadFilter = true, clearColumnFilters = false } = options;
    this.selectedJobId = String(jobId);
    try {
      const [status, resultsPayload] = await Promise.all([
        this.fetchJobStatus(jobId),
        this.fetchJobResults(jobId, false)
      ]);

      const normalizedStatus = this.normalizeJobRow(status);
      this.upsertJobRow(normalizedStatus);

      const rows = Array.isArray(resultsPayload?.results)
        ? resultsPayload.results.map((row) => this.normalizeResultRow(row))
        : [];

      this.uploadedRows = rows;
      if (resetUploadFilter) {
        this.uploadFilter = 'all';
        this.uploadStatusInputs.forEach((input) => {
          input.checked = input.value === 'all';
        });
      }
      if (this.uploadStatusRow) this.uploadStatusRow.hidden = rows.length === 0;
      if (clearColumnFilters) this.clearColumnFilters();
      this.applyUploadFilter();
      if (showToast) {
        if (normalizedStatus.errorMessage && this.isTerminalStatus(normalizedStatus.status)) {
          this.showInfo(normalizedStatus.errorMessage, normalizedStatus.status === 'FAILED' ? 'error' : 'success');
        } else {
          this.showInfo(`Loaded job ${jobId} (${rows.length} row(s)).`, 'success');
        }
      }
    } catch (error) {
      console.error('Failed to load job results:', error);
      this.showInfo(error?.message || 'Failed to load job results.', 'error');
    }
  },

  upsertJobRow(row) {
    const next = [row, ...this.readStoredJobs().filter((item) => String(item.jobId) !== String(row.jobId))];
    this.jobRows = next;
    this.writeStoredJobs(next);
    this.renderStoredJobs(next);
    this.updateBatchInfoCount(this.countUnfinishedJobs(next));
    this.startPollingIfNeeded();
  },

  async refreshSingleJobStatus(jobId) {
    if (!jobId) return null;
    try {
      const status = await this.fetchJobStatus(jobId);
      const normalizedStatus = this.normalizeJobRow(status);
      this.upsertJobRow(normalizedStatus);
      return normalizedStatus;
    } catch (error) {
      console.warn('Failed to refresh single job status', error);
      return null;
    }
  },

  async processUploadedCsv(file) {
    try {
      console.debug('[CustomerGpoAdjustmentsAdd] processUploadedCsv:start', {
        fileName: file?.name,
        size: file?.size
      });
      const response = await this.requestSignedUrlUpload(file);

      if (!response?.jobId) throw new Error('Job id missing from upload response');

      console.debug('[CustomerGpoAdjustmentsAdd] processUploadedCsv:job-created', {
        jobId: response.jobId,
        fileName: response.fileName || file?.name
      });

      this.addStoredJob(response.jobId, {
        status: 'PENDING_UPLOAD',
        programId: this.resolveUploadContext().programId,
        workStationId: this.resolveUploadContext().workStationId
      });
      await this.refreshSingleJobStatus(response.jobId);
      this.showInfo(`Upload accepted. Job ${response.jobId} created.`, 'success');
      return true;
    } catch (error) {
      console.error('Bulk upload failed:', error);
      this.showInfo(error?.message || 'Bulk upload failed.', 'error');
      return false;
    }
  },

  resolveUploadContext() {
    const gridRows = this.getGridRows().map((row) => this.normalizeRow(row));
    const firstPopulated = gridRows.find((row) => !this.isRowEmpty(row)) || {};
    return {
      userId: firstPopulated.userId || this.getCurrentUser(),
      programId: firstPopulated.programId || String(window.CUSTOMER_GPO_PROGRAM_ID || 'PROG001'),
      workStationId: firstPopulated.workStnId || firstPopulated.workStationId || String(window.CUSTOMER_GPO_WORK_STATION_ID || 'WS001')
    };
  },

  getBulkUploadFileName(file) {
    const rawExtension = String(file?.name || '').trim().split('.').pop();
    const hasExtension = rawExtension && rawExtension !== String(file?.name || '').trim();
    const extension = hasExtension ? `.${rawExtension}` : '.csv';
    return `${this.entityName}${extension}`;
  },

  async requestSignedUrlUpload(file) {
    const context = this.resolveUploadContext();
    const uploadFileName = this.getBulkUploadFileName(file);
    console.debug('[CustomerGpoAdjustmentsAdd] requestSignedUrlUpload:request', {
      entityName: this.entityName,
      fileName: uploadFileName,
      userId: context.userId,
      programId: context.programId,
      workStationId: context.workStationId
    });
    const response = await this.fetchJson(`${this.getBulkUploadBaseUrl()}/request-signed-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        entityName: this.entityName,
        userId: context.userId,
        programId: context.programId,
        workStationId: context.workStationId,
        fileName: uploadFileName
      })
    });

    if (!response?.signedUrl) throw new Error('Signed URL missing from response');
    console.debug('[CustomerGpoAdjustmentsAdd] requestSignedUrlUpload:response', {
      jobId: response.jobId,
      signedUrl: response.signedUrl,
      uploadInstructions: response.uploadInstructions
    });
    const uploadRequest = this.resolveUploadInstructions(response, file);
    console.debug('[CustomerGpoAdjustmentsAdd] requestSignedUrlUpload:put-start', {
      jobId: response.jobId,
      fileName: file?.name,
      method: uploadRequest.method,
      headers: uploadRequest.headers
    });

    const uploadResponse = await fetch(response.signedUrl, {
      method: uploadRequest.method,
      headers: uploadRequest.headers,
      body: file
    });
    console.debug('[CustomerGpoAdjustmentsAdd] requestSignedUrlUpload:put-finish', {
      jobId: response.jobId,
      fileName: file?.name,
      status: uploadResponse.status,
      ok: uploadResponse.ok
    });
    if (!uploadResponse.ok) throw new Error(`Signed upload failed: ${uploadResponse.status}`);

    return response;
  },

  async uploadCsvDirectly(file) {
    const context = this.resolveUploadContext();
    const uploadFileName = this.getBulkUploadFileName(file);
    const formData = new FormData();
    formData.append('entityName', this.entityName);
    formData.append('userId', context.userId);
    formData.append('programId', context.programId);
    formData.append('workStationId', context.workStationId);
    formData.append('file', file, uploadFileName);
    return this.fetchJson(`${this.getBulkUploadBaseUrl()}/csv`, {
      method: 'POST',
      body: formData
    });
  },

  async submitGridRows(rows, mode = 'grid') {
    const context = this.resolveUploadContext();
    const gridParams = new URLSearchParams({
      entityName: this.entityName,
      userId: context.userId,
      programId: context.programId,
      workStationId: context.workStationId
    });
    const endpoint = mode === 'resubmit' && this.selectedJobId
      ? `${this.getBulkUploadBaseUrl()}/jobs/resubmit?jobId=${encodeURIComponent(this.selectedJobId)}&createNewJob=false`
      : `${this.getBulkUploadBaseUrl()}/grid?${gridParams.toString()}`;

    const payload = mode === 'resubmit'
      ? {
          correctedRecords: rows.map((row) => ({
            rowNumber: row.rowNumber,
            data: this.toBackendRecord(row)
          }))
        }
      : {
          records: rows.map((row) => this.toBackendRecord(row)),
          source: 'GRID'
        };

    return this.fetchJson(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  processGridRows() {
    const selectedRows = this.gridApi?.getSelectedRows?.() || [];
    const sourceRows = selectedRows.length > 0 ? selectedRows : this.getGridRows();

    const normalizedRows = sourceRows
      .map((row) => this.normalizeRow(row))
      .filter((row) => !this.isRowEmpty(row));

    if (normalizedRows.length === 0) {
      this.showInfo(selectedRows.length > 0 ? 'Selected row(s) are empty.' : 'Paste or enter at least one row before processing.', 'error');
      return;
    }

    const submitRows = normalizedRows.map((row) => ({
      ...row,
      uploadStatus: '',
      uploadErrors: [],
      errorMessages: [],
      fieldErrorMessages: {},
      editedFields: [],
      wasEditedAfterError: false
    }));

    const shouldResubmit = Boolean(this.selectedJobId) && sourceRows.some((row) => row.isBackendRow);
    if (shouldResubmit && selectedRows.length === 0) {
      this.showInfo('You have error rows. Select the corrected row(s) and then submit.', 'warning');
      return;
    }
    const mode = shouldResubmit ? 'resubmit' : 'grid';

    this.submitGridRows(submitRows, mode).then(async (response) => {
      if (mode === 'resubmit') {
        if (typeof this.gridApi?.deselectAll === 'function') {
          this.gridApi.deselectAll();
        }
        submitRows.forEach((submittedRow) => {
          const match = this.uploadedRows.find((row) => row.isBackendRow
            && row.rowNumber === submittedRow.rowNumber
            && row.mainTableId === submittedRow.mainTableId);
          if (!match) return;
          match.uploadStatus = 'processing';
          match.wasEditedAfterError = false;
          match.uploadErrors = [];
          match.fieldErrorMessages = {};
          match.errorMessages = [];
        });
        this.applyUploadFilter();
        this.showInfo(response?.message || 'Selected corrected row(s) submitted successfully.', 'success');
        if (this.selectedJobId) {
          const refreshedStatus = await this.refreshSingleJobStatus(this.selectedJobId);
          this.uploadFilter = 'all';
          this.uploadStatusInputs.forEach((input) => {
            input.checked = input.value === 'all';
          });
          this.clearColumnFilters();
          this.applyUploadFilter();
          if (this.isTerminalStatus(refreshedStatus?.status)) {
            await this.loadJobResults(this.selectedJobId, {
              showToast: false,
              resetUploadFilter: true,
              clearColumnFilters: true
            });
          }
        }
        return;
      }

      if (!response?.jobId) throw new Error('Job id missing from submit response');
      this.addStoredJob(response.jobId, {
        status: 'PROCESSING',
        programId: submitRows[0]?.programId || '',
        workStationId: submitRows[0]?.workStnId || submitRows[0]?.workStationId || ''
      });
      await this.refreshSingleJobStatus(response.jobId);
      this.showInfo(response.message || `Job ${response.jobId} created successfully.`, 'success');
    }).catch((error) => {
      console.error('Grid processing failed:', error);
      this.showInfo(error?.message || 'Grid processing failed.', 'error');
    });
  },

  toBackendRecord(row) {
    const context = this.resolveUploadContext();
    const payload = {};

    CUSTOMER_GPO_OUTBOUND_FIELDS.forEach(({ localField, backendField, useContextFallback }) => {
      let value = row[localField];
      if ((value == null || value === '') && useContextFallback) {
        value = context[useContextFallback];
      }
      payload[backendField] = value == null ? '' : value;
    });

    return payload;
  },

  normalizeHeader(header) {
    if (window.CsvUploadUtils?.normalizeHeader) return window.CsvUploadUtils.normalizeHeader(header);
    return String(header || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  },

  resolvePasteHeaderField(header, allowedFields = null) {
    const normalizedHeader = this.normalizeHeader(header);
    if (!normalizedHeader) return '';

    const match = CUSTOMER_GPO_FIELD_DEFS.find(({ field, headerName }) => {
      if (this.normalizeHeader(field) === normalizedHeader) return true;
      if (this.normalizeHeader(headerName) === normalizedHeader) return true;
      const aliases = CUSTOMER_GPO_BACKEND_ALIASES[field] || [];
      return aliases.some((alias) => this.normalizeHeader(alias) === normalizedHeader);
    });

    if (!match) return '';
    if (Array.isArray(allowedFields) && allowedFields.length > 0 && !allowedFields.includes(match.field)) {
      return '';
    }
    return match.field;
  },

  toUsDate(value) {
    if (window.CsvUploadUtils?.toUsDate) return window.CsvUploadUtils.toUsDate(value);
    return String(value || '').trim();
  },

  isValidUsDate(value) {
    if (!value) return true;
    if (window.CsvUploadUtils?.isValidUsDate) return window.CsvUploadUtils.isValidUsDate(value);
    return false;
  },

  isNumeric(value) {
    if (!value && value !== 0) return true;
    if (window.CsvUploadUtils?.isNumeric) return window.CsvUploadUtils.isNumeric(value);
    return !Number.isNaN(Number(String(value).replace(/,/g, '').trim()));
  },

  numberFilterValue(value) {
    const raw = String(value ?? '').replace(/,/g, '').trim();
    if (!raw) return null;
    const numeric = Number(raw);
    return Number.isFinite(numeric) ? numeric : null;
  },

  usDateToIso(value) {
    const normalized = this.toUsDate(value);
    if (!this.isValidUsDate(normalized) || !normalized) return '';
    const [mm, dd, yyyy] = normalized.split('/');
    return `${yyyy}-${mm}-${dd}`;
  },

  normalizeRow(row) {
    const normalized = { ...this.createBlankRow(), ...row };
    CUSTOMER_GPO_FIELD_DEFS.forEach(({ field }) => {
      const value = normalized[field];
      if (CUSTOMER_GPO_DATE_FIELDS.has(field)) {
        normalized[field] = this.toUsDate(value || '');
      } else {
        normalized[field] = String(value ?? '').trim();
      }
    });
    return normalized;
  },

  isRowEmpty(row) {
    return CUSTOMER_GPO_FIELD_DEFS
      .filter(({ field }) => !['uniqueKeyId', 'createdByUser', 'createdDate', 'createTime', 'dateUpdated', 'timeUpdated'].includes(field))
      .every(({ field }) => !String(row[field] || '').trim());
  },

  onCellValueChanged(event) {
    const field = event?.colDef?.field;
    const rowNode = event?.node;
    if (!field || !rowNode?.data) return;

    const normalized = this.normalizeRow(rowNode.data);
    Object.assign(rowNode.data, this.buildEditedRowState(normalized, field));
    if (this.gridApi?.refreshCells) this.gridApi.refreshCells({ rowNodes: [rowNode], force: true });
    if (this.selectedJobId) {
      if (typeof this.gridApi?.deselectNode === 'function') this.gridApi.deselectNode(rowNode);
      this.applyUploadFilter();
      return;
    }
    this.syncUploadedRowsFromGrid(true);
  },

  buildEditedRowState(row, editedField) {
    const nextFieldErrorMessages = { ...(row.fieldErrorMessages || {}) };
    delete nextFieldErrorMessages[editedField];

    const nextUploadErrors = Array.isArray(row.uploadErrors)
      ? row.uploadErrors.filter((field) => field !== editedField)
      : [];

    const nextEditedFields = Array.from(new Set([...(Array.isArray(row.editedFields) ? row.editedFields : []), editedField]));
    const nextStatus = row.isBackendRow ? 'error' : '';

    return {
      ...row,
      uploadStatus: nextStatus,
      uploadErrors: nextUploadErrors,
      fieldErrorMessages: nextFieldErrorMessages,
      editedFields: nextEditedFields,
      wasEditedAfterError: row.isBackendRow ? true : Boolean(row.wasEditedAfterError)
    };
  },

  async parseAndMapCsvFile(file) {
    const csvText = await file.text();
    const parsed = window.CsvUploadUtils?.parseCsvText
      ? window.CsvUploadUtils.parseCsvText(csvText)
      : { normalizedHeaders: [], rows: [] };

    if (parsed.rows.length < 1) throw new Error('CSV must include header and at least one data row');

    const indexByHeader = {};
    parsed.normalizedHeaders.forEach((header, index) => {
      indexByHeader[header] = index;
    });

    return parsed.rows.map((cells) => {
      const row = this.createBlankRow();
      CUSTOMER_GPO_FIELD_DEFS.forEach(({ field, headerName }) => {
        const index = indexByHeader[this.normalizeHeader(headerName)] ?? indexByHeader[this.normalizeHeader(field)];
        row[field] = index == null ? '' : (cells[index] || '');
      });
      return this.normalizeResultRow({
        status: 'SUCCESS',
        data: row,
        errorFields: [],
        errorMessages: []
      });
    });
  },

  applyAdvancedFilters() {
    const fieldTypeMap = {};
    CUSTOMER_GPO_FIELD_DEFS.forEach((column) => {
      if (column.type === 'date') fieldTypeMap[column.field] = 'date';
      else if (column.type === 'number') fieldTypeMap[column.field] = 'number';
      else fieldTypeMap[column.field] = 'text';
    });

    if (window.GridFilterOperatorUtils?.applyFloatingFilters) {
      window.GridFilterOperatorUtils.applyFloatingFilters({
        gridApi: this.gridApi,
        gridElement: this.gridElement,
        fieldTypeMap,
        toDateIso: (value) => this.usDateToIso(value),
        isNumeric: (value) => this.isNumeric(value),
        onValidationError: (field, reason) => this.showInfo(`${field}: ${reason}`, 'error')
      });
      return;
    }

    if (typeof this.gridApi?.onFilterChanged === 'function') this.gridApi.onFilterChanged();
  },

  applyUploadFilter() {
    if (!this.gridApi) return;
    if (this.uploadStatusRow) this.uploadStatusRow.hidden = this.uploadedRows.length === 0;
    const filteredRows = this.uploadFilter === 'all'
      ? this.uploadedRows
      : this.uploadedRows.filter((row) => row.uploadStatus === this.uploadFilter);
    this.gridApi.setGridOption('rowData', filteredRows.length > 0 ? filteredRows : (this.selectedJobId ? [] : this.initialRows()));
  },

  clearColumnFilters() {
    if (!this.gridApi) return;
    if (typeof this.gridApi.setFilterModel === 'function') this.gridApi.setFilterModel(null);
    if (typeof this.gridApi.onFilterChanged === 'function') this.gridApi.onFilterChanged();
    if (this.gridElement) {
      this.gridElement.querySelectorAll('.mfi-floating-filter-input').forEach((input) => {
        input.value = '';
      });
    }
  },

  deleteSelectedRows() {
    if (!this.gridApi) return;
    const selectedRows = this.gridApi.getSelectedRows?.() || [];
    if (selectedRows.length === 0) {
      this.showInfo('Select at least one row to delete.', 'error');
      return;
    }
    this.gridApi.applyTransaction({ remove: selectedRows });
    if (!this.selectedJobId) this.syncUploadedRowsFromGrid(true);
  },

  getGridRows() {
    const rows = [];
    if (!this.gridApi) return rows;
    this.gridApi.forEachNode((node) => {
      if (node?.data) rows.push(node.data);
    });
    return rows;
  },

  saveDraft() {
    this.syncUploadedRowsFromGrid(true);
    this.showInfo('Rows kept locally on the page. No backend draft API is available yet.', 'success');
  },

  executeFilters() {
    this.applyAdvancedFilters();
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
    let container = document.getElementById('customerGpoPageToastLayer');
    if (container) return container;

    container = document.createElement('div');
    container.id = 'customerGpoPageToastLayer';
    container.className = 'app-page-toast-layer';
    document.body.appendChild(container);
    return container;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  CustomerGpoAdjustmentsAddPage.init();
});
