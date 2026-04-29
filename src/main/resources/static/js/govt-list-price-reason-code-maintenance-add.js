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

const GovtListPriceReasonCodeMaintenanceAddPage = {
  gridApi: null,
  gridElement: null,
  codeInput: null,

  init() {
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
      hardCoded: 'N'
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
        stopEditingWhenCellsLoseFocus: true,
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
      filterParams: {
        buttons: ['apply', 'reset'],
        closeOnApply: true,
        maxNumConditions: 1,
        numAlwaysVisibleConditions: 1,
        filterOptions: ['contains', 'notContains', 'equals', 'notEqual']
      }
    };
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
            this.showInfo('Prototype add screen saved as a design reference.', 'success');
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

    this.showInfo(`${selectedRows.length} row(s) removed from the prototype grid.`, 'success');
  },

  submitPrototype() {
    if (!this.gridApi) return;

    const rows = [];
    this.gridApi.stopEditing?.();
    this.gridApi.forEachNode((node) => rows.push(node.data || {}));

    const filledRows = rows.filter((row) =>
      [row.code, row.description01, row.description02, row.specialHandling, row.hardCoded]
        .some((value) => String(value || '').trim() !== '')
    );

    if (!filledRows.length && !(this.codeInput?.value || '').trim()) {
      this.showInfo('Enter at least one value before submitting the prototype.', 'warning');
      return;
    }

    this.showInfo(
      `Prototype submit captured ${filledRows.length} grid row(s). API wiring can plug in here next.`,
      'success'
    );
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
