# Source-to-Bronze validation — 2023–2025

`10_source_bronze_full_qa.py` is a **read-only** Python audit comparing ten CSV source files in two ZIP archives with the corresponding ten `bronze` PostgreSQL tables.

## Run on Windows

1. Keep the two original ZIP files in `data/raw` (do not extract them). **Do not commit the raw ZIPs or database password until their contents have been reviewed.**
2. Open **PowerShell** in the project root. If needed, run `py -m pip install "psycopg[binary]"`.
3. Execute the following command (adapt ZIP names if yours differ):

```powershell
py .\python\10_source_bronze_full_qa.py `
  --actual ".\data\raw\Directo_RAW_Actual_2023_2025.zip" `
  --budget ".\data\raw\Budget_2023_2025_CSV (1).zip" `
  --database pellet_sc `
  --output ".\data\processed\source_bronze_qa_results.csv"
```

When prompted, type the PostgreSQL password (it is not stored in the script). The project's current local database is `pellet_sc`; the script's default database is `postgres`, so pass `--database pellet_sc` explicitly. Other defaults: localhost:5432, user `postgres`; override with `--host`, `--port`, `--user` when necessary.

## Scope and method

- Source files: `invoice_header`, `invoice_rows`, `item`, `object`, `production_header`, `production_rows`, `purchase_header`, `purchase_rows`, `production_budget`, `sales_budget`.
- Actual CSVs are comma-delimited; budget CSVs use semicolons. UTF-8 BOM is handled.
- Compares **the exact source field strings**, with source column names regardless of order and **every complete row including duplicates** (multiset comparison); row order does not matter. This is appropriate for Bronze fields stored as original text.
- Excludes only the two PostgreSQL ingestion metadata fields `_source_file` and `_loaded_at` from the field equality test. Their presence and non-null population were verified separately in pgAdmin.
- Reports absent/additional columns, source and database counts, absent/additional complete rows, and the number of SQL NULL values in Bronze.
- `PASS` means the compared representations match, **with this exception**: a SQL `NULL` and an empty CSV string are treated as equivalent. Check `null_fields_in_bronze`. A nonzero count requires manual follow-up if literal source fidelity is required.
- This test reads live Bronze tables, therefore actual results depend on the database state at runtime.

## Completed validation runs

Preparing this script did not by itself produce verified results; verified results come only from executing it against a live database. Two such runs have been completed:

| Run | Database | Result | Evidence |
|---|---|---|---|
| 8 October 2026 | `postgres` | **10/10 PASS**, 8,007 rows, 0 missing / 0 additional | [`sql/10_source_to_bronze_full_validation.md`](../sql/10_source_to_bronze_full_validation.md) |
| 9 November 2026 | `pellet_sc` | **10/10 PASS**, 8,007 rows, 0 missing / 0 additional | [`docs/07_quality_assurance/source_to_bronze_qa_2026-11-09.md`](../docs/07_quality_assurance/source_to_bronze_qa_2026-11-09.md) |

Do not interpret prior row-count checks as proof of exact field-value preservation. Each result above applies to the database state at the time of that run; rerun the script after any source or Bronze reload.
