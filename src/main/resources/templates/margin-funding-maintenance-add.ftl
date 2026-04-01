<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Margin Funding Item Maintenance - Add</title>
  <#assign ctx = (request.contextPath)!"" />
  <link rel="stylesheet" href="${ctx}/css/app.css">
  <link rel="stylesheet" href="${ctx}/css/grid.css">
  <link rel="stylesheet" href="${ctx}/css/grid-manager.css">
  <link rel="stylesheet" href="${ctx}/css/grid-page.css">
  <link rel="stylesheet" href="${ctx}/css/action-toolbar.css">
  <link rel="stylesheet" href="${ctx}/css/page-toast.css">
  <link rel="stylesheet" href="${ctx}/css/screen-shared.css">
  <link rel="stylesheet" href="${ctx}/css/screen-add-shared.css">
  <link rel="stylesheet" href="${ctx}/css/bulk-upload-modal.css">
  <link rel="stylesheet" href="${ctx}/css/bulk-upload-flow.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-grid.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-theme-alpine.css">

  <script>
    window.API_BASE_URL = window.API_BASE_URL || '${(apiBaseUrl!'')?js_string}';
    window.GRID_PREF_TEST_USER_ID = window.GRID_PREF_TEST_USER_ID || '${(userId!'defaultUser')?js_string}';
    window.MFI_LIST_PAGE_URL = window.MFI_LIST_PAGE_URL || '${ctx}/margin-funding-maintenance';
    window.MFI_ENTITY_NAME = window.MFI_ENTITY_NAME || 'distribution-fee-item-attribute';
    window.GRID_PREF_SCREEN_ID_BY_GRID = Object.assign({}, window.GRID_PREF_SCREEN_ID_BY_GRID, {
      mfiMaintenanceAddGrid: 'id_margin_funding_item_maintenance_add'
    });
  </script>

  <script src="${ctx}/js/sidebar.js" defer></script>
  <script src="${ctx}/js/dynamic-grid.js" defer></script>
  <script src="${ctx}/js/community-grid-paste.js" defer></script>
  <script src="${ctx}/js/grid-manager.js" defer></script>
  <script src="${ctx}/js/grid-toolbar.js" defer></script>
  <script src="${ctx}/js/page-toast.js" defer></script>
  <script src="${ctx}/js/bulk-upload-modal.js" defer></script>
  <script src="${ctx}/js/bulk-upload-flow.js" defer></script>
  <script src="${ctx}/js/csv-upload-utils.js" defer></script>
  <script src="${ctx}/js/grid-filter-operator-utils.js" defer></script>
  <script src="${ctx}/js/margin-funding-maintenance-add.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/dist/ag-grid-community.min.js"></script>
