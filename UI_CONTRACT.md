# UI Contract For Pricing Screens

This project uses a shared UI/CSS contract so pricing grid screens (Margin Funding and future screens) match consistently.

## 1) CSS Layering (mandatory)

- `src/main/resources/static/css/base.css`
  - Global reset, box model, base typography, global body/background only.
- `src/main/resources/static/css/layout.css`
  - App shell structure (`.app-shell`, `.content`, responsive shell behavior).
- `src/main/resources/static/css/header.css`
  - Header-only styles.
- `src/main/resources/static/css/sidebar.css`
  - Sidebar-only styles.
- `src/main/resources/static/css/page-header.css`
  - Reusable page header/breadcrumb blocks.
- `src/main/resources/static/css/grid.css`
  - AG Grid shared theme + cell/filter/pagination styles.
- `src/main/resources/static/css/grid-manager.css`
  - Shared Grid Manager bar/dropdowns/modal/toast styles.
- `src/main/resources/static/css/grid-page.css`
  - Shared page-level grid layout rules for grid-based pricing screens.
- `src/main/resources/static/css/modal.css`
  - Shared modal styles (bulk-upload + action modals).
- `src/main/resources/static/css/page-toast.css`
  - Shared page toast look/placement.
- Screen CSS files (example: `pricing-inquiry.css`)
  - Screen-specific UI only. Do not redefine shared shell/header/sidebar/grid-manager behavior here.

## 2) Template inclusion rules

Every pricing screen must include:

- `${ctx}/css/app.css`
- `${ctx}/css/grid.css` (if AG Grid page)
- `${ctx}/css/grid-manager.css` (if Grid Manager macro used)
- `${ctx}/css/grid-page.css` (if AG Grid page using shell layout)
- `${ctx}/css/modal.css` (if using bulk-upload or action modals)
- `${ctx}/css/page-toast.css` (if using `PageToast`)

Do not include `header.css`, `layout.css`, `sidebar.css`, `page-header.css` directly in screens that already include `app.css`.

## 3) Markup contract for AG Grid screens

- Use a screen scope body class (example: `<body class="mfi-page">`).
- Grid container must use:
  - `class="ag-theme-alpine app-grid"`
- Grid Manager should come from:
  - `src/main/resources/templates/components/grid-manager-macro.ftl`
- Shared density/download controls should come from:
  - `src/main/resources/templates/components/grid-view-actions.ftl`

## 4) JS contract

- Create grids via `DynamicGrid.createGrid(config)` only.
- Initialize manager after grid creation:
  - `GridManager.init(window.gridApi, '<gridElementId>')`
- Do not create alternate grid-manager DOM/JS implementations per screen.

## 5) PR checklist for UI parity

- No duplicate style definitions for `.app-shell`, `.content`, `.sidebar`, `.gm-*`, `.ag-theme-alpine`.
- No inline size styles for grid containers (use `.app-grid`).
- 100% zoom screenshot proof for the screen(s) changed in the PR (for example Margin Funding screens)
- Validate:
  - Header fixed and aligned
  - Sidebar not overlapping content unexpectedly
  - Grid area fills content card without clipping
  - Grid Manager dropdowns visible and clickable

## 6) Asset cache strategy (team rule)

- Do not commit manual `?v=` query-string bumps in template asset links by default.
- During local debugging only, temporary `?v=` bumps are allowed to force browser refresh.
- Before commit/PR, remove temporary `?v=` bumps and keep clean asset paths.
- Long term preferred approach is build-time fingerprinting/hashed asset filenames.

## 7) New grid screen starter (copy vs reuse)

When building a new grid-based pricing screen, use this pattern.

### Copy these per new screen

- Screen template (rename and edit):
  - `src/main/resources/templates/pricing/margin-funding-maintenance.ftl`
- Screen JS (rename and edit):
  - `src/main/resources/static/js/margin-funding-maintenance.js`
- Screen CSS only if needed (rename and keep minimal):
  - `src/main/resources/static/css/margin-funding-maintenance.css`

