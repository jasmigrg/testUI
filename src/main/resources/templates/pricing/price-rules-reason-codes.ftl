<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Price Rules Reason Codes</title>
  <#assign ctx = (request.contextPath)!"" />
  <link rel="stylesheet" href="${ctx}/css/app.css">
  <link rel="stylesheet" href="${ctx}/css/grid.css">
  <link rel="stylesheet" href="${ctx}/css/grid-manager.css">
  <link rel="stylesheet" href="${ctx}/css/grid-page.css">
  <link rel="stylesheet" href="${ctx}/css/action-toolbar.css">
  <link rel="stylesheet" href="${ctx}/css/price-rules-reason-codes.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-grid.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-theme-alpine.css">

  <script>
    window.GUIDANCE_API_BASE_URL = window.GUIDANCE_API_BASE_URL || '${(guidanceApiBaseUrl!'')?js_string}';
    window.PRICE_RULES_REASON_CODES_API_BASE_URL = window.PRICE_RULES_REASON_CODES_API_BASE_URL || window.GUIDANCE_API_BASE_URL;
    window.PRICE_RULES_REASON_CODES_API_PATH = window.PRICE_RULES_REASON_CODES_API_PATH || '/api/v1/priceRulesReasonCodes';
    window.PRRC_ADD_PAGE_URL = window.PRRC_ADD_PAGE_URL || '${ctx}/price-rules-reason-codes/add';
    window.PRRC_PRODUCT_CODE = window.PRRC_PRODUCT_CODE || '${(productCode!'55')?js_string}';
    window.PRRC_USER_DEFINED_CODES = window.PRRC_USER_DEFINED_CODES || '${(userDefinedCodes!'R0')?js_string}';
    window.GRID_PREF_TEST_USER_ID = window.GRID_PREF_TEST_USER_ID || '${(userId!'defaultUser')?js_string}';
    window.GRID_PREF_SCREEN_ID_BY_GRID = Object.assign({}, window.GRID_PREF_SCREEN_ID_BY_GRID, {
      priceRulesReasonCodesGrid: 'id_price_rules_reason_codes'
    });
  </script>

  <script src="${ctx}/js/sidebar.js" defer></script>
  <script src="${ctx}/js/dynamic-grid.js" defer></script>
  <script src="${ctx}/js/grid-manager.js" defer></script>
  <script src="${ctx}/js/grid-toolbar.js" defer></script>
  <script src="${ctx}/js/price-rules-reason-codes.js" defer></script>

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
        <#assign iconAdd><@toolbarIcons.render name="add" /></#assign>
        <#assign iconTools><@toolbarIcons.render name="tools" /></#assign>
        <#assign iconDelete><@toolbarIcons.render name="delete" /></#assign>
        <#assign iconRefresh><@toolbarIcons.render name="refresh" /></#assign>
        <#assign iconExecute><@toolbarIcons.render name="execute" /></#assign>
        <#assign actionItems=[
          {"id":"back","label":"Back","iconOnly":true,"className":"icon-only is-back","iconHtml":iconBack},
          {"id":"add","label":"Add","iconOnly":true,"className":"icon-only is-add","iconHtml":iconAdd},
          {"id":"tools","label":"Tools","className":"is-tools has-divider","iconHtml":iconTools},
          {"id":"delete","label":"Delete","className":"has-divider","iconHtml":iconDelete},
          {"id":"refresh","label":"Refresh","iconHtml":iconRefresh},
          {"id":"execute","label":"Execute","iconHtml":iconExecute}
        ] />

        <@actionToolbar.render actions=actionItems toolbarLabel="Price rules reason code actions" rightSectionLabel="Grid manager view actions">
          <@gridManager.gridManager />
          <@gridViewActions.render defaultDensity="compact" />
        </@actionToolbar.render>

        <section class="prrc-filter-card" aria-label="Price rules filters">
          <div class="prrc-filter-row">
            <label for="prrcSystemCodeInput" class="prrc-filter-label">System Code</label>
            <input id="prrcSystemCodeInput" class="prrc-filter-input" type="text" value="${(productCode!'55')?html}" />

            <span class="prrc-muted-label">Reserved for Clients</span>

            <label for="prrcUserDefinedCodesInput" class="prrc-filter-label prrc-gap-left">User Defined Code</label>
            <input id="prrcUserDefinedCodesInput" class="prrc-filter-input" type="text" value="${(userDefinedCodes!'R0')?html}" />

            <span class="prrc-muted-label">Price Rules Reason Codes</span>
          </div>
        </section>

        <section class="grid-wrapper">
          <div id="priceRulesReasonCodesGrid" class="ag-theme-alpine app-grid"></div>
        </section>
      </div>
    </main>
  </div>

  <@gridManager.preferenceModal />

</body>
</html>
