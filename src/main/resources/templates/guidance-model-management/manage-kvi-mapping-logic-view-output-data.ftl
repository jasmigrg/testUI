<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Manage KVI Mapping Logic and View Output Data</title>
  <#assign ctx = (request.contextPath)!"" />
  <link rel="stylesheet" href="${ctx}/css/app.css">
  <link rel="stylesheet" href="${ctx}/css/grid.css">
  <link rel="stylesheet" href="${ctx}/css/grid-manager.css">
  <link rel="stylesheet" href="${ctx}/css/grid-page.css">
  <link rel="stylesheet" href="${ctx}/css/tabbed-grid.css">
  <link rel="stylesheet" href="${ctx}/css/action-toolbar.css">
  <link rel="stylesheet" href="${ctx}/css/page-toast.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-grid.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-theme-alpine.css">

  <script>
    window.API_BASE_URL = window.API_BASE_URL || '${(apiBaseUrl!"")?js_string}';
    window.GRID_PREF_TEST_USER_ID = window.GRID_PREF_TEST_USER_ID || '${(userId!'defaultUser')?js_string}';
    window.KVI_MAPPING_ADD_PAGE_URL = window.KVI_MAPPING_ADD_PAGE_URL || '';
    window.GRID_PREF_SCREEN_ID_BY_GRID = Object.assign({}, window.GRID_PREF_SCREEN_ID_BY_GRID, {
      kviMappingParameterGrid: 'id_kvi_mapping_logic_parameter',
      kviMappingOutputGrid: 'id_kvi_mapping_logic_output'
    });
  </script>

  <script src="${ctx}/js/sidebar.js" defer></script>
  <script src="${ctx}/js/dynamic-grid.js" defer></script>
  <script src="${ctx}/js/grid-manager.js" defer></script>
  <script src="${ctx}/js/grid-toolbar.js" defer></script>
  <script src="${ctx}/js/page-toast.js" defer></script>
  <script src="${ctx}/js/manage-kvi-mapping-logic.js" defer></script>

  <script src="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/dist/ag-grid-community.min.js"></script>
</head>
<body class="grid-page kvi-page">

  <#include "/components/header.ftl">
  <#import "/components/sidebar.ftl" as sidebar>
  <#import "/components/page-header.ftl" as pageHeader>
  <#import "/components/grid-manager-macro.ftl" as gridManager>
  <#import "/components/grid-view-actions.ftl" as gridViewActions>
  <#import "/components/toolbar-icons.ftl" as toolbarIcons>

  <input type="hidden" id="currentUserId" value="${userId!'defaultUser'}" />

  <div class="app-shell">
    <@sidebar.navigation currentPath="/manage-kvi-mapping-logic-view-output-data" />

    <main class="content">
      <div class="content-card grid-content-card-compact">
        <@pageHeader.render
          title="Manage KVI Mapping Logic and View Output Data"
          crumbs=[{"label":"Home","href":"${ctx}/"},{"label":"Manage KVI Mapping Logic and View Output Data"}]
        />

        <section class="kvi-page-shell tabbed-grid-page" aria-label="Manage KVI Mapping Logic and View Output Data">
          <div class="kvi-tabs tabbed-grid-tabs" role="tablist" aria-label="KVI mapping tabs">
            <button
              type="button"
              class="kvi-tab-btn tabbed-grid-tab-btn is-active"
              id="kvi-mapping-tab-parameter"
              role="tab"
              aria-selected="true"
              aria-controls="kvi-mapping-panel-parameter"
              data-kvi-tab="parameter"
            >
              KVI Mapping Parameter
            </button>
            <button
              type="button"
              class="kvi-tab-btn tabbed-grid-tab-btn"
              id="kvi-mapping-tab-output"
              role="tab"
              aria-selected="false"
              aria-controls="kvi-mapping-panel-output"
              data-kvi-tab="output"
            >
              KVI Mapping Output
            </button>
          </div>

          <#assign iconBack><@toolbarIcons.render name="back" /></#assign>
          <#assign iconAdd><@toolbarIcons.render name="add" /></#assign>
          <#assign iconHeart><@toolbarIcons.render name="heart" /></#assign>
          <#assign iconRefresh><@toolbarIcons.render name="refresh" /></#assign>
          <#assign iconExecute><@toolbarIcons.render name="execute" /></#assign>

          <section class="gt-grid-controls">
            <div
              class="gt-action-toolbar kvi-tab-action-toolbar"
              role="toolbar"
              aria-label="KVI mapping parameter actions"
              data-kvi-actions="parameter"
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
              aria-label="KVI mapping output actions"
              data-kvi-actions="output"
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
            class="kvi-tab-panel tabbed-grid-panel is-active"
            id="kvi-mapping-panel-parameter"
            role="tabpanel"
            aria-labelledby="kvi-mapping-tab-parameter"
            data-kvi-panel="parameter"
          >
            <section class="grid-wrapper">
              <div id="kviMappingParameterGrid" class="ag-theme-alpine app-grid app-grid-standard"></div>
            </section>
          </section>

          <section
            class="kvi-tab-panel tabbed-grid-panel"
            id="kvi-mapping-panel-output"
            role="tabpanel"
            aria-labelledby="kvi-mapping-tab-output"
            data-kvi-panel="output"
            hidden
          >
            <section class="grid-wrapper">
              <div id="kviMappingOutputGrid" class="ag-theme-alpine app-grid app-grid-standard"></div>
            </section>
          </section>
        </section>
      </div>
    </main>
  </div>

  <@gridManager.preferenceModal />

</body>
</html>
