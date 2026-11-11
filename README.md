# Pellet Supply Chain Management Dashboard

**A practical management dashboard for a simulated, multi-plant pellet supply chain.**

**Tools:** Power BI · DAX · PostgreSQL · SQL · Python · Git/GitHub  
**Version:** V1 — completed and tested  
**Dataset:** Synthetic, Directo-inspired data · 2023–2025

The project brings **sales, production and budget data** into one reporting environment to help management identify deviations, compare plants and products, and examine whether production is aligned with sales.

## Dashboard preview

![V1 Dashboard showing sales and production KPIs, actual versus budget trends, production versus sales, and product-level comparisons](docs/images/v1-dashboard.png)

*V1 Dashboard — management overview of sales, production, budget variances and production-versus-sales performance. All figures are simulated.*

## The business challenge

A high-level total can look close to budget even when individual plants, products or periods tell a different story. The dashboard is designed around three management questions:

- **Performance:** Are sales and production meeting their budgets?
- **Drivers:** Which periods, plants and products explain deviations?
- **Balance:** How does production volume compare with sales volume?

## What V1 includes

| Report page | Main purpose |
|---|---|
| **V1 Dashboard** | Combined sales and production KPIs, budget variances and production-versus-sales comparisons |
| **Sales Analysis** | Sales trends, actual sales by channel and product-level performance |
| **Production Analysis** | Production against budget and sales, with selectable KPI views |
| **Plant Analysis** | Plant-specific production performance, product mix and share of output |
| **Product Analysis** | Product performance and production-versus-sales relationships |

The report supports interactive year, month, plant and product filters, context-specific sales-channel filtering, dynamic selectors and **Reset filters**. Separate **QA Validation** and **About** pages explain checks, KPI definitions and model context.

### Additional analysis views

<table>
<tr>
  <th align="left">Plant Analysis</th>
  <th align="left">Sales Analysis</th>
</tr>
<tr>
  <td width="50%"><a href="docs/images/plant-analysis.png"><img src="docs/images/plant-analysis.png" alt="Plant Analysis dashboard with production KPIs, plant product mix and output shares" width="100%"></a></td>
  <td width="50%"><a href="docs/images/sales-analysis.png"><img src="docs/images/sales-analysis.png" alt="Sales Analysis dashboard with sales trends, budget comparison and sales channels" width="100%"></a></td>
</tr>
<tr>
  <td>Explore plant results, production mix and contribution to total output.</td>
  <td>Explore sales trends and channel distribution. The sales budget is <strong>not</strong> allocated by channel.</td>
</tr>
</table>

*Click either image to open the full-size screenshot.*

## Data pipeline and model

`Source CSV files → PostgreSQL Bronze → Silver → Gold → Power BI`

The Power BI semantic model uses separate **sales, sales budget, production and production budget fact tables** with shared **date, plant, product and sales-channel dimensions**. SQL and Python support data preparation, analysis and independent validation.

**The dataset is entirely synthetic.** It reflects a Directo-inspired source structure, not actual company transactions or operational results.

## Quality assurance

Data checks are documented and reproducible:

- **Source → Bronze:** **10/10 tables PASS**, covering **8,007 rows** with no missing or additional rows under the comparison rules.
- **Bronze → Silver → Gold:** sales and production row-count, structural and quantity reconciliations.
- **Gold → Power BI:** reported KPI totals checked against database results at the documented precision; report filters and reset behaviour tested.

**Interpretation:** A PASS confirms the specific checks performed, not the business accuracy of synthetic data. In the source-to-Bronze comparison, an empty CSV field and PostgreSQL `NULL` are treated as equivalent.

See the [full Source-to-Bronze validation](sql/10_source_to_bronze_full_validation.md), [SQL QA files](sql/) and [quality-assurance notes](docs/07_quality_assurance/).

## About-page measure documentation

The **About** page retrieves measure names, descriptions and DAX expressions from **Power BI semantic-model metadata** instead of maintaining manually copied formulas. The `Model Measures Metadata` calculated table may require recalculation or refresh after measure changes.

## V1 boundaries and next steps

V1 covers **sales, production, budgets and deviations**; it is not yet a complete supply-chain planning system. Sales-channel views are intended primarily for **actual sales distribution**. Because the V1 sales budget is **not allocated by channel**, channel-level comparisons must **not** be interpreted as separate channel budget targets.

Potential next stages include inventory and coverage, raw-material and BOM planning, capacity constraints, forecast accuracy, OTIF and exception-focused management views.

## Explore the project

- [Power BI report and semantic model](powerbi/)
- [SQL scripts and QA records](sql/)
- [Python scripts](python/)
- [Project documentation](docs/)

**Reproducibility note:** The repository contains the Power BI project structure and validation materials. Running the report against its underlying data requires an appropriate local PostgreSQL and Power BI setup; raw ZIP source archives may be excluded from the repository.
