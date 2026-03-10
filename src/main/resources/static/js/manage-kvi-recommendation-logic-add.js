class KviInlineSaveCellEditor {
  init(params) {
    this.params = params;
    this.eGui = document.createElement('div');
    this.eGui.className = 'kvi-inline-save-editor';

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.className = 'kvi-inline-save-input';
    this.input.value = params.value == null ? '' : String(params.value);
    this.input.placeholder = '_';

    this.saveBtn = document.createElement('button');
    this.saveBtn.type = 'button';
    this.saveBtn.className = 'kvi-inline-save-btn';
    this.saveBtn.textContent = 'Save';

    this.onInputKeyDown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        this.onSaveClick();
      }
    };

    this.onSaveMouseDown = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    this.onSaveClick = () => {
      const pageRef = this.params.pageRef;
      const field = this.params.column?.getColId?.() || this.params.colDef?.field;
      const result = pageRef?.saveCellFromEditor
        ? pageRef.saveCellFromEditor(this.params.node, field, this.input.value)
        : { ok: true, value: this.input.value };

      if (result?.ok) {
        this.input.value = result.value == null ? '' : String(result.value);
        this.params.stopEditing();
      }
    };

    this.input.addEventListener('keydown', this.onInputKeyDown);
    this.saveBtn.addEventListener('mousedown', this.onSaveMouseDown);
    this.saveBtn.addEventListener('click', this.onSaveClick);

    this.eGui.appendChild(this.input);
    this.eGui.appendChild(this.saveBtn);
  }

  getGui() {
    return this.eGui;
  }

  afterGuiAttached() {
    if (this.input) {
      this.input.focus();
      this.input.select();
    }
  }

  getValue() {
    return this.input ? this.input.value : '';
  }

  destroy() {
    if (this.input && this.onInputKeyDown) {
      this.input.removeEventListener('keydown', this.onInputKeyDown);
    }
    if (this.saveBtn && this.onSaveMouseDown) {
      this.saveBtn.removeEventListener('mousedown', this.onSaveMouseDown);
    }
    if (this.saveBtn && this.onSaveClick) {
      this.saveBtn.removeEventListener('click', this.onSaveClick);
    }
  }
}

