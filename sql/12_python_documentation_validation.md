# Python Documentation Validation — V1

**Project:** Pellet Supply Chain Management Dashboard  
**Review date:** 9 October 2026  
**Status:** PASS — automated QA script and documented sales notebook reviewed (notebook review and row-total correction: 13 November 2026).

## Objective

Assess whether the Python components describe their purpose, source inputs, processing, outputs, reproducibility, and limitations, in line with the course documentation standard.

## Reviewed component: `10_source_bronze_full_qa.py`

**Status: PASS — documentation review**

- File-level docstring states its purpose: compare Directo-style CSVs in two ZIP archives to PostgreSQL `bronze` tables.
- File-level comments state that database access is read-only and that the result is a local CSV report.
- Explicit table lists separate eight Actual tables and two Budget tables.
- The `csv_from_zip()` and `compare()` functions describe or express their inputs and comparison logic; `compare()` has a docstring explaining order-independent multiset comparison.
- Source ingestion technical metadata columns (`_source_file`, `_loaded_at`) are intentionally excluded from value comparison and validated separately.
- A SQL `NULL` and an empty CSV field compare as equivalent; the script counts null fields for follow-up. This is a documented limitation, not strict byte-identical preservation in those cases.
- The command-line arguments name the ZIP archives, PostgreSQL connection and output CSV. A PostgreSQL password is prompted securely rather than hard-coded.
- A separate file, `10_source_bronze_qa_README.md`, explains prerequisites, invocation, validation scope, results and limitations.
- The observed Windows PowerShell run reported **10/10 PASS across 8,007 source rows** (an earlier version of this document stated 8,011, a summation error; see `sql/10_source_to_bronze_full_validation.md`) and wrote `data/processed/source_bronze_qa_results.csv`. The live result is supported by the recorded PowerShell screenshot; this documentation review does not rerun the database comparison.

### Evidence

- `python/10_source_bronze_full_qa.py`
- `python/10_source_bronze_qa_README.md`
- `sql/10_source_to_bronze_full_validation.md`

## Reviewed component: `01_sales_analysis_documented.ipynb`

**Status: PASS — documentation review (13 November 2026)**

This is the documented version of the working notebook `01_sales_analysis.ipynb`, which contains the same code cells without explanatory Markdown. The documented notebook was checked against the five criteria defined in the original review:

1. **Purpose, data source and scope:** the Markdown introduction states the purpose, the inputs (`gold.fact_sales`, `gold.fact_sales_budget`, `information_schema`), the January 2023 scope and the outputs.
2. **Processing and KPI definitions:** each step is explained; Actual, Budget, Variance and Attainment are defined with their SQL expressions.
3. **Running without exposing credentials:** the password is requested with `getpass`, and the notebook instructs users not to store passwords in the notebook or commit them.
4. **Outputs, checks and limitations:** the recorded output (Actual 68,298.7 t, Budget 68,646.1 t, Variance −347.4 t, Attainment ≈ 99.5%) is documented, together with explicit limitations: one month only, stored output is historical, and the notebook is read-only.
5. **No hard-coded secrets:** neither notebook contains a hard-coded password; both pass the prompted value through a variable.

**Scope of this check:** the notebook is a **SQL-based cross-check** of selected sales KPIs. The KPI arithmetic is computed by SQL in PostgreSQL and displayed with pandas; the notebook does **not** independently recalculate the KPIs in Python. This differs from `10_source_bronze_full_qa.py`, which independently compares the original source files with the Bronze tables.

## Assessment

Both Python components are documented adequately for this V1 audit:

- `10_source_bronze_full_qa.py` and its guide document the **independent Source → Bronze validation** (10/10 PASS, 8,007 rows).
- `01_sales_analysis_documented.ipynb` documents the **SQL-based sales KPI cross-check** and states its limitations.

The documentation review does not rerun the database comparisons.
