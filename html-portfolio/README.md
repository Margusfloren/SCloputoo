# Pellet Supply Chain Dashboard – interactive web demo

An interactive, browser-based demonstration of the **Power BI V1 Pellet Supply Chain Management Dashboard**.
It runs entirely in the browser. It needs no Power BI service, PostgreSQL connection, account, server or CDN, and it sends no data to third parties.

All data is **synthetic**. This is a **static presentation** of aggregated V1 data, not live reporting connected to PostgreSQL or Power BI.

## Files

| Path | Purpose |
|---|---|
| `index.html` | Page shell, navigation and the *About the Project* text |
| `css/styles.css` | Styling. Colours are taken from the Power BI report definition (PBIR) |
| `js/calc.js` | DAX measure logic re-implemented in JavaScript (filters, KPIs, attainment, plant share) |
| `js/charts.js` | Dependency-free SVG charts with tooltips |
| `js/app.js` | Pages, slicers, selectors, tables, routing and shared filter state |
| `data/demo-data.js` | Aggregated demo data (generated; see below) |
| `tools/export_demo_data.py` | Read-only export of monthly aggregates from the PostgreSQL Gold layer |
| `tools/selftest.js` | Self-test against the audited reference values (`index.html?selftest=1`) |

## Opening locally

Double-click `index.html`, or open it in any modern browser. The data is loaded with a `<script>` tag, not `fetch()`, so the page also works from `file://` without a web server.

## Data

`data/demo-data.js` is produced by `tools/export_demo_data.py` (requires Python and `psycopg`):

```
cd html-portfolio/tools
python export_demo_data.py
```

The script asks for the PostgreSQL user and password. They are used only for the connection and are never written to disk. It runs **read-only** queries and exports:

- **Sales:** year, month, plant_id, product_id, channel_id, sum of actual tonnes, sum of budget tonnes. `gold.fact_sales` and `gold.fact_sales_budget` are aggregated separately and then joined on these keys.
- **Production:** year, month, plant_id, product_id, actual and budget tonnes. These come from `gold.fact_production` and `gold.fact_production_budget`, aggregated in the same way.
- **Dimensions:** plant, product and channel names. The `Tehas ` → `Plant ` rename is applied, as in Power Query.
- **Control values:** fact-table grand totals and orphan-key counts.

The export contains no customer IDs, invoice numbers, prices, individual transactions, raw files or connection details.

Sales and production are never joined row by row, so quantities cannot be duplicated. The channel dimension filters only sales and sales budget, as in the semantic model.

## Business rules reproduced from the Power BI model

- KPI cards follow the `… Selected Period` measures and the K/M display format strings. Attainment colour bands come from the PBIR conditional formatting.
- The **Channel** slicer exists only on the Overview and Sales Analysis pages. It filters sales actual **and** sales budget.
- **Production vs Sales** always uses sales across **all channels**:
  - the Overview *Compare production with → Sales* option uses `Sales Actual Selected Period All Channels`;
  - the *Production vs Sales by Product* table ignores the Channel slicer, which has the `NoFilter` interaction;
  - production pages have no Channel slicer.
- Year, Month, Plant and Product are shared across pages, like the synchronised slicers in Power BI.
- *Plant Production Share %* is calculated within the selected plants (`ALLSELECTED`).

## Visual interactions (cross-filter / cross-highlight)

On every report page you can start the analysis from a chart or a table, not only from the slicers. Click a column, bar, stacked segment, table row or matrix cell to select it:

- Clicking the same element again, in any visual on the page, clears the selection.
- Clicking another element replaces the selection.
- **Clear selection** (the bar under the filters, or above Production Share % on Plant Analysis) and **Reset filters** clear it as well.
- Keyboard: every selectable element is a button with an accessible name. Tab moves between them, and Enter or Space selects.

### What can be selected

