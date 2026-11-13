# SQL — Pellet Supply Chain Management Dashboard

## Purpose

This folder contains PostgreSQL validation scripts and quality-assurance (QA) records supporting the Pellet Supply Chain Management Dashboard. The objective is to make sales and production figures **traceable, reproducible, and explainable** before using them in Power BI management reports.

The project uses a synthetic, Directo-inspired source-data structure and a Medallion-style data pipeline:

`Source files → bronze (raw) → silver (cleaned/typed) → gold (dimensional model) → Power BI`

The scripts in this folder primarily **verify** that pipeline; they do not constitute the complete ETL implementation. The `gold` schema contains the reporting fact and dimension tables.

Source-to-Bronze comparisons have now been executed successfully on **8 October 2026** and **9 November 2026**. The later run used the local `pellet_sc` database and includes a documented follow-up on SQL NULL values. These checks establish consistency **under the comparison rules stated in the audit**, not the business correctness of the synthetic source data.

## Files

| File | What it does |
|---|---|
| [`01_sales_v1_checks.sql`](01_sales_v1_checks.sql) | Initial V1 SQL checks for Sales Actual, Budget and related aggregates. |
| [`02_gold_documentation.sql`](02_gold_documentation.sql) | Applies PostgreSQL `COMMENT ON` metadata to 13 `gold` tables and 87 columns; checks comment coverage. **Writes metadata**, but does not alter business data or table structures. |
| [`03_bronze_silver_qa.sql`](03_bronze_silver_qa.sql) | Read-only comparison of Bronze/Silver structures, data types, row counts and sales invoice-row quality. |
| [`04_production_qa.sql`](04_production_qa.sql) | Read-only production QA between Bronze and Silver: document structure, key uniqueness and quantity reconciliation. |
| [`05_silver_gold_production_qa.sql`](05_silver_gold_production_qa.sql) | Read-only production reconciliation between Silver finished-product rows and `gold.fact_production`. |
| [`06_production_powerbi_reconciliation.md`](06_production_powerbi_reconciliation.md) | Documents the PostgreSQL-to-Power BI Production Actual comparison and its precision limits. |
| [`07_sales_silver_gold_qa.sql`](07_sales_silver_gold_qa.sql) | Read-only sales reconciliation: unit checks, invoice-line uniqueness, quantity comparisons and PASS/REVIEW summary. |
| [`08_sales_powerbi_reconciliation.md`](08_sales_powerbi_reconciliation.md) | Documents the PostgreSQL-to-Power BI Sales Actual comparison and its precision limits. |
| [`09_source_to_bronze_invoice_rows_qa.md`](09_source_to_bronze_invoice_rows_qa.md) | Focused Source-to-Bronze comparison of invoice rows. |
| [`10_source_to_bronze_full_validation.md`](10_source_to_bronze_full_validation.md) | Records the full ten-table Source-to-Bronze validation performed on 8 October 2026. |

The folder also contains documents numbered **11–13**, covering Power Query architecture, Python documentation and architecture-standard compliance. These support the project's technical documentation and should be read alongside the data-reconciliation evidence.

**Additional QA resources outside this folder:**

- [Source-to-Bronze Python audit script](../python/10_source_bronze_full_qa.py)
- [Source-to-Bronze execution instructions](../python/10_source_bronze_qa_README.md)
- [Source-to-Bronze repeat validation, 9 November 2026](../docs/07_quality_assurance/source_to_bronze_qa_2026-11-09.md)
- [Machine-readable results of the November run](../data/processed/source_bronze_qa_results.csv)

## QA results — 8 October 2026

The following are **observed results for the validated dataset**, not permanent expectations for future data loads.

### Data structure and documentation

- Both `bronze` and `silver` had 10 corresponding source tables.
- Column comparison: **66** matching names/types, **59** differing types and **20** Bronze-only provenance columns (`_loaded_at`, `_source_file`); no Silver-only columns.
- Row counts matched between Bronze and Silver in the ten source tables checked.
- The `gold` schema had **13 documented tables** and **87 documented columns** (all comments present at the time of the check).

**Row-count documentation note:** The earlier SQL README and October Source-to-Bronze report stated a total of **8,011 rows**, but the ten table counts listed in that October report sum to **8,007 rows**. The November Source-to-Bronze CSV independently lists the same ten counts, totaling **8,007**. The historical total was corrected in the October report on 10 November 2026, and the related SQL comments and documentation were updated on 13 November 2026. A read-only PostgreSQL row-count check on 13 November 2026 confirmed **8,007** rows in both Bronze and Silver across the ten tables. This arithmetic discrepancy did not indicate a row-level comparison failure.

### Sales reconciliation

