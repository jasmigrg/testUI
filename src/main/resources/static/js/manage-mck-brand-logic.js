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

const MckFilterUtils = {
  supportedTextFilterOperators: ['!=', '<>', '>=', '<=', '>', '<', '='],

  showFilterValidationMessage(message) {
    if (window.PageToast?.show) {
      let container = document.getElementById('mckBrandLogicPageToastLayer');
      if (!container) {
        container = document.createElement('div');
        container.id = 'mckBrandLogicPageToastLayer';
        container.className = 'app-page-toast-layer';
        document.body.appendChild(container);
      }

      window.PageToast.show({
        container,
        type: 'error',
        title: 'Action required',
        subtitle: String(message || '').trim(),
        icon: '!',
        autoHideMs: 2800
      });
      return;
    }

    console.warn(message);
  },

  parseTextFilterInput(rawValue, fallbackOperator = 'contains') {
    if (typeof rawValue !== 'string') {
      return { value: rawValue, operator: fallbackOperator, isInvalid: false };
    }

    const trimmed = rawValue.trim();
    const lowerValue = trimmed.toLowerCase();

    if (lowerValue === 'blank') {
      return { value: '', operator: 'blank', isInvalid: false };
    }

    if (lowerValue === 'notblank') {
      return { value: '', operator: 'notBlank', isInvalid: false };
    }

    const startsWithOperatorLikeSymbol = /^[!<>=@]/.test(trimmed);
    const matchedOperator = this.supportedTextFilterOperators.find((op) => trimmed.startsWith(op));

    if (!matchedOperator) {
      if (startsWithOperatorLikeSymbol) {
        return {
          value: rawValue,
          operator: fallbackOperator,
          isInvalid: true,
          invalidReason: 'Invalid operator. Use =, !=, <>, >, <, >=, <=, blank, or notblank.'
        };
      }

      return { value: rawValue, operator: fallbackOperator, isInvalid: false };
    }

    const value = trimmed.substring(matchedOperator.length).trim();
    if (/^[!<>=@]/.test(value)) {
      return {
        value: rawValue,
        operator: fallbackOperator,
        isInvalid: true,
        invalidReason: 'Invalid operator format. Use =, !=, <>, >, <, >=, <= followed by a value.'
      };
    }

    let operator = fallbackOperator;
    if (matchedOperator === '!=' || matchedOperator === '<>') operator = 'notEqual';
    else if (matchedOperator === '>') operator = 'greaterThan';
    else if (matchedOperator === '<') operator = 'lessThan';
    else if (matchedOperator === '>=') operator = 'greaterThanOrEqual';
    else if (matchedOperator === '<=') operator = 'lessThanOrEqual';
    else if (matchedOperator === '=') operator = 'equals';

    return { value, operator, isInvalid: false };
  }
};

