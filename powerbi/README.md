# Power BI – Pellet Supply Chain Dashboard

This folder contains the Power BI project for the Pellet Supply Chain Management Dashboard.

The dashboard is built as a Power BI Project (`.pbip`) so that the report structure, semantic model and future changes can be version-controlled in GitHub.

## Purpose

The dashboard is designed as a management view for pellet-industry supply chain operations.

The current V1 focuses on comparing sales and production performance against budget and allowing the user to analyse results dynamically by selected periods, plants, products and sales channels.

This portfolio project uses **synthetic data** based on a **Directo-inspired source structure**. It represents a simulated pellet-industry supply chain and does not contain actual company transactions.

## V1 Functionality

Current V1 functionality includes:

- Sales Actual vs Budget
- Production Actual vs Budget
- Sales and Production variance
- Budget attainment %
- Selected Period calculations
- Multi-select Year and Month filters
- Plant and Product filtering
- Sales Channel filtering
- Dynamic KPI selection using Field Parameters
- Dynamic Plant / Product views
- Sales and Production matrices
- Dynamic Production comparison:
  - Production Actual vs Budget
  - Production Actual vs Sales
- Channel-filter logic separating sales analysis from production analysis
- Handling of zero / blank values and unbudgeted sales scenarios
- An About page with KPI definitions, model information and measure documentation

**V1 scope note:** Sales-channel views show actual sales distribution. The V1 sales budget is not allocated at sales-channel level, so channel-level budget comparisons should not be inferred.

## Power BI Project Structure

`Pellet_SC_dashboard.pbip`  
Main Power BI project file.

`Pellet_SC_dashboard.Report/`  
Power BI report pages, visuals and report definitions.

`Pellet_SC_dashboard.SemanticModel/`  
Semantic model containing tables, relationships, measures and model definitions.

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

The project includes SQL and Python checks for data consistency across the source, Bronze, Silver, Gold and Power BI layers. Validation scripts and results are documented separately in the repository's `sql/` folder and `docs/07_quality_assurance/`.

Passing a validation check confirms the specific conditions tested; it does not independently establish the business correctness of the synthetic input data.

## Current Status

**V1 core functionality is complete.** The dashboard's principal views and the About-page documentation have been reviewed, and the core validation work is documented.

The remaining preparation for a public portfolio release focuses on:

- Final usability and visual consistency checks
- Portfolio screenshots and project presentation
- Repository documentation and review of files intended for publication
- Final GitHub version-control and release preparation

## Future Development

The extended version of the project will continue beyond V1.

Planned areas include inventory management, raw-material planning, BOM logic, OTIF, capacity constraints, sales-channel mix analysis, forecasting and additional supply-chain management views.
