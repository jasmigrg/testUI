<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Manage McK Brand Logic</title>
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
    window.API_BASE_URL = window.API_BASE_URL || '${(apiBaseUrl!'')?js_string}';
    window.GRID_PREF_TEST_USER_ID = window.GRID_PREF_TEST_USER_ID || '${(userId!'defaultUser')?js_string}';
    window.GRID_PREF_SCREEN_ID_BY_GRID = Object.assign({}, window.GRID_PREF_SCREEN_ID_BY_GRID, {
      mckWeightingGrid: 'id_mck_brand_logic_weighting',
      mckQualityTierGrid: 'id_mck_brand_logic_quality_tier',
      mckRelativeDeltaGrid: 'id_mck_brand_logic_relative_delta',
      mckPriceCapGrid: 'id_mck_brand_logic_price_cap',
      mckBrandMultiplierGrid: 'id_mck_brand_logic_brand_multiplier'
    });
  </script>

  <script src="${ctx}/js/sidebar.js" defer></script>
  <script src="${ctx}/js/dynamic-grid.js" defer></script>
  <script src="${ctx}/js/grid-manager.js" defer></script>
  <script src="${ctx}/js/grid-toolbar.js" defer></script>
  <script src="${ctx}/js/page-toast.js" defer></script>
  <script src="${ctx}/js/manage-mck-brand-logic.js" defer></script>

  <script src="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/dist/ag-grid-community.min.js"></script>
