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
| FIXED AND VERIFIED | The issue was corrected and the result was verified using an appropriate method (e.g. Power BI Desktop, SQL execution, or source-file inspection). The relevant evidence is recorded with each decision. |
| FUTURE DEVELOPMENT – V2 | A potential later improvement, intentionally outside V1 scope. |
| NO ISSUE FOUND – VERIFIED | Review found no defect in the checked scope; no change required. |

## Summary

| ID | Finding | Status | Date | Model/report changed |
|---|---|---|---|---|
| A1 | Incorrect sales-budget allocation in channel views | FIXED AND VERIFIED | 13 November 2026 (decision logged) | Yes – sales field parameter and channel filtering |
| A2 | Incorrect documentation of Python as an independent sales-KPI calculation tool; earlier OTIF scope inconsistency | FIXED AND VERIFIED | 13 November 2026 | Yes – About page and project overview README (OTIF documentation corrected earlier) |
| A3 | Incomplete CTE / SQL syntax issue in the sales validation script | FIXED AND VERIFIED | 13 November 2026 (decision logged) | Yes – SQL QA script |
| B2-1a | Static title "Production Actual" on the V1 Dashboard production comparison chart | ACCEPTED AS DESIGNED | 12 November 2026 | No |
| B2-1b | Outdated option labels in the `Production Chart Title` measure | KNOWN TECHNICAL DEBT – ACCEPTED FOR V1 | 12 November 2026 | No |
| B2-2 | Outdated `Reset - Sales Analysis` bookmark after the A1 sales-channel budget fix; associated `Reset - V1 Dashboard` state also refreshed | FIXED AND VERIFIED | 13 November 2026 | Yes – report bookmarks, visual states and start page |
| B2-3a | Ambiguous "Budget Attainment Selected Period" labels on two sales KPI cards | FIXED AND VERIFIED | 13 November 2026 | Yes – two card labels and Desktop-generated language metadata |
| B2-3b | Hidden `Budget Attainment YTD %` measure has a misleading YTD name and description | KNOWN TECHNICAL DEBT – ACCEPTED FOR V1 | 13 November 2026 | No – measure deliberately retained |
| B3 | Incorrect summed row count (8,011 instead of 8,007) in Source/Bronze/Silver QA comments and documentation | FIXED AND VERIFIED | 13 November 2026 | No – SQL comments and QA Markdown documentation only |
| B4 | Documentation formatting, README placeholders, and relative links | FIXED AND VERIFIED | 13 November 2026 | Yes – seven README files |
| B5a | About-page spelling and outdated sales-channel usage guidance | FIXED AND VERIFIED | 13 November 2026 | Yes – two About-page text visuals |
| B5b | `tones` instead of `tonnes` in two sales-budget measure descriptions | FIXED AND VERIFIED | 13 November 2026 | Yes – measure descriptions only (DAX unchanged) |
| B5c | Obsolete duplicate `data/procecced/` placeholder directory | FIXED AND VERIFIED | 13 November 2026 | Yes – obsolete README deleted |
| B5d | Legacy hidden page name `Dasboard` and technical PBIP name `dachboard` | KNOWN TECHNICAL DEBT – ACCEPTED FOR V1 | 13 November 2026 | No – naming deliberately retained |
| B5e | Previously incorrect `Pellet_SC_dashboard` documentation path | FIXED AND VERIFIED (previously resolved) | 13 November 2026 (status recorded) | No new change |
| B6-1 | Six hidden legacy measures with no live report references | KNOWN TECHNICAL DEBT – ACCEPTED FOR V1 | 13 November 2026 | No |
| B6-2 | Inconsistent measure number formats; possible matrix display differences not visually confirmed | KNOWN TECHNICAL DEBT – ACCEPTED FOR V1 | 13 November 2026 | No |
| B6-3 | Automatic date/time hierarchy dependency | FUTURE DEVELOPMENT – V2 | 13 November 2026 | No |
| B6-4 | `gold dim_date` not marked as a date table | FUTURE DEVELOPMENT – V2 | 13 November 2026 | No |
| B6-5 | Descriptions of all 17 visible measures | NO ISSUE FOUND – VERIFIED | 13 November 2026 | No |
| B7-A | Inconsistent plant display names across slicers, charts and matrices | FIXED AND VERIFIED | 13 November 2026 | Yes – Power Query display-name step, six Plant slicers and five Reset bookmarks |
| B8 | Outdated documentation requiring production volume units to be confirmed | FIXED AND VERIFIED | 13 November 2026 | No – three SQL documentation statements corrected; data, SQL logic and DAX unchanged |
| B9 | SQL ↔ Power BI reconciliation initially documented only at grand-total level | FIXED AND VERIFIED – defined reconciliation scope | 13 November 2026 | No – new reconciliation record and README reference; model and report unchanged |
| B10 | Minor repository and documentation issues (five sub-findings B10-1 to B10-5) | CLOSED – documentation corrections and English translation completed | 13 November 2026 | No – documentation and SQL comments only (eleven files); model, report, SQL query logic and Python logic unchanged |
| B1 | Source → Bronze → Silver → Gold pipeline cannot be rebuilt from the repository | DOCUMENTED LIMITATION – ACCEPTED FOR V1 | 13 November 2026 | No – three documentation files clarified; no DDL, ETL, data or Power BI changes |

---

## A1 – Sales-channel budget allocation

**Status:** FIXED AND VERIFIED  
**Decision recorded:** 13 November 2026  
**Evidence basis:** Earlier project-owner and Claude Code audit reports; not re-executed for this log update.

### Finding and resolution

The Sales Analysis channel view previously applied an incorrect sales-budget
filter context: a channel could show the overall budget rather than its
allocated channel budget, leading to misleading channel-level attainment.
The A1 correction aligned the Sales View field parameter and the channel
filtering with `dim_channel[channel_name]` / `channel_id` relationships.
A subsequent Sales Analysis review showed channel-specific Actual and Budget
values, and the B2-2 Reset-bookmark tests confirmed the corrected report state.

Earlier audit evidence identifies Git commits `a99b971` and `9ca3d20`
for the A1 work. The channel-level comparison documentation is a separate
follow-up topic (original audit finding **B9**); resolving A1 does not,
by itself, close B9.

### Guidance

Do not reopen A1 merely because the prior bookmark state contained an old
`fact_sales[channel_id]` projection; the obsolete bookmark state was
removed and tested under **B2-2**. Revalidate channel-level Actual and Budget
results if the model relationships or field parameter are changed later.

---

## A2 – Accurate description of Python validation and V1 scope

**Status:** FIXED AND VERIFIED  
**Decision recorded:** 13 November 2026  
**Decided by:** Project owner

### Original finding

The V1 documentation overstated what Python did for sales KPI validation:

- The Power BI **About** page described SQL, Power BI, and Python as three
  independent sources of KPI validation and said Python *reproduced* sales KPIs.
- `docs/01_projekt_overview/README.md` repeated the claim that Python was an
  independent KPI validation tool.
- An earlier V1 documentation inconsistency had presented **OTIF** as a
  current KPI, although OTIF is planned beyond V1.

The OTIF description was corrected earlier (audit reported commit `5be2e92`).
The Python claims required a separate correction.

### Actual implemented validation

Python performs **two distinct roles**, which must not be conflated:

1. **Independent Source-to-Bronze reconciliation.**
   `python/10_source_bronze_full_qa.py` reads original CSV files from source ZIP
   archives and independently compares column structure, row counts, and full
   rows (including duplicate multiplicity) with ten PostgreSQL Bronze tables.
   Results were **10/10 PASS** according to
   `docs/07_quality_assurance/source_to_bronze_qa_2026-11-09.md`.
   The comparison has a documented limitation: NULL and empty fields are
   treated as equal.
