class ManualApplyFloatingFilter {
  init(params) {
    this.params = params;
    this.currentValue = '';
    this.gui = document.createElement('div');
    this.gui.className = 'mfi-manual-floating-filter';

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.className = 'mfi-floating-filter-input';
    this.input.setAttribute('aria-label', `${params.column.getColDef().headerName || params.column.getColId()} filter`);
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
    this.params.parentFilterInstance((instance) => {
      if (!instance) return;
      instance.onFloatingFilterChanged('contains', value || null);
    });
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

const DynamicGrid = {
  autoFitBindings: new WeakMap(),
  SUPPORTED_TEXT_FILTER_OPERATORS: ['!=', '<>', '>=', '<=', '>', '<', '='],

  showFilterValidationMessage(message) {
    if (window.GridManager?.currentInstance?.showToast) {
      window.GridManager.currentInstance.showToast(message, 'error', 2800);
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
    const matchedOperator = this.SUPPORTED_TEXT_FILTER_OPERATORS.find((op) => trimmed.startsWith(op));

    if (!matchedOperator) {
      if (startsWithOperatorLikeSymbol) {
        return {
          value: rawValue,
          operator: fallbackOperator,
          isInvalid: true,
          invalidReason:
            'Invalid operator. Use =, !=, <>, >, <, >=, <=, blank, or notblank.'
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
        invalidReason:
          'Invalid operator format. Use =, !=, <>, >, <, >=, <= followed by a value.'
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
  },

  scheduleSizeToFit(gridApi, gridElement) {
    if (!gridApi || !gridElement) return;

    if (gridApi.__sizeToFitTimer) {
      clearTimeout(gridApi.__sizeToFitTimer);
    }

    gridApi.__sizeToFitTimer = setTimeout(() => {
      const containerWidth = gridElement.clientWidth || gridElement.offsetWidth || 0;
      if (containerWidth < 200) return;

      const displayedCols = typeof gridApi.getAllDisplayedColumns === 'function'
        ? gridApi.getAllDisplayedColumns()
        : [];

      if (!displayedCols || displayedCols.length === 0) return;

      try {
        gridApi.sizeColumnsToFit();
      } catch (error) {
        console.warn('sizeColumnsToFit skipped:', error);
      }
    }, 120);
  },

  bindAutoFit(gridApi, gridElement, config) {
    if (!gridApi || !gridElement) return;
    if (config.autoFitColumns === false) return;
    if (this.autoFitBindings.has(gridApi)) return;

    const onResize = () => this.scheduleSizeToFit(gridApi, gridElement);

    window.addEventListener('resize', onResize);

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(onResize);
      resizeObserver.observe(gridElement);
    }

    const onFirstDataRendered = () => this.scheduleSizeToFit(gridApi, gridElement);
    if (typeof gridApi.addEventListener === 'function') {
      gridApi.addEventListener('firstDataRendered', onFirstDataRendered);
    }

    this.autoFitBindings.set(gridApi, {
      onResize,
      onFirstDataRendered,
      resizeObserver
    });

    this.scheduleSizeToFit(gridApi, gridElement);
    setTimeout(() => this.scheduleSizeToFit(gridApi, gridElement), 300);
  },

  createGrid(config) {
    const gridElement = document.getElementById(config.gridElementId);

    if (!gridElement) {
      console.error(`Grid element not found: ${config.gridElementId}`);
      return null;
    }

    const columnDefs = config.columns.map(col => {
      const colDef = {
        headerName: col.headerName,
        field: col.field,
        width: col.width || 150
      };

      if (col.filter !== false) {
        colDef.filter = col.filter || 'agTextColumnFilter';
      }

      if (col.sortable !== false) {
        colDef.sortable = true;
      }

      if (col.resizable !== false) {
        colDef.resizable = true;
      }

      return {
        ...colDef,
        ...col,
        ...col.options,
        headerName: col.headerName || colDef.headerName,
        field: col.field || colDef.field,
        width: col.width || colDef.width
      };
    });

    let paginationType = config.paginationType || 'server';

    if (!config.paginationType && config.gridOptions?.rowModelType === 'clientSide') {
      paginationType = 'client';
    }

    const isClientSide = paginationType === 'client';

    const defaultGridOptions = {
      columnDefs: columnDefs,
      pagination: true,
      paginationPageSize: config.pageSize || 10,
      paginationPageSizeSelector: config.pageSizeSelector || [10, 20, 50, 100, 200],
      enableCellTextSelection: true,
      ensureDomOrder: true,
      components: config.manualFilterApply
        ? { manualApplyFloatingFilter: ManualApplyFloatingFilter }
        : {},
      defaultColDef: {
        sortable: true,
        filter: true,
        resizable: true,
        floatingFilter: config.floatingFilter !== undefined ? config.floatingFilter : true,
        ...(config.manualFilterApply
          ? {
              suppressFloatingFilterButton: true,
              floatingFilterComponent: 'manualApplyFloatingFilter',
              floatingFilterComponentParams: { suppressFilterButton: true }
            }
          : {}),
        filterParams: {
          suppressAndOrCondition: true,
          buttons: ['apply', 'reset'],
          closeOnApply: true
        }
      },
      rowModelType: isClientSide ? 'clientSide' : 'infinite',
      ...(isClientSide ? {} : { cacheBlockSize: config.pageSize || 10, maxBlocksInCache: 10 })
    };

    if (!isClientSide || !(config.gridOptions && config.gridOptions.rowData)) {
      defaultGridOptions.rowData = [];
    }

    if (isClientSide && config.apiEndpoint) {
      defaultGridOptions.onGridReady = (params) => {
        let allDataUrl = config.apiEndpoint;
        const separator = allDataUrl.includes('?') ? '&' : '?';
        allDataUrl += separator + 'pageSize=10000&page=1';

        fetch(allDataUrl)
          .then(response => response.json())
          .then(data => {
            let rows = [];

            if (Array.isArray(data)) {
              rows = data;
            } else if (data && data.data) {
              rows = Array.isArray(data.data) ? data.data : [data.data];
            }

            if (rows.length > 0) {
              if (config.dataTransformer) {
                rows = rows.map(config.dataTransformer);
              }

              if (config.columns.some(col => col.dataMapping)) {
                rows = rows.map(row => this.mapRowData(row, config.columns));
              }
            }

            params.api.setGridOption('rowData', rows);
          })
          .catch(error => {
            console.error('Error fetching data:', error);
          });

        if (config.gridOptions && config.gridOptions.onGridReady) {
          config.gridOptions.onGridReady(params);
        }
      };
    } else if (!isClientSide && config.apiEndpoint) {
      let isProcessingFilter = false;
      let manualFilterTrigger = false;
      let lastKnownPageSize = config.pageSize || 10;
      let isUpdatingPageSize = false;

      defaultGridOptions.onGridReady = (params) => {
        params.api.__isUpdatingPageSize = false;
        this.setupDataSource(params.api, config);

        if (config.gridOptions && config.gridOptions.onGridReady) {
          config.gridOptions.onGridReady(params);
        }
      };

      defaultGridOptions.onPaginationChanged = (params) => {
        if (!params || !params.api) return;
        if (typeof params.api.paginationGetPageSize !== 'function') return;
        if (params.api.__isUpdatingPageSize) return;

        const newPageSize = params.api.paginationGetPageSize();

        if (lastKnownPageSize === newPageSize) return;

        console.log('Page size changed from', lastKnownPageSize, 'to', newPageSize);

        params.api.__isUpdatingPageSize = true;
        lastKnownPageSize = newPageSize;

        setTimeout(() => {
          params.api.__isUpdatingPageSize = false;
          setTimeout(() => {
            params.api.updateGridOptions({ cacheBlockSize: newPageSize });
          }, 50);
        }, 50);
      };

    }

    const gridOptions = {
      ...defaultGridOptions,
      ...config.gridOptions,
      enableFilterHandlers: true,
      components: {
        ...(defaultGridOptions.components || {}),
        ...(config.gridOptions?.components || {})
      },
      defaultColDef: {
        ...defaultGridOptions.defaultColDef,
        ...(config.gridOptions?.defaultColDef || {})
      }
    };

    const grid = agGrid.createGrid(gridElement, gridOptions);
    if (config.manualFilterApply) {
      grid.applyPendingFloatingFilters = () => {
        if (!Array.isArray(grid.__manualFloatingFilters)) return;
        // Apply a snapshot because applying a filter can refresh the grid and mutate/destroy
        // floating filter components, which would otherwise skip later filters in the live array.
        const pendingFilters = [...grid.__manualFloatingFilters];
        pendingFilters.forEach((f) => {
          if (f && typeof f.apply === 'function') {
            f.apply();
          }
        });
      };
    }
    this.bindAutoFit(grid, gridElement, config);
    return grid;
  },

  setupDataSource(gridApi, config) {
    const dataSource = {
      rowCount: null,
      getRows: (params) => {
        if (gridApi.__isUpdatingPageSize) {
          params.failCallback();
          return;
        }

        const pageSize = params.endRow - params.startRow;
        const pageNum = Math.floor(params.startRow / (pageSize || config.pageSize || 10));

        let apiUrl = config.apiEndpoint
          .replace('{page}', pageNum)
          .replace('{pageSize}', pageSize);

        const urlParams = new URLSearchParams();

        // Support both parameter formats
        // Format 1: pageNum, pageLimit, sort, direction (standard)
        // Format 2: page, size, sortBy, sortDirection (Spring default)
        const useSpringFormat = config.useSpringPagination || false;
        const springPageParam = config.springPageParam || 'page';
        const springPageSizeParam = config.springPageSizeParam || 'size';
        const springSortByParam = config.springSortByParam || 'sortBy';
        const springSortDirectionParam = config.springSortDirectionParam || 'sortDirection';

        if (useSpringFormat) {
          urlParams.append(springPageParam, pageNum);
          urlParams.append(springPageSizeParam, pageSize);
        } else {
          urlParams.append('pageNum', pageNum);
          urlParams.append('pageLimit', pageSize);
        }

        if (params.sortModel && params.sortModel.length > 0) {
          const sortModel = params.sortModel[0];
          const sortFieldMap = config.sortFieldMap || {};
          const sortField = sortFieldMap[sortModel.colId] || sortModel.colId;
          if (useSpringFormat) {
            urlParams.append(springSortByParam, sortField);
            urlParams.append(springSortDirectionParam, sortModel.sort.toUpperCase());
          } else {
            urlParams.append('sort', sortField);
            urlParams.append('direction', sortModel.sort.toUpperCase());
          }
        }

        // Add filters with operator support and parse operators from text
        if (params.filterModel) {
          let invalidFilterMessage = null;

          Object.keys(params.filterModel).forEach(field => {
            if (invalidFilterMessage) return;
            const filter = params.filterModel[field];
            console.log('Processing field:', field, 'filter:', filter);
            if (filter.filter !== undefined && filter.filter !== null && filter.filter !== '') {
              let value = filter.filter;
              let operator = filter.type;

              // Parse operator from text if user typed it
              if (typeof value === 'string') {
                const parsedInput = this.parseTextFilterInput(value, operator || 'contains');
                if (parsedInput.isInvalid) {
                  invalidFilterMessage = `${field}: ${parsedInput.invalidReason}`;
                  return;
                }

                value = parsedInput.value;
                operator = parsedInput.operator;
              }

              if (operator === 'blank' || operator === 'notBlank') {
                urlParams.append(field, '');
                urlParams.append(field + '_op', operator);
              } else {
                urlParams.append(field, value);
                if (operator) {
                  urlParams.append(field + '_op', operator);
                  console.log('SENDING:', field, '=', value, '&', field + '_op', '=', operator);
                } else {
                  console.log('SENDING:', field, '=', value, '(no operator)');
                }
              }
            }
          });

          if (invalidFilterMessage) {
            this.showFilterValidationMessage(invalidFilterMessage);
            params.failCallback();
            return;
          }
        }

        const queryString = urlParams.toString();
        if (queryString) {
          apiUrl += (apiUrl.includes('?') ? '&' : '?') + queryString;
        }

        console.log(`Fetching data from: ${apiUrl}`);

        fetch(apiUrl)
          .then(response => response.json())
          .then(data => {
            console.log('API Response:', data);

            let rows = [];
            let lastRow = -1;

            // Support multiple response formats
            // Format 1: {data: [...], total: 123} (standard)
            // Format 2: {content: [...], totalElements: 123} (Spring Page)
            // Format 3: {status: 'SUCCESS', data: {content: [...], totalElements: 123}, errors: []}
            if (data && data.data && data.data.content) {
              // Nested Spring page inside wrapper data object
              rows = Array.isArray(data.data.content) ? data.data.content : [data.data.content];

              if (config.dataTransformer) {
                rows = rows.map(config.dataTransformer);
              }

              if (config.columns.some(col => col.dataMapping)) {
                rows = rows.map(row => this.mapRowData(row, config.columns));
              }

              if (data.data.totalElements !== undefined) {
                lastRow = data.data.totalElements;
              } else if (rows.length < pageSize) {
                lastRow = params.startRow + rows.length;
              }
            } else if (data && data.data) {
              // Standard format
              rows = Array.isArray(data.data) ? data.data : [data.data];

              if (config.dataTransformer) {
                rows = rows.map(config.dataTransformer);
              }

              if (config.columns.some(col => col.dataMapping)) {
                rows = rows.map(row => this.mapRowData(row, config.columns));
              }

              if (data.total !== undefined) {
                lastRow = data.total;
              } else if (rows.length < pageSize) {
                lastRow = params.startRow + rows.length;
              }
            } else if (data && data.content) {
              // Spring Page format
              rows = Array.isArray(data.content) ? data.content : [data.content];

              if (config.dataTransformer) {
                rows = rows.map(config.dataTransformer);
              }

              if (config.columns.some(col => col.dataMapping)) {
                rows = rows.map(row => this.mapRowData(row, config.columns));
              }

              if (data.totalElements !== undefined) {
                lastRow = data.totalElements;
              } else if (rows.length < pageSize) {
                lastRow = params.startRow + rows.length;
              }
            } else {
              lastRow = params.startRow;
            }

            params.successCallback(rows, lastRow);
            console.log('lastRow: ', lastRow);
          })
          .catch(error => {
            console.error('Error fetching data:', error);
            params.failCallback();
          });
      }
    };

    gridApi.setGridOption('datasource', dataSource);
  },

  mapRowData(row, columns) {
    const mappedRow = { ...row };
    columns.forEach(col => {
      if (col.dataMapping && row[col.dataMapping] !== undefined) {
        mappedRow[col.field] = row[col.dataMapping];
        if (col.dataMapping !== col.field) {
          delete mappedRow[col.dataMapping];
        }
      }
    });
    return mappedRow;
  },

  createMultipleGrids(configs) {
    return configs.map(config => this.createGrid(config));
  }
};

window.DynamicGrid = DynamicGrid;