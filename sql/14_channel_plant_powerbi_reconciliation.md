# Sales by Channel and Production by Plant — PostgreSQL to Power BI reconciliation

**Project:** Pellet Supply Chain Management Dashboard

**QA date:** 2026-11-13

**Audit reference:** V1 quality audit finding **B9** (see `docs/07_quality_assurance/v1_audit_decisions.md`)

**Scope:** Full reporting period 2023–2025. Sales Actual, Budget, Variance and Attainment by **sales channel**, and Production Actual, Budget, Variance and Attainment by **plant**. All volumes are in metric tonnes (t). Budget means planned volume, not money.

## Purpose

The earlier reconciliations (`06_production_powerbi_reconciliation.md` and `08_sales_powerbi_reconciliation.md`) compared PostgreSQL and Power BI at **grand-total level only**. This document extends the SQL ↔ Power BI comparison to two business dimensions:

- **Sales channel** – the dimension corrected in audit finding A1, where channel-level Budget and Attainment were previously wrong.
- **Plant** – including Production Budget, which had not been compared with SQL before.

## Comparison rules

1. Each dimension member must be present in both SQL and Power BI.
2. Actual, Budget and Variance must match at Power BI's displayed precision (whole tonnes).
3. Attainment must match within 0.01 percentage points.
4. Power BI grand totals must reconcile to the independently calculated SQL totals.
5. No unexpected blank or unassigned dimension member may appear.

**Rounding note:** Power BI rounds each row and the grand total independently. The sum of displayed rows can therefore differ by a tonne from the displayed total. Likewise, a displayed Variance can differ by one tonne from displayed Actual minus displayed Budget. Such differences come from rounding, not from the data. Where available, compare the underlying (unrounded or one-decimal SQL) values rather than treating a rounding difference as a failure.

## Test A – Sales by channel

**Power BI page:** Sales Analysis – Sales View matrix (visual `2419b340904920b0cc6c`)

**Settings:** Year = All; Month = All; Plant = All; Product = All; Channel = All; Sales View Selector = **Channel**; Sales KPI Selector = All.

### SQL query

```sql
WITH a AS (
    SELECT channel_id, SUM(quantity_t) AS actual_t
    FROM gold.fact_sales
    GROUP BY channel_id
),
b AS (
    SELECT channel_id, SUM(budget_t) AS budget_t
    FROM gold.fact_sales_budget
    GROUP BY channel_id
)
SELECT
    COALESCE(a.channel_id, b.channel_id) AS channel_id,
    c.channel_name,
    ROUND(a.actual_t, 1) AS actual_t,
    ROUND(b.budget_t, 1) AS budget_t,
    ROUND(a.actual_t - b.budget_t, 1) AS variance_t,
    ROUND(100 * a.actual_t / NULLIF(b.budget_t, 0), 2) AS attainment_pct
FROM a
FULL OUTER JOIN b ON a.channel_id = b.channel_id
LEFT JOIN gold.dim_channel c
    ON c.channel_id = COALESCE(a.channel_id, b.channel_id)
ORDER BY 1;
```

### Results

**PostgreSQL** (volumes to one decimal; attainment to two decimals):

| Channel | Actual (t) | Budget (t) | Variance (t) | Attainment (%) |
|---|---:|---:|---:|---:|
| B2B | 216,172.7 | 217,161.9 | -989.2 | 99.54 |
| DIST | 1,520,952.1 | 1,520,998.0 | -45.9 | 100.00 |
| IND | 638,226.3 | 629,769.1 | 8,457.2 | 101.34 |
| RET | 54,227.6 | 55,170.1 | -942.5 | 98.29 |
| **Total (sum of rows)** | **2,429,578.7** | **2,423,099.1** | **6,479.6** | **100.27** |

**Power BI** (whole tonnes; percentages to two decimals):

| Channel | Actual (t) | Budget (t) | Variance (t) | Attainment (%) |
|---|---:|---:|---:|---:|
| B2B | 216,173 | 217,162 | -989 | 99.54 |
| DIST | 1,520,952 | 1,520,998 | -46 | 100.00 |
| IND | 638,226 | 629,769 | 8,457 | 101.34 |
| RET | 54,228 | 55,170 | -942 | 98.29 |
| **Total** | **2,429,579** | **2,423,099** | **6,480** | **100.27** |

**Outcome: PASS at displayed precision.** All four channels are present in both outputs, with no blank or unassigned channel. Every row and the grand total agree within the comparison rules. The Actual total also matches the earlier Sales Actual reconciliation (2,429,578.7 t, `08_sales_powerbi_reconciliation.md`).

The RET Variance is -942.5 in SQL and -942 in Power BI. The SQL value is itself rounded to one decimal, and the unrounded difference lies within ±0.5 t of the Power BI display. This is a rounding effect, not a discrepancy.

## Test B – Production by plant

**Power BI page:** Plant Analysis – plant production performance matrix (visual `633a70f67f5c8c495b19`)

**Settings:** Year = All; Month = All; Plant = All; Product = All; Production KPI Selector = All.

### SQL query