2. **SQL-based sales KPI cross-check.**
   `python/01_sales_analysis.ipynb` and the documented notebook read Gold data
   using SQL queries and display selected Actual, Budget, Variance, and
   Attainment results. They do **not** independently recompute those KPIs
   in pandas from source records. The principal independent KPI logic
   comparison is **SQL versus Power BI (DAX)**.

### Changes made

- **Power BI About page**: replaced the misleading validation claims with
  a concise description of SQL reconciliation, SQL-to-Power-BI KPI checks,
  independently verified Source-to-Bronze tables (**10/10 PASS**), and the
  SQL-query-based Python notebook.
  - `powerbi/Pellet_SC_dachboard.Report/definition/pages/970d6fcfaf61082c78b3/visuals/fd2c2efc6378cb195379/visual.json`
  - Relevant audit references: the `Validation & tools` section starts near
    line 22; revised passages near lines 40, 57, 74–87 and 104.
- **Project overview README**: corrected five passages to distinguish the
  two Python roles and replace the unsupported `SQL ↔ Python ↔ Power BI`
  independent-calculation claim with **SQL ↔ Power BI**, supported by Python
  Source-to-Bronze validation and SQL-result cross-checking.
  - `docs/01_projekt_overview/README.md`, post-change references near
    lines 348–363, 384–390, 417, 501 and 722.
- No DAX measures, bookmarks, data pipelines, or calculations were changed
  for this A2 documentation correction.

### Verification evidence

The project owner visually reviewed the new About-page wording in Power BI
Desktop. A subsequent **read-only Claude Code** audit reported:

- About-page JSON was valid and contained the revised text; its structural
  diff consisted of text/paragraph formatting only, with no visual position,
  size, type, or schema change.
- All five README passages matched the About-page wording and the Python
  scripts/notebooks' actual behaviour.
- A repository-wide search found **zero remaining occurrences** of the
  previously misleading formulations, including independent Python sales KPI
  validation and `SQL ↔ Python ↔ Power BI` as independent calculations.
- Neither the bookmarks nor any semantic model files were changed; the
  report start page remained **V1 Dashboard** (`activePageName =
  718c030b07cb52bb7067`).
- At the time of the check, precisely **two files** were modified and
  uncommitted: the About-page `visual.json` and the project overview README.
  No Git commit was made by the auditor.

**Decision:** Both parts of A2 (OTIF scope and Python validation claims)
are corrected and checked. Mark A2 **FIXED AND VERIFIED**. This status does
not assert that Python now independently computes sales KPIs; that remains
outside the implemented V1 scope.

**Related follow-up, resolved under B3 (13 November 2026):**
The stale `REVIEW PENDING` notebook status and incorrect `8,011` row-total
reference in `sql/12_python_documentation_validation.md` were corrected as
part of B3. See the B3 decision below.

---

## A3 – Sales validation SQL syntax issue

**Status:** FIXED AND VERIFIED  
**Decision recorded:** 13 November 2026  
**Evidence basis:** Earlier Claude Code audit report and project-owner test;
not re-executed for this log update.

The original audit found an incomplete CTE / syntax issue in
`sql/01_sales_v1_checks.sql`. The issue was corrected (reported Git commit
`086bdab`) and the revised check was reported to run successfully in
PostgreSQL. This is a **SQL script fix**, not a change to the report's DAX
measures. Re-run the script if the underlying SQL QA logic is modified.

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

---

## B2-3 – Sales budget attainment KPI naming

### B2-3a – Visible card labels

**Status:** FIXED AND VERIFIED  
**Decided by:** Project owner  
**Decision recorded:** 13 November 2026

**Original finding and rationale:** The fourth sales KPI card on **V1 Dashboard**
and **Sales Analysis** was labelled **Budget Attainment Selected Period**, although
it calculates **sales** actual as a proportion of **sales** budget for the selected
period. The other cards on the sales row are named Sales Actual, Sales Budget
and Sales Variance; the Sales View table calls the matching percentage **Sales
Attainment**. Production has a distinct **Production Attainment Selected Period**
card. The value was correct, but the ambiguous label could be mistaken for an
overall budget-attainment indicator combining sales and production.

**Decision and implemented change:** In Power BI Desktop, the project owner
renamed the displayed label on both sales cards to **Sales Attainment Selected
Period**. The underlying measure, its DAX formula, card value formatting, and
existing Reset-bookmark definitions were not changed. This is a label correction,
not a change in KPI calculation or business logic.

| Page | Visual ID | Visible label after correction |
|---|---|---|
| V1 Dashboard | `9d8d82065575701d3bce` | `Sales Attainment Selected Period` |
| Sales Analysis | `7f4a9cce8b9ceed492da` | `Sales Attainment Selected Period` |

**Verification evidence:**

- The project owner inspected both Power BI Desktop cards and confirmed the
  corrected visible labels.
- A subsequent read-only PBIP inspection in Claude Code confirmed `displayName`
  was updated on both cards (their `visual.json` lines 30–31), while `Property`
  remained `Budget Attainment YTD %` (line 26), `queryRef` remained
  `_Measures.Budget Attainment YTD %` (line 29), and percentage formatting
  remained `0.00%`. The cards' `nativeQueryRef` was also updated as part of the
  visual label change.
- The same inspection found no changes to the other Sales Actual, Sales Budget,
  Sales Variance or Production KPI cards, the DAX measure definitions, or either
  previously verified Reset bookmark.
- Power BI Desktop also updated the cards' visual schema version from 2.11.0
  to 2.14.0 and generated changes in `SemanticModel/definition/cultures/en-US.tmdl`
  (including the new Q&A synonym for the renamed card and changes to some
  automatically generated budget-related synonyms). These are language/Q&A
  metadata effects, not changes to the measures' calculations. There are no
  Q&A visuals in the V1 report.

**Affected files:**

- `powerbi/Pellet_SC_dachboard.Report/definition/pages/718c030b07cb52bb7067/visuals/9d8d82065575701d3bce/visual.json`
  (measure binding near line 26; display label near lines 30–31).
- `powerbi/Pellet_SC_dachboard.Report/definition/pages/2dfa404d9698ab7333ba/visuals/7f4a9cce8b9ceed492da/visual.json`
  (measure binding near line 26; display label near lines 30–31).
- `powerbi/Pellet_SC_dachboard.SemanticModel/definition/cultures/en-US.tmdl`
  (Desktop-generated language/Q&A metadata; renamed-card synonym near line 8412
  in the audit, plus automatically generated budget-related synonym changes).

### B2-3b – Misleading name of hidden measure

**Status:** KNOWN TECHNICAL DEBT – ACCEPTED FOR V1  
**Decided by:** Project owner  
**Decision recorded:** 13 November 2026

The cards continue to use the hidden measure `_Measures[Budget Attainment YTD %]`
(`powerbi/Pellet_SC_dachboard.SemanticModel/definition/tables/_Measures.tmdl`,
name near line 91, description near line 90, references near lines 93–94,
`isHidden` near line 103). Despite its **YTD** name and "Year-to-date"
description, its calculation divides `[Sales Actual Selected Period]` by
`[Sales Budget Selected Period]` in the current filter context. It does not
apply a year-to-date time-intelligence calculation of its own.

The existing measure `Sales Attainment Selected Period %` (same `_Measures.tmdl`,
near lines 149–164) expresses the intended meaning more clearly. The hidden
YTD-named measure is not exposed in the report's About-page measure listing,
which excludes hidden measures. The discrepancy therefore affects model
maintainability rather than the visible KPI value.

**Decision:** Do not rename, rebind or delete this measure in V1. Changing it
would require coordinated review of both visible cards, a card on the hidden
`Dasboard` page, Reset-bookmark references and the language metadata. This
additional change is not justified for the V1 release immediately after the
B2-2 Reset-bookmark repairs.

