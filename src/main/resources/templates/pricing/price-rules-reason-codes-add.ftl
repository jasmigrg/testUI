<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Price Rules Reason Codes - Add</title>
  <#assign ctx = (request.contextPath)!"" />
  <link rel="stylesheet" href="${ctx}/css/app.css">
  <link rel="stylesheet" href="${ctx}/css/grid.css">
  <link rel="stylesheet" href="${ctx}/css/grid-manager.css">
  <link rel="stylesheet" href="${ctx}/css/grid-page.css">
  <link rel="stylesheet" href="${ctx}/css/action-toolbar.css">
  <link rel="stylesheet" href="${ctx}/css/price-rules-reason-codes.css">
  <link rel="stylesheet" href="${ctx}/css/price-rules-reason-codes-add.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-grid.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-theme-alpine.css">

  <script>
    window.GUIDANCE_API_BASE_URL = window.GUIDANCE_API_BASE_URL || '${(guidanceApiBaseUrl!'')?js_string}';
    window.GRID_PREF_TEST_USER_ID = window.GRID_PREF_TEST_USER_ID || '${(userId!'defaultUser')?js_string}';
    window.PRRC_LIST_PAGE_URL = window.PRRC_LIST_PAGE_URL || '${ctx}/price-rules-reason-codes';
    window.GRID_PREF_SCREEN_ID_BY_GRID = Object.assign({}, window.GRID_PREF_SCREEN_ID_BY_GRID, {
      priceRulesReasonCodesAddGrid: 'id_price_rules_reason_codes_add'
    });
  </script>

  <script src="${ctx}/js/sidebar.js" defer></script>
  <script src="${ctx}/js/dynamic-grid.js" defer></script>
  <script src="${ctx}/js/grid-manager.js" defer></script>
  <script src="${ctx}/js/grid-toolbar.js" defer></script>
  <script src="${ctx}/js/price-rules-reason-codes-add.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/dist/ag-grid-community.min.js"></script>
</head>
<body class="grid-page prrc-page">
  <#include "/components/header.ftl">
  <#import "/components/sidebar.ftl" as sidebar>
  <#import "/components/page-header.ftl" as pageHeader>
  <#import "/components/grid-manager-macro.ftl" as gridManager>
  <#import "/components/action-toolbar.ftl" as actionToolbar>
  <#import "/components/grid-view-actions.ftl" as gridViewActions>
  <#import "/components/toolbar-icons.ftl" as toolbarIcons>

  <input type="hidden" id="currentUserId" value="${userId!'defaultUser'}" />

  <div class="app-shell">
    <@sidebar.navigation currentPath="/price-rules-reason-codes" />

    <main class="content">
      <div class="content-card">
        <@pageHeader.render
          title="Price Rules Reason Codes"
          crumbs=[{"label":"Home","href":"${ctx}/"},{"label":"Pricing","href":"${ctx}/"},{"label":"Price Rules Reason Codes"}]
        />

        <#assign iconBack><@toolbarIcons.render name="back" /></#assign>
        <#assign iconDelete><@toolbarIcons.render name="delete" /></#assign>
        <#assign iconExecute><@toolbarIcons.render name="execute" /></#assign>
        <#assign iconSave><@toolbarIcons.render name="save" /></#assign>
        <#assign actionItems=[
          {"id":"back","label":"Back","iconOnly":true,"className":"icon-only is-back","iconHtml":iconBack},
          {"id":"delete","label":"Delete","iconHtml":iconDelete},
          {"id":"execute","label":"Execute","iconHtml":iconExecute},
          {"id":"save","label":"Save","iconHtml":iconSave}
        ] />

        <@actionToolbar.render actions=actionItems toolbarLabel="Price rules reason code add actions" rightSectionLabel="Grid manager view actions">
          <@gridManager.gridManager />
          <@gridViewActions.render defaultDensity="compact" showDownload=false />
        </@actionToolbar.render>

        <section class="prrc-add-card">
          <div class="prrc-add-code-row">
            <label for="prrcAddCodeInput">Code</label>
            <input id="prrcAddCodeInput" type="text" />
          </div>
          <div class="prrc-add-hint-row">
            <span>Write a code to begin, then paste your records or upload a CSV.</span>
            <button type="button" id="prrcBulkUploadBtn" class="prrc-bulk-upload-btn">Bulk Upload</button>
          </div>
        </section>

        <section class="grid-wrapper">
          <div id="priceRulesReasonCodesAddGrid" class="ag-theme-alpine app-grid"></div>
        </section>
      </div>
    </main>
  </div>

  <@gridManager.preferenceModal />
</body>
</html>
