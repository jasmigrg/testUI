(function initBulkUploadFlow(global) {
  function toArray(payload) {
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload)) return payload;
    return [];
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function createFlow(config) {
    const state = {
      selectedBatchId: null,
      batchRows: [],
      mockBatchStore: [],
      mockBatchRowsById: {},
      mockBatchSequence: 1000
    };

    function screenCode() {
      return config.getScreenCode ? config.getScreenCode() : 'DEFAULT';
    }

    function baseUrl() {
      return config.getBulkUploadBaseUrl ? config.getBulkUploadBaseUrl() : '/api/v1/bulk-upload';
    }

    function isMock() {
      return config.shouldUseMock ? config.shouldUseMock() : true;
    }

    function notify(message, type) {
      if (typeof config.showInfo === 'function') config.showInfo(message, type);
    }

    function setBatchCount(count) {
      if (!config.batchInfoTextEl) return;
      config.batchInfoTextEl.textContent = `You Have [${count}] Unfinished Uploads.`;
    }

    function renderBatchRows(rows) {
      if (!config.batchTableBodyEl) return;
      if (!rows || rows.length === 0) {
        config.batchTableBodyEl.innerHTML = '<div class="bulk-upload-batch-empty">No unfinished uploads.</div>';
        return;
      }

      config.batchTableBodyEl.innerHTML = rows.map((row) => {
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
    }

    function normalizeBatch(item, index) {
      if (typeof config.normalizeBatchRow === 'function') return config.normalizeBatchRow(item, index);
      return {
        id: item.id || item.batchId || item.batchNumber || `batch-${index + 1}`,
        batchNumber: item.batchNumber || item.batchId || item.id || '',
        batchStatus: item.batchStatus || item.status || '',
        recordsCount: item.recordsCount ?? item.totalRecords ?? '',
        errorCount: item.errorCount ?? item.totalErrors ?? '',
        createdBy: item.createdBy || '',
        priceRuleLevel: item.priceRuleLevel || '',
        startDate: item.startDate || '',
        endDate: item.endDate || '',
        programId: item.programId || '',
        userId: item.userId || '',
        workstationId: item.workstationId || '',
        dateUpdated: item.dateUpdated || ''
      };
    }

    async function fetchJson(url, options) {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      return response.json();
    }

    async function fetchBatchRows() {
      if (isMock()) return [...state.mockBatchStore];
      const url = `${baseUrl()}/batches?screenCode=${encodeURIComponent(screenCode())}`;
      const json = await fetchJson(url, { method: 'GET', headers: { Accept: 'application/json' } });
      return toArray(json).map((item, index) => normalizeBatch(item, index));
    }

    async function loadBatchRows() {
      const rows = await fetchBatchRows();
      state.batchRows = rows;
      renderBatchRows(rows);
      setBatchCount(rows.length);
      return rows;
    }

    async function fetchRowsForBatch(batchId) {
      if (isMock()) return Array.isArray(state.mockBatchRowsById[batchId]) ? state.mockBatchRowsById[batchId] : [];
      const url = `${baseUrl()}/batches/${encodeURIComponent(batchId)}/rows?screenCode=${encodeURIComponent(screenCode())}&view=all`;
      const json = await fetchJson(url, { method: 'GET', headers: { Accept: 'application/json' } });
      const rows = toArray(json);
      return typeof config.normalizeBatchDataRow === 'function'
        ? rows.map((row) => config.normalizeBatchDataRow(row))
        : rows;
    }

    async function loadBatchData(batchId) {
      if (!batchId) return;
      state.selectedBatchId = batchId;
      const rows = await fetchRowsForBatch(batchId);
      if (typeof config.onBatchRowsLoaded === 'function') config.onBatchRowsLoaded(rows, batchId);
      return rows;
    }

    async function deleteBatch(batchId) {
      if (!batchId) return;
      if (isMock()) {
        state.mockBatchStore = state.mockBatchStore.filter((row) => String(row.id) !== String(batchId));
        delete state.mockBatchRowsById[batchId];
      } else {
        const url = `${baseUrl()}/batches/${encodeURIComponent(batchId)}?screenCode=${encodeURIComponent(screenCode())}`;
        await fetchJson(url, { method: 'DELETE', headers: { Accept: 'application/json' } });
      }

      state.batchRows = state.batchRows.filter((row) => String(row.id || row.batchNumber) !== String(batchId));
      renderBatchRows(state.batchRows);
      setBatchCount(state.batchRows.length);

      if (String(state.selectedBatchId || '') === String(batchId)) {
        state.selectedBatchId = null;
        if (typeof config.onBatchCleared === 'function') config.onBatchCleared();
      }
    }

    async function createMockBatchFromFile(file) {
      const mappedRows = await config.parseAndMapCsvFile(file);
      const batchId = `${screenCode()}-${Date.now()}`;
      state.mockBatchSequence += 1;
      const batchNumber = String(state.mockBatchSequence);
      const errorCount = mappedRows.filter((row) => row.uploadStatus === 'error').length;
      const today = typeof config.formatNowUsDate === 'function' ? config.formatNowUsDate() : '';

      const batch = {
        id: batchId,
        batchNumber,
        batchStatus: errorCount > 0 ? 'Validation Error' : 'Validation Success',
        recordsCount: mappedRows.length,
        errorCount,
        createdBy: config.getCurrentUser ? config.getCurrentUser() : 'defaultUser',
        priceRuleLevel: screenCode(),
        startDate: today,
        endDate: today,
        programId: screenCode(),
        userId: config.getCurrentUser ? config.getCurrentUser() : 'defaultUser',
        workstationId: 'WEB',
        dateUpdated: today
      };

      state.mockBatchStore = [batch, ...state.mockBatchStore];
      state.mockBatchRowsById[batchId] = mappedRows;
      await loadBatchRows();
      notify(`Batch ${batchNumber} created. Click batch number to load rows.`, 'success');
      return true;
    }

    async function handleFileUpload(file) {
      if (isMock()) return createMockBatchFromFile(file);

      const createPayload = {
        screenCode: screenCode(),
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type || 'text/csv'
      };

      const createJson = await fetchJson(`${baseUrl()}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(createPayload)
      });
      const created = createJson?.data || createJson || {};
      const batchId = created.batchId || created.id || created.batchNumber;
      if (!batchId) throw new Error('Batch id missing from create response');

      if (created.uploadUrl || created.signedUrl) {
        const uploadResponse = await fetch(created.uploadUrl || created.signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'text/csv' },
          body: file
        });
        if (!uploadResponse.ok) throw new Error(`Signed upload failed: ${uploadResponse.status}`);
      } else {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('screenCode', screenCode());
        const uploadResponse = await fetch(`${baseUrl()}/batches/${encodeURIComponent(batchId)}/file`, {
          method: 'POST',
          body: formData
        });
        if (!uploadResponse.ok) throw new Error(`Multipart upload failed: ${uploadResponse.status}`);
      }

      await fetchJson(`${baseUrl()}/batches/${encodeURIComponent(batchId)}/import/start?screenCode=${encodeURIComponent(screenCode())}`, {
        method: 'POST',
        headers: { Accept: 'application/json' }
      });

      await loadBatchRows();
      notify(`Batch ${created.batchNumber || batchId} created. Click batch number to load rows.`, 'success');
      return true;
    }

    async function applyPostSubmit(remainingRows) {
      if (!isMock() || !state.selectedBatchId) return;

      const selectedBatchId = state.selectedBatchId;
      state.mockBatchRowsById[selectedBatchId] = remainingRows;

      state.mockBatchStore = state.mockBatchStore.map((batch) => {
        if (String(batch.id) !== String(selectedBatchId)) return batch;
        const errorCount = remainingRows.filter((row) => row.uploadStatus === 'error').length;
        return {
          ...batch,
          recordsCount: remainingRows.length,
          errorCount,
          batchStatus: remainingRows.length === 0 ? 'Submitted' : (errorCount > 0 ? 'Validation Error' : 'Validation Success'),
          dateUpdated: typeof config.formatNowUsDate === 'function' ? config.formatNowUsDate() : batch.dateUpdated
        };
      }).filter((batch) => !(String(batch.id) === String(selectedBatchId) && batch.recordsCount === 0));

      if (remainingRows.length === 0) {
        delete state.mockBatchRowsById[selectedBatchId];
        state.selectedBatchId = null;
      }
      await loadBatchRows();
    }

    function bindUiEvents() {
      if (config.batchCollapseBtnEl && config.batchSectionEl) {
        config.batchCollapseBtnEl.addEventListener('click', () => {
          const isCollapsed = config.batchSectionEl.classList.toggle('is-collapsed');
          config.batchCollapseBtnEl.setAttribute('aria-expanded', String(!isCollapsed));
          config.batchCollapseBtnEl.textContent = isCollapsed ? '⌄' : '⌃';
        });
      }

      if (config.batchTableBodyEl) {
        config.batchTableBodyEl.addEventListener('click', (event) => {
          const deleteBtn = event.target.closest('[data-batch-delete]');
          if (deleteBtn) {
            deleteBatch(deleteBtn.getAttribute('data-batch-id')).catch((error) => {
              console.error('Delete batch failed:', error);
              notify('Failed to delete batch.', 'error');
            });
            return;
          }

          const link = event.target.closest('[data-batch-link]');
          if (link) {
            loadBatchData(link.getAttribute('data-batch-id')).catch((error) => {
              console.error('Load batch failed:', error);
              notify('Failed to load selected batch rows.', 'error');
            });
          }
        });
      }
    }

    async function init() {
      bindUiEvents();
      await loadBatchRows();
    }

    return {
      init,
      loadBatchRows,
      loadBatchData,
      handleFileUpload,
      applyPostSubmit
    };
  }

  global.BulkUploadFlow = { create: createFlow };
})(window);