### Guidance for future audits and cleanup

- Treat B2-3a as **FIXED AND VERIFIED**; do not reopen the old card-label issue
  when the two cards show **Sales Attainment Selected Period**.
- Keep B2-3b visible as open technical debt until the duplicate and misleadingly
  named measure is reviewed. A future cleanup should consider rebinding dependent
  visuals to `Sales Attainment Selected Period %`, reviewing bookmark references
  and Q&A metadata, and only then retiring the obsolete measure.
- Preserve the B2-2 Reset behaviour when performing that cleanup; changes to
  measure references may require updating and retesting the bookmarks.
- **Start-page side effect:** the B2-3 follow-up initially detected Desktop
  changing `pages/pages.json` from V1 Dashboard to Sales Analysis. The project
  owner subsequently reopened and saved V1 Dashboard as the start page. Confirm
  `activePageName = 718c030b07cb52bb7067` in the final Git diff before commit;
  the uploaded audit log itself cannot independently verify the local file state.

---

## B3 – Incorrect total row count in Source/Bronze/Silver QA documentation

**Status:** FIXED AND VERIFIED  
**Decision recorded:** 13 November 2026  
**Finding type:** Documentation summation error; no data or executable SQL defect.  
**Evidence basis:** Claude Code's read-only source/Git-history inspection, the project owner's 13 November pgAdmin execution, and Claude Code's post-edit file/diff checks. The edited SQL and Markdown files themselves were not supplied with this log update; file-level verification is attributed to that report.

### Original finding and root cause

Several SQL comments and QA Markdown files reported **8,011** rows across
10 source tables. Individual table counts were correct, but their arithmetic
sum was **8,007**:

`504 + 1,404 + 11 + 4 + 504 + 2,520 + 576 + 576 + 504 + 1,404 = 8,007`.

The incorrect aggregate originated in October 2026 and was repeated in
later documentation. A correction to the aggregate in the Source → Bronze
report had already been committed on **10 November 2026** (`aa7f21d`), but
some related comments and status notes still contained the outdated figure.
This was a **reporting/summation error**, not evidence of lost or duplicated
rows, a faulty ETL transformation, or incorrect Power BI KPIs.

### Verification evidence

On **13 November 2026**, the project owner ran a read-only PostgreSQL query
in pgAdmin against database `pellet_sc`, counting all matching tables in the
`bronze` and `silver` schemas. The displayed result was:

| Check | Verified result |
|---|---:|
| Tables | 10 |
| Bronze total rows | 8,007 |
| Silver total rows | 8,007 |
| Difference in aggregate row counts | 0 |

These database totals are consistent with the ten per-table counts in
`data/processed/source_bronze_qa_results.csv` and the corrected
`sql/10_source_to_bronze_full_validation.md` report (**10/10 PASS**).
**Scope:** the pgAdmin query verifies matching *aggregate row counts* across
Bronze and Silver; it does **not** by itself prove row-by-row equivalence.
The separate Source → Bronze Python check is documented elsewhere.

### Corrective action

According to the Claude Code post-edit report, four files were updated:

| File | Documented correction |
|---|---|
| `sql/03_bronze_silver_qa.sql` (near lines 93–95) | Replaced the obsolete 8,011 Bronze/Silver total with 8,007 and added an explanatory note referencing the 13 November database check. Executable SQL was unchanged. |
| `sql/12_python_documentation_validation.md` (near lines 5, 23, 34–37) | Updated 8,011 to 8,007; changed the notebook review from `PARTIAL PASS` / `REVIEW PENDING` to `PASS` based on checking the five documented review criteria. Clarified that the KPI notebook executes SQL rather than independently recalculating KPIs in Python. |
| `sql/13_architecture_standard_compliance_summary.md` (near line 11) | Corrected Source → Bronze aggregate to 8,007. |
| `sql/README.md` (near lines 50, 79, 119) | Recorded the prior report correction as completed on 10 November, added the 13 November 8,007/8,007 confirmation, and removed the already completed task to reconcile 8,011 versus 8,007. |

The notebook's updated **PASS** status applies to its *documentation/security
review criteria* (scope, KPI definitions, `getpass`, saved output/limitations,
and no hard-coded password). It does **not** mean that the notebook now
independently implements KPI calculations or that all SQL/Python validation
workflows were re-executed.

### Post-edit checks and release decision

The read-only follow-up reported:

- All remaining occurrences of **8,011** in the repository are explicitly
  historical correction notes, not current totals.
- All current QA totals use **8,007**, consistent with the independent
  Source → Bronze QA report and the 13 November pgAdmin total-row check.
- Only four expected files changed (**+22 / −16 lines**); no database,
  Power BI, Python source, executable SQL logic, or bookmark changes.
- `git diff --check` passed; existing line-ending conventions were preserved.

**Decision:** Mark B3 **FIXED AND VERIFIED**. The 8,011/8,007 discrepancy was
resolved in documentation. Do not reopen B3 merely because older numbers
remain quoted in clearly labelled historical correction notes. Reassess only
if a future data reload changes table counts or a new reconciliation fails.

---

## B4 – Documentation formatting, README placeholders and links

**Status:** FIXED AND VERIFIED  
**Decision recorded:** 13 November 2026  
**Decision:** Fix the GitHub-visible documentation defects while keeping future-version folders clearly labelled rather than removing them.  
**Evidence basis:** Claude Code's read-only follow-up report after the seven README files were edited. The repository files themselves were not provided with this decision-log update, so the checks below are attributed to that report; the rendered GitHub view has not yet been independently reviewed here.

### Original finding

The project overview README had an unterminated Markdown code fence surrounding
its repository tree. Consequently, the later **Current project status**, **QA** and
**Project objective** sections rendered as code instead of document sections.
Some README landing pages linked from the root README were outdated or in
Estonian and did not describe the work already present. Four other documentation
subfolders contained placeholders. The initial concern about broken relative
links was **not reproduced** by the B4 investigation.

### Changes made

| File | Correction |
|---|---|
| `docs/01_projekt_overview/README.md` | Closed the repository-tree code fence (reported near line 702); restored `## Current project status`, `## QA` and `## Project objective` as proper sections (near lines 706, 721, 748); added spacing and dividers; updated the tree to show the actual `powerbi/` and `data/` directories. Existing A2 QA wording was preserved. |
| `python/README.md` | Replaced the outdated placeholder with an English overview and links for `10_source_bronze_full_qa.py`, `10_source_bronze_qa_README.md`, `01_sales_analysis.ipynb`, and `01_sales_analysis_documented.ipynb`. It distinguishes independent source-to-Bronze validation (10/10 PASS) from notebook SQL-result cross-checks; standalone Python KPI recalculation is **not** claimed. V2 ideas are labelled as future work. |
| `docs/README.md` | Added an English navigation index for completed V1 documentation, V1 QA and audit decisions, and planned areas; noted that the existing KPI documentation includes Estonian-language material. |
| `docs/02_management_view/README.md` | Marked **Planned – not part of V1**, with a brief purpose and a link to existing V1 material. |
| `docs/04_data_model/README.md` | Marked **Planned – not part of V1**, with a brief purpose and a link to existing V1 material. |
| `docs/05_powerbi_design/README.md` | Marked **Planned – not part of V1**, with a brief purpose and a link to existing V1 material. |
| `docs/06_thesis_materials/README.md` | Marked **Planned – not part of V1**, explaining the intended purpose; no artificial V1 counterpart link was added. |

### Verification evidence

According to the follow-up report:

- The project overview's code fences are balanced (opening near line 684;
  closing near line 702), and all three restored headings have correct Markdown
  syntax and spacing.
