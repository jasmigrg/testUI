<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>All Guidance Inquiry</title>
  <#assign ctx = (request.contextPath)!"" />
  <link rel="stylesheet" href="${ctx}/css/app.css">
  <link rel="stylesheet" href="${ctx}/css/grid.css">
  <link rel="stylesheet" href="${ctx}/css/grid-manager.css">
  <link rel="stylesheet" href="${ctx}/css/grid-page.css">
  <link rel="stylesheet" href="${ctx}/css/action-toolbar.css">
  <link rel="stylesheet" href="${ctx}/css/page-toast.css">
  <link rel="stylesheet" href="${ctx}/css/screen-shared.css">
  <link rel="stylesheet" href="${ctx}/css/all-guidance-inquiry.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-grid.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/styles/ag-theme-alpine.css">

  <script>
    window.API_BASE_URL = window.API_BASE_URL || '${(apiBaseUrl!'')?js_string}';
    window.GRID_PREF_TEST_USER_ID = window.GRID_PREF_TEST_USER_ID || '${(userId!'defaultUser')?js_string}';
    window.GRID_PREF_SCREEN_ID_BY_GRID = Object.assign({}, window.GRID_PREF_SCREEN_ID_BY_GRID, {
      allGuidanceInquiryGrid: 'id_all_guidance_inquiry'
    });
  </script>

  <script src="${ctx}/js/sidebar.js" defer></script>
  <script src="${ctx}/js/dynamic-grid.js" defer></script>
  <script src="${ctx}/js/grid-manager.js" defer></script>
  <script src="${ctx}/js/grid-toolbar.js" defer></script>
  <script src="${ctx}/js/page-toast.js" defer></script>
  <script src="${ctx}/js/all-guidance-inquiry.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/ag-grid-community@31.0.1/dist/ag-grid-community.min.js"></script>
</head>
<body class="screen-page all-guidance-page">
  <#include "/components/header.ftl">
  <#import "/components/sidebar.ftl" as sidebar>
  <#import "/components/page-header.ftl" as pageHeader>
  <#import "/components/grid-manager-macro.ftl" as gridManager>
  <#import "/components/action-toolbar.ftl" as actionToolbar>
  <#import "/components/grid-view-actions.ftl" as gridViewActions>

  <input type="hidden" id="currentUserId" value="${userId!'defaultUser'}" />

  <div class="app-shell">
    <@sidebar.navigation currentPath="/all-guidance-inquiry" />

    <main class="content">
      <div class="content-card">
        <@pageHeader.render
          title="All Guidance Inquiry"
          crumbs=[{"label":"Home","href":"${ctx}/"},{"label":"Landing Page","href":"${ctx}/"},{"label":"All Guidance Inquiry"}]
        />

        <section class="screen-page-shell" aria-label="All Guidance Inquiry">
          <section class="agi-panel agi-panel--input" aria-labelledby="allGuidanceInputTitle">
            <div class="agi-section-header">
              <div class="agi-section-icon" aria-hidden="true"></div>
              <h2 id="allGuidanceInputTitle" class="agi-section-title">Input</h2>
            </div>

            <form class="agi-input-form" id="allGuidanceInquiryForm">
              <div class="agi-inline-field">
                <label class="agi-label" for="allGuidanceAccountNumber">Account Number</label>
                <input id="allGuidanceAccountNumber" class="agi-input" name="accountNumber" type="text" autocomplete="off" />
              </div>

              <div class="agi-inline-field">
                <label class="agi-label" for="allGuidanceItemNumber">Item Number</label>
                <input id="allGuidanceItemNumber" class="agi-input" name="itemNumber" type="text" autocomplete="off" />
              </div>

              <div class="agi-inline-field">
                <label class="agi-label" for="allGuidanceUom">Unit Of Measure</label>
                <input id="allGuidanceUom" class="agi-input" name="unitOfMeasure" type="text" autocomplete="off" />
              </div>

              <div class="agi-inline-field">
                <label class="agi-label" for="allGuidancePriceDateDisplay">Price Date</label>
                <div class="agi-date-input">
                  <input
                    id="allGuidancePriceDateDisplay"
                    class="agi-input"
                    name="priceDateDisplay"
                    type="text"
                    inputmode="numeric"
                    placeholder="mm/dd/yyyy"
                    autocomplete="off"
                  />
                  <button id="allGuidancePriceDatePickerBtn" class="agi-date-btn" type="button" aria-label="Open date picker">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 3V7M16 3V7M4 10H20" /></svg>
                  </button>
                  <input id="allGuidancePriceDateNative" class="agi-native-date" name="priceDate" type="date" tabindex="-1" aria-hidden="true" />
                </div>
              </div>

              <div class="agi-form-actions">
                <button id="allGuidanceResetBtn" class="agi-btn agi-btn--secondary" type="reset">
                  <span class="agi-btn__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M20 12A8 8 0 1 1 17.6 6.2" /><path d="M20 4V10H14" /></svg>
                  </span>
                  <span>Reset</span>
                </button>
                <button id="allGuidanceSubmitBtn" class="agi-btn agi-btn--primary" type="submit">Submit</button>
              </div>
            </form>
          </section>

          <section class="agi-panel agi-panel--output" aria-labelledby="allGuidanceOutputTitle">
            <div class="agi-section-header">
              <div class="agi-section-icon" aria-hidden="true"></div>
              <h2 id="allGuidanceOutputTitle" class="agi-section-title">Output</h2>
            </div>

            <#assign iconBack><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6L9 12L15 18" /></svg></#assign>
            <#assign iconHeart><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20L4.7 12.7A4.8 4.8 0 1 1 11.5 5.9L12 6.4L12.5 5.9A4.8 4.8 0 1 1 19.3 12.7L12 20Z" /></svg></#assign>
            <#assign iconRefresh><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12A8 8 0 1 1 17.6 6.2" /><path d="M20 4V10H14" /></svg></#assign>
            <#assign iconExecute><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20L16.5 16.5" /></svg></#assign>
            <#assign actionItems=[
              {"id":"back","label":"Back","iconOnly":true,"className":"icon-only is-back","iconHtml":iconBack},
              {"id":"favorite","label":"Favorite","iconOnly":true,"className":"icon-only","iconHtml":iconHeart},
              {"id":"refresh","label":"Refresh","iconHtml":iconRefresh},
              {"id":"execute","label":"Execute","iconHtml":iconExecute}
            ] />

            <@actionToolbar.render actions=actionItems toolbarLabel="All guidance inquiry actions" rightSectionLabel="Grid manager view actions">
              <@gridManager.gridManager />
              <@gridViewActions.render defaultDensity="compact" />
            </@actionToolbar.render>

            <section class="grid-wrapper">
              <div id="allGuidanceInquiryGrid" class="ag-theme-alpine app-grid screen-grid"></div>
            </section>
          </section>
        </section>
      </div>
    </main>
  </div>

  <@gridManager.preferenceModal />
</body>
</html>
