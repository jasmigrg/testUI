<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pricing Engine Batch</title>
  <#assign ctx = (request.contextPath)!"" />
  <link rel="stylesheet" href="${ctx}/css/app.css">
  <link rel="stylesheet" href="${ctx}/css/grid.css">
  <link rel="stylesheet" href="${ctx}/css/grid-manager.css">
  <link rel="stylesheet" href="${ctx}/css/grid-page.css">
  <link rel="stylesheet" href="${ctx}/css/action-toolbar.css">
  <link rel="stylesheet" href="${ctx}/css/page-toast.css">
  <link rel="stylesheet" href="${ctx}/css/screen-shared.css">
  <link rel="stylesheet" href="${ctx}/css/bulk-upload-modal.css">
  <link rel="stylesheet" href="${ctx}/css/bulk-upload-flow.css">
  <link rel="stylesheet" href="${ctx}/css/pricing-engine-batch.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-grid.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-theme-alpine.css">

  <script>
    window.GRID_PREF_TEST_USER_ID = window.GRID_PREF_TEST_USER_ID || '${(userId!'defaultUser')?js_string}';
    window.GRID_PREF_SCREEN_ID_BY_GRID = Object.assign({}, window.GRID_PREF_SCREEN_ID_BY_GRID, {
      pricingEngineBatchGrid: 'id_pricing_engine_batch',
      pricingEngineBatchBatchGrid: 'id_pricing_engine_batch_add'
    });
  </script>

  <script src="${ctx}/js/sidebar.js" defer></script>
  <script src="${ctx}/js/dynamic-grid.js" defer></script>
  <script src="${ctx}/js/community-grid-paste.js" defer></script>
  <script src="${ctx}/js/grid-manager.js" defer></script>
  <script src="${ctx}/js/grid-toolbar.js" defer></script>
  <script src="${ctx}/js/page-toast.js" defer></script>
  <script src="${ctx}/js/bulk-upload-modal.js" defer></script>
  <script src="${ctx}/js/pricing-engine-batch.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/dist/ag-grid-community.min.js"></script>