- All **26 relative links** in the edited files resolved, including the
  `#dashboard-structure`, `#data-architecture`, and `#data-model` anchors.
  No broken relative file links were found in the scope reviewed.
- The five A2 documentation corrections in `docs/01_projekt_overview/README.md`
  remained unchanged.
- Exactly **seven README files** changed (**+102 / −16 lines**). No files were
  added, deleted, or renamed; Power BI, SQL, Python scripts, and the audit log
  were not modified by the B4 implementation.
- `git diff --check` passed; existing CRLF line endings were preserved in
  the edited working files.

### Guidance for future audits

- Treat the Markdown-rendering defect and the two incomplete entry-point
  READMEs as **FIXED AND VERIFIED** by file-level checks. A post-push visual
  review of the GitHub rendering is a useful presentation check, not evidence
  that the original defect remains open.
- Do not classify the four explicitly marked **Planned – not part of V1**
  directories as missing V1 deliverables. Their substantive content remains
  future work, not a promise made by V1.
- Retain the A2 distinction: Python independently validates source-to-Bronze
  loads but does not independently recalculate sales KPIs.
- B4 is separate from the subsequently resolved B3 finding; B5 and B6
  decisions are documented below. Other findings (B1, B7–B10 and later
  B2-4/B2-5) require separate review or disposition.

---

## B5 – Naming inconsistencies and spelling corrections

**Decision recorded:** 13 November 2026  
**Decision basis:** B5 read-only investigation, subsequent Claude Code read-only follow-up, Power BI Desktop screenshots of the About page and measure-description table, and the project owner's confirmation that the obsolete local folder was removed. This log update does not independently access or modify the local Git working tree.

### B5a – About-page wording

**Status:** FIXED AND VERIFIED.

Two visible About-page text visuals were corrected in Power BI Desktop:

| Visual | Previously | Current verified content |
|---|---|---|
| `powerbi/Pellet_SC_dachboard.Report/definition/pages/970d6fcfaf61082c78b3/visuals/db2959c03ca507f8b84a/visual.json` (near line 40) | `syntetic` in the **Data & model** section | The word is now spelled `synthetic`. |
| `powerbi/Pellet_SC_dachboard.Report/definition/pages/970d6fcfaf61082c78b3/visuals/70a7bb9f564c75114f2e/visual.json` (near line 127) | Claim that V1 sales budgets were not allocated by channel | States that sales-channel views support analysis of actual sales, allocated budgets, variances and budget attainment by channel, consistent with the A1 correction. |

The subsequent read-only inspection confirmed that only the expected About text changed and that the report's default start page remained **V1 Dashboard**. The channel-budget statement was an A1 documentation follow-up discovered during the B5 review; it is not a new calculation change.

**Additional presentation corrections:** The read-only follow-up initially observed an extra space after `synthetic,` in the visual JSON and a redundant, narrower sales-channel sentence in **How to use**. The project owner subsequently confirmed that both were corrected in Power BI Desktop before the B5 commit. These are therefore not outstanding B5 actions. The two final wording changes were confirmed by the project owner; a separate read-only JSON check after those final edits has not been recorded here.

### B5b – Sales-budget measure descriptions

**Status:** FIXED AND VERIFIED.

In `powerbi/Pellet_SC_dachboard.SemanticModel/definition/tables/_Measures.tmdl`, the description of **Sales Budget** (near line 9) and **Sales Budget Selected Period** (near line 130) was corrected from `tones` to **`tonnes`**. Both measures represent quantities in metric tonnes (`t`), using the existing `budget_t` field.

The Claude Code follow-up confirmed that only two `///` description lines changed; DAX expressions, measure names, formatting and model relationships were not altered. The project owner additionally inspected the Power BI About-page measure metadata table and confirmed that both descriptions display `tonnes`.

### B5c – Duplicate obsolete data folder

**Status:** FIXED AND VERIFIED at the Git working-tree level; include the deletion in the next commit.

The misspelled `data/procecced/` directory contained only an unused placeholder `README.md`. The actual `data/processed/` directory, including `source_bronze_qa_results.csv`, already existed and remained intact. The B5 inspection found no references to `data/procecced/` in the project.

The project owner deleted the obsolete directory. GitHub Desktop subsequently displayed `data/procecced/README.md` as a **deleted** changed file. The deletion was not yet committed when the screenshot was reviewed; it must be included in the B5 commit. No data processing, SQL, Python or Power BI changes were required.

### B5d – Legacy technical names retained

**Status:** KNOWN TECHNICAL DEBT – ACCEPTED FOR V1.

- **`Dasboard`** is the display name of an old *hidden* prototype page (`pages/ea1a8d2669273a593300/page.json`). It is not shown to ordinary report viewers. Leave it unchanged in V1; consider retiring the obsolete page in a later cleanup rather than renaming it now.
- **`Pellet_SC_dachboard`** is the existing PBIP project/folder stem. Renaming it would affect project structure, internal references and documentation for little user-facing benefit. Retain the existing spelling for V1. `powerbi/README.md` already explains the historical filename spelling.

### B5e – Previously corrected documentation reference

**Status:** FIXED AND VERIFIED (previously resolved).

The earlier documentation reference to `Pellet_SC_dashboard` has already been corrected to the real project-file stem. The B5 investigation found no remaining occurrences of that incorrect reference. No additional change was needed.

### Final file scope and verification

At the last read-only follow-up, exactly **four local files** were changed relative to the preceding Git commit:

1. `.../visuals/db2959c03ca507f8b84a/visual.json` – About-page spelling correction;
2. `.../visuals/70a7bb9f564c75114f2e/visual.json` – updated sales-channel explanation;
3. `powerbi/Pellet_SC_dachboard.SemanticModel/definition/tables/_Measures.tmdl` – two description lines (`tonnes`);
4. `data/procecced/README.md` – deleted obsolete placeholder.

The follow-up reported no changes in the Reset bookmarks, DAX calculations, relationships, semantic-model field names, `pages.json` or Desktop-generated culture metadata; `git diff --check` passed. The user-visible sales-budget measure descriptions were also checked in Power BI Desktop.

**Decision:** The B5 spelling, About-page wording, unit-description and obsolete-folder fixes are complete, with the two legacy technical names explicitly accepted for V1. The project owner also confirmed correcting the extra whitespace and redundant sales-channel wording after the initial read-only inspection; those items are not open work. Before committing, confirm that the four expected changes plus this decision log are selected and that `data/procecced/README.md` is recorded as deleted.
---

## B6 – Measure hygiene and date-model dependencies

**Decision recorded:** 13 November 2026  
**Decided by:** Project owner – retain the functioning V1 model without structural changes.  
**Evidence basis:** Claude Code read-only inspection of the PBIP/TMDL report, bookmark and semantic-model files. The audit found a clean Git working tree. These are source-level findings; no date-model configuration changes or visual re-tests were performed for B6.

### B6-1 – Unused hidden legacy measures

**Status:** KNOWN TECHNICAL DEBT – ACCEPTED FOR V1.

The dependency search found no references in current report visuals, bookmarks, field parameters or active measure expressions to these six hidden measures, except for references within other unused measures and generated Q&A culture metadata:

| Hidden measure | `_Measures.tmdl` line reported in audit |
|---|---:|
| `Sales Actual YTD` | 55 |
| `Sales Budget YTD` | 70 |
| `Sales Variance YTD` | 85 |
| `Budget Attainment Status` | 106 |
| `Sales Variance KPI` | 225 |
| `Sales Actual KPI` | 255 |

Their presence does not affect the visible V1 KPI calculations. Do not remove them in V1 solely for cleanup. Active hidden support measures remain necessary, including KPI Display measures, view calculations, `Filter Context`, `Production Chart Title` and `Sales Attainment Target %`. The misleading but **actively used** `Budget Attainment YTD %` measure is already covered by **B2-3b**; that decision remains unchanged.

