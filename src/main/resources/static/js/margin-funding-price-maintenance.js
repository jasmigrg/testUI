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

    for (let i = from; i < to; i += 1) {
      const rowNode = this.params.api.getDisplayedRowAtIndex(i);
      if (!rowNode) continue;
      if (rowNode.rowPinned || rowNode.group || rowNode.selectable === false) continue;
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

    for (let i = from; i < to; i += 1) {
      const rowNode = this.params.api.getDisplayedRowAtIndex(i);
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

class MarginFundingPriceManualFloatingFilter {
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
      if (event.key !== 'Enter') return;
      event.preventDefault();
      if (this.params?.api && typeof this.params.api.applyPendingFloatingFilters === 'function') {
        this.params.api.applyPendingFloatingFilters();
      } else {
        this.apply();
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
      next = this.rebuildOperatorInput(
        parentModel.type,
        MarginFundingPriceMaintenanceManager.normalizeDateValueForDisplay(parentModel.dateFrom)
      );
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
    const parsedInput = MarginFundingPriceMaintenanceManager.parseInlineFilterExpression(
      value,
      fallbackOperator
    );

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

  destroy() {
    if (this.input && this.onKeyDown) {
      this.input.removeEventListener('keydown', this.onKeyDown);
    }

    const list = this.params?.api?.__manualFloatingFilters;
    if (Array.isArray(list)) {
      const index = list.indexOf(this);
      if (index >= 0) list.splice(index, 1);
    }
  }
}

const MarginFundingPriceMaintenanceManager = {
  gridApi: null,
  gridElement: null,
  rowData: [],
  initialRowData: [],
  pendingDisableUniqueKeys: [],
  pendingTerminationUpdateUniqueKeys: [],

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

    window.PageToast.show({
      container,
      type: normalizedType,
      title,
      subtitle: String(message || '').trim(),
      duration: normalizedType === 'error' ? 3200 : 2400
    });
  },

  ensureToastContainer() {
    let container = document.getElementById('marginFundingPriceMaintenancePageToastLayer');
    if (container) return container;

    container = document.createElement('div');
    container.id = 'marginFundingPriceMaintenancePageToastLayer';
    container.className = 'app-page-toast-layer';
    document.body.appendChild(container);
    return container;
  },

  parseInlineFilterExpression(rawValue, defaultType = 'contains') {
    const raw = String(rawValue ?? '').trim();
    if (!raw) return { value: '', type: defaultType };

    const operators = ['!=', '<>', '>=', '<=', '>', '<', '='];
    const token = operators.find((operator) => raw.startsWith(operator));
    if (!token) {
      return { value: raw, type: defaultType };
    }

    const value = raw.slice(token.length).trim();
    let type = defaultType;

    if (token === '=') type = 'equals';
    else if (token === '>') type = 'greaterThan';
    else if (token === '>=') type = 'greaterThanOrEqual';
    else if (token === '<') type = 'lessThan';
    else if (token === '<=') type = 'lessThanOrEqual';
    else if (token === '!=' || token === '<>') type = 'notEqual';

    return { value, type };
  },

  formatDateFromTimestamp(timestamp) {
    if (!timestamp) return '';

    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) return '';

    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${month}/${day}/${year}`;
  },

  formatTimeFromTimestamp(timestamp) {
    if (!timestamp) return '';

    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) return '';

    return parsed.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  },

  formatUpdatedAt(timestamp) {
    const formattedDate = this.formatDateFromTimestamp(timestamp);
    const formattedTime = this.formatTimeFromTimestamp(timestamp);
    if (!formattedDate) return '';
    if (!formattedTime) return formattedDate;
    return `${formattedDate} ${formattedTime}`;
  },

  formatDateAsYmd(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  },

  formatDateAsMmDdYyyy(date) {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  },

  parseMmDdYyyyDate(value) {
    const match = String(value || '').trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;

    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }
    return date;
  },

  normalizeDateValueForDisplay(value) {
    const raw = String(value == null ? '' : value).trim();
    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/);
    if (!isoMatch) return raw;
    return `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1]}`;
  },

  getTodayDateOnly() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  },

  getFieldFilterKind(field) {
    if (['uniqueKeyId', 'vendorProgram', 'vendorFamilyNumber', 'percent'].includes(field)) {
      return 'number';
    }
    if (['effectiveDate', 'terminationDate', 'disableDate', 'updatedAtDisplay'].includes(field)) {
      return 'date';
    }
    return 'text';
  },

  buildAlignedColumn(column) {
    const field = String(column?.field || column?.colId || '').trim();
    if (!field || field === 'select') return column;

    const kind = this.getFieldFilterKind(field);
    return {
      ...column,
      cellClass: kind === 'text' ? 'cell-align-left' : 'cell-align-right'
    };
  },

  getNumericFilterValue(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return null;

    const normalized = raw.replace(/[%,$\s]/g, '').replace(/,/g, '');
    const numeric = Number(normalized);
    return Number.isNaN(numeric) ? null : numeric;
  },

  dateFilterComparator(filterLocalDateAtMidnight, cellValue) {
    const raw = String(cellValue || '').trim();
    const usDateMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!usDateMatch) return 0;

    const cellDate = new Date(
      Number(usDateMatch[3]),
      Number(usDateMatch[1]) - 1,
      Number(usDateMatch[2])
    );
    const cellTime = cellDate.setHours(0, 0, 0, 0);
    const filterTime = filterLocalDateAtMidnight.setHours(0, 0, 0, 0);
    if (cellTime === filterTime) return 0;
    return cellTime < filterTime ? -1 : 1;
  },

  buildFilterableColumn(column) {
    const field = String(column?.field || column?.colId || '').trim();
    if (!field || field === 'select') return column;

    const aligned = this.buildAlignedColumn(column);
    const kind = this.getFieldFilterKind(field);

    if (kind === 'date') {
      return {
        ...aligned,
        filter: 'agDateColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'manualApplyFloatingFilter',
        filterParams: {
          buttons: ['apply', 'reset'],
          closeOnApply: true,
          maxNumConditions: 1,
          numAlwaysVisibleConditions: 1,
          comparator: this.dateFilterComparator,
          filterOptions: [
            'equals',
            'notEqual',
            'greaterThan',
            'lessThan',
            'greaterThanOrEqual',
            'lessThanOrEqual'
          ]
        }
      };
    }

    if (kind === 'number') {
      return {
        ...aligned,
        filter: 'agNumberColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'manualApplyFloatingFilter',
        filterValueGetter: (params) => this.getNumericFilterValue(params?.data?.[field]),
        filterParams: {
          buttons: ['apply', 'reset'],
          closeOnApply: true,
          maxNumConditions: 1,
          numAlwaysVisibleConditions: 1,
          filterOptions: [
            'equals',
            'notEqual',
            'greaterThan',
            'lessThan',
            'greaterThanOrEqual',
            'lessThanOrEqual'
          ]
        }
      };
    }

    return {
      ...aligned,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'manualApplyFloatingFilter',
      filterParams: {
        buttons: ['apply', 'reset'],
        closeOnApply: true,
        maxNumConditions: 1,
        numAlwaysVisibleConditions: 1,
        filterOptions: ['contains', 'equals', 'notEqual', 'notContains', 'startsWith', 'endsWith']
      }
    };
  },

  buildInitialRowData() {
    const currentUser = document.getElementById('currentUserId')?.value || 'defaultUser';
    const formulaCodes = ['AWP', 'WAC', 'NAC', 'GPO', 'BASIS', 'CONTRACT'];
    const familyNames = [
      'Cardinal Health',
      'Baxter',
      'B. Braun',
      'Medline',
      'Owens & Minor',
      'ICU Medical'
    ];

    return Array.from({ length: 180 }, (_, index) => {
      const rowNumber = index + 1;
      const baseDate = new Date(2026, index % 12, (index % 27) + 1);
      const updatedAt = new Date(2026, (index + 2) % 12, ((index + 5) % 27) + 1, 8 + (index % 10), 12, 15);
      const disabled = rowNumber % 19 === 0;

      return {
        uniqueKeyId: 4000 + rowNumber,
        vendorProgram: (rowNumber % 6) + 1,
        vendorFamilyNumber: 700000 + ((rowNumber % 24) + 1),
        vendorFamilyName: familyNames[index % familyNames.length],
        priceFormula: formulaCodes[index % formulaCodes.length],
        priceFormulaDescription: `${formulaCodes[index % formulaCodes.length]} price formula ${rowNumber}`,
        percent: (2 + ((index * 7) % 18)) / 2,
        effectiveDate: this.formatDateAsMmDdYyyy(baseDate),
        terminationDate: this.formatDateAsMmDdYyyy(new Date(baseDate.getFullYear() + 2, 11, 31)),
        updatedAtDisplay: this.formatDateAsMmDdYyyy(updatedAt) + ' ' + this.formatTimeFromTimestamp(updatedAt),
        disableDate: disabled ? this.formatDateAsMmDdYyyy(new Date(2026, 3, (rowNumber % 28) + 1)) : '',
        notes: disabled ? `Disabled during QA seed load ${rowNumber}` : `Price maintenance note ${rowNumber}`,
        userId: disabled ? `USER${String((rowNumber % 20) + 1).padStart(3, '0')}` : currentUser
      };
    });
  },

  cloneRows(rows) {
    return rows.map((row) => ({ ...row }));
  },

  applyRowData() {
    if (!this.gridApi) return;

    const rows = this.cloneRows(this.rowData);
    if (typeof this.gridApi.setGridOption === 'function') {
      this.gridApi.setGridOption('rowData', rows);
    } else if (typeof this.gridApi.setRowData === 'function') {
      this.gridApi.setRowData(rows);
    }

    if (typeof this.gridApi.onFilterChanged === 'function') {
      this.gridApi.onFilterChanged();
    }
    if (typeof this.gridApi.refreshCells === 'function') {
      this.gridApi.refreshCells({ force: true });
    }
    if (typeof this.gridApi.deselectAll === 'function') {
      this.gridApi.deselectAll();
    }
  },

  resetGridState() {
    if (!this.gridApi) return;

    if (typeof this.gridApi.setFilterModel === 'function') {
      this.gridApi.setFilterModel(null);
    }
    if (typeof this.gridApi.setSortModel === 'function') {
      this.gridApi.setSortModel(null);
    }
    if (typeof this.gridApi.paginationGoToFirstPage === 'function') {
      this.gridApi.paginationGoToFirstPage();
    }
    if (typeof this.gridApi.deselectAll === 'function') {
      this.gridApi.deselectAll();
    }

    this.rowData = this.cloneRows(this.initialRowData);
    this.applyRowData();
  },

  handleDownloadAction() {
    if (!this.gridApi || typeof this.gridApi.exportDataAsCsv !== 'function') {
      this.showInfo('Download is not available.', 'error');
      return;
    }

    this.gridApi.exportDataAsCsv({
      fileName: 'margin-funding-price-maintenance.csv'
    });
  },

  getSelectedRows() {
    if (!this.gridApi || typeof this.gridApi.getSelectedRows !== 'function') return [];
    return this.gridApi.getSelectedRows().filter(Boolean);
  },

  getSelectedUniqueKeys() {
    return this.getSelectedRows()
      .map((row) => row?.uniqueKeyId)
      .filter((value) => value !== null && value !== undefined && value !== '');
  },

  hasDisabledRowsSelected() {
    return this.getSelectedRows().some((row) => String(row.disableDate || '').trim() !== '');
  },

  cacheDisableModalElements() {
    if (this.disableModal) return;
    this.disableModal = document.getElementById('disableRecordModal');
    this.disableDialog = this.disableModal?.querySelector('.mf-action-modal__dialog');
    this.disableNotesInput = document.getElementById('disableRecordNotesInput');
    this.disableErrorMessage = document.getElementById('disableRecordErrorMessage');
    this.disableSaveBtn = this.disableModal?.querySelector('[data-action="save-disable-modal"]');
    this.disableCancelBtn = this.disableModal?.querySelector('[data-action="cancel-disable-modal"]');
    this.disableCloseEls = this.disableModal
      ? Array.from(this.disableModal.querySelectorAll('[data-action="close-disable-modal"]'))
      : [];
  },

  showDisableInlineError() {
    if (this.disableErrorMessage) this.disableErrorMessage.hidden = false;
    this.disableDialog?.classList.add('has-inline-error');
  },

  clearDisableInlineError() {
    if (this.disableErrorMessage) this.disableErrorMessage.hidden = true;
    this.disableDialog?.classList.remove('has-inline-error');
  },

  openDisableModal(uniqueKeys) {
    this.cacheDisableModalElements();
    if (!this.disableModal) return;

    this.pendingDisableUniqueKeys = uniqueKeys;
    if (this.disableNotesInput) {
      this.disableNotesInput.value = '';
      this.disableNotesInput.focus();
    }
    this.clearDisableInlineError();
    this.disableModal.hidden = false;
  },

  closeDisableModal() {
    this.cacheDisableModalElements();
    if (!this.disableModal) return;

    this.disableModal.hidden = true;
    this.pendingDisableUniqueKeys = [];
    if (this.disableNotesInput) this.disableNotesInput.value = '';
    this.clearDisableInlineError();
  },

  cacheUpdateTerminationModalElements() {
    if (this.updateTerminationModal) return;
    this.updateTerminationModal = document.getElementById('updateTerminationDateModal');
    this.updateTerminationDialog = this.updateTerminationModal?.querySelector('.mf-action-modal__dialog');
    this.updateTerminationDateInput = document.getElementById('updateTerminationDateInput');
    this.updateTerminationDateNativeInput = document.getElementById('updateTerminationDateNativeInput');
    this.updateTerminationNotesInput = document.getElementById('updateTerminationNotesInput');
    this.updateTerminationErrorMessage = document.getElementById('updateTerminationErrorMessage');
    this.updateTerminationSaveBtn =
      this.updateTerminationModal?.querySelector('[data-action="save-update-termination-modal"]');
    this.updateTerminationCancelBtn =
      this.updateTerminationModal?.querySelector('[data-action="cancel-update-termination-modal"]');
    this.updateTerminationCloseEls = this.updateTerminationModal
      ? Array.from(this.updateTerminationModal.querySelectorAll('[data-action="close-update-termination-modal"]'))
      : [];
    this.updateTerminationDatePickerBtn =
      this.updateTerminationModal?.querySelector('[data-action="open-termination-date-picker"]');
  },

  showUpdateTerminationInlineError(message) {
    if (this.updateTerminationErrorMessage) {
      this.updateTerminationErrorMessage.textContent = message;
      this.updateTerminationErrorMessage.hidden = false;
    }
    this.updateTerminationDialog?.classList.add('has-inline-error');
  },

  clearUpdateTerminationInlineError() {
    if (this.updateTerminationErrorMessage) {
      this.updateTerminationErrorMessage.hidden = true;
      this.updateTerminationErrorMessage.textContent = '';
    }
    this.updateTerminationDialog?.classList.remove('has-inline-error');
  },

  openUpdateTerminationModal(uniqueKeys) {
    this.cacheUpdateTerminationModalElements();
    if (!this.updateTerminationModal) return;

    this.pendingTerminationUpdateUniqueKeys = uniqueKeys;
    const today = this.getTodayDateOnly();
    const ymd = this.formatDateAsYmd(today);
    if (this.updateTerminationDateNativeInput) {
      this.updateTerminationDateNativeInput.min = ymd;
      this.updateTerminationDateNativeInput.value = '';
    }
    if (this.updateTerminationDateInput) this.updateTerminationDateInput.value = '';
    if (this.updateTerminationNotesInput) this.updateTerminationNotesInput.value = '';
    this.clearUpdateTerminationInlineError();
    this.updateTerminationModal.hidden = false;
    this.updateTerminationDateInput?.focus();
  },

  closeUpdateTerminationModal() {
    this.cacheUpdateTerminationModalElements();
    if (!this.updateTerminationModal) return;

    this.updateTerminationModal.hidden = true;
    this.pendingTerminationUpdateUniqueKeys = [];
    if (this.updateTerminationDateInput) this.updateTerminationDateInput.value = '';
    if (this.updateTerminationDateNativeInput) this.updateTerminationDateNativeInput.value = '';
    if (this.updateTerminationNotesInput) this.updateTerminationNotesInput.value = '';
    this.clearUpdateTerminationInlineError();
  },

  openTerminationDatePicker() {
    this.cacheUpdateTerminationModalElements();
    if (!this.updateTerminationDateNativeInput) return;

    const picker = this.updateTerminationDateNativeInput;
    if (typeof picker.showPicker === 'function') {
      picker.showPicker();
    } else {
      picker.click();
    }
  },

  syncTerminationDateFromNativePicker() {
    const value = this.updateTerminationDateNativeInput?.value;
    if (!value) return;

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, (month || 1) - 1, day || 1);
    if (this.updateTerminationDateInput) {
      this.updateTerminationDateInput.value = this.formatDateAsMmDdYyyy(date);
    }
  },

  handleDisableSave() {
    const uniqueKeys = this.pendingDisableUniqueKeys || [];
    if (!uniqueKeys.length) {
      this.closeDisableModal();
      return;
    }

    const notes = (this.disableNotesInput?.value ?? '').trim();
    if (!notes) {
      this.showDisableInlineError();
      this.disableNotesInput?.focus();
      return;
    }

    const disableDate = this.formatDateAsMmDdYyyy(this.getTodayDateOnly());
    this.rowData = this.rowData.map((row) => (
      uniqueKeys.includes(row.uniqueKeyId)
        ? { ...row, disableDate, notes }
        : row
    ));
    this.applyRowData();
    this.closeDisableModal();
    this.showInfo('Selected rows disabled successfully.', 'success');
  },

  handleUpdateTerminationDateSave() {
    const uniqueKeys = this.pendingTerminationUpdateUniqueKeys || [];
    if (!uniqueKeys.length) {
      this.closeUpdateTerminationModal();
      return;
    }

    const dateText = (this.updateTerminationDateInput?.value ?? '').trim();
    const notes = (this.updateTerminationNotesInput?.value ?? '').trim();

    if (!dateText) {
      this.showUpdateTerminationInlineError('Termination Date is required.');
      this.updateTerminationDateInput?.focus();
      return;
    }
    if (!notes) {
      this.showUpdateTerminationInlineError('A note is required to update termination date.');
      this.updateTerminationNotesInput?.focus();
      return;
    }

    const parsedDate = this.parseMmDdYyyyDate(dateText);
    if (!parsedDate) {
      this.showUpdateTerminationInlineError('Termination Date must be in MM/DD/YYYY format.');
      this.updateTerminationDateInput?.focus();
      return;
    }

    if (parsedDate < this.getTodayDateOnly()) {
      this.showUpdateTerminationInlineError('Termination Date must be today or a future date.');
      this.updateTerminationDateInput?.focus();
      return;
    }

    this.rowData = this.rowData.map((row) => (
      uniqueKeys.includes(row.uniqueKeyId)
        ? { ...row, terminationDate: this.formatDateAsMmDdYyyy(parsedDate), notes }
        : row
    ));
    this.applyRowData();
    this.closeUpdateTerminationModal();
    this.showInfo('Termination date updated successfully.', 'success');
  },

  handleDisableAction() {
    const uniqueKeys = this.getSelectedUniqueKeys();
    if (!uniqueKeys.length) {
      this.showInfo('Select at least one row to disable.', 'error');
      return;
    }
    if (this.hasDisabledRowsSelected()) {
      this.showInfo('Disabled rows cannot be edited. Remove already-disabled rows from selection.', 'error');
      return;
    }
    this.openDisableModal(uniqueKeys);
  },

  handleUpdateTerminationDateAction() {
    const uniqueKeys = this.getSelectedUniqueKeys();
    if (!uniqueKeys.length) {
      this.showInfo('Select at least one row to update termination date.', 'error');
      return;
    }
    if (this.hasDisabledRowsSelected()) {
      this.showInfo('Disabled rows cannot be edited. Remove already-disabled rows from selection.', 'error');
      return;
    }
    this.openUpdateTerminationModal(uniqueKeys);
  },

  initViewActions() {
    const backBtn = document.querySelector('.gt-action-btn[data-action="back"]');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.location.assign('/');
      });
    }

    const addBtn = document.querySelector('.gt-action-btn[data-action="add"]');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        window.location.assign(window.MFP_ADD_PAGE_URL || '/margin-funding-price-maintenance/add');
      });
    }

    const favoriteBtn = document.querySelector('.gt-action-btn[data-action="favorite"]');
    if (favoriteBtn) {
      favoriteBtn.addEventListener('click', () => {
        this.showInfo('Favorite action is not configured yet.', 'warning');
      });
    }

    if (window.GridToolbar && this.gridApi && this.gridElement) {
      window.GridToolbar.bindDensityControls({
        gridApi: this.gridApi,
        gridElement: this.gridElement,
        defaultMode: 'compact',
        densityClassPrefix: 'mfi-density'
      });
    }

    const executeBtn = document.querySelector('.gt-action-btn[data-action="execute"]');
    if (executeBtn) {
      executeBtn.addEventListener('click', () => {
        if (this.gridApi && typeof this.gridApi.applyPendingFloatingFilters === 'function') {
          this.gridApi.applyPendingFloatingFilters();
        }
      });
    }

    const refreshBtn = document.querySelector('.gt-action-btn[data-action="refresh"]');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.resetGridState());
    }

    const downloadBtn = document.querySelector('.gt-view-btn[data-action="download"]');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.handleDownloadAction());
    }

    const disableBtn = document.querySelector('.gt-action-btn[data-action="disable"]');
    if (disableBtn) {
      disableBtn.addEventListener('click', () => this.handleDisableAction());
    }

    const updateTerminationBtn = document.querySelector('.gt-action-btn[data-action="update-termination-date"]');
    if (updateTerminationBtn) {
      updateTerminationBtn.addEventListener('click', () => this.handleUpdateTerminationDateAction());
    }

    this.cacheDisableModalElements();
    this.disableCancelBtn?.addEventListener('click', () => this.closeDisableModal());
    this.disableCloseEls?.forEach((el) => el.addEventListener('click', () => this.closeDisableModal()));
    this.disableSaveBtn?.addEventListener('click', () => this.handleDisableSave());
    this.disableNotesInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.closeDisableModal();
      if (event.key === 'Enter') this.handleDisableSave();
    });
    this.disableNotesInput?.addEventListener('input', () => {
      if (this.disableNotesInput?.value.trim()) this.clearDisableInlineError();
    });

    this.cacheUpdateTerminationModalElements();
    this.updateTerminationCancelBtn?.addEventListener('click', () => this.closeUpdateTerminationModal());
    this.updateTerminationCloseEls?.forEach((el) =>
      el.addEventListener('click', () => this.closeUpdateTerminationModal())
    );
    this.updateTerminationDatePickerBtn?.addEventListener('click', () => this.openTerminationDatePicker());
    this.updateTerminationDateNativeInput?.addEventListener('change', () => this.syncTerminationDateFromNativePicker());
    this.updateTerminationSaveBtn?.addEventListener('click', () => this.handleUpdateTerminationDateSave());
    this.updateTerminationDateInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.closeUpdateTerminationModal();
    });
    this.updateTerminationDateInput?.addEventListener('input', () => {
      if (this.updateTerminationDateInput?.value.trim()) this.clearUpdateTerminationInlineError();
    });
    this.updateTerminationNotesInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.closeUpdateTerminationModal();
      if (event.key === 'Enter') this.handleUpdateTerminationDateSave();
    });
    this.updateTerminationNotesInput?.addEventListener('input', () => {
      if (this.updateTerminationNotesInput?.value.trim()) this.clearUpdateTerminationInlineError();
    });
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

  init() {
    this.gridElement = document.getElementById('mfpPriceGrid');
    this.initialRowData = this.buildInitialRowData();
    this.rowData = this.cloneRows(this.initialRowData);

    const compactPreset = window.GridToolbar?.DEFAULT_DENSITY_PRESETS?.compact || {
      rowHeight: 40,
      headerHeight: 48,
      floatingFiltersHeight: 38
    };

    const gridConfig = {
      gridElementId: 'mfpPriceGrid',
      pageSize: 20,
      pageSizeSelector: [10, 20, 50, 100, 200],
      floatingFilter: true,
      manualFilterApply: true,
      paginationType: 'client',
      gridOptions: {
        rowModelType: 'clientSide',
        rowData: this.cloneRows(this.rowData),
        rowHeight: compactPreset.rowHeight,
        headerHeight: compactPreset.headerHeight,
        floatingFiltersHeight: compactPreset.floatingFiltersHeight,
        rowSelection: 'multiple',
        suppressRowClickSelection: true,
        isRowSelectable: (rowNode) => String(rowNode?.data?.disableDate || '').trim() === '',
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
          manualApplyFloatingFilter: MarginFundingPriceManualFloatingFilter
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
          cellClassRules: {
            'is-selection-locked': (params) => String(params?.data?.disableDate || '').trim() !== ''
          },
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
        { field: 'uniqueKeyId', headerName: 'Unique Key ID', minWidth: 150 },
        { field: 'vendorProgram', headerName: 'Vendor Program', minWidth: 160 },
        { field: 'vendorFamilyNumber', headerName: 'Vendor Family Number', minWidth: 170 },
        { field: 'vendorFamilyName', headerName: 'Vendor Family Name', minWidth: 190 },
        { field: 'priceFormula', headerName: 'Price Formula', minWidth: 150 },
        { field: 'priceFormulaDescription', headerName: 'Price Formula Description', minWidth: 220 },
        { field: 'percent', headerName: 'Percent', minWidth: 120 },
        { field: 'effectiveDate', headerName: 'Effective Date', minWidth: 140 },
        { field: 'terminationDate', headerName: 'Termination Date', minWidth: 160 },
        {
          field: 'updatedAtDisplay',
          headerName: 'Updated At',
          minWidth: 220,
          valueFormatter: (params) => params.value || ''
        },
        { field: 'disableDate', headerName: 'Disable Date', minWidth: 140 },
        { field: 'notes', headerName: 'Notes', minWidth: 220 },
        { field: 'userId', headerName: 'User ID', minWidth: 120 }
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
    setTimeout(() => this.applyDefaultDensity(), 150);

    setTimeout(() => {
      if (window.gridApi && typeof GridManager !== 'undefined') {
        GridManager.init(window.gridApi, 'mfpPriceGrid');
      }
    }, 500);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  MarginFundingPriceMaintenanceManager.init();
});
