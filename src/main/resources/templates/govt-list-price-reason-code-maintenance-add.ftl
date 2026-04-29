<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Govt List Price Reason Code Maintenance - Add</title>
  <#assign ctx = (request.contextPath)!"" />
  <link rel="stylesheet" href="${ctx}/css/app.css">
  <link rel="stylesheet" href="${ctx}/css/grid.css">
  <link rel="stylesheet" href="${ctx}/css/grid-manager.css">
  <link rel="stylesheet" href="${ctx}/css/grid-page.css">
  <link rel="stylesheet" href="${ctx}/css/action-toolbar.css">
  <link rel="stylesheet" href="${ctx}/css/page-toast.css">
  <link rel="stylesheet" href="${ctx}/css/screen-shared.css">
  <link rel="stylesheet" href="${ctx}/css/screen-add-shared.css">
  <link rel="stylesheet" href="${ctx}/css/govt-list-price-reason-code-maintenance.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-grid.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-theme-alpine.css">

  <script>
    window.API_BASE_URL = window.API_BASE_URL || '${(apiBaseUrl!'')?js_string}';
    window.GRID_PREF_TEST_USER_ID = window.GRID_PREF_TEST_USER_ID || '${(userId!'defaultUser')?js_string}';
    window.GLPRC_LIST_PAGE_URL = window.GLPRC_LIST_PAGE_URL || '${ctx}/govt-list-price-reason-code-maintenance';
    window.GRID_PREF_SCREEN_ID_BY_GRID = Object.assign({}, window.GRID_PREF_SCREEN_ID_BY_GRID, {
      govtListPriceReasonCodeAddGrid: 'id_govt_list_price_reason_code_maintenance_add'
    });
  </script>

  <script src="${ctx}/js/sidebar.js" defer></script>
  <script src="${ctx}/js/dynamic-grid.js" defer></script>
  <script src="${ctx}/js/grid-manager.js" defer></script>
  <script src="${ctx}/js/grid-toolbar.js" defer></script>
  <script src="${ctx}/js/page-toast.js" defer></script>
  <script src="${ctx}/js/govt-list-price-reason-code-maintenance-add.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/dist/ag-grid-community.min.js"></script>
</head>
<body class="mfi-page screen-page screen-add-page govt-reason-page govt-reason-page--add">
  <#include "/components/header.ftl">
  <#import "/components/sidebar.ftl" as sidebar>
  <#import "/components/page-header.ftl" as pageHeader>
  <#import "/components/grid-manager-macro.ftl" as gridManager>
  <#import "/components/action-toolbar.ftl" as actionToolbar>
  <#import "/components/grid-view-actions.ftl" as gridViewActions>

  <input type="hidden" id="currentUserId" value="${userId!'defaultUser'}" />

  <div class="app-shell">
    <@sidebar.navigation currentPath="/govt-list-price-reason-code-maintenance/add" />

    <main class="content">
      <div class="content-card">
        <@pageHeader.render
          title="Govt List Price Reason Code Maintenance - Work With User Defined Codes"
          crumbs=[{"label":"Home","href":"${ctx}/"},{"label":"Government"},{"label":"Govt List Price Reason Code Maintenance - Work With User Defined Codes","href":"${ctx}/govt-list-price-reason-code-maintenance"},{"label":"Add"}]
        />

        <#assign iconBack><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6L9 12L15 18" /></svg></#assign>
        <#assign iconHeart><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20L4.7 12.7A4.8 4.8 0 1 1 11.5 5.9L12 6.4L12.5 5.9A4.8 4.8 0 1 1 19.3 12.7L12 20Z" /></svg></#assign>
        <#assign iconDelete><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6H19M9 6V4H15V6M8 6V19H16V6" /></svg></#assign>
        <#assign iconSubmit><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12L12 5L19 12" /></svg></#assign>
        <#assign iconExecute><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20L16.5 16.5" /></svg></#assign>
        <#assign actionItems=[
          {"id":"back","label":"Back","iconOnly":true,"className":"icon-only is-back","iconHtml":iconBack},
          {"id":"favorite","label":"Favorite","iconOnly":true,"className":"icon-only has-divider","iconHtml":iconHeart},
          {"id":"delete","label":"Delete","className":"has-divider","iconHtml":iconDelete},
          {"id":"submit","label":"Submit","iconHtml":iconSubmit},
          {"id":"execute","label":"Execute","iconHtml":iconExecute}
        ] />

        <@actionToolbar.render actions=actionItems toolbarLabel="Government list price reason code add actions" showRightSection=false />

        <section class="govt-reason-summary-card" aria-label="Government reason code summary">
          <div class="govt-reason-summary-grid govt-reason-summary-grid--add">
            <div class="govt-reason-summary-label">System Code</div>
            <div class="govt-reason-summary-field">
              <input class="govt-reason-summary-input" type="text" value="57" readonly tabindex="-1" aria-label="System Code" />
            </div>
            <div class="govt-reason-summary-note">Reserved for Clients</div>

            <div class="govt-reason-summary-label">User Defined Codes</div>
            <div class="govt-reason-summary-field">
              <input class="govt-reason-summary-input" type="text" value="R0" readonly tabindex="-1" aria-label="User Defined Codes" />
            </div>
            <div class="govt-reason-summary-note">Government List Price Reason Code</div>

            <div class="govt-reason-summary-label">Code</div>
            <div class="govt-reason-summary-field">
              <input id="govtReasonCodeInput" class="govt-reason-summary-input govt-reason-summary-input--editable" type="text" placeholder="Enter Code" aria-label="Code" />
            </div>
            <div class="govt-reason-summary-note govt-reason-summary-note--empty" aria-hidden="true"></div>
          </div>
        </section>

        <section class="govt-reason-grid-topbar" aria-label="Grid manager view actions">
          <div class="gt-grid-manager-tools">
            <@gridManager.gridManager />
            <@gridViewActions.render defaultDensity="compact" />
          </div>
        </section>

        <section class="grid-wrapper">
          <div id="govtListPriceReasonCodeAddGrid" class="ag-theme-alpine app-grid screen-grid"></div>
        </section>
      </div>
    </main>
  </div>

  <@gridManager.preferenceModal />
</body>
</html>
