<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Manage UOM Diff Input and View Input Data</title>
  <#assign ctx = (request.contextPath)!"" />
  <link rel="stylesheet" href="${ctx}/css/app.css">
  <link rel="stylesheet" href="${ctx}/css/grid.css">
  <link rel="stylesheet" href="${ctx}/css/grid-manager.css">
  <link rel="stylesheet" href="${ctx}/css/grid-page.css">
  <link rel="stylesheet" href="${ctx}/css/action-toolbar.css">
  <link rel="stylesheet" href="${ctx}/css/page-toast.css">
  <link rel="stylesheet" href="${ctx}/css/screen-shared.css">
  <link rel="stylesheet" href="${ctx}/css/manage-uom-diff-input-view-input-data.css">
  <link rel="stylesheet" href="${ctx}/css/margin-funding-maintenance.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-grid.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-theme-alpine.css">

  <script>
    window.API_BASE_URL = window.API_BASE_URL || '${(apiBaseUrl!'')?js_string}';
    window.GRID_PREF_TEST_USER_ID = window.GRID_PREF_TEST_USER_ID || '${(userId!'defaultUser')?js_string}';
    window.UOM_DIFF_EXCLUSION_ADD_PAGE_URL = window.UOM_DIFF_EXCLUSION_ADD_PAGE_URL || '${ctx}/manage-uom-diff-input-view-input-data/exclusion/add';
    window.GRID_PREF_SCREEN_ID_BY_GRID = Object.assign({}, window.GRID_PREF_SCREEN_ID_BY_GRID, {
      uomDiffControlGrid: 'id_uom_diff_input_control',
      uomDiffExclusionGrid: 'id_uom_diff_input_exclusion',
      uomDiffDataMainGrid: 'id_uom_diff_input_data_main',
      uomDiffTransactionGrid: 'id_uom_diff_input_data_transaction_lvl'
    });
  </script>

  <script src="${ctx}/js/sidebar.js" defer></script>
  <script src="${ctx}/js/dynamic-grid.js" defer></script>
  <script src="${ctx}/js/grid-manager.js" defer></script>
  <script src="${ctx}/js/grid-toolbar.js" defer></script>
  <script src="${ctx}/js/page-toast.js" defer></script>
  <script src="${ctx}/js/manage-uom-diff-input-view-input-data.js" defer></script>

  <script src="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/dist/ag-grid-community.min.js"></script>
