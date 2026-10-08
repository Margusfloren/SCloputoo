# Sales Actual — PostgreSQL to Power BI reconciliation

**Project:** Pellet Supply Chain Management Dashboard  
**QA date:** 2026-10-08  
**Scope:** Sales Actual quantity, full available reporting period (2023–2025), without additional year/month/plant/product/channel filters.

## Result

| Source | Sales Actual quantity | Presentation |
|---|---:|---|
| PostgreSQL `gold.fact_sales` (`SUM(quantity_t)`) | 2,429,578.700 t | 3 decimal places |
| Power BI Sales Actual matrix, Total | 2,429,579 t | Rounded to whole tonnes |
| Power BI Sales Actual Selected Period KPI | 2.43M | Abbreviated display |

**Outcome: PASS at displayed rounding precision.** The PostgreSQL value rounds to 2,429,579 tonnes, agreeing with the Power BI matrix total. The abbreviated KPI display is consistent with this quantity.

This does **not** establish exact equality of unrounded DAX output and SQL output, nor does it establish equality for individual months, plants, products or channels. The data shown in the report was for all periods selected; ensure no hidden filters or interactions alter the context when repeating this test.

## Supporting data-lineage checks

1. **Bronze → Silver:** 1,404 invoice lines; no duplicate `(number, rn)` keys in Bronze and Silver; no mismatches in compared sales quantities. Earlier checks also found no NULLs in selected required fields and no zero or negative quantities in Silver.
2. **Silver units:** All 1,404 rows have `unit = 't'`; total quantity = 2,429,578.700 t.
3. **Silver → Gold:** 1,404 rows in both `silver.invoice_rows` and `gold.fact_sales`; totals = 2,429,578.700 t in each.
4. **Invoice-line matching:** Full outer join on Silver `(number, rn)` and Gold `(invoice_number, invoice_row_no)` returned 1,404 matched rows, zero missing from either layer, and zero quantity mismatches.

## How to reproduce

1. Run `07_sales_silver_gold_qa.sql` in pgAdmin, including its final consolidated QA query. Confirm the reported quantities and investigate any `REVIEW` status.
2. In Power BI, clear Year, Month, Plant, Product and Channel slicers. Check any page, report, drillthrough or other filters.
3. Read the **Sales Actual Selected Period** KPI and the **Sales Actual** grand total from the Sales Analysis matrix.
4. Compare the matrix total with PostgreSQL after applying the same rounding/display rules.
5. For exact equality in a future check, expose the unrounded DAX value (or query it with DAX) and compare it to the SQL result at a consistent numeric precision.

## Interpretation and limitations

The tested data shows consistent Sales Actual quantities through the checked Bronze → Silver → Gold transformations and into the Power BI *displayed aggregate*. This supports confidence in the dashboard's overall sales volume. It does not by itself prove correct pricing, revenue calculations, all dimension mappings, source-file completeness, or correctness of every filter context.

**Related QA files:**
- `01_sales_v1_checks.sql` — earlier sales KPI validation.
- `03_bronze_silver_qa.sql` — Bronze/Silver quality checks.
- `07_sales_silver_gold_qa.sql` — Silver/Gold sales reconciliation queries.
- `06_production_powerbi_reconciliation.md` — analogous production reconciliation.
