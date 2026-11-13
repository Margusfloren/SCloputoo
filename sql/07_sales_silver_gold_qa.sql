-- Pellet Supply Chain Management Dashboard
-- 07 | Silver to Gold sales data quality checks
-- Read-only SQL. Run in PostgreSQL / pgAdmin.
-- Observed 2026-10-08: 1,404 rows in both layers; 2,429,578.700 tonnes in both;
-- matched invoice lines: 1,404; missing in either layer: 0; quantity differences: 0.
-- Expected values are reference observations, not hard-coded PASS criteria.

-- 01 | Units, row counts and quantity totals in Silver
SELECT unit, COUNT(*) AS row_count, SUM(quantity) AS total_quantity
FROM silver.invoice_rows
GROUP BY unit
ORDER BY unit;
-- Observed: unit=t, rows=1404, total=2429578.700.

-- 02 | Compare overall quantities (tonnes) and row counts
SELECT 'Silver - Sales' AS source, COUNT(*) AS row_count,
       SUM(quantity) AS total_quantity_t
FROM silver.invoice_rows
UNION ALL
SELECT 'Gold - Sales Actual', COUNT(*), SUM(quantity_t)
FROM gold.fact_sales;
-- Observed: 1404 rows and 2429578.700 t for each layer.

-- 03 | Check uniqueness of invoice-line keys in both layers
SELECT 'silver' AS layer, COUNT(*) AS total_rows,
       COUNT(DISTINCT (number, rn)) AS unique_keys,
       COUNT(*) - COUNT(DISTINCT (number, rn)) AS duplicate_rows
FROM silver.invoice_rows
UNION ALL
SELECT 'gold', COUNT(*), COUNT(DISTINCT (invoice_number, invoice_row_no)),
       COUNT(*) - COUNT(DISTINCT (invoice_number, invoice_row_no))
FROM gold.fact_sales;
-- Validate that duplicate_rows=0 before interpreting the join comparison.

-- 04 | Compare every invoice line, including missing records
WITH comparison AS (
    SELECT s.number AS silver_invoice, s.rn AS silver_row,
           s.quantity AS silver_quantity,
           g.invoice_number AS gold_invoice,
           g.invoice_row_no AS gold_row,
           g.quantity_t AS gold_quantity
    FROM silver.invoice_rows s
    FULL OUTER JOIN gold.fact_sales g
      ON s.number = g.invoice_number
     AND s.rn = g.invoice_row_no
)
SELECT COUNT(*) AS compared_rows,
       COUNT(*) FILTER (WHERE silver_invoice IS NULL) AS missing_in_silver,
       COUNT(*) FILTER (WHERE gold_invoice IS NULL) AS missing_in_gold,
       COUNT(*) FILTER (
           WHERE silver_quantity IS DISTINCT FROM gold_quantity
       ) AS quantity_mismatches
FROM comparison;
-- Observed: compared_rows=1404, missing_in_silver=0,
-- missing_in_gold=0, quantity_mismatches=0.

-- 05 | Consolidated QA result: no fixed dataset size assumed
WITH units AS (
    SELECT COUNT(*) FILTER (WHERE unit IS DISTINCT FROM 't') AS non_tonne_rows
    FROM silver.invoice_rows
),
s AS (
    SELECT COUNT(*) AS row_count,
           COUNT(DISTINCT (number, rn)) AS key_count,
           SUM(quantity) AS quantity_t
    FROM silver.invoice_rows
),
g AS (
    SELECT COUNT(*) AS row_count,
           COUNT(DISTINCT (invoice_number, invoice_row_no)) AS key_count,
           SUM(quantity_t) AS quantity_t
    FROM gold.fact_sales
),
comparison AS (
    SELECT s.number AS silver_invoice,
           g.invoice_number AS gold_invoice,
           s.quantity AS silver_quantity,
           g.quantity_t AS gold_quantity
    FROM silver.invoice_rows s
    FULL OUTER JOIN gold.fact_sales g
      ON s.number = g.invoice_number
     AND s.rn = g.invoice_row_no
),
cmp AS (
    SELECT COUNT(*) AS compared_rows,
           COUNT(*) FILTER (WHERE silver_invoice IS NULL) AS missing_in_silver,
           COUNT(*) FILTER (WHERE gold_invoice IS NULL) AS missing_in_gold,
           COUNT(*) FILTER (
               WHERE silver_quantity IS DISTINCT FROM gold_quantity
           ) AS quantity_mismatches
    FROM comparison
)
SELECT s.row_count AS silver_rows, g.row_count AS gold_rows,
       s.quantity_t AS silver_quantity_t,
       g.quantity_t AS gold_quantity_t,
       s.row_count - s.key_count AS silver_duplicate_rows,
       g.row_count - g.key_count AS gold_duplicate_rows,
       cmp.compared_rows, cmp.missing_in_silver, cmp.missing_in_gold,
       cmp.quantity_mismatches, units.non_tonne_rows,
       CASE WHEN s.row_count = g.row_count
                 AND s.row_count = s.key_count
                 AND g.row_count = g.key_count
                 AND cmp.compared_rows = s.row_count
                 AND cmp.missing_in_silver = 0
                 AND cmp.missing_in_gold = 0
                 AND cmp.quantity_mismatches = 0
                 AND units.non_tonne_rows = 0
                 AND s.quantity_t IS NOT DISTINCT FROM g.quantity_t
            THEN 'PASS - checked sales quantities and invoice-line keys'
            ELSE 'REVIEW - investigate data differences'
       END AS qa_status
FROM s CROSS JOIN g CROSS JOIN cmp CROSS JOIN units;

-- Scope: validates quantities, units and invoice-line key correspondence only.
-- Does not validate all financial values, dimensions, source-file fidelity,
-- business meanings of fields, or Power BI calculation context.