### B6-2 – Inconsistent numeric formats

**Status:** KNOWN TECHNICAL DEBT – ACCEPTED FOR V1.

The TMDL audit reported a mixture of `#,0`, `0`, `0.00`, `General` and other format definitions among sales and production measures (examples near `_Measures.tmdl` lines 31, 35, 42, 49, 127, 139, 146, 173, 185 and 194). Some matrix visuals override the measure format and others do not.

These inconsistencies **do not change the numeric results**. A user-visible mismatch (e.g. decimal places or thousand separators in a specific matrix) was **not established by the file-only inspection**. Accept the current V1 implementation; only revisit formatting if a material display problem is observed, or during later UX polish.

### B6-3 – Auto date/time hierarchies

**Status:** FUTURE DEVELOPMENT – V2.

The configuration `Pellet_SC_dachboard.SemanticModel/definition/model.tmdl` contains `__PBI_TimeIntelligenceEnabled = 1` (audit reference: line 10). Two LocalDateTable objects and a DateTableTemplate are present.

The read-only search found automatic `Date Hierarchy` / `PropertyVariationSource` references in **35 report files**, covering approximately **30 visuals across seven report pages and five bookmarks**. Disabling Auto date/time would therefore jeopardize existing Year/Month hierarchy references and is expected to require coordinated visual and bookmark migration. **No disabling test was performed**, so this is a dependency-based risk assessment, not a claim of a reproduced breakage. Keep Auto date/time enabled in V1.

### B6-4 – Dedicated date table is not marked as a date table

**Status:** FUTURE DEVELOPMENT – V2 (coordinate with B6-3).

The report uses `gold dim_date`; its TMDL definition was not found to mark it explicitly as a date table. The `date` and `month_start_date` columns have automatic variations (audit references in `gold dim_date.tmdl`, near lines 12–15 and 84–87).

No active report KPI measure uses `TOTALYTD` or similar time-intelligence functions; current selected-period sums and ratios work with normal filter relationships. Marking the table as a date table could affect the currently referenced automatic hierarchies. Do not change this setting independently of the B6-3 migration. If required in V2, test the revised date hierarchy, all affected visuals and reset bookmarks together.

### B6-5 – Measure descriptions

**Status:** NO ISSUE FOUND – VERIFIED.

All **17 visible measures** had descriptions in the read-only inspection and are exposed through the About-page measure metadata view, which excludes hidden measures. The B5 corrections to `tonnes` were present (`_Measures.tmdl`, audit references near lines 9 and 130). Some hidden helper measures lack descriptions, but these are not exposed to report viewers. One minor punctuation inconsistency in the `Production Variance` description (near line 40) is not a functional defect and does not warrant a V1 change.

### V1 release decision and follow-up

**B6 does not block V1 publication.** The inspection found no B6 issue requiring a functional fix before release. Current visible KPI measures use standard aggregations, ratios and filter relationships rather than the unused YTD calculations. Prior SQL/Power BI reconciliation evidence is discussed in the A-level audit record; wider channel/budget comparison coverage remains a separate **B9** item.

**No files were changed for B6.** Future work may remove unused hidden measures, harmonize number formats and redesign the date hierarchy/date-table setup, but should be planned and tested as a distinct V2 change rather than introduced during V1 sign-off. This decision records a source-level risk assessment; it does not assert that a date-model migration was experimentally tested.

---

## B7-A – Plant display names

**Status:** FIXED AND VERIFIED

**Decision recorded:** 13 November 2026

**Decided by:** Project owner – the report interface should be English and consistent.

**Scope:** B7-A only. The other B7 observations (month names and chart colours) are not resolved by this decision.

### Original behaviour

The same four plants were shown under two different names, sometimes on the same page:

- **Plant slicers** used the hidden technical key `gold dim_plant[plant_id]` and displayed `PLANT-A` to `PLANT-D`.
- **Charts, matrices and the `Filter Context` text** used `gold dim_plant[plant_name]` and displayed the Estonian business names `Tehas A` to `Tehas D`.

The values originate in the synthetic source data (`object.csv`: `PLANT-A,Tehas A`, etc.) and reach Power BI unchanged from PostgreSQL `gold.dim_plant`. The mapping was one-to-one, so the risk of misreading figures was low, but the interface was inconsistent and partly non-English.

### Implemented solution

The change was made in Power BI Desktop in two stages.

**Stage 1 – display names (Power Query).** One step was added to the `gold dim_plant` query
(`powerbi/Pellet_SC_dachboard.SemanticModel/definition/tables/gold dim_plant.tmdl`):

```
#"Replaced Value" = Table.ReplaceValue(#"Selected Columns","Tehas ","Plant ",Replacer.ReplaceText,{"plant_name"})
```

`plant_name` now contains `Plant A` to `Plant D`. The technical `plant_id` values `PLANT-A` to `PLANT-D`, the PostgreSQL data, column names, data types and model relationships are unchanged. See also `sql/11_power_query_architecture_validation.md`, section 7.

**Stage 2 – slicers and Reset bookmarks.**

- All six synchronized Plant slicers now use `gold dim_plant[plant_name]`:

  | Page | Slicer visual |
  |---|---|
  | V1 Dashboard | `85a1c1dabd7f6583ac37` |
  | Sales Analysis | `8bfefb7de41bb785f913` |
  | Production Analysis | `74af32f02df661421243` |
  | Plant Analysis | `e3c0043749aecf0624ba` |
  | Product Analysis | `eac6379361b80582832a` |
  | QA Validation (hidden page) | `555c781e1e2b01fecfcb` |

- All slicer captions display **Plant**. No plant is preselected.
- All five Reset bookmarks were updated so that the stored Plant slicer state refers to `plant_name` with Plant = All: `Reset - V1 Dashboard`, `Reset - Sales Analysis`, `Reset - Production Analysis`, `Reset -Plant Analysis` and `Reset - Product Analysis`.

### Verification evidence

**Power BI Desktop – functional checks (performed by the project owner):**

- Plant selections synchronized correctly across the report pages.
- The Reset buttons worked on all five analysis pages and restored Plant = All.
- The Plant slicer on the hidden QA Validation page was also checked.
- Charts, matrices and KPI cards showed the new names with unchanged KPI values.

**Read-only source inspection (Claude Code):**

- Stage 1 changed only the `gold dim_plant` partition (+3/−2 lines). `plant_id`, DAX measures, relationships and bookmarks were unchanged at that point.
- In stage 2, the six slicer diffs were identical: the active field changed from `plant_id` to `plant_name`, and an obsolete `plant_id` expansion state was removed. The synchronization settings (`fieldChanges` and `filterChanges` enabled), captions, sorting and layout were unchanged.
- Compared with the previous commit, the five Reset bookmarks differ only in the Plant slicer field. The remaining differences are Desktop-generated metadata:
  - regenerated filter IDs;
  - reordered but identical filter lists;
  - empty entries for the Reset action buttons;
  - an empty "select all" flag (`isInvertedSelectionMode`) on the V1 Dashboard Plant slicer, which is equivalent to Plant = All.
- The bookmark options are unchanged: Data enabled, Display disabled, all visuals, correct target pages. The KPI selectors, field parameters, Production View, the **Compare production with = Budget** choice, channel filters, Sales matrix drill state and the other B2-2 default states are unchanged. No specific plant value is stored in any bookmark.
- The semantic model (DAX, relationships, field parameters, calculated tables and culture metadata) was not changed in stage 2. The report start page remains **V1 Dashboard** (`718c030b07cb52bb7067`). `git diff --check` passed.

No DAX calculations, relationships or PostgreSQL data were modified for B7-A.