const KviRecommendationLogicAddPage = {
  gridApi: null,
  bulkFlow: null,
  batchRows: [],
  gridElement: null,
  detachCommunityPaste: null,
  bulkUploadModal: null,
  uploadedRows: [],
  selectedBatchId: null,
  uploadFilter: 'all',
  mockBatchStore: [],
  mockBatchRowsById: {},
  mockBatchSequence: 1000,
  maxPasteRows: 5000,
  maxPasteCols: 10,
  maxPasteCells: 50000,

  init() {
    this.cacheBulkUploadDom();
    this.initGrid();
    this.initBulkUploadFlow();
    this.initBulkUploadModal();
    this.bindToolbarActions();
    this.bindBulkUploadAction();
    this.initViewActions();
  },

  cacheBulkUploadDom() {
    this.uploadStatusRow = document.getElementById('kviUploadStatusRow');
    this.uploadStatusInputs = Array.from(document.querySelectorAll('input[name="kviUploadStatus"]'));
    this.batchSection = document.querySelector('.bulk-upload-batch-section');
    this.batchCollapseBtn = document.getElementById('bulkUploadBatchCollapseBtn');
    this.batchInfoText = this.batchSection?.querySelector('.bulk-upload-batch-info-text') || null;
    this.batchTableBody = document.getElementById('bulkUploadBatchTableBody');
    if (this.uploadStatusRow) this.uploadStatusRow.hidden = true;
  },

  initBatchSectionControls() {
    if (!this.batchSection || !this.batchCollapseBtn) return;
    this.batchCollapseBtn.addEventListener('click', () => {
      const isCollapsed = this.batchSection.classList.toggle('is-collapsed');
      this.batchCollapseBtn.setAttribute('aria-expanded', String(!isCollapsed));
      this.batchCollapseBtn.textContent = isCollapsed ? '⌄' : '⌃';
    });
  },

  updateBatchInfoCount(count) {
    if (!this.batchInfoText) return;
    this.batchInfoText.textContent = `You Have [${count}] Unfinished Uploads.`;
  },

  initBulkUploadFlow() {
    if (!window.BulkUploadFlow?.create) {
      // Fallback to legacy local implementation when shared module is unavailable.
      this.initBatchSectionControls();
      this.initBatchGrid();
      return;
    }

    this.bulkFlow = window.BulkUploadFlow.create({
      getScreenCode: () => this.getScreenCode(),
      getBulkUploadBaseUrl: () => this.getBulkUploadBaseUrl(),
      shouldUseMock: () => this.shouldUseMockBulkUpload(),
      getCurrentUser: () => this.getCurrentUser(),
      showInfo: (message, type) => this.showInfo(message, type),
      formatNowUsDate: () => this.formatNowUsDate(),
      parseAndMapCsvFile: (file) => this.parseAndMapCsvFile(file),
      normalizeBatchRow: (item, index) => this.normalizeBatchRow(item, index),
      normalizeBatchDataRow: (item) => this.normalizeBatchDataRow(item),
      onBatchRowsLoaded: (rows, batchId) => {
        this.selectedBatchId = batchId;
        this.uploadedRows = rows;
        this.uploadFilter = 'all';
        this.uploadStatusInputs.forEach((input) => {
          input.checked = input.value === 'all';
        });
        if (this.uploadStatusRow) this.uploadStatusRow.hidden = rows.length === 0;
        this.applyUploadFilter();
        this.showInfo(`Loaded batch ${batchId} (${rows.length} row(s)).`, 'success');
      },
      onBatchCleared: () => {
        this.selectedBatchId = null;
        this.uploadedRows = [];
        this.applyUploadFilter();
      },
      batchSectionEl: this.batchSection,
      batchCollapseBtnEl: this.batchCollapseBtn,
      batchInfoTextEl: this.batchInfoText,
      batchTableBodyEl: this.batchTableBody
    });

    this.bulkFlow.init().catch((error) => {
      console.error('Bulk upload flow init failed:', error);
      this.showInfo('Failed to initialize batch section.', 'error');
    });
  },

  initialRows() {
    return [
      {
        effectiveDate: '',
        terminationDate: '',
        prcaMinThreshold: '',
        dedupMethod: ''
      }
    ];
  },

  appendBlankRows(count) {
    if (!this.gridApi || !Number.isInteger(count) || count <= 0) return;
    const rows = Array.from({ length: count }, () => ({
      effectiveDate: '',
      terminationDate: '',
      prcaMinThreshold: '',
      dedupMethod: '',
      uploadStatus: '',
      uploadErrors: []
    }));
    this.gridApi.applyTransaction({ add: rows });
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
      this.appendBlankRows(missingRows);
    }
  },

  syncUploadedRowsFromGrid(forceRebuild = false) {
    if (forceRebuild || this.uploadedRows.length === 0) {
      const rows = this.getGridRows()
        .map((row) => this.normalizeRow(row))
        .filter((row) => !this.isRowEmpty(row))
        .map((row) => {
          const validation = this.validateRow(row);
          return {
            ...row,
            uploadStatus: validation.isValid ? 'success' : 'error',
            uploadErrors: validation.errors
          };
        });
      this.uploadedRows = rows;
    }

    if (this.uploadStatusRow) this.uploadStatusRow.hidden = this.uploadedRows.length === 0;
    if (this.uploadFilter !== 'all') this.applyUploadFilter();
  },

  validationCellRules(field) {
    return {
      'kvi-cell-error': (params) => Array.isArray(params.data?.uploadErrors) && params.data.uploadErrors.includes(field)
    };
  },

  isErrorCell(params, field) {
    return Array.isArray(params?.data?.uploadErrors) && params.data.uploadErrors.includes(field);
  },

  initGrid() {
    const dateComparator = window.GridFilterOperatorUtils?.createUsDateComparator
      ? window.GridFilterOperatorUtils.createUsDateComparator((value) => this.usDateToIso(value))
      : null;

    this.gridApi = DynamicGrid.createGrid({
      gridElementId: 'kviRecommendationParameterAddGrid',
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
        stopEditingWhenCellsLoseFocus: true,
        onCellValueChanged: (event) => this.onCellValueChanged(event),
        components: {
          kviInlineSaveCellEditor: KviInlineSaveCellEditor
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
          editable: true
        }
      },
      columns: [
        {
          field: 'select',
          headerName: '',
          checkboxSelection: true,
          headerCheckboxSelection: true,
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
        {
          field: 'effectiveDate',
          headerName: 'Effective Date',
          minWidth: 180,
          filter: 'agDateColumnFilter',
          ...(dateComparator ? { filterParams: { comparator: dateComparator } } : {}),
          cellEditorSelector: (params) => (this.isErrorCell(params, 'effectiveDate')
            ? { component: 'kviInlineSaveCellEditor', params: { pageRef: this } }
            : undefined),
          cellClassRules: this.validationCellRules('effectiveDate')
        },
        {
          field: 'terminationDate',
          headerName: 'Termination Date',
          minWidth: 190,
          filter: 'agDateColumnFilter',
          ...(dateComparator ? { filterParams: { comparator: dateComparator } } : {}),
          cellEditorSelector: (params) => (this.isErrorCell(params, 'terminationDate')
            ? { component: 'kviInlineSaveCellEditor', params: { pageRef: this } }
            : undefined),
          cellClassRules: this.validationCellRules('terminationDate')
        },
        {
          field: 'prcaMinThreshold',
          headerName: 'PRCA Min Threshold',
          minWidth: 200,
          filter: 'agNumberColumnFilter',
          filterValueGetter: (params) => {
            const raw = String(params?.data?.prcaMinThreshold ?? '').replace(/,/g, '').trim();
            if (!raw) return null;
            const numeric = Number(raw);
            return Number.isFinite(numeric) ? numeric : null;
          },
          cellEditorSelector: (params) => (this.isErrorCell(params, 'prcaMinThreshold')
            ? { component: 'kviInlineSaveCellEditor', params: { pageRef: this } }
            : undefined),
          cellClassRules: this.validationCellRules('prcaMinThreshold')
        },
        {
          field: 'dedupMethod',
          headerName: 'Dedup Method',
          minWidth: 190,
          cellEditorSelector: (params) => (this.isErrorCell(params, 'dedupMethod')
            ? { component: 'kviInlineSaveCellEditor', params: { pageRef: this } }
            : undefined),
          cellClassRules: this.validationCellRules('dedupMethod')
        }
      ]
    });

    this.gridElement = document.getElementById('kviRecommendationParameterAddGrid');
    if (!this.gridApi) return;
    if (typeof this.detachCommunityPaste === 'function') {
      this.detachCommunityPaste();
      this.detachCommunityPaste = null;
    }
    if (window.CommunityGridPaste?.attach) {
      this.detachCommunityPaste = window.CommunityGridPaste.attach({
        gridElement: this.gridElement,
        gridApi: this.gridApi,
        editableFieldOrder: ['effectiveDate', 'terminationDate', 'prcaMinThreshold', 'dedupMethod'],
        maxRows: this.maxPasteRows,
        maxCols: this.maxPasteCols,
        maxCells: this.maxPasteCells,
        showInfo: (message, type) => this.showInfo(message, type),
        ensureRowCapacity: (rowCount, startRowIndex) => this.ensureRowCapacityForPaste(rowCount, startRowIndex),
        normalizeRow: (row) => this.normalizeRow(row),
        validateRow: (row) => this.validateRow(row),
        onApplied: () => this.syncUploadedRowsFromGrid(true)
      });
    }

    window.gridApi = this.gridApi;

    // Override default pending apply to support typed operators in add-screen textboxes.
    this.gridApi.applyPendingFloatingFilters = () => this.applyAdvancedFilters();

    if (typeof this.gridApi.addEventListener === 'function') {
      this.gridApi.addEventListener('firstDataRendered', () => this.applyDefaultDensity());
      this.gridApi.addEventListener('firstDataRendered', () => {
        if (typeof this.gridApi.deselectAll === 'function') {
          this.gridApi.deselectAll();
        }
      });
    }
    this.applyDefaultDensity();

    setTimeout(() => {
      if (typeof GridManager !== 'undefined' && window.gridApi) {
        GridManager.init(window.gridApi, 'kviRecommendationParameterAddGrid');
      }
    }, 300);
  },

  formatUsDateFromIso(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
  },

  getScreenCode() {
    return String(window.BULK_UPLOAD_SCREEN_CODE || 'KVI').trim() || 'KVI';
  },

  getBulkUploadBaseUrl() {
    const baseUrl = (window.API_BASE_URL || '').replace(/\/$/, '');
    return baseUrl ? `${baseUrl}/api/v1/bulk-upload` : '/api/v1/bulk-upload';
  },

  shouldUseMockBulkUpload() {
    return window.BULK_UPLOAD_USE_MOCK !== false;
  },

  getCurrentUser() {
    const currentUserId = document.getElementById('currentUserId')?.value;
    return String(currentUserId || window.GRID_PREF_TEST_USER_ID || 'defaultUser');
  },

  formatNowUsDate() {
    return this.formatUsDateFromIso(new Date().toISOString());
  },

  nextMockBatchNumber() {
    this.mockBatchSequence += 1;
    return String(this.mockBatchSequence);
  },

  async fetchJson(endpoint, options = {}) {
    const response = await fetch(endpoint, options);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json();
  },

  getApiDataArray(payload) {
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload)) return payload;
    return [];
  },

  toUploadStatus(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'success' || normalized === 'passed' || normalized === 'valid') return 'success';
    if (normalized === 'error' || normalized === 'failed' || normalized === 'invalid') return 'error';
    return normalized === 'all' ? 'all' : '';
  },

  normalizeBatchRow(item, index) {
    return {
      id: item.id || item.batchId || item.batchNumber || `batch-${index + 1}`,
      batchNumber: item.batchNumber || item.batchId || item.id || '',
      batchStatus: item.batchStatus || item.status || '',
      recordsCount: item.recordsCount ?? item.totalRecords ?? item.totalCount ?? '',
      errorCount: item.errorCount ?? item.totalErrors ?? '',
      createdBy: item.createdBy || item.createdUser || '',
      priceRuleLevel: item.priceRuleLevel || '',
      startDate: this.formatUsDateFromIso(item.startDate || item.createdAt),
      endDate: this.formatUsDateFromIso(item.endDate),
      programId: item.programId || '',
      userId: item.userId || '',
      workstationId: item.workstationId || '',
      dateUpdated: this.formatUsDateFromIso(item.dateUpdated || item.updatedAt)
    };
  },

  normalizeBatchDataRow(item) {
    const normalized = this.normalizeRow({
      effectiveDate: item.effectiveDate || item.effective_date || '',
      terminationDate: item.terminationDate || item.termination_date || '',
      prcaMinThreshold: item.prcaMinThreshold || item.prca_min_threshold || '',
      dedupMethod: item.dedupMethod || item.dedup_method || ''
    });

    const rowErrors = Array.isArray(item.uploadErrors)
      ? item.uploadErrors
      : Array.isArray(item.errorFields)
        ? item.errorFields
        : Array.isArray(item.errors)
          ? item.errors
            .map((entry) => entry?.field || entry?.column || '')
            .filter(Boolean)
          : [];

    const mappedErrors = rowErrors
      .map((field) => this.normalizeHeader(field))
      .map((field) => {
        if (field === 'effectivedate') return 'effectiveDate';
        if (field === 'terminationdate') return 'terminationDate';
        if (field === 'prcaminthreshold') return 'prcaMinThreshold';
        if (field === 'dedupmethod') return 'dedupMethod';
        return '';
      })
      .filter(Boolean);

    const validation = this.validateRow(normalized);
    const explicitStatus = this.toUploadStatus(item.uploadStatus || item.rowStatus || item.status);
    const finalErrors = mappedErrors.length > 0 ? mappedErrors : validation.errors;

    return {
      ...normalized,
      uploadStatus: explicitStatus || (finalErrors.length > 0 ? 'error' : 'success'),
      uploadErrors: finalErrors
    };
  },

  initBatchGrid() {
    if (!this.batchTableBody) return;
    this.batchTableBody.addEventListener('click', (event) => {
      const deleteBtn = event.target.closest('[data-batch-delete]');
      if (deleteBtn) {
        const batchId = deleteBtn.getAttribute('data-batch-id');
        this.deleteBatchRow(batchId);
        return;
      }
      const link = event.target.closest('[data-batch-link]');
      if (link) {
        const batchId = link.getAttribute('data-batch-id');
        this.loadBatchData(batchId);
      }
    });
    this.loadBatchRows();
  },

  renderBatchRows(rows) {
    if (!this.batchTableBody) return;
    if (!rows || rows.length === 0) {
      this.batchTableBody.innerHTML = '<div class="bulk-upload-batch-empty">No unfinished uploads.</div>';
      return;
    }

    const escapeHtml = (value) => String(value == null ? '' : value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

    this.batchTableBody.innerHTML = rows.map((row) => {
      const batchId = String(row.id || row.batchNumber || '');
      return `
        <div class="bulk-upload-batch-row" role="listitem">
          <span class="bulk-upload-batch-cell"><button type="button" class="bulk-upload-batch-number-link" data-batch-link data-batch-id="${escapeHtml(batchId)}">${escapeHtml(row.batchNumber || '')}</button></span>
          <span class="bulk-upload-batch-cell">${escapeHtml(row.batchStatus || '')}</span>
          <span class="bulk-upload-batch-cell">${escapeHtml(row.recordsCount ?? '')}</span>
          <span class="bulk-upload-batch-cell">${escapeHtml(row.errorCount ?? '')}</span>
          <span class="bulk-upload-batch-cell">${escapeHtml(row.createdBy || '')}</span>
          <span class="bulk-upload-batch-cell">${escapeHtml(row.priceRuleLevel || '')}</span>
          <span class="bulk-upload-batch-cell">${escapeHtml(row.startDate || '')}</span>
          <span class="bulk-upload-batch-cell">${escapeHtml(row.endDate || '')}</span>
          <span class="bulk-upload-batch-cell">${escapeHtml(row.programId || '')}</span>
          <span class="bulk-upload-batch-cell">${escapeHtml(row.userId || '')}</span>
          <span class="bulk-upload-batch-cell">${escapeHtml(row.workstationId || '')}</span>
          <span class="bulk-upload-batch-cell">${escapeHtml(row.dateUpdated || '')}</span>
          <span class="bulk-upload-batch-cell"><button type="button" class="bulk-upload-batch-delete-btn" data-batch-delete data-batch-id="${escapeHtml(batchId)}" aria-label="Delete batch">🗑</button></span>
        </div>`;
    }).join('');
  },

  async fetchBatchRows() {
    if (this.shouldUseMockBulkUpload()) {
      return [...this.mockBatchStore];
    }
    const endpoint = `${this.getBulkUploadBaseUrl()}/batches?screenCode=${encodeURIComponent(this.getScreenCode())}`;
    const json = await this.fetchJson(endpoint, { method: 'GET', headers: { Accept: 'application/json' } });
    const records = this.getApiDataArray(json);
    return records.map((item, index) => this.normalizeBatchRow(item, index));
  },

  defaultBatchRows() {
    return [];
  },

  async loadBatchRows() {
    try {
      const rows = await this.fetchBatchRows();
      this.batchRows = rows.length > 0 ? rows : this.defaultBatchRows();
      this.renderBatchRows(this.batchRows);
      this.updateBatchInfoCount(this.batchRows.length);
    } catch (error) {
      console.warn('Batch fetch failed. Showing empty batch grid.', error);
      this.batchRows = this.defaultBatchRows();
      this.renderBatchRows(this.batchRows);
      this.updateBatchInfoCount(0);
    }
  },

  async fetchRowsForBatch(batchId) {
    if (this.shouldUseMockBulkUpload()) {
      const rows = this.mockBatchRowsById[batchId];
      return Array.isArray(rows) ? rows : [];
    }
    const endpoint = `${this.getBulkUploadBaseUrl()}/batches/${encodeURIComponent(batchId)}/rows?screenCode=${encodeURIComponent(this.getScreenCode())}&view=all`;
    const json = await this.fetchJson(endpoint, { method: 'GET', headers: { Accept: 'application/json' } });
    const records = this.getApiDataArray(json);
    return records.map((item) => this.normalizeBatchDataRow(item));
  },

  async loadBatchData(batchId) {
    if (!batchId) return;
    this.selectedBatchId = batchId;
    try {
      const rows = await this.fetchRowsForBatch(batchId);
      this.uploadedRows = rows;
      this.uploadFilter = 'all';
      this.uploadStatusInputs.forEach((input) => {
        input.checked = input.value === 'all';
      });
      if (this.uploadStatusRow) this.uploadStatusRow.hidden = rows.length === 0;
      this.applyUploadFilter();
      this.showInfo(`Loaded batch ${batchId} (${rows.length} row(s)).`, 'success');
    } catch (error) {
      console.error('Failed to load batch rows:', error);
      this.showInfo('Failed to load selected batch rows.', 'error');
    }
  },

  async deleteBatchRow(batchId) {
    if (!batchId) return;
    if (this.shouldUseMockBulkUpload()) {
      this.mockBatchStore = this.mockBatchStore.filter((row) => String(row.id) !== String(batchId));
      delete this.mockBatchRowsById[batchId];
    } else {
      const endpoint = `${this.getBulkUploadBaseUrl()}/batches/${encodeURIComponent(batchId)}?screenCode=${encodeURIComponent(this.getScreenCode())}`;
      try {
        const response = await fetch(endpoint, { method: 'DELETE', headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`Failed batch delete: ${response.status}`);
      } catch (error) {
        console.error('Batch delete API failed:', error);
        this.showInfo('Failed to delete batch.', 'error');
        return;
      }
    }
    this.batchRows = this.batchRows.filter((row) => String(row.id || row.batchNumber) !== String(batchId));
    this.renderBatchRows(this.batchRows);
    this.updateBatchInfoCount(this.batchRows.length);
    if (String(this.selectedBatchId || '') === String(batchId)) {
      this.selectedBatchId = null;
      this.uploadedRows = [];
      this.applyUploadFilter();
    }
    this.showInfo('Batch removed from list.', 'success');
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

  bindBulkUploadAction() {
    const bulkUploadButton = document.querySelector('[data-action="bulk-upload"]');
    if (!bulkUploadButton || !this.bulkUploadModal) return;

    bulkUploadButton.addEventListener('click', () => {
      this.bulkUploadModal.open();
    });

    this.uploadStatusInputs.forEach((input) => {
      input.addEventListener('change', () => {
        if (!input.checked) return;
        this.uploadFilter = input.value;
        this.clearColumnFilters();
        this.applyUploadFilter();
      });
    });
  },

  initBulkUploadModal() {
    if (!window.BulkUploadModal || typeof window.BulkUploadModal.create !== 'function') return;

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
      initialNextLabel: 'Next',
      uploadLabel: 'Upload',
      validateFile: (file) => /\.csv$/i.test(file.name) || file.type === 'text/csv',
      onUpload: (file, controls) => {
        this.processUploadedCsv(file).then((success) => {
          if (success) {
            controls.close();
          }
        });
      }
    });
  },

  normalizeHeader(header) {
    if (window.CsvUploadUtils?.normalizeHeader) {
      return window.CsvUploadUtils.normalizeHeader(header);
    }
    return String(header || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  },

  toUsDate(value) {
    if (window.CsvUploadUtils?.toUsDate) {
      return window.CsvUploadUtils.toUsDate(value);
    }
    return String(value || '').trim();
  },

  isValidUsDate(value) {
    if (window.CsvUploadUtils?.isValidUsDate) {
      return window.CsvUploadUtils.isValidUsDate(value);
    }
    return false;
  },

  isValidThreshold(value) {
    if (window.CsvUploadUtils?.isNumeric) {
      return window.CsvUploadUtils.isNumeric(value);
    }
    return false;
  },

  isValidDedupMethod(value) {
    if (window.CsvUploadUtils?.matchesPattern) {
      return window.CsvUploadUtils.matchesPattern(value, /^[A-Za-z0-9_ -]+$/);
    }
    return false;
  },

  usDateToIso(value) {
    const normalized = this.toUsDate(value);
    if (!this.isValidUsDate(normalized)) return '';
    const [mm, dd, yyyy] = normalized.split('/');
    return `${yyyy}-${mm}-${dd}`;
  },

  applyAdvancedFilters() {
    const kindByField = {
      effectiveDate: 'date',
      terminationDate: 'date',
      prcaMinThreshold: 'number',
      dedupMethod: 'text'
    };

    const floatingInputs = this.gridElement
      ? Array.from(this.gridElement.querySelectorAll('.mfi-floating-filter-input[data-col-id]'))
      : [];
    const rawInputByField = new Map();
    floatingInputs.forEach((input) => {
      rawInputByField.set(input.dataset.colId, input.value);
    });

    if (window.GridFilterOperatorUtils?.applyFloatingFilters) {
      const applied = window.GridFilterOperatorUtils.applyFloatingFilters({
        gridApi: this.gridApi,
        gridElement: this.gridElement,
        fieldTypeMap: kindByField,
        toDateIso: (value) => this.usDateToIso(value),
        isNumeric: (value) => this.isValidThreshold(value),
        onValidationError: (field, reason) => this.showInfo(`${field}: ${reason}`, 'error')
      });

      if (applied) {
        requestAnimationFrame(() => {
          floatingInputs.forEach((input) => {
            const raw = rawInputByField.get(input.dataset.colId);
            if (raw != null) input.value = raw;
          });
        });
      }
      return;
    }

    if (typeof this.gridApi?.onFilterChanged === 'function') {
      this.gridApi.onFilterChanged();
    }
  },

  normalizeRow(row) {
    return {
      effectiveDate: this.toUsDate(row.effectiveDate || ''),
      terminationDate: this.toUsDate(row.terminationDate || ''),
      prcaMinThreshold: String(row.prcaMinThreshold || '').trim(),
      dedupMethod: String(row.dedupMethod || '').trim()
    };
  },

  isRowEmpty(row) {
    return !row.effectiveDate && !row.terminationDate && !row.prcaMinThreshold && !row.dedupMethod;
  },

  validateRow(row) {
    const errors = [];
    if (!this.isValidUsDate(row.effectiveDate)) errors.push('effectiveDate');
    if (!this.isValidUsDate(row.terminationDate)) errors.push('terminationDate');
    if (!this.isValidThreshold(row.prcaMinThreshold)) errors.push('prcaMinThreshold');
    if (!this.isValidDedupMethod(row.dedupMethod)) errors.push('dedupMethod');
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateField(field, value) {
    if (field === 'effectiveDate' || field === 'terminationDate') {
      return this.isValidUsDate(value);
    }
    if (field === 'prcaMinThreshold') {
      return this.isValidThreshold(value);
    }
    if (field === 'dedupMethod') {
      return this.isValidDedupMethod(value);
    }
    return true;
  },

  onCellValueChanged(event) {
    const field = event?.colDef?.field;
    const rowNode = event?.node;
    if (!field || !rowNode?.data) return;

    const normalized = this.normalizeRow(rowNode.data);
    const validation = this.validateRow(normalized);
    Object.assign(rowNode.data, normalized, {
      uploadStatus: validation.isValid ? 'success' : 'error',
      uploadErrors: validation.errors
    });

    if (this.gridApi?.refreshCells) {
      this.gridApi.refreshCells({ rowNodes: [rowNode], force: true });
    }
    this.syncUploadedRowsFromGrid();
  },

  saveCellFromEditor(rowNode, field, nextValue) {
    if (!rowNode?.data || !field) return;
    const normalized = this.normalizeRow({
      ...rowNode.data,
      [field]: nextValue
    });
    const value = normalized[field];
    const isValid = this.validateField(field, value);

    if (!isValid) {
      const validation = this.validateRow(normalized);
      Object.assign(rowNode.data, normalized, {
        uploadStatus: validation.isValid ? 'success' : 'error',
        uploadErrors: validation.errors
      });
      if (this.gridApi?.refreshCells) {
        this.gridApi.refreshCells({ rowNodes: [rowNode], force: true });
      }
      this.showInfo('Cell value is invalid. Fix and save again.', 'error');
      return { ok: false, value };
    }

    const validation = this.validateRow(normalized);
    Object.assign(rowNode.data, normalized, {
      uploadStatus: validation.isValid ? 'success' : 'error',
      uploadErrors: validation.errors
    });

    if (this.gridApi?.refreshCells) {
      this.gridApi.refreshCells({ rowNodes: [rowNode], force: true });
    }

    if (this.uploadedRows.length > 0) {
      if (this.uploadStatusRow) this.uploadStatusRow.hidden = false;
      this.applyUploadFilter();
    }
    this.syncUploadedRowsFromGrid();

    this.showInfo('Cell saved locally.', 'success');
    return { ok: true, value };
  },

  parseCsvLine(line) {
    if (window.CsvUploadUtils?.parseCsvLine) {
      return window.CsvUploadUtils.parseCsvLine(line);
    }
    return [];
  },

  async parseAndMapCsvFile(file) {
    const csvText = await file.text();
    const parsed = window.CsvUploadUtils?.parseCsvText
      ? window.CsvUploadUtils.parseCsvText(csvText)
      : { normalizedHeaders: [], rows: [] };

    if (parsed.rows.length < 1) {
      throw new Error('CSV must include header and at least one data row');
    }

    const indexByHeader = {};
    parsed.normalizedHeaders.forEach((h, idx) => {
      indexByHeader[h] = idx;
    });

    return parsed.rows.map((cells) => {
      const row = this.normalizeRow({
        effectiveDate: cells[indexByHeader.effectivedate] || '',
        terminationDate: cells[indexByHeader.terminationdate] || '',
        prcaMinThreshold: cells[indexByHeader.prcaminthreshold] || '',
        dedupMethod: cells[indexByHeader.dedupmethod] || ''
      });
      const result = this.validateRow(row);
      row.uploadStatus = result.isValid ? 'success' : 'error';
      row.uploadErrors = result.errors;
      return row;
    });
  },

  async createMockBatchFromFile(file) {
    const mappedRows = await this.parseAndMapCsvFile(file);
    const batchId = `KVI-${Date.now()}`;
    const batchNumber = this.nextMockBatchNumber();
    const errorCount = mappedRows.filter((row) => row.uploadStatus === 'error').length;
    const today = this.formatNowUsDate();
    const batch = {
      id: batchId,
      batchNumber,
      batchStatus: errorCount > 0 ? 'Validation Error' : 'Validation Success',
      recordsCount: mappedRows.length,
      errorCount,
      createdBy: this.getCurrentUser(),
      priceRuleLevel: 'KVI',
      startDate: today,
      endDate: today,
      programId: 'KVI',
      userId: this.getCurrentUser(),
      workstationId: 'WEB',
      dateUpdated: today
    };
    this.mockBatchStore = [batch, ...this.mockBatchStore];
    this.mockBatchRowsById[batchId] = mappedRows;
    await this.loadBatchRows();
    this.showInfo(`Batch ${batchNumber} created. Click batch number to load rows.`, 'success');
    return true;
  },

  async createBackendBatch(file) {
    const endpoint = `${this.getBulkUploadBaseUrl()}/batches`;
    const payload = {
      screenCode: this.getScreenCode(),
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type || 'text/csv'
    };
    const json = await this.fetchJson(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = json?.data || json || {};
    const batchId = data.batchId || data.id || data.batchNumber;
    if (!batchId) throw new Error('Batch id missing from create response');
    return {
      batchId,
      batchNumber: data.batchNumber || String(batchId),
      uploadUrl: data.uploadUrl || data.signedUrl || ''
    };
  },

  async uploadBackendFile(batchId, file, uploadUrl = '') {
    if (uploadUrl) {
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'text/csv' },
        body: file
      });
      if (!uploadResponse.ok) throw new Error(`Signed upload failed: ${uploadResponse.status}`);
      return;
    }

    const endpoint = `${this.getBulkUploadBaseUrl()}/batches/${encodeURIComponent(batchId)}/file`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('screenCode', this.getScreenCode());
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error(`Multipart upload failed: ${response.status}`);
  },

  async startBackendImport(batchId) {
    const endpoint = `${this.getBulkUploadBaseUrl()}/batches/${encodeURIComponent(batchId)}/import/start?screenCode=${encodeURIComponent(this.getScreenCode())}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`Import start failed: ${response.status}`);
    return response.json().catch(() => ({}));
  },

  async processUploadedCsv(file) {
    if (this.bulkFlow?.handleFileUpload) {
      try {
        return await this.bulkFlow.handleFileUpload(file);
      } catch (error) {
        console.error('Shared bulk upload flow failed:', error);
        this.showInfo(error?.message || 'Failed to process upload', 'error');
        return false;
      }
    }

    try {
      if (this.shouldUseMockBulkUpload()) {
        return this.createMockBatchFromFile(file);
      }

      const createdBatch = await this.createBackendBatch(file);
      await this.uploadBackendFile(createdBatch.batchId, file, createdBatch.uploadUrl);
      await this.startBackendImport(createdBatch.batchId);
      await this.loadBatchRows();
      this.showInfo(`Batch ${createdBatch.batchNumber} created. Import started.`, 'success');
      return true;
    } catch (error) {
      console.error('Bulk upload flow failed:', error);
      this.showInfo(error?.message || 'Failed to process upload', 'error');
      return false;
    }
  },

  applyUploadFilter() {
    if (!this.gridApi) return;
    if (this.uploadStatusRow) this.uploadStatusRow.hidden = this.uploadedRows.length === 0;
    const filteredRows = this.uploadFilter === 'all'
      ? this.uploadedRows
      : this.uploadedRows.filter((row) => row.uploadStatus === this.uploadFilter);

    this.gridApi.setGridOption('rowData', filteredRows);
  },

  clearColumnFilters() {
    if (!this.gridApi) return;

    if (typeof this.gridApi.setFilterModel === 'function') {
      this.gridApi.setFilterModel(null);
    }

    if (typeof this.gridApi.onFilterChanged === 'function') {
      this.gridApi.onFilterChanged();
    }

    if (this.gridElement) {
      const inputs = this.gridElement.querySelectorAll('.mfi-floating-filter-input');
      inputs.forEach((input) => {
        input.value = '';
      });
    }
  },

  deleteSelectedRows() {
    if (!this.gridApi) return;
    const selectedRows = this.gridApi.getSelectedRows?.() || [];
    if (selectedRows.length === 0) {
      this.showInfo('Select at least one row to delete', 'error');
      return;
    }
    this.gridApi.applyTransaction({ remove: selectedRows });
  },

  getGridRows() {
    const rows = [];
    if (!this.gridApi) return rows;
    this.gridApi.forEachNode((node) => {
      if (!node?.data) return;
      rows.push(node.data);
    });
    return rows;
  },

  saveDraft() {
    this.showInfo('Save Draft action is pending client decision.', 'success');
  },

  submit() {
    const selectedRows = this.gridApi?.getSelectedRows?.() || [];
    if (selectedRows.length === 0) {
      this.showInfo('Select at least one row to submit.', 'error');
      return;
    }

    const selectedEnteredRows = selectedRows
      .map((row) => this.normalizeRow(row))
      .filter((row) => !this.isRowEmpty(row));

    if (selectedEnteredRows.length === 0) {
      this.showInfo('Selected row(s) are empty. Select at least one completed row.', 'error');
      return;
    }

    const validatedSelectedRows = selectedEnteredRows.map((normalized) => {
      const validation = this.validateRow(normalized);
      return {
        ...normalized,
        uploadStatus: validation.isValid ? 'success' : 'error',
        uploadErrors: validation.errors
      };
    });

    const invalidSelectedCount = validatedSelectedRows.filter((row) => row.uploadStatus === 'error').length;
    if (invalidSelectedCount > 0) {
      this.showInfo('Some selected rows are invalid. Fix or unselect them before submitting.', 'error');
      return;
    }

    const submittedRows = validatedSelectedRows
      .filter((row) => row.uploadStatus === 'success')
      .map((row) => ({
        effectiveDate: row.effectiveDate,
        terminationDate: row.terminationDate,
        prcaMinThreshold: row.prcaMinThreshold,
        dedupMethod: row.dedupMethod
      }));

    if (submittedRows.length === 0) {
      this.showInfo('No valid selected rows to submit.', 'error');
      return;
    }

    // UI behavior until backend submit API contract is finalized:
    // remove submitted selections and keep remaining rows (including errors) for further correction.
    const selectedSet = new Set(selectedRows);
    const sourceRows = this.uploadedRows.length > 0 ? this.uploadedRows : this.getGridRows();
    const remainingRows = sourceRows.filter((row) => !selectedSet.has(row));

    this.uploadedRows = remainingRows;
    this.uploadFilter = 'all';
    this.uploadStatusInputs.forEach((input) => {
      input.checked = input.value === 'all';
    });
    if (this.uploadStatusRow) this.uploadStatusRow.hidden = remainingRows.length === 0;
    this.applyUploadFilter();

    if (this.bulkFlow?.applyPostSubmit) {
      this.bulkFlow.applyPostSubmit(remainingRows).catch((error) => {
        console.error('Post-submit batch sync failed:', error);
      });
    } else if (this.selectedBatchId && this.shouldUseMockBulkUpload()) {
      this.mockBatchRowsById[this.selectedBatchId] = remainingRows;
    }

    this.showInfo(`${submittedRows.length} selected row(s) submitted. Remaining rows stay available for correction/submission.`, 'success');
  },

  executeFilters() {
    if (!this.gridApi) return;
    this.applyAdvancedFilters();
  },

  bindToolbarActions() {
    document.addEventListener('click', (event) => {
      const actionButton = event.target.closest('.gt-action-btn[data-action]');
      if (!actionButton) return;

      switch (actionButton.dataset.action) {
        case 'back':
          window.location.href = window.KVI_LIST_PAGE_URL || '/manage-kvi-recommendation-logic-view-output-data';
          break;
        case 'delete':
          this.deleteSelectedRows();
          break;
        case 'saveDraft':
          this.saveDraft();
          break;
        case 'submit':
          this.submit();
          break;
        case 'execute':
          this.executeFilters();
          break;
        default:
          break;
      }
    });
  },

  showInfo(message, type = 'success') {
    if (window.GridManager?.currentInstance?.showToast) {
      window.GridManager.currentInstance.showToast(message, type, 2200);
      return;
    }
    console.log(message);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  KviRecommendationLogicAddPage.init();
});