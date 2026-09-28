-- Sales Actual by month Siin ühendatakse kuupäevad ühe kuu alla, et sales ja budget oleksid ühises kuises ajaühikus

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


-- Sales Actual vs Budget by month -- kuupõhine  Actual sales ja Budget võrdlus ja budgeti täituvuse %

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


-- Sales Actual vs Budget by year ----aasta põhine  Actual sales ja Budget võrdlus ja budgeti täituvuse %  

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