### Reuse these shared files (do not copy)

- Toolbar macro:
  - `src/main/resources/templates/components/action-toolbar.ftl`
- Grid Manager macro:
  - `src/main/resources/templates/components/grid-manager-macro.ftl`
- Grid view actions macro (density + download):
  - `src/main/resources/templates/components/grid-view-actions.ftl`
- Shared grid engine:
  - `src/main/resources/static/js/dynamic-grid.js`
- Shared Grid Manager behavior:
  - `src/main/resources/static/js/grid-manager.js`
- Shared toolbar behavior (density/download):
  - `src/main/resources/static/js/grid-toolbar.js`
- Shared page toast behavior:
  - `src/main/resources/static/js/page-toast.js`
- Shared toolbar styling:
  - `src/main/resources/static/css/action-toolbar.css`
- Shared grid/layout styling:
  - `src/main/resources/static/css/grid.css`
  - `src/main/resources/static/css/grid-manager.css`
  - `src/main/resources/static/css/grid-page.css`
  - `src/main/resources/static/css/modal.css`
  - `src/main/resources/static/css/page-toast.css`
  - `src/main/resources/static/css/app.css`

### What to customize in the new screen

- In screen FTL:
  - `actionItems` list (which toolbar buttons to show, labels, icon SVG, order)
  - Grid title/breadcrumb text
  - Grid id
- In screen JS:
  - API endpoint
  - Column definitions
  - CSV export filename
  - Grid manager init grid id
  - Any screen-specific actions
- In screen CSS:
  - Only true screen-specific overrides; do not duplicate shared toolbar/grid/layout rules.

### Important convention

- Keep button declaration per screen, but keep rendering/behavior shared.
- Class naming for shared toolbar controls is generic `gt-*` (not screen-specific prefixes).

## 8) How it works (end-to-end flow)

Use this to explain the architecture quickly to other devs.

1. Screen loads
- Screen FTL imports shared macros and defines screen-specific config:
  - toolbar `actionItems`
  - grid container id
  - page text (title/breadcrumb)

2. Shared toolbar renders UI
- `components/action-toolbar.ftl` renders the toolbar from `actionItems`.
- Right section hosts shared grid manager + shared view controls macro (`grid-view-actions.ftl`).

3. Screen JS creates the grid
- Screen JS calls `DynamicGrid.createGrid(config)`.
- `gridApi` is returned and stored for runtime actions.

4. Shared modules attach behavior
- `grid-manager.js` wires column/preference UI.
- `grid-toolbar.js` wires density buttons and CSV download.
- Screen JS wires screen-specific actions (for example Execute/Refresh handling).

5. User performs actions
- Execute: applies pending floating filters through grid API flow.
- Refresh: resets filters/sort/page using `gridApi`.
- Density: updates row/header sizing via `gridApi.setGridOption(...)`.
- Download: exports visible data via `gridApi.exportDataAsCsv(...)`.

6. Data source mode
- In server mode, grid requests go to screen endpoint (BFF/api URL from screen JS).
- Backend owns final filtering/sorting/pagination behavior.
- UI stays stable; mostly endpoint/contract mapping changes during integration.

### Quick one-line summary

- Screen files declare "what this screen needs"; shared files implement "how grid pages behave."

## 9) Add Screen + Bulk Upload parity contract

Use this for any add screen that supports unfinished batch uploads + row correction.

### Shared assets to always reuse

- `src/main/resources/static/js/bulk-upload-modal.js`
- `src/main/resources/static/js/bulk-upload-flow.js`
- `src/main/resources/static/css/modal.css`
- `src/main/resources/static/css/bulk-upload-flow.css`

Do not copy/paste bulk upload engine code into each screen JS.

### Required UI hooks in screen template

- Batch card wrapper:
  - `bulk-upload-batch-section`
- Batch info row/icon/text:
  - `bulk-upload-batch-info-row`
  - `bulk-upload-batch-info-icon`
  - `bulk-upload-batch-info-text`
