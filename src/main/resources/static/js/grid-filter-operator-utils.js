(function initGridFilterOperatorUtils(global) {
  const SUPPORTED_OPERATORS = ['!=', '<>', '>=', '<=', '>', '<', '='];

  function parseOperatorExpression(raw, kind, options = {}) {
    const trimmed = String(raw || '').trim();
    if (!trimmed) return { empty: true };

    const lower = trimmed.toLowerCase();
    if (lower === 'blank') return { valid: true, type: 'blank', kind };
    if (lower === 'notblank') return { valid: true, type: 'notBlank', kind };

    const operatorToken = SUPPORTED_OPERATORS.find((op) => trimmed.startsWith(op));
    const hasSymbol = /^[!<>=@]/.test(trimmed);
    if (!operatorToken && hasSymbol) {
      return {
        valid: false,
        reason: 'Invalid operator. Use =, !=, <>, >, <, >=, <=, blank, or notblank.'
      };
    }

    const value = operatorToken ? trimmed.slice(operatorToken.length).trim() : trimmed;
    if (!value) {
      return { valid: false, reason: 'Enter a value after the operator.' };
    }

    let mappedType = null;
    if (!operatorToken) {
      mappedType = kind === 'text' ? 'contains' : 'equals';
    } else if (operatorToken === '=') mappedType = 'equals';
    else if (operatorToken === '!=' || operatorToken === '<>') mappedType = 'notEqual';
    else if (operatorToken === '>') mappedType = 'greaterThan';
    else if (operatorToken === '<') mappedType = 'lessThan';
    else if (operatorToken === '>=') mappedType = 'greaterThanOrEqual';
    else if (operatorToken === '<=') mappedType = 'lessThanOrEqual';

    if (kind === 'text' && ['greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual'].includes(mappedType)) {
      return {
        valid: false,
        reason: 'Text filters support default contains, =, !=, blank, and notblank.'
      };
    }

    if (kind === 'date') {
      if (typeof options.toDateIso !== 'function') {
        return { valid: false, reason: 'Date parser not configured.' };
      }
      const iso = options.toDateIso(value);
      if (!iso) return { valid: false, reason: 'Date must be MM/DD/YYYY.' };
      return { valid: true, filterType: 'date', type: mappedType, dateFrom: iso };
    }

    if (kind === 'number') {
      const numericValidator = options.isNumeric || ((val) => !Number.isNaN(Number(val)));
      if (!numericValidator(value)) return { valid: false, reason: 'Enter a valid number.' };
      return { valid: true, filterType: 'number', type: mappedType, filter: Number(value) };
    }

    return { valid: true, filterType: 'text', type: mappedType, filter: value };
  }

  function applyFloatingFilters(config) {
    const {
      gridApi,
      gridElement,
      fieldTypeMap,
      toDateIso,
      isNumeric,
      onValidationError
    } = config || {};

    if (!gridApi || !gridElement) return false;

    const inputs = Array.from(gridElement.querySelectorAll('.mfi-floating-filter-input[data-col-id]'));
    const model = {};

    for (const input of inputs) {
      const field = input.dataset.colId;
      const kind = (fieldTypeMap && fieldTypeMap[field]) || 'text';
      const rawInput = String(input.value || '').trim();
      const parsed = parseOperatorExpression(input.value, kind, { toDateIso, isNumeric });

      if (parsed.empty) continue;
      if (!parsed.valid) {
        if (typeof onValidationError === 'function') {
          onValidationError(field, parsed.reason);
        }
        return false;
      }

      if (parsed.type === 'blank' || parsed.type === 'notBlank') {
        model[field] = {
          filterType: kind === 'number' ? 'number' : (kind === 'date' ? 'date' : 'text'),
          type: parsed.type,
          rawInput
        };
      } else if (kind === 'date') {
        model[field] = {
          filterType: 'date',
          type: parsed.type,
          dateFrom: parsed.dateFrom,
          rawInput
        };
      } else if (kind === 'number') {
        model[field] = {
          filterType: 'number',
          type: parsed.type,
          filter: parsed.filter,
          rawInput
        };
      } else {
        model[field] = {
          filterType: 'text',
          type: parsed.type,
          filter: parsed.filter,
          rawInput
        };
      }
    }

    if (typeof gridApi.setFilterModel === 'function') {
      gridApi.setFilterModel(model);
    }
    if (typeof gridApi.onFilterChanged === 'function') {
      gridApi.onFilterChanged();
    }

    return true;
  }

  function createUsDateComparator(toDateIso) {
    return (filterLocalDateAtMidnight, cellValue) => {
      if (typeof toDateIso !== 'function') return -1;
      const iso = toDateIso(cellValue);
      if (!iso) return -1;
      const [year, month, day] = iso.split('-').map(Number);
      const cellDate = new Date(year, month - 1, day);
      if (cellDate < filterLocalDateAtMidnight) return -1;
      if (cellDate > filterLocalDateAtMidnight) return 1;
      return 0;
    };
  }

  global.GridFilterOperatorUtils = {
    parseOperatorExpression,
    applyFloatingFilters,
    createUsDateComparator
  };
})(window);