| Page | Source visual | Selects |
|---|---|---|
| Overview | Sales Actual vs Budget, Production chart (monthly columns) | one **year + month** (e.g. March 2024, not every March) |
| | Sales View table | product |
| | Production View table | plant or product, following the Production View Selector |
| | Production vs Sales by Product table | product |
| Sales Analysis | Sales Actual vs Budget (monthly columns) | one year + month |
| | Sales by Selected View (bars), Sales View table | plant, product or **channel**, following the Sales View Selector |
| | Sales Actual vs Budget matrix | one year + month (month cells only) |
| Production Analysis | Production Actual vs Budget, Production vs Sales (monthly columns) | one year + month |
| | both year × month matrices | one year + month (month cells only) |
| Plant Analysis | Production Share %, Production Mix (any segment), Production vs Budget (any month, Actual or Budget), plant table | plant |
| Product Analysis | Production vs Budget, Production vs Sales (product columns) | product |
| | Product performance by plant table, Production Share % by plant | plant |

Total rows, year-total columns and grand-total rows are never selection sources. When a View Selector changes, the click changes meaning with it, and a selection made in that view is cleared.

### How the other visuals react

The behaviour follows the Power BI defaults found in the V1 PBIR. There are no `visualInteractions` overrides except the Overview Channel slicer → PvS table (`NoFilter`), and no report-level "filter instead of highlight" setting.

- **KPI cards, tables and matrices are cross-filtered.** They are recalculated for the selection.
- **Charts are cross-highlighted.** All data stays visible:
  - For a selection on the chart's own dimension (e.g. a month on a monthly chart), the other categories are dimmed.
  - For another dimension (e.g. a product on a monthly chart), each bar is drawn dimmed at full height, with the selected part solid on top. The tooltip shows the selected part, e.g. "Sales Actual – Premium pellet 15 kg 6 mm".
- **The source visual is not filtered by its own selection.** It shows the selection and dims the rest, so another element can be picked directly.
- **Exceptions:**
  - On Plant Analysis, the plant table filters to the selected row; this stage-1 behaviour is kept.
  - On Product Analysis, a **product** selection filters Production Share % by plant to that product's output, because a highlighted part of a percentage has no meaning.
- **The % panels** (Sales/Production Attainment %, Production vs Sales %) keep the slicer context and are not highlighted. On Production Analysis, the period note under Production vs Sales follows the selection like a card.
- **Production vs Sales always uses sales of all channels.** A channel selection or the Channel slicer never changes Production Actual, Production Budget, Production vs Sales or Production vs Sales %. Production has no channel dimension.

### Slicers and chart selections

1. **Slicer filters** (`state.f`) are shared across pages, like the synchronised V1 slicers.
2. **The chart selection** (`state.selections[page]` = `{visual, field, value}`, with field `ym`, `plants`, `products` or `channels`) is one per page. It is page-scoped: it is kept when you return to the page and never applied to other pages. It always lies inside the slicer context; a slicer change that excludes it clears it automatically.
3. **The interaction table** `INTERACTIONS[page]` in `js/app.js` defines the source visuals and the effect on each target (`filter`, `highlight`, `none`), with optional per-source overrides. Charts and tables get their behaviour from shared helpers (`selectable`, `highlightProps`, `hlSeries`, `tableSel`, `matrixSel`). There is no per-page copy of the logic.

### Differences from Power BI V1 (not verified click by click in Power BI Desktop)

The effects follow the documented Power BI defaults and the V1 PBIR, but they were not compared in Power BI Desktop. Known or likely differences:

- One data point at a time; Power BI's Ctrl+click multi-select is not implemented. Use the slicers for several values.
- A click selects one dimension:
  - stacked segments → plant (Power BI: plant + product);
  - monthly plant bars → plant (Power BI: month + plant);
  - matrix cells → year + month (Power BI may also select the measure row).
- Slicers are not cross-filtered by a selection; Power BI would hide slicer items without data.
- The % panels are not highlighted.
- In Power BI, a chart selection on the Overview Production vs Sales table could, in principle, cross-filter it by channel. Here it never does, because the business rule requires all channels; no source visual on Overview selects a channel anyway.
- Drill-down, drill-through and right-click actions are not available.
## Production vs Sales % (Production Analysis)

Below the *Production vs Sales* bars, a separate panel (not a secondary axis) plots the monthly ratio:

```
Production vs Sales % = Production Actual / Sales Actual        (DAX: DIVIDE([Production Actual], [Sales Actual]))
```

