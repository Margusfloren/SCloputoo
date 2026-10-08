# Pellet Supply Chain Management Dashboard

## Project overview

This project is a supply chain management dashboard for a pellet-industry environment.

The objective is to combine sales and production information into a clear management view that helps answer questions such as:

- Are sales meeting the budget?
- Is production meeting the budget?
- How does production compare with sales?
- Which plants are performing above or below plan?
- Which products are driving the result?
- How does performance change by period?
- How are actual sales distributed across sales channels?

The project is built around a management-level Power BI dashboard supported by PostgreSQL, SQL and Python.

The current version represents **V1 of the project**. After the V1 defence, the project will continue as a broader supply chain management solution.

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

Sales-channel analysis is included to analyse the distribution of actual sales.  
The V1 sales budget is **not allocated at sales-channel level**, therefore channel views should not be interpreted as channel-specific budget fulfilment.

---

## V1 dashboard structure

The Power BI report currently contains the following main analysis pages:

### V1 Dashboard

The main management overview combines sales and production information in one view.

The page includes:

- Sales Actual
- Sales Budget
- Sales Variance
- Sales Budget Attainment
- Production Actual
- Production Budget
- Production Variance
- Production Attainment
- Production vs Sales
- Production vs Sales %
- filters for Year, Month, Plant, Product and Channel
- comparison of Production Actual with either Budget or Sales
- product-level and plant-level detail views
- Reset filters functionality

The purpose of the V1 Dashboard is to provide a high-level management overview while still allowing the user to investigate the main drivers behind the result.

---

### Sales Analysis

The Sales Analysis page provides a more detailed view of sales performance.

It includes:

- Sales Actual vs Budget
- Sales Variance
- Sales Budget Attainment
- monthly performance analysis
- product, plant and channel views
- selectable KPI and analysis perspectives
- detailed Actual / Budget / Variance tables
- Reset filters functionality

Sales-channel views are primarily intended to analyse **actual sales distribution**.

Because the V1 budget is not allocated separately to B2B, DIST, IND and RET channels, channel-level Budget Attainment must not be interpreted as fulfilment of a dedicated channel budget.

---

### Production Analysis

The Production Analysis page provides a detailed view of production performance.

It includes:

- Production Actual vs Budget
- Production Actual vs Sales
- Production Variance
- Production Attainment
- monthly analysis
- detailed Actual / Budget / Variance tables
- filters for Year, Month, Plant and Product
- Reset filters functionality

The page is intentionally kept simple and focuses on two core questions:

1. Is production meeting the production budget?
2. Is production aligned with actual sales?

---

### Plant Analysis

The Plant Analysis page focuses on production performance by plant.

It includes:

- Production Actual vs Budget
- plant-level Production Variance
- Production Attainment
- production mix by plant
- production share by plant
- product filtering
- plant selection
- Reset filters functionality

This page helps identify which production plants are driving the total result and how the product mix differs between plants.

---

### Product Analysis

The Product Analysis page focuses on product-level production and sales relationships.

It includes:

- Production Actual vs Budget by product
- Production Actual vs Sales by product
- product performance by plant
- Production Share % by plant
- filters for Year, Month, Plant and Product
- Reset filters functionality

The page supports analysis of which products are produced by which plants and whether production volume is aligned with actual sales.

---

## Key performance indicators

### Sales Actual

Actual sales volume in tonnes for the selected reporting context.

### Sales Budget

Budgeted sales volume in tonnes for the selected reporting context.

### Sales Variance

Difference between Sales Actual and Sales Budget.

**Formula:**

`Sales Actual - Sales Budget`

A positive value indicates sales above budget.  
A negative value indicates sales below budget.

### Sales Budget Attainment

Sales Actual divided by Sales Budget.

**Formula:**

`Sales Actual / Sales Budget`

100% means that the sales budget has been achieved exactly.

---

### Production Actual

Actual production volume in tonnes for the selected reporting context.

### Production Budget

Budgeted production volume in tonnes for the selected reporting context.

### Production Variance

Difference between Production Actual and Production Budget.

**Formula:**

`Production Actual - Production Budget`

A positive value indicates production above budget.  
A negative value indicates production below budget.

### Production Attainment

Production Actual divided by Production Budget.

**Formula:**

`Production Actual / Production Budget`

100% means that the production budget has been achieved exactly.

---

### Production vs Sales

Difference between Production Actual and Sales Actual.

**Formula:**

`Production Actual - Sales Actual`

A positive value indicates that production exceeded sales.  
A negative value indicates that sales exceeded production.

### Production vs Sales %

Production Actual divided by Sales Actual.

**Formula:**

`Production Actual / Sales Actual`

100% means production and sales volumes are equal.

A value above 100% indicates that production exceeded sales, while a value below 100% indicates that sales exceeded production.

This KPI helps identify situations where both production and sales may individually appear close to budget, but production and sales volumes are not aligned with each other.

