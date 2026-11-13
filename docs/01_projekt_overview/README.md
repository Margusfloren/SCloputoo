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
- Are production and sales developing in balance?

The project is built around a management-level Power BI dashboard supported by PostgreSQL, SQL and Python.

The current version represents **V1** of the project, which was successfully defended on 9 October 2026. The project is planned to continue as a broader supply chain management solution.

---

## Business context

The model represents a pellet producer with multiple production plants, products and sales channels.

The main reporting dimensions are:

- Year
- Month
- Plant
- Product
- Sales Channel

The current V1 focuses primarily on **sales and production performance against budget**, while also comparing actual production directly with actual sales.

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
- Production vs Sales

The same global filters can be used to analyse results by period, plant, product and sales channel.

The dashboard also allows the user to switch the production comparison between **Budget** and **Sales**.

A **Reset filters** button returns the page to its predefined default view.

---

### Sales Analysis

The **Sales Analysis** page provides a more detailed view of sales performance.

Main analysis areas include:

- Sales Actual vs Budget
- Sales Variance
- Sales Budget Attainment
- performance by Plant
- performance by Product
- performance by Sales Channel

The purpose of the page is to move from a management-level KPI view into the underlying sales structure.

A **Reset filters** button restores the default filter and selector state.

---

### Production Analysis

The **Production Analysis** page focuses on production performance.

The page includes:

- Production Actual vs Budget
- Production Variance
- Production Budget Attainment
- Production Actual vs Sales Actual
- Production vs Sales in tonnes
- Production vs Sales %

The **Production vs Sales** measures help identify whether production output and sales volumes are developing in balance.

**Production vs Sales** shows the absolute difference in tonnes.

**Production vs Sales %** compares Production Actual directly with Sales Actual.

A value of:

- **100%** means production and sales volumes are equal;
- **above 100%** means production exceeded sales;
- **below 100%** means sales exceeded production.

This relationship becomes especially important in later versions of the project when finished-goods inventory is added to the model.

A **Reset filters** button restores the default analysis state.

---

### Plant Analysis

The **Plant Analysis** page provides a plant-level view of performance.

It helps analyse:

- production by plant;
- performance against production budget;
- product mix by plant;
- production share by plant;
- differences between production sites.

Plants can be selected directly using dedicated plant selection buttons.

The view also makes it visible when a selected product is manufactured only at specific plants.

A **Reset filters** button returns the page to its default state and clears plant selections.

---

### Product Analysis

The **Product Analysis** page focuses on individual products and product mix.

It supports analysis of:

- production by product;
- sales by product;
- production budget performance;
- plant contribution;
- production share by plant;
- Production vs Sales in tonnes;
- Production vs Sales %.

The page is designed to help understand not only whether a product is above or below budget, but also how production compares directly with sales.

For example, a product may appear healthy when both production and sales are above budget, while the Production vs Sales measures may show that production is still increasing inventory faster than sales are reducing it.

A **Reset filters** button restores the predefined default filter state.

---

## KPI definitions

### Actual

Actual sales or production volume for the selected reporting context.

### Budget

Planned sales or production volume for the selected reporting context.

### Variance

Difference between Actual and Budget.

**Variance = Actual - Budget**

A positive value indicates performance above budget.

A negative value indicates performance below budget.

### Budget Attainment

Actual divided by Budget.

**Budget Attainment % = Actual / Budget**

100% means that the budget has been achieved exactly.

### Production vs Sales

Difference between Production Actual and Sales Actual.

**Production vs Sales = Production Actual - Sales Actual**

A positive value indicates that production exceeded sales.

A negative value indicates that sales exceeded production.

### Production vs Sales %

Production Actual divided by Sales Actual.

**Production vs Sales % = Production Actual / Sales Actual**

100% means production and sales volumes are equal.

A value above 100% indicates that production exceeded sales.

A value below 100% indicates that sales exceeded production.

---

## Data source

The project uses a **Directo-based source data structure** as the basis for the data model.

The project data is prepared for analytical and educational use and does not contain confidential company reporting data.

The source structure follows typical ERP logic including areas such as:

- items;
- sales;
- purchases;
- dates;
- plants;
- products;
- sales channels.

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

- data type corrections;
- naming standardization;
- validation rules.

### Gold layer

Contains reporting-ready fact and dimension tables used by Power BI and Python.

The gold layer is intended to provide a consistent source of truth for analytical calculations.

During Silver/Gold processing, source records are mapped to the reporting dimensions (product, plant and sales channel). The build scripts for the Bronze, Silver and Gold layers are not included in this repository, so the exact processing stage of each mapping is not documented here.

### Sales-channel assignment

- **Sales budget:** the source file `sales_budget.csv` contains the sales channel explicitly (`channel_id`, `channel_name`). The budget totals by channel in Gold equal the source file totals (see `sql/14_channel_plant_powerbi_reconciliation.md`).
- **Actual sales:** the source invoice files contain no channel field. The Gold layer contains sales-channel assignments used by the reporting model. The original source-to-Gold channel-assignment implementation is not included in this repository. SQL-to-Power BI reconciliation verifies the reported channel aggregates, but does not independently validate the original assignment rules.