### Guidance for future audits

- **The slicer synchronization group is still named `plant_id`.** This is an internal group identifier, not the active slicer field. Do not rename it. Renaming would break synchronization between the six slicers.
- `plant_id` remains the technical key used in relationships. `plant_name` is the user-facing display field.
- If new plant names are added in the source data, check that the `Tehas ` → `Plant ` replacement still produces the intended English names.
- If the Plant slicer field is changed again, update all five Reset bookmarks in the same change.

---

## B8 – Production volume units

**Status:** FIXED AND VERIFIED

**Decision recorded:** 13 November 2026

**Business definition (project owner):** V1 is a volume-based management dashboard. All sales and production Actual, Budget and Variance values are in metric tonnes (t), not money. The report abbreviates large numbers (for example, 2.4M = 2.4 million tonnes; 765K = 765,000 tonnes). Budget means planned volume in tonnes. Attainment is a percentage ratio.

### Original finding

Some SQL QA documentation said the physical unit of production quantities still had to be confirmed. Other sources already described them as tonnes: the Gold column comments, the Power BI measure descriptions and the KPI documentation. The audit checked whether the source data and pipeline support the tonne definition.

### Verification evidence

The evidence comes from a read-only inspection of the local source ZIP archives, SQL QA scripts, documentation and TMDL files.

| Item | Evidence | Basis |
|---|---|---|
| Production actual (source) | All **504** finished-output rows in `production_rows.csv` have `unit = t`; total **2,406,082.3 t** | Source unit field |
| Sales actual (source) | All **1,404** rows in `invoice_rows.csv` have `unit = t`; total **2,429,578.7 t** | Source unit field |
| Finished products | All 10 pellet items in `item.csv` have `unit = t` | Source unit field |
| Source → Bronze → Silver → Gold | Source-to-Bronze 10/10 PASS; Bronze → Silver production rows show no quantity differences; Silver → Gold has 504/504 matched rows with no quantity mismatches. The production total is 2,406,082.3 at every layer, so no quantity conversion is applied | Existing reconciliations (`sql/04`, `sql/05`, `sql/10`) |
| Gold metadata | `quantity_t` and `budget_t` are documented as metric tonnes (`sql/02_gold_documentation.sql`) | Documentation |
| Power BI | `Production Actual = SUM('gold fact_production'[quantity_t])` and `Production Budget = SUM('gold fact_production_budget'[budget_t])`. Neither applies a unit conversion, and both are described as tonnes in `_Measures.tmdl` | Model definition |

Actual production and actual sales volumes are therefore expressed consistently in metric tonnes, and the **Production vs Sales** comparison uses the same unit on both sides.

### Limitation – budget units

The production and sales budget source files (`production_budget.csv`, `sales_budget.csv`) **do not contain an explicit unit column**. Their `budget_t` values are interpreted as metric tonnes based on three things:

- the project owner's business definition;
- the column naming;
- consistency with actual volumes. For example, the total production budget of 2,419,001.0 is within about 0.5% of actual production, and individual budget rows are of the same magnitude as the matching actual rows.

This is a documented interpretation. It is **not** independently proven by a source unit field.

### Raw-material inputs

Raw-material input rows in `production_rows.csv` include quantities in `tm3` (round wood, `RM-ROUND`) as well as wet tonnes. Do not sum input records with finished-output tonnes as a physical mass balance. The existing warning in `sql/04_production_qa.sql` remains valid. Production KPIs use finished-output quantities only.

### Changes made

Three outdated SQL documentation statements were corrected. Query logic was not changed.

| File | Change |
|---|---|
| `sql/README.md` | The Production Actual total is stated in metric tonnes, with the source unit evidence and no conversion in the pipeline. |
| `sql/05_silver_gold_production_qa.sql` | The header unit warning is replaced with the verified unit statement and a clarification that the check is not a mass balance. The closing note now says units were verified separately from the source files. |
| `sql/06_production_powerbi_reconciliation.md` | The unit-confirmation follow-up is replaced with the verified unit statement and a note on raw-material `tm3` inputs. |

No PostgreSQL data, SQL query logic, DAX, Power BI files or source data were modified.

### Impact and release decision

No data or calculation defect was identified. The Actual vs Budget and Production vs Sales comparisons use consistent volume units, subject to the budget-unit limitation above. **B8 does not block V1 publication.**

Optional later improvement: the About-page KPI definitions describe "volume" without naming the unit. A short sentence stating that all volumes are in metric tonnes and explaining the K/M abbreviations could be added during later UX polish. It is not required for V1.

---

## B9 – SQL ↔ Power BI reconciliation granularity

**Status:** FIXED AND VERIFIED – defined reconciliation scope

**Decision recorded:** 13 November 2026

**Evidence:** [`sql/14_channel_plant_powerbi_reconciliation.md`](../../sql/14_channel_plant_powerbi_reconciliation.md)

### Original limitation

The SQL ↔ Power BI comparisons were documented only at **grand-total level** and at displayed precision:

- `sql/08_sales_powerbi_reconciliation.md` (scope line 5; limitation stated at line 17);
- `sql/06_production_powerbi_reconciliation.md`.

No SQL comparison of the budget measures was documented, and no comparison existed by channel, plant, product or month. Matching grand totals alone could hide an allocation or filter-context error at a lower level.

### Relationship to A1

A1 corrected the sales-channel filtering of Sales Budget and Attainment. That correction was verified functionally: channel-specific values appeared in the report, and the B2-2 Reset tests passed. A corrected DAX/filter setup is not, however, a numerical reconciliation. Before B9, no channel-level SQL ↔ Power BI comparison was recorded in the repository, even though `powerbi/README.md` stated that one had been made. That README statement now references the new evidence.

### Reconciliation performed (13 November 2026)

Both tests cover the full period 2023–2025 with no Year, Month, Plant, Product or Channel selection. Each compares a SQL Gold aggregation with the corresponding Power BI matrix.

**Test A – Sales by channel** (Sales Analysis, Sales View Selector = Channel)

| Channel | SQL Actual / Budget (t) | Power BI Actual / Budget (t) | Attainment SQL / Power BI |
|---|---|---|---|
| B2B | 216,172.7 / 217,161.9 | 216,173 / 217,162 | 99.54% / 99.54% |
| DIST | 1,520,952.1 / 1,520,998.0 | 1,520,952 / 1,520,998 | 100.00% / 100.00% |
| IND | 638,226.3 / 629,769.1 | 638,226 / 629,769 | 101.34% / 101.34% |
| RET | 54,227.6 / 55,170.1 | 54,228 / 55,170 | 98.29% / 98.29% |
| Total | 2,429,578.7 / 2,423,099.1 | 2,429,579 / 2,423,099 | 100.27% / 100.27% |

Result: **PASS**. Variance also matched at displayed precision.

**Test B – Production by plant** (Plant Analysis, Production KPI Selector = All)

| Plant | SQL Actual / Budget (t) | Power BI Actual / Budget (t) | Attainment SQL / Power BI |
|---|---|---|---|
| Plant A (`PLANT-A`) | 294,164.3 / 295,000.4 | 294,164 / 295,000 | 99.72% / 99.72% |
| Plant B (`PLANT-B`) | 469,209.9 / 472,000.5 | 469,210 / 472,001 | 99.41% / 99.41% |
| Plant C (`PLANT-C`) | 704,109.5 / 707,999.4 | 704,110 / 707,999 | 99.45% / 99.45% |
| Plant D (`PLANT-D`) | 938,598.6 / 944,000.7 | 938,599 / 944,001 | 99.43% / 99.43% |
| Total | 2,406,082.3 / 2,419,001.0 | 2,406,082 / 2,419,001 | 99.47% / 99.47% |

