-- Sales Actual by month

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