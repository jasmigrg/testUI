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
  <link rel="stylesheet" href="${ctx}/css/action-toolbar.css">
  <link rel="stylesheet" href="${ctx}/css/page-toast.css">
  <link rel="stylesheet" href="${ctx}/css/screen-shared.css">
  <link rel="stylesheet" href="${ctx}/css/manage-mck-brand-logic.css">
  <link rel="stylesheet" href="${ctx}/css/margin-funding-maintenance.css">
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
<body class="mfi-page screen-page mck-brand-logic-page">

  <#include "/components/header.ftl">
  <#import "/components/sidebar.ftl" as sidebar>
  <#import "/components/page-header.ftl" as pageHeader>
  <#import "/components/grid-manager-macro.ftl" as gridManager>
  <#import "/components/grid-view-actions.ftl" as gridViewActions>

  <input type="hidden" id="currentUserId" value="${userId!'defaultUser'}" />

  <div class="app-shell">
    <@sidebar.navigation currentPath="/manage-mck-brand-logic" />

    <main class="content">
      <div class="content-card">
        <@pageHeader.render
          title="Manage McK Brand Logic"
          crumbs=[{"label":"Home","href":"${ctx}/"},{"label":"Manage McK Brand Logic"}]
        />

        <section class="screen-page-shell mck-brand-logic-shell" aria-label="Manage McK Brand Logic">
          <div class="screen-tabs mck-brand-logic-tabs" role="tablist" aria-label="McK brand logic tabs">
            <button
              type="button"
              class="screen-tab-btn is-active"
              id="mck-tab-weighting"
              role="tab"
              aria-selected="true"
              aria-controls="mck-panel-weighting"
              data-mck-tab="weighting"
            >
              GM Core MCKB Price Scoring Weighting
            </button>
            <button
              type="button"
              class="screen-tab-btn"
              id="mck-tab-quality-tier"
              role="tab"
              aria-selected="false"
              aria-controls="mck-panel-quality-tier"
              data-mck-tab="quality-tier"
            >
              GM Core Paramter MCKB Quality Tiers
            </button>
            <button
              type="button"
              class="screen-tab-btn"
              id="mck-tab-relative-delta"
              role="tab"
              aria-selected="false"
              aria-controls="mck-panel-relative-delta"
              data-mck-tab="relative-delta"
            >
              GM Core Paramter MCKB Relative Price Delta
            </button>
            <button
              type="button"
              class="screen-tab-btn"
              id="mck-tab-price-cap"
              role="tab"
              aria-selected="false"
              aria-controls="mck-panel-price-cap"
              data-mck-tab="price-cap"
            >
              GM Core Parameter MCKB Price Change CAP
            </button>
            <button
              type="button"
              class="screen-tab-btn"
              id="mck-tab-brand-multiplier"
              role="tab"
              aria-selected="false"
              aria-controls="mck-panel-brand-multiplier"
              data-mck-tab="brand-multiplier"
            >
              GM Core Output Brand Multiplier
            </button>
          </div>

          <#assign iconBack><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6L9 12L15 18" /></svg></#assign>
          <#assign iconAdd><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V19" /><path d="M5 12H19" /></svg></#assign>
          <#assign iconHeart><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20L4.7 12.7A4.8 4.8 0 1 1 11.5 5.9L12 6.4L12.5 5.9A4.8 4.8 0 1 1 19.3 12.7L12 20Z" /></svg></#assign>
          <#assign iconDisable><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M8.5 8.5L15.5 15.5" /></svg></#assign>
          <#assign iconUpdate><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8V12L15 14" /><circle cx="12" cy="12" r="8" /></svg></#assign>
          <#assign iconRefresh><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12A8 8 0 1 1 17.6 6.2" /><path d="M20 4V10H14" /></svg></#assign>
          <#assign iconExecute><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20L16.5 16.5" /></svg></#assign>

          <section class="gt-grid-controls">
            <div
              class="gt-action-toolbar mck-tab-action-toolbar"
              role="toolbar"
              aria-label="McK brand logic actions"
              data-mck-actions
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
              <button type="button" class="gt-action-btn has-divider" aria-label="Disable" data-action="disable">
                ${iconDisable}
                <span>Disable</span>
              </button>
              <button
                type="button"
                class="gt-action-btn has-divider"
                aria-label="Update Termination Date"
                data-action="update-termination-date"
              >
                ${iconUpdate}
                <span>Update Termination Date</span>
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

          <h2 class="screen-panel-title" id="mckActiveTabTitle" aria-live="polite">GM Core MCKB Price Scoring Weighting</h2>

          <section
            class="screen-tab-panel is-active"
            id="mck-panel-weighting"
            role="tabpanel"
            aria-labelledby="mck-tab-weighting"
            data-mck-panel="weighting"
          >
            <section class="grid-wrapper">
              <div class="screen-grid-empty-state" id="mckWeightingEmptyState" hidden>
                <strong>No rows to show</strong>
              </div>
              <div id="mckWeightingGrid" class="ag-theme-alpine app-grid screen-grid"></div>
            </section>
          </section>

          <section
            class="screen-tab-panel"
            id="mck-panel-quality-tier"
            role="tabpanel"
            aria-labelledby="mck-tab-quality-tier"
            data-mck-panel="quality-tier"
            hidden
          >
            <section class="grid-wrapper">
              <div id="mckQualityTierGrid" class="ag-theme-alpine app-grid screen-grid"></div>
            </section>
          </section>

          <section
            class="screen-tab-panel"
            id="mck-panel-relative-delta"
            role="tabpanel"
            aria-labelledby="mck-tab-relative-delta"
            data-mck-panel="relative-delta"
            hidden
          >
            <section class="grid-wrapper">
              <div id="mckRelativeDeltaGrid" class="ag-theme-alpine app-grid screen-grid"></div>
            </section>
          </section>

          <section
            class="screen-tab-panel"
            id="mck-panel-price-cap"
            role="tabpanel"
            aria-labelledby="mck-tab-price-cap"
            data-mck-panel="price-cap"
            hidden
          >
            <section class="grid-wrapper">
              <div id="mckPriceCapGrid" class="ag-theme-alpine app-grid screen-grid"></div>
            </section>
          </section>

          <section
            class="screen-tab-panel"
            id="mck-panel-brand-multiplier"
            role="tabpanel"
            aria-labelledby="mck-tab-brand-multiplier"
            data-mck-panel="brand-multiplier"
            hidden
          >
            <section class="grid-wrapper">
              <div id="mckBrandMultiplierGrid" class="ag-theme-alpine app-grid screen-grid"></div>
            </section>
          </section>
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
