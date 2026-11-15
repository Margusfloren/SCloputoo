"""
Export the aggregated demo dataset for the HTML portfolio from the PostgreSQL Gold layer.

Read-only. Exports ONLY monthly aggregates (year, month, plant, product, channel)
and dimension labels. No customer IDs, invoice numbers, prices or single transactions.

Connection uses standard libpq settings (PGHOST, PGPORT, PGUSER, PGPASSWORD or a
pgpass file). No credentials are written to any output file.

Usage:
    python export_demo_data.py            # writes ../data/demo-data.js and ../data/demo-data.json
"""
import datetime as dt
import getpass
import json
import os
import pathlib

import psycopg

OUT_DIR = pathlib.Path(__file__).resolve().parent.parent / "data"

SALES_SQL = """
WITH a AS (
    SELECT EXTRACT(YEAR FROM sales_date)::int AS y,
           EXTRACT(MONTH FROM sales_date)::int AS m,
           plant_id, product_id, channel_id,
           SUM(quantity_t) AS actual_t
    FROM gold.fact_sales
    GROUP BY 1, 2, 3, 4, 5
),
b AS (
    SELECT EXTRACT(YEAR FROM budget_date)::int AS y,
           EXTRACT(MONTH FROM budget_date)::int AS m,
           plant_id, product_id, channel_id,
           SUM(budget_t) AS budget_t
    FROM gold.fact_sales_budget
    GROUP BY 1, 2, 3, 4, 5
)
SELECT y, m, plant_id, product_id, channel_id,
       COALESCE(a.actual_t, 0) AS actual_t,
       COALESCE(b.budget_t, 0) AS budget_t
FROM a FULL OUTER JOIN b USING (y, m, plant_id, product_id, channel_id)
ORDER BY 1, 2, 3, 4, 5;
"""

PRODUCTION_SQL = """
WITH a AS (
    SELECT EXTRACT(YEAR FROM production_date)::int AS y,
           EXTRACT(MONTH FROM production_date)::int AS m,
           plant_id, product_id,
           SUM(quantity_t) AS actual_t
    FROM gold.fact_production
    GROUP BY 1, 2, 3, 4
),
b AS (
    SELECT EXTRACT(YEAR FROM budget_date)::int AS y,
           EXTRACT(MONTH FROM budget_date)::int AS m,
           plant_id, product_id,
           SUM(budget_t) AS budget_t
    FROM gold.fact_production_budget
    GROUP BY 1, 2, 3, 4
)
SELECT y, m, plant_id, product_id,
       COALESCE(a.actual_t, 0) AS actual_t,
       COALESCE(b.budget_t, 0) AS budget_t
FROM a FULL OUTER JOIN b USING (y, m, plant_id, product_id)
ORDER BY 1, 2, 3, 4;
"""

DIM_SQL = {
    "plants": "SELECT plant_id, plant_name FROM gold.dim_plant ORDER BY plant_id;",
    "products": "SELECT product_id, product_name FROM gold.dim_product ORDER BY product_id;",
    "channels": "SELECT channel_id, channel_name FROM gold.dim_channel ORDER BY channel_id;",
}

# Control query: grand totals straight from the fact tables, plus orphan-key counts
# (fact rows whose date/plant/product/channel has no dimension member).
CONTROL_SQL = """
SELECT 'sales_actual' AS k, SUM(quantity_t)::float8 FROM gold.fact_sales
UNION ALL SELECT 'sales_budget', SUM(budget_t)::float8 FROM gold.fact_sales_budget
UNION ALL SELECT 'production_actual', SUM(quantity_t)::float8 FROM gold.fact_production
UNION ALL SELECT 'production_budget', SUM(budget_t)::float8 FROM gold.fact_production_budget
UNION ALL SELECT 'orphans_sales', COUNT(*)::float8 FROM gold.fact_sales f
    WHERE NOT EXISTS (SELECT 1 FROM gold.dim_date d WHERE d.date = f.sales_date::date)
       OR NOT EXISTS (SELECT 1 FROM gold.dim_plant p WHERE p.plant_id = f.plant_id)
       OR NOT EXISTS (SELECT 1 FROM gold.dim_product p WHERE p.product_id = f.product_id)
       OR NOT EXISTS (SELECT 1 FROM gold.dim_channel c WHERE c.channel_id = f.channel_id)
UNION ALL SELECT 'orphans_sales_budget', COUNT(*)::float8 FROM gold.fact_sales_budget f
    WHERE NOT EXISTS (SELECT 1 FROM gold.dim_date d WHERE d.date = f.budget_date::date)
       OR NOT EXISTS (SELECT 1 FROM gold.dim_plant p WHERE p.plant_id = f.plant_id)
       OR NOT EXISTS (SELECT 1 FROM gold.dim_product p WHERE p.product_id = f.product_id)
       OR NOT EXISTS (SELECT 1 FROM gold.dim_channel c WHERE c.channel_id = f.channel_id)
UNION ALL SELECT 'orphans_production', COUNT(*)::float8 FROM gold.fact_production f
    WHERE NOT EXISTS (SELECT 1 FROM gold.dim_date d WHERE d.date = f.production_date::date)
       OR NOT EXISTS (SELECT 1 FROM gold.dim_plant p WHERE p.plant_id = f.plant_id)
       OR NOT EXISTS (SELECT 1 FROM gold.dim_product p WHERE p.product_id = f.product_id)
UNION ALL SELECT 'orphans_production_budget', COUNT(*)::float8 FROM gold.fact_production_budget f
    WHERE NOT EXISTS (SELECT 1 FROM gold.dim_date d WHERE d.date = f.budget_date::date)
       OR NOT EXISTS (SELECT 1 FROM gold.dim_plant p WHERE p.plant_id = f.plant_id)
       OR NOT EXISTS (SELECT 1 FROM gold.dim_product p WHERE p.product_id = f.product_id);
"""


