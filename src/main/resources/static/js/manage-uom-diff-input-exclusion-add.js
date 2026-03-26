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
  maxPasteRows: 5000,
  maxPasteCols: 10,
  maxPasteCells: 50000,

  init() {
    this.initGrid();
    this.bindToolbarActions();
    this.initViewActions();
  },

  createBlankRow() {
    const row = {};
    UOM_DIFF_EXCLUSION_ADD_FIELD_DEFS.forEach(({ field }) => {
      row[field] = '';
    });
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
        requireHeaderMapping: true,
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
      cellClass: column.type === 'date' || column.type === 'number' ? 'cell-align-right' : 'cell-align-left'
    };

    if (column.type === 'date') {
      config.filter = 'agDateColumnFilter';
      if (dateComparator) config.filterParams = { comparator: dateComparator };
    } else if (column.type === 'number') {
      config.filter = 'agNumberColumnFilter';
      config.filterValueGetter = (params) => this.numberFilterValue(params?.data?.[column.field]);
    } else {
      config.filter = 'agTextColumnFilter';
    }

    if (UOM_DIFF_EXCLUSION_ADD_FLAG_FIELDS.has(column.field)) {
      config.valueSetter = (params) => this.setFlagCellValue(params, column.field);
    }

    return config;
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
          this.showInfo('Submit will be wired when the add APIs are ready.', 'warning');
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
        normalized[field] = this.normalizeFlagValue(value);
      } else {
        normalized[field] = String(value ?? '').trim();
      }
    });
    return normalized;
  },

  normalizeFlagValue(value) {
    const normalized = String(value ?? '').trim().toUpperCase();
    if (!normalized) return '';
    return normalized === 'Y' ? 'Y' : normalized === 'N' ? 'N' : normalized;
  },

  setFlagCellValue(params, field) {
    if (!params?.data || !field) return false;
    params.data[field] = this.normalizeFlagValue(params.newValue);
    return true;
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
    const raw = String(value || '').trim();
    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/);
    if (!isoMatch) return raw;
    return `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1]}`;
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
