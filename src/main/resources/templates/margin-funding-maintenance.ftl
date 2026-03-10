<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Margin Funding Item Maintenance</title>
  <#assign ctx = (request.contextPath)!"" />
  <link rel="stylesheet" href="${ctx}/css/app.css">
  <link rel="stylesheet" href="${ctx}/css/grid.css">
  <link rel="stylesheet" href="${ctx}/css/grid-manager.css">
  <link rel="stylesheet" href="${ctx}/css/grid-page.css">
  <link rel="stylesheet" href="${ctx}/css/action-toolbar.css">
  <link rel="stylesheet" href="${ctx}/css/margin-funding-maintenance.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

  <!-- AG-Grid CSS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-grid.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-theme-alpine.css">

  <script src="${ctx}/js/sidebar.js" defer></script>
  <script src="${ctx}/js/dynamic-grid.js" defer></script>
  <script src="${ctx}/js/grid-manager.js" defer></script>
  <script src="${ctx}/js/grid-toolbar.js" defer></script>
  <script src="${ctx}/js/margin-funding-maintenance.js" defer></script>

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
    <@sidebar.navigation currentPath="/margin-funding-maintenance" />

    <main class="content">
      <div class="content-card">
        <@pageHeader.render
          title="Margin Funding Item Maintenance"
          crumbs=[{"label":"Home","href":"${ctx}/"},{"label":"Margin Funding Item Maintenance"}]
        />

        <#assign iconBack><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6L9 12L15 18" /></svg></#assign>
        <#assign iconAdd><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V19M5 12H19" /></svg></#assign>
        <#assign iconTools><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5A3.5 3.5 0 1 1 12 15.5A3.5 3.5 0 0 1 12 8.5Z" /><path d="M19.4 15A1 1 0 0 0 19.6 16.1L19.7 16.2A1 1 0 0 1 18.3 17.6L18.2 17.5A1 1 0 0 0 17.1 17.3A1 1 0 0 0 16.5 18.2V18.5A1 1 0 0 1 14.5 18.5V18.2A1 1 0 0 0 13.9 17.3A1 1 0 0 0 12.8 17.5L12.7 17.6A1 1 0 0 1 11.3 16.2L11.4 16.1A1 1 0 0 0 11.6 15A1 1 0 0 0 10.7 14.4H10.4A1 1 0 0 1 10.4 12.4H10.7A1 1 0 0 0 11.6 11.8A1 1 0 0 0 11.4 10.7L11.3 10.6A1 1 0 0 1 12.7 9.2L12.8 9.3A1 1 0 0 0 13.9 9.1A1 1 0 0 0 14.5 8.2V7.9A1 1 0 0 1 16.5 7.9V8.2A1 1 0 0 0 17.1 9.1A1 1 0 0 0 18.2 9.3L18.3 9.2A1 1 0 0 1 19.7 10.6L19.6 10.7A1 1 0 0 0 19.4 11.8A1 1 0 0 0 20.3 12.4H20.6A1 1 0 0 1 20.6 14.4H20.3A1 1 0 0 0 19.4 15Z" /></svg></#assign>
        <#assign iconDisable><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="6" width="14" height="12" rx="2" /><path d="M9 9L15 15M15 9L9 15" /></svg></#assign>
        <#assign iconUpdate><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 3V7M16 3V7M4 10H20M8 14H12" /></svg></#assign>
        <#assign iconRefresh><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12A8 8 0 1 1 17.6 6.2" /><path d="M20 4V10H14" /></svg></#assign>
        <#assign iconExecute><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20L16.5 16.5" /></svg></#assign>
        <#assign actionItems=[
          {"id":"back","label":"Back","iconOnly":true,"className":"icon-only is-back","iconHtml":iconBack},
          {"id":"add","label":"Add","iconOnly":true,"className":"icon-only is-add","iconHtml":iconAdd},
          {"id":"tools","label":"Tools","className":"is-tools has-divider","iconHtml":iconTools},
          {"id":"disable","label":"Disable","className":"has-divider","iconHtml":iconDisable},
          {"id":"update-termination-date","label":"Update Termination Date","ariaLabel":"Update Termination Date","className":"has-divider","iconHtml":iconUpdate},
          {"id":"refresh","label":"Refresh","iconHtml":iconRefresh},
          {"id":"execute","label":"Execute","iconHtml":iconExecute}
        ] />

        <@actionToolbar.render actions=actionItems toolbarLabel="Margin funding actions" rightSectionLabel="Grid manager view actions">
            <@gridManager.gridManager />
            <@gridViewActions.render defaultDensity="compact" />
        </@actionToolbar.render>

        <section class="grid-wrapper">
          <div id="mfiGrid" class="ag-theme-alpine app-grid"></div>
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