Result: **PASS**. Variance also matched at displayed precision. This is the first documented SQL comparison of Production Budget.

**PASS criteria:**

1. Every dimension member is present in both outputs.
2. Actual, Budget and Variance agree at whole-tonne display precision.
3. Attainment agrees within 0.01 percentage points.
4. Power BI grand totals reconcile to independently calculated SQL totals.
5. No blank or unassigned member appears.

One-tonne differences between summed displayed rows and displayed totals, or between displayed Variance and displayed Actual minus Budget, are rounding effects and were treated as such.

**Arithmetic check:** before documentation, Claude Code checked the supplied figures for arithmetic and rounding consistency. All row variances, attainments and totals are consistent. The budget figures also equal the sums of the local budget source files by channel and plant.

### Remaining limitations – DOCUMENTED LIMITATIONS – ACCEPTED FOR V1

- **Channel mapping is not traced to the source.** Channel values already exist in `gold.fact_sales` and `gold.fact_sales_budget`. The original sales invoice files contain no directly comparable channel field. The reconciliation therefore does not verify that each invoice was assigned to the correct business channel when the Gold layer was built.
- **Month and product levels were not reconciled.** No SQL ↔ Power BI comparison by month or product was performed under B9. The queries in `sql/01_sales_v1_checks.sql` remain available for this.
- **Dimension combinations were not tested.** Combinations such as channel × month or plant × product were not tested.
- **Precision is limited to the display.** The comparison is at Power BI's displayed precision. Unrounded DAX values were not extracted.
- **Other QA checks remain separate.** The Source-to-Bronze and Bronze/Silver/Gold checks validate the SQL pipeline. They are not SQL ↔ Power BI dimension-level tests.

### Changes made

| File | Change |
|---|---|
| `sql/14_channel_plant_powerbi_reconciliation.md` | New reconciliation record with both SQL queries, both result sets, comparison rules, reproduction steps and limitations. |
| `powerbi/README.md` | The V1 scope note now states both PASS results and links to the new evidence instead of the previously unsupported claim. |

No Power BI files, DAX, TMDL, SQL execution scripts or source data were modified.

### Release decision

**B9 does not block V1 publication.** The dimensions most exposed to the A1 defect and to budget allocation errors are now reconciled numerically with PASS results: sales channel (Actual, Budget, Variance, Attainment) and plant (including Production Budget). No numerical defect was found. The remaining gaps are lower-risk and transparently documented: source-to-Gold channel mapping, month and product granularity, and dimension combinations. They may be addressed in a later QA iteration.

---

## B10 – Minor repository and documentation issues

**Status:** CLOSED – documentation corrections and English translation completed

**Decision recorded:** 13 November 2026

### Original finding

The original audit grouped five minor observations under B10:

1. two nearly identical notebooks;
2. outdated lines in the Python QA README ("Place this Python file…", "No live database comparison was possible");
3. `sql/09` referring to `bronze_invoice_rows_export.csv`, which is not in the repository;
4. a mix of Estonian and English documentation;
5. a hidden QA Validation page that the README presented as a report page.

The audit found no numerical, DAX, filtering or data-integrity defects in B10.

### Summary of sub-findings

| ID | Sub-finding | Status |
|---|---|---|
| B10-1 | Two similar Python notebooks | FIXED AND VERIFIED |
| B10-2 | Outdated Python QA instructions | FIXED AND VERIFIED |
| B10-3 | Missing intermediate CSV reference | DOCUMENTATION FIXED |
| B10-4 | Mixed documentation languages | FIXED AND VERIFIED |
| B10-5 | Hidden QA Validation page | ACCEPTED AS DESIGNED |

### B10-1 – Two similar Python notebooks

**Status:** FIXED AND VERIFIED

`python/01_sales_analysis.ipynb` is the working notebook. `python/01_sales_analysis_documented.ipynb` is the documented version of the same code, with explanatory Markdown and recorded results. Their roles are already described in `python/README.md` (notebook table) and `sql/12_python_documentation_validation.md`. Both files are intentionally retained. No change was required in this step.

### B10-2 – Outdated Python QA instructions

**Status:** FIXED AND VERIFIED

`python/10_source_bronze_qa_README.md` was corrected:

- The outdated instruction to place the script in the `python` folder was removed. The script is already part of the repository.
- The example command now passes `--database pellet_sc`, the project's current local database. The script's argument parser supports `--database`, with default `postgres` (`python/10_source_bronze_full_qa.py`, argument definitions). The README states that the database must be passed explicitly.
- The statement that no live database comparison was possible was removed. It was replaced with a table of the two completed runs, each showing 10/10 PASS over 8,007 rows with no missing or additional rows:
  - 8 October 2026, database `postgres` (`sql/10_source_to_bronze_full_validation.md`);
  - 9 November 2026, database `pellet_sc` (`docs/07_quality_assurance/source_to_bronze_qa_2026-11-09.md`).
- The README now distinguishes preparing the script from obtaining verified results by executing it against a live database.

The run dates, database names and row counts were checked against both reports and against `data/processed/source_bronze_qa_results.csv` (10 PASS rows, 8,007 source rows).

### B10-3 – Missing intermediate CSV reference

**Status:** DOCUMENTATION FIXED

`sql/09_source_to_bronze_invoice_rows_qa.md` now describes `data/processed/bronze_invoice_rows_export.csv` as follows:

- it was a local intermediate export;
- it is not version-controlled and is not in the repository;
- it can be regenerated with the read-only query in section 3 of that document.

The note also states that the later ten-table validation (`sql/10_source_to_bronze_full_validation.md`), which includes `invoice_rows`, supersedes the single-table check. The original result is retained as historical evidence. No additional data export is necessary for V1.

### B10-4 – Mixed documentation languages

**Status:** FIXED AND VERIFIED

The project owner decided that the public portfolio repository should use English consistently. The remaining Estonian-language documentation and SQL comments identified under B10 were translated to English:

| File | Translation |
|---|---|
| `docs/03_kpi/README.md` | KPI overview for V1 and Full Version / V2 |
| `docs/03_kpi/01_V1_KPI-d/README.md` | V1 KPI definitions |
| `docs/03_kpi/02_Full version_ KPI-d/README.md` | Planned Full Version / V2 KPIs |
| `data/README.md`, `data/raw/README.md` | Folder descriptions |
| `sql/01_sales_v1_checks.sql` | Four comment lines (lines 1, 20, 53 and 86) |

The translation preserved:

- KPI names, formulas, units and the distinction between implemented V1 functionality and planned V2 topics;
- DAX measure names and SQL identifiers;
- headings, lists and relative links;
- SQL query logic, which is unchanged (only the four comment lines differ).

No new business claims were added. The existing directory names (`01_V1_KPI-d`, `02_Full version_ KPI-d`) and other file paths were deliberately retained so that existing links keep working. The `(in Estonian)` note was removed from `docs/README.md`.

**Out of scope (Power BI semantic model):** a read-only scan after the translation found Estonian developer notes in the `///` descriptions of hidden fact-table columns:

- `gold fact_sales.tmdl`: 13 descriptions;
- `gold fact_production.tmdl`: 9 descriptions;
- `gold fact_production_budget.tmdl`: 5 descriptions.

These columns are hidden. The About-page column metadata table lists only visible columns (`Model Columns Metadata`: `IsHidden = FALSE()`), so report viewers do not see these notes. They are visible only in the Power BI Desktop model view and in the TMDL source files. They were not changed in B10, because Power BI files were outside its scope. Translating them is an optional small model-metadata cleanup and does not affect V1 publication.

### B10-5 – Hidden QA Validation page

**Status:** ACCEPTED AS DESIGNED

