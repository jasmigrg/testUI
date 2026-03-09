class GtPageSelectHeader {
  init(params) {
    this.params = params;
    this.eGui = document.createElement('div');
    this.eGui.className = 'gt-header-select-all';

    this.checkbox = document.createElement('input');
    this.checkbox.type = 'checkbox';
    this.checkbox.className = 'gt-header-select-checkbox';
    this.checkbox.setAttribute('aria-label', 'Select visible rows');

    this.stopEvent = (e) => e.stopPropagation();
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

    for (let i = from; i < to; i++) {
      const rowNode = this.params.api.getDisplayedRowAtIndex(i);
      if (!rowNode) continue;
      if (rowNode.rowPinned || rowNode.group || rowNode.selectable === false) {
        continue;
      }
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

    for (let i = from; i < to; i++) {
      const rowNode = this.params.api.getDisplayedRowAtIndex(i);
      if (!rowNode) continue;
      if (rowNode.rowPinned || rowNode.group || rowNode.selectable === false) {
        continue;
      }
      selectableCount += 1;
      if (rowNode.isSelected()) {
        selectedCount += 1;
      }
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

const MarginFundingCustomerMaintenanceManager = {
  gridApi: null,
  gridElement: null,
  disableEndpoint: '/api/margin-funding/customer-maintenance/disable',
  updateTerminationDateEndpoint: '/api/margin-funding/customer-maintenance/update-termination-date',
  pendingDisableUniqueKeys: [],
  pendingTerminationUpdateUniqueKeys: [],

  buildRows() {
    return Array.from({ length: 16 }, (_, i) => ({
      uniqueKey: `UK-${1000 + i}`,
      vendorFamilyNumber: `VF-${200 + (i % 6)}`,
      vendorFamilyName: `Vendor Family ${String.fromCharCode(65 + (i % 6))}`,
      vendorProgram: `Program ${1 + (i % 4)}`,
      itemNumber: `${10001 + i}`,
      itemDescription: `Item Description ${i + 1}`,
      distributionNonContract: (5 + (i % 3)).toFixed(2),
      distributionContract: (3 + (i % 4)).toFixed(2),
      marginFundingPercentType: i % 2 === 0 ? 'Flat' : 'Tiered',
      effectiveFrom: '01/01/2026',
      effectiveThru: '12/31/2026',
      userId: `USER${100 + (i % 8)}`,
      dateUpdated: '01/15/2026',
      timeUpdated: `${String(9 + (i % 8)).padStart(2, '0')}:30:00`,
      workStnId: `WS${200 + (i % 6)}`,
      programId: `PGM-${3000 + (i % 12)}`
    }));
  },

  resetGridState() {
    if (!this.gridApi) return;
    if (typeof this.gridApi.setFilterModel === 'function') {
      this.gridApi.setFilterModel(null);
    }
    if (typeof this.gridApi.setSortModel === 'function') {
      this.gridApi.setSortModel(null);
    }
    if (typeof this.gridApi.onFilterChanged === 'function') {
      this.gridApi.onFilterChanged();
    }
    if (typeof this.gridApi.paginationGoToFirstPage === 'function') {
      this.gridApi.paginationGoToFirstPage();
    }
    if (typeof this.gridApi.deselectAll === 'function') {
      this.gridApi.deselectAll();
    }
  },

  getSelectedUniqueKeys() {
    if (!this.gridApi || typeof this.gridApi.getSelectedRows !== 'function') return [];
    return this.gridApi.getSelectedRows()
      .map((row) => row?.uniqueKey)
      .filter(Boolean);
  },

  getSelectedRows() {
    if (!this.gridApi || typeof this.gridApi.getSelectedRows !== 'function') return [];
    return this.gridApi.getSelectedRows().filter(Boolean);
  },

  hasDisabledRowsSelected() {
    return this.getSelectedRows().some((row) => String(row.disableDate || '').trim() !== '');
  },

  refreshGridData() {
    if (!this.gridApi) return;
    if (typeof this.gridApi.refreshInfiniteCache === 'function') {
      this.gridApi.refreshInfiniteCache();
    } else if (typeof this.gridApi.refreshServerSideStore === 'function') {
      this.gridApi.refreshServerSideStore({ purge: true });
    }
    if (typeof this.gridApi.deselectAll === 'function') {
      this.gridApi.deselectAll();
    }
  },

  async postGridAction(url, payload) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
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
    if (this.disableErrorMessage) {
      this.disableErrorMessage.hidden = false;
    }
    this.disableDialog?.classList.add('has-inline-error');
  },

  clearDisableInlineError() {
    if (this.disableErrorMessage) {
      this.disableErrorMessage.hidden = true;
    }
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
    if (this.disableNotesInput) {
      this.disableNotesInput.value = '';
    }
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

  getTodayDateOnly() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    return date;
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
    if (this.updateTerminationDateInput) {
      this.updateTerminationDateInput.value = '';
    }
    if (this.updateTerminationNotesInput) {
      this.updateTerminationNotesInput.value = '';
    }
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

  async handleUpdateTerminationDateSave() {
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

    this.clearUpdateTerminationInlineError();

    try {
      if (this.updateTerminationSaveBtn) this.updateTerminationSaveBtn.disabled = true;
      await this.postGridAction(this.updateTerminationDateEndpoint, {
        uniqueKeys,
        terminationDate: this.formatDateAsMmDdYyyy(parsedDate),
        notes
      });
      this.closeUpdateTerminationModal();
      this.refreshGridData();
      window.GridManager?.currentInstance?.showToast?.('Termination date updated successfully.', 'success');
    } catch (error) {
      console.error('Update termination date failed:', error);
      window.GridManager?.currentInstance?.showToast?.('Failed to update termination date.', 'error');
    } finally {
      if (this.updateTerminationSaveBtn) this.updateTerminationSaveBtn.disabled = false;
    }
  },

  async handleDisableSave() {
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
    this.clearDisableInlineError();

    try {
      if (this.disableSaveBtn) this.disableSaveBtn.disabled = true;
      await this.postGridAction(this.disableEndpoint, { uniqueKeys, notes });
      this.closeDisableModal();
      this.refreshGridData();
      window.GridManager?.currentInstance?.showToast?.('Selected rows disabled successfully.', 'success');
    } catch (error) {
      console.error('Disable action failed:', error);
      window.GridManager?.currentInstance?.showToast?.('Failed to disable selected rows.', 'error');
    } finally {
      if (this.disableSaveBtn) this.disableSaveBtn.disabled = false;
    }
  },

  handleDisableAction() {
    const uniqueKeys = this.getSelectedUniqueKeys();
    if (!uniqueKeys.length) {
      window.GridManager?.currentInstance?.showToast?.('Select at least one row to disable.', 'error');
      return;
    }
    if (this.hasDisabledRowsSelected()) {
      window.GridManager?.currentInstance?.showToast?.(
        'Disabled rows cannot be edited. Remove already-disabled rows from selection.',
        'error'
      );
      return;
    }
    this.openDisableModal(uniqueKeys);
  },

  handleUpdateTerminationDateAction() {
    const uniqueKeys = this.getSelectedUniqueKeys();
    if (!uniqueKeys.length) {
      window.GridManager?.currentInstance?.showToast?.('Select at least one row to update termination date.', 'error');
      return;
    }
    if (this.hasDisabledRowsSelected()) {
      window.GridManager?.currentInstance?.showToast?.(
        'Disabled rows cannot be edited. Remove already-disabled rows from selection.',
        'error'
      );
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

    if (window.GridToolbar && this.gridApi && this.gridElement) {
      window.GridToolbar.bindDensityControls({
        gridApi: this.gridApi,
        gridElement: this.gridElement,
        defaultMode: 'compact',
        densityClassPrefix: 'grid-density'
      });
      window.GridToolbar.bindDownloadControl({
        gridApi: this.gridApi,
      fileName: 'margin-funding-customer-maintenance.csv'
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

    const disableBtn = document.querySelector('.gt-action-btn[data-action="disable"]');
    if (disableBtn) {
      disableBtn.addEventListener('click', () => this.handleDisableAction());
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
      if (this.disableNotesInput?.value.trim()) {
        this.clearDisableInlineError();
      }
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
      if (this.updateTerminationDateInput?.value.trim()) {
        this.clearUpdateTerminationInlineError();
      }
    });
    this.updateTerminationNotesInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.closeUpdateTerminationModal();
      if (event.key === 'Enter') this.handleUpdateTerminationDateSave();
    });
    this.updateTerminationNotesInput?.addEventListener('input', () => {
      if (this.updateTerminationNotesInput?.value.trim()) {
        this.clearUpdateTerminationInlineError();
      }
    });

    const updateTerminationBtn = document.querySelector('.gt-action-btn[data-action="update-termination-date"]');
    if (updateTerminationBtn) {
      updateTerminationBtn.addEventListener('click', () => this.handleUpdateTerminationDateAction());
    }
  },

  applyDefaultDensity() {
    if (!(window.GridToolbar && this.gridApi && this.gridElement)) return;
    const activeDensityBtn = document.querySelector('.gt-view-btn[data-density].is-active');
    const defaultMode = activeDensityBtn?.dataset?.density || 'compact';
    window.GridToolbar.stabilizeDensity(
      {
        gridApi: this.gridApi,
        gridElement: this.gridElement,
        densityClassPrefix: 'grid-density'
      },
      defaultMode
    );
  },

  init() {
    this.gridElement = document.getElementById('mfcGrid');

    const gridConfig = {
      gridElementId: 'mfcGrid',
      pageSize: 20,
      floatingFilter: true,
      manualFilterApply: true,
      paginationType: 'server',
      useSpringPagination: true,
      apiEndpoint: '/api/margin-funding/customer-maintenance/paginated',
      gridOptions: {
        rowSelection: 'multiple',
        suppressRowClickSelection: true,
        isRowSelectable: (rowNode) => {
          const row = rowNode?.data;
          return String(row?.disableDate || '').trim() === ''
            && String(row?.terminationDate || '').trim() === '';
        },
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
          showDisabledCheckboxes: true,
          cellClassRules: {
            'is-selection-locked': (params) => {
              const row = params?.data;
              return String(row?.disableDate || '').trim() !== ''
                || String(row?.terminationDate || '').trim() !== '';
            }
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
        { field: 'uniqueKey', headerName: 'Unique Key', minWidth: 150 },
        { field: 'vendorFamilyNumber', headerName: 'Vendor Family Number', minWidth: 170 },
        { field: 'vendorFamilyName', headerName: 'Vendor Family Name', minWidth: 190 },
        { field: 'vendorProgram', headerName: 'Vendor Program', minWidth: 160 },
        { field: 'accountType', headerName: 'Account Type', minWidth: 140 },
        { field: 'customerNumber', headerName: 'Customer Number', minWidth: 160 },
        { field: 'customerName', headerName: 'Customer Name', minWidth: 180 },
        { field: 'ieFlag', headerName: 'I E', minWidth: 100 },
        { field: 'effectiveFrom', headerName: 'Effective From', minWidth: 140 },
        { field: 'effectiveThru', headerName: 'Effective Thru', minWidth: 140 },
        { field: 'terminationDate', headerName: 'Termination Date', minWidth: 160 },
        { field: 'disableDate', headerName: 'Disable Date', minWidth: 140 },
        { field: 'notes', headerName: 'Notes', minWidth: 180 },
        { field: 'programId', headerName: 'Program ID', minWidth: 130 },
        { field: 'workStnId', headerName: 'Work Stn ID', minWidth: 130 },
        { field: 'userId', headerName: 'User ID', minWidth: 120 }
      ]
    };

    this.gridApi = DynamicGrid.createGrid(gridConfig);

    window.gridApi = this.gridApi;
    this.initViewActions();
    if (this.gridApi && typeof this.gridApi.addEventListener === 'function') {
      this.gridApi.addEventListener('firstDataRendered', () => this.applyDefaultDensity());
    }
    this.applyDefaultDensity();
    setTimeout(() => this.applyDefaultDensity(), 150);

    setTimeout(() => {
      if (window.gridApi && typeof GridManager !== 'undefined') {
        GridManager.init(window.gridApi, 'mfcGrid');
      }
    }, 500);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  MarginFundingCustomerMaintenanceManager.init();
});
