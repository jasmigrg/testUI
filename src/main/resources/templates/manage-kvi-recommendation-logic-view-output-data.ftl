<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Manage KVI Recommendation Logic and View Output Data</title>
  <#assign ctx = (request.contextPath)!"" />
  <link rel="stylesheet" href="${ctx}/css/app.css">
  <link rel="stylesheet" href="${ctx}/css/grid.css">
  <link rel="stylesheet" href="${ctx}/css/grid-manager.css">
  <link rel="stylesheet" href="${ctx}/css/grid-page.css">
  <link rel="stylesheet" href="${ctx}/css/action-toolbar.css">
  <link rel="stylesheet" href="${ctx}/css/page-toast.css">
  <link rel="stylesheet" href="${ctx}/css/manage-kvi-recommendation-logic.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-grid.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-theme-alpine.css">

  <script>
    window.API_BASE_URL = window.API_BASE_URL || '${(apiBaseUrl!'')?js_string}';
    window.GRID_PREF_TEST_USER_ID = window.GRID_PREF_TEST_USER_ID || '${(userId!'defaultUser')?js_string}';
    window.KVI_ADD_PAGE_URL = window.KVI_ADD_PAGE_URL || '${ctx}/manage-kvi-recommendation-logic-view-output-data/add';
    window.GRID_PREF_SCREEN_ID_BY_GRID = Object.assign({}, window.GRID_PREF_SCREEN_ID_BY_GRID, {
      kviParameterGrid: 'id_kvi_recommendation_logic_parameter',
      kviOutputGrid: 'id_kvi_recommendation_logic_output'
    });
  </script>

  <script src="${ctx}/js/sidebar.js" defer></script>
  <script src="${ctx}/js/dynamic-grid.js" defer></script>
  <script src="${ctx}/js/grid-manager.js" defer></script>
  <script src="${ctx}/js/grid-toolbar.js" defer></script>
  <script src="${ctx}/js/page-toast.js" defer></script>
  <script src="${ctx}/js/manage-kvi-recommendation-logic.js" defer></script>

  <script src="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/dist/ag-grid-community.min.js"></script>
</head>
<body class="mfi-page kvi-page">

  <#include "/components/header.ftl">
  <#import "/components/sidebar.ftl" as sidebar>
  <#import "/components/page-header.ftl" as pageHeader>
  <#import "/components/grid-manager-macro.ftl" as gridManager>
  <#import "/components/action-toolbar.ftl" as actionToolbar>
  <#import "/components/grid-view-actions.ftl" as gridViewActions>

  <input type="hidden" id="currentUserId" value="${userId!'defaultUser'}" />

  <div class="app-shell">
    <@sidebar.navigation currentPath="/manage-kvi-recommendation-logic-view-output-data" />

    <main class="content">
      <div class="content-card">
        <@pageHeader.render
          title="Manage KVI Recommendation Logic and View Output Data"
          crumbs=[{"label":"Home","href":"${ctx}/"},{"label":"Manage KVI Recommendation Logic and View Output Data"}]
        />

        <section class="kvi-page-shell" aria-label="Manage KVI Recommendation Logic and View Output Data">
          <div class="kvi-tabs" role="tablist" aria-label="KVI recommendation tabs">
            <button
              type="button"
              class="kvi-tab-btn is-active"
              id="kvi-tab-parameter"
              role="tab"
              aria-selected="true"
              aria-controls="kvi-panel-parameter"
              data-kvi-tab="parameter"
            >
              KVI Recommendation Parameter
            </button>
            <button
              type="button"
              class="kvi-tab-btn"
              id="kvi-tab-output"
              role="tab"
              aria-selected="false"
              aria-controls="kvi-panel-output"
              data-kvi-tab="output"
            >
              KVI Recommendation Output
            </button>
          </div>

          <#assign iconBack><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6L9 12L15 18" /></svg></#assign>
          <#assign iconAdd><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V19M5 12H19" /></svg></#assign>
          <#assign iconRefresh><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12A8 8 0 1 1 17.6 6.2" /><path d="M20 4V10H14" /></svg></#assign>
          <#assign iconExecute><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20L16.5 16.5" /></svg></#assign>
          <section class="gt-grid-controls">
            <div
              class="gt-action-toolbar kvi-tab-action-toolbar"
              role="toolbar"
              aria-label="KVI recommendation parameter actions"
              data-kvi-actions="parameter"
            >
                <button type="button" class="gt-action-btn icon-only is-back" aria-label="Back" data-action="back">
                ${iconBack}
              </button>
              <button type="button" class="gt-action-btn icon-only is-add" aria-label="Add" data-action="add">
                ${iconAdd}
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
              class="gt-action-toolbar kvi-tab-action-toolbar"
              role="toolbar"
              aria-label="KVI recommendation output actions"
              data-kvi-actions="output"
              hidden
            >
              <button type="button" class="gt-action-btn icon-only is-back" aria-label="Back" data-action="back">
                ${iconBack}
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
            class="kvi-tab-panel is-active"
            id="kvi-panel-parameter"
            role="tabpanel"
            aria-labelledby="kvi-tab-parameter"
            data-kvi-panel="parameter"
          >
            <section class="grid-wrapper">
              <div id="kviParameterGrid" class="ag-theme-alpine app-grid"></div>
            </section>
          </section>

          <section
            class="kvi-tab-panel"
            id="kvi-panel-output"
            role="tabpanel"
            aria-labelledby="kvi-tab-output"
            data-kvi-panel="output"
            hidden
          >
            <section class="grid-wrapper">
              <div id="kviOutputGrid" class="ag-theme-alpine app-grid"></div>
            </section>
          </section>
        </section>
      </div>
    </main>
  </div>

  <@gridManager.preferenceModal />

</body>
</html>