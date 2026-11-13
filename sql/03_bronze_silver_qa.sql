-- Pellet Supply Chain Management Dashboard
-- Bronze -> Silver data quality checks (PostgreSQL)
-- Read-only QA script: does not modify source tables or data.
-- Scope: structure (10 tables), schema differences, row counts, and sales invoice rows.
-- Verified example results from 2026-10-08 are listed as expectations, not hard-coded assertions.
-- CAUTION: The source data may change; interpret any differences before remediation.

-- 01 | Compare bronze and silver column definitions
WITH columns_by_layer AS (
    SELECT table_schema, table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema IN ('bronze', 'silver')
), comparison AS (
    SELECT
        COALESCE(b.table_name, s.table_name) AS table_name,
        COALESCE(b.column_name, s.column_name) AS column_name,
        b.data_type AS bronze_type,
        s.data_type AS silver_type,
        CASE
            WHEN b.column_name IS NULL THEN 'Only in Silver'
            WHEN s.column_name IS NULL THEN 'Only in Bronze'
            WHEN b.data_type <> s.data_type THEN 'Different types'
            ELSE 'OK'
        END AS status
    FROM (SELECT * FROM columns_by_layer WHERE table_schema = 'bronze') b
    FULL OUTER JOIN (SELECT * FROM columns_by_layer WHERE table_schema = 'silver') s
        ON b.table_name = s.table_name AND b.column_name = s.column_name
)
SELECT * FROM comparison ORDER BY table_name, column_name;
-- Observed: 66 OK; 59 Different types; 20 Only in Bronze; 0 Only in Silver.

-- 02 | Summary of column differences
WITH columns_by_layer AS (
    SELECT table_schema, table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema IN ('bronze', 'silver')
), comparison AS (
    SELECT CASE
        WHEN b.column_name IS NULL THEN 'Only in Silver'
        WHEN s.column_name IS NULL THEN 'Only in Bronze'
        WHEN b.data_type <> s.data_type THEN 'Different types'
        ELSE 'OK'
    END AS status
    FROM (SELECT * FROM columns_by_layer WHERE table_schema = 'bronze') b
    FULL OUTER JOIN (SELECT * FROM columns_by_layer WHERE table_schema = 'silver') s
        ON b.table_name = s.table_name AND b.column_name = s.column_name
)
SELECT status, COUNT(*) AS column_count
FROM comparison
GROUP BY status
ORDER BY status;

-- 03 | Bronze-only fields (expected: _loaded_at, _source_file per table)
SELECT b.table_name, b.column_name, b.data_type AS bronze_data_type
FROM information_schema.columns b
LEFT JOIN information_schema.columns s
    ON s.table_schema = 'silver'
   AND s.table_name = b.table_name
   AND s.column_name = b.column_name
WHERE b.table_schema = 'bronze'
  AND s.column_name IS NULL
ORDER BY b.table_name, b.column_name;

-- 04 | Type conversions summary
SELECT b.data_type AS bronze_type,
       s.data_type AS silver_type,
       COUNT(*) AS column_count
FROM information_schema.columns b
JOIN information_schema.columns s
    ON s.table_schema = 'silver'
   AND s.table_name = b.table_name
   AND s.column_name = b.column_name
WHERE b.table_schema = 'bronze'
  AND b.data_type <> s.data_type
GROUP BY b.data_type, s.data_type
ORDER BY column_count DESC, bronze_type, silver_type;
-- Observed: text -> numeric 26; integer 7; bigint 7;
-- timestamp without time zone 7; boolean 5; timestamp with time zone 5; date 2.

-- 05 | Exact row counts across both layers (read-only dynamic SQL)
-- query_to_xml is used to count all tables without creating functions or temp tables.
SELECT t.table_name,
       (xpath('/row/c/text()', query_to_xml(
           format('SELECT COUNT(*) AS c FROM bronze.%I', t.table_name),
           false, true, '')))[1]::text::bigint AS bronze_rows,
       (xpath('/row/c/text()', query_to_xml(
           format('SELECT COUNT(*) AS c FROM silver.%I', t.table_name),
           false, true, '')))[1]::text::bigint AS silver_rows
FROM information_schema.tables t
WHERE t.table_schema = 'bronze'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;
-- Observed across all 10 tables: 8,007 bronze rows and 8,007 silver rows.
-- Correction: the earlier comment stated 8,011, a summation error; the per-table counts
-- were correct. The 8,007 totals were confirmed in PostgreSQL on 13 November 2026.
-- Equal counts alone do not prove identical records.

-- 06 | Required fields (NULL checks) in silver invoice rows
SELECT COUNT(*) AS total_rows,
       COUNT(*) FILTER (WHERE number IS NULL) AS missing_invoice_number,
       COUNT(*) FILTER (WHERE rn IS NULL) AS missing_row_number,
       COUNT(*) FILTER (WHERE quantity IS NULL) AS missing_quantity,
       COUNT(*) FILTER (WHERE item IS NULL) AS missing_item,
       COUNT(*) FILTER (WHERE price IS NULL) AS missing_price
FROM silver.invoice_rows;
-- Observed: 1,404 rows; all five NULL counts = 0.

-- 07 | Plausibility checks and duplicate invoice line groups
SELECT COUNT(*) FILTER (WHERE quantity = 0) AS zero_quantity,
       COUNT(*) FILTER (WHERE quantity < 0) AS negative_quantity,
       COUNT(*) FILTER (WHERE price < 0) AS negative_price,
       COUNT(*) FILTER (WHERE TRIM(item) = '') AS empty_item,
       (SELECT COUNT(*) FROM (
           SELECT number, rn
           FROM silver.invoice_rows
           GROUP BY number, rn
           HAVING COUNT(*) > 1
       ) d) AS duplicate_invoice_rows
FROM silver.invoice_rows;
-- Observed: all five counts = 0.
-- Negative quantities might represent returns in real-world datasets.

-- 08 | Verify bronze invoice line business-key uniqueness
SELECT COUNT(*) AS bronze_rows,
       COUNT(DISTINCT (number, rn)) AS unique_invoice_rows,
       COUNT(*) - COUNT(DISTINCT (number, rn)) AS duplicate_rows
FROM bronze.invoice_rows;
-- Observed: 1,404 / 1,404 / 0.

-- 09 | Bronze -> Silver quantities on matched invoice rows
-- Safe to compare as text->numeric based on inspected current schema.
-- Conversion will error if new bronze values contain non-numeric text.
SELECT COUNT(*) AS compared_rows,
       COUNT(*) FILTER (WHERE b.quantity::numeric <> s.quantity) AS quantity_mismatches
FROM bronze.invoice_rows b
JOIN silver.invoice_rows s
  ON b.number::bigint = s.number
 AND b.rn::integer = s.rn;
-- Observed: compared_rows = 1,404; quantity_mismatches = 0.
-- Compare counts with source row counts and uniqueness checks above.
-- This does not validate other attributes (e.g., price, discount, product).

-- Further work: validate source-file fidelity in Bronze; reconcile additional
-- converted columns and price/discount values; document the actual ETL logic.
