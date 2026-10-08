-- Pellet Supply Chain Management Dashboard
-- 05 | Silver -> Gold production data quality checks (PostgreSQL)
-- Read-only queries. No data or schema changes.
-- Validated manually on 2026-10-08 against the project database.
-- Expected: 504 finished-product rows and 2406082.300 total quantity in both layers.
-- IMPORTANT: Confirm that outputquantity and quantity_t have the same unit before
-- interpreting the equality as a physical mass balance.

-- 01 | Compare finished-production totals between Silver and Gold.
SELECT
    'Silver - finished production' AS source,
    COUNT(*) AS row_count,
    SUM(outputquantity) AS total_quantity
FROM silver.production_rows
WHERE outputquantity > 0

UNION ALL

SELECT
    'Gold - actual production' AS source,
    COUNT(*) AS row_count,
    SUM(quantity_t) AS total_quantity
FROM gold.fact_production;
-- Observed: each layer 504 rows, total_quantity = 2406082.300.

-- 02 | Compare each finished-product production line by document and row number.
-- FULL OUTER JOIN detects records missing from either layer.
-- The WHERE clause limits Silver to output rows and includes all Gold rows.
WITH comparison AS (
    SELECT
        s.production,
        s.rn,
        s.outputquantity AS silver_quantity,
        g.quantity_t AS gold_quantity,
        g.production_number AS gold_production_number
    FROM silver.production_rows s
    FULL OUTER JOIN gold.fact_production g
        ON s.production = g.production_number
       AND s.rn = g.production_row_no
    WHERE COALESCE(s.outputquantity, 0) > 0
       OR g.production_number IS NOT NULL
)
SELECT
    COUNT(*) AS compared_rows,
    COUNT(*) FILTER (WHERE silver_quantity IS NULL) AS missing_in_silver,
    COUNT(*) FILTER (WHERE gold_production_number IS NULL) AS missing_in_gold,
    COUNT(*) FILTER (
        WHERE silver_quantity IS DISTINCT FROM gold_quantity
    ) AS quantity_mismatches
FROM comparison;
-- Observed: compared_rows=504; missing_in_silver=0;
-- missing_in_gold=0; quantity_mismatches=0.

-- 03 | Compact QA summary (same line-level comparison, explicit PASS/REVIEW).
WITH comparison AS (
    SELECT
        s.production AS silver_production_number,
        s.outputquantity AS silver_quantity,
        g.production_number AS gold_production_number,
        g.quantity_t AS gold_quantity
    FROM silver.production_rows s
    FULL OUTER JOIN gold.fact_production g
        ON s.production = g.production_number
       AND s.rn = g.production_row_no
    WHERE COALESCE(s.outputquantity, 0) > 0
       OR g.production_number IS NOT NULL
), metrics AS (
    SELECT
        COUNT(*) AS compared_rows,
        COUNT(*) FILTER (WHERE silver_production_number IS NULL) AS missing_in_silver,
        COUNT(*) FILTER (WHERE gold_production_number IS NULL) AS missing_in_gold,
        COUNT(*) FILTER (WHERE silver_quantity IS DISTINCT FROM gold_quantity)
            AS quantity_mismatches
    FROM comparison
)
SELECT
    compared_rows,
    missing_in_silver,
    missing_in_gold,
    quantity_mismatches,
    CASE
        WHEN compared_rows = 504
         AND missing_in_silver = 0
         AND missing_in_gold = 0
         AND quantity_mismatches = 0
        THEN 'PASS - Silver and Gold production lines match'
        ELSE 'REVIEW - investigate production differences'
    END AS qa_status
FROM metrics;
-- Note: 504 is the current test-data expectation, not a universal business rule.
-- Matching counts/sums do not independently verify unit definitions, date/plant/
-- product mapping or the Power BI Production Actual DAX measure.
