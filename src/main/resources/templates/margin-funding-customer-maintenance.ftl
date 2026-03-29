<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Margin Funding Customer Maintenance</title>
  <#assign ctx = (request.contextPath)!"" />
  <link rel="stylesheet" href="${ctx}/css/app.css">
  <link rel="stylesheet" href="${ctx}/css/grid.css">
  <link rel="stylesheet" href="${ctx}/css/grid-manager.css">
  <link rel="stylesheet" href="${ctx}/css/grid-page.css">
  <link rel="stylesheet" href="${ctx}/css/action-toolbar.css">
  <link rel="stylesheet" href="${ctx}/css/page-toast.css">
  <link rel="stylesheet" href="${ctx}/css/margin-funding-customer-maintenance.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

  <!-- AG-Grid CSS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-grid.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-theme-alpine.css">

  <script>
    window.API_BASE_URL = window.API_BASE_URL || '${(apiBaseUrl!'')?js_string}';
    window.GRID_PREF_TEST_USER_ID = window.GRID_PREF_TEST_USER_ID || '${(userId!'defaultUser')?js_string}';
    window.MFC_ADD_PAGE_URL = window.MFC_ADD_PAGE_URL || '${ctx}/margin-funding-customer-maintenance/add';
    window.GRID_PREF_SCREEN_ID_BY_GRID = Object.assign({}, window.GRID_PREF_SCREEN_ID_BY_GRID, {
      mfcGrid: 'id_margin_funding_customer_maintenance'
    });
  </script>

  <script src="${ctx}/js/sidebar.js" defer></script>
  <script src="${ctx}/js/dynamic-grid.js" defer></script>
  <script src="${ctx}/js/grid-manager.js" defer></script>
  <script src="${ctx}/js/grid-toolbar.js" defer></script>
  <script src="${ctx}/js/page-toast.js" defer></script>
  <script src="${ctx}/js/margin-funding-customer-maintenance.js" defer></script>

  <!-- AG-Grid JavaScript -->
  <script src="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/dist/ag-grid-community.min.js"></script>
</head>
<body class="mfi-page">

  <#include "/components/header.ftl">
  <#import "/components/sidebar.ftl" as sidebar>
  <#import "/components/page-header.ftl" as pageHeader>
  <#import "/components/grid-manager-macro.ftl" as gridManager>
  <#import "/components/action-toolbar.ftl" as actionToolbar>
  <#import "/components/grid-view-actions.ftl" as gridViewActions>

  <input type="hidden" id="currentUserId" value="${userId!'defaultUser'}" />

  <div class="app-shell">
    <@sidebar.navigation currentPath="/margin-funding-customer-maintenance" />

    <main class="content">
      <div class="content-card">
        <@pageHeader.render
          title="Margin Funding Customer Maintenance"
          crumbs=[{"label":"Home","href":"${ctx}/"},{"label":"Margin Funding Customer Maintenance"}]
        />

        <#assign iconBack><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6L9 12L15 18" /></svg></#assign>
        <#assign iconAdd><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V19M5 12H19" /></svg></#assign>
        <#assign iconHeart><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20L4.7 12.7A4.8 4.8 0 1 1 11.5 5.9L12 6.4L12.5 5.9A4.8 4.8 0 1 1 19.3 12.7L12 20Z" /></svg></#assign>
        <#assign iconDisable><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="6" width="14" height="12" rx="2" /><path d="M9 9L15 15M15 9L9 15" /></svg></#assign>
        <#assign iconUpdate><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 3V7M16 3V7M4 10H20M8 14H12" /></svg></#assign>
        <#assign iconRefresh><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12A8 8 0 1 1 17.6 6.2" /><path d="M20 4V10H14" /></svg></#assign>
        <#assign iconExecute><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20L16.5 16.5" /></svg></#assign>
        <#assign actionItems=[
          {"id":"back","label":"Back","iconOnly":true,"className":"icon-only is-back","iconHtml":iconBack},
          {"id":"add","label":"Add","iconOnly":true,"className":"icon-only is-add","iconHtml":iconAdd},
          {"id":"favorite","label":"Favorite","iconOnly":true,"className":"icon-only has-divider","iconHtml":iconHeart},
          {"id":"disable","label":"Disable","className":"has-divider","iconHtml":iconDisable},
          {"id":"update-termination-date","label":"Update Termination Date","ariaLabel":"Update Termination Date","className":"has-divider","iconHtml":iconUpdate},
          {"id":"refresh","label":"Refresh","iconHtml":iconRefresh},
          {"id":"execute","label":"Execute","iconHtml":iconExecute}
        ] />

        <@actionToolbar.render actions=actionItems toolbarLabel="Margin funding customer actions" rightSectionLabel="Grid manager view actions">
            <@gridManager.gridManager />
            <@gridViewActions.render defaultDensity="compact" />
        </@actionToolbar.render>

        <section class="grid-wrapper">
          <div id="mfcGrid" class="ag-theme-alpine app-grid"></div>
        </section>
      </div>
    </main>
  </div>

  <@gridManager.preferenceModal />

  <div id="disableRecordModal" class="mf-action-modal" hidden>
    <div class="mf-action-modal__backdrop" data-action="close-disable-modal"></div>
    <div class="mf-action-modal__dialog mf-action-modal__dialog--disable" role="dialog" aria-modal="true" aria-labelledby="disableRecordModalTitle">
      <div class="mf-action-modal__header">
        <h2 id="disableRecordModalTitle" class="mf-action-modal__title">Disable Record</h2>
        <button type="button" class="mf-action-modal__close" aria-label="Close" data-action="close-disable-modal">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6L18 18M18 6L6 18" /></svg>
        </button>
      </div>
      <div id="disableRecordErrorMessage" class="mf-action-modal__error" hidden>A note is required to disable this record.</div>
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
