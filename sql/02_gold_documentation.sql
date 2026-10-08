-- Pellet Supply Chain project: gold layer column descriptions
-- Adds PostgreSQL metadata only; does not modify table data or structures.
-- Review business definitions for reference costs, prices, discounts and period grain.
BEGIN;


-- TABLE DESCRIPTIONS

COMMENT ON TABLE gold.dim_channel IS
'Sales channel dimension. Defines the channels used to classify pellet sales.';

COMMENT ON TABLE gold.dim_customer IS
'Customer dimension. Contains customer identification and classification attributes.';

COMMENT ON TABLE gold.dim_date IS
'Calendar dimension. Contains dates and calendar attributes used for time-based analysis.';

COMMENT ON TABLE gold.dim_plant IS
'Production plant dimension. Contains plant identification and descriptive attributes.';

COMMENT ON TABLE gold.dim_product IS
'Product dimension. Contains pellet product characteristics, classification and packaging information.';

COMMENT ON TABLE gold.dim_raw IS
'Raw material dimension. Contains raw material identification, classification and standard cost attributes.';

COMMENT ON TABLE gold.dim_supplier IS
'Supplier dimension. Contains supplier identification and descriptive attributes.';

COMMENT ON TABLE gold.dim_version IS
'Planning version dimension. Identifies the versions used in actual and budget data.';

COMMENT ON TABLE gold.fact_production IS
'Production fact table. Contains actual pellet production quantities by date, plant, product and version.';

COMMENT ON TABLE gold.fact_production_budget IS
'Production budget fact table. Contains planned pellet production quantities by date, plant, product and version.';

COMMENT ON TABLE gold.fact_purchase_invoice IS
'Raw material purchase fact table. Contains purchase quantities and financial values by date, plant, supplier and raw material.';

COMMENT ON TABLE gold.fact_sales IS
'Sales fact table. Contains actual pellet sales quantities and financial values by invoice line, date, plant, product, customer and channel.';

COMMENT ON TABLE gold.fact_sales_budget IS
'Sales budget fact table. Contains planned pellet sales quantities by date, plant, product and channel.';

-- COLUMN DESCRIPTIONS


-- dim_channel
COMMENT ON COLUMN gold.dim_channel.channel_id IS 'Identifier of the sales channel.';
COMMENT ON COLUMN gold.dim_channel.channel_name IS 'Descriptive name of the sales channel.';

-- dim_customer
COMMENT ON COLUMN gold.dim_customer.customer_id IS 'Identifier of the customer.';
COMMENT ON COLUMN gold.dim_customer.customer_name IS 'Descriptive name of the customer.';
COMMENT ON COLUMN gold.dim_customer.country_code IS 'Country code associated with the customer.';
COMMENT ON COLUMN gold.dim_customer.channel_id IS 'Sales channel associated with the customer.';

-- dim_date
COMMENT ON COLUMN gold.dim_date.date IS 'Calendar date used as the natural date key.';
COMMENT ON COLUMN gold.dim_date.year IS 'Calendar year.';
COMMENT ON COLUMN gold.dim_date.quarter IS 'Calendar quarter number.';
COMMENT ON COLUMN gold.dim_date.month_no IS 'Calendar month number (1-12).';
COMMENT ON COLUMN gold.dim_date.month_name IS 'Name of the calendar month.';
COMMENT ON COLUMN gold.dim_date.year_month IS 'Year and month label for reporting.';
COMMENT ON COLUMN gold.dim_date.month_start_date IS 'First calendar date of the month.';
COMMENT ON COLUMN gold.dim_date.day_of_month IS 'Day number within the month.';
COMMENT ON COLUMN gold.dim_date.iso_week IS 'ISO calendar week number.';
COMMENT ON COLUMN gold.dim_date.iso_day_of_week IS 'ISO day of the week (Monday = 1).';
COMMENT ON COLUMN gold.dim_date.is_month_start IS 'Whether this date is the first day of its month.';
COMMENT ON COLUMN gold.dim_date.is_month_end IS 'Whether this date is the last day of its month.';

-- dim_plant
COMMENT ON COLUMN gold.dim_plant.plant_id IS 'Identifier of the production plant.';
COMMENT ON COLUMN gold.dim_plant.plant_name IS 'Descriptive name of the plant.';
COMMENT ON COLUMN gold.dim_plant.plant_type IS 'Classification or type of plant.';
COMMENT ON COLUMN gold.dim_plant.active_flag IS 'Flag indicating whether the plant is active.';

