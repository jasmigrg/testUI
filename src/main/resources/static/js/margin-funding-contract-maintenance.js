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
    const pageSize = this.params.api.paginationGetPageSize?.() || 10;
    const currentPage = this.params.api.paginationGetCurrentPage?.() || 0;
    const from = currentPage * pageSize;
    const to = from + pageSize;

    for (let index = from; index < to; index += 1) {
      const rowNode = this.params.api.getDisplayedRowAtIndex(index);
      if (!rowNode) continue;
      if (rowNode.rowPinned || rowNode.group || rowNode.selectable === false) continue;
      rowNode.setSelected(shouldSelect);
    }

    this.syncState();
  }

  syncState() {
    if (!this.checkbox || !this.params?.api) return;
    const pageSize = this.params.api.paginationGetPageSize?.() || 10;
    const currentPage = this.params.api.paginationGetCurrentPage?.() || 0;
    const from = currentPage * pageSize;
    const to = from + pageSize;
    let selectableCount = 0;
    let selectedCount = 0;

    for (let index = from; index < to; index += 1) {
      const rowNode = this.params.api.getDisplayedRowAtIndex(index);
      if (!rowNode) continue;
      if (rowNode.rowPinned || rowNode.group || rowNode.selectable === false) continue;
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

class MarginFundingContractManualFloatingFilter {
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
      if (event.key === 'Enter') {
        event.preventDefault();
        if (this.params?.api && typeof this.params.api.applyPendingFloatingFilters === 'function') {
          this.params.api.applyPendingFloatingFilters();
        } else {
          this.apply();
        }
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
      next = this.rebuildOperatorInput(parentModel.type, this.normalizeDateValueForDisplay(parentModel.dateFrom));
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
    const parsedInput = MarginFundingContractMaintenancePage.parseInlineFilterExpression(value, fallbackOperator);

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

  normalizeDateValueForDisplay(value) {
    const raw = String(value == null ? '' : value).trim();
    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/);
    if (!isoMatch) return raw;
    return `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1]}`;
  }

  destroy() {
    if (this.input && this.onKeyDown) {
      this.input.removeEventListener('keydown', this.onKeyDown);
    }
    const list = this.params?.api?.__manualFloatingFilters;
    if (Array.isArray(list)) {
      const idx = list.indexOf(this);
      if (idx >= 0) list.splice(idx, 1);
    }
  }
}

const MarginFundingContractMaintenancePage = {
  gridApi: null,
  gridElement: null,

  buildRows() {
    const contractTypes = ['Primary', 'Secondary', 'Wildcard', 'Regional'];
    const includeExcludeValues = ['I', 'E'];
    return Array.from({ length: 24 }, (_, index) => {
      const seed = index + 1;
      const month = String((seed % 12) + 1).padStart(2, '0');
      const vendorSeed = String(1000 + seed);
      const day = String((seed % 27) + 1).padStart(2, '0');
      return {
        uniqueKey: `MFCN-${5000 + seed}`,
        vendorFamilyNumber: `${30000 + seed}`,
        vendorFamilyName: `Vendor Family ${String.fromCharCode(65 + (index % 6))}`,
        vendorProgram: `VP-${vendorSeed}`,
        manufacturerContractId: `MFG-${9000 + seed}`,
        mfgContractIdWildcardLookup: `WC-${7000 + seed}`,
        contractType: contractTypes[index % contractTypes.length],
        ie: includeExcludeValues[index % includeExcludeValues.length],
        effectiveFrom: `${month}/${day}/2026`,
        effectiveThru: `${month}/${String(Math.min(Number(day) + 1, 28)).padStart(2, '0')}/2027`,
        dateUpdated: `${month}/${day}/2026`,
        timeUpdated: `${String(8 + (index % 10)).padStart(2, '0')}:15:00`,
        userId: `USER${200 + (index % 8)}`,
        workStnId: `WS${500 + (index % 6)}`,
        programId: `PGM-${4000 + (index % 12)}`
      };
    });
  },

  parseInlineFilterExpression(value, fallbackOperator = 'contains') {
    if (typeof DynamicGrid !== 'undefined' && typeof DynamicGrid.parseTextFilterInput === 'function') {
      const parsed = DynamicGrid.parseTextFilterInput(value, fallbackOperator);
      return {
        type: parsed?.operator || fallbackOperator,
        value: parsed?.value || '',
        isInvalid: Boolean(parsed?.isInvalid),
        invalidReason: parsed?.invalidReason || ''
      };
    }
    return { type: fallbackOperator, value, isInvalid: false, invalidReason: '' };
  },

  toIsoDate(value) {
    const raw = String(value || '').trim();
    const usMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!usMatch) return raw;
    return `${usMatch[3]}-${usMatch[1]}-${usMatch[2]}`;
  },

  numberFilterValue(value) {
    const raw = String(value ?? '').replace(/,/g, '').trim();
    if (!raw) return null;
    const numeric = Number(raw);
    return Number.isFinite(numeric) ? numeric : null;
  },

  showInfo(message, type = 'success') {
    if (!window.PageToast?.show) return;
    let container = document.getElementById('marginFundingContractPageToastLayer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'marginFundingContractPageToastLayer';
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
  },

  getFieldKind(field) {
    if (['effectiveFrom', 'effectiveThru', 'dateUpdated'].includes(field)) return 'date';
    if (['vendorFamilyNumber'].includes(field)) return 'number';
    return 'text';
  },

  buildFilterableColumn(column) {
    const fieldKind = this.getFieldKind(column.field);
    const config = {
      ...column,
      cellClass: fieldKind === 'date' || fieldKind === 'number' ? 'cell-align-right' : 'cell-align-left'
    };

    if (fieldKind === 'date') {
      config.filter = 'agDateColumnFilter';
      config.filterParams = {
        comparator: window.GridFilterOperatorUtils?.createUsDateComparator
          ? window.GridFilterOperatorUtils.createUsDateComparator((value) => this.toIsoDate(value))
          : undefined,
        buttons: ['apply', 'reset'],
        closeOnApply: true,
        maxNumConditions: 1,
        numAlwaysVisibleConditions: 1
      };
    } else if (fieldKind === 'number') {
      config.filter = 'agNumberColumnFilter';
      config.filterValueGetter = (params) => this.numberFilterValue(params?.data?.[column.field]);
      config.filterParams = {
        buttons: ['apply', 'reset'],
        closeOnApply: true,
        maxNumConditions: 1,
        numAlwaysVisibleConditions: 1
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

    return config;
  },

  applyAdvancedFilters() {
    const fieldTypeMap = {};
    const filterableFields = [
      'uniqueKey',
      'vendorFamilyNumber',
      'vendorFamilyName',
      'vendorProgram',
      'manufacturerContractId',
      'mfgContractIdWildcardLookup',
      'contractType',
      'ie',
      'effectiveFrom',
      'effectiveThru',
      'dateUpdated',
      'timeUpdated',
      'userId',
      'workStnId',
      'programId'
    ];
    filterableFields.forEach((field) => {
      fieldTypeMap[field] = this.getFieldKind(field);
    });

    if (window.GridFilterOperatorUtils?.applyFloatingFilters) {
      window.GridFilterOperatorUtils.applyFloatingFilters({
        gridApi: this.gridApi,
        gridElement: this.gridElement,
        fieldTypeMap,
        toDateIso: (value) => this.toIsoDate(value),
        isNumeric: (value) => !Number.isNaN(Number(String(value).replace(/,/g, '').trim())),
        onValidationError: (field, reason) => this.showInfo(`${field}: ${reason}`, 'error')
      });
      return;
    }

    this.gridApi?.onFilterChanged?.();
  },

  clearColumnFilters() {
    if (!this.gridApi) return;
    this.gridApi.setFilterModel?.(null);
    this.gridApi.onFilterChanged?.();
    this.gridElement?.querySelectorAll('.mfi-floating-filter-input').forEach((input) => {
      input.value = '';
    });
  },

  resetGridState() {
    if (!this.gridApi) return;
    this.clearColumnFilters();
    this.gridApi.applyColumnState?.({ defaultState: { sort: null } });
    this.gridApi.paginationGoToFirstPage?.();
    this.gridApi.deselectAll?.();
  },

  applyDefaultDensity() {
    if (!(window.GridToolbar && this.gridApi && this.gridElement)) return;
    const activeDensityBtn = document.querySelector('.gt-view-btn[data-density].is-active');
    const defaultMode = activeDensityBtn?.dataset?.density || 'compact';
    window.GridToolbar.stabilizeDensity(
      {
        gridApi: this.gridApi,
        gridElement: this.gridElement,
        densityClassPrefix: 'mfi-density'
      },
      defaultMode
    );
  },

  initViewActions() {
    const backBtn = document.querySelector('.gt-action-btn[data-action="back"]');
    backBtn?.addEventListener('click', () => window.history.back());

    if (window.GridToolbar && this.gridApi && this.gridElement) {
      window.GridToolbar.bindDensityControls({
        gridApi: this.gridApi,
        gridElement: this.gridElement,
        defaultMode: 'compact',
        densityClassPrefix: 'mfi-density'
      });
    }

    document.querySelector('.gt-action-btn[data-action="add"]')
      ?.addEventListener('click', () => this.showInfo('Add flow will be wired once the contract APIs are finalized.', 'warning'));
    document.querySelector('.gt-action-btn[data-action="favorite"]')
      ?.addEventListener('click', () => this.showInfo('Favorite action is not configured yet.', 'warning'));
    document.querySelector('.gt-action-btn[data-action="disable"]')
      ?.addEventListener('click', () => {
        const selected = this.gridApi?.getSelectedRows?.() || [];
        if (!selected.length) {
          this.showInfo('Select at least one row to disable.', 'error');
          return;
        }
        this.showInfo('Disable action will be wired when the contract mutation APIs are ready.', 'warning');
      });
    document.querySelector('.gt-action-btn[data-action="update-termination-date"]')
      ?.addEventListener('click', () => {
        const selected = this.gridApi?.getSelectedRows?.() || [];
        if (!selected.length) {
          this.showInfo('Select at least one row to update termination date.', 'error');
          return;
        }
        this.showInfo('Update Termination Date will be wired when the contract APIs are finalized.', 'warning');
      });
    document.querySelector('.gt-action-btn[data-action="refresh"]')
      ?.addEventListener('click', () => this.resetGridState());
    document.querySelector('.gt-action-btn[data-action="execute"]')
      ?.addEventListener('click', () => {
        if (typeof this.gridApi?.applyPendingFloatingFilters === 'function') {
          this.gridApi.applyPendingFloatingFilters();
        }
      });
  },

  init() {
    this.gridElement = document.getElementById('mfcContractGrid');

    const gridConfig = {
      gridElementId: 'mfcContractGrid',
      pageSize: 10,
      paginationType: 'client',
      floatingFilter: true,
      manualFilterApply: true,
      gridOptions: {
        rowData: this.buildRows(),
        rowSelection: 'multiple',
        suppressRowClickSelection: true,
        singleClickEdit: false,
        icons: {
          sortUnSort:
            '<span class="gt-sort-icon gt-sort-icon--none" aria-hidden="true"><svg viewBox="0 0 8 12" focusable="false"><path d="M4 1L7 4H1L4 1Z"></path><path d="M4 11L1 8H7L4 11Z"></path></svg></span>',
          sortAscending:
            '<span class="gt-sort-icon gt-sort-icon--asc" aria-hidden="true"><svg viewBox="0 0 8 12" focusable="false"><path d="M4 1L7 4H1L4 1Z"></path></svg></span>',
          sortDescending:
            '<span class="gt-sort-icon gt-sort-icon--desc" aria-hidden="true"><svg viewBox="0 0 8 12" focusable="false"><path d="M4 11L1 8H7L4 11Z"></path></svg></span>'
        },
        components: {
          gtPageSelectHeader: GtPageSelectHeader,
          manualApplyFloatingFilter: MarginFundingContractManualFloatingFilter
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
      columns: [
        {
          field: 'select',
          headerName: '',
          checkboxSelection: true,
          headerComponent: 'gtPageSelectHeader',
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
        { field: 'uniqueKey', headerName: 'Unique Key', minWidth: 140 },
        { field: 'vendorFamilyNumber', headerName: 'Vendor Family Number', minWidth: 170 },
        { field: 'vendorFamilyName', headerName: 'Vendor Family Name', minWidth: 190 },
        { field: 'vendorProgram', headerName: 'Vendor Program', minWidth: 160 },
        { field: 'manufacturerContractId', headerName: 'Manufacturer Contract ID', minWidth: 170 },
        { field: 'mfgContractIdWildcardLookup', headerName: 'MFG Contract ID Wildcard Lookup', minWidth: 190 },
        { field: 'contractType', headerName: 'Contract Type', minWidth: 150 },
        { field: 'ie', headerName: 'I E', minWidth: 90 },
        { field: 'effectiveFrom', headerName: 'Effective From', minWidth: 150 },
        { field: 'effectiveThru', headerName: 'Effective Thru', minWidth: 150 },
        { field: 'dateUpdated', headerName: 'Date Updated', minWidth: 150 },
        { field: 'timeUpdated', headerName: 'Time Updated', minWidth: 140 },
        { field: 'userId', headerName: 'User ID', minWidth: 120 },
        { field: 'workStnId', headerName: 'Work Stn ID', minWidth: 130 },
        { field: 'programId', headerName: 'Program ID', minWidth: 130 }
      ].map((column) => this.buildFilterableColumn(column))
    };

    this.gridApi = DynamicGrid.createGrid(gridConfig);
    if (this.gridApi) {
      this.gridApi.applyPendingFloatingFilters = () => {
        const filters = this.gridApi.__manualFloatingFilters;
        if (Array.isArray(filters)) {
          filters.forEach((filter) => filter?.apply?.());
        }
      };
    }

    window.gridApi = this.gridApi;
    this.initViewActions();
    this.applyDefaultDensity();
    if (typeof this.gridApi?.addEventListener === 'function') {
      this.gridApi.addEventListener('firstDataRendered', () => this.applyDefaultDensity());
    }

    setTimeout(() => {
      if (typeof GridManager !== 'undefined' && this.gridApi) {
        GridManager.init(this.gridApi, 'mfcContractGrid');
      }
    }, 300);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  MarginFundingContractMaintenancePage.init();
});