```sql
WITH a AS (
    SELECT plant_id, SUM(quantity_t) AS actual_t
    FROM gold.fact_production
    GROUP BY plant_id
),
b AS (
    SELECT plant_id, SUM(budget_t) AS budget_t
    FROM gold.fact_production_budget
    GROUP BY plant_id
)
SELECT
    COALESCE(a.plant_id, b.plant_id) AS plant_id,
    ROUND(a.actual_t, 1) AS actual_t,
    ROUND(b.budget_t, 1) AS budget_t,
    ROUND(a.actual_t - b.budget_t, 1) AS variance_t,
    ROUND(100 * a.actual_t / NULLIF(b.budget_t, 0), 2) AS attainment_pct
FROM a
FULL OUTER JOIN b ON a.plant_id = b.plant_id
ORDER BY 1;
```

The query returns the technical key `plant_id` (`PLANT-A` to `PLANT-D`). Power BI displays `plant_name` (`Plant A` to `Plant D`), whose values are derived in Power Query from the Gold plant names (audit finding B7-A). The mapping is one-to-one.

### Results

**PostgreSQL** (volumes to one decimal; attainment to two decimals):

| Plant (`plant_id` → display name) | Actual (t) | Budget (t) | Variance (t) | Attainment (%) |
|---|---:|---:|---:|---:|
| PLANT-A → Plant A | 294,164.3 | 295,000.4 | -836.1 | 99.72 |
| PLANT-B → Plant B | 469,209.9 | 472,000.5 | -2,790.6 | 99.41 |
| PLANT-C → Plant C | 704,109.5 | 707,999.4 | -3,889.9 | 99.45 |
| PLANT-D → Plant D | 938,598.6 | 944,000.7 | -5,402.1 | 99.43 |
| **Total (sum of rows)** | **2,406,082.3** | **2,419,001.0** | **-12,918.7** | **99.47** |

**Power BI** (whole tonnes; percentages to two decimals):

| Plant | Actual (t) | Budget (t) | Variance (t) | Attainment (%) |
|---|---:|---:|---:|---:|
| Plant A | 294,164 | 295,000 | -836 | 99.72 |
| Plant B | 469,210 | 472,001 | -2,791 | 99.41 |
| Plant C | 704,110 | 707,999 | -3,890 | 99.45 |
| Plant D | 938,599 | 944,001 | -5,402 | 99.43 |
| **Total** | **2,406,082** | **2,419,001** | **-12,919** | **99.47** |

**Outcome: PASS at displayed precision.** All four plants are present in both outputs, with no blank or unassigned plant. Every row and the grand total agree within the comparison rules. The Actual total also matches the earlier Production Actual reconciliation (2,406,082.3 t, `06_production_powerbi_reconciliation.md`). This is the first documented SQL ↔ Power BI comparison of **Production Budget**.

Two rounding effects are expected:

- The displayed Actual rows sum to 2,406,083, while the displayed total is 2,406,082. The total is rounded from 2,406,082.3.
- For Plant C, displayed Actual minus displayed Budget is -3,889, while the displayed Variance is -3,890. The Variance is rounded from -3,889.9.

## Additional consistency check

The budget figures in both tests also equal the sums of the original budget source files (`sales_budget.csv` by `channel_id`, `production_budget.csv` by `plant_id`) to one decimal place. This was computed read-only from the local source archives during the audit. It supports, but does not replace, the separate Source-to-Bronze validation.

## How to reproduce

1. Run both SQL queries in pgAdmin against the project database (read-only).
2. In Power BI, open **Sales Analysis** and select **Reset**. Set Sales View Selector = Channel and make sure all four Sales KPIs are shown. Read the Sales View matrix, including its total.
3. Open **Plant Analysis** and select **Reset** (Production KPI Selector = All). Read the plant production performance matrix, including its total.
4. Make sure no Year, Month, Plant, Product or Channel selections, cross-highlights or other filters are active.
5. Apply the comparison rules above. Investigate any missing member, blank row or difference larger than the rounding tolerance before accepting the report.

## Scope and limitations

The two tests establish numerical consistency between **PostgreSQL Gold aggregates** and the corresponding **Power BI measures and filter context** for the channel and plant dimensions over the full period. They do not independently verify every stage of the underlying data transformation.

The following are **documented limitations – accepted for V1**:

- **Channel assignment is not traced to the source.** Sales-channel values are already present in `gold.fact_sales` and `gold.fact_sales_budget`. The original sales invoice source files do not contain a directly comparable channel field. This test therefore does not establish whether each original invoice was assigned to the correct business channel when the Gold layer was built.
- **Month and product levels were not reconciled.** Detailed SQL ↔ Power BI comparisons by month and by product were not performed. The SQL queries in `01_sales_v1_checks.sql` (by month, year, plant and product) remain available for a future comparison.
- **Dimension combinations were not tested.** Combinations such as channel × month or plant × product were not tested.
- **Precision is limited to the display.** The comparison is limited to Power BI's displayed precision. Unrounded DAX output was not extracted.
- **Other QA checks remain separate.** The existing Source-to-Bronze and Bronze/Silver/Gold checks (`03`, `04`, `05`, `07`, `10`) validate the SQL pipeline. They are not SQL ↔ Power BI dimension-level tests and are not represented as such here.

**Related QA files:**
- `06_production_powerbi_reconciliation.md` — Production Actual grand-total reconciliation.
- `08_sales_powerbi_reconciliation.md` — Sales Actual grand-total reconciliation.
- `01_sales_v1_checks.sql` — SQL Actual vs Budget queries by month, year, plant and product.
- `05_silver_gold_production_qa.sql` and `07_sales_silver_gold_qa.sql` — line-level Silver/Gold reconciliations.
