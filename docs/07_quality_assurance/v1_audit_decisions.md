# V1 Quality Audit – Decisions Log

This log records decisions made on V1 quality-audit findings. Its purpose is to keep
accepted design decisions and accepted technical debt visible in later audits, so that
they are neither reported again as new defects nor forgotten.

**Project:** Pellet Supply Chain Management Dashboard  
**Scope:** V1 Power BI report and semantic model

## Decision status values

| Status | Meaning |
|---|---|
| ACCEPTED AS DESIGNED | The behaviour is intentional. It is not a defect. |
| KNOWN TECHNICAL DEBT – ACCEPTED FOR V1 | The implementation is not ideal, but the current result is acceptable for V1. The item stays open for a future version. |
| FIXED AND VERIFIED | The issue was corrected, the resulting project configuration was inspected, and the expected behaviour was demonstrated in Power BI Desktop. |

## Summary

| ID | Finding | Status | Date | Model/report changed |
|---|---|---|---|---|
| B2-1a | Static title "Production Actual" on the V1 Dashboard production comparison chart | ACCEPTED AS DESIGNED | 12 November 2026 | No |
| B2-1b | Outdated option labels in the `Production Chart Title` measure | KNOWN TECHNICAL DEBT – ACCEPTED FOR V1 | 12 November 2026 | No |
| B2-2 | Outdated `Reset - Sales Analysis` bookmark after the A1 sales-channel budget fix; associated `Reset - V1 Dashboard` state also refreshed | FIXED AND VERIFIED | 13 November 2026 | Yes – report bookmarks, visual states and start page |

---

## B2-1 – V1 Dashboard production comparison chart title

### Affected objects

- Page: **V1 Dashboard**
- Visual: clustered column chart `e2765a8dc5d09c18b07b`
  (`powerbi/Pellet_SC_dachboard.Report/definition/pages/718c030b07cb52bb7067/visuals/e2765a8dc5d09c18b07b/visual.json`)
- Slicer: **Compare production with** (`4349554404a70d839221`), field parameter
  `Production Chart Selector` with the options `Budget` and `Sales`
  (`powerbi/Pellet_SC_dachboard.SemanticModel/definition/tables/Production Chart Selector.tmdl`)
- Title measure: `_Measures[Production Chart Title]`
  (`powerbi/Pellet_SC_dachboard.SemanticModel/definition/tables/_Measures.tmdl`, lines 233–251)

### B2-1a – Static chart title

**Status:** ACCEPTED AS DESIGNED  
**Decided by:** Project owner

The chart always focuses on actual production volume (**Production Actual**).
The slicer **Compare production with** changes only the comparison baseline:

- **Budget** – actual production compared with planned production.
- **Sales** – actual production compared with actual sales across all sales channels.

The subject of the chart does not change, only the baseline does. The static title
**Production Actual** is therefore an intentional business and design decision. The chart
legend shows which baseline is currently selected.

### B2-1b – Outdated option labels in `Production Chart Title`

**Status:** KNOWN TECHNICAL DEBT – ACCEPTED FOR V1  
**Decided by:** Project owner

`Production Chart Title` still compares the selector against the earlier option labels
`"Production Budget"` and `"Sales Actual"` (`_Measures.tmdl`, lines 248–249). The labels in
`Production Chart Selector` were later renamed to `"Budget"` and `"Sales"`. Because no
`SWITCH` branch matches, the measure always returns its default value, `"Production Actual"`
(line 250).

The measure is in active use: it is bound to the chart title. The displayed title comes
from the measure's default branch, not from a fixed text value. The current result matches
the accepted design (B2-1a), but the implementation reaches it through unmatched branches.

This item does not need to be fixed before the V1 release. It remains open technical debt.

### Changes made

None. The visual, the DAX measure and the field parameter were not changed.

### Guidance for future audits

- Do not report the static title **Production Actual** as a defect (B2-1a).
- Keep B2-1b visible as open technical debt until the measure is cleaned up.
- When the measure is cleaned up, the agreed static title **Production Actual** must be
  kept. For example, set the title to a fixed text or reduce the measure to return
  "Production Actual". Updating only the `SWITCH` labels would make the title dynamic
  ("Production Actual vs Budget" / "Production Actual vs Sales") and would contradict B2-1a.

---

## B2-2 – Reset bookmarks after the A1 sales-channel budget correction

**Status:** FIXED AND VERIFIED  
**Decided by:** Project owner  
**Decision recorded:** 13 November 2026

### Original finding and business context

After the A1 correction to sales-channel budget allocation, **Reset - Sales Analysis**
still restored a state saved before the correction. At that earlier stage the
channel-level sales-budget analysis was not yet correctly available, so the Reset
state intentionally displayed only **Sales Budget** and **Sales Attainment**. It
was not revised when A1 made channel-specific Actual-versus-Budget analysis usable.

The read-only audit confirmed that the old bookmark contained:

- an obsolete `fact_sales[channel_id]` selection in **Sales View Selector**;
- only two of the four available **Sales KPI Selector** values;
- old `channel_id` projections and matrix expansion state;
- a different reset state from the subsequently saved Sales Analysis page.

The issue was **functionally reproduced**: clicking **Reset filters** restored
only **Sales Budget** and **Sales Attainment**, rather than all four Sales KPIs.
This was a real, outdated Reset configuration, not merely harmless metadata.

### Decision and implemented change

The project owner updated the bookmark using **Power BI Desktop → Bookmarks →
Reset - Sales Analysis → Update**, rather than editing the JSON manually.
The agreed Reset state is:

| Control | Intended Reset state |
|---|---|
| Sales KPI Selector | All – Sales Actual, Sales Budget, Sales Variance, Sales Attainment |
| Sales View Selector | Product |
| Year, Month, Plant, Product and Channel | All (no selections) |

The saved Sales Analysis page state was aligned with this Reset state. In the
bookmark JSON, **All** for the KPI field parameter is represented by *no saved
selection filter*, not an explicit list of four KPI names.

The project owner also refreshed **Reset - V1 Dashboard** after aligning its
three bottom tables to the **Product** perspective:

- **Sales View** – Product (restored by the matrix's active drill/projection
  state; there is no separate Sales View slicer on this page).
- **Production View** – Product (restored by the Production View field-parameter
  slicer).
- **Production vs Sales** – Product (the matrix uses Product as its row field).
- **Production KPI Selector** – All four KPIs.
- **Compare production with** – Budget.
- **Year, Month, Plant, Product and Channel** – All.

The two lower views use **different mechanisms** to reach Product: the Sales
matrix uses its drill state, while the Production matrix uses a field parameter.
That difference is intentional and does not prevent the agreed Reset behaviour.
The report's saved start page was also set to **V1 Dashboard**.

### Verification evidence

**Power BI Desktop – functional checks (performed by the project owner):**

1. **Sales Analysis:** before Reset, Plant = PLANT-B and Sales Actual was
   approximately 478K. After Reset, Plant = All, Sales View = Product, all four
   Sales KPI columns were visible, and Sales Actual was approximately 2.43M
   (Sales Budget approximately 2.42M; Budget Attainment 100.27%). **PASS.**
2. **V1 Dashboard:** before Reset, **Compare production with = Sales**,
   **Production View = Plant**, and a product was selected in the Sales matrix,
   cross-filtering other visuals (Sales Actual approximately 20.4K; Production
   Actual approximately 20.6K). After Reset, the comparison was **Budget**,
   the three lower tables showed **Product** rows for all products, the four
   Production KPIs were available, and the cross-selection was cleared.
   Sales Actual returned to approximately 2.43M and Production Actual to
   approximately 2.41M. **PASS.**

**PBIP files – read-only follow-up performed in Claude Code after Desktop was
saved and closed:**

- `Reset - Sales Analysis` stores Product for Sales View and no explicit KPI
  selection, consistent with all four KPIs being shown. The obsolete
  `fact_sales[channel_id]` references were reduced from **14 to 0**.
- `Reset - V1 Dashboard` stores the agreed Product/Budget/All state. The obsolete
  `fact_sales[channel_id]` references previously noted there were reduced from
  **5 to 0**.
- The three synchronized Channel slicers on Sales Analysis, V1 Dashboard and
  QA Validation no longer save **Direct B2B** as the default; they open with
  Channel = All.
- The report's `pages.json` identifies V1 Dashboard as the active start page.
- The follow-up found **12 modified `.Report` files**, all attributable to the
  two bookmark updates, associated visual/default states, synchronized slicers
  and start-page selection. No semantic-model changes were reported.

### Affected objects and files

**Bookmarks:**

- Sales Analysis: `powerbi/Pellet_SC_dachboard.Report/definition/bookmarks/65c10f61dffbd755f655.bookmark.json`
- V1 Dashboard: `powerbi/Pellet_SC_dachboard.Report/definition/bookmarks/e9bbd807596ea7e492a1.bookmark.json`

**Sales Analysis visuals** (under `powerbi/Pellet_SC_dachboard.Report/definition/pages/2dfa404d9698ab7333ba/visuals/`):

- `87e315241947b2e32005/visual.json` – Sales View Selector default.
- `2419b340904920b0cc6c/visual.json` – Sales View matrix projection.
- `753edd3f8d5a412dc85d/visual.json` – Sales by Selected View chart projection.
- `891fa77d3bb2deb4b5b2/visual.json` – Sales KPI Selector default.
- `9095b00f9fa045248a11/visual.json` – synchronized Channel selection.

**V1 Dashboard visuals** (under `powerbi/Pellet_SC_dachboard.Report/definition/pages/718c030b07cb52bb7067/visuals/`):

- `3d0d…/visual.json` – Production View Selector (Product default).
- `a4dc…/visual.json` – Production View matrix (Product projection).
- `0bfc0cb87d6fdfc88ce2/visual.json` – synchronized Channel selection.

**Other files:**

- `powerbi/Pellet_SC_dachboard.Report/definition/pages/40f9…/visuals/c0babbb0ab9c773afa3c/visual.json` – QA Validation synchronized Channel selection.
- `powerbi/Pellet_SC_dachboard.Report/definition/pages/pages.json` – V1 Dashboard as start page.

*Abbreviated IDs above reproduce the read-only audit's available identifiers;
full identifiers should be taken from the current repository when needed.*

### Guidance for future audits

- Treat B2-2 as **FIXED AND VERIFIED**; do not reopen it on the basis of the
  pre-A1 bookmark state.
- Both Reset bookmarks were verified in Power BI Desktop, in addition to the
  read-only PBIP inspection. Recheck them if field parameters, synchronized
  slicers or page drill behaviour are changed later.
- Preserve the deliberate Product-oriented V1 Dashboard default and the four-
  KPI Sales Analysis reset state unless the project owner approves a new design.
- B2-1b remains separate, open technical debt; the B2-2 fix does not resolve it.
