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
| B4 | Documentation formatting, README placeholders, and relative links | FIXED AND VERIFIED | 13 November 2026 | Yes – seven README files |

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

**Related follow-up, not part of A2:**
`sql/12_python_documentation_validation.md` still states `REVIEW PENDING`
for the notebook, although its reviewed/documented version exists. The same
file also contains the older `8,011` figure; update these together when
handling original audit finding **B3**.

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
- B4 does not close other audit findings (including B3, B5, B6, B7, B8, B9,
  B10 and the later B2-4/B2-5 observations).
