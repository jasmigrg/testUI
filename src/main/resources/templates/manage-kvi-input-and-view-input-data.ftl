<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Manage KVI Input and View Input Data</title>
  <#assign ctx = (request.contextPath)!"" />
  <link rel="stylesheet" href="${ctx}/css/app.css">
  <link rel="stylesheet" href="${ctx}/css/grid.css">
  <link rel="stylesheet" href="${ctx}/css/grid-manager.css">
  <link rel="stylesheet" href="${ctx}/css/grid-page.css">
  <link rel="stylesheet" href="${ctx}/css/action-toolbar.css">
  <link rel="stylesheet" href="${ctx}/css/manage-kvi-recommendation-logic.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-grid.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-theme-alpine.css">

  <script>
    window.API_BASE_URL = window.API_BASE_URL || '${(apiBaseUrl!'')?js_string}';
    window.GRID_PREF_TEST_USER_ID = window.GRID_PREF_TEST_USER_ID || '${(userId!'defaultUser')?js_string}';
    window.KVI_INPUT_EXCLUSION_ADD_URL = window.KVI_INPUT_EXCLUSION_ADD_URL || '${ctx}/kvi-input-exclusion/add';
    window.GRID_PREF_SCREEN_ID_BY_GRID = Object.assign({}, window.GRID_PREF_SCREEN_ID_BY_GRID, {
      kviInputControlGrid: 'id_kvi_input_control',
      kviInputDataGrid: 'id_kvi_input_data',
      kviInputExclusionGrid: 'id_kvi_input_exclusion'
    });
  </script>

  <script src="${ctx}/js/sidebar.js" defer></script>
  <script src="${ctx}/js/dynamic-grid.js" defer></script>
  <script src="${ctx}/js/grid-manager.js" defer></script>
  <script src="${ctx}/js/grid-toolbar.js" defer></script>
  <script src="${ctx}/js/manage-kvi-input-and-view-input-data.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/dist/ag-grid-community.min.js"></script>
</head>
<body class="mfi-page kvi-page">
  <#include "/components/header.ftl">
  <#import "/components/sidebar.ftl" as sidebar>
  <#import "/components/page-header.ftl" as pageHeader>
  <#import "/components/grid-manager-macro.ftl" as gridManager>
  <#import "/components/grid-view-actions.ftl" as gridViewActions>

  <input type="hidden" id="currentUserId" value="${userId!'defaultUser'}" />

  <div class="app-shell">
    <@sidebar.navigation currentPath="/manageKVIInputAndViewInputData" />

    <main class="content">
      <div class="content-card">
        <@pageHeader.render
          title="Manage KVI Input and View Input Data"
          crumbs=[
            {"label":"Home","href":"${ctx}/"},
            {"label":"Landing Page"},
            {"label":"Guidance Model Management"}
          ]
        />

        <section class="kvi-page-shell" aria-label="Manage KVI Input and View Input Data">
          <div class="kvi-tabs" role="tablist" aria-label="KVI input tabs">
            <button
              type="button"
              class="kvi-tab-btn is-active"
              id="kvi-input-tab-control"
              role="tab"
              aria-selected="true"
              aria-controls="kvi-input-panel-control"
              data-kvi-tab="control"
            >
              KVI Input Control
            </button>
            <button
              type="button"
              class="kvi-tab-btn"
              id="kvi-input-tab-data"
              role="tab"
              aria-selected="false"
              aria-controls="kvi-input-panel-data"
              data-kvi-tab="data"
            >
              KVI Input Data
            </button>
            <button
              type="button"
              class="kvi-tab-btn"
              id="kvi-input-tab-exclusion"
              role="tab"
              aria-selected="false"
              aria-controls="kvi-input-panel-exclusion"
              data-kvi-tab="exclusion"
            >
              KVI Input Exclusion
            </button>
          </div>

          <#assign iconBack><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6L9 12L15 18" /></svg></#assign>
          <#assign iconAdd><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V19M5 12H19" /></svg></#assign>
          <#assign iconHeart><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20L4.7 12.7A4.8 4.8 0 1 1 11.5 5.9L12 6.4L12.5 5.9A4.8 4.8 0 1 1 19.3 12.7L12 20Z" /></svg></#assign>
          <#assign iconRefresh><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12A8 8 0 1 1 17.6 6.2" /><path d="M20 4V10H14" /></svg></#assign>
          <#assign iconExecute><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20L16.5 16.5" /></svg></#assign>

          <section class="gt-grid-controls">
            <div class="gt-action-toolbar" role="toolbar" aria-label="KVI input actions">
              <button type="button" class="gt-action-btn icon-only is-back" aria-label="Back" data-action="back">
                ${iconBack}
              </button>
              <button type="button" class="gt-action-btn icon-only is-add" aria-label="Add" data-action="add">
                ${iconAdd}
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
            class="kvi-tab-panel is-active"
            id="kvi-input-panel-control"
            role="tabpanel"
            aria-labelledby="kvi-input-tab-control"
            data-kvi-panel="control"
          >
            <p class="kvi-panel-title">KVI Input Control</p>
            <section class="grid-wrapper">
              <div id="kviInputControlGrid" class="ag-theme-alpine app-grid"></div>
            </section>
          </section>

          <section
            class="kvi-tab-panel"
            id="kvi-input-panel-data"
            role="tabpanel"
            aria-labelledby="kvi-input-tab-data"
            data-kvi-panel="data"
            hidden
          >
            <p class="kvi-panel-title">KVI Input Data</p>
            <section class="grid-wrapper">
              <div id="kviInputDataGrid" class="ag-theme-alpine app-grid"></div>
            </section>
          </section>

          <section
            class="kvi-tab-panel"
            id="kvi-input-panel-exclusion"
            role="tabpanel"
            aria-labelledby="kvi-input-tab-exclusion"
            data-kvi-panel="exclusion"
            hidden
          >
            <p class="kvi-panel-title">KVI Input Exclusion</p>
            <section class="grid-wrapper">
              <div id="kviInputExclusionGrid" class="ag-theme-alpine app-grid"></div>
            </section>
          </section>
        </section>
      </div>
    </main>
  </div>

  <@gridManager.preferenceModal />
</body>
</html>