</head>
<body class="grid-page mck-page">

  <#include "/components/header.ftl">
  <#import "/components/sidebar.ftl" as sidebar>
  <#import "/components/page-header.ftl" as pageHeader>
  <#import "/components/grid-manager-macro.ftl" as gridManager>
  <#import "/components/action-toolbar.ftl" as actionToolbar>
  <#import "/components/grid-view-actions.ftl" as gridViewActions>
  <#import "/components/toolbar-icons.ftl" as toolbarIcons>

  <input type="hidden" id="currentUserId" value="${userId!'defaultUser'}" />

  <div class="app-shell">
    <@sidebar.navigation currentPath="/manage-mck-brand-logic" />

    <main class="content">
      <div class="content-card grid-content-card-compact">
        <@pageHeader.render
          title="Manage McK Brand Logic"
          crumbs=[{"label":"Home","href":"${ctx}/"},{"label":"Guidance Model Management"},{"label":"Manage McK Brand Logic"}]
        />

        <section class="mck-page-shell tabbed-grid-page" aria-label="Manage McK Brand Logic">
          <div class="mck-tabs tabbed-grid-tabs" role="tablist" aria-label="McK brand logic tabs">
            <button type="button" class="mck-tab-btn tabbed-grid-tab-btn tabbed-grid-tab-btn--card is-active" id="mck-tab-weighting" role="tab" aria-selected="true" aria-controls="mck-panel-weighting" data-mck-tab="weighting">GM Core MCKB Price Scoring Weighting</button>
            <button type="button" class="mck-tab-btn tabbed-grid-tab-btn tabbed-grid-tab-btn--card" id="mck-tab-quality-tier" role="tab" aria-selected="false" aria-controls="mck-panel-quality-tier" data-mck-tab="quality-tier">GM Core Paramter MCKB Quality Tiers</button>
            <button type="button" class="mck-tab-btn tabbed-grid-tab-btn tabbed-grid-tab-btn--card" id="mck-tab-relative-delta" role="tab" aria-selected="false" aria-controls="mck-panel-relative-delta" data-mck-tab="relative-delta">GM Core Paramter MCKB Relative Price Delta</button>
            <button type="button" class="mck-tab-btn tabbed-grid-tab-btn tabbed-grid-tab-btn--card" id="mck-tab-price-cap" role="tab" aria-selected="false" aria-controls="mck-panel-price-cap" data-mck-tab="price-cap">GM Core Parameter MCKB Price Change CAP</button>
            <button type="button" class="mck-tab-btn tabbed-grid-tab-btn tabbed-grid-tab-btn--card" id="mck-tab-brand-multiplier" role="tab" aria-selected="false" aria-controls="mck-panel-brand-multiplier" data-mck-tab="brand-multiplier">GM Core Output Brand Multiplier</button>
          </div>

          <#assign iconBack><@toolbarIcons.render name="back" /></#assign>
          <#assign iconAdd><@toolbarIcons.render name="add" /></#assign>
          <#assign iconHeart><@toolbarIcons.render name="heart" /></#assign>
          <#assign iconDisable><@toolbarIcons.render name="disable" /></#assign>
          <#assign iconUpdate><@toolbarIcons.render name="update" /></#assign>
          <#assign iconRefresh><@toolbarIcons.render name="refresh" /></#assign>
          <#assign iconExecute><@toolbarIcons.render name="execute" /></#assign>
          <#assign actionItems=[
            {"id":"back","label":"Back","iconOnly":true,"className":"icon-only is-back","iconHtml":iconBack},
            {"id":"add","label":"Add","iconOnly":true,"className":"icon-only is-add","iconHtml":iconAdd},
            {"id":"favorite","label":"Favorite","iconOnly":true,"className":"icon-only","iconHtml":iconHeart},
            {"id":"disable","label":"Disable","className":"has-divider","iconHtml":iconDisable},
            {"id":"update-termination-date","label":"Update Termination Date","ariaLabel":"Update Termination Date","className":"has-divider","iconHtml":iconUpdate},
            {"id":"refresh","label":"Refresh","iconHtml":iconRefresh},
            {"id":"execute","label":"Execute","iconHtml":iconExecute}
          ] />

          <@actionToolbar.render actions=actionItems toolbarLabel="McK brand logic actions" rightSectionLabel="Grid manager view actions">
            <@gridManager.gridManager />
            <@gridViewActions.render defaultDensity="compact" />
          </@actionToolbar.render>

          <section class="mck-tab-title-card tabbed-grid-title-card" aria-live="polite">
            <h2 class="mck-tab-title tabbed-grid-title" id="mckActiveTabTitle">GM Core MCKB Price Scoring Weighting</h2>
          </section>

          <section class="mck-tab-panel tabbed-grid-panel is-active" id="mck-panel-weighting" role="tabpanel" aria-labelledby="mck-tab-weighting" data-mck-panel="weighting">
            <section class="grid-wrapper">
              <div id="mckWeightingGrid" class="ag-theme-alpine app-grid app-grid-standard"></div>
            </section>
          </section>

          <section class="mck-tab-panel tabbed-grid-panel" id="mck-panel-quality-tier" role="tabpanel" aria-labelledby="mck-tab-quality-tier" data-mck-panel="quality-tier" hidden>
            <section class="grid-wrapper">
              <div id="mckQualityTierGrid" class="ag-theme-alpine app-grid app-grid-standard"></div>
            </section>
          </section>

          <section class="mck-tab-panel tabbed-grid-panel" id="mck-panel-relative-delta" role="tabpanel" aria-labelledby="mck-tab-relative-delta" data-mck-panel="relative-delta" hidden>
            <section class="grid-wrapper">
              <div id="mckRelativeDeltaGrid" class="ag-theme-alpine app-grid app-grid-standard"></div>
            </section>
          </section>

          <section class="mck-tab-panel tabbed-grid-panel" id="mck-panel-price-cap" role="tabpanel" aria-labelledby="mck-tab-price-cap" data-mck-panel="price-cap" hidden>
            <section class="grid-wrapper">
              <div id="mckPriceCapGrid" class="ag-theme-alpine app-grid app-grid-standard"></div>
            </section>
          </section>

          <section class="mck-tab-panel tabbed-grid-panel" id="mck-panel-brand-multiplier" role="tabpanel" aria-labelledby="mck-tab-brand-multiplier" data-mck-panel="brand-multiplier" hidden>
            <section class="grid-wrapper">
              <div id="mckBrandMultiplierGrid" class="ag-theme-alpine app-grid app-grid-standard"></div>
            </section>
          </section>
        </section>
      </div>
    </main>
  </div>

  <@gridManager.preferenceModal />

</body>
</html>
