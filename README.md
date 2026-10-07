# Pellet Supply Chain Management Dashboard

## Project overview

This project is a supply chain management dashboard for a pellet-industry environment.

The objective is to combine sales and production information into a clear management view that helps answer questions such as:

- Are sales meeting the budget?
- Is production meeting the budget?
- How does production compare with sales?
- Which plants are performing above or below plan?
- Which products are driving the result?
- How does performance change by period and sales channel?

The project is built around a management-level Power BI dashboard supported by PostgreSQL, SQL and Python.

The current version represents **V1** of the project. After the V1 defence, the project will continue as a broader supply chain management solution.

---

## Business context

The model represents a pellet producer with multiple production plants, products and sales channels.

The main reporting dimensions are:

- Year
- Month
- Plant
- Product
- Sales Channel

The current V1 focuses primarily on **sales and production performance against budget**.

The purpose is not only to display numbers, but also to make deviations visible and support analysis of the factors behind the results.

---

## Dashboard structure

### V1 Dashboard

The **V1 Dashboard** provides a high-level management view of sales and production performance.

It is intended for quick monitoring of:

- Sales Actual
- Sales Budget
- Sales Variance
- Sales Budget Attainment
- Production Actual
- Production Budget
- Production Variance
- Production Budget Attainment

The same global filters can be used to analyse results by period, plant, product and sales channel.

---

### Sales Analysis

The **Sales Analysis** page provides a more detailed view of sales performance.

Main analysis areas include:

- Sales Actual vs Budget
- Variance
- Budget Attainment
- performance by Plant
- performance by Product
- performance by Sales Channel

The purpose of the page is to move from a management-level KPI view into the underlying sales structure.

---

### Production Analysis

The **Production Analysis** page focuses on production performance.

The page includes:

- Production Actual vs Budget
- Production Variance
- Production Budget Attainment
- Production Actual vs Sales Actual

The **Production vs Sales** view helps identify whether production output and sales volumes are developing in balance.

This becomes especially important in later versions of the project when finished-goods inventory is added to the model.

---

### Plant Analysis

The **Plant Analysis** page provides a plant-level view of performance.

It helps analyse:

- production by plant
- performance against budget
- sales and production relationships
- product mix by plant
- differences between production sites

The view also makes it visible when a selected product is manufactured only at specific plants.

---

### Product Analysis

The **Product Analysis** page focuses on individual products and product mix.

It supports analysis of:

- production by product
- sales by product
- budget performance
- plant contribution
- product share of total production or sales

The page is designed to help understand not only whether a product is above or below budget, but also how important that product is within the selected plant or period.

---

## KPI definitions

### Actual

Actual sales or production volume for the selected period.

### Budget

Planned sales or production volume for the selected period.

### Variance

Difference between Actual and Budget.

**Variance = Actual - Budget**

A positive value indicates performance above budget.

A negative value indicates performance below budget.

### Budget Attainment

Actual divided by Budget.

**Budget Attainment % = Actual / Budget**

100% means that the budget has been achieved exactly.

---

## Data source

The project uses a **Directo-based source data structure** as the basis for the data model.

The project data is prepared for analytical and educational use and does not contain confidential company reporting data.

The source structure follows typical ERP logic including areas such as:

- items
- sales
- purchases
- dates
- plants
- products
- sales channels

The Directo-style source structure is transformed into a reporting model suitable for supply chain analysis.

---

## Data architecture

The data pipeline follows a layered PostgreSQL structure:

**Source Data → Bronze → Silver → Gold → Power BI / Python**

### Bronze layer

Contains source-level imported data with minimal transformation.

### Silver layer

Contains cleaned and standardized data.

Typical transformations include:

- data type corrections
- naming standardization
- product mapping
- plant mapping
- sales-channel mapping
- validation rules

### Gold layer

Contains reporting-ready fact and dimension tables used by Power BI and Python.

The gold layer is intended to provide a consistent source of truth for analytical calculations.

---

## Reporting model

The Power BI model follows a star-schema approach.

Separate fact tables are used for:

- Sales Actual
- Sales Budget
- Production Actual
- Production Budget

Shared dimensions include:

- Date
- Plant
- Product
- Sales Channel

This allows the same filters and business dimensions to be used consistently across the different reporting areas.

Sales and production remain separate business processes while sharing common analytical dimensions.

---

## Tools used

The project combines several tools instead of relying on a single reporting application.

### PostgreSQL

Used for:

- data storage
- transformation
- layered data architecture
- validation
- analytical queries

### SQL

Used to:

- build and validate the reporting model
- reproduce key KPI calculations
- check monthly and period-level results
- compare Actual and Budget values

### Power BI

Used for:

- management dashboards
- KPI reporting
- interactive filtering
- detailed analysis
- dynamic views and selectors
- cross-filtering between visuals

### Python

Python connects directly to the PostgreSQL gold layer.

It is used as an independent analytical and validation tool.

Current Python validation includes key sales KPIs such as:

- Actual
- Budget
- Variance
- Budget Attainment

Python development will later continue into a web-based analytical interface using Streamlit.

### GitHub

GitHub is used for:

- version control
- project documentation
- SQL scripts
- Python notebooks
- Power BI project files
- portfolio presentation

---

## Validation approach

An important principle of the project is that the same business result should be reproducible using different tools.

Key calculations are therefore checked independently using:

**SQL ↔ Python ↔ Power BI**

For example, the same selected period can be calculated separately in SQL, Python and Power BI and the results compared.

This approach helps identify:

- modelling errors
- incorrect filters
- incorrect measures
- transformation issues
- inconsistencies between reporting layers

