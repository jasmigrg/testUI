<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>UOM Diff Input Exclusion - Add</title>
  <#assign ctx = (request.contextPath)!"" />
  <link rel="stylesheet" href="${ctx}/css/app.css">
  <link rel="stylesheet" href="${ctx}/css/grid.css">
  <link rel="stylesheet" href="${ctx}/css/grid-manager.css">
  <link rel="stylesheet" href="${ctx}/css/grid-page.css">
  <link rel="stylesheet" href="${ctx}/css/action-toolbar.css">
  <link rel="stylesheet" href="${ctx}/css/page-toast.css">
  <link rel="stylesheet" href="${ctx}/css/screen-shared.css">
  <link rel="stylesheet" href="${ctx}/css/screen-add-shared.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-grid.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-theme-alpine.css">

  <script>
    window.API_BASE_URL = window.API_BASE_URL || '${(apiBaseUrl!'')?js_string}';
    window.GRID_PREF_TEST_USER_ID = window.GRID_PREF_TEST_USER_ID || '${(userId!'defaultUser')?js_string}';
    window.UOM_DIFF_LIST_PAGE_URL = window.UOM_DIFF_LIST_PAGE_URL || '${ctx}/manage-uom-diff-input-view-input-data?tab=exclusion';
    window.GRID_PREF_SCREEN_ID_BY_GRID = Object.assign({}, window.GRID_PREF_SCREEN_ID_BY_GRID, {
      uomDiffExclusionAddGrid: 'id_uom_diff_input_exclusion_add'
    });
  </script>

  <script src="${ctx}/js/sidebar.js" defer></script>
  <script src="${ctx}/js/dynamic-grid.js" defer></script>
  <script src="${ctx}/js/community-grid-paste.js" defer></script>
  <script src="${ctx}/js/grid-manager.js" defer></script>
  <script src="${ctx}/js/grid-toolbar.js" defer></script>
  <script src="${ctx}/js/page-toast.js" defer></script>
  <script src="${ctx}/js/manage-uom-diff-input-exclusion-add.js" defer></script>
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
    <@sidebar.navigation currentPath="/manage-uom-diff-input-view-input-data/exclusion/add" />

    <main class="content">
      <div class="content-card">
        <@pageHeader.render
          title="UOM Diff Input Exclusion"
          crumbs=[{"label":"Home","href":"${ctx}/"},{"label":"Manage UOM Diff Input and View Input Data","href":"${ctx}/manage-uom-diff-input-view-input-data?tab=exclusion"},{"label":"Add"}]
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

        <@actionToolbar.render actions=actionItems toolbarLabel="UOM diff exclusion add actions" rightSectionLabel="Grid manager view actions">
          <@gridManager.gridManager />
          <@gridViewActions.render defaultDensity="compact" showDownload=false />
        </@actionToolbar.render>

        <section class="grid-wrapper">
          <div id="uomDiffExclusionAddGrid" class="ag-theme-alpine app-grid screen-grid"></div>
        </section>
      </div>
    </main>
  </div>

  <@gridManager.preferenceModal />
</body>
</html>
