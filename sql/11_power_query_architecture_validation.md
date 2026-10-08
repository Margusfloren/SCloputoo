# Power Query Architecture Validation

**Project:** Pellet Supply Chain Management Dashboard  
**Scope:** Power BI V1 — eight imported PostgreSQL Gold-layer queries  
**Validation date:** 9 October 2026  
**Result:** **PASS — 8/8 queries reviewed; no substantial Power Query transformations observed**

## 1. Purpose

Verify that Power Query primarily imports prepared tables from the PostgreSQL `gold` schema, while the SQL data pipeline handles upstream preparation and the Power BI semantic model/DAX handles relationships and interactive reporting calculations.

## 2. Method

The eight queries were inspected individually in Power Query Editor. For each, the **Applied Steps** pane and the selected query's preview were reviewed. This is a configuration review, not a full refresh test or a review of every source transformation.

## 3. Results

| Power Query query | Applied Steps observed | Assessment |
| --- | --- | --- |
| `gold dim_date` | Source; Navigation | PASS — direct Gold import |
| `gold dim_plant` | Source; Navigation; Selected Columns | PASS — simple column selection |
| `gold dim_product` | Source; Navigation | PASS — direct Gold import |
| `gold dim_channel` | Source; Navigation | PASS — direct Gold import |
| `gold fact_sales` | Source; Navigation; Renamed Columns | PASS — simple presentation rename |
| `gold fact_sales_budget` | Source; Navigation | PASS — direct Gold import |
| `gold fact_production` | Source; Navigation | PASS — direct Gold import |
| `gold fact_production_budget` | Source; Navigation | PASS — direct Gold import |

**Summary:** 8/8 reviewed; six queries have only `Source` and `Navigation`; two include one simple additional step each. No merges, appends, aggregations, business calculations or complex cleansing steps were observed in the eight Applied Steps lists.

### Two permitted lightweight steps

- **`gold dim_plant` — Selected Columns:** retains the plant fields needed for the reporting model; does not modify the PostgreSQL source table.
- **`gold fact_sales` — Renamed Columns:** changes `quantity_t` to `Quantity (t)` for presentation; does not recalculate quantity.

## 4. Architectural interpretation

`Source files → PostgreSQL bronze → silver → gold → Power Query → Power BI semantic model → DAX measures → report visuals`

- **PostgreSQL:** source ingestion, typed/cleaned intermediate data and dimensional fact/dimension tables.
- **Power Query:** selects Gold tables for the report and performs only minor model-facing column adjustments in the reviewed queries.
- **Semantic model:** connects imported facts and dimensions with relationships.
- **DAX:** evaluates reporting measures in filter context, including actuals, budgets, variances and attainment.
- **Report:** presents the measures in KPI cards, charts and matrices.

This division of responsibilities is consistent with the course's preference to keep substantive transformations outside Power Query.

## 5. Evidence and limitations

- Evidence is based on the Power Query Editor screenshots and **Applied Steps** examined for all eight queries during the review.
- The previews show the expected Gold-layer tables, but do not establish a complete refresh test, record-level reconciliation for every table, or absence of transformations in other components.
- The preview notice indicates cached previews can be up to 14 days old; this review is about query configuration, not freshness.
- No changes to the queries were required as a result of this review.
- The Python code documentation requirement should be audited separately before declaring every architecture-standard item complete.

## 6. Conclusion

**PASS (scope: Power Query architecture review).** All eight Power Query queries are sourced from PostgreSQL Gold tables, and the only extra steps observed were one column selection and one column rename. The reviewed setup follows the intended separation of data preparation, semantic modelling and DAX reporting logic.