The QA Validation page (`pages/40f9151083306e262529/page.json`, `"visibility": "HiddenInViewMode"`) is intentionally hidden in report reading view. It is an internal technical validation tool, available in Power BI Desktop editing view. Its Plant slicer belongs to the synchronized Plant slicer group (see B7-A).

The page descriptions in `README.md` and `powerbi/README.md` now consistently describe it as a hidden technical page, not a standard end-user navigation page. The page visibility and all Power BI files were left unchanged.

### Changes made

| File | Change |
|---|---|
| `python/10_source_bronze_qa_README.md` | Outdated instruction removed. `--database pellet_sc` added to the command. Completed-runs table and the distinction between script preparation and verified execution added. |
| `sql/09_source_to_bronze_invoice_rows_qa.md` | The export is marked as a local, regenerable intermediate file, with a note that the full validation supersedes this check. |
| `README.md` | The QA Validation page is described as a hidden technical page. |
| `powerbi/README.md` | Same clarification as in `README.md`. |
| `docs/03_kpi/README.md`, `docs/03_kpi/01_V1_KPI-d/README.md`, `docs/03_kpi/02_Full version_ KPI-d/README.md` | Translated to English (B10-4). |
| `data/README.md`, `data/raw/README.md` | Translated to English (B10-4). |
| `sql/01_sales_v1_checks.sql` | Four Estonian comment lines translated to English. Queries unchanged (B10-4). |
| `docs/README.md` | `(in Estonian)` note removed from the KPI folder entry (B10-4). |

No Python program logic, SQL queries, source data, Power BI files, DAX or TMDL were changed.

### Release decision

**B10 does not block V1 publication.** All five sub-findings have a recorded disposition. The documentation corrections address the items that affected reproducibility and the accuracy of public repository statements. The repository documentation is now in English. The only remaining Estonian text found by the scan is in developer notes on hidden semantic-model columns, which report viewers do not see. Translating them is an optional later cleanup.

---

## B1 – Data pipeline reproducibility

**Status:** DOCUMENTED LIMITATION – ACCEPTED FOR V1

**Decision recorded:** 13 November 2026

### Original finding

The original audit found that the pipeline could not be rebuilt from the repository:

- the Bronze, Silver and Gold DDL and ETL were missing;
- the raw data was (justifiably) excluded;
- the Power BI cache was ignored, so the PBIP opens without data unless a local `pellet_sc` database exists;
- the README overstated the role of SQL and Python in data preparation.

It recommended adding at least the Gold DDL and transformation SQL, or a synthetic sample dataset.

### Current state (verified read-only)

**Not in the repository:**

- **Source data.** The two raw ZIP archives are excluded by `.gitignore` (`/data/raw/*`). The procedure for generating the synthetic source data is not documented in the repository.
- **Build scripts.** No tracked file contains a `CREATE`, `INSERT`, `COPY`, `ALTER`, `UPDATE` or `DROP` statement. No Bronze loading script, Silver transformation or Gold build logic is present. `sql/02_gold_documentation.sql` only writes `COMMENT ON` metadata to existing tables.

**In the repository:**

- the architecture description (`README.md`, `docs/01_projekt_overview/README.md`);
- Gold metadata for 13 tables and 87 columns (`sql/02`);
- read-only SQL QA scripts with recorded results (`sql/03`–`sql/14`) and a documented execution procedure (`sql/README.md`);
- the Python Source-to-Bronze QA script and its completed runs;
- the complete Power BI semantic model (TMDL) and report definitions (PBIR).

The earlier README wording criticised in the original finding no longer appears.

### Pipeline reproducibility vs QA reproducibility

| Capability | Assessment |
|---|---|
| **Pipeline reproducibility** – rebuilding Source → Bronze → Silver → Gold and a refreshed report from the repository | **Not supported.** Source data and build scripts are not included. |
| **QA reproducibility** – repeating the documented checks against an appropriately populated database | **Partially supported.** The SQL checks, their execution order and the expected results are documented. The Python Source-to-Bronze check also needs the local source archives. |
| **Model and report inspection** | **Supported.** All model and report definitions are version-controlled. |

### Power BI refresh dependency

All eight Power Query partitions connect to `PostgreSQL.Database("localhost", "pellet_sc")` and import eight Gold tables. Refreshing requires:

- a populated local PostgreSQL database;
- valid credentials.

The local cache (`.pbi/cache.abf`) is excluded from Git. Without the database, a reviewer can inspect the model and report definitions but cannot reproduce a populated, refreshed report.

### Sales-channel assignment

| Category | Evidence |
|---|---|
| **Confirmed fields and relationships** | `gold.fact_sales.channel_id` and `gold.fact_sales_budget.channel_id` relate to `gold.dim_channel` (`relationships.tmdl`). `gold.dim_customer.channel_id` is documented as "Sales channel associated with the customer" (`sql/02_gold_documentation.sql`). `dim_customer` is not imported into Power BI. |
| **Confirmed mappings** | **Sales budget:** the source file `sales_budget.csv` contains `channel_id` and `channel_name` (B2B, DIST, IND, RET). Gold budget totals by channel equal the source file totals (`sql/14_channel_plant_powerbi_reconciliation.md`). |
| **Inferred, not verified** | **Actual sales:** the source invoice files contain no channel field, only customer codes such as `CUST-B01`, `CUST-D02`, `CUST-I01` and `CUST-R01`. The Gold metadata suggests that the channel is assigned through the customer. A correspondence between code letters and channels is plausible but **not established** by repository evidence. |
| **Missing implementation** | The original source-to-Gold channel-assignment logic is not included in the repository. |

The Gold layer contains the sales-channel assignments used by the reporting model. SQL-to-Power BI reconciliation (B9) verifies the reported channel aggregates. It does not independently validate the original assignment rules for actual sales.

`docs/01_projekt_overview/README.md` previously listed product, plant and sales-channel mapping as Silver-layer transformations, while the Gold metadata places the customer–channel attribute in `gold.dim_customer`. Because the build scripts are not available, the description now states neutrally that the mappings are applied during Silver/Gold processing.

### Documentation improvements

| File | Change |
|---|---|
| `README.md` | The reproducibility note now states what is and is not included: source ZIP archives excluded, no DDL/ETL, SQL scripts validate rather than build. It describes the repository as a transparent portfolio, not an executable pipeline, and links to the Power BI refresh instructions. |
| `powerbi/README.md` | New section **Opening and refreshing the report**, covering the `localhost`/`pellet_sc` connection, the eight Gold tables, the credentials and database requirement, the excluded cache, and what a reviewer can and cannot do without the database. |
| `docs/01_projekt_overview/README.md` | Neutral wording for the Silver/Gold mapping stage, and a new **Sales-channel assignment** subsection separating confirmed budget channels from unverified actual-sales assignment. |

No DDL, ETL, sample data, database exports, SQL query logic, DAX, TMDL, Power BI report files or source data were added or changed.

### Why a full rebuild is outside the V1 scope

Recreating the Bronze, Silver and Gold build logic would be a new development cycle. It would also partly be a reconstruction rather than the original implementation. The V1 results do not depend on it: the existing tables have been validated layer by layer (Source → Bronze 10/10 PASS; Bronze/Silver/Gold quantity reconciliations) and against Power BI (B8, B9). The repository's stated purpose is a transparent portfolio of business understanding, data preparation and validation, modelling and reporting. That purpose is met when the architecture, model, QA evidence and limitations can be inspected.

Possible later improvements include a schema-only Gold export (DDL without data), the documented channel-assignment rule, or a small synthetic sample database.

### Release decision

**B1 does not block V1 publication.** The repository no longer claims to be fully reproducible. The limitation is stated in the main README, the Power BI README and the project overview, and the reported figures remain traceable through the documented QA evidence. The unverified actual-sales channel assignment is recorded here and in B9 as an accepted V1 limitation.

