# Source-to-Bronze Validation — All 10 Source Tables

**Project:** Pellet Supply Chain Management Dashboard  
**Validation date:** 8 October 2026  
**Scope:** Synthetic Directo-style actual data (2023–2025) and sales/production budgets (2023–2025)  
**Result:** **PASS — 10 of 10 tables**

## Purpose

Verify that the ten original CSV datasets in the Actual and Budget ZIP archives correspond to their PostgreSQL `bronze` tables before downstream Silver, Gold and Power BI processing. This is a repeatable source-to-ingestion quality check, not a validation of the underlying business transactions.

## Inputs and method

- Original ZIP archives (kept locally in `data/raw`): `Directo_RAW_Actual_2023_2025.zip` and `Budget_2023_2025_CSV (1).zip`.
- Database: PostgreSQL 18, database `postgres`, schema `bronze`.
- Script: [`../python/10_source_bronze_full_qa.py`](../python/10_source_bronze_full_qa.py); instructions: [`../python/10_source_bronze_qa_README.md`](../python/10_source_bronze_qa_README.md).
- Local machine output: `data/processed/source_bronze_qa_results.csv` (not included in the repository at the time of validation).

The Python script reads the source CSVs directly from the two ZIP archives, fetches the corresponding Bronze rows, excludes the two ingestion metadata columns (`_source_file` and `_loaded_at`), and compares the remaining columns and row values. It treats rows as an unordered multiset, so duplicate occurrences are counted and row ordering is irrelevant. It reports missing/extra rows and missing/extra columns per table.

## Observed results

| Bronze table | Source CSV rows | Bronze rows | Missing rows | Extra rows | Result |
|---|---:|---:|---:|---:|---|
| `invoice_header` | 504 | 504 | 0 | 0 | PASS |
| `invoice_rows` | 1,404 | 1,404 | 0 | 0 | PASS |
| `item` | 11 | 11 | 0 | 0 | PASS |
| `object` | 4 | 4 | 0 | 0 | PASS |
| `production_header` | 504 | 504 | 0 | 0 | PASS |
| `production_rows` | 2,520 | 2,520 | 0 | 0 | PASS |
| `purchase_header` | 576 | 576 | 0 | 0 | PASS |
| `purchase_rows` | 576 | 576 | 0 | 0 | PASS |
| `production_budget` | 504 | 504 | 0 | 0 | PASS |
| `sales_budget` | 1,404 | 1,404 | 0 | 0 | PASS |
| **Total** | **8,007** | **8,007** | **0** | **0** | **10/10 PASS** |

The console reported `PASS: 10/10` and wrote the machine-readable report to `data/processed/source_bronze_qa_results.csv`. The script also checks column-set differences; all ten tables received PASS results. This run did not report any missing or additional rows.

## Related quality checks

- [`09_source_to_bronze_invoice_rows_qa.md`](09_source_to_bronze_invoice_rows_qa.md): earlier focused comparison of all 1,404 invoice rows and their 14 source columns.
- [`03_bronze_silver_qa.sql`](03_bronze_silver_qa.sql): Bronze-to-Silver structural and sales checks.
- [`04_production_qa.sql`](04_production_qa.sql): production-row QA.
- [`05_silver_gold_production_qa.sql`](05_silver_gold_production_qa.sql) and [`07_sales_silver_gold_qa.sql`](07_sales_silver_gold_qa.sql): Silver-to-Gold checks.
- [`06_production_powerbi_reconciliation.md`](06_production_powerbi_reconciliation.md) and [`08_sales_powerbi_reconciliation.md`](08_sales_powerbi_reconciliation.md): database-to-report aggregate reconciliations at displayed rounding precision.

## Interpretation and limitations

1. **NULL versus empty CSV value:** The comparison normalizes PostgreSQL SQL `NULL` and an empty CSV field as equivalent. Therefore PASS does not prove those two representations are identical. Review `null_fields_in_bronze` in the generated report before making a strict byte-for-byte preservation claim.
2. **CSV serialization:** PASS validates the script's parsed CSV field values against the database representation under its normalization rules. It does not prove raw file bytes, encodings, quoting or line endings are preserved in PostgreSQL.
3. **Source quality:** These are modeled/synthetic project datasets; matching source-to-Bronze rows does not establish that the original business values are realistic or correct.
4. **Point-in-time result:** The result applies to the source archives and database contents used for the run on 8 October 2026. Rerun after any reload or replacement.
5. **Scope:** This test concerns source-to-Bronze only. Transformations and Power BI measures require their own validations, documented separately.

## How to rerun

From the project's `python` directory in PowerShell:

```powershell
python .\10_source_bronze_full_qa.py --actual "..\data\raw\Directo_RAW_Actual_2023_2025.zip" --budget "..\data\raw\Budget_2023_2025_CSV (1).zip" --output "..\data\processed\source_bronze_qa_results.csv"
```

The script requests the PostgreSQL password interactively; do not store the password in the repository or attach it to QA evidence. Review the summary and generated CSV after each execution. If any table returns `REVIEW`, inspect missing/extra columns and rows before treating the pipeline as verified.

**Conclusion:** All ten checked source tables matched their PostgreSQL Bronze counterparts under the stated comparison rules, covering **8,007 rows**. This supports source traceability and preservation for the checked synthetic dataset while retaining the limitations above.

Documentation correction (10 November 2026): The original reported total of 8,011 rows was an arithmetic error. The ten individual table counts sum to 8,007 rows. The 10/10 PASS validation result remains unchanged.