-- dim_product
COMMENT ON COLUMN gold.dim_product.product_id IS 'Identifier of the pellet product.';
COMMENT ON COLUMN gold.dim_product.product_name IS 'Descriptive name of the pellet product.';
COMMENT ON COLUMN gold.dim_product.product_class IS 'Business classification of the pellet product.';
COMMENT ON COLUMN gold.dim_product.quality_class IS 'Quality classification of the pellet product.';
COMMENT ON COLUMN gold.dim_product.package_type IS 'Packaging format or type of the product.';
COMMENT ON COLUMN gold.dim_product.diameter_mm IS 'Nominal pellet diameter in millimetres.';
COMMENT ON COLUMN gold.dim_product.is_packaged IS 'Flag indicating whether the product is packaged.';
COMMENT ON COLUMN gold.dim_product.unit IS 'Unit of measure associated with the product.';
COMMENT ON COLUMN gold.dim_product.standard_cost_eur IS 'Reference standard cost in EUR; costing basis should be confirmed.';
COMMENT ON COLUMN gold.dim_product.sales_price_eur IS 'Reference sales price in EUR; pricing basis should be confirmed.';
COMMENT ON COLUMN gold.dim_product.active_flag IS 'Flag indicating whether the product is active.';

-- dim_raw
COMMENT ON COLUMN gold.dim_raw.raw_material_id IS 'Identifier of the raw material.';
COMMENT ON COLUMN gold.dim_raw.raw_material_name IS 'Descriptive name of the raw material.';
COMMENT ON COLUMN gold.dim_raw.raw_material_class IS 'Business classification of the raw material.';
COMMENT ON COLUMN gold.dim_raw.purchase_unit IS 'Unit of measure used for purchasing this raw material.';
COMMENT ON COLUMN gold.dim_raw.standard_cost_eur IS 'Reference standard cost in EUR; costing basis should be confirmed.';
COMMENT ON COLUMN gold.dim_raw.default_moisture_pct IS 'Default assumed moisture content of the raw material, expressed as a percentage.';
COMMENT ON COLUMN gold.dim_raw.active_flag IS 'Flag indicating whether the raw material is active.';

-- dim_supplier
COMMENT ON COLUMN gold.dim_supplier.supplier_id IS 'Identifier of the raw material supplier.';
COMMENT ON COLUMN gold.dim_supplier.supplier_name IS 'Descriptive name of the supplier.';

-- dim_version
COMMENT ON COLUMN gold.dim_version.version_id IS 'Identifier of the data or planning version.';
COMMENT ON COLUMN gold.dim_version.version_name IS 'Descriptive name of the data or planning version.';

-- fact_production
COMMENT ON COLUMN gold.fact_production.production_date IS 'Date of the production transaction; linked to the calendar dimension.';
COMMENT ON COLUMN gold.fact_production.production_number IS 'Source production document or transaction number.';
COMMENT ON COLUMN gold.fact_production.production_row_no IS 'Line number within the production document.';
COMMENT ON COLUMN gold.fact_production.plant_id IS 'Identifier of the plant where production was recorded.';
COMMENT ON COLUMN gold.fact_production.product_id IS 'Identifier of the product produced.';
COMMENT ON COLUMN gold.fact_production.quantity_t IS 'Recorded production quantity in metric tonnes.';
COMMENT ON COLUMN gold.fact_production.scrap_t IS 'Recorded production scrap quantity in metric tonnes.';
COMMENT ON COLUMN gold.fact_production.workcenter IS 'Work centre associated with the production transaction.';
COMMENT ON COLUMN gold.fact_production.version_id IS 'Identifier of the data version.';

-- fact_production_budget
COMMENT ON COLUMN gold.fact_production_budget.budget_date IS 'Date associated with the production budget period.';
COMMENT ON COLUMN gold.fact_production_budget.plant_id IS 'Identifier of the plant in the production budget.';
COMMENT ON COLUMN gold.fact_production_budget.product_id IS 'Identifier of the product in the production budget.';
COMMENT ON COLUMN gold.fact_production_budget.budget_t IS 'Budgeted production quantity in metric tonnes.';
COMMENT ON COLUMN gold.fact_production_budget.version_id IS 'Identifier of the budget or planning version.';

