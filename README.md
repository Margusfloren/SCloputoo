# Pellet Supply Chain Management Dashboard

A data analytics and Power BI portfolio project for a multi-plant pellet production environment.

**Status:** Power BI V1 core functionality complete — QA and documentation in progress  
**Last updated:** 06.10.2026

## Project Overview

The goal of this project is to build a Supply Chain Management dashboard that connects sales, production and their operational balance into one management view.

The main questions are:

- Is sales performance in line with budget?
- Is production in line with the production plan?
- In which period, plant or product does a variance occur?
- Are production and sales moving at the same pace?
- Which product, plant or sales channel is driving the result?
- How large is the actual gap between production and sales, and for which products does it occur?

The project uses synthetic 2023–2025 data for four pellet plants.

## Key Analytical Idea

Budget performance alone does not tell the full story.

Production can be close to 100% of budget while actual sales develop differently. For that reason, the dashboard connects:

**Sales → Production → Production vs Sales**

A key measure is:

```DAX
Production vs Sales =
[Production Actual] - [Sales Actual]
```

A positive value means production exceeded sales during the selected period.  
A negative value means sales exceeded production.

The result is not automatically classified as good or bad, because the difference may reflect planned inventory build-up, seasonality or inventory consumption.

## Source Data and Architecture

The source-data structure follows principles inspired by a **Directo ERP-style data model**.

```text
Source data
   ↓
PostgreSQL
   ↓
Bronze
   ↓
Silver / Gold
   ↓
SQL validation
   ↓
Python / pandas validation
   ↓
Power BI
```

The validation principle is:

**SQL = Python = Power BI**

## Data Model

Main dimensions:

- `gold.dim_date`
- `gold.dim_plant`
- `gold.dim_product`
- `gold.dim_channel`

Main fact tables:

- `gold.fact_sales`
- `gold.fact_sales_budget`
- `gold.fact_production`
- `gold.fact_production_budget`

## Power BI V1

The current Power BI version contains five connected analysis views.

### 1. SC Overview

The Overview page combines the main management story on one screen.

It includes:

- Sales Actual, Budget, Variance and Budget Attainment KPIs
- Production Actual, Budget, Variance and Production Attainment KPIs
- Sales Actual vs Budget trend
- Production Actual vs Sales trend
- Sales performance by product
- Production performance by product
- Production vs Sales by Product
- synchronized Year, Month, Plant, Product and Channel slicers
- a selector to compare production with Budget or Sales

The page is designed to answer:

**What happened? When did it happen? Which product caused it? How large was the impact?**

### 2. Sales Analysis

Detailed sales-performance analysis against budget by:

- Year
- Month
- Plant
- Product
- Sales Channel

### 3. Production Analysis

Detailed production-performance analysis including:

- Production Actual vs Budget
- Production Actual vs Sales
- production KPI selectors
- dynamic production views
- detailed production tables

### 4. Plant Analysis

Plant-level production analysis including:

- Production Actual vs Budget by plant
- Product mix by plant
- Plant production performance
- Production share by plant

### 5. Product Analysis

Product-level production and sales analysis including:

- Production Actual vs Budget by product
- Production vs Sales
- Product performance by plant
- Production share by plant

## KPI and Formatting Logic

Budget Attainment and Production Attainment use the following status logic:

- below 90% → Critical
- 90% to below 95% → Attention
- 95% to 105% → OK
- above 105% to 110% → Attention
- above 110% → Critical

Current palette:

- OK / green: `#A8C9A0`
- Attention / mustard: `#D6A84B`
- Critical / red: `#C00000`

## Validation

V1 is validated using multiple tools against the same Gold-layer data:

1. PostgreSQL calculates Actual / Budget / Variance / Attainment.
2. Python reads the same Gold-layer data and performs an independent check.
3. Power BI uses the same analytical layer for visualization.

## Python

Current V1 notebook:

```text
python/01_sales_analysis.ipynb
```

Python is used as an independent validation layer.

A later phase will extend the same business logic into a Python / Streamlit web dashboard.

## Repository Structure

```text
README.md

data/
docs/
sql/
python/
powerbi/
```

- `data/` — synthetic source/test data
- `docs/` — project documentation and design notes
- `sql/` — PostgreSQL scripts and validation queries
- `python/` — Python / pandas analysis and validation
- `powerbi/` — Power BI Project (PBIP) files

Detailed project documentation in Estonian:

[`docs/01_projekt_overview/README.md`](docs/01_projekt_overview/README.md)

## Current V1 Status

Completed:

- PostgreSQL Bronze / Silver / Gold model
- DIM / FACT analytical model
- SQL validation
- Python ↔ PostgreSQL Gold connection
- Power BI connection
- SC Overview
- Sales Analysis
- Production Analysis
- Plant Analysis
- Product Analysis
- synchronized global slicers
- standardized KPI formatting
- Production vs Sales analysis by product
- conditional formatting for key variance and attainment measures

Current focus:

- final QA
- navigation review
- documentation
- defence preparation

## Long-Version Roadmap

Planned extensions include:

- finished-goods inventory: opening / closing stock
- Min Stock / Target / Max / Physical Capacity
- inventory utilization % and coverage
- BOM / dry-matter raw-material mix
- moisture-based wet-tonnage conversion
- packaging capacity and backlog
- bulk silo / port storage / vessel schedule
- forecast snapshots, forecast accuracy and bias
- OTIF at order / delivery grain
- exception-based management view
- Sales Channel Budget / Channel Mix
- Python / Streamlit web dashboard

## Scope

V1 is not intended to model the entire pellet-industry supply chain at once.

Its purpose is to lock down the core analytical logic between:

**Sales, Production and Production vs Sales**

and to build a reliable technical foundation for the extended version of the project.