---

## Reporting model

The Power BI model follows a star-schema approach.

Separate fact tables are used for:

- Sales Actual;
- Sales Budget;
- Production Actual;
- Production Budget.

Shared dimensions include:

- Date;
- Plant;
- Product;
- Sales Channel.

This allows the same filters and business dimensions to be used consistently across different reporting areas.

Sales and production remain separate business processes while sharing common analytical dimensions.

---

## Semantic model

The Power BI semantic model has been prepared for end-user use.

Important business measures are kept visible and include descriptions to explain their purpose.

Technical helper measures, intermediate calculations and unnecessary technical fields are hidden from the end user.

This helps ensure that a user receiving the Power BI file can create additional tables or visuals using a clean and understandable set of fields.

Visible business measures include areas such as:

- Sales Actual;
- Sales Budget;
- Sales Variance;
- Sales Budget Attainment;
- Production Actual;
- Production Budget;
- Production Variance;
- Production Budget Attainment;
- Production vs Sales;
- Production vs Sales %;
- Plant Production Share %.

---

## Tools used

The project combines several tools instead of relying on a single reporting application.

### PostgreSQL

Used for:

- data storage;
- transformation;
- layered data architecture;
- validation;
- analytical queries.

### SQL

Used to:

- build and validate the reporting model;
- reproduce key KPI calculations;
- check monthly and period-level results;
- compare Actual and Budget values.

### Power BI

Used for:

- management dashboards;
- KPI reporting;
- interactive filtering;
- detailed analysis;
- dynamic views and selectors;
- cross-filtering between visuals;
- bookmark-based Reset filters functionality;
- semantic model documentation.

### Python

Python is used in two different quality assurance roles.

A read-only validation script (`python/10_source_bronze_full_qa.py`) independently compares the original source CSV files with the PostgreSQL Bronze tables. The comparison covers columns, row counts and complete rows, and all ten tables passed (10/10 PASS).

A notebook connected to the PostgreSQL gold layer cross-checks selected sales KPIs by running SQL queries:

- Actual;
- Budget;
- Variance;
- Budget Attainment.

The KPI values in the notebook are calculated by SQL in PostgreSQL. Independent KPI recalculation in Python is not yet implemented.

Python development will later continue into a web-based analytical interface using Streamlit.

### GitHub

GitHub is used for:

- version control;
- project documentation;
- SQL scripts;
- Python notebooks;
- Power BI project files;
- portfolio presentation.

Development work is maintained in a dedicated development branch until the V1 version is ready for release.

---

## Validation approach

An important principle of the project is that the same business result should be reproducible using different tools.

Key results are therefore calculated separately in SQL and in Power BI (DAX) and compared:

**SQL ↔ Power BI**

For example, the same selected period can be calculated in SQL and in Power BI and the results compared.

Python supports this approach in two ways: it independently validates the Source → Bronze load, and it cross-checks selected SQL KPI results from the gold layer.

This approach helps identify:

- modelling errors;
- incorrect filters;
- incorrect measures;
- transformation issues;
- inconsistencies between reporting layers.

The purpose is to increase confidence that the dashboard is showing reliable information rather than simply producing visually correct reports.

---

## Example validation

One SQL validation check compares monthly Sales Actual and Sales Budget.

Example:

**January 2023**

- Sales Actual: 68,298.7 t
- Sales Budget: 68,646.1 t
- Variance: -347.4 t
- Budget Attainment: 99.5%

The same result can then be reproduced in Power BI and retrieved in the Python notebook using the same SQL query.

Another example demonstrates the relationship between production and sales.

**February 2024**

- Production Actual: 72,068 t
- Sales Actual: 67,181 t
- Production vs Sales: +4,887 t
- Production vs Sales %: 107.28%

This means that production exceeded sales by **7.28%** during the selected period.

The example demonstrates why budget performance alone is not sufficient for supply chain management.

Sales and production may both be above budget while still being out of balance with each other.

---

## Design principles

The dashboard follows a simple management-reporting principle:

**Less is more.**

The focus is on:

- clear information;
- consistent visual logic;
- limited use of colours;
- comparable Sales and Production views;
- readable KPIs;
- useful interaction between visuals;
- avoiding unnecessary decorative elements;
- consistent exception highlighting;
- simple navigation and filter reset functionality.

Negative variance values are highlighted in **red**.

Attainment values below **100%** are highlighted in **red**.

Production vs Sales values below zero and Production vs Sales % values below 100% are also highlighted to make imbalances easier to identify.

Positive or normal values are generally left in neutral formatting so that exceptions receive the user's attention.

---

## Reset filters

The main analysis pages include a **Reset filters** button.

Each page uses its own Power BI bookmark to restore the predefined default state.

The reset functionality restores relevant settings such as:

- Year;
- Month;
- Plant;
- Product;
- Sales Channel;
- page-specific KPI selectors;
- page-specific view selectors;
- comparison selections.

This allows users to explore the dashboard freely while always having a simple way to return to the original management view.

