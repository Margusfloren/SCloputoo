-- Pellet Supply Chain Management Dashboard
-- 04 | Production data quality: Bronze -> Silver (PostgreSQL)
-- Read-only QA. Does not modify source data or database structures.
-- Baseline observed on 2026-10-08: 2,520 production rows, 504 documents.
-- These are observations from test data, not hard-coded rules for future datasets.
-- Run each numbered SELECT independently in pgAdmin Query Tool.
-- IMPORTANT: Numbers match only when the same snapshot is loaded into both layers.

-- 01 | Compare production_rows columns and PostgreSQL types across layers.
SELECT
    COALESCE(b.column_name, s.column_name) AS column_name,
    b.data_type AS bronze_type,
    s.data_type AS silver_type
FROM information_schema.columns b
FULL JOIN information_schema.columns s
    ON s.table_schema = 'silver'
   AND s.table_name = 'production_rows'
   AND s.column_name = b.column_name
WHERE (b.table_schema = 'bronze' AND b.table_name = 'production_rows')
   OR (s.table_schema = 'silver' AND s.table_name = 'production_rows')
ORDER BY column_name;
-- Expected shape: Silver casts production, rn, inputquantity, outputquantity,
-- scrap, and totalqty to numeric/integer types, and omits Bronze provenance columns.

-- 02 | Required fields, zero/negative output quantities (diagnostic).
SELECT
    COUNT(*) AS total_rows,
    COUNT(*) FILTER (WHERE production IS NULL) AS missing_production,
    COUNT(*) FILTER (WHERE rn IS NULL) AS missing_row_number,
    COUNT(*) FILTER (WHERE item IS NULL OR BTRIM(item) = '') AS missing_item,
    COUNT(*) FILTER (WHERE outputquantity IS NULL) AS missing_output_quantity,
    COUNT(*) FILTER (WHERE outputquantity <= 0) AS non_positive_output_quantity
FROM silver.production_rows;
-- Observed: 2520, 0, 0, 0, 0, 2016.
-- Non-positive outputquantity is NOT itself a defect: input-only rows may have 0 output.

-- 03 | Classify row roles and inspect quantities.
SELECT
    CASE
        WHEN inputquantity > 0 AND outputquantity > 0 THEN 'Both input and output'
        WHEN inputquantity > 0 AND COALESCE(outputquantity, 0) = 0 THEN 'Input only'
        WHEN outputquantity > 0 AND COALESCE(inputquantity, 0) = 0 THEN 'Output only'
        ELSE 'Other / zero / negative'
    END AS row_type,
    COUNT(*) AS row_count,
    SUM(inputquantity) AS total_input,
    SUM(outputquantity) AS total_output
FROM silver.production_rows
GROUP BY 1
ORDER BY row_count DESC;
-- Observed: Input only = 2016 (4,836,797.2 input);
--           Output only = 504 (2,406,082.3 output).
-- Do not interpret input/output totals as a mass balance until unit and moisture
-- definitions have been validated.

-- 04 | Check structure of production documents.
WITH document_rows AS (
    SELECT
        production,
        COUNT(*) FILTER (
            WHERE inputquantity > 0 AND COALESCE(outputquantity, 0) = 0
        ) AS input_rows,
        COUNT(*) FILTER (
            WHERE outputquantity > 0 AND COALESCE(inputquantity, 0) = 0
        ) AS output_rows
    FROM silver.production_rows
    GROUP BY production
)
SELECT input_rows, output_rows, COUNT(*) AS document_count
FROM document_rows
GROUP BY input_rows, output_rows
ORDER BY document_count DESC;
-- Observed: each of 504 documents has four input rows and one output row.

-- 05 | Detect duplicate document-row identifiers in BOTH layers.
-- DISTINCT composite keys are counted in PostgreSQL using a row expression.
SELECT
    'bronze' AS layer,
    COUNT(*) AS total_rows,
    COUNT(DISTINCT (production, rn)) AS unique_rows,
    COUNT(*) - COUNT(DISTINCT (production, rn)) AS duplicate_rows
FROM bronze.production_rows
UNION ALL
SELECT
    'silver' AS layer,
    COUNT(*) AS total_rows,
    COUNT(DISTINCT (production, rn)) AS unique_rows,
    COUNT(*) - COUNT(DISTINCT (production, rn)) AS duplicate_rows
FROM silver.production_rows;
-- Observed: 2520 total / 2520 distinct / 0 duplicates in each layer.

