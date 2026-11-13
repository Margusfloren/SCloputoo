# V1 KPIs

V1 is a management view of pellet sales and production performance, using synthetic data for 2023–2025.

## Sales

- **Sales Actual, t** – actual sales volume.
- **Sales Budget, t** – budgeted sales volume.
- **Sales Variance, t** – Sales Actual − Sales Budget.
- **Sales Attainment, %** – Sales Actual / Sales Budget (where the budget allows the ratio to be calculated).

Sales and the sales budget can also be analysed **by sales channel**, because the budget is allocated to channels and the `dim_channel` dimension is used for filtering.

## Production

- **Production Actual, t** – actual production volume.
- **Production Budget, t** – budgeted production volume.
- **Production Variance, t** – Production Actual − Production Budget.
- **Production Attainment, %** – Production Actual / Production Budget (where the budget allows the ratio to be calculated).

No sales channel is assigned to production.

## Production and sales balance

- **Production vs Sales, t** – Production Actual − Sales Actual.
- **Production vs Sales, %** – Production Actual / Sales Actual (where the sales volume allows the ratio to be calculated).

The balance comparison on the V1 Dashboard and QA Validation pages uses **sales from all channels**, regardless of the selected sales channel. This measure **is not an inventory measure**: an accurate inventory analysis also requires opening stock and other stock movements.

## Views and filters

V1 includes selected-period measures, Actual vs Budget comparisons, variances, and year, month, plant and product filters. The sales-channel filter affects the sales analysis, not the allocation of production volume.

## V1 limitation

**OTIF (On-Time In-Full) is not implemented in V1.** Analysis of on-time and in-full order fulfilment is planned for V2.
