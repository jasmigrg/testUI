const CamsEligibilityManager = {
  gridApi: null,

  init() {
    const gridConfig = {
      gridElementId: 'camsEligibilityGrid',
      apiEndpoint: '/cams-eligible/api/paginated',
      pageSize: 20,
      floatingFilter: true,
      paginationType: 'server',
      useSpringPagination: true,
      gridOptions: {
        defaultColDef: {
          sortable: true,
          filterParams: {
            buttons: ['apply', 'reset'],
            closeOnApply: true
          }
        }
      },
      columns: [
        {
          field: 'uniqueKeyId',
          headerName: 'Unique Key ID',
          flex: 1,
          minWidth: 150,
          hide: true
        },
        {
          field: 'mckessonContractId',
          headerName: 'McKesson Contract ID',
          flex: 1,
          minWidth: 180
        },
        {
          field: 'contractTierNumber',
          headerName: 'Contract Tier Number',
          flex: 1,
          minWidth: 180
        },
        {
          field: 'effectiveFromDate',
          headerName: 'Effective From Date',
          flex: 1,
          minWidth: 180,
          filterParams: {
            filterOptions: ['equals', 'notEqual', 'lessThan', 'greaterThan', 'lessThanOrEqual', 'greaterThanOrEqual'],
            filterPlaceholder: 'mm/dd/yyyy'
          }
        },
        {
          field: 'effectiveDate',
          headerName: 'Effective Date',
          flex: 1,
          minWidth: 150,
          filterParams: {
            filterOptions: ['equals', 'notEqual', 'lessThan', 'greaterThan', 'lessThanOrEqual', 'greaterThanOrEqual'],
            filterPlaceholder: 'mm/dd/yyyy'
          }
        },
        {
          field: 'terminationDate',
          headerName: 'Termination Date',
          flex: 1,
          minWidth: 160,
          filterParams: {
            filterOptions: ['equals', 'notEqual', 'lessThan', 'greaterThan', 'lessThanOrEqual', 'greaterThanOrEqual'],
            filterPlaceholder: 'mm/dd/yyyy'
          }
        },
        {
          field: 'mckessonEndDate',
          headerName: 'McKesson End Date',
          flex: 1,
          minWidth: 170,
          filterParams: {
            filterOptions: ['equals', 'notEqual', 'lessThan', 'greaterThan', 'lessThanOrEqual', 'greaterThanOrEqual'],
            filterPlaceholder: 'mm/dd/yyyy'
          }
        },
        {
          field: 'state',
          headerName: 'State',
          flex: 1,
          minWidth: 100
        },
        {
          field: 'gpoNumber',
          headerName: 'GPO Number',
          flex: 1,
          minWidth: 140
        },
        {
          field: 'addDate',
          headerName: 'Add Date',
          flex: 1,
          minWidth: 130,
          filterParams: {
            filterOptions: ['equals', 'notEqual', 'lessThan', 'greaterThan', 'lessThanOrEqual', 'greaterThanOrEqual'],
            filterPlaceholder: 'mm/dd/yyyy'
          }
        },
        {
          field: 'gpoProgramNum',
          headerName: 'GPO Program Number',
          flex: 1,
          minWidth: 190
        },
        {
          field: 'gpoProgramSubNum',
          headerName: 'GPO Program Sub Number',
          flex: 1,
          minWidth: 220
        },
        {
          field: 'gpoClassOfTradeNum',
          headerName: 'GPO Class of Trade Number',
          flex: 1,
          minWidth: 230
        },
        {
          field: 'poolTypeNo',
          headerName: 'Pool Type Number',
          flex: 1,
          minWidth: 170
        },
        {
          field: 'poolId',
          headerName: 'Pool ID',
          flex: 1,
          minWidth: 120
        },
        {
          field: 'reportCodeAddBook01',
          headerName: 'Category Code - Address Book 01',
          flex: 1,
          minWidth: 250
        },
        {
          field: 'reportCodeAddBook02',
          headerName: 'Category Code - Address Book 02',
          flex: 1,
          minWidth: 250
        },
        {
          field: 'reportCodeAddBook06',
          headerName: 'Category Code - Address Book 06',
          flex: 1,
          minWidth: 250
        },
        {
          field: 'documentControlNumber',
          headerName: 'Document Control Number',
          flex: 1,
          minWidth: 220
        },
        {
          field: 'ediSuccessfullyProcess',
          headerName: 'EDI Successfully Process',
          flex: 1,
          minWidth: 200
        },
        {
          field: 'includeExclude',
          headerName: 'Include/Exclude',
          flex: 1,
          minWidth: 150
        },
        {
          field: 'deaLicenseNumber',
          headerName: 'DEA License Number',
          flex: 1,
          minWidth: 180
        },
        {
          field: 'userId',
          headerName: 'User ID',
          flex: 1,
          minWidth: 120
        },
        {
          field: 'programId',
          headerName: 'Program ID',
          flex: 1,
          minWidth: 130
        },
        {
          field: 'workStationId',
          headerName: 'Work Station ID',
          flex: 1,
          minWidth: 160
        },
        {
          field: 'updatedAt',
          headerName: 'Updated At',
          flex: 1,
          minWidth: 180,
          filterParams: {
            filterOptions: ['equals', 'notEqual', 'lessThan', 'greaterThan', 'lessThanOrEqual', 'greaterThanOrEqual'],
            filterPlaceholder: 'mm/dd/yyyy'
          }
        }
      ]
    };

    this.gridApi = DynamicGrid.createGrid(gridConfig);

    window.gridApi = this.gridApi;

    setTimeout(() => {
      if (window.gridApi && typeof GridManager !== 'undefined') {
        GridManager.init(window.gridApi, 'camsEligibilityGrid');
      }
    }, 500);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  CamsEligibilityManager.init();
});