- `bronze.invoice_rows` and `silver.invoice_rows`: **1,404** rows each, with no duplicate `(number, rn)` keys in the checked data.
- Silver sales unit: **tonnes (`t`)** for all 1,404 rows.
- Bronze → Silver invoice-line quantities: **0 mismatches** on 1,404 matched rows.
- Silver → Gold invoice-line quantities: **1,404 matched rows**, **0 missing**, **0 quantity mismatches**.
- Sales Actual total: **2,429,578.700 t** in both Silver and Gold.
- Power BI Sales Actual matrix: **2,429,579 t**; KPI: **2.43M**. **PASS at displayed precision**.

### Production reconciliation

- `bronze.production_rows` and `silver.production_rows`: **2,520** rows each, with no duplicate `(production, rn)` keys.
- **504** production documents, each with **4 input-material rows and 1 finished-output row**.
- Bronze → Silver matched production rows: **0 differences** in input quantity, output quantity or scrap.
- Silver → Gold finished-output rows: **504 matched**, **0 missing**, **0 quantity mismatches**.
- Production Actual total: **2,406,082.300 metric tonnes (t)** in both Silver and Gold. All 504 finished-output rows in the source `production_rows.csv` have `unit = t`. No quantity-unit conversion is applied between Source, Bronze, Silver and Gold.
- Power BI Production Actual matrix: **2,406,082**; KPI: **2.41M**. **PASS at displayed precision**.

## Source-to-Bronze validation — 8 October and 9 November 2026

The ten original source CSV datasets (from the Actual and Budget ZIP archives) were compared with the corresponding PostgreSQL `bronze` tables using the Python audit script.

| Validation | 8 October 2026 | 9 November 2026 |
|---|---|---|
| Database used | `postgres` | `pellet_sc` |
| Table checks | **10/10 PASS** | **10/10 PASS** |
| Missing / additional rows | **0 / 0** | **0 / 0** |
| Total source and Bronze rows, summed from the ten table counts | **8,007** | **8,007** |
| SQL NULL follow-up | Not detailed in the October report | **1,776** NULL occurrences identified and grouped by column |

The November NULL counts were:

| Bronze table | SQL NULL occurrences |
|---|---:|
| `item` | 40 |
| `object` | 8 |
| `purchase_header` | 1,152 |
| `purchase_rows` | 576 |
| **Total** | **1,776** |

The NULL occurrences were concentrated in specific product, object and purchasing-related fields. They were **identified**, not automatically classified as defects or changed in the source data. In this audit, a SQL `NULL` and an empty CSV field are treated as equivalent; see the [November QA report](../docs/07_quality_assurance/source_to_bronze_qa_2026-11-09.md) for the limitations and interpretation.

Both the [October validation report](10_source_to_bronze_full_validation.md) and the [November repeat-validation report](../docs/07_quality_assurance/source_to_bronze_qa_2026-11-09.md) are retained to show the original and repeated checks.

## How to reproduce the checks

1. Open the project database in **pgAdmin 4 → Query Tool**.
2. Open the relevant `.sql` file and review its header, scope and assumptions.
3. Run each numbered SQL statement **independently**, including its full `WITH ... SELECT` block where applicable. Do not select only the final `SELECT` of a common-table-expression query.
4. Review returned values and any `PASS` / `REVIEW` status; compare with current data, **not blindly with historical row counts**.
5. Investigate deviations before changing source records or reporting measures. The QA queries are read-only unless explicitly identified otherwise (notably the metadata script `02`).
6. For dashboard comparisons, clear reporting slicers or use precisely the same year, month, plant, product and channel filters as in PostgreSQL.

To repeat the full Source-to-Bronze audit, follow the [Python script instructions](../python/10_source_bronze_qa_README.md). For the current local database, pass `--database pellet_sc` explicitly. The original ZIP archives remain local in `data/raw` and are excluded from version control.

## Interpretation and limitations

- A `PASS` confirms **only the conditions encoded by that check**; it is not proof that every source attribute or business rule is correct.
- Equal totals alone do not prove row-level correspondence; the invoice-line and production-line checks provide additional assurance for quantities.
- The Source-to-Bronze audit compares parsed source values and Bronze rows, including duplicate occurrences, but **normalizes SQL NULL and empty CSV values as equivalent**. It does not prove byte-for-byte preservation of source files.
- The Power BI totals were visually verified **at displayed rounding precision**, not against unrounded DAX outputs. Month-by-month and plant-by-plant reconciliations are still separate potential checks.
- The Bronze-to-Silver comparison does not by itself establish that all type conversions are semantically correct.
- The meaning and units of some fields (including reference costs, prices, discounts, production input/output and moisture assumptions) require business-definition review before additional analysis.
- The records above refer to the **8 October 2026** and **9 November 2026** validation runs; subsequent data reloads may legitimately change totals.

## Next validation tasks

- Preserve the November validation output as reproducible QA evidence; rerun the same audit after any source or Bronze reload.
- Review the role of Python ingestion/processing steps and Power Query against the intended pipeline architecture.
- Where required, validate unrounded Power BI DAX totals and period/plant/product breakdowns against matching SQL extracts.
- Confirm ambiguous business units and definitions before extending the dashboard into new supply-chain measures.

For broader project context, see the [repository README](../README.md).
