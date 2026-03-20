(function initCommunityGridPaste(global) {
  function parseClipboardTsv(text) {
    if (!text) return [];
    const normalized = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    return normalized
      .split('\n')
      .filter((line, idx, arr) => !(idx === arr.length - 1 && line === ''))
      .map((line) => line.split('\t'));
  }

  function attach(config) {
    const gridElement = config?.gridElement;
    const gridApi = config?.gridApi;
    const fields = Array.isArray(config?.editableFieldOrder) ? config.editableFieldOrder : [];
    if (!gridElement || !gridApi || fields.length === 0) return () => {};

    const maxRows = Number.isFinite(config.maxRows) ? config.maxRows : 5000;
    const maxCols = Number.isFinite(config.maxCols) ? config.maxCols : 10;
    const maxCells = Number.isFinite(config.maxCells) ? config.maxCells : 50000;
    const showInfo = typeof config.showInfo === 'function' ? config.showInfo : (() => {});
    const ensureRowCapacity = typeof config.ensureRowCapacity === 'function' ? config.ensureRowCapacity : (() => {});
    const normalizeRow = typeof config.normalizeRow === 'function' ? config.normalizeRow : ((row) => row);
    const validateRow = typeof config.validateRow === 'function' ? config.validateRow : (() => ({ isValid: true, errors: [] }));
    const onApplied = typeof config.onApplied === 'function' ? config.onApplied : null;
    const resolveHeaderField = typeof config.resolveHeaderField === 'function' ? config.resolveHeaderField : null;
    const requireHeaderMapping = Boolean(config.requireHeaderMapping);
    const headerMatchThreshold = Number.isFinite(config.headerMatchThreshold) ? config.headerMatchThreshold : 1;

    function resolveHeaderPaste(matrix) {
      if (!resolveHeaderField || !Array.isArray(matrix) || matrix.length === 0) return null;
      const headerRow = Array.isArray(matrix[0]) ? matrix[0] : [];
      if (headerRow.length === 0) return null;

      const mappedFields = headerRow.map((header) => {
        const resolvedField = resolveHeaderField(String(header == null ? '' : header));
        return fields.includes(resolvedField) ? resolvedField : '';
      });
      const matchedCount = mappedFields.filter(Boolean).length;
      if (matchedCount < headerMatchThreshold) return null;

      return {
        mappedFields,
        rows: matrix.slice(1),
        matchedCount
      };
    }

    const handler = (event) => {
      const target = event.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;

      const matrix = parseClipboardTsv(event.clipboardData?.getData('text/plain') || '');
      if (!matrix.length) return;

      const headerPaste = resolveHeaderPaste(matrix);
      if (requireHeaderMapping && !headerPaste) {
        showInfo('Paste directly from Excel and include the header row.', 'error');
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      const rowsToPaste = headerPaste ? headerPaste.rows : matrix;
      const headerMappedFields = headerPaste?.mappedFields || null;
      if (!rowsToPaste.length) {
        showInfo('Paste must include at least one data row below the header row.', 'error');
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      const focusedCell = gridApi.getFocusedCell?.();
      if (!focusedCell) {
        showInfo('Select a grid cell before pasting.', 'error');
        return;
      }

      const rowCount = rowsToPaste.length;
      const colCount = Array.isArray(rowsToPaste[0]) ? rowsToPaste[0].length : 0;
      const totalCells = rowCount * colCount;
      if (colCount <= 0) return;

      if (rowCount > maxRows) {
        showInfo(`Paste limit is ${maxRows} rows at a time.`, 'error');
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (colCount > maxCols) {
        showInfo(`Paste limit is ${maxCols} columns at a time.`, 'error');
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (totalCells > maxCells) {
        showInfo(`Paste limit is ${maxCells} cells at a time.`, 'error');
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      const focusedField = focusedCell.column?.getColId?.() || '';
      let startFieldIndex = fields.indexOf(focusedField);
      if (startFieldIndex < 0) startFieldIndex = 0;

      const startRowIndex = Number.isInteger(focusedCell.rowIndex) ? focusedCell.rowIndex : 0;
      ensureRowCapacity(rowCount, startRowIndex);

      const changedNodes = [];
      for (let r = 0; r < rowCount; r += 1) {
        const node = gridApi.getDisplayedRowAtIndex?.(startRowIndex + r);
        if (!node?.data) continue;

        let rowChanged = false;
        for (let c = 0; c < colCount; c += 1) {
          const field = headerMappedFields ? headerMappedFields[c] : fields[startFieldIndex + c];
          if (!field) continue;
          node.data[field] = rowsToPaste[r][c] == null ? '' : String(rowsToPaste[r][c]).trim();
          rowChanged = true;
        }

        if (rowChanged) {
          const normalized = normalizeRow(node.data);
          const validation = validateRow(normalized);
          Object.assign(node.data, normalized, {
            uploadStatus: validation.isValid ? 'success' : 'error',
            uploadErrors: validation.errors
          });
          changedNodes.push(node);
        }
      }

      if (changedNodes.length > 0) {
        gridApi.refreshCells?.({ rowNodes: changedNodes, force: true });
        if (onApplied) onApplied(changedNodes);
        event.preventDefault();
        event.stopPropagation();
      }
    };

    gridElement.addEventListener('paste', handler, true);
    return () => gridElement.removeEventListener('paste', handler, true);
  }

  global.CommunityGridPaste = { attach };
})(window);
