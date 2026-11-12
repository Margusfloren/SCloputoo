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

## Summary

| ID | Finding | Status | Date | Model/report changed |
|---|---|---|---|---|
| B2-1a | Static title "Production Actual" on the V1 Dashboard production comparison chart | ACCEPTED AS DESIGNED | 12 November 2026 | No |
| B2-1b | Outdated option labels in the `Production Chart Title` measure | KNOWN TECHNICAL DEBT – ACCEPTED FOR V1 | 12 November 2026 | No |

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
