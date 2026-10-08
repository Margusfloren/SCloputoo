# V1 Data Architecture — Course Standard Compliance Summary

**Project:** Pellet Supply Chain Management Dashboard  
**Review date:** 9 October 2026  
**Overall assessment:** SUBSTANTIALLY ALIGNED — some evidence/definition checks remain open.

## Requirements and findings

| Requirement | Assessment | Evidence / boundaries |
|---|---|---|
| 1. Medallion schemas: raw/bronze, optional staging/silver, analytics/gold | PASS for demonstrated pipeline | Ten Bronze tables and corresponding Silver processing; Gold fact/dimension model. Source-to-Bronze multiset check: 10/10 PASS, 8,011 rows. NULL/empty comparison limitation is documented. |
| 2. Naming standards | MOSTLY ALIGNED | PostgreSQL Gold uses lowercase `dim_` / `fact_` tables, `_id` keys and generally English snake_case columns. An exhaustive check of **all** Bronze/Silver names and singularization, and any permitted business-key exceptions, has not been completed. The course allows localized naming in the Power BI report. |
| 3. Metadata comments and documentation | PASS for inspected Gold metadata; Python PARTIAL | All 13 Gold tables have table descriptions and 87/87 Gold columns have comments (per pgAdmin checks). Power BI measures' descriptions were reviewed during semantic-model cleanup, but no independent complete audit of every report object's Description is claimed. Python automated QA script and README are documented; sales notebook review pending. |
| 4. Pipeline responsibilities | PASS for eight inspected Power Query queries | PostgreSQL handles main preparation; Power Query imports eight Gold tables (six `Source` + `Navigation` only; two simple column selection/rename steps). DAX provides interactive measures. No substantive ETL was observed in the inspected Applied Steps. This is not an exhaustive test of all possible model operations or refresh behavior. |
| 5. Keys (natural/surrogate, `_id` naming, FK constraints) | PASS for inspected Gold relationships; convention exceptions to note | Earlier pgAdmin audit listed Gold primary and foreign key constraints. `gold.dim_date.date` is a documented natural key rather than `date_id` and fact foreign keys include date columns; this is a **naming exception** against the literal “every key ends `_id`” rule, even though relationships can be valid. Confirm with instructor that this accepted date-key convention is permitted. |

## Validated business outputs

| Metric | PostgreSQL Gold | Power BI displayed | Assessment |
|---|---:|---:|---|
| Sales Actual | 2,429,578.7 t | 2,429,579 t | Match at displayed whole-tonne precision |
| Production Actual | 2,406,082.3 t | 2,406,082 t | Match at displayed whole-tonne precision |

Additional validation: Sales and Production Silver-to-Gold comparisons by invoice/production lines were PASS with no observed quantity mismatches; their QA scripts and reconciliation records are in `sql/`.

## Remaining actions before final unqualified compliance claim

1. **Open and inspect `python/01_sales_analysis.ipynb`**, add Markdown documentation if necessary, and confirm no credentials are embedded.
2. **Clarify the date-key exception** (`dim_date.date` / fact date keys without `_id`) with the instructor if the naming rule is intended literally.
3. If demanded by the assessment rubric, independently verify **all** Power BI Description metadata and every source-layer naming convention; the visible evidence currently supports narrower conclusions.

## Repository evidence

- `sql/02_gold_documentation.sql`
- `sql/03_bronze_silver_qa.sql`
- `sql/04_production_qa.sql`
- `sql/05_silver_gold_production_qa.sql`
- `sql/06_production_powerbi_reconciliation.md`
- `sql/07_sales_silver_gold_qa.sql`
- `sql/08_sales_powerbi_reconciliation.md`
- `sql/09_source_to_bronze_invoice_rows_qa.md`
- `sql/10_source_to_bronze_full_validation.md`
- `sql/11_power_query_architecture_validation.md`
- `python/10_source_bronze_full_qa.py`
- `python/10_source_bronze_qa_README.md`

## Summary for defense

The V1 demonstrates a traceable source-to-Bronze-to-Silver-to-Gold pipeline feeding a Power BI semantic model, supported by repeatable SQL/Python checks and documented reconciliations. Reported PASS results are restricted to the tests actually performed; a few documentation and literal naming-convention items remain open, not known data-quality failures.
