class PebPageSelectHeader {
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
    this.params.api.addEventListener('filterChanged', this.onSync);
    this.params.api.addEventListener('sortChanged', this.onSync);
    this.params.api.addEventListener('paginationChanged', this.onSync);

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
    const displayedRows = this.getSelectableDisplayedRows();
    displayedRows.forEach((rowNode) => rowNode.setSelected(this.checkbox.checked));
    this.syncState();
  }

  syncState() {
    if (!this.checkbox) return;
    const displayedRows = this.getSelectableDisplayedRows();
    const selectableCount = displayedRows.length;
    const selectedCount = displayedRows.filter((rowNode) => rowNode.isSelected()).length;

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
      this.params.api.removeEventListener('filterChanged', this.onSync);
      this.params.api.removeEventListener('sortChanged', this.onSync);
      this.params.api.removeEventListener('paginationChanged', this.onSync);
    }
  }
}

const PricingEngineBatchPage = {
  gridApi: null,
  batchGridApi: null,
  gridElement: null,
  batchGridElement: null,
  detachBatchCommunityPaste: null,
  maxPasteRows: 5000,
  maxPasteCols: 16,
  maxPasteCells: 80000,
  currentMode: 'Batch',
  currentWorkflow: 'import',
  resultsVisible: false,
  batchVisible: false,
  modalEl: null,
  bulkUploadModal: null,

  init() {
    this.cacheDom();
    this.initGrid();
    this.initBatchGrid();
    this.bindToolbarActions();
    this.bindWorkflowActions();
    this.bindModalActions();
    this.bindBatchActions();
    this.initViewActions();
    this.resetFormState();
  },

  cacheDom() {
    this.pageBody = document.body;
    this.mainToolbar = document.getElementById('pricingEngineBatchMainToolbar');
    this.batchToolbar = document.getElementById('pricingEngineBatchBatchToolbar');
    this.sharedTopbar = document.getElementById('pricingEngineBatchSharedTopbar');
    this.resultsSection = document.getElementById('pricingEngineBatchResults');
    this.batchShell = document.getElementById('pricingEngineBatchBatchShell');
    this.batchAccordion = document.getElementById('pricingEngineBatchAccordion');
    this.batchCollapseBtn = document.getElementById('pricingEngineBatchCollapseBtn');
    this.modalEl = document.getElementById('pricingEngineBatchModal');
    this.modalTitleEl = document.getElementById('pricingEngineBatchModalTitle');
    this.modalSubmitBtn = document.getElementById('pricingEngineBatchModalSubmit');
    this.jobNumberInput = document.getElementById('pebJobNumber');
    this.descriptionInput = document.getElementById('pebDescription');
    this.processingModeInput = document.getElementById('pebProcessingMode');
    this.reportOutputInput = document.getElementById('pebReportOutput');
    this.outputTypeInput = document.getElementById('pebOutputType');
    this.modalJobNumberInput = document.getElementById('pebModalJobNumber');
    this.modalDescriptionInput = document.getElementById('pebModalDescription');
    this.modalProcessingModeInput = document.getElementById('pebModalProcessingMode');
    this.modalReportOutputInput = document.getElementById('pebModalReportOutput');
    this.modalOutputTypeInput = document.getElementById('pebModalOutputType');
    this.modalProcessedInput = document.getElementById('pebModalProcessed');
    this.modalRecordCountInput = document.getElementById('pebModalRecordCount');
    this.modalRetrieveQbcInput = document.getElementById('pebModalRetrieveQbc');
    this.modeButtons = Array.from(document.querySelectorAll('.peb-mode-btn'));
    this.modalOpenButtons = Array.from(document.querySelectorAll('[data-open-modal]'));
    this.gridActionButtons = Array.from(document.querySelectorAll('.peb-grid-action'));
    this.batchToolbarButtons = Array.from(document.querySelectorAll('#pricingEngineBatchBatchToolbar .gt-action-btn'));
    this.bulkUploadButton = document.querySelector('[data-action="bulk-upload"]');
  },

  initGrid() {
    const compactPreset = window.GridToolbar?.DEFAULT_DENSITY_PRESETS?.compact || {
      rowHeight: 40,
      headerHeight: 48,
      floatingFiltersHeight: 38
    };

    this.gridApi = DynamicGrid.createGrid({
      gridElementId: 'pricingEngineBatchGrid',
      paginationType: 'client',
      pageSize: 10,
      floatingFilter: true,
      manualFilterApply: true,
      autoFitColumns: false,
      gridOptions: {
        rowData: [],
        rowSelection: 'multiple',
        suppressRowClickSelection: true,
        rowHeight: compactPreset.rowHeight,
        headerHeight: compactPreset.headerHeight,
        floatingFiltersHeight: compactPreset.floatingFiltersHeight,
        components: {
          pebPageSelectHeader: PebPageSelectHeader
        },
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
          lessThan: 'Less than'
        },
        defaultColDef: {
          sortable: true,
          resizable: true,
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
      columns: [
        {
          colId: 'select',
          headerName: '',
          checkboxSelection: true,
          headerComponent: 'pebPageSelectHeader',
          width: 52,
          minWidth: 52,
          maxWidth: 52,
          pinned: 'left',
          sortable: false,
          filter: false,
          floatingFilter: false,
          resizable: false,
          editable: false,
          suppressHeaderMenuButton: true,
          cellClass: 'cell-center'
        },
        this.buildColumn('accountNumber', 'Account Number', 185),
        this.buildColumn('accountName', 'Account Name', 180),
        this.buildColumn('customerPlatform', 'Customer Platform', 185),
        this.buildColumn('itemNumber', 'Item Number', 150),
        this.buildColumn('itemDescription', 'Item Description', 280),
        this.buildColumn('um', 'UM', 108, { cellClass: 'cell-center' }),
        this.buildColumn('pricingDate', 'Pricing Date', 130, { cellClass: 'cell-center' }),
        this.buildColumn('billToNumber', 'Bill To Number', 150),
        this.buildColumn('billingAddressType', 'Billing Address Type', 210),
        this.buildColumn('customerPlatformGroup', 'Customer Platform', 180),
        this.buildColumn('marketClass', 'Market Class', 170),
        this.buildColumn('marketSubClass', 'Market Sub class', 190),
        this.buildColumn('marketSpeciality', 'Market Speciality', 190),
        this.buildColumn('priceRuleControlAccount', 'Price Rule Control Account', 220),
        this.buildColumn('prcasPcca', "PRCA's PCCA", 170),
        this.buildColumn('market', 'Market', 120)
      ]
    });

    this.gridElement = document.getElementById('pricingEngineBatchGrid');
    if (!this.gridApi) return;

    this.gridApi.applyPendingFloatingFilters = () => this.applyPendingFilters();

    setTimeout(() => {
      if (typeof GridManager !== 'undefined') {
        GridManager.init(this.gridApi, 'pricingEngineBatchGrid');
      }
      this.applyDefaultDensity();
    }, 250);
  },

  initBatchGrid() {
    const compactPreset = window.GridToolbar?.DEFAULT_DENSITY_PRESETS?.compact || {
      rowHeight: 40,
      headerHeight: 48,
      floatingFiltersHeight: 38
    };

    this.batchGridApi = DynamicGrid.createGrid({
      gridElementId: 'pricingEngineBatchBatchGrid',
      paginationType: 'client',
      pageSize: 10,
      floatingFilter: true,
      manualFilterApply: true,
      autoFitColumns: false,
      gridOptions: {
        rowData: [this.createBlankBatchRow()],
        rowSelection: 'multiple',
        suppressRowClickSelection: true,
        singleClickEdit: true,
        enableRangeSelection: true,
        suppressClipboardPaste: false,
        copyHeadersToClipboard: false,
        stopEditingWhenCellsLoseFocus: true,
        rowHeight: compactPreset.rowHeight,
        headerHeight: compactPreset.headerHeight,
        floatingFiltersHeight: compactPreset.floatingFiltersHeight,
        components: {
          pebPageSelectHeader: PebPageSelectHeader
        },
        defaultColDef: {
          sortable: true,
          resizable: true,
          unSortIcon: true,
          wrapHeaderText: true,
          autoHeaderHeight: true,
          editable: true,
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
          headerComponent: 'pebPageSelectHeader',
          width: 52,
          minWidth: 52,
          maxWidth: 52,
          pinned: 'left',
          sortable: false,
          filter: false,
          floatingFilter: false,
          resizable: false,
          editable: false,
          suppressHeaderMenuButton: true,
          suppressCsvExport: true,
          cellClass: 'cell-center'
        },
        this.buildColumn('accountNumber', 'Account Number', 185, { editable: true }),
        this.buildColumn('accountName', 'Account Name', 180, { editable: true }),
        this.buildColumn('customerPlatform', 'Customer Platform', 185, { editable: true }),
        this.buildColumn('itemNumber', 'Item Number', 150, { editable: true }),
        this.buildColumn('itemDescription', 'Item Description', 280, { editable: true }),
        this.buildColumn('um', 'UM', 108, { cellClass: 'cell-center', editable: true }),
        this.buildColumn('pricingDate', 'Pricing Date', 130, { cellClass: 'cell-center', editable: true }),
        this.buildColumn('billToNumber', 'Bill To Number', 150, { editable: true }),
        this.buildColumn('billingAddressType', 'Billing Address Type', 210, { editable: true }),
        this.buildColumn('customerPlatformGroup', 'Customer Platform', 180, { editable: true }),
        this.buildColumn('marketClass', 'Market Class', 170, { editable: true })
      ]
    });

    this.batchGridElement = document.getElementById('pricingEngineBatchBatchGrid');
    if (!this.batchGridApi) return;

    this.batchGridApi.applyPendingFloatingFilters = () => {
      if (!Array.isArray(this.batchGridApi.__manualFloatingFilters)) return;
      const pendingFilters = [...this.batchGridApi.__manualFloatingFilters];
      pendingFilters.forEach((filterInstance) => {
        if (filterInstance && typeof filterInstance.apply === 'function') {
          filterInstance.apply();
        }
      });
    };

    if (typeof this.detachBatchCommunityPaste === 'function') {
      this.detachBatchCommunityPaste();
      this.detachBatchCommunityPaste = null;
    }

    if (window.CommunityGridPaste?.attach && this.batchGridElement) {
      const editableFields = [
        'accountNumber',
        'accountName',
        'customerPlatform',
        'itemNumber',
        'itemDescription',
        'um',
        'pricingDate',
        'billToNumber',
        'billingAddressType',
        'customerPlatformGroup',
        'marketClass'
      ];
      this.detachBatchCommunityPaste = window.CommunityGridPaste.attach({
        gridElement: this.batchGridElement,
        gridApi: this.batchGridApi,
        editableFieldOrder: editableFields,
        maxRows: this.maxPasteRows,
        maxCols: this.maxPasteCols,
        maxCells: this.maxPasteCells,
        showInfo: (message, type) => this.showInfo(message, type),
        ensureRowCapacity: (rowCount, startRowIndex) => this.ensureBatchRowCapacityForPaste(rowCount, startRowIndex),
        normalizeRow: (row) => row,
        validateRow: () => ({ isValid: true, errors: [] })
      });
    }
  },

  buildColumn(field, headerName, minWidth, options = {}) {
    return {
      field,
      colId: field,
      headerName,
      minWidth,
      width: minWidth,
      cellClass: options.cellClass || 'cell-left',
      editable: Boolean(options.editable),
      filter: 'agTextColumnFilter',
      filterParams: {
        buttons: ['apply', 'reset'],
        closeOnApply: true,
        maxNumConditions: 1,
        numAlwaysVisibleConditions: 1,
        filterOptions: ['contains', 'notContains', 'equals', 'notEqual']
      }
    };
  },

  createBlankBatchRow() {
    return {
      accountNumber: '',
      accountName: '',
      customerPlatform: '',
      itemNumber: '',
      itemDescription: '',
      um: '',
      pricingDate: '',
      billToNumber: '',
      billingAddressType: '',
      customerPlatformGroup: '',
      marketClass: ''
    };
  },

  getBatchGridRows() {
    const rows = [];
    this.batchGridApi?.forEachNode?.((node) => {
      if (node?.data) rows.push({ ...node.data });
    });
    return rows;
  },

  ensureBatchRowCapacityForPaste(rowCount, startRowIndex = 0) {
    if (!this.batchGridApi) return;
    const existingRows = this.getBatchGridRows();
    const requiredRows = startRowIndex + rowCount;
    while (existingRows.length < requiredRows) {
      existingRows.push(this.createBlankBatchRow());
    }
    this.batchGridApi.setGridOption('rowData', existingRows);
  },

  bindToolbarActions() {
    document.querySelectorAll('.gt-action-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const actionId = button.dataset.action || button.id;
        switch (actionId) {
          case 'back':
            window.history.back();
            break;
          case 'add':
            this.resetFormState(true);
            this.showInfo('Ready for a new pricing request.', 'success');
            break;
          case 'favorite':
            this.showInfo('Favorite action is not configured yet.', 'warning');
            break;
          case 'refresh':
            this.resetGridState();
            break;
          case 'execute':
            this.executeSearch();
            break;
          default:
            break;
        }
      });
    });
  },

  bindWorkflowActions() {
    this.modeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        this.currentMode = button.dataset.mode || 'Batch';
        this.modeButtons.forEach((candidate) => {
          candidate.classList.toggle('is-active', candidate === button);
        });
        this.processingModeInput.value = this.currentMode;
        this.modalProcessingModeInput.value = this.currentMode;

        if (this.currentMode === 'Interactive') {
          this.hideBatchShell();
          this.executeSearch();
        } else if (this.currentMode === 'Batch') {
          this.hideResults();
          this.showBatchShell();
        }
      });
    });

    this.modalOpenButtons.forEach((button) => {
      button.addEventListener('click', () => {
        this.openModal(button.dataset.openModal || 'import');
      });
    });
  },

  bindModalActions() {
    this.modalEl?.querySelectorAll('[data-modal-close="true"]').forEach((button) => {
      button.addEventListener('click', () => this.closeModal());
    });

    this.modalSubmitBtn?.addEventListener('click', () => {
      this.closeModal();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !this.modalEl?.hidden) {
        this.closeModal();
      }
    });
  },

  bindBatchActions() {
    this.batchToolbarButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const actionId = button.dataset.action || button.id;
        switch (actionId) {
          case 'batch-back':
            window.history.back();
            break;
          case 'batch-delete':
          case 'batch-submit':
          case 'batch-execute':
            this.showInfo('This batch action is not configured yet.', 'warning');
            break;
          default:
            break;
        }
      });
    });

    this.batchCollapseBtn?.addEventListener('click', () => {
      const isCollapsed = this.batchAccordion?.classList.toggle('is-collapsed');
      this.batchCollapseBtn.setAttribute('aria-expanded', String(!isCollapsed));
    });

    this.bulkUploadButton?.addEventListener('click', () => {
      this.bulkUploadModal?.open?.();
    });

    if (window.BulkUploadModal?.create) {
      this.bulkUploadModal = window.BulkUploadModal.create({
        modalId: 'pricingEngineBatchBulkUploadModal',
        dropzoneId: 'pricingEngineBatchBulkUploadDropzone',
        inputId: 'pricingEngineBatchBulkUploadInput',
        browseBtnId: 'pricingEngineBatchBulkUploadBrowseBtn',
        nextBtnId: 'pricingEngineBatchBulkUploadNextBtn',
        errorId: 'pricingEngineBatchBulkUploadError',
        fileCardId: 'pricingEngineBatchBulkUploadFileCard',
        fileNameId: 'pricingEngineBatchBulkUploadSelectedFile',
        fileSizeId: 'pricingEngineBatchBulkUploadFileSize',
        fileRemoveBtnId: 'pricingEngineBatchBulkUploadFileRemoveBtn',
        initialNextLabel: 'Upload',
        uploadLabel: 'Upload',
        onUpload: (_file, helpers) => {
          helpers.close();
        }
      });
    }
  },

  initViewActions() {
    const downloadButton = document.querySelector('.gt-view-btn[data-action="download"]');
    downloadButton?.addEventListener('click', () => this.handleDownloadAction());
  },

  configureSharedGridTools(gridApi, gridElement, gridId) {
    if (!this.sharedTopbar) return;
    this.sharedTopbar.hidden = false;

    if (typeof GridManager !== 'undefined' && gridApi) {
      GridManager.init(gridApi, gridId);
    }

    if (window.GridToolbar && gridApi && gridElement) {
      window.GridToolbar.bindDensityControls({
        gridApi,
        gridElement,
        defaultMode: 'compact',
        densityClassPrefix: 'screen-density'
      });
    }
  },

  openModal(workflow) {
    this.currentWorkflow = workflow === 'load' ? 'load' : 'import';
    const verb = this.currentWorkflow === 'load' ? 'Load' : 'Import';
    this.modalTitleEl.textContent = `${verb} Customer and Item Info`;
    this.modalSubmitBtn.textContent = verb;
    this.modalJobNumberInput.value = '';
    this.modalDescriptionInput.value = '';
    this.modalProcessingModeInput.value = '';
    this.modalRecordCountInput.value = '';
    this.modalProcessedInput.value = '';
    this.modalOutputTypeInput.value = '';
    this.modalReportOutputInput.value = '';

    this.modalEl.hidden = false;
    this.modalEl.setAttribute('aria-hidden', 'false');
    this.pageBody.classList.add('peb-modal-open');
  },

  closeModal() {
    if (!this.modalEl) return;
    this.modalEl.hidden = true;
    this.modalEl.setAttribute('aria-hidden', 'true');
    this.pageBody.classList.remove('peb-modal-open');
  },

  executeSearch() {
    this.showResults();
    this.gridApi?.setGridOption('rowData', []);
    this.gridApi?.deselectAll?.();
    this.applyDefaultDensity();
  },

  hideResults() {
    this.resultsVisible = false;
    this.resultsSection.hidden = true;
    this.pageBody.classList.remove('peb-results-ready');
    this.gridApi?.deselectAll?.();
  },

  showResults() {
    this.resultsVisible = true;
    this.resultsSection.hidden = false;
    this.pageBody.classList.add('peb-results-ready');
    if (this.mainToolbar) this.mainToolbar.hidden = false;
    if (this.batchToolbar) this.batchToolbar.hidden = true;
    this.configureSharedGridTools(this.gridApi, this.gridElement, 'pricingEngineBatchGrid');

    requestAnimationFrame(() => {
      this.gridApi?.refreshHeader?.();
    });
  },

  showBatchShell() {
    this.batchVisible = true;
    if (this.batchShell) this.batchShell.hidden = false;
    if (this.mainToolbar) this.mainToolbar.hidden = true;
    if (this.batchToolbar) this.batchToolbar.hidden = false;
    this.configureSharedGridTools(this.batchGridApi, this.batchGridElement, 'pricingEngineBatchBatchGrid');
    if (this.batchGridApi && this.getBatchGridRows().length === 0) {
      this.batchGridApi.setGridOption('rowData', [this.createBlankBatchRow()]);
    }
    requestAnimationFrame(() => {
      this.batchGridApi?.refreshHeader?.();
    });
  },

  resetFormState(clearModal = false) {
    this.resultsVisible = false;
    this.batchVisible = false;
    this.currentWorkflow = 'import';
    this.currentMode = 'Batch';

    this.jobNumberInput.value = '';
    this.descriptionInput.value = '';
    this.processingModeInput.value = '';
    this.reportOutputInput.checked = true;
    this.outputTypeInput.value = '';

    this.modeButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.mode === this.currentMode);
    });

    if (clearModal) {
      this.modalDescriptionInput.value = '';
      this.modalOutputTypeInput.value = '';
      this.modalReportOutputInput.value = '';
      this.modalProcessedInput.value = '';
      this.modalProcessingModeInput.value = '';
      this.modalRecordCountInput.value = '';
      this.modalJobNumberInput.value = '';
      this.modalRetrieveQbcInput.checked = false;
    }

    this.resultsSection.hidden = true;
    this.pageBody.classList.remove('peb-results-ready');
    this.hideBatchShell();
    this.gridApi?.setGridOption('rowData', []);
    this.gridApi?.setFilterModel?.(null);
    this.gridApi?.setSortModel?.(null);
    this.gridApi?.paginationGoToFirstPage?.();
    this.gridApi?.deselectAll?.();
    this.batchGridApi?.setGridOption('rowData', [this.createBlankBatchRow()]);
    this.batchGridApi?.setFilterModel?.(null);
    this.batchGridApi?.setSortModel?.(null);
    this.batchGridApi?.paginationGoToFirstPage?.();
    this.batchGridApi?.deselectAll?.();
  },

  hideBatchShell() {
    this.batchVisible = false;
    if (this.batchShell) this.batchShell.hidden = true;
    if (this.mainToolbar) this.mainToolbar.hidden = false;
    if (this.batchToolbar) this.batchToolbar.hidden = true;
    if (!this.resultsVisible && this.sharedTopbar) this.sharedTopbar.hidden = true;
  },

  resetGridState() {
    if (!this.resultsVisible || !this.gridApi) return;
    this.gridApi.setFilterModel?.(null);
    this.gridApi.setSortModel?.(null);
    this.gridApi.paginationGoToFirstPage?.();
    this.gridApi.setGridOption('rowData', []);
    this.gridApi.deselectAll?.();
    this.applyDefaultDensity();
    this.showInfo('Grid filters and sort order were reset.', 'success');
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

  applyDefaultDensity() {
    if (!window.GridToolbar || !this.gridApi || !this.gridElement) return;
    window.GridToolbar.stabilizeDensity(
      {
        gridApi: this.gridApi,
        gridElement: this.gridElement,
        densityClassPrefix: 'screen-density'
      },
      'compact'
    );
  },

  handleDownloadAction() {
    const activeGridApi = this.batchVisible ? this.batchGridApi : this.gridApi;
    if (!activeGridApi || (!this.resultsVisible && !this.batchVisible)) {
      this.showInfo('Run a pricing request before downloading.', 'warning');
      return;
    }

    activeGridApi.exportDataAsCsv({
      fileName: this.buildDownloadFileName()
    });
  },

  buildDownloadFileName() {
    const jobNumber = (this.jobNumberInput.value || 'pricing_engine_batch').replace(/[^a-z0-9_-]+/gi, '_');
    return `${jobNumber.toLowerCase()}_results.csv`;
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
    let container = document.getElementById('pricingEngineBatchToastLayer');
    if (container) return container;

    container = document.createElement('div');
    container.id = 'pricingEngineBatchToastLayer';
    container.className = 'app-page-toast-layer';
    document.body.appendChild(container);
    return container;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  PricingEngineBatchPage.init();
});
