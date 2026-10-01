# Power BI – Pellet Supply Chain Dashboard

This folder contains the Power BI project for the Pellet Supply Chain Management Dashboard.

The dashboard is built as a Power BI Project (`.pbip`) so that the report structure, semantic model and future changes can be version-controlled in GitHub.

## Purpose

The dashboard is designed as a management view for pellet-industry supply chain operations.

The current V1 focuses on comparing sales and production performance against budget and allowing the user to analyse results dynamically by selected periods, plants, products and sales channels.

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

## Power BI Project Structure

`Pellet_SC_dashboard.pbip`  
Main Power BI project file.

`Pellet_SC_dashboard.Report/`  
Power BI report pages, visuals and report definitions.

`Pellet_SC_dashboard.SemanticModel/`  
Semantic model containing tables, relationships, measures and model definitions.

## Data Model

The dashboard uses a dimensional model based on the structure of source data from Directo.

Main Gold-layer tables include:

- Sales
- Sales Budget
- Production
- Production Budget
- Date
- Plant
- Product
- Sales Channel

Data is prepared in PostgreSQL before being consumed by Power BI.

## Current Status

**V1 core functionality is complete.**

The next phase focuses mainly on:

- visual design
- dashboard layout
- naming and usability
- QA and filter testing
- dynamic titles
- final presentation for the thesis / project defence

## Future Development

The extended version of the project will continue beyond V1.

Planned areas include inventory management, raw-material planning, BOM logic, OTIF, capacity constraints, sales-channel mix analysis, forecasting and additional supply-chain management views.