-- fact_purchase_invoice
COMMENT ON COLUMN gold.fact_purchase_invoice.purchase_date IS 'Date of the purchase invoice transaction.';
COMMENT ON COLUMN gold.fact_purchase_invoice.purchase_number IS 'Source purchase invoice or transaction number.';
COMMENT ON COLUMN gold.fact_purchase_invoice.purchase_row_no IS 'Line number within the purchase document.';
COMMENT ON COLUMN gold.fact_purchase_invoice.plant_id IS 'Identifier of the plant associated with the purchase.';
COMMENT ON COLUMN gold.fact_purchase_invoice.supplier_id IS 'Identifier of the raw material supplier.';
COMMENT ON COLUMN gold.fact_purchase_invoice.raw_material_id IS 'Identifier of the purchased raw material.';
COMMENT ON COLUMN gold.fact_purchase_invoice.quantity IS 'Recorded purchased quantity; unit is defined by the raw material purchasing unit.';
COMMENT ON COLUMN gold.fact_purchase_invoice.net_amount_eur IS 'Net purchase amount in EUR, excluding VAT.';
COMMENT ON COLUMN gold.fact_purchase_invoice.vat_amount_eur IS 'Value-added tax amount in EUR.';
COMMENT ON COLUMN gold.fact_purchase_invoice.version_id IS 'Identifier of the data version.';

-- fact_sales
COMMENT ON COLUMN gold.fact_sales.sales_date IS 'Date of the sales invoice transaction; linked to the calendar dimension.';
COMMENT ON COLUMN gold.fact_sales.invoice_number IS 'Source sales invoice number.';
COMMENT ON COLUMN gold.fact_sales.invoice_row_no IS 'Line number within the sales invoice.';
COMMENT ON COLUMN gold.fact_sales.plant_id IS 'Identifier of the plant associated with the sale.';
COMMENT ON COLUMN gold.fact_sales.product_id IS 'Identifier of the sold product.';
COMMENT ON COLUMN gold.fact_sales.customer_id IS 'Identifier of the customer.';
COMMENT ON COLUMN gold.fact_sales.channel_id IS 'Identifier of the sales channel.';
COMMENT ON COLUMN gold.fact_sales.quantity_t IS 'Recorded sales quantity in metric tonnes.';
COMMENT ON COLUMN gold.fact_sales.unit_price_eur IS 'Recorded unit sales price in EUR; unit basis should be confirmed.';
COMMENT ON COLUMN gold.fact_sales.discount_pct IS 'Recorded discount expressed as a percentage; storage scale should be confirmed.';
COMMENT ON COLUMN gold.fact_sales.net_sales_eur IS 'Net sales amount in EUR, excluding VAT.';
COMMENT ON COLUMN gold.fact_sales.currency IS 'Currency code recorded for the sale.';
COMMENT ON COLUMN gold.fact_sales.version_id IS 'Identifier of the data version.';

-- fact_sales_budget
COMMENT ON COLUMN gold.fact_sales_budget.budget_date IS 'Date associated with the sales budget period.';
COMMENT ON COLUMN gold.fact_sales_budget.plant_id IS 'Identifier of the plant in the sales budget.';
COMMENT ON COLUMN gold.fact_sales_budget.product_id IS 'Identifier of the product in the sales budget.';
COMMENT ON COLUMN gold.fact_sales_budget.channel_id IS 'Identifier of the sales channel in the budget.';
COMMENT ON COLUMN gold.fact_sales_budget.budget_t IS 'Budgeted sales quantity in metric tonnes.';
COMMENT ON COLUMN gold.fact_sales_budget.version_id IS 'Identifier of the budget or planning version.';

COMMIT;

-- Verification (expected: total_columns=87, documented_columns=87, missing_descriptions=0)
SELECT COUNT(*) AS total_columns,
       COUNT(col_description((quote_ident(table_schema) || '.' || quote_ident(table_name))::regclass, ordinal_position)) AS documented_columns,
       COUNT(*) - COUNT(col_description((quote_ident(table_schema) || '.' || quote_ident(table_name))::regclass, ordinal_position)) AS missing_descriptions
FROM information_schema.columns
WHERE table_schema = 'gold';
