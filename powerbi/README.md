# Power BI – Pellet Supply Chain Dashboard

This folder contains the Power BI project for the Pellet Supply Chain Management Dashboard.

The dashboard is built as a Power BI Project (`.pbip`) so that the report structure, semantic model and future changes can be version-controlled in GitHub.

## Purpose

The dashboard is designed as a management view for pellet-industry supply chain operations.

V1 compares sales and production performance against budget and allows users to analyse results by period, plant and product. Sales views also support channel-level **Actual vs Budget** comparisons.

This portfolio project uses **synthetic data** based on a **Directo-inspired source structure**. It represents a simulated pellet-industry supply chain and does not contain actual company transactions.

## V1 Functionality

Current V1 functionality includes:

- Sales Actual vs Budget, including channel-specific budgets
- Production Actual vs Budget
- Sales and Production variance
- Budget attainment %
- Selected Period calculations
- Multi-select Year and Month filters
- Plant and Product filtering
- Sales Channel filtering for sales results and budgets
- Dynamic KPI selection using Field Parameters
- Dynamic Plant / Product / Channel views where applicable
- Sales and Production matrices
- Selectable production chart comparison:
  - Production Actual vs Budget
  - Production Actual vs Sales
- **Production vs Sales by Product (All Channels)**, comparing production with sales across all channels regardless of the selected sales-channel slicer
- Handling of zero and blank values in relevant measures
- An About page with KPI definitions, model information and measure documentation
- A QA Validation page for inspecting selected reporting totals

**V1 scope note:** Sales budgets are **allocated by sales channel**. Channel-level Actual, Budget, Variance and Attainment values have been checked against PostgreSQL results. Production quantities are **not** allocated to sales channels. Therefore, the production-versus-sales balance uses **all-channel sales** rather than the selected channel's sales volume.

## Power BI Project Structure

`Pellet_SC_dachboard.pbip`  
Main Power BI project file.

`Pellet_SC_dachboard.Report/`  
Power BI report pages, visuals and report definitions.

`Pellet_SC_dachboard.SemanticModel/`  
Semantic model containing tables, relationships, measures and model definitions.

*The `dachboard` spelling above follows the existing project filenames.*

## Data Model

The dashboard uses a dimensional model based on a synthetic, Directo-inspired source-data structure.

Main Gold-layer tables include:

- Sales
- Sales Budget
- Production
- Production Budget
- Date
- Plant
- Product
- Sales Channel

The sales and sales-budget fact tables share the Sales Channel dimension. Channel slicers and the Sales View Selector use the channel dimension, enabling consistent filtering of both actual sales and their budgets.

Data is prepared in PostgreSQL through Bronze, Silver and Gold layers before being consumed by Power BI.

## Automated Measure Documentation

The **About** page includes measure documentation derived from the Power BI semantic model rather than manually transcribed DAX formulas.

A calculated table named `Model Measures Metadata` retrieves metadata for visible measures using:

```dax
Model Measures Metadata =
FILTER(
    INFO.VIEW.MEASURES(),
    [IsHidden] = FALSE()
)
```

The About-page table displays the following fields from this metadata:

- **Name** – measure name
- **Description** – the description stored with the measure in the semantic model
- **Expression** – the measure's DAX expression

This supports traceability between the report documentation and the actual measure definitions, while reducing the need to maintain a separate list of manually copied formulas.

**Display note:** Long DAX expressions may be visually truncated in the table. Hover over an Expression cell to view its full content.

**Refresh note:** `Model Measures Metadata` is a calculated table, not a live query executed on every report interaction. After changing a measure, the metadata table may need to be recalculated or refreshed before the About page reflects the latest definition.

## Quality Assurance

SQL checks document data consistency and reconciliation across the source, Bronze, Silver, Gold and Power BI layers. Python notebooks support exploratory analysis and cross-checks of SQL-derived results; they do **not** yet independently recalculate the complete Power BI KPI set.

Channel-level sales actuals, budgets, variances and attainment have also been compared against PostgreSQL query results. Report-level filtering and Reset filters have been tested on the V1 Dashboard and Sales Analysis pages.

Validation scripts and results are documented separately in the repository's `sql/` folder and `docs/07_quality_assurance/`.

Passing a validation check confirms the specific conditions tested; it does not independently establish the business correctness of the synthetic input data.

## Current Status

**V1 core functionality is implemented and tested against the documented checks.** A final quality and documentation review is in progress before public portfolio release.

Remaining release preparation includes:

- Final documentation consistency checks
- Review of project files intended for publication
- Final GitHub version-control and release preparation

## Future Development

The extended version of the project will continue beyond V1.

Planned areas include inventory management and coverage, raw-material planning, BOM logic, OTIF, capacity constraints, more detailed channel and customer-mix analysis, forecasting and additional exception-focused supply-chain management views.