- Collapse button:
  - `id="kviBatchCollapseBtn"` (or screen-specific id)
  - class includes `bulk-upload-batch-collapse-btn`
- Batch columns/list containers:
  - `bulk-upload-batch-columns`
  - `bulk-upload-batch-list`

### Grid visual parity rules (mandatory)

- Use same AG Grid icon config for sort states across all add/list screens:
  - `sortUnSort`, `sortAscending`, `sortDescending` SVGs must match.
- Keep default colDef parity:
  - `sortable: true`
  - `unSortIcon: true`
  - `wrapHeaderText: true`
  - `autoHeaderHeight: true`
- Keep row/header density and typography aligned with shared `grid.css`.

### Upload and batch behavior contract

1. Clicking `Bulk Upload` opens modal only (no batch creation).
2. Clicking modal `Upload` creates a batch and starts import.
3. Uploaded rows must not auto-load in lower grid.
4. User clicks batch number to load rows.
5. Submit is selection-based (selected rows only).
6. Remaining/error rows stay in the batch for later correction.
7. Returning to page should reload unfinished batches from API by `screenCode` + user/context.

### Paste behavior contract

- Enable grid copy/paste via AG Grid clipboard pipeline.
- Default operational limits:
  - `maxPasteRows = 5000`
  - `maxPasteCols = 10`
  - `maxPasteCells = 50000`
- Show clear toast on limit breach and block oversized paste.

### Backend contract expectations for all screens

- `GET /api/v1/bulk-upload/batches?screenCode=...`
- `GET /api/v1/bulk-upload/batches/{batchId}/rows?screenCode=...&view=all|success|error`
- `POST /api/v1/bulk-upload/batches` (create batch)
- `POST /api/v1/bulk-upload/batches/{batchId}/file` or signed URL upload
- `POST /api/v1/bulk-upload/batches/{batchId}/import/start?screenCode=...`
- `DELETE /api/v1/bulk-upload/batches/{batchId}?screenCode=...`
- Screen submit API for selected rows (contract per domain)

## 10) Checkbox + modal + toast contract (current baseline)

### Grid checkbox behavior (select column)

- Header select-all uses shared class hooks:
  - `.gt-header-select-all`
  - `.gt-header-select-checkbox`
- Row checkboxes use AG Grid selection wrapper:
  - `.ag-selection-checkbox .ag-checkbox-input-wrapper input.ag-checkbox-input`
- If row is non-selectable (disabled/terminated), keep checkbox visible:
  - set `showDisabledCheckboxes: true` on select column
  - add cell lock class rule: `.is-selection-locked`
  - style disabled state in shared `grid.css`

### Action modal behavior (Disable / Update Termination Date)

- Use shared modal classes from `modal.css`:
  - `.mf-action-modal*` (or `.action-modal*`)
- Keep compact sizing and spacing:
  - disable/update dialogs use variant classes
  - labels regular weight
  - title color uses header teal token
  - cancel/save text not bold

### Toast behavior

- Use `window.PageToast.notify(...)` for screen toasts.
- Do not use screen-local toast implementations.
- Shared style and placement:
  - `page-toast.css` + `page-toast.js`
  - shown top-right below app header

## 11) KVI output filter operator mapping contract

For KVI output API filtering, UI must map AG Grid/filter-input operators to backend short codes:

- `equals` -> `eq`
- `greaterThan` -> `gt`
- `greaterThanOrEqual` -> `gte`
- `lessThan` -> `ls`
- `lessThanOrEqual` -> `lte`
- `contains` -> `like`
- `notEqual` -> `neq`

Date values should be sent as `YYYY-MM-DD` to API even if UI input is `MM/DD/YYYY`.

### New add screen checklist

- Import shared bulk-upload JS/CSS assets.
- Provide screen mapping config only:
  - `screenCode`
  - row normalization
  - row validation rules
  - submit payload mapping
- Keep screen CSS for local overrides only; never re-implement shared batch card styles.
