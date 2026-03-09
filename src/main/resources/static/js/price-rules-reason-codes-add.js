const PriceRulesReasonCodesAddManager = {
  gridApi: null,
  gridElement: null,

  initialRows() {
    return [
      {
        id: 1,
        userDefinedCode: '',
        description: '',
        description2: '',
        specialHandlingCode: '',
        hardCoded: false
      }
    ];
  },

  init() {
    this.initGrid();
    this.bindToolbarActions();
    this.bindBulkUploadAction();
    this.initViewActions();
  },

  initGrid() {
    const gridConfig = {
      gridElementId: 'priceRulesReasonCodesAddGrid',
      paginationType: 'client',
      pageSize: 10,
      floatingFilter: false,
      gridOptions: {
        rowData: this.initialRows(),
        rowSelection: 'multiple',
        suppressRowClickSelection: false,
        singleClickEdit: true,
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
        { field: 'userDefinedCode', headerName: 'Codes', minWidth: 140 },
        { field: 'description', headerName: 'Description 01', minWidth: 210 },
        { field: 'description2', headerName: 'Description 02', minWidth: 210 },
        { field: 'specialHandlingCode', headerName: 'Special Handling', minWidth: 180 },
        {
          field: 'hardCoded',
          headerName: 'Hard Coded',
          minWidth: 140,
          editable: true,
          cellStyle: { textAlign: 'center' },
          valueGetter: (params) => Boolean(params.data?.hardCoded),
          valueSetter: (params) => {
            params.data.hardCoded = Boolean(params.newValue);
            return true;
          },
          cellEditor: 'agCheckboxCellEditor',
          cellRenderer: (params) => {
            const checked = Boolean(params.value);
            return `<input type="checkbox" disabled ${checked ? 'checked' : ''} aria-label="Hard coded flag" />`;
          }
        }
      ]
    };

    this.gridApi = DynamicGrid.createGrid(gridConfig);
    this.gridElement = document.getElementById('priceRulesReasonCodesAddGrid');
    window.gridApi = this.gridApi;

    if (this.gridApi && typeof this.gridApi.addEventListener === 'function') {
      this.gridApi.addEventListener('firstDataRendered', () => this.applyDefaultDensity());
    }
    this.applyDefaultDensity();

    setTimeout(() => {
      if (window.gridApi && typeof GridManager !== 'undefined') {
        GridManager.init(window.gridApi, 'priceRulesReasonCodesAddGrid');
      }
    }, 300);
  },

  bindBulkUploadAction() {
    const btn = document.getElementById('prrcBulkUploadBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      this.showInfo('Bulk upload is not wired yet', 'info');
    });
  },

  initViewActions() {
    if (!this.gridApi || !this.gridElement || typeof GridToolbar === 'undefined') return;
    GridToolbar.bindDensityControls({
      gridApi: this.gridApi,
      gridElement: this.gridElement,
      defaultMode: 'compact',
      densityClassPrefix: 'mfi-density'
    });
  },

  applyDefaultDensity() {
    if (!this.gridApi || !this.gridElement || typeof GridToolbar === 'undefined') return;
    GridToolbar.stabilizeDensity({
      gridApi: this.gridApi,
      gridElement: this.gridElement,
      defaultMode: 'compact',
      densityClassPrefix: 'mfi-density'
    });
  },

  getRows() {
    const rows = [];
    if (!this.gridApi) return rows;
    this.gridApi.forEachNode((node) => {
      if (!node?.data) return;
      rows.push(node.data);
    });
    return rows;
  },

  deleteSelectedRows() {
    if (!this.gridApi) return;
    const selected = this.gridApi.getSelectedRows?.() || [];
    if (selected.length === 0) {
      this.showInfo('Select at least one row to delete', 'error');
      return;
    }
    this.gridApi.applyTransaction({ remove: selected });
  },

  saveRows() {
    const rows = this.getRows();
    if (rows.length === 0) {
      this.showInfo('No rows to save', 'error');
      return;
    }
    console.log('Price Rules Reason Codes rows to save:', rows);
    this.showInfo('Save action is ready for API wiring', 'success');
  },

  showInfo(message, type = 'success') {
    if (window.GridManager?.currentInstance?.showToast) {
      window.GridManager.currentInstance.showToast(message, type, 2200);
      return;
    }
    console.log(message);
  },

  bindToolbarActions() {
    document.addEventListener('click', (event) => {
      const actionButton = event.target.closest('.gt-action-btn[data-action]');
      if (!actionButton) return;
      const action = actionButton.dataset.action;

      switch (action) {
        case 'back':
          window.location.href = window.PRRC_LIST_PAGE_URL || '/price-rules-reason-codes';
          break;
        case 'delete':
          this.deleteSelectedRows();
          break;
        case 'execute':
          this.showInfo('Execute action is not wired yet', 'info');
          break;
        case 'save':
          this.saveRows();
          break;
        default:
          break;
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  PriceRulesReasonCodesAddManager.init();
});
