-- Sales Actual by month: dates are grouped by month so that sales and budget share a common monthly time unit

SELECT
    date_trunc('month', sales_date)::date AS month_date,
    SUM(quantity_t) AS actual_t
FROM gold.fact_sales
GROUP BY 1
ORDER BY 1;


-- Sales Budget by month
SELECT
    budget_date,
    SUM(budget_t) AS budget_t
FROM gold.fact_sales_budget
GROUP BY budget_date
ORDER BY budget_date;


-- Sales Actual vs Budget by month -- monthly comparison of actual sales and budget, with budget attainment %

WITH actual AS (
    SELECT
        date_trunc('month', sales_date)::date AS month_date,
        SUM(quantity_t) AS actual_t
    FROM gold.fact_sales
    GROUP BY 1
),

budget AS (
    SELECT
        budget_date AS month_date,
        SUM(budget_t) AS budget_t
    FROM gold.fact_sales_budget
    GROUP BY 1
)

SELECT
    COALESCE(a.month_date, b.month_date) AS month_date,
    ROUND(a.actual_t::numeric, 1) AS actual_t,
    ROUND(b.budget_t::numeric, 1) AS budget_t,
    ROUND((a.actual_t - b.budget_t)::numeric, 1) AS variance_t,
    ROUND(
        (a.actual_t / NULLIF(b.budget_t, 0) * 100)::numeric,
        1
    ) AS budget_fill_pct
FROM actual a
FULL OUTER JOIN budget b
    ON a.month_date = b.month_date
ORDER BY month_date;


-- Sales Actual vs Budget by year -- annual comparison of actual sales and budget, with budget attainment %

WITH actual AS (
    SELECT
        EXTRACT(YEAR FROM sales_date)::int AS year,
        SUM(quantity_t) AS actual_t
    FROM gold.fact_sales
    GROUP BY 1
),

budget AS (
    SELECT
        EXTRACT(YEAR FROM budget_date)::int AS year,
        SUM(budget_t) AS budget_t
    FROM gold.fact_sales_budget
    GROUP BY 1
)

SELECT
    COALESCE(a.year, b.year) AS year,
    ROUND(a.actual_t::numeric, 1) AS actual_t,
    ROUND(b.budget_t::numeric, 1) AS budget_t,
    ROUND((a.actual_t - b.budget_t)::numeric, 1) AS variance_t,
    ROUND(
        (a.actual_t / NULLIF(b.budget_t, 0) * 100)::numeric,
        1
    ) AS budget_fill_pct
FROM actual a
FULL OUTER JOIN budget b
    ON a.year = b.year
ORDER BY year;


-- Sales Actual vs Budget by year and plant -- annual comparison of actual sales and budget, with budget attainment %, broken down by plant

WITH actual AS (
    SELECT
        EXTRACT(YEAR FROM sales_date)::int AS year,
        plant_id,
        SUM(quantity_t) AS actual_t
    FROM gold.fact_sales
    GROUP BY 1, 2
),

budget AS (
    SELECT
        EXTRACT(YEAR FROM budget_date)::int AS year,
        plant_id,
        SUM(budget_t) AS budget_t
    FROM gold.fact_sales_budget
    GROUP BY 1, 2
)

SELECT
    COALESCE(a.year, b.year) AS year,
    COALESCE(a.plant_id, b.plant_id) AS plant_id,
    ROUND(a.actual_t::numeric, 1) AS actual_t,
    ROUND(b.budget_t::numeric, 1) AS budget_t,
    ROUND((a.actual_t - b.budget_t)::numeric, 1) AS variance_t,
    ROUND(
        (a.actual_t / NULLIF(b.budget_t, 0) * 100)::numeric,
        1
    ) AS budget_fill_pct
FROM actual a
FULL OUTER JOIN budget b
    ON a.year = b.year
   AND a.plant_id = b.plant_id
ORDER BY year, plant_id;


-- Sales Actual vs Budget by year, plant and product
-- with product descriptions

WITH actual AS (
    SELECT
        EXTRACT(YEAR FROM sales_date)::int AS year,
        plant_id,
        product_id,
        SUM(quantity_t) AS actual_t
    FROM gold.fact_sales
    GROUP BY 1, 2, 3
),

budget AS (
    SELECT
        EXTRACT(YEAR FROM budget_date)::int AS year,
        plant_id,
        product_id,
        SUM(budget_t) AS budget_t
    FROM gold.fact_sales_budget
    GROUP BY 1, 2, 3
)

SELECT
    COALESCE(a.year, b.year) AS year,
    COALESCE(a.plant_id, b.plant_id) AS plant_id,
    COALESCE(a.product_id, b.product_id) AS product_id,

    p.product_name,
    p.product_class,
    p.quality_class,
    p.package_type,
    p.diameter_mm,

    ROUND(a.actual_t::numeric, 1) AS actual_t,
    ROUND(b.budget_t::numeric, 1) AS budget_t,

    ROUND(
        (a.actual_t - b.budget_t)::numeric,
        1
    ) AS variance_t,

    ROUND(
        (a.actual_t / NULLIF(b.budget_t, 0) * 100)::numeric,
        1
    ) AS budget_fill_pct

FROM actual a

FULL OUTER JOIN budget b
    ON a.year = b.year
   AND a.plant_id = b.plant_id
   AND a.product_id = b.product_id

LEFT JOIN gold.dim_product p
    ON COALESCE(a.product_id, b.product_id) = p.product_id

ORDER BY
    year,
    plant_id,
    product_id;

