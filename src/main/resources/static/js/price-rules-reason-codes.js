const PriceRulesReasonCodesManager = {
  gridApi: null,
  gridElement: null,
  getUiInputs() {
    const systemCodeInput = document.getElementById('prrcSystemCodeInput');
    const userDefinedCodesInput = document.getElementById('prrcUserDefinedCodesInput');

    return {
      productCode: String(systemCodeInput?.value || window.PRRC_PRODUCT_CODE || '55').trim(),
      userDefinedCodes: String(userDefinedCodesInput?.value || window.PRRC_USER_DEFINED_CODES || 'R0').trim()
    };
  },

  resolveApiEndpoint() {
    const baseUrl = String(
      window.PRICE_RULES_REASON_CODES_API_BASE_URL
      || window.GUIDANCE_API_BASE_URL
      || ''
    ).trim().replace(/\/$/, '');

    const path = String(
      window.PRICE_RULES_REASON_CODES_API_PATH
      || '/api/v1/priceRulesReasonCodes'
    ).trim();

    if (!path) return baseUrl;
    const resolvedPath = /^https?:\/\//i.test(path)
      ? path
      : (!baseUrl ? path : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`);

    const { productCode, userDefinedCodes } = this.getUiInputs();
    const query = new URLSearchParams();
    if (productCode) query.set('productCode', productCode);
    if (userDefinedCodes) query.set('userDefinedCodes', userDefinedCodes);

    const queryString = query.toString();
    if (!queryString) return resolvedPath;
    return `${resolvedPath}${resolvedPath.includes('?') ? '&' : '?'}${queryString}`;
  },

  init() {
    this.initGrid();
    this.bindToolbarActions();
    this.initViewActions();
    this.bindFilterInputs();
  },

  initGrid() {
    const gridConfig = {
      gridElementId: 'priceRulesReasonCodesGrid',
      apiEndpoint: this.resolveApiEndpoint(),
      pageSize: 10,
      floatingFilter: true,
      paginationType: 'server',
      useSpringPagination: true,
      gridOptions: {
        rowSelection: 'multiple',
        suppressRowClickSelection: false,
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
          filterParams: {
            buttons: ['apply', 'reset'],
            closeOnApply: true
          }
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
          filter: 'agTextColumnFilter',
          floatingFilter: true,
          filterParams: {
            filterOptions: ['equals', 'notEqual', 'blank', 'notBlank'],
            buttons: ['apply', 'reset'],
            closeOnApply: true
          },
          cellStyle: { textAlign: 'center' },
          cellRenderer: (params) => {
            const checked = Boolean(params.value);
            return `<input type="checkbox" disabled ${checked ? 'checked' : ''} aria-label="Hard coded flag" />`;
          }
        }
      ]
    };

    this.gridApi = DynamicGrid.createGrid(gridConfig);
    this.gridElement = document.getElementById('priceRulesReasonCodesGrid');
    window.gridApi = this.gridApi;

    if (this.gridApi && typeof this.gridApi.addEventListener === 'function') {
      this.gridApi.addEventListener('firstDataRendered', () => this.applyDefaultDensity());
    }
    this.applyDefaultDensity();
    setTimeout(() => this.applyDefaultDensity(), 150);

    setTimeout(() => {
      if (window.gridApi && typeof GridManager !== 'undefined') {
        GridManager.init(window.gridApi, 'priceRulesReasonCodesGrid');
      }
    }, 500);
  },

  initViewActions() {
    if (!this.gridApi || !this.gridElement || typeof GridToolbar === 'undefined') return;

    GridToolbar.bindDensityControls({
      gridApi: this.gridApi,
      gridElement: this.gridElement,
      defaultMode: 'compact',
      densityClassPrefix: 'mfi-density'
    });

    GridToolbar.bindDownloadControl({
      gridApi: this.gridApi,
      fileName: 'price-rules-reason-codes.csv'
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

  refreshGridData() {
    if (!this.gridApi) return;
    if (typeof this.gridApi.refreshInfiniteCache === 'function') {
      this.gridApi.refreshInfiniteCache();
    }
    if (typeof this.gridApi.deselectAll === 'function') {
      this.gridApi.deselectAll();
    }
  },

  bindFilterInputs() {
    const systemCodeInput = document.getElementById('prrcSystemCodeInput');
    const userDefinedCodesInput = document.getElementById('prrcUserDefinedCodesInput');
    const onApply = () => this.refreshGridData();

    [systemCodeInput, userDefinedCodesInput].forEach((input) => {
      if (!input) return;
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          onApply();
        }
      });
      input.addEventListener('blur', onApply);
    });
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
      if (!action) return;

      switch (action) {
        case 'back':
          window.history.back();
          break;
        case 'add':
          window.location.href = window.PRRC_ADD_PAGE_URL || '/price-rules-reason-codes/add';
          break;
        case 'tools':
          this.showInfo('Tools action is not wired yet', 'info');
          break;
        case 'delete': {
          const selected = this.gridApi?.getSelectedRows?.() || [];
          if (selected.length === 0) {
            this.showInfo('Select at least one row to delete', 'error');
          } else {
            this.showInfo(`Delete action pending API wiring (${selected.length} selected)`, 'info');
          }
          break;
        }
        case 'refresh':
          this.refreshGridData();
          break;
        case 'execute':
          this.refreshGridData();
          this.showInfo('Execution completed', 'success');
          break;
        default:
          break;
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  PriceRulesReasonCodesManager.init();
});