</head>
<body class="mfi-page screen-page pricing-engine-batch-page">
  <#include "/components/header.ftl">
  <#import "/components/sidebar.ftl" as sidebar>
  <#import "/components/page-header.ftl" as pageHeader>
  <#import "/components/grid-manager-macro.ftl" as gridManager>
  <#import "/components/action-toolbar.ftl" as actionToolbar>
  <#import "/components/grid-view-actions.ftl" as gridViewActions>

  <div class="app-shell">
    <@sidebar.navigation currentPath="/pricing-engine-batch" />

    <main class="content">
      <div class="content-card">
        <@pageHeader.render
          title="Pricing Engine Batch"
          crumbs=[{"label":"Home","href":"${ctx}/"},{"label":"Pricing"},{"label":"Pricing Engine Batch"}]
        />

        <#assign iconBack><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6L9 12L15 18" /></svg></#assign>
        <#assign iconAdd><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V19M5 12H19" /></svg></#assign>
        <#assign iconHeart><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20L4.7 12.7A4.8 4.8 0 1 1 11.5 5.9L12 6.4L12.5 5.9A4.8 4.8 0 1 1 19.3 12.7L12 20Z" /></svg></#assign>
        <#assign iconDelete><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6H19M9 6V4H15V6M8 6V19H16V6" /></svg></#assign>
        <#assign iconSubmit><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12L12 5L19 12" /></svg></#assign>
        <#assign iconRefresh><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12A8 8 0 1 1 17.6 6.2" /><path d="M20 4V10H14" /></svg></#assign>
        <#assign iconExecute><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20L16.5 16.5" /></svg></#assign>
        <#assign actionItems=[
          {"id":"back","label":"Back","iconOnly":true,"className":"icon-only is-back","iconHtml":iconBack},
          {"id":"add","label":"Add","iconOnly":true,"className":"icon-only is-add","iconHtml":iconAdd},
          {"id":"favorite","label":"Favorite","iconOnly":true,"className":"icon-only has-divider","iconHtml":iconHeart},
          {"id":"refresh","label":"Refresh","className":"peb-grid-action","iconHtml":iconRefresh},
          {"id":"execute","label":"Execute","className":"peb-grid-action","iconHtml":iconExecute}
        ] />
        <#assign batchActionItems=[
          {"id":"batch-back","label":"Back","iconOnly":true,"className":"icon-only is-back","iconHtml":iconBack},
          {"id":"batch-delete","label":"Delete","iconHtml":iconDelete},
          {"id":"batch-submit","label":"Submit","iconHtml":iconSubmit},
          {"id":"batch-execute","label":"Execute","iconHtml":iconExecute}
        ] />
        <div id="pricingEngineBatchMainToolbar">
          <@actionToolbar.render actions=actionItems toolbarLabel="Pricing Engine Batch actions" showRightSection=false />
        </div>
        <div id="pricingEngineBatchBatchToolbar" hidden>
          <@actionToolbar.render actions=batchActionItems toolbarLabel="Pricing Engine Batch bulk upload actions" showRightSection=false />
        </div>

        <section class="peb-top-layout" aria-label="Pricing engine batch request summary">
          <section class="peb-card peb-request-card" aria-labelledby="newPricingRequestTitle">
            <h2 id="newPricingRequestTitle" class="peb-card-title">New Pricing Request</h2>

            <div class="peb-request-row peb-request-row--full">
              <div class="peb-step-label">Step 1</div>
              <button type="button" class="peb-pill-btn peb-pill-btn--wide" data-open-modal="import">Import Customer &amp; Item Info</button>
              <div class="peb-or-label">Or</div>
              <button type="button" class="peb-pill-btn peb-pill-btn--wide" data-open-modal="load">Load Customer &amp; Item Info</button>
              <div class="peb-step-label">Step 2</div>
              <button type="button" class="peb-pill-btn peb-mode-btn" data-mode="Interactive">Interactive</button>
              <div class="peb-or-label">Or</div>
              <button type="button" class="peb-pill-btn peb-mode-btn is-active" data-mode="Batch">Batch</button>
            </div>
          </section>

          <section class="peb-card peb-search-card" aria-labelledby="searchExistingRequestTitle">
            <h2 id="searchExistingRequestTitle" class="peb-card-title">Search Existing Request</h2>

            <div class="peb-search-rows">
              <div class="peb-search-row peb-search-row--top">
                <label class="peb-inline-field">
                  <span>Job Number</span>
                  <input id="pebJobNumber" type="text" autocomplete="off" />
                </label>

                <label class="peb-inline-field">
                  <span>PE Processing Mode</span>
                  <input id="pebProcessingMode" type="text" readonly />
                </label>
              </div>

              <div class="peb-search-row peb-search-row--bottom">
                <label class="peb-inline-field peb-inline-field--description">
                  <span>Description</span>
                  <input id="pebDescription" type="text" autocomplete="off" readonly />
                </label>

                <div class="peb-search-sidegroup">
                  <span class="peb-report-output-label">Report Output</span>
                  <input id="pebReportOutput" class="peb-report-output-checkbox" type="checkbox" checked />

                  <span class="peb-output-type-label">Output Type</span>
                  <input id="pebOutputType" class="peb-output-type-input" type="text" readonly />
                </div>
              </div>
            </div>
          </section>
        </section>

        <section class="peb-grid-topbar" id="pricingEngineBatchSharedTopbar" hidden aria-label="Grid manager view actions">
          <div class="gt-grid-manager-tools">
            <@gridManager.gridManager />
            <@gridViewActions.render defaultDensity="compact" />
          </div>
        </section>

        <section class="peb-results-shell" id="pricingEngineBatchResults" hidden aria-label="Pricing engine batch results">
          <section class="grid-wrapper">
            <div id="pricingEngineBatchGrid" class="ag-theme-alpine app-grid screen-grid"></div>
          </section>
        </section>

        <section class="peb-batch-shell" id="pricingEngineBatchBatchShell" hidden aria-label="Pricing engine batch bulk upload">
          <section class="bulk-upload-batch-section is-collapsed" id="pricingEngineBatchAccordion" aria-label="Pricing engine batch upload jobs">
            <div class="bulk-upload-batch-info-row">
              <div class="bulk-upload-batch-info-left">
                <span class="bulk-upload-batch-info-icon" aria-hidden="true">i</span>
                <span class="bulk-upload-batch-info-text">You have [0] batches to review.</span>
              </div>
              <button
                type="button"
                class="bulk-upload-batch-collapse-btn"
                id="pricingEngineBatchCollapseBtn"
                aria-label="Expand unfinished uploads"
                aria-expanded="false"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true" class="bulk-upload-batch-chevron">
                  <path d="M5 7.5L10 12.5L15 7.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>
            <div id="pricingEngineBatchBatchReviewGrid" class="bulk-upload-batch-grid">
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
                        aria-describedby="pricingEngineBatchBatchRefreshHelp"
                      >?</button>
                      <span id="pricingEngineBatchBatchRefreshHelp" class="bulk-upload-batch-help-tooltip" role="tooltip">
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
              <div class="bulk-upload-batch-list" role="list" aria-label="Pricing engine batch upload jobs">
                <div class="bulk-upload-batch-empty">No unfinished uploads.</div>
              </div>
            </div>
          </section>

          <section class="screen-add-upload-row peb-screen-add-upload-row">
            <button type="button" class="screen-add-bulk-upload-btn" data-action="bulk-upload">Bulk Upload</button>
          </section>

          <section class="screen-add-status-row peb-screen-add-status-row" id="pricingEngineBatchStatusRow" aria-label="Upload row status filters">
            <label class="screen-add-status-option">
              <input type="radio" name="pricingEngineBatchUploadStatus" value="all" checked />
              <span>All</span>
            </label>
            <label class="screen-add-status-option">
              <input type="radio" name="pricingEngineBatchUploadStatus" value="success" />
              <span>Success</span>
            </label>
            <label class="screen-add-status-option">
              <input type="radio" name="pricingEngineBatchUploadStatus" value="error" />
              <span>Error</span>
            </label>
          </section>

          <section class="grid-wrapper peb-batch-grid-wrapper">
            <div id="pricingEngineBatchBatchGrid" class="ag-theme-alpine app-grid screen-grid"></div>
          </section>
        </section>
      </div>
    </main>
  </div>

  <div id="pricingEngineBatchModal" class="peb-modal" hidden aria-hidden="true">
    <div class="peb-modal__backdrop" data-modal-close="true"></div>
    <section class="peb-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="pricingEngineBatchModalTitle">
      <div class="peb-modal__header">
        <h2 id="pricingEngineBatchModalTitle" class="peb-modal__title">Import Customer and Item Info</h2>
        <button type="button" class="peb-modal__close" aria-label="Close dialog" data-modal-close="true">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6L18 18M18 6L6 18" /></svg>
        </button>
      </div>

      <div class="peb-modal__grid">
        <div class="peb-modal__column peb-modal__column--left">
          <label class="peb-modal-field">
            <span>Job Number</span>
            <input id="pebModalJobNumber" type="text" readonly />
          </label>

          <label class="peb-modal-field">
            <span>Description</span>
            <input id="pebModalDescription" type="text" />
          </label>

          <label class="peb-modal-field">
            <span>PE Processing Mode</span>
            <input id="pebModalProcessingMode" type="text" />
          </label>
        </div>

        <div class="peb-modal__column peb-modal__column--right">
          <div class="peb-modal-side-row peb-modal-side-row--top">
            <label class="peb-modal-inline-field peb-modal-inline-field--small">
              <span>Report Output</span>
              <input id="pebModalReportOutput" type="text" />
            </label>

            <label class="peb-modal-inline-field peb-modal-inline-field--small">
              <span>Output Type</span>
              <input id="pebModalOutputType" type="text" />
            </label>
          </div>

          <label class="peb-modal-inline-field peb-modal-inline-field--wide">
            <span>Processed</span>
            <input id="pebModalProcessed" type="text" value="Pending" />
          </label>

          <label class="peb-modal-inline-field peb-modal-inline-field--wide">
            <span>Record Count</span>
            <input id="pebModalRecordCount" type="text" readonly />
          </label>
        </div>
      </div>

      <label class="peb-inline-check peb-inline-check--retrieve" for="pebModalRetrieveQbc">
        <input id="pebModalRetrieveQbc" type="checkbox" />
        <span>Retrieve QBC scale matching input quantity</span>
      </label>

      <div class="peb-modal__actions">
        <button type="button" class="peb-secondary-btn" data-modal-close="true">Cancel</button>
        <button type="button" class="peb-primary-btn" id="pricingEngineBatchModalSubmit">Import</button>
      </div>
    </section>
  </div>

  <div class="bulk-upload-modal" id="pricingEngineBatchBulkUploadModal" hidden aria-hidden="true">
    <div class="bulk-upload-backdrop" data-bulk-close></div>
    <section class="bulk-upload-dialog" role="dialog" aria-modal="true" aria-labelledby="pricingEngineBatchBulkUploadTitle">
      <header class="bulk-upload-header">
        <div>
          <h2 id="pricingEngineBatchBulkUploadTitle">Bulk Upload</h2>
          <p>Add your document here.</p>
        </div>
        <button type="button" class="bulk-upload-close" aria-label="Close bulk upload" data-bulk-close>×</button>
      </header>

      <input id="pricingEngineBatchBulkUploadInput" type="file" accept=".csv,text/csv" hidden />

      <div class="bulk-upload-dropzone" id="pricingEngineBatchBulkUploadDropzone">
        <div class="bulk-upload-icon" aria-hidden="true">⬆</div>
        <p class="bulk-upload-main-text">Drag your file(s) to start uploading</p>
        <p class="bulk-upload-or">OR</p>
        <button type="button" class="bulk-upload-browse-btn" id="pricingEngineBatchBulkUploadBrowseBtn">Browse files</button>
      </div>

      <p class="bulk-upload-help">Only support .csv files</p>
      <p class="bulk-upload-error" id="pricingEngineBatchBulkUploadError" hidden>Please upload a valid .csv file.</p>
      <div class="bulk-upload-file-card" id="pricingEngineBatchBulkUploadFileCard" hidden>
        <div class="bulk-upload-file-icon" aria-hidden="true">CSV</div>
        <div class="bulk-upload-file-meta">
          <p class="bulk-upload-file-name" id="pricingEngineBatchBulkUploadSelectedFile"></p>
          <p class="bulk-upload-file-size" id="pricingEngineBatchBulkUploadFileSize"></p>
        </div>
        <button type="button" class="bulk-upload-file-remove" id="pricingEngineBatchBulkUploadFileRemoveBtn" aria-label="Remove selected file">×</button>
      </div>

      <footer class="bulk-upload-footer">
        <button type="button" class="bulk-upload-cancel-btn" data-bulk-close>Cancel</button>
        <button type="button" class="bulk-upload-next-btn" id="pricingEngineBatchBulkUploadNextBtn">Upload</button>
      </footer>
    </section>
  </div>

  <@gridManager.preferenceModal />
</body>
</html>
