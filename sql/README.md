# SQL — Pellet Supply Chain Management Dashboard

## Purpose

This folder contains PostgreSQL validation scripts and quality-assurance (QA) records supporting the Pellet Supply Chain Management Dashboard. The objective is to make sales and production figures **traceable, reproducible, and explainable** before using them in Power BI management reports.

The project uses a Directo-inspired source-data structure and a Medallion-style data pipeline:

`Source files → bronze (raw) → silver (cleaned/typed) → gold (dimensional model) → Power BI`

The scripts in this folder primarily **verify** that pipeline; they do not constitute the complete ETL implementation. The `gold` schema contains the reporting fact and dimension tables. The raw source files' exact equivalence to `bronze` has **not yet been independently validated**.

## Files

| File | What it does |
|---|---|
| [`01_sales_v1_checks.sql`](01_sales_v1_checks.sql) | Initial V1 SQL checks for sales Actual, Budget and related aggregates. |
| [`02_gold_documentation.sql`](02_gold_documentation.sql) | Applies PostgreSQL `COMMENT ON` metadata to 13 `gold` tables and 87 columns; checks comment coverage. **Writes metadata**, but does not alter business data or table structures. |
| [`03_bronze_silver_qa.sql`](03_bronze_silver_qa.sql) | Read-only comparisons of Bronze/Silver structures, data types, row counts and sales invoice-row quality. |
| [`04_production_qa.sql`](04_production_qa.sql) | Read-only production QA between Bronze and Silver: document structure, key uniqueness and quantity reconciliation. |
| [`05_silver_gold_production_qa.sql`](05_silver_gold_production_qa.sql) | Read-only production reconciliation between Silver finished-product rows and `gold.fact_production`. |
| [`06_production_powerbi_reconciliation.md`](06_production_powerbi_reconciliation.md) | Records the PostgreSQL-to-Power BI Production Actual comparison and its precision limits. |
| [`07_sales_silver_gold_qa.sql`](07_sales_silver_gold_qa.sql) | Read-only sales reconciliation: unit checks, invoice-line uniqueness, quantity comparisons and PASS/REVIEW summary. |
| [`08_sales_powerbi_reconciliation.md`](08_sales_powerbi_reconciliation.md) | Records the PostgreSQL-to-Power BI Sales Actual comparison and its precision limits. |

## QA results — 8 October 2026

The following are **observed results for the validated dataset**, not permanent expectations for future data loads.

### Data structure and documentation

- Both `bronze` and `silver` have 10 corresponding source tables.
- Column comparison: **66** matching names/types, **59** differing types, and **20** Bronze-only provenance columns (`_loaded_at`, `_source_file`); no Silver-only columns.
- Row counts match across the 10 source tables: **8,011 rows per layer**.
- The `gold` schema has **13 documented tables** and **87 documented columns** (all comments present at the time of the check).

### Sales reconciliation

- `bronze.invoice_rows` and `silver.invoice_rows`: **1,404** rows each, with no duplicate `(number, rn)` keys in the checked data.
- Silver sales unit: **tonnes (`t`)** for all 1,404 rows.
- Bronze → Silver invoice-line quantities: **0 mismatches** on 1,404 matched rows.
- Silver → Gold invoice-line quantities: **1,404 matched rows**, **0 missing**, **0 quantity mismatches**.
- Sales Actual total: **2,429,578.700 t** in both Silver and Gold.
- Power BI Sales Actual matrix: **2,429,579 t**; KPI: **2.43M**. **PASS at displayed precision**.

### Production reconciliation

- `bronze.production_rows` and `silver.production_rows`: **2,520** rows each, no duplicate `(production, rn)` keys.
- **504** production documents, each with **4 input-material rows and 1 finished-output row**.
- Bronze → Silver matched production rows: **0 differences** in input quantity, output quantity or scrap.
- Silver → Gold finished-output rows: **504 matched**, **0 missing**, **0 quantity mismatches**.
- Production Actual total: **2,406,082.300** in both Silver and Gold. The physical unit must be confirmed from the upstream field definitions.
- Power BI Production Actual matrix: **2,406,082**; KPI: **2.41M**. **PASS at displayed precision**.

## How to reproduce the checks

1. Open the project database in **pgAdmin 4 → Query Tool**.
2. Open the relevant `.sql` file and review its header, scope and assumptions.
3. Run each numbered SQL statement **independently**, including its full `WITH ... SELECT` block where applicable. Avoid selecting only the final `SELECT` of a common-table-expression query.
4. Review returned values and any `PASS` / `REVIEW` status; compare with current data, **not blindly with historical row counts**.
5. Investigate deviations before changing source records or reporting measures. The QA queries are read-only unless explicitly identified otherwise (notably the metadata script `02`).
6. For dashboard comparisons, clear reporting slicers or otherwise use precisely the same year, month, plant, product and channel filters as in PostgreSQL.

## Interpretation and limitations

- A `PASS` confirms **only the conditions encoded by that check**; it is not proof that every source attribute or business rule is correct.
- Equal totals alone do not prove row-level correspondence; the invoice-line and production-line checks provide additional assurance for quantities.
- The Power BI totals were visually verified **at displayed rounding precision**, not against unrounded DAX outputs. Month-by-month and plant-by-plant reconciliations are still separate potential checks.
- The Bronze-to-Silver comparison does not by itself establish that Bronze preserves every original source value or that all type conversions are semantically correct.
- The meaning and units of some fields (including reference costs, prices, discounts, production input/output and moisture assumptions) require business-definition review before additional analysis.
- Results reflect the **2026-10-08 dataset snapshot**; a later import may legitimately change counts and totals.

## Next validation tasks

- Compare imported source files directly with Bronze (columns, raw values and provenance).
- Review the Python ingestion/processing steps and the role of Power Query against the intended pipeline.
- Where required, verify unrounded Power BI DAX totals and period/plant/product breakdowns against matching SQL extracts.

For broader project context, see the [repository README](../README.md).