</head>
<body class="mfi-page screen-page screen-add-page">
  <#include "/components/header.ftl">
  <#import "/components/sidebar.ftl" as sidebar>
  <#import "/components/page-header.ftl" as pageHeader>
  <#import "/components/grid-manager-macro.ftl" as gridManager>
  <#import "/components/action-toolbar.ftl" as actionToolbar>
  <#import "/components/grid-view-actions.ftl" as gridViewActions>

  <input type="hidden" id="currentUserId" value="${userId!'defaultUser'}" />

  <div class="app-shell">
    <@sidebar.navigation currentPath="/margin-funding-maintenance/add" />

    <main class="content">
      <div class="content-card">
        <@pageHeader.render
          title="Margin Funding Item Maintenance"
          crumbs=[{"label":"Home","href":"${ctx}/"},{"label":"Margin Funding Item Maintenance","href":"${ctx}/margin-funding-maintenance"},{"label":"Add"}]
        />

        <#assign iconBack><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6L9 12L15 18" /></svg></#assign>
        <#assign iconDelete><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6H19M9 6V4H15V6M8 6V19H16V6" /></svg></#assign>
        <#assign iconSubmit><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12L12 5L19 12" /></svg></#assign>
        <#assign iconExecute><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20L16.5 16.5" /></svg></#assign>
        <#assign actionItems=[
          {"id":"back","label":"Back","iconOnly":true,"className":"icon-only is-back","iconHtml":iconBack},
          {"id":"delete","label":"Delete","iconHtml":iconDelete},
          {"id":"submit","label":"Submit","iconHtml":iconSubmit},
          {"id":"execute","label":"Execute","iconHtml":iconExecute}
        ] />

        <@actionToolbar.render actions=actionItems toolbarLabel="Margin funding item maintenance add actions" rightSectionLabel="Grid manager view actions">
          <@gridManager.gridManager />
          <@gridViewActions.render defaultDensity="compact" showDownload=false />
        </@actionToolbar.render>

        <section class="bulk-upload-batch-section is-collapsed" aria-label="Margin funding item maintenance upload jobs">
          <div class="bulk-upload-batch-info-row">
            <div class="bulk-upload-batch-info-left">
              <span class="bulk-upload-batch-info-icon" aria-hidden="true">i</span>
              <span class="bulk-upload-batch-info-text">You have [0] batches to review.</span>
            </div>
            <button type="button" class="bulk-upload-batch-collapse-btn" id="bulkUploadBatchCollapseBtn" aria-label="Expand unfinished uploads" aria-expanded="false">
              <svg viewBox="0 0 20 20" aria-hidden="true" class="bulk-upload-batch-chevron">
                <path d="M5 7.5L10 12.5L15 7.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
          <div id="bulkUploadBatchGrid" class="bulk-upload-batch-grid">
            <div class="bulk-upload-batch-columns" aria-hidden="true">
              <span class="bulk-upload-batch-col">Job ID</span>
              <span class="bulk-upload-batch-col">
                <span class="bulk-upload-batch-header-help">
                  <span>Status</span>
                  <span class="bulk-upload-batch-help">
                    <button
                      type="button"
                      class="bulk-upload-batch-help-btn"
                      aria-label="Status refresh help"
                      aria-describedby="mfiItemBatchRefreshHelp"
                    >?</button>
                    <span id="mfiItemBatchRefreshHelp" class="bulk-upload-batch-help-tooltip" role="tooltip">
                      Job status does not refresh automatically. Refresh the page to see the latest status.
                    </span>
                  </span>
                </span>
              </span>
              <span class="bulk-upload-batch-col">Total Rows</span>
              <span class="bulk-upload-batch-col">Processed</span>
              <span class="bulk-upload-batch-col">Success</span>
              <span class="bulk-upload-batch-col">Error</span>
              <span class="bulk-upload-batch-col">Program ID</span>
              <span class="bulk-upload-batch-col">Work Stn ID</span>
              <span class="bulk-upload-batch-col">Created At</span>
              <span class="bulk-upload-batch-col">Updated At</span>
              <span class="bulk-upload-batch-col">Remove</span>
            </div>
            <div id="bulkUploadBatchTableBody" class="bulk-upload-batch-list" role="list" aria-label="Margin funding item maintenance upload jobs"></div>
          </div>
        </section>

        <section class="screen-add-upload-row">
          <button type="button" class="screen-add-bulk-upload-btn" data-action="bulk-upload">Bulk Upload</button>
        </section>

        <section class="screen-add-status-row" id="screenAddUploadStatusRow" hidden>
          <label class="screen-add-status-option">
            <input type="radio" name="mfcUploadStatus" value="all" checked />
            <span>All</span>
          </label>
          <label class="screen-add-status-option">
            <input type="radio" name="mfcUploadStatus" value="success" />
            <span>Success</span>
          </label>
          <label class="screen-add-status-option">
            <input type="radio" name="mfcUploadStatus" value="error" />
            <span>Error</span>
          </label>
        </section>

        <section class="grid-wrapper">
          <div id="mfiMaintenanceAddGrid" class="ag-theme-alpine app-grid screen-grid"></div>
        </section>
      </div>
    </main>
  </div>

  <div class="bulk-upload-modal" id="bulkUploadModal" hidden aria-hidden="true">
    <div class="bulk-upload-backdrop" data-bulk-close></div>
    <section class="bulk-upload-dialog" role="dialog" aria-modal="true" aria-labelledby="bulkUploadTitle">
      <header class="bulk-upload-header">
        <div>
          <h2 id="bulkUploadTitle">Bulk Upload</h2>
          <p>Add your document here.</p>
        </div>
        <button type="button" class="bulk-upload-close" aria-label="Close bulk upload" data-bulk-close>×</button>
      </header>

      <input id="bulkUploadInput" type="file" accept=".csv,text/csv" hidden />

      <div class="bulk-upload-dropzone" id="bulkUploadDropzone">
        <div class="bulk-upload-icon" aria-hidden="true">⬆</div>
        <p class="bulk-upload-main-text">Drag your file(s) to start uploading</p>
        <p class="bulk-upload-or">OR</p>
        <button type="button" class="bulk-upload-browse-btn" id="bulkUploadBrowseBtn">Browse files</button>
      </div>

      <p class="bulk-upload-help">Only support .csv files</p>
      <p class="bulk-upload-error" id="bulkUploadError" hidden>Please upload a valid .csv file.</p>
      <div class="bulk-upload-file-card" id="bulkUploadFileCard" hidden>
        <div class="bulk-upload-file-icon" aria-hidden="true">CSV</div>
        <div class="bulk-upload-file-meta">
          <p class="bulk-upload-file-name" id="bulkUploadSelectedFile"></p>
          <p class="bulk-upload-file-size" id="bulkUploadFileSize"></p>
        </div>
        <button type="button" class="bulk-upload-file-remove" id="bulkUploadFileRemoveBtn" aria-label="Remove selected file">×</button>
      </div>

      <footer class="bulk-upload-footer">
        <button type="button" class="bulk-upload-cancel-btn" data-bulk-close>Cancel</button>
        <button type="button" class="bulk-upload-next-btn" id="bulkUploadNextBtn">Upload</button>
      </footer>
    </section>
  </div>

  <@gridManager.preferenceModal />
</body>
</html>
