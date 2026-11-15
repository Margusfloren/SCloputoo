/*
 * Self-test for the web demo. Open index.html?selftest=1 (or run headless, see tools/README.md).
 * Reference values come from the audited project documentation:
 *  - full-period control values (project brief / README)
 *  - sql/14_channel_plant_powerbi_reconciliation.md (B9: sales by channel, production by plant)
 *  - docs/images/*.png V1 screenshots (by product, by year, selected months; whole tonnes)
 */
(function () {
  "use strict";
  var D = window.PELLET_DATA, C = window.PelletCalc, A = window.PelletApp;
  var results = [];
  function check(name, ok, detail) { results.push({ name: name, pass: !!ok, detail: detail === undefined ? "" : detail }); }
  function near(a, b, tol) { return Math.abs(a - b) <= tol; }
  var F = C.emptyFilters;
  function f(over) { return Object.assign(F(), over || {}); }

  if (!D) {
    check("data file present", false, "data/demo-data.js missing");
    return finish();
  }

  // ---------- 1. control totals (tolerance 0.05 t = one-decimal precision)
  var k = C.kpis(D, F());
  check("Sales Actual 2,429,578.7 t", near(k.salesActual, 2429578.7, 0.05), k.salesActual.toFixed(3));
  check("Sales Budget 2,423,099.1 t", near(k.salesBudget, 2423099.1, 0.05), k.salesBudget.toFixed(3));
  check("Production Actual 2,406,082.3 t", near(k.productionActual, 2406082.3, 0.05), k.productionActual.toFixed(3));
  check("Production Budget 2,419,001.0 t", near(k.productionBudget, 2419001.0, 0.05), k.productionBudget.toFixed(3));
  check("Sales Attainment 100.27%", (k.salesAttainment * 100).toFixed(2) === "100.27", (k.salesAttainment * 100).toFixed(4));
  check("Production Attainment 99.47%", (k.productionAttainment * 100).toFixed(2) === "99.47", (k.productionAttainment * 100).toFixed(4));
  if (D.control) {
    check("export equals direct DB fact totals (sales actual)", near(k.salesActual, D.control.sales_actual, 0.001));
    check("export equals direct DB fact totals (sales budget)", near(k.salesBudget, D.control.sales_budget, 0.001));
    check("export equals direct DB fact totals (production actual)", near(k.productionActual, D.control.production_actual, 0.001));
    check("export equals direct DB fact totals (production budget)", near(k.productionBudget, D.control.production_budget, 0.001));
    ["orphans_sales", "orphans_sales_budget", "orphans_production", "orphans_production_budget"].forEach(function (o) {
      check("no orphan keys: " + o, D.control[o] === 0, D.control[o]);
    });
  }

  // ---------- 2. KPI card display strings (V1 Dashboard screenshot)
  var disp = [C.kpiDisplay(k.salesActual), C.kpiDisplay(k.salesBudget), C.kpiDisplay(k.salesVariance),
    C.kpiDisplay(k.productionActual), C.kpiDisplay(k.productionBudget), C.kpiDisplay(k.productionVariance)].join(" ");
  check("KPI display 2.43M 2.42M 6.48K 2.41M 2.42M -12.9K", disp === "2.43M 2.42M 6.48K 2.41M 2.42M -12.9K", disp);
  check("attainment colour bands", C.attainmentBand(1.0027) === "green" && C.attainmentBand(0.9947) === "green" &&
    C.attainmentBand(0.92) === "gold" && C.attainmentBand(0.85) === "red" && C.attainmentBand(1.07) === "gold" && C.attainmentBand(1.2) === "red");
  check("kpiDisplay formats", C.kpiDisplay(765000) === "765K" && C.kpiDisplay(5400) === "5.40K" && C.kpiDisplay(54000) === "54.0K" && C.kpiDisplay(0) === "0.00K");

  // ---------- 3. B9 reconciliation: sales by channel (one decimal) and production by plant
  var B9_CH = { B2B: [216172.7, 217161.9], DIST: [1520952.1, 1520998.0], IND: [638226.3, 629769.1], RET: [54227.6, 55170.1] };
  var byCh = C.aggSales(D, F(), { key: function (r, c) { return r[c.channel]; } });
  Object.keys(B9_CH).forEach(function (ch) {
    var o = byCh.get(ch) || { a: NaN, b: NaN };
    check("B9 channel " + ch + " actual/budget/attainment",
      near(o.a, B9_CH[ch][0], 0.05) && near(o.b, B9_CH[ch][1], 0.05) &&
      (100 * o.a / o.b).toFixed(2) === (100 * B9_CH[ch][0] / B9_CH[ch][1]).toFixed(2),
      o.a.toFixed(1) + " / " + o.b.toFixed(1));
    // the same numbers through the channel FILTER (budget filtered by channel as well)
    var kc = C.kpis(D, f({ channels: [ch] }));
    check("channel filter " + ch + " filters actual AND budget", near(kc.salesActual, o.a, 1e-6) && near(kc.salesBudget, o.b, 1e-6));
    check("channel filter " + ch + " does not change production", near(kc.productionActual, k.productionActual, 1e-6) && near(kc.productionBudget, k.productionBudget, 1e-6));
    var allCh = C.total(C.aggSales(D, f({ channels: [ch] }), { allChannels: true }));
    check("all-channel sales ignores channel filter (" + ch + ")", near(allCh.a, k.salesActual, 1e-6));
  });
  check("byChannel has exactly 4 members", byCh.size === 4, Array.from(byCh.keys()).join(","));
  var B9_PL = { "PLANT-A": [294164.3, 295000.4], "PLANT-B": [469209.9, 472000.5], "PLANT-C": [704109.5, 707999.4], "PLANT-D": [938598.6, 944000.7] };
  var byPl = C.aggProd(D, F(), { key: function (r, c) { return r[c.plant]; } });
  Object.keys(B9_PL).forEach(function (p) {
    var o = byPl.get(p) || { a: NaN, b: NaN };
    check("B9 plant " + p + " actual/budget", near(o.a, B9_PL[p][0], 0.05) && near(o.b, B9_PL[p][1], 0.05), o.a.toFixed(1) + " / " + o.b.toFixed(1));
  });

  // ---------- 4. screenshot values (whole tonnes, ±1 for display rounding)
  var nameToId = {};
  D.dims.products.forEach(function (p) { nameToId[p[1]] = p[0]; });
  var SALES_BY_PRODUCT = {
    "Industrial pellet Bulk 6 mm": [1380410, 1364028], "Industrial pellet Bulk 8 mm": [213166, 210395],
    "Premium pellet 15 kg 6 mm": [465628, 472800], "Premium pellet 15 kg 8 mm": [20441, 20685],
    "Premium pellet Big Bag 6 mm": [111650, 113472], "Premium pellet Big Bag 8 mm": [2921, 2955],
    "Premium pellet Bulk 6 mm": [235362, 238764]
  };
  var PROD_BY_PRODUCT = {
    "Industrial pellet Bulk 6 mm": [1353624, 1361720], "Industrial pellet Bulk 8 mm": [208677, 210041],
    "Premium pellet 15 kg 6 mm": [470257, 472000], "Premium pellet 15 kg 8 mm": [20566, 20650],
    "Premium pellet Big Bag 6 mm": [112828, 113280], "Premium pellet Big Bag 8 mm": [2940, 2950],
    "Premium pellet Bulk 6 mm": [237191, 238361]
  };
  var sp = C.aggSales(D, F(), { key: function (r, c) { return r[c.product]; } });
  var pp = C.aggProd(D, F(), { key: function (r, c) { return r[c.product]; } });
  Object.keys(SALES_BY_PRODUCT).forEach(function (n) {
    var o = sp.get(nameToId[n]) || { a: NaN, b: NaN }, e = SALES_BY_PRODUCT[n];
    check("screenshot sales " + n, near(o.a, e[0], 1) && near(o.b, e[1], 1), Math.round(o.a) + " / " + Math.round(o.b));
    var q = pp.get(nameToId[n]) || { a: NaN, b: NaN }, g = PROD_BY_PRODUCT[n];
    check("screenshot production " + n, near(q.a, g[0], 1) && near(q.b, g[1], 1), Math.round(q.a) + " / " + Math.round(q.b));
  });
  var YEARS = { 2023: [784671, 791300], 2024: [849908, 820000], 2025: [795000, 811800] };
  Object.keys(YEARS).forEach(function (y) {
    var t = C.total(C.aggSales(D, f({ years: [+y] })));
    check("screenshot sales year " + y, near(t.a, YEARS[y][0], 1) && near(t.b, YEARS[y][1], 1), Math.round(t.a) + " / " + Math.round(t.b));
  });
  var m1 = C.total(C.aggSales(D, f({ years: [2023], months: [1] })));
  check("screenshot sales Jan 2023 = 68,299 / 68,646", near(m1.a, 68299, 1) && near(m1.b, 68646, 1), Math.round(m1.a) + " / " + Math.round(m1.b));
  var m2 = C.total(C.aggSales(D, f({ years: [2025], months: [10] })));
  check("screenshot sales Oct 2025 = 74,932 / 81,592", near(m2.a, 74932, 1) && near(m2.b, 81592, 1), Math.round(m2.a) + " / " + Math.round(m2.b));
  var share = C.plantShare(D, F());
  var sh = ["PLANT-A", "PLANT-B", "PLANT-C", "PLANT-D"].map(function (p) { return Math.round(100 * share.get(p)); }).join(",");
  check("plant share 12,20,29,39 %", sh === "12,20,29,39", sh);
  var share2 = C.plantShare(D, f({ plants: ["PLANT-A", "PLANT-B"] }));
  check("plant share uses ALLSELECTED plants (A+B = 100%)", near(share2.get("PLANT-A") + share2.get("PLANT-B"), 1, 1e-9) && share2.size === 2);

  // ---------- 5. no double counting
  var sumCh = 0;
  D.dims.channels.forEach(function (c) { sumCh += C.kpis(D, f({ channels: [c[0]] })).salesActual; });
  check("sum of single-channel sales = total", near(sumCh, k.salesActual, 1e-6));
  var sumPl = 0;
  D.dims.plants.forEach(function (p) { sumPl += C.kpis(D, f({ plants: [p[0]] })).productionActual; });
  check("sum of single-plant production = total", near(sumPl, k.productionActual, 1e-6));
  var sumM = 0;
  for (var mm = 1; mm <= 12; mm++) sumM += C.kpis(D, f({ months: [mm] })).salesBudget;
  check("sum of monthly sales budget = total", near(sumM, k.salesBudget, 1e-6));

  // ---------- 6. UI behaviour
  function txt(sel) { var e = document.querySelector(sel); return e ? e.textContent.trim() : null; }
  function kpiText(page, key) { return txt("#page-" + page + ' [data-kpi="' + key + '"] .kpi-value'); }
  A.reset();
  A.navigate("overview");
  check("UI overview KPI cards", kpiText("overview", "salesActual") === "2.43M" && kpiText("overview", "salesAttainment") === "100.27%" &&
    kpiText("overview", "productionVariance") === "-12.9K" && kpiText("overview", "productionAttainment") === "99.47%",
    [kpiText("overview", "salesActual"), kpiText("overview", "salesAttainment"), kpiText("overview", "productionVariance"), kpiText("overview", "productionAttainment")].join(" "));
  check("UI overview attainment colour green", document.querySelector('#page-overview [data-kpi="salesAttainment"] .kpi-value').getAttribute("data-band") === "green");
  check("UI sales view total row", txt('#page-overview [data-table="salesView"] tfoot td') === "2,429,579");
  var pvsTotal = txt('#page-overview [data-table="pvs"] tfoot td:nth-child(3)');
  check("UI production vs sales total (all channels)", pvsTotal === "2,429,579", pvsTotal);
  check("UI overview charts drawn", document.querySelectorAll('#page-overview [data-chart="sales"] rect').length > 36 &&
    document.querySelectorAll('#page-overview [data-chart="prod"] rect').length > 36);

  A.setFilter("channels", ["RET"]);
  check("UI channel filter changes sales KPI", kpiText("overview", "salesActual") === C.kpiDisplay(C.kpis(D, f({ channels: ["RET"] })).salesActual), kpiText("overview", "salesActual"));
  check("UI channel filter keeps production KPI", kpiText("overview", "productionActual") === "2.41M");
  check("UI channel filter: PvS table still all channels", txt('#page-overview [data-table="pvs"] tfoot td:nth-child(3)') === "2,429,579");
  A.setSel("compare", "Sales");
  check("UI compare=Sales title", txt('#page-overview [data-title="prod"]') === "Production Actual vs Sales");
  var legend = txt('#page-overview [data-chart="prod"] .legend');
  check("UI compare=Sales uses all-channel sales", /all channels/.test(legend), legend);

  A.navigate("sales");
  check("UI filter context kept across pages", kpiText("sales", "salesActual") === kpiText("overview", "salesActual"));
  var chBtn = Array.prototype.filter.call(document.querySelectorAll("#page-sales .slicer"), function (s) { return /Channel/.test(s.querySelector(".slicer-label").textContent); })[0];
  check("UI channel slicer shows selection on sales page", chBtn && chBtn.querySelector(".slicer-val").textContent !== "All", chBtn && chBtn.querySelector(".slicer-val").textContent);
  A.setSel("salesView", "Channel");
  check("UI sales view selector = Channel shows 1 row (RET)", document.querySelectorAll('#page-sales [data-table="view"] tbody tr').length === 1);
  A.setSel("salesKpis", ["Sales Actual", "Sales Attainment"]);
  check("UI sales KPI selector limits columns", document.querySelectorAll('#page-sales [data-table="view"] thead th').length === 3);
  check("UI sales combo has attainment line", !!document.querySelector('#page-sales [data-chart="combo"] path'));

  A.navigate("production");
  check("UI production page ignores channel", kpiText("production", "productionActual") === "2.41M" && /does not apply/.test(txt('#page-production [data-note="channel"]')));
  var m2t = Array.prototype.map.call(document.querySelectorAll('#page-production [data-table="m2"] tfoot tr'), function (r) { return r.lastElementChild.textContent; });
  check("UI production vs sales matrix uses all channels", m2t[1] === "2,429,579", m2t.join(" | "));

  A.navigate("plant");
  A.setFilter("plants", ["PLANT-A"]);
  check("UI plant tile filter", kpiText("plant", "productionActual") === C.kpiDisplay(294164.3), kpiText("plant", "productionActual"));
  check("UI plant share 100% for single plant", /100%/.test(txt('#page-plant [data-chart="share"]')));
  check("UI plant mix drawn", document.querySelectorAll('#page-plant [data-chart="mix"] rect').length >= 2);

  A.navigate("product");
  check("UI product page keeps plant filter", kpiText("product", "productionActual") === kpiText("plant", "productionActual"));

  A.reset();
  check("UI reset clears filters and selectors", JSON.stringify(A.state.f) === JSON.stringify(F()) && A.state.sel.compare === "Budget" && A.state.sel.salesView === "Product");
  check("UI reset restores KPIs", kpiText("product", "productionActual") === "2.41M");
  A.navigate("overview");
  check("UI overview after reset", kpiText("overview", "salesActual") === "2.43M" && txt('#page-overview [data-title="prod"]') === "Production Actual vs Budget");

  A.setFilter("years", [2024]); A.setFilter("months", [7]);
  var k7 = C.kpis(D, f({ years: [2024], months: [7] }));
  check("UI year+month filter", kpiText("overview", "salesActual") === C.kpiDisplay(k7.salesActual), kpiText("overview", "salesActual") + " vs " + C.kpiDisplay(k7.salesActual));
  check("UI single month → one chart category", document.querySelectorAll('#page-overview [data-chart="sales"] svg > rect[fill="transparent"]').length === 1);
  A.reset();

  finish();

  function finish() {
    var failed = results.filter(function (r) { return !r.pass; });
    var pre = document.createElement("pre");
    pre.id = "selftest-out";
    pre.style.cssText = "position:fixed;inset:auto 0 0 0;max-height:45vh;overflow:auto;background:#fff;border-top:3px solid " + (failed.length ? "#C00000" : "#A8C9A0") + ";margin:0;padding:10px;font-size:11px;z-index:99";
    pre.textContent = "SELFTEST " + (failed.length ? "FAILED" : "PASSED") + " – " + (results.length - failed.length) + "/" + results.length + "\n" +
      results.map(function (r) { return (r.pass ? "PASS " : "FAIL ") + r.name + (r.detail !== "" ? "  [" + r.detail + "]" : ""); }).join("\n");
    document.body.appendChild(pre);
    document.title = "SELFTEST " + (failed.length ? "FAILED" : "PASSED");
  }
})();