-- 06 | Check for missing keys before joining/casting.
SELECT
    'bronze' AS layer,
    COUNT(*) FILTER (WHERE production IS NULL OR BTRIM(production) = ''
                         OR rn IS NULL OR BTRIM(rn) = '') AS missing_keys
FROM bronze.production_rows
UNION ALL
SELECT
    'silver' AS layer,
    COUNT(*) FILTER (WHERE production IS NULL OR rn IS NULL) AS missing_keys
FROM silver.production_rows;
-- A nonzero result requires investigation before interpreting the joined comparison.

-- 07 | Compare input, output, and scrap quantities between layers.
-- Casts assume numeric-looking Bronze strings (as in the checked dataset).
-- A malformed numeric text would cause a cast error and should be investigated.
SELECT
    COUNT(*) AS compared_rows,
    COUNT(*) FILTER (
        WHERE b.inputquantity::numeric IS DISTINCT FROM s.inputquantity
    ) AS input_mismatches,
    COUNT(*) FILTER (
        WHERE b.outputquantity::numeric IS DISTINCT FROM s.outputquantity
    ) AS output_mismatches,
    COUNT(*) FILTER (
        WHERE b.scrap::numeric IS DISTINCT FROM s.scrap
    ) AS scrap_mismatches
FROM bronze.production_rows b
JOIN silver.production_rows s
    ON b.production::bigint = s.production
   AND b.rn::integer = s.rn;
-- Observed: 2520 comparisons; zero differences for all three measures.
-- Evaluate together with duplicate-key checks (05) and missing-key checks (06).

-- 08 | Find records missing from the OTHER layer (both directions).
-- Uses text keys to avoid recasting Bronze numeric text for this particular check.
SELECT
    'bronze_only' AS issue,
    COUNT(*) AS row_count
FROM bronze.production_rows b
WHERE NOT EXISTS (
    SELECT 1
    FROM silver.production_rows s
    WHERE b.production = s.production::text
      AND b.rn = s.rn::text
)
UNION ALL
SELECT
    'silver_only' AS issue,
    COUNT(*) AS row_count
FROM silver.production_rows s
WHERE NOT EXISTS (
    SELECT 1
    FROM bronze.production_rows b
    WHERE b.production::bigint = s.production
      AND b.rn::integer = s.rn
);
-- Expected for this snapshot: zero in both directions.
-- Note: if Bronze uses leading zeros, the bronze_only text comparison may flag
-- valid numeric matches; inspect rather than immediately classifying them as errors.

-- 09 | Compact QA summary (no data changes).
WITH b AS (
    SELECT COUNT(*) AS rows_count,
           COUNT(DISTINCT (production, rn)) AS keys_count
    FROM bronze.production_rows
), s AS (
    SELECT COUNT(*) AS rows_count,
           COUNT(DISTINCT (production, rn)) AS keys_count
    FROM silver.production_rows
), cmp AS (
    SELECT COUNT(*) AS compared_rows,
           COUNT(*) FILTER (WHERE b.inputquantity::numeric IS DISTINCT FROM s.inputquantity)
               AS input_mismatches,
           COUNT(*) FILTER (WHERE b.outputquantity::numeric IS DISTINCT FROM s.outputquantity)
               AS output_mismatches,
           COUNT(*) FILTER (WHERE b.scrap::numeric IS DISTINCT FROM s.scrap)
               AS scrap_mismatches
    FROM bronze.production_rows b
    JOIN silver.production_rows s
      ON b.production::bigint = s.production
     AND b.rn::integer = s.rn
)
SELECT
    b.rows_count AS bronze_rows,
    s.rows_count AS silver_rows,
    b.rows_count - b.keys_count AS bronze_duplicate_rows,
    s.rows_count - s.keys_count AS silver_duplicate_rows,
    cmp.compared_rows,
    cmp.input_mismatches,
    cmp.output_mismatches,
    cmp.scrap_mismatches,
    CASE
        WHEN b.rows_count = s.rows_count
         AND cmp.compared_rows = b.rows_count
         AND b.rows_count = b.keys_count
         AND s.rows_count = s.keys_count
         AND cmp.input_mismatches = 0
         AND cmp.output_mismatches = 0
         AND cmp.scrap_mismatches = 0
        THEN 'PASS - checked key and quantity conditions'
        ELSE 'REVIEW - investigate differences'
    END AS qa_status
FROM b CROSS JOIN s CROSS JOIN cmp;
-- Observed baseline: PASS, with 2520 rows in both layers and 0 mismatches.
-- This does NOT validate every field, the original source files, or Gold layer.