---

## V1 scope

The current V1 focuses on:

- Sales Actual vs Budget;
- Production Actual vs Budget;
- Production vs Sales;
- Production vs Sales %;
- period analysis;
- plant analysis;
- product analysis;
- sales-channel analysis;
- KPI validation;
- interactive filtering;
- reset controls;
- semantic model usability;
- SQL ↔ Power BI reconciliation, supported by Python Source → Bronze validation and SQL result cross-checks.

V1 is intentionally limited to a manageable and reliable reporting scope.

The broader supply chain functionality is planned for the extended version of the project.

---

# Extended project roadmap

V1 was successfully defended on 9 October 2026. Further development is planned toward a more complete supply chain management solution.

Planned areas include the following.

## Finished-goods inventory

Add inventory flows including:

- Opening Stock;
- Production;
- Sales;
- Closing Stock.

Basic inventory logic:

**Closing Stock = Opening Stock + Production - Sales**

The current Production vs Sales measures already show the operational imbalance that will later flow into finished-goods inventory.

For example, if production consistently exceeds sales, finished-goods inventory should increase unless other outbound inventory movements exist.

---

## Inventory limits and capacity

Finished-goods inventory will include operational limits such as:

- Min Stock;
- Target Stock;
- Max Stock;
- Physical Capacity;
- Current Stock;
- Utilization %;
- Inventory Coverage.

Possible status logic:

- Below Minimum;
- OK;
- Near Full;
- Over Capacity.

Packaged products and bulk products will have different storage constraints.

---

## Raw-material BOM

A BOM layer will convert the production plan into required raw-material volumes.

The model will include a standard dry-matter raw-material mix for one tonne of pellets.

Raw-material categories may include:

- planing shavings;
- wet sawdust;
- wood chips;
- roundwood.

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

- production requirement;
- packaging requirement;
- available packaging capacity;
- backlog.

This is particularly important for packaged premium pellets.

---

## Bulk storage and vessel planning

Bulk products require a different logistics model.

Future development may include:

- bulk silo capacity;
- port storage;
- vessel schedules;
- loading requirements;
- inventory before vessel arrival.

This will help connect production planning with outbound logistics.

---

## Forecast management

The extended project will include forecast snapshots.

This will make it possible to compare how forecasts change over time and calculate:

- Forecast Accuracy;
- Forecast Bias;
- Forecast vs Actual;
- Forecast vs Budget.

Historical forecast snapshots are required because the latest forecast alone does not show how planning quality has developed.

---

## OTIF

OTIF — **On Time In Full** — will be added as a customer-service KPI.

The future model will include order and delivery level information to analyse whether customer orders were delivered:

- on time;
- in full;
- both on time and in full.

This will connect operational supply chain performance with customer-service performance.

---

## Exception-based management

The long-term objective is not to require managers to inspect every KPI manually.

The dashboard should increasingly highlight situations that require attention.

Examples:

- Sales below budget;
- Production below budget;
- Production and Sales out of balance;
- inventory below minimum;
- warehouse near capacity;
- insufficient raw material;
- packaging backlog;
- forecast bias;
- OTIF deterioration.

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
├── powerbi/
│   └── Power BI project files (PBIP report and semantic model)
│
├── data/
│   └── data folder notes and aggregated QA results (raw source archives are excluded)
│
└── README.md
```

---

## Current project status

| Area | Status |
|---|---|
| V1 implementation | Completed |
| V1 quality audit | Completed – no remaining publication-blocking findings |
| Publication preparation | In progress |
| V2 development | Planned |

Current focus: preparing the repository for portfolio publication.

Planned future functionality remains V2 scope and has not been implemented. Audit decisions, accepted technical debt and documented limitations are recorded in [`docs/07_quality_assurance/v1_audit_decisions.md`](../07_quality_assurance/v1_audit_decisions.md).

---

## QA

Before V1 is considered final, the dashboard is reviewed through a structured Quality Assurance process.

QA includes checks such as:

- slicers filter the correct visuals;
- synchronized filters behave consistently;
- Sales, Production, Plant and Product pages use consistent logic;
- KPI values match detailed tables;
- percentages and negative values are formatted correctly;
- titles, units and terminology are consistent;
- selectors and visual interactions work correctly;
- Reset filters buttons restore the intended default filter and selector states;
- negative Variance values are highlighted consistently;
- Attainment values below 100% are highlighted consistently;
- Production vs Sales tonnes and percentage calculations produce consistent results;
- SQL and Power BI calculations produce matching results, and the Python notebook returns the same SQL result for the tested period;
- technical helper measures are hidden from end users;
- important business measures include descriptions;
- obsolete test visuals or measures are removed;
- project documentation matches the final dashboard.

The objective of QA is to ensure that V1 is not only visually complete but also logically consistent, understandable and reproducible.

---

## Project objective

The project is designed to demonstrate how operational industry knowledge, supply chain management and modern data analytics can be combined into one management solution.

The technical tools are important, but the main objective is to understand and explain:
what is happening, where it is happening, and what is driving the numbers.