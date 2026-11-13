# Python

This folder contains the Python components used for data-quality checks and analysis in V1.

Python has two different quality assurance roles in the project:

1. **Independent Source → Bronze validation:** a script compares the original source files with the PostgreSQL Bronze tables.
2. **SQL-based sales KPI cross-check:** notebooks run SQL queries against the PostgreSQL Gold layer and display the results.

## Files

| File | Purpose |
|---|---|
| [`10_source_bronze_full_qa.py`](10_source_bronze_full_qa.py) | Read-only validation script. Reads the original CSV files directly from the source ZIP archives and independently compares columns, row counts and complete rows (including duplicates) with ten PostgreSQL Bronze tables. Result: **10/10 PASS**. |
| [`10_source_bronze_qa_README.md`](10_source_bronze_qa_README.md) | Validation method: how to run the script, comparison rules and limitations (a SQL `NULL` and an empty CSV field are treated as equal). |
| [`01_sales_analysis.ipynb`](01_sales_analysis.ipynb) | Working notebook. Connects to the PostgreSQL Gold layer, inspects the relevant tables and runs a SQL query for January 2023 Sales Actual, Budget, Variance and Attainment. |
| [`01_sales_analysis_documented.ipynb`](01_sales_analysis_documented.ipynb) | Documented version of the same notebook, with explanations of each step and the recorded results. |

## What the notebooks do and do not do

The KPI values in the notebooks are calculated by **SQL queries in PostgreSQL**; pandas is used to display the results. The notebooks do **not** independently recalculate the sales KPIs in Python. The main independent comparison of KPI logic is **SQL ↔ Power BI (DAX)**.

## Results and related documentation

- Source → Bronze results: [`data/processed/source_bronze_qa_results.csv`](../data/processed/source_bronze_qa_results.csv)
- Source → Bronze QA summary: [`docs/07_quality_assurance/source_to_bronze_qa_2026-11-09.md`](../docs/07_quality_assurance/source_to_bronze_qa_2026-11-09.md)
- SQL QA scripts and records: [`sql/`](../sql/)

## Future development (V2)

Planned Python work includes further analysis, forecasting models and a web-based analytical interface built with Streamlit.