---

## Conditional formatting

To support exception-based analysis, the report uses simple and consistent formatting rules.

- Negative Variance values are highlighted in red.
- Attainment values below 100% are highlighted in red.
- Production vs Sales % values below 100% are highlighted in red.

The objective is to make exceptions visible without adding unnecessary visual complexity.

---

## Data source and architecture

The project uses a **Directo-based source data structure**.

The data is transformed and validated in PostgreSQL using a layered architecture:

`Source / Directo structure → Bronze → Silver → Gold → Power BI`

The Gold layer contains reporting-ready fact and dimension tables.

Main fact tables include:

- `gold.fact_sales`
- `gold.fact_sales_budget`
- `gold.fact_production`
- `gold.fact_production_budget`

Main dimensions include:

- `gold.dim_date`
- `gold.dim_plant`
- `gold.dim_product`
- `gold.dim_channel`

The Power BI semantic model is built primarily around controlled measures rather than exposing raw fact-table fields directly to the end user.

---

## Semantic model

The model has been cleaned for end-user use.

Technical implementation details are hidden where they are not required for reporting.

Examples include:

- KPI display measures
- chart-title measures
- filter-context helper measures
- YTD helper measures not required in V1 reporting
- technical fact-table columns
- field-parameter technical fields
- metadata helper tables

Important business measures remain visible and documented.

The model also contains descriptions for key measures and reporting dimensions to make the semantic layer easier to understand and maintain.

---

## Data dictionary

The Power BI About page includes automatically generated metadata views for:

- reporting columns
- business measures
- descriptions
- DAX expressions

Technical and hidden fields are excluded from the end-user metadata presentation.

This allows the About page to act as a lightweight data dictionary for the V1 model.

---

## Validation and QA

The project uses multiple independent validation layers.

Key calculations are checked using:

- SQL
- Power BI
- Python
- dedicated QA Validation views

The purpose is to confirm that the same business logic produces the same result regardless of the tool used.

### Example validation

For January 2023:

- Sales Actual: **68,298.7 t**
- Sales Budget: **68,646.1 t**
- Sales Variance: **-347.4 t**
- Sales Budget Attainment: **99.49%**

The same result was reproduced using PostgreSQL / SQL, Python and Power BI.

---

## V1 Quality Assurance

Before completion, the V1 report was tested for:

- Year filtering
- Month filtering
- Plant filtering
- Product filtering
- Channel filtering
- synchronized slicers across report pages
- KPI and detail-table consistency
- selector behaviour
- Production vs Budget / Sales comparison
- Reset filters functionality
- conditional formatting
- negative Variance handling
- Attainment values below 100%
- Production vs Sales %
- cross-page consistency
- SQL / Python / Power BI calculation consistency
- semantic-model visibility
- measure and column descriptions
- removal of unused and technical controls
- metadata presentation
- documentation consistency

The objective of the QA process is to ensure that the V1 report is not only visually complete but also logically consistent, understandable and repeatable.

---

## Design principles

The report follows a deliberately simple visual approach.

The main principles are:

- less is more
- consistent terminology
- clear separation between Sales and Production
- limited use of colour
- exception-based highlighting
- management information before technical detail
- the ability to move from a high-level KPI to the underlying reason

The objective is not to maximise the number of visuals, but to make the information easy to read and explain.

---

## Technology

The project currently uses:

- PostgreSQL
- SQL
- Power BI
- DAX
- Power Query
- Python
- pandas
- SQLAlchemy
- Git
- GitHub

Python connects directly to the PostgreSQL Gold layer and is used as an independent validation layer for key calculations.

---

## V1 scope

The current V1 focuses on:

- Sales Actual vs Budget
- Production Actual vs Budget
- Production vs Sales
- Production vs Sales %
- Plant performance
- Product performance
- sales-channel actual distribution
- period-based filtering
- synchronized report filters
- management-level KPI monitoring
- detailed analysis pages
- data and calculation validation

The purpose of V1 is to create a clear and reliable management view rather than to cover every supply chain process.

---

## Long version roadmap

After the V1 defence, the project will continue as a broader supply chain management solution.

Planned extensions include:

- finished-goods inventory management
- opening and closing inventory
- Min Stock / Target / Max Stock / Physical Capacity
- inventory utilization %
- inventory coverage
- BOM and dry-matter raw-material requirements
- moisture-based wet-tonnage conversion
- raw-material planning
- packaging capacity and backlog
- bulk silo and port storage
- vessel scheduling
- forecast snapshots
- forecast accuracy
- forecast bias
- OTIF order and delivery performance
- exception-based management views
- more detailed sales-channel planning
- Python / Streamlit web-based reporting

---

## Project status

**V1 functional development and structured QA are complete.**

The current version provides a validated management view of sales and production performance and forms the foundation for the extended supply chain management version of the project.