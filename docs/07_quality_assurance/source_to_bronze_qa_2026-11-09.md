# Data Quality Assurance – Source to Bronze

## Validation overview

**Validation date:** 9 November 2026  
**Project:** Pellet Supply Chain Management Dashboard  
**Scope:** Source CSV files → PostgreSQL Bronze layer  
**Database:** `pellet_sc`  
**Validation method:** Automated Python comparison

## Validation results

**Result: 10/10 PASS**

The validation compared ten CSV source files from two ZIP archives against their corresponding PostgreSQL Bronze tables.

The audit verified:

- Source and Bronze row counts
- Missing and additional columns
- Missing and additional complete rows, including duplicates
- Field-value consistency under the defined comparison rules
- SQL NULL occurrences in Bronze

All ten tables passed the validation.

**No missing or additional rows were identified.**

## NULL value analysis

The audit identified 1,776 SQL NULL occurrences across four Bronze tables.

| Table | NULL occurrences |
|---|---:|
| `item` | 40 |
| `object` | 8 |
| `purchase_header` | 1,152 |
| `purchase_rows` | 576 |
| **Total** | **1,776** |

A separate PostgreSQL query was used to identify the affected columns.

The NULL values were concentrated in specific product, object and purchasing-related fields.

The validation does not classify these NULL values as data-quality defects without further business-rule assessment.

## Validation limitations

The comparison treats a PostgreSQL NULL and an empty CSV field as equivalent. Therefore, PASS confirms consistency under this normalization rule, not exact preservation of the distinction between empty strings and SQL NULL values.

The PostgreSQL ingestion metadata fields `_source_file` and `_loaded_at` were excluded from the field-value comparison.

This validation confirms Source-to-Bronze consistency. It does not independently validate downstream Silver/Gold transformations or all Power BI calculations.

## Evidence and implementation

- Python script: `python/10_source_bronze_full_qa.py`
- Execution instructions: `python/10_source_bronze_qa_README.md`
- Local validation output: `data/processed/source_bronze_qa_results.csv`

The aggregated validation results are included in the repository at `data/processed/source_bronze_qa_results.csv`. The raw source archives remain excluded from version control.

## Conclusion

All ten Source-to-Bronze comparisons passed.

The observed NULL occurrences were identified and grouped by database column. Their business-level completeness remains a separate consideration.

The validation provides evidence of source-data consistency for the project's PostgreSQL Bronze layer.