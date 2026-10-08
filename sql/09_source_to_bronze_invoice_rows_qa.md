# Source-to-Bronze Validation — Sales Invoice Rows

**Project:** Pellet Supply Chain Management Dashboard  
**Validation date:** 2026-10-08  
**Result:** **PASS — all 1,404 source records match the Bronze export across all 14 source columns.**

## 1. Purpose

Demonstrate that the original Directo-inspired synthetic sales invoice rows were preserved in the PostgreSQL `bronze.invoice_rows` table. This is evidence for the raw/bronze data preservation requirement in the Medallion-style architecture.

## 2. Files and scope

| Role | File or table | Notes |
|---|---|---|
| Original source | `Directo_RAW_Actual_2023_2025.zip` → `invoice_rows.csv` | Synthetic 2023–2025 sales invoice rows |
| Database table | `bronze.invoice_rows` | Raw layer with additional `_source_file` and `_loaded_at` lineage columns |
| Database export | `data/processed/bronze_invoice_rows_export.csv` | Export produced using the original 14 source columns, excluding the two lineage fields |
| Related SQL | `sql/03_bronze_silver_qa.sql`, `sql/07_sales_silver_gold_qa.sql` | Separate checks for subsequent pipeline stages |

The validation covers **only `invoice_rows.csv`**. It is not proof of exact preservation for the remaining source files or the two budget datasets.

## 3. Method

1. Extract `invoice_rows.csv` from the original ZIP archive without altering the source.
2. Read both CSV files using UTF-8 (allowing for a UTF-8 BOM in the original source) and standard CSV quoting rules.
3. Compare the ordered list of 14 column names.
4. Match records using the composite business key (`number`, `rn`), after checking that the key is unique in each dataset.
5. Compare the **textual CSV field value of every source column** in every matched row; no numeric normalization or rounding was necessary.
6. Compare the set of keys to identify missing or unexpected records.

The export was prepared from PostgreSQL using this read-only query:

```sql
SELECT
    number, item, description, price, discount, quantity, unit,
    sum, object, vatcode, stock, total, rn, rr
FROM bronze.invoice_rows
ORDER BY number::bigint, rn::integer;
```

## 4. Verified results

| Check | Original CSV | Bronze export | Result |
|---|---:|---:|---|
| Data rows (excluding header) | 1,404 | 1,404 | PASS |
| Source columns | 14 | 14 | PASS |
| Column names and order | Identical | Identical | PASS |
| Unique (`number`, `rn`) keys | 1,404 | 1,404 | PASS |
| Source keys missing from export | — | 0 | PASS |
| Unexpected keys in export | — | 0 | PASS |
| Differing individual field values | — | 0 | PASS |
| Completely matching rows | 1,404 | 1,404 | PASS |

**Conclusion:** All 1,404 records match exactly across all 14 original source columns in the supplied export. This confirms source-to-Bronze preservation for the `invoice_rows` dataset **at the time of the export**.

## 5. Data lineage

The previous PostgreSQL lineage QA found the following for `bronze.invoice_rows`:

- `_source_file` identifies `invoice_rows.csv` for all 1,404 records.
- `_loaded_at` is populated for all 1,404 records.
- The observed load date was 2026-09-24.

These two database metadata fields are **not part of the 14-column source comparison**; their purpose is to record origin and ingestion time.

## 6. Limitations and follow-up

- The source-to-Bronze comparison used a CSV export supplied from pgAdmin, not a direct live connection to PostgreSQL. Re-export and rerun the check if `bronze.invoice_rows` changes.
- No conclusion about unchanged data can yet be drawn for the other nine Bronze tables. Validate them separately against their matching original Actual or Budget files.
- This check tests source preservation, not business correctness, real-world transaction authenticity or downstream transformation logic. The dataset is synthetic.
- Separate QA scripts and reconciliation notes cover Bronze → Silver → Gold and the displayed Power BI `Sales Actual` total. Power BI agreement has been verified at displayed rounding precision, not full unrounded precision.

## 7. Reproduction

To reproduce the result, extract `invoice_rows.csv` from the original Actual ZIP, export the SQL query above from PostgreSQL to CSV, then compare the two datasets by (`number`, `rn`) with exact field-value comparison for all 14 source columns. Fail the check if keys are duplicated, missing, added, or if any field differs. Keep the original ZIP unchanged.

**Status:** PASS for `invoice_rows.csv` → `bronze.invoice_rows` only.