- **100%:** production volume equals sales volume. **Above 100%:** production exceeded sales. **Below 100%:** sales exceeded production.
- **Sales Actual** is the sales of **all channels**, even when a channel is selected on another page. This is the same all-channel rule as the bars and the matrix. The panel reuses the same monthly aggregates, so no separate filter logic exists. Year, Month, Plant and Product filter both production and sales.
- **Multi-month periods:** the note below the chart shows the period ratio as total production ÷ total sales, not as an average of monthly percentages. Example: full period 2,406,082.3 / 2,429,578.7 = 99.03%.
- **Zero sales:** the ratio is blank (a gap in the line, "(Blank)" in the tooltip), never NaN or Infinity.
- The y-axis adapts to the data, always includes the 100% reference line and spans at least 10 percentage points, so small changes are not exaggerated.
- This is a **volume ratio**, not an inventory, stock-level or stock-coverage measure. V1 contains no inventory data.
- When the two charts on the page sit side by side, their legends are kept the same height, so both plots and both % panels start at the same level.

## Self-test

Open `index.html?selftest=1`. A panel lists the results of checks against:

- the full-period control values (Sales 2,429,578.7 / 2,423,099.1 t; Production 2,406,082.3 / 2,419,001.0 t; 100.27% / 99.47%);
- the B9 SQL ↔ Power BI reconciliation (`sql/14_channel_plant_powerbi_reconciliation.md`);
- values visible in the V1 screenshots (by product, by year, selected months, plant shares);
- no-double-counting and channel-rule checks;
- UI behaviour: filters, page persistence, selectors and reset.

Open `index.html?fulltest=1` for the extended functional test (`tools/fulltest.js`, 288 checks; the cross-filtering tests (sections X, Y, O, S, R, Q, Z) drive real clicks and key presses on every page). It drives the real controls: slicer checkboxes, page tabs, plant tiles, the compare toggle and Reset. It reads the rendered tables and chart tooltips and compares them with:

- the B9 Power BI displayed values (channel and plant rows);
- the business rules: the Channel filter applies only to sales, and Production vs Sales always uses all channels;
- filter persistence across pages, Reset, the selectors and empty-result handling.

Display rounding: source quantities have 0.1 t precision. Values are first rounded to 0.1 t to remove floating-point noise, then to whole tonnes (half up). Exact halves therefore display as in Power BI, for example RET variance −942.5 → −942 and Plant B budget 472,000.5 → 472,001.

To run the self-test headless (Windows / Edge):

```
msedge --headless=new --virtual-time-budget=6000 --dump-dom "file:///<path>/html-portfolio/index.html?selftest=1"
```

## Publishing with GitHub Pages

The workflow `.github/workflows/deploy-html-portfolio.yml` publishes the demo with the official GitHub Pages actions (`upload-pages-artifact`, `configure-pages`, `deploy-pages`).

- **Runs only** on a push to `main` that changes the site files or the workflow, or when started manually on `main`. Pushes to other branches (e.g. `dev`) do not deploy.
- **Publishes exactly six files:** `index.html`, `css/styles.css`, `js/calc.js`, `js/charts.js`, `js/app.js` and `data/demo-data.js`. They are copied into a temporary folder, and the build fails if a file is missing or the package contains anything else. `tools/`, this README, the JSON copy of the data and the export script are not part of the site.
- **Permissions:** the build job may only read the repository. The deploy job has only `pages: write` and `id-token: write`. Nothing connects to PostgreSQL.
- **One-time setting:** in *Settings → Pages*, set *Build and deployment → Source* to **GitHub Actions**.

The site URL is `https://margusfloren.github.io/SCloputoo/`. The self-test URLs (`?selftest=1`, `?fulltest=1`) work only in a local copy, because `tools/` is not published.

Files in a public repository are public regardless of what Pages serves. Limiting the Pages package keeps the site clean; it is not a confidentiality control.

`data/demo-data.json`, the identical JSON copy written by the export script, is listed in `html-portfolio/.gitignore` and is not committed.

## Known differences from the Power BI report

- The data is monthly. There is no day-level detail and no drill-down.
- Attainment trend lines are shown in a separate panel below the bars, not on a secondary axis.
- Slicers are multi-select checkbox lists. Clicking a plant tile toggles that plant.
- The hidden QA Validation page is not included.
- English month names are used in the matrices. The Power BI matrix shows month names from the database.