class MckManualFloatingFilter {
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
      next = this.rebuildOperatorInput(
        parentModel.type,
        this.normalizeDateValueForDisplay(parentModel.dateFrom)
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
    const parsedInput = this.isNumericOrDateFilter()
      ? MckFilterUtils.parseTextFilterInput(value, fallbackOperator)
      : { value, operator: fallbackOperator, isInvalid: false };

    if (parsedInput.isInvalid) {
      MckFilterUtils.showFilterValidationMessage(parsedInput.invalidReason);
      return;
    }

    this.params.parentFilterInstance((instance) => {
      if (!instance) return;
      instance.onFloatingFilterChanged(parsedInput.operator, parsedInput.value || null);
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

const MckBrandLogicPage = {
  activeTab: 'weighting',
  grids: {},
  toolbarScope: '.mck-brand-logic-shell',
  gridManagerBootstrapped: false,
  gridManagerInitScheduled: false,
  apiBaseUrl: '',
  updateScoringWeightingsEndpoint: '/api/v1/scoring-weightings/updateScoringWeightings',
  exportScoringWeightingsEndpoint: '/api/v1/scoring-weightings/export-csv',
  pendingDisableIds: [],
  pendingTerminationUpdateIds: [],
  tabs: {
    weighting: {
      title: 'GM Core MCKB Price Scoring Weighting',
      gridElementId: 'mckWeightingGrid',
      exportName: 'gm-core-mckb-price-scoring-weighting.csv',
      apiEndpoint: '/api/v1/scoring-weightings/paginated',
      paginationType: 'server',
      columns: [
        { field: 'uniqueId', headerName: 'Unique ID', minWidth: 140 },
        { field: 'effectiveDate', headerName: 'Effective Date', minWidth: 150 },
        { field: 'terminationDate', headerName: 'Termination Date', minWidth: 170 },
        { field: 'itemCategory', headerName: 'Item Category', minWidth: 170 },
        { field: 'itemNum', headerName: 'Item NUM', minWidth: 150 },
        { field: 'relativeProfitabilityWeighting', headerName: 'Relative Profitability Weighting', minWidth: 250 },
        { field: 'relativeShareWeighting', headerName: 'Relative  Share Weighting', minWidth: 220 },
        { field: 'relativeQualityWeighting', headerName: 'Relative Quality Weighting', minWidth: 220 },
        { field: 'disableDate', headerName: 'Disable Date', minWidth: 150 },
        { field: 'notes', headerName: 'Notes', minWidth: 220 },
        { field: 'status', headerName: 'Status', minWidth: 140 }
      ]
    },
    'quality-tier': {
      title: 'GM Core Paramter MCKB Quality Tiers',
      gridElementId: 'mckQualityTierGrid',
      exportName: 'gm-core-paramter-mckb-quality-tiers.csv',
      columns: [
        { field: 'effectiveDate', headerName: 'Effective Date', minWidth: 150 },
        { field: 'terminationDate', headerName: 'Termination Date', minWidth: 170 },
        { field: 'itemCategory', headerName: 'Item Category', minWidth: 170 },
        { field: 'itemNum', headerName: 'Item NUM', minWidth: 150 },
        { field: 'qualityScore', headerName: 'Quality Score', minWidth: 170 },
        { field: 'qualityTier', headerName: 'Quality Tier', minWidth: 170 }
      ]
    },
    'relative-delta': {
      title: 'GM Core Paramter MCKB Relative Price Delta',
      gridElementId: 'mckRelativeDeltaGrid',
      exportName: 'gm-core-paramter-mckb-relative-price-delta.csv',
      columns: [
        { field: 'effectiveDate', headerName: 'Effective Date', minWidth: 150 },
        { field: 'terminationDate', headerName: 'Termination Date', minWidth: 170 },
        { field: 'itemCategory', headerName: 'Item Category', minWidth: 170 },
        { field: 'relativeAllowableMinPrice', headerName: 'Relative Allowable Min Price', minWidth: 230 },
        { field: 'relativeAllowableMaxPrice', headerName: 'Relative Allowable Max Price', minWidth: 230 }
      ]
    },
    'price-cap': {
      title: 'GM Core Parameter MCKB Price Change CAP',
      gridElementId: 'mckPriceCapGrid',
      exportName: 'gm-core-parameter-mckb-price-change-cap.csv',
      columns: [
        { field: 'effectiveDate', headerName: 'Effective Date', minWidth: 150 },
        { field: 'terminationDate', headerName: 'Termination Date', minWidth: 170 },
        { field: 'itemCategory', headerName: 'Item Category', minWidth: 170 },
        { field: 'mckBrandPriceChangeCap', headerName: 'MCK Brand Price Change Cap', minWidth: 230 }
      ]
    },
    'brand-multiplier': {
      title: 'GM Core Output Brand Multiplier',
      gridElementId: 'mckBrandMultiplierGrid',
      exportName: 'gm-core-output-brand-multiplier.csv',
      columns: [
        { field: 'uniqueId', headerName: 'Unique ID', minWidth: 140 },
        { field: 'mainLevel', headerName: 'Main Level', minWidth: 160 },
        { field: 'nbMainLevel', headerName: 'NB Main Level', minWidth: 170 },
        { field: 'effectiveDate', headerName: 'Effective Date', minWidth: 150 },
        { field: 'terminationDate', headerName: 'Termination Date', minWidth: 170 },
        { field: 'customerLevel', headerName: 'Customer Level', minWidth: 180 },
        { field: 'customerAttribute', headerName: 'Customer Attribute', minWidth: 190 }
      ]
    }
  },

  init() {
    this.apiBaseUrl = (window.API_BASE_URL || '').replace(/\/$/, '');
    this.cacheDom();
    this.bindTabs();
    this.bindToolbarActions();
    Object.keys(this.tabs).forEach((tabKey) => this.initGridForTab(tabKey));
    this.syncTabUi();
    this.syncTitle();
    this.syncGridManager();
    this.applyActiveDensity();
  },

  cacheDom() {
    this.pageShell = document.querySelector('.mck-brand-logic-shell');
    this.contentCard = document.querySelector('.mck-brand-logic-page .content-card');
    this.tabButtons = Array.from(document.querySelectorAll('.screen-tab-btn[data-mck-tab]'));
    this.tabPanels = Array.from(document.querySelectorAll('.screen-tab-panel[data-mck-panel]'));
    this.activeTabTitle = document.getElementById('mckActiveTabTitle');
    this.emptyStates = {
      weighting: document.getElementById('mckWeightingEmptyState')
    };
  },

  getSelectedRows() {
    const activeGrid = this.getActiveGrid();
    if (!activeGrid?.api || typeof activeGrid.api.getSelectedRows !== 'function') return [];
    return activeGrid.api.getSelectedRows().filter(Boolean);
  },

  getSelectedIds() {
    return this.getSelectedRows()
      .map((row) => row?.uniqueId)
      .filter((value) => value != null && String(value).trim() !== '');
  },

  isActionLockedRow(row) {
    return String(row?.disableDate || '').trim() !== '' || String(row?.terminationDate || '').trim() !== '';
  },

  hasLockedRowsSelected() {
    return this.getSelectedRows().some((row) => this.isActionLockedRow(row));
  },

  refreshActiveGridData() {
    const activeGrid = this.getActiveGrid();
    if (!activeGrid?.api) return;
    if (typeof activeGrid.api.refreshInfiniteCache === 'function') {
      activeGrid.api.refreshInfiniteCache();
    } else if (typeof activeGrid.api.refreshServerSideStore === 'function') {
      activeGrid.api.refreshServerSideStore({ purge: true });
    } else if (activeGrid.datasource && typeof activeGrid.api.setGridOption === 'function') {
      activeGrid.api.setGridOption('datasource', activeGrid.datasource);
    }
    if (typeof activeGrid.api.deselectAll === 'function') {
      activeGrid.api.deselectAll();
    }
  },

  async patchGridAction(payload) {
    const response = await fetch(this.resolveApiUrl(this.updateScoringWeightingsEndpoint), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });

    const responseBody = await this.readJsonSafely(response);
    if (!response.ok) {
      throw new Error(this.extractErrorMessage(responseBody) || `Request failed: ${response.status}`);
    }
    return responseBody;
  },

  async readJsonSafely(response) {
    try {
      return await response.json();
    } catch (error) {
      return null;
    }
  },

  extractErrorMessage(payload) {
    if (!payload || typeof payload !== 'object') return '';
    const message = payload.message;
    return typeof message === 'string' ? message.trim() : '';
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

  openDisableModal(ids) {
    this.cacheDisableModalElements();
    if (!this.disableModal) return;
    this.pendingDisableIds = ids;
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
    this.pendingDisableIds = [];
    if (this.disableNotesInput) this.disableNotesInput.value = '';
    this.clearDisableInlineError();
  },

  cacheUpdateTerminationModalElements() {
    if (this.updateTerminationModal) return;
    this.updateTerminationModal = document.getElementById('updateTerminationDateModal');
    this.updateTerminationDialog = this.updateTerminationModal?.querySelector('.mf-action-modal__dialog');
    this.updateTerminationDateInput = document.getElementById('updateTerminationDateInput');
    this.updateTerminationDateNativeInput = document.getElementById('updateTerminationDateNativeInput');
    this.updateTerminationDatePickerBtn =
      this.updateTerminationModal?.querySelector('[data-action="open-termination-date-picker"]');
    this.updateTerminationNotesInput = document.getElementById('updateTerminationNotesInput');
    this.updateTerminationErrorMessage = document.getElementById('updateTerminationErrorMessage');
    this.updateTerminationSaveBtn =
      this.updateTerminationModal?.querySelector('[data-action="save-update-termination-modal"]');
    this.updateTerminationCancelBtn =
      this.updateTerminationModal?.querySelector('[data-action="cancel-update-termination-modal"]');
    this.updateTerminationCloseEls = this.updateTerminationModal
      ? Array.from(this.updateTerminationModal.querySelectorAll('[data-action="close-update-termination-modal"]'))
      : [];
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
      this.updateTerminationErrorMessage.textContent = '';
      this.updateTerminationErrorMessage.hidden = true;
    }
    this.updateTerminationDialog?.classList.remove('has-inline-error');
  },

  openUpdateTerminationModal(ids) {
    this.cacheUpdateTerminationModalElements();
    if (!this.updateTerminationModal) return;
    this.pendingTerminationUpdateIds = ids;
    if (this.updateTerminationDateInput) this.updateTerminationDateInput.value = '';
    if (this.updateTerminationDateNativeInput) this.updateTerminationDateNativeInput.value = '';
    if (this.updateTerminationNotesInput) this.updateTerminationNotesInput.value = '';
    this.clearUpdateTerminationInlineError();
    this.updateTerminationModal.hidden = false;
    this.updateTerminationDateInput?.focus();
  },

  closeUpdateTerminationModal() {
    this.cacheUpdateTerminationModalElements();
    if (!this.updateTerminationModal) return;
    this.updateTerminationModal.hidden = true;
    this.pendingTerminationUpdateIds = [];
    if (this.updateTerminationDateInput) this.updateTerminationDateInput.value = '';
    if (this.updateTerminationDateNativeInput) this.updateTerminationDateNativeInput.value = '';
    if (this.updateTerminationNotesInput) this.updateTerminationNotesInput.value = '';
    this.clearUpdateTerminationInlineError();
  },

  getTodayDateOnly() {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  },

  parseMmDdYyyyDate(value) {
    const match = String(value || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return null;
    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (
      Number.isNaN(date.getTime())
      || date.getFullYear() !== year
      || date.getMonth() !== month - 1
      || date.getDate() !== day
    ) {
      return null;
    }
    return date;
  },

  formatDateAsMmDdYyyy(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  },

  openTerminationDatePicker() {
    this.cacheUpdateTerminationModalElements();
    if (!this.updateTerminationDateNativeInput) return;
    const currentValue = this.updateTerminationDateInput?.value.trim();
    const parsedDate = currentValue ? this.parseMmDdYyyyDate(currentValue) : null;
    if (parsedDate) {
      this.updateTerminationDateNativeInput.value = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}`;
    }
    if (typeof this.updateTerminationDateNativeInput.showPicker === 'function') {
      this.updateTerminationDateNativeInput.showPicker();
    } else {
      this.updateTerminationDateNativeInput.click();
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

  async handleDisableSave() {
    const ids = this.pendingDisableIds || [];
    if (!ids.length) {
      this.closeDisableModal();
      return;
    }
    const notes = (this.disableNotesInput?.value ?? '').trim();
    if (!notes) {
      this.showDisableInlineError();
      this.disableNotesInput?.focus();
      return;
    }
    this.clearDisableInlineError();
    try {
      if (this.disableSaveBtn) this.disableSaveBtn.disabled = true;
      await this.patchGridAction({
        ids,
        disableDate: this.formatDateAsMmDdYyyy(this.getTodayDateOnly()),
        notes
      });
      this.closeDisableModal();
      this.refreshActiveGridData();
      this.showInfo('Selected rows disabled successfully.', 'success');
    } catch (error) {
      console.error('Disable action failed:', error);
      this.showInfo(error?.message || 'Failed to disable selected rows.', 'error');
    } finally {
      if (this.disableSaveBtn) this.disableSaveBtn.disabled = false;
    }
  },

  async handleUpdateTerminationDateSave() {
    const ids = this.pendingTerminationUpdateIds || [];
    if (!ids.length) {
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
    this.clearUpdateTerminationInlineError();
    try {
      if (this.updateTerminationSaveBtn) this.updateTerminationSaveBtn.disabled = true;
      await this.patchGridAction({
        ids,
        terminationDate: this.formatDateAsMmDdYyyy(parsedDate),
        notes
      });
      this.closeUpdateTerminationModal();
      this.refreshActiveGridData();
      this.showInfo('Termination date updated successfully.', 'success');
    } catch (error) {
      console.error('Update termination date failed:', error);
      this.showInfo(error?.message || 'Failed to update termination date.', 'error');
    } finally {
      if (this.updateTerminationSaveBtn) this.updateTerminationSaveBtn.disabled = false;
    }
  },

  handleDisableAction() {
    if (this.activeTab !== 'weighting') {
      this.showInfo('Disable is not configured for this tab yet.', 'warning');
      return;
    }
    const ids = this.getSelectedIds();
    if (!ids.length) {
      this.showInfo('Select at least one row to disable.', 'error');
      return;
    }
    if (this.hasLockedRowsSelected()) {
      this.showInfo('Disabled or terminated rows cannot be edited. Remove them from selection.', 'error');
      return;
    }
    this.openDisableModal(ids);
  },

  handleUpdateTerminationDateAction() {
    if (this.activeTab !== 'weighting') {
      this.showInfo('Update Termination Date is not configured for this tab yet.', 'warning');
      return;
    }
    const ids = this.getSelectedIds();
    if (!ids.length) {
      this.showInfo('Select at least one row to update termination date.', 'error');
      return;
    }
    if (this.hasLockedRowsSelected()) {
      this.showInfo('Disabled or terminated rows cannot be edited. Remove them from selection.', 'error');
      return;
    }
    this.openUpdateTerminationModal(ids);
  },

  bindTabs() {
    this.tabButtons.forEach((button) => {
      button.addEventListener('click', () => this.activateTab(button.getAttribute('data-mck-tab')));
    });
  },

  bindToolbarActions() {
    const scope = this.pageShell;
    if (!scope) return;

    scope.querySelectorAll('.gt-action-btn[data-action="back"]').forEach((button) => {
      button.addEventListener('click', () => {
        this.showInfo('Main navigation for this screen is still being worked on.', 'warning');
      });
    });

    scope.querySelectorAll('.gt-action-btn[data-action="add"]').forEach((button) => {
      button.addEventListener('click', () => {
        this.showInfo('Add flow for this screen is not configured yet.', 'warning');
      });
    });

    scope.querySelectorAll('.gt-action-btn[data-action="favorite"]').forEach((button) => {
      button.addEventListener('click', () => {
        this.showInfo('Favorite action is not configured yet.', 'warning');
      });
    });

    scope.querySelectorAll('.gt-action-btn[data-action="disable"]').forEach((button) => {
      button.addEventListener('click', () => this.handleDisableAction());
    });

    scope.querySelectorAll('.gt-action-btn[data-action="update-termination-date"]').forEach((button) => {
      button.addEventListener('click', () => this.handleUpdateTerminationDateAction());
    });

    scope.querySelectorAll('.gt-action-btn[data-action="refresh"]').forEach((button) => {
      button.addEventListener('click', () => {
        this.resetActiveGridState();
      });
    });

    scope.querySelectorAll('.gt-action-btn[data-action="execute"]').forEach((button) => {
      button.addEventListener('click', () => {
        this.applyPendingFilters();
      });
    });

    scope.querySelectorAll('.gt-view-btn[data-density]').forEach((button) => {
      button.addEventListener('click', () => {
        this.applyDensity(button.dataset.density);
      });
    });

    const downloadBtn = scope.querySelector('.gt-view-btn[data-action="download"]');
    downloadBtn?.addEventListener('click', () => {
      this.handleDownloadAction();
    });

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
      icon: normalizedType === 'error' ? '!' : normalizedType === 'warning' ? 'i' : '✓',
      autoHideMs: 2400
    });
  },

  ensureToastContainer() {
    let container = document.getElementById('mckBrandLogicPageToastLayer');
    if (container) return container;

    container = document.createElement('div');
    container.id = 'mckBrandLogicPageToastLayer';
    container.className = 'app-page-toast-layer';
    document.body.appendChild(container);
    return container;
  },

  activateTab(tabKey) {
    if (!tabKey || tabKey === this.activeTab || !this.tabs[tabKey]) return;

    this.activeTab = tabKey;
    this.syncTabUi();
    this.syncTitle();
    this.initGridForTab(tabKey);
    this.syncGridManager();
    this.applyActiveDensity();
    this.refreshActiveGridLayout();
  },

  syncTabUi() {
    this.tabButtons.forEach((button) => {
      const isActive = button.getAttribute('data-mck-tab') === this.activeTab;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', String(isActive));
      button.tabIndex = isActive ? 0 : -1;
    });

    this.tabPanels.forEach((panel) => {
      const isActive = panel.getAttribute('data-mck-panel') === this.activeTab;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
      panel.style.display = isActive ? 'flex' : 'none';
    });
  },

  syncTitle() {
    if (!this.activeTabTitle) return;
    this.activeTabTitle.textContent = this.tabs[this.activeTab]?.title || '';
  },

  getActiveGrid() {
    return this.grids[this.activeTab] || null;
  },

  getSelectedDensityMode() {
    const activeBtn = document.querySelector(`${this.toolbarScope} .gt-view-btn[data-density].is-active`);
    return activeBtn?.dataset?.density || 'compact';
  },

  applyDensity(mode) {
    const activeGrid = this.getActiveGrid();
    if (!(window.GridToolbar && activeGrid?.api && activeGrid?.element)) return;

    window.GridToolbar.setDensity(
      {
        gridApi: activeGrid.api,
        gridElement: activeGrid.element,
        densityClassPrefix: 'screen-density',
        densityButtonSelector: `${this.toolbarScope} .gt-view-btn[data-density]`
      },
      mode || this.getSelectedDensityMode()
    );
  },

  applyActiveDensity() {
    const mode = this.getSelectedDensityMode();
    requestAnimationFrame(() => {
      this.applyDensity(mode);
      setTimeout(() => this.applyDensity(mode), 120);
    });
  },

  async handleDownloadAction() {
    if (this.activeTab !== 'weighting') {
      this.showInfo('Download is not configured for this tab yet.', 'warning');
      return;
    }

    const ids = this.getSelectedIds();
    const requestBody = {
      ids,
      limit: 0
    };

    try {
      const response = await fetch(this.resolveApiUrl(this.exportScoringWeightingsEndpoint), {
        method: 'POST',
        headers: {
          Accept: '*/*',
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorMessage = await this.extractErrorMessage(response, 'Download failed.');
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const fileName = this.getDownloadFileNameFromResponse(response) || this.tabs.weighting.exportName;
      this.triggerFileDownload(blob, fileName);
    } catch (error) {
      console.error('Weighting export failed:', error);
      this.showInfo(error?.message || 'Download failed.', 'error');
    }
  },

  getDownloadFileNameFromResponse(response) {
    const disposition = response?.headers?.get?.('content-disposition') || '';
    if (!disposition) return '';

    const utfMatch = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
    if (utfMatch?.[1]) {
      try {
        return decodeURIComponent(utfMatch[1].trim());
      } catch (error) {
        return utfMatch[1].trim();
      }
    }

    const plainMatch = disposition.match(/filename\s*=\s*"?([^\";]+)"?/i);
    return plainMatch?.[1]?.trim() || '';
  },

  triggerFileDownload(blob, fileName) {
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName || 'download.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
  },

  applyPendingFilters() {
    const activeGrid = this.getActiveGrid();
    const gridApi = activeGrid?.api;
    if (!gridApi || typeof gridApi.getFilterModel !== 'function' || typeof gridApi.setFilterModel !== 'function') {
      return;
    }

    const nextModel = { ...(gridApi.getFilterModel() || {}) };
    const pendingFilters = Array.isArray(gridApi.__manualFloatingFilters)
      ? [...gridApi.__manualFloatingFilters]
      : [];

    for (const floatingFilter of pendingFilters) {
      const field = String(
        floatingFilter?.input?.dataset?.colId ||
          floatingFilter?.params?.column?.getColId?.() ||
          ''
      ).trim();

      if (!field || field === 'select') continue;

      const rawInput = String(floatingFilter?.input?.value || '').trim();
      const builtModel = this.buildManualFilterModel(field, rawInput);

      if (builtModel?.isInvalid) {
        MckFilterUtils.showFilterValidationMessage(`${field}: ${builtModel.invalidReason}`);
        return;
      }

      if (!builtModel) {
        delete nextModel[field];
        continue;
      }

      nextModel[field] = builtModel;
    }

    const previousSerialized = JSON.stringify(gridApi.getFilterModel() || {});
    const nextSerialized = JSON.stringify(nextModel);

    if (previousSerialized === nextSerialized) {
      if (typeof gridApi.refreshInfiniteCache === 'function') {
        gridApi.refreshInfiniteCache();
      }
      return;
    }

    gridApi.setFilterModel(nextModel);
  },

  buildManualFilterModel(field, rawInput) {
    if (!rawInput) return null;

    const kind = this.getFieldFilterKind(field);

    if (kind === 'text') {
      const parsedInput = MckFilterUtils.parseTextFilterInput(rawInput, 'contains');
      if (parsedInput.isInvalid) {
        return parsedInput;
      }

      const textOperatorMap = {
        contains: 'contains',
        equals: 'equals',
        notEqual: 'notEqual'
      };
      const operator = textOperatorMap[parsedInput.operator] || 'contains';

      return {
        filterType: 'text',
        type: operator,
        filter: String(parsedInput.value || '').trim(),
        rawInput
      };
    }

    const parsedInput = MckFilterUtils.parseTextFilterInput(rawInput, 'equals');
    if (parsedInput.isInvalid) {
      return parsedInput;
    }

    const value = String(parsedInput.value || '').trim();
    if (!value) return null;

    if (kind === 'date') {
      const agGridDate = this.toAgGridDate(value);
      if (!agGridDate) {
        return {
          isInvalid: true,
          invalidReason: 'Enter a valid date in MM/DD/YYYY format.'
        };
      }
      return {
        filterType: 'date',
        type: parsedInput.operator || 'equals',
        dateFrom: agGridDate,
        dateTo: null,
        rawInput
      };
    }

    return {
      filterType: 'number',
      type: parsedInput.operator || 'equals',
      filter: value,
      rawInput
    };
  },

  toAgGridDate(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';

    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) return raw;

    const usMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!usMatch) return '';

    return `${usMatch[3]}-${usMatch[1]}-${usMatch[2]}`;
  },

  getFieldFilterKind(field) {
    const normalizedField = String(field || '').trim();

    if (['effectiveDate', 'terminationDate', 'disableDate'].includes(normalizedField)) {
      return 'date';
    }

    if (
      [
        'uniqueId',
        'itemNum',
        'relativeProfitabilityWeighting',
        'relativeShareWeighting',
        'relativeQualityWeighting',
        'qualityScore',
        'relativeAllowableMinPrice',
        'relativeAllowableMaxPrice',
        'mckBrandPriceChangeCap'
      ].includes(normalizedField)
    ) {
      return 'number';
    }

    return 'text';
  },

  refreshActiveGridLayout() {
    const activeGrid = this.getActiveGrid();
    if (!activeGrid?.api || !activeGrid?.element) return;

    requestAnimationFrame(() => {
      if (typeof activeGrid.api.refreshHeader === 'function') {
        activeGrid.api.refreshHeader();
      }
      if (typeof activeGrid.api.resetRowHeights === 'function') {
        activeGrid.api.resetRowHeights();
      }
      if (typeof DynamicGrid?.scheduleSizeToFit === 'function') {
        DynamicGrid.scheduleSizeToFit(activeGrid.api, activeGrid.element);
      } else if (typeof activeGrid.api.sizeColumnsToFit === 'function') {
        try {
          activeGrid.api.sizeColumnsToFit();
        } catch (error) {
          console.warn('sizeColumnsToFit skipped on tab switch:', error);
        }
      }
    });
  },

  resetActiveGridState() {
    const activeGrid = this.getActiveGrid();
    if (!activeGrid?.api) return;

    const currentFilterModel =
      typeof activeGrid.api.getFilterModel === 'function' ? activeGrid.api.getFilterModel() || {} : {};
    const hasFilters = Object.keys(currentFilterModel).length > 0;
    const currentSortModel =
      typeof activeGrid.api.getSortModel === 'function' ? activeGrid.api.getSortModel() || [] : [];
    const hasSort = Array.isArray(currentSortModel) && currentSortModel.length > 0;
    const currentPage =
      typeof activeGrid.api.paginationGetCurrentPage === 'function'
        ? activeGrid.api.paginationGetCurrentPage()
        : 0;

    if (hasFilters && typeof activeGrid.api.setFilterModel === 'function') {
      activeGrid.api.setFilterModel(null);
    }
    if (!hasFilters && hasSort && typeof activeGrid.api.setSortModel === 'function') {
      activeGrid.api.setSortModel(null);
    }
    if (!hasFilters && !hasSort && currentPage > 0 && typeof activeGrid.api.paginationGoToFirstPage === 'function') {
      activeGrid.api.paginationGoToFirstPage();
    }
    if (typeof activeGrid.api.deselectAll === 'function') {
      activeGrid.api.deselectAll();
    }
    this.refreshActiveGridLayout();
  },

  initGridForTab(tabKey) {
    if (this.grids[tabKey]?.api) return;

    const tabConfig = this.tabs[tabKey];
    if (!tabConfig) return;

    const selectionColumn = {
      field: 'select',
      colId: 'select',
      headerName: '',
      width: 56,
      minWidth: 56,
      maxWidth: 56,
      pinned: 'left',
      sortable: false,
      suppressMenu: true,
      resizable: false,
      lockPosition: true,
      headerComponent: 'gtPageSelectHeader',
      checkboxSelection: true,
      floatingFilter: false,
      filter: false,
      suppressMovable: true,
      cellClassRules: {
        'is-selection-locked': (params) => this.isActionLockedRow(params?.data)
      }
    };
    const datasource = tabConfig.paginationType === 'server' ? this.buildDatasource(tabConfig) : null;

    const gridApi = DynamicGrid.createGrid({
      gridElementId: tabConfig.gridElementId,
      pageSize: 20,
      paginationType: tabConfig.paginationType || 'client',
      useSpringPagination: tabConfig.paginationType === 'server',
      floatingFilter: true,
      manualFilterApply: true,
      gridOptions: {
        rowData: [],
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
        onGridReady: (params) => {
          if (tabConfig.paginationType !== 'server') return;
          params.api.setGridOption('datasource', datasource);
        },
        rowSelection: 'multiple',
        suppressRowClickSelection: true,
        isRowSelectable: (rowNode) => !this.isActionLockedRow(rowNode?.data),
        components: {
          gtPageSelectHeader: GtPageSelectHeader,
          manualApplyFloatingFilter: MckManualFloatingFilter
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
          filterParams: {
            buttons: ['apply', 'reset'],
            closeOnApply: true,
            maxNumConditions: 1,
            numAlwaysVisibleConditions: 1
          }
        }
      },
      columns: [selectionColumn, ...tabConfig.columns.map((column) => this.buildFilterableColumn(column))]
    });

    const gridElement = document.getElementById(tabConfig.gridElementId);
    this.grids[tabKey] = {
      api: gridApi,
      element: gridElement,
      gridElementId: tabConfig.gridElementId,
      datasource
    };

    if (gridApi) {
      gridApi.applyPendingFloatingFilters = () => this.applyPendingFilters();
    }

    if (
      !this.gridManagerBootstrapped &&
      !this.gridManagerInitScheduled &&
      gridApi &&
      typeof window.GridManager !== 'undefined'
    ) {
      this.gridManagerInitScheduled = true;
      setTimeout(() => {
        try {
          if (this.gridManagerBootstrapped || typeof window.GridManager === 'undefined') return;
          const activeGrid = this.getActiveGrid();
          if (!activeGrid?.api) return;
          window.GridManager.init(activeGrid.api, activeGrid.gridElementId);
          this.gridManagerBootstrapped = true;
          this.syncGridManager();
        } finally {
          this.gridManagerInitScheduled = false;
        }
      }, 300);
    }
  },

  syncGridManager() {
    if (!this.gridManagerBootstrapped || typeof window.GridManager === 'undefined') return;

    const activeGrid = this.getActiveGrid();
    const instance = window.GridManager.currentInstance;
    if (!activeGrid?.api || !instance) return;

    instance.gridApi = activeGrid.api;
    instance.gridId = activeGrid.gridElementId;
    instance.apiConfig.screenId = `id_${activeGrid.gridElementId}`;
    instance.currentPreferenceKey = 'default';
    instance.currentPreferenceId = null;
    instance.savedPreferences = {
      default: {
        name: 'Default Preference',
        visibleColumns: []
      }
    };

    instance.populateColumnsMenu();
    instance.initializeDefaultPreference();

    if (typeof instance.fetchPreferences === 'function') {
      Promise.resolve(instance.fetchPreferences())
        .then(() => {
          if (typeof instance.loadPreferencesList === 'function') {
            instance.loadPreferencesList();
          }
        })
        .catch((error) => {
          console.warn('GridManager preference sync skipped:', error);
        });
    }
  },

  buildDatasource(tabConfig) {
    return {
      rowCount: null,
      getRows: async (params) => {
        const pageSize = params.endRow - params.startRow || 20;
        const page = Math.floor(params.startRow / pageSize);
        const sortModel = Array.isArray(params.sortModel) ? params.sortModel[0] : null;
        const urlParams = new URLSearchParams({
          page: String(page),
          size: String(pageSize),
          sortBy: sortModel?.colId || 'effectiveDate',
          sortDirection: String(sortModel?.sort || 'asc').toUpperCase()
        });
        this.appendFilterParams(urlParams, params.filterModel);

        try {
          const response = await fetch(`${this.resolveApiUrl(tabConfig.apiEndpoint)}?${urlParams.toString()}`, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            credentials: 'same-origin'
          });

          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }

          const payload = await response.json();
          const rows = Array.isArray(payload?.content)
            ? payload.content.map((row) => this.transformWeightingRow(row))
            : [];
          const totalRows = Number.isFinite(payload?.totalElements) ? payload.totalElements : rows.length;
          this.syncNoRowsOverlay(params.api, rows.length);
          params.successCallback(rows, totalRows);
        } catch (error) {
          console.error(`Failed to load ${tabConfig.gridElementId}:`, error);
          this.syncNoRowsOverlay(params.api, 0);
          params.successCallback([], 0);
        }
      }
    };
  },

  syncNoRowsOverlay(gridApi, rowCount) {
    const emptyState = this.emptyStates?.weighting;
    if (emptyState) {
      emptyState.hidden = rowCount > 0;
    }
    if (!gridApi) return;
    if (rowCount > 0) {
      if (typeof gridApi.hideOverlay === 'function') gridApi.hideOverlay();
      return;
    }
    if (typeof gridApi.showNoRowsOverlay === 'function') {
      gridApi.showNoRowsOverlay();
    }
  },

  resolveApiUrl(path) {
    const normalizedPath = String(path || '').trim();
    if (!normalizedPath) return this.apiBaseUrl;
    if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
    return `${this.apiBaseUrl}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`;
  },

  appendFilterParams(urlParams, filterModel) {
    if (!filterModel || typeof filterModel !== 'object') return;

    Object.entries(filterModel).forEach(([field, model]) => {
      const normalized = this.normalizeFilterModel(field, model);
      if (!normalized) return;
      urlParams.append(field, normalized.value);
      urlParams.append(`${field}_op`, normalized.operator);
    });
  },

  normalizeFilterModel(field, model) {
    if (!model || typeof model !== 'object') return null;

    const filterType = String(model.filterType || '').trim();
    let value = filterType === 'date' ? model.dateFrom : model.filter;
    if (value == null || value === '') return null;

    const parsed = this.parseInlineFilterValue(String(value).trim(), filterType);
    const resolvedType = parsed.hasExplicitOperator ? parsed.type : model.type;
    const operator = this.mapFilterOperator(resolvedType, filterType);
    if (!operator) return null;

    value = parsed.value;
    if (filterType === 'date') {
      value = this.normalizeDateValueForRequest(value);
    }

    if (!value) return null;
    return { field, value, operator };
  },

  parseInlineFilterValue(rawValue, filterType) {
    const raw = String(rawValue || '').trim();
    if (!raw) return { value: '', type: '', hasExplicitOperator: false };

    if (!['date', 'number'].includes(filterType)) {
      return { value: raw, type: '', hasExplicitOperator: false };
    }

    const operators = ['>=', '<=', '>', '<', '='];
    const token = operators.find((candidate) => raw.startsWith(candidate));
    if (!token) {
      return { value: raw, type: '', hasExplicitOperator: false };
    }

    const value = raw.slice(token.length).trim();
    const typeMap = {
      '>': 'greaterThan',
      '<': 'lessThan',
      '=': 'equals',
      '>=': 'greaterThanOrEqual',
      '<=': 'lessThanOrEqual'
    };

    return {
      value,
      type: typeMap[token] || 'equals',
      hasExplicitOperator: true
    };
  },

  normalizeDateValueForRequest(value) {
    const raw = String(value == null ? '' : value).trim();
    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/);
    if (!isoMatch) return raw;
    return `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1]}`;
  },

  mapFilterOperator(type, filterType) {
    const normalized = String(type || '').trim();
    if (!normalized) {
      return filterType === 'text' ? 'contains' : 'equals';
    }

    const operatorMap = {
      contains: 'contains',
      notContains: 'notContains',
      startsWith: 'startsWith',
      endsWith: 'endsWith',
      equals: 'equals',
      notEqual: 'doesNotEqual',
      greaterThan: 'greaterThan',
      lessThan: 'lessThan',
      greaterThanOrEqual: 'greaterThanOrEqual',
      lessThanOrEqual: 'lessThanOrEqual'
    };

    return operatorMap[normalized] || null;
  },

  transformWeightingRow(row) {
    if (!row || typeof row !== 'object') return row;

    return {
      uniqueId: row.uniqueId ?? '',
      effectiveDate: row.effectiveDate ?? '',
      terminationDate: row.terminationDate ?? '',
      itemCategory: row.itemCategory ?? '',
      itemNum: row.itemNum ?? '',
      relativeProfitabilityWeighting: row.relativeProfitabilityWeighting ?? '',
      relativeShareWeighting: row.relativeShareWeighting ?? '',
      relativeQualityWeighting: row.relativeQualityWeighting ?? '',
      disableDate: row.disableDate ?? '',
      notes: row.notes ?? '',
      status: row.status ?? ''
    };
  },

  buildFilterableColumn(column) {
    const field = String(column?.field || '').trim();
    if (!field) return column;

    const isDateField = ['effectiveDate', 'terminationDate', 'disableDate'].includes(field);
    const isNumericField = [
      'uniqueId',
      'itemNum',
      'relativeProfitabilityWeighting',
      'relativeShareWeighting',
      'relativeQualityWeighting',
      'qualityScore',
      'relativeAllowableMinPrice',
      'relativeAllowableMaxPrice',
      'mckBrandPriceChangeCap'
    ].includes(field);

    if (isDateField) {
      return {
        ...column,
        filter: 'agDateColumnFilter',
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

    if (isNumericField) {
      return {
        ...column,
        filter: 'agNumberColumnFilter',
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
      ...column,
      filter: 'agTextColumnFilter',
      filterParams: {
        buttons: ['apply', 'reset'],
        closeOnApply: true,
        maxNumConditions: 1,
        numAlwaysVisibleConditions: 1,
        filterOptions: ['contains', 'equals', 'notEqual', 'notContains', 'startsWith', 'endsWith']
      }
    };
  }

};

document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('.mck-brand-logic-shell')) return;
  MckBrandLogicPage.init();
});