def r(x):
    return round(float(x), 6)


def main():
    conninfo = os.environ.get("PELLET_DSN", "host=localhost dbname=pellet_sc")
    kwargs = {}
    if "PGUSER" not in os.environ and "user=" not in conninfo:
        kwargs["user"] = input("PostgreSQL user [postgres]: ").strip() or "postgres"
    if "PGPASSWORD" not in os.environ and "password=" not in conninfo:
        pw = getpass.getpass("PostgreSQL password (not stored; Enter = use pgpass): ")
        if pw:
            kwargs["password"] = pw
    with psycopg.connect(conninfo, **kwargs) as conn:
        conn.read_only = True
        cur = conn.cursor()

        cur.execute(SALES_SQL)
        sales = [[y, m, pl, pr, ch, r(a), r(b)] for y, m, pl, pr, ch, a, b in cur.fetchall()]
        cur.execute(PRODUCTION_SQL)
        production = [[y, m, pl, pr, r(a), r(b)] for y, m, pl, pr, a, b in cur.fetchall()]

        dims = {}
        for key, sql in DIM_SQL.items():
            cur.execute(sql)
            dims[key] = [list(row) for row in cur.fetchall()]

        cur.execute(CONTROL_SQL)
        control = {k: v for k, v in cur.fetchall()}

    # Same display rename as the Power BI Power Query step (gold dim_plant: "Tehas " -> "Plant ").
    dims["plants"] = [[pid, name.replace("Tehas ", "Plant ")] for pid, name in dims["plants"]]

    payload = {
        "meta": {
            "source": "PostgreSQL Gold layer (gold.fact_sales, gold.fact_sales_budget, "
                      "gold.fact_production, gold.fact_production_budget, gold dimensions)",
            "grain": "monthly aggregates; facts aggregated separately, joined on shared keys only",
            "unit": "metric tonnes (t)",
            "exported": dt.date.today().isoformat(),
            "synthetic": True,
        },
        "dims": dims,
        "salesColumns": ["year", "month", "plant_id", "product_id", "channel_id", "actual_t", "budget_t"],
        "sales": sales,
        "productionColumns": ["year", "month", "plant_id", "product_id", "actual_t", "budget_t"],
        "production": production,
        "control": control,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    (OUT_DIR / "demo-data.json").write_text(text, encoding="utf-8")
    (OUT_DIR / "demo-data.js").write_text(
        "/* Aggregated synthetic demo data exported from the PostgreSQL Gold layer. */\n"
        "window.PELLET_DATA = " + text + ";\n",
        encoding="utf-8",
    )

    s_a = sum(row[5] for row in sales)
    s_b = sum(row[6] for row in sales)
    p_a = sum(row[4] for row in production)
    p_b = sum(row[5] for row in production)
    print(f"sales rows={len(sales)} production rows={len(production)}")
    print(f"Sales actual {s_a:,.1f} budget {s_b:,.1f} attainment {100 * s_a / s_b:.2f}%")
    print(f"Production actual {p_a:,.1f} budget {p_b:,.1f} attainment {100 * p_a / p_b:.2f}%")
    print("control:", control)
    print("dims:", dims)


if __name__ == "__main__":
    main()
