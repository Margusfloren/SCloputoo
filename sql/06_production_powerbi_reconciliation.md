# Production Actual — PostgreSQL to Power BI reconciliation

**Project:** Pellet Supply Chain Management Dashboard  
**Validation date:** 2026-10-08  
**Scope:** All available years (2023–2025), plants and products; no restrictive report filters.  
**Status:** **PASS at displayed precision**; exact decimal-level Power BI reconciliation remains open.

## Purpose

Verify that the `Production Actual` total displayed in Power BI is consistent with production quantities stored in PostgreSQL `gold.fact_production` after upstream Bronze → Silver → Gold checks.

## Observed results

| Source / check | Result | Interpretation |
|---|---:|---|
| PostgreSQL `gold.fact_production` — `SUM(quantity_t)` | 2,406,082.300 | Full database total from 504 finished-production rows |
| Power BI Production Analysis matrix — `Production Actual` grand total | 2,406,082 | Displayed as a whole number |
| Power BI KPI card — `Production Actual` | 2.41M | Abbreviated presentation |
| Difference between whole-number displays | 0 | PostgreSQL total rounds to 2,406,082 |

**Conclusion:** The Power BI `Production Actual` grand total is consistent with PostgreSQL at the report's displayed precision. The visible report does not expose decimals, so an exact match to **2,406,082.300** in the DAX measure has **not** yet been independently established.

## Related database QA already completed

- Bronze → Silver: 2,520 production rows in each layer; no duplicate `(production, rn)` keys and no mismatches in `inputquantity`, `outputquantity`, or `scrap` for matched rows.
- Each of the 504 production documents has four input rows and one finished-output row.
- Silver → Gold: 504 finished-output records matched by production number and row number; no missing records or quantity mismatches in that comparison.
- Silver and Gold finished-production totals both equal 2,406,082.300.

See `sql/04_production_qa.sql` and `sql/05_silver_gold_production_qa.sql` for repeatable database checks.

## Reproduce the PostgreSQL total

```sql
SELECT
    COUNT(*) AS production_rows,
    SUM(quantity_t) AS production_actual
FROM gold.fact_production;
```

Expected for the validated dataset: `production_rows = 504`, `production_actual = 2406082.300`.

## Power BI verification steps

1. Open **Production Analysis**.
2. Clear Year, Month, Plant, Product and other filters so all relevant data are selected.
3. Check the **Production Actual** grand total in the matrix and the KPI card.
4. For an **exact** comparison, temporarily display the underlying numeric `Production Actual` measure with at least three decimals and `Display units = None`, then compare it with `2406082.300`. Record the result here when checked.

## Limitations / follow-up

- Equality has been verified **only to the displayed whole-number precision** in Power BI.
- Monthly, plant-level and product-level totals have not been independently reconciled with PostgreSQL by this check.
- Both compared quantities are finished-production volumes in metric tonnes (t). The source production rows explicitly record `unit = t`, and the pipeline applies no unit conversion. Raw-material input quantities, including records measured in `tm3`, are outside this comparison.
- Validation refers to the dataset and filter state observed on 2026-10-08, not necessarily to future refreshes.

**Evidence:** pgAdmin results for the PostgreSQL total and line-level checks, plus the Power BI Production Analysis screenshot showing `2.41M` on the KPI card and `2,406,082` in the grand total.