The purpose is to increase confidence that the dashboard is showing reliable information rather than simply producing visually correct reports.

---

## Example validation

One of the SQL validation checks compares monthly Sales Actual and Sales Budget.

Example:

**January 2023**

- Sales Actual: 68,298.7 t
- Sales Budget: 68,646.1 t
- Variance: -347.4 t
- Budget Attainment: 99.5%

The same result can then be reproduced in Power BI and Python.

---

## Design principles

The dashboard follows a simple management-reporting principle:

**Less is more.**

The focus is on:

- clear information
- consistent visual logic
- limited use of colours
- comparable Sales and Production views
- readable KPIs
- useful interaction between visuals
- avoiding unnecessary decorative elements

The objective is to make deviations and relationships visible without adding visual noise.

---

## V1 scope

The current V1 focuses on:

- Sales Actual vs Budget
- Production Actual vs Budget
- Production vs Sales
- period analysis
- plant analysis
- product analysis
- sales-channel analysis
- KPI validation
- interactive filtering
- SQL / Python / Power BI cross-validation

V1 is intentionally limited to a manageable and reliable reporting scope.

The broader supply chain functionality is planned for the extended version of the project.

---

# Extended project roadmap

After the V1 defence, development will continue toward a more complete supply chain management solution.

Planned areas include the following.

## Finished-goods inventory

Add inventory flows including:

- Opening Stock
- Production
- Sales
- Closing Stock

Basic inventory logic:

**Closing Stock = Opening Stock + Production - Sales**

This will connect the currently separate Sales and Production views into a complete material-flow perspective.

---

## Inventory limits and capacity

Finished-goods inventory will include operational limits such as:

- Min Stock
- Target Stock
- Max Stock
- Physical Capacity
- Current Stock
- Utilization %
- Inventory Coverage

Possible status logic:

- Below Minimum
- OK
- Near Full
- Over Capacity

Packaged products and bulk products will have different storage constraints.

---

## Raw-material BOM

A BOM layer will convert the production plan into required raw-material volumes.

The model will include a standard dry-matter raw-material mix for one tonne of pellets.

Raw-material categories may include:

- planing shavings
- wet sawdust
- wood chips
- roundwood

This will allow the production plan to be translated into raw-material requirements.

---

## Moisture-based raw-material conversion

Dry-matter requirements will be converted into actual incoming wet tonnes using the moisture content of each raw material.

This is important because production planning based only on wet tonnes does not accurately represent usable dry material.

The model will therefore connect:

**Production Plan → Dry Matter Requirement → Moisture Conversion → Required Incoming Raw Material**

---

## Packaging capacity

Future development will include packaging-line capacity.

The model will help compare:

- production requirement
- packaging requirement
- available packaging capacity
- backlog

This is particularly important for packaged premium pellets.

---

## Bulk storage and vessel planning

Bulk products require a different logistics model.

Future development may include:

- bulk silo capacity
- port storage
- vessel schedules
- loading requirements
- inventory before vessel arrival

This will help connect production planning with outbound logistics.

---

## Forecast management

The extended project will include forecast snapshots.

This will make it possible to compare how forecasts change over time and calculate:

- Forecast Accuracy
- Forecast Bias
- Forecast vs Actual
- Forecast vs Budget

Historical forecast snapshots are required because the latest forecast alone does not show how planning quality has developed.

---

## OTIF

OTIF — **On Time In Full** — will be added as a customer-service KPI.

The future model will include order and delivery level information to analyse whether customer orders were delivered:

- on time
- in full
- both on time and in full

This will connect operational supply chain performance with customer-service performance.

---

## Exception-based management

The long-term objective is not to require managers to inspect every KPI manually.

The dashboard should increasingly highlight situations that require attention.

Examples:

- Sales below budget
- Production below budget
- inventory below minimum
- warehouse near capacity
- insufficient raw material
- packaging backlog
- forecast bias
- OTIF deterioration

This moves the solution toward **exception-based supply chain management**.

---

## Python / Streamlit

After the Power BI version, the project will also be developed as a Python-based web application.

Planned technology:

**PostgreSQL → Python → Streamlit**

The purpose is to demonstrate that the same analytical logic can be delivered through different front-end technologies while using the same underlying data model.

---

## Repository structure

The repository is organized around the main technical parts of the project.

```text
/
├── docs/
│   └── project documentation
│
├── sql/
│   └── SQL queries and validation scripts
│
├── python/
│   └── Python notebooks and analytical checks
│
├── Power BI project files
│
└── README.md

---

Current project status
V1 core functionality is complete.
Current focus:
- final visual review
- QA
- documentation
- consistency checks
- preparation for project defence
The next major development stage begins after the V1 defence.
QA
Before V1 is considered final, the dashboard is reviewed through a structured Quality Assurance process.
QA includes checks such as:
- slicers filter the correct visuals
- synchronized filters behave consistently
- Sales, Production, Plant and Product pages use consistent logic
- KPI values match detailed tables
- percentages and negative values are formatted correctly
- titles, units and terminology are consistent
- selectors and visual interactions work correctly
- SQL, Python and Power BI calculations produce matching results
- obsolete test visuals or measures are removed
- project documentation matches the final dashboard
The objective of QA is to ensure that V1 is not only visually complete but also logically consistent and reproducible.
Project objective
The project is designed to demonstrate how operational industry knowledge, supply chain management and modern data analytics can be combined into one management solution.
The technical tools are important, but the main objective is to understand and explain:
what is happening, where it is happening, and what is driving the numbers