</head>
<body class="mfi-page screen-page uom-diff-page">

  <#include "/components/header.ftl">
  <#import "/components/sidebar.ftl" as sidebar>
  <#import "/components/page-header.ftl" as pageHeader>
  <#import "/components/grid-manager-macro.ftl" as gridManager>
  <#import "/components/grid-view-actions.ftl" as gridViewActions>

  <input type="hidden" id="currentUserId" value="${userId!'defaultUser'}" />

  <div class="app-shell">
    <@sidebar.navigation currentPath="/manage-uom-diff-input-view-input-data" />

    <main class="content">
      <div class="content-card">
        <@pageHeader.render
          title="Manage UOM Diff Input and View Input Data"
          crumbs=[{"label":"Home","href":"${ctx}/"},{"label":"Guidance Model Management"},{"label":"Manage UOM Diff Input and View Input Data"}]
        />

        <section class="screen-page-shell" aria-label="Manage UOM Diff Input and View Input Data">
          <div class="screen-tabs" role="tablist" aria-label="UOM Diff input tabs">
            <button
              type="button"
              class="screen-tab-btn is-active"
              id="uom-diff-tab-control"
              role="tab"
              aria-selected="true"
              aria-controls="uom-diff-panel-control"
              data-uom-diff-tab="control"
            >
              UOM Diff Input Control
            </button>
            <button
              type="button"
              class="screen-tab-btn"
              id="uom-diff-tab-exclusion"
              role="tab"
              aria-selected="false"
              aria-controls="uom-diff-panel-exclusion"
              data-uom-diff-tab="exclusion"
            >
              UOM Diff Input Exclusion
            </button>
            <button
              type="button"
              class="screen-tab-btn"
              id="uom-diff-tab-main"
              role="tab"
              aria-selected="false"
              aria-controls="uom-diff-panel-main"
              data-uom-diff-tab="main"
            >
              UOM Diff Input Data Main
            </button>
            <button
              type="button"
              class="screen-tab-btn"
              id="uom-diff-tab-transaction"
              role="tab"
              aria-selected="false"
              aria-controls="uom-diff-panel-transaction"
              data-uom-diff-tab="transaction"
            >
              UOM Diff Input Data Transaction LVL
            </button>
          </div>

          <#assign iconBack><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6L9 12L15 18" /></svg></#assign>
          <#assign iconAdd><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V19M5 12H19" /></svg></#assign>
          <#assign iconHeart><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20L4.7 12.7A4.8 4.8 0 1 1 11.5 5.9L12 6.4L12.5 5.9A4.8 4.8 0 1 1 19.3 12.7L12 20Z" /></svg></#assign>
          <#assign iconDisable><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5L19 19" /><rect x="4" y="6" width="16" height="12" rx="2" ry="2" /><path d="M9 10H15" /></svg></#assign>
          <#assign iconTermination><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" ry="2" /><path d="M8 3V7M16 3V7M7 11H17M8 15H12" /></svg></#assign>
          <#assign iconRefresh><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12A8 8 0 1 1 17.6 6.2" /><path d="M20 4V10H14" /></svg></#assign>
          <#assign iconExecute><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20L16.5 16.5" /></svg></#assign>

          <section class="gt-grid-controls">
            <div
              class="gt-action-toolbar uom-diff-tab-action-toolbar"
              role="toolbar"
              aria-label="UOM Diff input control actions"
              data-uom-diff-actions="control"
            >
              <button type="button" class="gt-action-btn icon-only is-back" aria-label="Back" data-action="back">
                ${iconBack}
              </button>
              <button type="button" class="gt-action-btn icon-only" aria-label="Favorite" data-action="favorite">
                ${iconHeart}
              </button>
              <button type="button" class="gt-action-btn" aria-label="Refresh" data-action="refresh">
                ${iconRefresh}
                <span>Refresh</span>
              </button>
              <button type="button" class="gt-action-btn" aria-label="Execute" data-action="execute">
                ${iconExecute}
                <span>Execute</span>
              </button>
            </div>

            <div
              class="gt-action-toolbar uom-diff-tab-action-toolbar"
              role="toolbar"
              aria-label="UOM Diff input exclusion actions"
              data-uom-diff-actions="exclusion"
              hidden
            >
              <button type="button" class="gt-action-btn icon-only is-back" aria-label="Back" data-action="back">
                ${iconBack}
              </button>
              <button type="button" class="gt-action-btn icon-only is-add" aria-label="Add" data-action="add">
                ${iconAdd}
              </button>
              <button type="button" class="gt-action-btn icon-only" aria-label="Favorite" data-action="favorite">
                ${iconHeart}
              </button>
              <button type="button" class="gt-action-btn" aria-label="Disable" data-action="disable">
                ${iconDisable}
                <span>Disable</span>
              </button>
              <button type="button" class="gt-action-btn" aria-label="Update Termination Date" data-action="update-termination">
                ${iconTermination}
                <span>Update Termination Date</span>
              </button>
              <button type="button" class="gt-action-btn" aria-label="Refresh" data-action="refresh">
                ${iconRefresh}
                <span>Refresh</span>
              </button>
              <button type="button" class="gt-action-btn" aria-label="Execute" data-action="execute">
                ${iconExecute}
                <span>Execute</span>
              </button>
            </div>

            <div
              class="gt-action-toolbar uom-diff-tab-action-toolbar"
              role="toolbar"
              aria-label="UOM Diff input data main actions"
              data-uom-diff-actions="main"
              hidden
            >
              <button type="button" class="gt-action-btn icon-only is-back" aria-label="Back" data-action="back">
                ${iconBack}
              </button>
              <button type="button" class="gt-action-btn icon-only" aria-label="Favorite" data-action="favorite">
                ${iconHeart}
              </button>
              <button type="button" class="gt-action-btn" aria-label="Refresh" data-action="refresh">
                ${iconRefresh}
                <span>Refresh</span>
              </button>
              <button type="button" class="gt-action-btn" aria-label="Execute" data-action="execute">
                ${iconExecute}
                <span>Execute</span>
              </button>
            </div>

            <div
              class="gt-action-toolbar uom-diff-tab-action-toolbar"
              role="toolbar"
              aria-label="UOM Diff input data transaction actions"
              data-uom-diff-actions="transaction"
              hidden
            >
              <button type="button" class="gt-action-btn icon-only is-back" aria-label="Back" data-action="back">
                ${iconBack}
              </button>
              <button type="button" class="gt-action-btn icon-only" aria-label="Favorite" data-action="favorite">
                ${iconHeart}
              </button>
              <button type="button" class="gt-action-btn" aria-label="Refresh" data-action="refresh">
                ${iconRefresh}
                <span>Refresh</span>
              </button>
              <button type="button" class="gt-action-btn" aria-label="Execute" data-action="execute">
                ${iconExecute}
                <span>Execute</span>
              </button>
            </div>

            <div class="gt-grid-manager-tools" role="toolbar" aria-label="Grid manager and view actions">
              <@gridManager.gridManager />
              <@gridViewActions.render defaultDensity="compact" />
            </div>
          </section>

          <section
            class="screen-tab-panel is-active"
            id="uom-diff-panel-control"
            role="tabpanel"
            aria-labelledby="uom-diff-tab-control"
            data-uom-diff-panel="control"
          >
            <h3 class="screen-panel-title">UOM Diff Input Control</h3>
            <section class="grid-wrapper">
              <div class="screen-grid-empty-state" id="uomDiffControlEmptyState" hidden>
                <strong>No rows to show</strong>
              </div>
              <div id="uomDiffControlGrid" class="ag-theme-alpine app-grid screen-grid"></div>
            </section>
          </section>

          <section
            class="screen-tab-panel"
            id="uom-diff-panel-exclusion"
            role="tabpanel"
            aria-labelledby="uom-diff-tab-exclusion"
            data-uom-diff-panel="exclusion"
            hidden
          >
            <h3 class="screen-panel-title">UOM Diff Input Exclusion</h3>
            <section class="grid-wrapper">
              <div class="screen-grid-empty-state" id="uomDiffExclusionEmptyState" hidden>
                <strong>No rows to show</strong>
              </div>
              <div id="uomDiffExclusionGrid" class="ag-theme-alpine app-grid screen-grid"></div>
            </section>
          </section>

          <section
            class="screen-tab-panel"
            id="uom-diff-panel-main"
            role="tabpanel"
            aria-labelledby="uom-diff-tab-main"
            data-uom-diff-panel="main"
            hidden
          >
            <h3 class="screen-panel-title">UOM Diff Input Data Main</h3>
            <section class="grid-wrapper">
              <div class="screen-grid-empty-state" id="uomDiffDataMainEmptyState" hidden>
                <strong>No rows to show</strong>
              </div>
              <div id="uomDiffDataMainGrid" class="ag-theme-alpine app-grid screen-grid"></div>
            </section>
          </section>

          <section
            class="screen-tab-panel"
            id="uom-diff-panel-transaction"
            role="tabpanel"
            aria-labelledby="uom-diff-tab-transaction"
            data-uom-diff-panel="transaction"
            hidden
          >
            <h3 class="screen-panel-title">UOM Diff Input Data Transaction LVL</h3>
            <section class="grid-wrapper">
              <div class="screen-grid-empty-state" id="uomDiffTransactionEmptyState" hidden>
                <strong>No rows to show</strong>
              </div>
              <div id="uomDiffTransactionGrid" class="ag-theme-alpine app-grid screen-grid"></div>
            </section>
          </section>
        </section>
      </div>
    </main>
  </div>

  <@gridManager.preferenceModal />

  <div id="disableRecordModal" class="mf-action-modal" hidden>
    <div class="mf-action-modal__backdrop" data-action="close-disable-modal"></div>
    <div class="mf-action-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="disableRecordModalTitle">
      <div class="mf-action-modal__header">
        <h2 id="disableRecordModalTitle" class="mf-action-modal__title">Disable Record</h2>
        <button type="button" class="mf-action-modal__close" aria-label="Close" data-action="close-disable-modal">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6L18 18M18 6L6 18" /></svg>
        </button>
      </div>
      <div id="disableRecordErrorMessage" class="mf-action-modal__error" hidden>Please enter notes to disable the selected record(s).</div>
      <div class="mf-action-modal__row">
        <label for="disableRecordNotesInput" class="mf-action-modal__label">Notes</label>
        <input id="disableRecordNotesInput" class="mf-action-modal__input" type="text" maxlength="250" required aria-required="true" />
      </div>
      <div class="mf-action-modal__actions">
        <button type="button" class="mf-action-modal__btn mf-action-modal__btn--cancel" data-action="cancel-disable-modal">Cancel</button>
        <button type="button" class="mf-action-modal__btn mf-action-modal__btn--save" data-action="save-disable-modal">Save</button>
      </div>
    </div>
  </div>

  <div id="updateTerminationDateModal" class="mf-action-modal" hidden>
    <div class="mf-action-modal__backdrop" data-action="close-update-termination-modal"></div>
    <div class="mf-action-modal__dialog mf-action-modal__dialog--update-termination" role="dialog" aria-modal="true" aria-labelledby="updateTerminationDateModalTitle">
      <div class="mf-action-modal__header">
        <h2 id="updateTerminationDateModalTitle" class="mf-action-modal__title">Update Termination Date</h2>
        <button type="button" class="mf-action-modal__close" aria-label="Close" data-action="close-update-termination-modal">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6L18 18M18 6L6 18" /></svg>
        </button>
      </div>
      <div id="updateTerminationErrorMessage" class="mf-action-modal__error mf-action-modal__error--update" hidden></div>
      <div class="mf-action-modal__row">
        <label for="updateTerminationDateInput" class="mf-action-modal__label">Termination Date</label>
        <div class="mf-action-modal__input-wrap">
          <input
            id="updateTerminationDateInput"
            class="mf-action-modal__input"
            type="text"
            inputmode="numeric"
            placeholder="mm/dd/yyyy"
            maxlength="10"
            required
            aria-required="true"
          />
          <button type="button" class="mf-action-modal__date-btn" aria-label="Open date picker" data-action="open-termination-date-picker">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 3V7M16 3V7M4 10H20" /></svg>
          </button>
          <input id="updateTerminationDateNativeInput" class="mf-action-modal__native-date" type="date" tabindex="-1" aria-hidden="true" />
        </div>
      </div>
      <div class="mf-action-modal__row">
        <label for="updateTerminationNotesInput" class="mf-action-modal__label">Notes</label>
        <input id="updateTerminationNotesInput" class="mf-action-modal__input" type="text" maxlength="250" required aria-required="true" />
      </div>
      <div class="mf-action-modal__actions">
        <button type="button" class="mf-action-modal__btn mf-action-modal__btn--cancel" data-action="cancel-update-termination-modal">Cancel</button>
        <button type="button" class="mf-action-modal__btn mf-action-modal__btn--save" data-action="save-update-termination-modal">Save</button>
      </div>
    </div>
  </div>

</body>
</html>
