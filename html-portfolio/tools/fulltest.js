/*
 * Extended functional test for the web demo (index.html?fulltest=1).
 * Unlike selftest.js it drives the real DOM controls (slicer checkboxes, tabs, tiles,
 * buttons) and reads the rendered tables and chart tooltips.
 * Reference values: sql/14_channel_plant_powerbi_reconciliation.md (B9) and the V1 screenshots.
 */
(function () {
  "use strict";
  var D = window.PELLET_DATA, C = window.PelletCalc, A = window.PelletApp;
  var results = [];
  var section = "";
  function check(name, ok, detail) { results.push({ s: section, name: name, pass: !!ok, detail: detail === undefined ? "" : String(detail) }); }
  function near(a, b, tol) { return Math.abs(a - b) <= tol; }
  function f(over) { return Object.assign(C.emptyFilters(), over || {}); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms || 30); }); }
  function q(sel) { return document.querySelector(sel); }
  function qa(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function txt(sel) { var e = q(sel); return e ? e.textContent.trim() : null; }
  function num(s) { return parseFloat(String(s).replace(/[^0-9.\-]/g, "")); }
  // same display rule as the app: 0.1 t source precision, then round half up
  function fmtT(v) { var r = Math.round(C.denoise(v)); if (r === 0) r = 0; return r.toLocaleString("en-US"); }
  function fmtPct(v) { return v === null ? "" : (v * 100).toFixed(2) + "%"; }
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // ---------- DOM drivers ----------
  async function go(page) {
    q('[data-tab="' + page + '"]').click();
    await wait(60);
    return !q("#page-" + page).hidden;
  }
  function slicer(page, label) {
    return qa("#page-" + page + " .slicer").filter(function (s) {
      var l = s.querySelector(".slicer-label");
      return l && l.textContent.trim() === label;
    })[0];
  }
  async function pick(page, label, optionLabels) {
    var s = slicer(page, label);
    s.querySelector(".slicer-btn").click();
    await wait();
    optionLabels.forEach(function (ol) {
      var lab = Array.prototype.filter.call(s.querySelectorAll(".opt"), function (o) { return o.textContent.trim() === ol; })[0];
      var inp = lab.querySelector("input");
      inp.checked = !inp.checked;
      inp.dispatchEvent(new Event("change", { bubbles: true }));
    });
    document.body.click();
    await wait();
  }
  function slicerValue(page, label) { var s = slicer(page, label); return s ? s.querySelector(".slicer-val").textContent : null; }
  async function reset(page) { q("#page-" + page + " .reset-btn").click(); await wait(); }
  function kpi(page, key) { return txt("#page-" + page + ' [data-kpi="' + key + '"] .kpi-value'); }
  function expectCards(page, k, keys) {
    var bad = [];
    keys.forEach(function (key) {
      var exp = /Attainment/.test(key) ? (k[key] === null ? "(Blank)" : fmtPct(k[key])) : C.kpiDisplay(k[key]);
      var got = kpi(page, key);
      if (got !== exp) bad.push(key + ": got " + got + " expected " + exp);
    });
    return bad;
  }
  var SALES_K = ["salesActual", "salesBudget", "salesVariance", "salesAttainment"];
  var PROD_K = ["productionActual", "productionBudget", "productionVariance", "productionAttainment"];

  function hover(el) {
    var r = el.getBoundingClientRect();
    el.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: r.left + 1, clientY: r.top + 1 }));
    var t = q(".chart-tip");
    var o = { title: t.querySelector(".tip-title").textContent };
    t.querySelectorAll(".tip-row").forEach(function (rw) { o[rw.querySelector(".tip-name").textContent] = rw.querySelector(".tip-val").textContent; });
    el.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
    return o;
  }
  function tips(page, chart) {
    return qa("#page-" + page + ' [data-chart="' + chart + '"] svg rect[fill="transparent"]').map(hover);
  }
  function tableData(page, table) {
    var t = q("#page-" + page + ' [data-table="' + table + '"] table');
    if (!t) return null;
    var head = Array.prototype.map.call(t.querySelectorAll("thead th"), function (th) { return th.textContent.trim(); });
    var rows = Array.prototype.map.call(t.querySelectorAll("tbody tr"), function (tr) {
      return Array.prototype.map.call(tr.children, function (c) { return c.textContent.trim(); });
    });
    var foot = Array.prototype.map.call(t.querySelectorAll("tfoot tr"), function (tr) {
      return Array.prototype.map.call(tr.children, function (c) { return c.textContent.trim(); });
    });
    return { head: head, rows: rows, foot: foot, el: t };
  }
  function pageText(page) { return q("#page-" + page).textContent; }
  function noBadText(page) { return !/NaN|Infinity|undefined|null/.test(pageText(page)); }

  var name = {};
  D.dims.plants.forEach(function (p) { name[p[0]] = p[1]; });
  D.dims.products.forEach(function (p) { name[p[0]] = p[1]; });
  D.dims.channels.forEach(function (c) { name[c[0]] = c[1]; });

  run().catch(function (e) { check("test harness error", false, e && e.stack || e); }).then(finish);

  async function run() {
    A.reset();
    var K0 = C.kpis(D, C.emptyFilters());

    // ======================= N. numeric checks
    section = "N";
    check("Sales Variance = 6,479.6 t", near(K0.salesVariance, 6479.6, 0.05), K0.salesVariance.toFixed(3));
    check("Production Variance = -12,918.7 t", near(K0.productionVariance, -12918.7, 0.05), K0.productionVariance.toFixed(3));
    check("Sales Attainment exact = actual/budget", K0.salesAttainment === 2429578.7 / 2423099.1 || near(K0.salesAttainment, 2429578.7 / 2423099.1, 1e-9), K0.salesAttainment);
    check("Production Attainment exact", near(K0.productionAttainment, 2406082.3 / 2419001.0, 1e-9), K0.productionAttainment);
    check("attainment with zero budget is BLANK (null), not Infinity/NaN", C.attainment(10, 0) === null && C.attainment(0, 0) === null && C.ratio(5, 0) === null);
    check("kpiDisplay of 0 = 0.00K (COALESCE to 0 as in DAX)", C.kpiDisplay(0) === "0.00K");
    check("kpiDisplay negative small", C.kpiDisplay(-989.2) === "-0.99K" && C.kpiDisplay(-12918.7) === "-12.9K" && C.kpiDisplay(-0.2) === "0.00K", [C.kpiDisplay(-989.2), C.kpiDisplay(-0.2)].join(" "));
    check("kpiDisplay M boundary", C.kpiDisplay(1000000) === "1.00M" && C.kpiDisplay(2429578.7) === "2.43M");

    var B9C = { B2B: [216172.7, 217161.9, -989.2, "99.54"], DIST: [1520952.1, 1520998.0, -45.9, "100.00"], IND: [638226.3, 629769.1, 8457.2, "101.34"], RET: [54227.6, 55170.1, -942.5, "98.29"] };
    var sumA = 0, sumB = 0;
    Object.keys(B9C).forEach(function (ch) {
      var t = C.total(C.aggSales(D, f({ channels: [ch] }))), e = B9C[ch];
      sumA += t.a; sumB += t.b;
      check("B9 " + ch + " actual/budget/variance/attainment",
        near(t.a, e[0], 0.05) && near(t.b, e[1], 0.05) && near(t.a - t.b, e[2], 0.06) && (100 * t.a / t.b).toFixed(2) === e[3],
        t.a.toFixed(2) + " / " + t.b.toFixed(2) + " / " + (t.a - t.b).toFixed(2) + " / " + (100 * t.a / t.b).toFixed(2));
    });
    check("B9 channel sums = total sales", near(sumA, K0.salesActual, 1e-6) && near(sumB, K0.salesBudget, 1e-6));
    var other = C.total(C.aggSales(D, f({ channels: ["OTHER"] })));
    check("channel OTHER exists in dimension but has no actual/budget rows", name.OTHER === "Other" && other.n === 0 && other.a === 0 && other.b === 0, JSON.stringify(other));
    var B9P = { "PLANT-A": [294164.3, 295000.4, -836.1, "99.72"], "PLANT-B": [469209.9, 472000.5, -2790.6, "99.41"], "PLANT-C": [704109.5, 707999.4, -3889.9, "99.45"], "PLANT-D": [938598.6, 944000.7, -5402.1, "99.43"] };
    var pA = 0, pB = 0;
    Object.keys(B9P).forEach(function (p) {
      var t = C.total(C.aggProd(D, f({ plants: [p] }))), e = B9P[p];
      pA += t.a; pB += t.b;
      check("B9 " + p + " actual/budget/variance/attainment",
        near(t.a, e[0], 0.05) && near(t.b, e[1], 0.05) && near(t.a - t.b, e[2], 0.06) && (100 * t.a / t.b).toFixed(2) === e[3],
        t.a.toFixed(2) + " / " + t.b.toFixed(2) + " / " + (t.a - t.b).toFixed(2) + " / " + (100 * t.a / t.b).toFixed(2));
    });
    check("B9 plant sums = total production", near(pA, K0.productionActual, 1e-6) && near(pB, K0.productionBudget, 1e-6));

    // ======================= T. rendered tables vs Power BI displayed values (B9)
    section = "T";
    await go("sales");
    await pick("sales", "Sales View Selector", ["Channel"]);
    var tv = tableData("sales", "view");
    var PBI_CH = {
      "Direct B2B": ["216,173", "217,162", "-989", "99.54%"], "Distributor / Trader": ["1,520,952", "1,520,998", "-46", "100.00%"],
      "Industrial / Utility": ["638,226", "629,769", "8,457", "101.34%"], "Retail / E-shop": ["54,228", "55,170", "-942", "98.29%"]
    };
    check("Sales View (Channel) has 4 rows, no 'Other'", tv.rows.length === 4 && !tv.rows.some(function (r) { return r[0] === "Other"; }), tv.rows.map(function (r) { return r[0]; }).join(", "));
    tv.rows.forEach(function (r) {
      var e = PBI_CH[r[0]];
      check("Sales View row " + r[0] + " = Power BI B9 display", e && r.slice(1).join("|") === e.join("|"), r.slice(1).join(" | "));
    });
    check("Sales View (Channel) total = 2,429,579 | 2,423,099 | 6,480 | 100.27%", tv.foot[0].slice(1).join("|") === "2,429,579|2,423,099|6,480|100.27%", tv.foot[0].join(" | "));
    var bars = tips("sales", "byView");
    check("Sales by Selected View bars = 4 channels sorted by actual desc", bars.length === 4 && bars.every(function (b, i) { return i === 0 || num(bars[i - 1]["Sales Actual Selected Period"]) >= num(b["Sales Actual Selected Period"]); }), bars.map(function (b) { return b.title; }).join(", "));
    await reset("sales");

    await go("plant");
    var tp = tableData("plant", "perf");
    var PBI_PL = {
      "Plant A": ["294,164", "295,000", "-836", "99.72%"], "Plant B": ["469,210", "472,001", "-2,791", "99.41%"],
      "Plant C": ["704,110", "707,999", "-3,890", "99.45%"], "Plant D": ["938,599", "944,001", "-5,402", "99.43%"]
    };
    tp.rows.forEach(function (r) { check("Plant table row " + r[0] + " = Power BI B9 display", r.slice(1).join("|") === (PBI_PL[r[0]] || []).join("|"), r.slice(1).join(" | ")); });
    check("Plant table total = 2,406,082 | 2,419,001 | -12,919 | 99.47%", tp.foot[0].slice(1).join("|") === "2,406,082|2,419,001|-12,919|99.47%", tp.foot[0].join(" | "));
    check("Plant table attainment not red (as PBIR visual 633a70)", !qa('#page-plant [data-table="perf"] td.neg').some(function (td) { return /%/.test(td.textContent); }));

    // ======================= A. Test A – Plant B via DOM
    section = "A";
    await go("overview");
    await pick("overview", "Plant", ["Plant B"]);
    var KB = C.kpis(D, f({ plants: ["PLANT-B"] }));
    var bad = expectCards("overview", KB, SALES_K.concat(PROD_K));
    check("A1 Overview slicer shows 'Plant B'", slicerValue("overview", "Plant") === "Plant B", slicerValue("overview", "Plant"));
    check("A2 Overview 8 KPI cards = Plant B context", bad.length === 0, bad.join("; ") || [kpi("overview", "salesActual"), kpi("overview", "productionActual")].join(" "));
    check("A2b Plant B production = B9 469,209.9 t", near(KB.productionActual, 469209.9, 0.05));
    check("A3 navigation tab Sales Analysis works", await go("sales"));
    check("A3 Sales page keeps Plant B", slicerValue("sales", "Plant") === "Plant B" && expectCards("sales", KB, SALES_K).length === 0, kpi("sales", "salesActual"));
    await go("production");
    check("A4 Production page keeps Plant B", slicerValue("production", "Plant") === "Plant B" && expectCards("production", KB, PROD_K).length === 0, kpi("production", "productionActual"));
    await go("plant");
    var tilesOn = qa("#page-plant .tile-row button.on").map(function (b) { return b.textContent; });
    check("A4 Plant page tile 'Plant B' active", tilesOn.join(",") === "Plant B", tilesOn.join(","));
    check("A4 Plant page KPI = Plant B", expectCards("plant", KB, PROD_K).length === 0);
    var tpb = tableData("plant", "perf");
    check("A5 Plant table shows only Plant B, total = KPI", tpb.rows.length === 1 && tpb.rows[0][0] === "Plant B" && tpb.foot[0][1] === fmtT(KB.productionActual));
    check("A5 Share % chart: Plant B = 100% (ALLSELECTED)", /100%/.test(txt('#page-plant [data-chart="share"]')));
    await reset("plant");
    check("A6 Reset restores Plant = All and totals", A.state.f.plants.length === 0 && qa("#page-plant .tile-row button.on").map(function (b) { return b.textContent; }).join() === "Select all" && expectCards("plant", K0, PROD_K).length === 0);
    await go("overview");
    check("A6 Overview after reset = full period", expectCards("overview", K0, SALES_K.concat(PROD_K)).length === 0 && slicerValue("overview", "Plant") === "All");

    // ======================= B. Test B – channel B2B on Sales Analysis
    section = "B";
    await go("sales");
    await pick("sales", "Channel", ["Direct B2B"]);
    var KC = C.kpis(D, f({ channels: ["B2B"] }));
    check("B1 Sales cards = B2B (216K / 217K / -0.99K / 99.54%)",
      [kpi("sales", "salesActual"), kpi("sales", "salesBudget"), kpi("sales", "salesVariance"), kpi("sales", "salesAttainment")].join(" ") === "216K 217K -0.99K 99.54%",
      [kpi("sales", "salesActual"), kpi("sales", "salesBudget"), kpi("sales", "salesVariance"), kpi("sales", "salesAttainment")].join(" "));
    check("B2 B2B budget also filtered (217,161.9 t, not total budget)", near(KC.salesBudget, 217161.9, 0.05));
    var mt = tableData("sales", "matrix");
    check("B2 Sales matrix grand total = B2B actual/budget/variance", mt.foot.map(function (r) { return r[r.length - 1]; }).join("|") === [fmtT(KC.salesActual), fmtT(KC.salesBudget), fmtT(KC.salesVariance)].join("|"), mt.foot.map(function (r) { return r[r.length - 1]; }).join("|"));
    var st = tips("sales", "combo");
    var sumTip = st.reduce(function (s, t) { return s + num(t["Sales Actual"]); }, 0);
    check("B2 Sales chart tooltips sum ≈ B2B actual (±0.5 t per month)", near(sumTip, KC.salesActual, st.length * 0.5), sumTip + " vs " + KC.salesActual.toFixed(1));
    check("B3 Production unaffected by channel (calc)", KC.productionActual === K0.productionActual && KC.productionBudget === K0.productionBudget);
    await go("overview");
    check("B3 Overview: channel kept, sales = B2B, production = full", slicerValue("overview", "Channel") === "Direct B2B" &&
      expectCards("overview", KC, SALES_K).length === 0 && expectCards("overview", K0, PROD_K).length === 0);
    var pvs = tableData("overview", "pvs");
    check("B4 Rule 2: PvS by Product table uses ALL channels (sales total 2,429,579)", pvs.foot[0][2] === "2,429,579" && pvs.foot[0][3] === "-23,496" && pvs.foot[0][4] === "99.03%", pvs.foot[0].join(" | "));
    var sv = tableData("overview", "salesView");
    check("B4 Sales View on Overview is channel-filtered", sv.foot[0][1] === fmtT(KC.salesActual) && sv.foot[0][2] === fmtT(KC.salesBudget));
    qa('#page-overview .compare button').filter(function (b) { return b.textContent === "Sales"; })[0].click();
    await wait();
    check("B5 Compare toggle → title 'Production Actual vs Sales'", txt('#page-overview [data-title="prod"]') === "Production Actual vs Sales");
    var ct = tips("overview", "prod");
    var allM = C.aggSales(D, C.emptyFilters(), { key: function (r, c) { return r[c.y] * 100 + r[c.m]; }, allChannels: true });
    var keys = Array.from(allM.keys()).sort(function (a, b) { return a - b; });
    var okAll = ct.length === keys.length && ct.every(function (t, i) { return t["Sales Actual (all channels)"] === fmtT(allM.get(keys[i]).a) + " t"; });
    check("B5 Rule 2: Overview compare=Sales uses all-channel sales per month (B2B selected)", okAll, ct[0] && ct[0]["Sales Actual (all channels)"]);
    await go("production");
    var m2 = tableData("production", "m2");
    check("B6 Rule 2: Production page PvS matrix = all channels", m2.foot[1][m2.foot[1].length - 1] === "2,429,579", m2.foot[1].join(" "));
    var pvsT = tips("production", "pvs");
    check("B6 Production vs Sales chart (36 months) all channels", pvsT.length === 36 && near(pvsT.reduce(function (s, t) { return s + num(t["Sales Actual"]); }, 0), K0.salesActual, 18));
    await go("product");
    var ppT = tips("product", "ps");
    check("B7 Rule 2: Product page PvS chart = all channels", near(ppT.reduce(function (s, t) { return s + num(t["Sales Actual"]); }, 0), K0.salesActual, 4), ppT.length + " products");
    check("B8 Channel note shown on production pages", /does not apply/.test(txt('#page-product [data-note="channel"]')));
    await reset("product");
    check("B9 Reset clears channel", A.state.f.channels.length === 0);

    // ======================= C. combination Year 2024 + Plant C + one product
    section = "C";
    await go("overview");
    await pick("overview", "Year", ["2024"]);
    await pick("overview", "Plant", ["Plant C"]);
    await pick("overview", "Product", ["Industrial pellet Bulk 6 mm"]);
    var FC = f({ years: [2024], plants: ["PLANT-C"], products: ["IB06"] });
    var K3 = C.kpis(D, FC);
    check("C0 combination has data", K3.salesActual > 0 && K3.productionActual > 0, K3.salesActual.toFixed(1) + " / " + K3.productionActual.toFixed(1));
    check("C1 Overview KPI cards", expectCards("overview", K3, SALES_K.concat(PROD_K)).length === 0);
    var t1 = tips("overview", "sales");
    check("C2 Overview sales chart = 12 months Jan→Dec 2024 in order", t1.map(function (t) { return t.title; }).join(",") === MONTHS.map(function (m) { return m + " 2024"; }).join(","), t1.length);
    check("C2 Sales chart tooltips sum = Sales Actual KPI (±0.5 t/bar)", near(t1.reduce(function (s, t) { return s + num(t["Sales Actual"]); }, 0), K3.salesActual, 6));
    check("C2 Sales chart tooltips sum = Sales Budget (±0.5 t/bar)", near(t1.reduce(function (s, t) { return s + num(t["Sales Budget"]); }, 0), K3.salesBudget, 6));
    check("C2 tooltip unit 't' and attainment %", / t$/.test(t1[0]["Sales Actual"]) && /%$/.test(t1[0]["Attainment"]), JSON.stringify(t1[0]));
    var t2 = tips("overview", "prod");
    check("C3 Production chart sum = Production KPI", near(t2.reduce(function (s, t) { return s + num(t["Production Actual"]); }, 0), K3.productionActual, 6) && near(t2.reduce(function (s, t) { return s + num(t["Budget"]); }, 0), K3.productionBudget, 6));
    var svC = tableData("overview", "salesView"), pvC = tableData("overview", "prodView"), psC = tableData("overview", "pvs");
    check("C4 Sales View: 1 product row, total = KPI", svC.rows.length === 1 && svC.foot[0][1] === fmtT(K3.salesActual) && svC.foot[0][4] === fmtPct(K3.salesAttainment));
    check("C4 Production View total = KPI", pvC.foot[0][1] === fmtT(K3.productionActual) && pvC.foot[0][2] === fmtT(K3.productionBudget));
    check("C4 PvS table = KPI production vs all-channel sales", psC.foot[0][1] === fmtT(K3.productionActual) && psC.foot[0][2] === fmtT(K3.salesActual));
    await go("sales");
    check("C5 Sales page same context", expectCards("sales", K3, SALES_K).length === 0 && slicerValue("sales", "Year") === "2024" && slicerValue("sales", "Product") === "Industrial pellet Bulk 6 mm");
    var mtC = tableData("sales", "matrix");
    check("C5 Sales matrix: only 2024, totals = KPI", mtC.rows.filter(function (r) { return /^\d{4}$/.test(r[0]); }).map(function (r) { return r[0]; }).join() === "2024" &&
      mtC.foot[0][mtC.foot[0].length - 1] === fmtT(K3.salesActual));
    var bv = tips("sales", "byView");
    check("C5 Sales by view bars = 1 product, value = KPI", bv.length === 1 && bv[0]["Sales Actual Selected Period"] === fmtT(K3.salesActual) + " t");
    await go("production");
    var m1C = tableData("production", "m1"), m2C = tableData("production", "m2");
    check("C6 Production matrices totals = KPI", m1C.foot[0][m1C.foot[0].length - 1] === fmtT(K3.productionActual) && m1C.foot[1][m1C.foot[1].length - 1] === fmtT(K3.productionBudget) &&
      m2C.foot[1][m2C.foot[1].length - 1] === fmtT(K3.salesActual));
    var combo = tips("production", "combo");
    var pmC = C.aggProd(D, FC, { key: function (r, c) { return r[c.y] * 100 + r[c.m]; } });
    var pmK = Array.from(pmC.keys()).sort(function (a, b) { return a - b; });
    check("C6 Production attainment tooltips = exact Actual/Budget per month", combo.length === 12 && combo.every(function (t, i) {
      var o = pmC.get(pmK[i]);
      return t["Production Attainment %"] === fmtPct(C.attainment(o.a, o.b)) && t["Production Actual"] === fmtT(o.a) + " t";
    }), combo[0] && combo[0]["Production Attainment %"]);
    await go("plant");
    var tC = tableData("plant", "perf");
    check("C7 Plant page: Plant C tile, table total = KPI", qa("#page-plant .tile-row button.on").map(function (b) { return b.textContent; }).join() === "Plant C" && tC.foot[0][1] === fmtT(K3.productionActual));
    var mixR = qa('#page-plant [data-chart="mix"] svg rect').map(hover);
    check("C7 Mix: single product = 100% of Plant C", mixR.length === 1 && mixR[0]["Share of plant output"] === "100.00%", mixR.map(function (m) { return m.title; }).join());
    await go("product");
    check("C8 Product page same context", expectCards("product", K3, PROD_K).length === 0);
    await go("overview");
    check("C9 back on Overview filters persisted", slicerValue("overview", "Year") === "2024" && slicerValue("overview", "Plant") === "Plant C" && expectCards("overview", K3, SALES_K.concat(PROD_K)).length === 0);

    // ======================= D. Reset with filters + selectors
    section = "D";
    await pick("overview", "Month", ["March", "April"]);
    await pick("overview", "Channel", ["Retail / E-shop"]);
    await pick("overview", "Production View Selector", ["Plant"]);
    await pick("overview", "Production KPI Selector", ["Production Actual"]);
    qa('#page-overview .compare button').filter(function (b) { return b.textContent === "Sales"; })[0].click();
    await wait();
    check("D0 Month slicer multi-select label", slicerValue("overview", "Month") === "Multiple selections");
    check("D0 Production View selector → Plant rows", tableData("overview", "prodView").head[0] === "Plant");
    check("D0 Production KPI selector → 1 measure column", tableData("overview", "prodView").head.length === 2, tableData("overview", "prodView").head.join());
    await reset("overview");
    var labels = ["Year", "Month", "Plant", "Product", "Channel"].map(function (l) { return slicerValue("overview", l); });
    check("D1 all slicers show All", labels.join() === "All,All,All,All,All", labels.join());
    check("D2 selectors back to default", tableData("overview", "prodView").head.join("|") === "Product|Production Actual|Production Budget|Production Variance|Production Attainment" &&
      txt('#page-overview [data-title="prod"]') === "Production Actual vs Budget" && slicerValue("overview", "Production View Selector") === "Product" && slicerValue("overview", "Production KPI Selector") === "All");
    check("D3 KPIs = full period control values", [kpi("overview", "salesActual"), kpi("overview", "salesBudget"), kpi("overview", "salesVariance"), kpi("overview", "salesAttainment"),
      kpi("overview", "productionActual"), kpi("overview", "productionBudget"), kpi("overview", "productionVariance"), kpi("overview", "productionAttainment")].join(" ") === "2.43M 2.42M 6.48K 100.27% 2.41M 2.42M -12.9K 99.47%");
    await go("sales");
    check("D4 Sales page selectors reset", slicerValue("sales", "Sales View Selector") === "Product" && slicerValue("sales", "Sales KPI Selector") === "All");

    // ======================= E. empty result
    section = "E";
    await pick("sales", "Channel", ["Other"]);
    var KO = C.kpis(D, f({ channels: ["OTHER"] }));
    check("E1 Channel 'Other': Sales Actual 0.00K, Attainment (Blank)", kpi("sales", "salesActual") === "0.00K" && kpi("sales", "salesAttainment") === "(Blank)" && KO.salesAttainment === null,
      [kpi("sales", "salesActual"), kpi("sales", "salesBudget"), kpi("sales", "salesVariance"), kpi("sales", "salesAttainment")].join(" "));
    check("E1 charts/tables show 'No data' message", qa("#page-sales .chart-empty").length === 4, qa("#page-sales .chart-empty").length);
    check("E1 no NaN/Infinity/undefined on Sales page", noBadText("sales"));
    await go("overview");
    check("E2 Overview with 'Other': production still shown, sales empty", kpi("overview", "productionActual") === "2.41M" && kpi("overview", "salesAttainment") === "(Blank)" && noBadText("overview"));
    await reset("overview");
    // find a combination that is empty in BOTH facts
    var emptyCombo = null;
    D.dims.plants.some(function (p) {
      return D.dims.products.some(function (pr) {
        var k = C.kpis(D, f({ plants: [p[0]], products: [pr[0]] }));
        if (k.salesActual === 0 && k.salesBudget === 0 && k.productionActual === 0 && k.productionBudget === 0) { emptyCombo = [p, pr]; return true; }
        return false;
      });
    });
    check("E3 an empty plant×product combination exists in the data", !!emptyCombo, emptyCombo ? emptyCombo[0][1] + " × " + emptyCombo[1][1] : "none");
    if (emptyCombo) {
      await pick("overview", "Plant", [emptyCombo[0][1]]);
      await pick("overview", "Product", [emptyCombo[1][1]]);
      var pagesOk = [];
      for (var pg of ["overview", "sales", "production", "plant", "product"]) {
        await go(pg);
        if (!noBadText(pg)) pagesOk.push(pg + ": bad text");
        var att = qa("#page-" + pg + ' [data-kpi$="Attainment"] .kpi-value').map(function (e) { return e.textContent; });
        if (att.some(function (a) { return a !== "(Blank)"; })) pagesOk.push(pg + ": attainment " + att.join());
        if (!qa("#page-" + pg + " .chart-empty").length) pagesOk.push(pg + ": no empty message");
      }
      check("E4 empty context on all 5 pages: no NaN/Infinity, attainment (Blank), 'No data' shown", pagesOk.length === 0, pagesOk.join("; "));
      await reset("product");
    }

    // ======================= G. charts, tables, ordering, colours, selectors
    section = "G";
    await go("overview");
    var all = tips("overview", "sales");
    var mAll = C.aggSales(D, C.emptyFilters(), { key: function (r, c) { return r[c.y] * 100 + r[c.m]; } });
    var mk = Array.from(mAll.keys()).sort(function (a, b) { return a - b; });
    var expTitles = mk.map(function (k) { return MONTHS[k % 100 - 1] + " " + Math.floor(k / 100); });
    check("G1 Overview sales chart: 36 months in chronological order", all.map(function (t) { return t.title; }).join() === expTitles.join());
    check("G1 every month value = exact monthly aggregate (rounded)", all.every(function (t, i) { return t["Sales Actual"] === fmtT(mAll.get(mk[i]).a) + " t" && t["Sales Budget"] === fmtT(mAll.get(mk[i]).b) + " t"; }));
    var pt = tips("overview", "prod");
    var pAll = C.aggProd(D, C.emptyFilters(), { key: function (r, c) { return r[c.y] * 100 + r[c.m]; } });
    check("G1 production chart values per month = aggregate", pt.every(function (t, i) { return t["Production Actual"] === fmtT(pAll.get(mk[i]).a) + " t" && t["Budget"] === fmtT(pAll.get(mk[i]).b) + " t"; }));
    var fills = {};
    qa('#page-overview [data-chart="sales"] svg rect').forEach(function (r) { var fl = r.getAttribute("fill"); if (fl !== "transparent" && fl !== "#000") fills[fl] = 1; });
    check("G2 Sales chart colours = V1 gold #D6A84B + green #A8C9A0", Object.keys(fills).sort().join() === "#A8C9A0,#D6A84B", Object.keys(fills).join());
    var lg = qa('#page-overview [data-chart="sales"] .legend-item').map(function (e) { return e.textContent + "=" + e.querySelector(".legend-key").style.background; });
    check("G2 legend Sales Actual gold / Sales Budget green", /Sales Actual=rgb\(214, 168, 75\)/.test(lg[0]) && /Sales Budget=rgb\(168, 201, 160\)/.test(lg[1]), lg.join("; "));
    var redOk = true, redDetail = [];
    qa("#main .pbi-table:not(.matrix) td").forEach(function (td) {
      var v = td.textContent, isNeg = /^-/.test(v), isPctLow = /%$/.test(v) && num(v) < 100;
      if (td.classList.contains("neg") && !(isNeg || isPctLow)) { redOk = false; redDetail.push("red but not negative: " + v); }
      if (isNeg && !td.classList.contains("neg")) { redOk = false; redDetail.push("negative not red: " + v); }
    });
    check("G3 negative values red in all tables (and only those)", redOk, redDetail.slice(0, 5).join("; "));
    var redCss = getComputedStyle(q('#page-overview td.neg')).color;
    check("G3 red = #C00000", redCss === "rgb(192, 0, 0)", redCss);
    await go("sales");
    var mx = tableData("sales", "matrix");
    check("G4 matrix year order 2023, 2024, 2025", mx.rows.filter(function (r) { return /^\d{4}$/.test(r[0]); }).map(function (r) { return r[0]; }).join() === "2023,2024,2025");
    check("G4 matrix month columns Jan→Dec + Total", mx.head.slice(1).join() === MONTHS.concat(["Total"]).join());
    check("G4 matrix grand totals = KPIs", mx.foot.map(function (r) { return r[r.length - 1]; }).join("|") === "2,429,579|2,423,099|6,480");
    var negMx = qa('#page-sales [data-table="matrix"] td').filter(function (td) { return /^-/.test(td.textContent); });
    check("G4 matrix negatives red (#EB1F1F)", negMx.length > 0 && negMx.every(function (td) { return getComputedStyle(td).color === "rgb(235, 31, 31)"; }), negMx.length);
    var combo2 = tips("sales", "combo");
    check("G5 Sales attainment tooltip = Actual/Budget for every month", combo2.length === 36 && combo2.every(function (t, i) { return t["Sales Attainment %"] === fmtPct(mAll.get(mk[i]).a / mAll.get(mk[i]).b); }));
    var counts = {};
    for (var v of ["Plant", "Product", "Channel"]) {
      await pick("sales", "Sales View Selector", [v]);
      counts[v] = tableData("sales", "view").rows.length;
    }
    check("G6 Sales View selector rows Plant 4 / Product 7 / Channel 4", counts.Plant === 4 && counts.Product === 7 && counts.Channel === 4, JSON.stringify(counts));
    await pick("sales", "Sales KPI Selector", ["Sales Variance"]);
    check("G6 Sales KPI selector (single) → Variance column only", tableData("sales", "view").head.join("|") === "Channel|Sales Variance", tableData("sales", "view").head.join("|"));
    await reset("sales");
    var prodNames = tableData("sales", "view").rows.map(function (r) { return r[0]; });
    check("G7 product names = Gold dimension names, alphabetical", prodNames.join() === D.dims.products.map(function (p) { return p[1]; }).sort().join(), prodNames.join());
    await go("plant");
    check("G7 plant names Plant A–D", tableData("plant", "perf").rows.map(function (r) { return r[0]; }).join() === "Plant A,Plant B,Plant C,Plant D");
    var pb = tips("plant", "pb");
    check("G8 Plant chart: 144 month×plant bars, tooltip e.g. 'Plant A – January 2023'", pb.length === 144 && pb[0].title === "Plant A – January 2023", pb.length + " " + (pb[0] && pb[0].title));
    check("G8 Plant chart sum = production total", near(pb.reduce(function (s, t) { return s + num(t["Production Actual"]); }, 0), K0.productionActual, 72));
    var mixAll = qa('#page-plant [data-chart="mix"] svg rect').map(hover);
    var byPlantShare = {};
    mixAll.forEach(function (m) { var p = m.title.split(" – ")[0]; byPlantShare[p] = (byPlantShare[p] || 0) + num(m["Share of plant output"]); });
    check("G9 Mix: shares per plant sum to 100%", Object.keys(byPlantShare).length === 4 && Object.keys(byPlantShare).every(function (p) { return near(byPlantShare[p], 100, 0.05); }), JSON.stringify(byPlantShare));
    var sh = tips("plant", "share");
    check("G10 Share % chart tooltips 12.23/19.50/29.26/39.01 %", sh.map(function (t) { return t["Plant Production Share %"]; }).join() ===
      ["PLANT-A", "PLANT-B", "PLANT-C", "PLANT-D"].map(function (p) { return fmtPct(C.plantShare(D, C.emptyFilters()).get(p)); }).join(), sh.map(function (t) { return t["Plant Production Share %"]; }).join());
    q('#page-plant .tile-row button[data-v="PLANT-A"]').click(); await wait();
    q('#page-plant .tile-row button[data-v="PLANT-D"]').click(); await wait();
    var sh2 = tips("plant", "share");
    check("G11 Plant tiles multi-select A+D, shares re-based to 100%", sh2.length === 2 && near(num(sh2[0]["Plant Production Share %"]) + num(sh2[1]["Plant Production Share %"]), 100, 0.02));
    q('#page-plant .tile-row button[data-v=""]').click(); await wait();
    check("G11 'Select all' tile clears plant filter", A.state.f.plants.length === 0);
    await go("product");
    var ppb = tips("product", "pb");
    check("G12 Product chart 7 products, sums = totals", ppb.length === 7 && near(ppb.reduce(function (s, t) { return s + num(t["Production Actual"]); }, 0), K0.productionActual, 4));
    check("G12 product tooltip shows full product name", ppb.every(function (t) { return /pellet/.test(t.title); }));
    await go("about");
    var ab = q("#page-about");
    check("G13 About page: repo link, synthetic, not live", !!ab.querySelector('a[href="https://github.com/Margusfloren/SCloputoo"]') && /synthetic/i.test(ab.textContent) && /not connected live/i.test(ab.textContent) && !/\{\{/.test(ab.textContent));
    check("G13 About page shows export date", /exported 20\d\d-\d\d-\d\d/.test(ab.textContent));
    var tabs = qa("#tabs a").map(function (a) { return a.textContent; });
    check("G14 navigation has 6 pages", tabs.join("|") === "Overview|Sales Analysis|Production Analysis|Plant Analysis|Product Analysis|About the Project");
    var ctrls = {};
    for (var pg2 of ["overview", "sales", "production", "plant", "product"]) {
      await go(pg2);
      ctrls[pg2] = qa("#page-" + pg2 + " .slicer-label").map(function (l) { return l.textContent; }).join("/");
    }
    var expCtrls = {
      overview: "Year/Month/Plant/Product/Channel/Compare production with/Production KPI Selector/Production View Selector",
      sales: "Year/Month/Plant/Product/Channel/Sales KPI Selector/Sales View Selector",
      production: "Year/Month/Plant/Product",
      plant: "Plant/Year/Month/Product",
      product: "Year/Month/Plant/Product"
    };
    check("G15 slicer set per page matches the Power BI pages (no Channel on production pages)", JSON.stringify(ctrls) === JSON.stringify(expCtrls), JSON.stringify(ctrls));
    A.reset();

    // ======================= P. Production vs Sales % panel (Production Analysis)
    section = "P";
    var ym = function (r, c) { return r[c.y] * 100 + r[c.m]; };
    // expected monthly rows from the calc layer: production facts vs ALL-channel sales
    function expectedPvs(filters) {
      var pm = C.aggProd(D, filters, { key: ym });
      var sm = C.aggSales(D, filters, { key: ym, allChannels: true });
      var ks = Array.from(new Set(Array.from(pm.keys()).concat(Array.from(sm.keys())))).sort(function (a, b) { return a - b; });
      return ks.map(function (k) {
        var p = pm.has(k) ? pm.get(k).a : 0, s = sm.has(k) ? sm.get(k).a : 0;
        return { title: MONTHS[k % 100 - 1] + " " + Math.floor(k / 100), p: p, s: s, pct: C.ratio(p, s) };
      });
    }
    function comparePvs(tipsArr, exp) {
      var bad = [];
      if (tipsArr.length !== exp.length) bad.push("count " + tipsArr.length + " vs " + exp.length);
      exp.forEach(function (e, i) {
        var t = tipsArr[i] || {};
        if (t.title !== e.title) bad.push("title " + t.title + " vs " + e.title);
        if (t["Production Actual"] !== fmtT(e.p) + " t") bad.push(e.title + " prod " + t["Production Actual"]);
        if (t["Sales Actual"] !== fmtT(e.s) + " t") bad.push(e.title + " sales " + t["Sales Actual"]);
        if (t["Production vs Sales %"] !== (e.pct === null ? "(Blank)" : fmtPct(e.pct))) bad.push(e.title + " pct " + t["Production vs Sales %"] + " vs " + fmtPct(e.pct));
      });
      return bad;
    }
    function periodNote() { var e = q('#page-production [data-value="pvsPeriod"]'); return e ? e.textContent : null; }

    // Test A – full period
    await go("production");
    var pa = tips("production", "pvs"), ea = expectedPvs(C.emptyFilters());
    var badA = comparePvs(pa, ea);
    check("PA1 full period: 36 monthly ratios = Production Actual / all-channel Sales Actual", badA.length === 0 && pa.length === 36, badA.slice(0, 3).join("; "));
    check("PA2 months in chronological order Jan 2023 → Dec 2025", pa[0].title === "January 2023" && pa[35].title === "December 2025");
    var exactPeriod = K0.productionActual / K0.salesActual;
    var meanMonthly = ea.reduce(function (s, e) { return s + e.pct; }, 0) / ea.length;
    check("PA3 period ratio from exact totals = 99.03% (2,406,082.3 / 2,429,578.7)", periodNote() === fmtPct(exactPeriod) && periodNote() === "99.03%", periodNote());
    check("PA3 period ratio is not the mean of monthly % (" + fmtPct(meanMonthly) + ")", fmtPct(meanMonthly) !== periodNote());
    var pvsSvg = q('#page-production [data-chart="pvs"] svg'), comboSvg = q('#page-production [data-chart="combo"] svg');
    check("PA4 separate % panel: line path + dashed 100% line + panel title, no second y-axis", !!pvsSvg.querySelector("path") &&
      !!pvsSvg.querySelector('line[stroke-dasharray="4 3"]') && /Production vs Sales %/.test((pvsSvg.querySelector(".line-panel-title") || {}).textContent || ""));
    var panelY = function (svg) { var r = svg.querySelector('rect[fill="#FAF9F8"]'); return r ? +r.getAttribute("y") : null; };
    check("PA5 symmetry: both charts same SVG height and % panel at same y", comboSvg.getAttribute("height") === pvsSvg.getAttribute("height") && panelY(comboSvg) === panelY(pvsSvg) && panelY(pvsSvg) !== null,
      comboSvg.getAttribute("height") + "/" + pvsSvg.getAttribute("height") + " y " + panelY(comboSvg) + "/" + panelY(pvsSvg));
    var comboTitles = tips("production", "combo").map(function (t) { return t.title; });
    check("PA6 same time axis as Production Actual vs Budget", comboTitles.join() === pa.map(function (t) { return t.title; }).join());
    var cLeg = q('#page-production [data-chart="combo"] .legend').getBoundingClientRect().height, pLeg = q('#page-production [data-chart="pvs"] .legend').getBoundingClientRect().height;
    check("PA7 legends same height (panels vertically aligned on page)", Math.abs(cLeg - pLeg) < 1 && Math.abs(comboSvg.getBoundingClientRect().top - pvsSvg.getBoundingClientRect().top) < 1, cLeg + "/" + pLeg);

    // Test B – years 2024 and 2025
    await pick("production", "Year", ["2024", "2025"]);
    var pb2 = tips("production", "pvs"), eb = expectedPvs(f({ years: [2024, 2025] }));
    check("PB1 years 2024+2025: 24 months in order, ratios correct", comparePvs(pb2, eb).length === 0 && pb2.length === 24 && pb2[0].title === "January 2024", comparePvs(pb2, eb).slice(0, 2).join("; "));
    check("PB2 same periods as the left chart", tips("production", "combo").map(function (t) { return t.title; }).join() === pb2.map(function (t) { return t.title; }).join());
    await reset("production");

    // Test C – Plant B
    await pick("production", "Plant", ["Plant B"]);
    var pc = tips("production", "pvs"), ec = expectedPvs(f({ plants: ["PLANT-B"] }));
    check("PC1 Plant B: ratios use Plant B production and Plant B sales only", comparePvs(pc, ec).length === 0, comparePvs(pc, ec).slice(0, 2).join("; "));
    check("PC2 line changes with plant filter", pc.some(function (t, i) { return t["Production vs Sales %"] !== pa[i]["Production vs Sales %"]; }));
    var KPB = C.kpis(D, f({ plants: ["PLANT-B"] }));
    check("PC3 Plant B period ratio from totals", periodNote() === fmtPct(KPB.productionActual / C.total(C.aggSales(D, f({ plants: ["PLANT-B"] }), { allChannels: true })).a), periodNote());
    await reset("production");

    // Test D – product
    await pick("production", "Product", ["Premium pellet 15 kg 6 mm"]);
    var pd = tips("production", "pvs"), ed = expectedPvs(f({ products: ["P1506"] }));
    check("PD1 product P1506: monthly volumes and ratio match product data", comparePvs(pd, ed).length === 0, comparePvs(pd, ed).slice(0, 2).join("; "));
    check("PD2 product period ratio 470,257 / 465,628 = 100.99%", periodNote() === "100.99%", periodNote());
    await reset("production");

    // Test E – channel rule
    await go("sales");
    await pick("sales", "Channel", ["Direct B2B"]);
    await go("production");
    var pe = tips("production", "pvs");
    check("PE1 Channel=B2B elsewhere: % panel still uses all-channel sales", A.state.f.channels.join() === "B2B" && comparePvs(pe, ea).length === 0, comparePvs(pe, ea).slice(0, 2).join("; "));
    check("PE2 period ratio unchanged (99.03%)", periodNote() === "99.03%", periodNote());
    await reset("production");

    // Test F – zero / empty
    var zeroSalesMonth = null;
    D.dims.plants.some(function (p) {
      return D.dims.products.some(function (pr) {
        var e = expectedPvs(f({ plants: [p[0]], products: [pr[0]] }));
        var z = e.filter(function (x) { return x.s === 0 && x.p > 0; })[0];
        if (z) { zeroSalesMonth = { plant: p, product: pr, row: z }; return true; }
        return false;
      });
    });
    if (zeroSalesMonth) {
      A.setFilter("plants", [zeroSalesMonth.plant[0]]); A.setFilter("products", [zeroSalesMonth.product[0]]);
      var pz = tips("production", "pvs");
      var tz = pz.filter(function (t) { return t.title === zeroSalesMonth.row.title; })[0];
      check("PF1 month with production but zero sales → (Blank), no NaN/Infinity", tz && tz["Production vs Sales %"] === "(Blank)" && noBadText("production"),
        zeroSalesMonth.plant[1] + " × " + zeroSalesMonth.product[1] + " " + zeroSalesMonth.row.title);
      A.reset();
    } else {
      check("PF1 data has no month with production but zero sales – checked via component test below", true, "none in data");
    }
    var tmp = document.createElement("div");
    tmp.style.width = "600px";
    document.body.appendChild(tmp);
    window.PelletCharts.columns(tmp, { categories: [{ label: "a" }, { label: "b" }, { label: "c" }], fmt: String,
      series: [{ name: "x", color: "#000", values: [5, 0, 7] }],
      line: { name: "r", label: "r", color: "#E66C37", target: 1, fmt: String, minSpan: 0.1, values: [C.ratio(5, 0), null, 1.02] } });
    var d = tmp.querySelector("path").getAttribute("d");
    check("PF2 chart component with null ratios: no NaN/Infinity in SVG", !/NaN|Infinity/.test(tmp.innerHTML) && /^M/.test(d), d);
    tmp.remove();
    var emptyF = null;
    D.dims.plants.some(function (p) {
      return D.dims.products.some(function (pr) {
        if (!expectedPvs(f({ plants: [p[0]], products: [pr[0]] })).length) { emptyF = [p[0], pr[0]]; return true; }
        return false;
      });
    });
    if (emptyF) {
      A.setFilter("plants", [emptyF[0]]); A.setFilter("products", [emptyF[1]]);
      check("PF3 no data → 'No data' and no period ratio", /No data/.test(txt('#page-production [data-chart="pvs"]')) && periodNote() === null && noBadText("production"), emptyF.join(" × "));
    }

    // Test G – Reset
    A.setFilter("years", [2023]); A.setFilter("plants", ["PLANT-D"]);
    await reset("production");
    var pg3 = tips("production", "pvs");
    check("PG1 Reset restores full-period % panel (36 months, 99.03%)", comparePvs(pg3, ea).length === 0 && periodNote() === "99.03%");

    // ======================= X. Plant Analysis cross-filtering / cross-highlighting (real clicks)
    section = "X";
    A.reset();
    await go("plant");
    var SH = '#page-plant [data-chart="share"]';
    function shareHits() { return qa(SH + " svg rect[data-hit]"); }
    function hitFor(plantLabel) { return shareHits().filter(function (h) { return hover(h).title === plantLabel; })[0]; }
    async function clickShare(plantLabel) {
      var h = hitFor(plantLabel);
      if (!h) return false;
      h.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await wait();
      return true;
    }
    async function tile(id) { q('#page-plant .tile-row button[data-v="' + id + '"]').click(); await wait(); }
    function shareState() {
      // [{label, pct, dimmed}] in chart order
      return shareHits().map(function (h) {
        var t = hover(h), i = h.getAttribute("data-hit");
        var bar = q(SH + ' rect.bar[data-cat="' + i + '"]');
        return { label: t.title, pct: t["Plant Production Share %"], dimmed: bar.classList.contains("dimmed") };
      });
    }
    function dimmedCount(sel) { return qa(sel + " rect.dimmed").length; }
    function pbHighlightOk(plantLabel) {
      var titles = tips("plant", "pb").map(function (t) { return t.title; });
      var bars = qa('#page-plant [data-chart="pb"] rect.bar');
      return bars.length > 0 && bars.every(function (b) {
        var isSel = titles[+b.getAttribute("data-cat")].indexOf(plantLabel + " – ") === 0;
        return b.classList.contains("dimmed") === !isSel;
      });
    }
    function mixHighlightOk(plantLabel) {
      var segs = qa('#page-plant [data-chart="mix"] rect.bar');
      return segs.length > 0 && segs.every(function (s) {
        var isSel = hover(s).title.indexOf(plantLabel + " – ") === 0;
        return s.classList.contains("dimmed") === !isSel;
      });
    }
    function perfRows() { return tableData("plant", "perf").rows.map(function (r) { return r[0]; }); }
    var NAMES = { "PLANT-A": "Plant A", "PLANT-B": "Plant B", "PLANT-C": "Plant C", "PLANT-D": "Plant D" };
    var base = shareState();
    var pb0 = tips("plant", "pb").length;

    check("X1 share columns are clickable buttons (role, tabindex), hint shown, nothing dimmed",
      shareHits().length === 4 && shareHits().every(function (h) { return h.getAttribute("role") === "button" && h.getAttribute("tabindex") === "0"; }) &&
      /Click a plant's column/.test(txt('#page-plant [data-selection="share"]')) && dimmedCount("#page-plant") === 0);

    // select Plant B
    await clickShare("Plant B");
    var sB = shareState();
    check("X2 click Plant B → selection stored (page-scoped), slicer untouched",
      A.state.selections.plant && A.state.selections.plant.value === "PLANT-B" && A.state.f.plants.length === 0 &&
      qa("#page-plant .tile-row button.on").map(function (b) { return b.textContent; }).join() === "Select all");
    check("X2 source chart: Plant B active, others dimmed but still visible", sB.length === 4 && sB.every(function (s) { return s.dimmed === (s.label !== "Plant B"); }) &&
      hitFor("Plant B").getAttribute("aria-pressed") === "true");
    check("X2 source chart values unchanged (not filtered by its own selection)", sB.map(function (s) { return s.pct; }).join() === base.map(function (s) { return s.pct; }).join(), sB.map(function (s) { return s.pct; }).join());
    var KBx = C.kpis(D, f({ plants: ["PLANT-B"] }));
    check("X3 KPI cards cross-filtered to Plant B (469K / 472K / -2.79K / 99.41%)", expectCards("plant", KBx, PROD_K).length === 0 &&
      [kpi("plant", "productionActual"), kpi("plant", "productionBudget"), kpi("plant", "productionVariance"), kpi("plant", "productionAttainment")].join(" ") === "469K 472K -2.79K 99.41%",
      [kpi("plant", "productionActual"), kpi("plant", "productionBudget"), kpi("plant", "productionVariance"), kpi("plant", "productionAttainment")].join(" "));
    var tB = tableData("plant", "perf");
    check("X3 table cross-filtered: only Plant B, total = B9 (469,210 / 472,001 / -2,791 / 99.41%)", perfRows().join() === "Plant B" && tB.foot[0].slice(1).join("|") === "469,210|472,001|-2,791|99.41%", tB.foot[0].join(" | "));
    check("X4 Production vs Budget chart cross-highlighted (all 144 bars kept, non-B dimmed)", tips("plant", "pb").length === pb0 && pbHighlightOk("Plant B"));
    check("X4 Production Mix cross-highlighted (4 plants kept, non-B dimmed)", mixHighlightOk("Plant B") && qa('#page-plant [data-chart="mix"] svg text').some(function (t) { return t.textContent === "Plant A"; }));
    var bSum = tips("plant", "pb").filter(function (t) { return t.title.indexOf("Plant B – ") === 0; }).reduce(function (s, t) { return s + num(t["Production Actual"]); }, 0);
    check("X5 highlighted Plant B bars sum = Plant B KPI (±0.5 t per month)", near(bSum, KBx.productionActual, 18), bSum + " vs " + KBx.productionActual.toFixed(1));
    check("X5 selection bar names the selection", /Selected:\s*Plant B/.test(txt('#page-plant [data-selection="share"]')));

    // clear by clicking again
    await clickShare("Plant B");
    check("X6 second click on Plant B clears the selection", !A.state.selections.plant && dimmedCount("#page-plant") === 0 &&
      expectCards("plant", K0, PROD_K).length === 0 && perfRows().length === 4);

    // B → C
    await clickShare("Plant B");
    await clickShare("Plant C");
    var KCx = C.kpis(D, f({ plants: ["PLANT-C"] }));
    check("X7 clicking Plant C while B is active switches the selection to C", A.state.selections.plant.value === "PLANT-C" &&
      shareState().every(function (s) { return s.dimmed === (s.label !== "Plant C"); }) && expectCards("plant", KCx, PROD_K).length === 0 && perfRows().join() === "Plant C" && pbHighlightOk("Plant C"));

    // every plant selectable, numbers = B9
    var B9X = { "PLANT-A": "294,164", "PLANT-B": "469,210", "PLANT-C": "704,110", "PLANT-D": "938,599" };
    var allOk = [];
    for (var pid of ["PLANT-A", "PLANT-B", "PLANT-C", "PLANT-D"]) {
      await clickShare(NAMES[pid]);
      var tt = tableData("plant", "perf");
      if (!(A.state.selections.plant && A.state.selections.plant.value === pid && tt.rows.length === 1 && tt.rows[0][1] === B9X[pid] &&
        expectCards("plant", C.kpis(D, f({ plants: [pid] })), PROD_K).length === 0)) allOk.push(pid);
    }
    check("X8 each of the four plants can be selected; KPI and table = B9 values", allOk.length === 0, allOk.join());
    await clickShare("Plant D");
    check("X8 clearing after the loop", !A.state.selections.plant);

    // interplay with the Plant slicer (tiles)
    await clickShare("Plant C");
    await tile("PLANT-A");
    check("X9 slicer Plant A removes Plant C from the chart → selection cleared automatically", !A.state.selections.plant && shareHits().length === 1 &&
      expectCards("plant", C.kpis(D, f({ plants: ["PLANT-A"] })), PROD_K).length === 0);
    await tile("PLANT-B");
    await clickShare("Plant B");
    var sAB = shareState();
    check("X10 slicer A+B: chart re-based to A+B (ALLSELECTED), selecting B cross-filters KPIs to B",
      sAB.length === 2 && near(num(sAB[0].pct) + num(sAB[1].pct), 100, 0.02) && A.state.selections.plant.value === "PLANT-B" &&
      A.state.f.plants.slice().sort().join() === "PLANT-A,PLANT-B" && expectCards("plant", KBx, PROD_K).length === 0 && perfRows().join() === "Plant B");
    await tile("PLANT-C");
    check("X11 adding Plant C to the slicer keeps the B selection", A.state.selections.plant && A.state.selections.plant.value === "PLANT-B" && shareHits().length === 3);
    await clickShare("Plant C");
    check("X11 another plant can be selected while one is active (B → C)", A.state.selections.plant.value === "PLANT-C" && expectCards("plant", KCx, PROD_K).length === 0);
    await tile("PLANT-C");
    check("X12 removing Plant C from the slicer clears its selection; slicer context A+B applies", !A.state.selections.plant &&
      expectCards("plant", C.kpis(D, f({ plants: ["PLANT-A", "PLANT-B"] })), PROD_K).length === 0 && perfRows().join() === "Plant A,Plant B");
    q('#page-plant .tile-row button[data-v=""]').click(); await wait();

    // Clear selection button, keyboard
    await clickShare("Plant A");
    q('#page-plant .clear-sel').click(); await wait();
    check("X13 'Clear selection' button clears the selection", !A.state.selections.plant && dimmedCount("#page-plant") === 0);
    var hk = hitFor("Plant D");
    hk.focus();
    hk.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await wait();
    check("X14 keyboard: Enter on a focused column selects it", A.state.selections.plant && A.state.selections.plant.value === "PLANT-D");

    // Reset
    await tile("PLANT-D");
    A.setFilter("years", [2024]);
    await reset("plant");
    check("X15 Reset clears slicers and chart selection; full-period KPIs; nothing dimmed", !A.state.selections.plant && JSON.stringify(A.state.f) === JSON.stringify(C.emptyFilters()) &&
      expectCards("plant", K0, PROD_K).length === 0 && dimmedCount("#page-plant") === 0 && perfRows().length === 4 && /Click a plant's column/.test(txt('#page-plant [data-selection="share"]')));

    // cross-page context
    await clickShare("Plant D");
    await go("production");
    check("X16 chart selection is page-scoped: Production Analysis shows full slicer context", expectCards("production", K0, PROD_K).length === 0 && slicerValue("production", "Plant") === "All");
    await go("plant");
    check("X16 returning to Plant Analysis keeps the Plant D selection", A.state.selections.plant && A.state.selections.plant.value === "PLANT-D" &&
      expectCards("plant", C.kpis(D, f({ plants: ["PLANT-D"] })), PROD_K).length === 0);
    await clickShare("Plant D");
    await tile("PLANT-B");
    await go("production");
    check("X17 slicer filter (Plant B tile) still carries across pages", slicerValue("production", "Plant") === "Plant B" && expectCards("production", KBx, PROD_K).length === 0);
    await go("product");
    // (stage 1 asserted that this chart was not interactive; stage 2 made Product Analysis interactive)
    var plantSelBefore = JSON.stringify(A.state.selections.plant || null);
    var prodShareHit = q('#page-product [data-chart="share"] [role="button"]');
    if (prodShareHit) { prodShareHit.dispatchEvent(new MouseEvent("click", { bubbles: true })); await wait(); }
    check("X18 Product Analysis share chart is a selection source with its own page-scoped selection (Plant Analysis selection unchanged)",
      !!prodShareHit && !!A.state.selections.product && JSON.stringify(A.state.selections.plant || null) === plantSelBefore);
    await reset("product");

    // layout: selection bar keeps its height; chart inside its panel
    await go("plant");
    var hBefore = q('#page-plant [data-selection="share"]').getBoundingClientRect().height;
    var svgTop0 = q(SH + " svg").getBoundingClientRect().top;
    await clickShare("Plant B");
    var hAfter = q('#page-plant [data-selection="share"]').getBoundingClientRect().height;
    var panelW = q(SH).closest(".panel").getBoundingClientRect().width, svgW = q(SH + " svg").getBoundingClientRect().width;
    check("X19 layout (" + window.innerWidth + " px): chart does not jump when selecting, fits its panel", Math.abs(q(SH + " svg").getBoundingClientRect().top - svgTop0) < 1 && svgW <= panelW + 1,
      "bar " + hBefore + "→" + hAfter + ", svg " + svgW + " / panel " + panelW);
    await reset("plant");

    // ======================= Y. all four Plant Analysis visuals as selection sources (real clicks)
    section = "Y";
    var MIX = '#page-plant [data-chart="mix"]', PB = '#page-plant [data-chart="pb"]';
    var IDS = { "Plant A": "PLANT-A", "Plant B": "PLANT-B", "Plant C": "PLANT-C", "Plant D": "PLANT-D" };
    function mixCols() { return qa(MIX + " g.stack-col"); }
    function mixColOf(plantLabel) { return mixCols().filter(function (g) { return hover(g.querySelector("rect")).title.indexOf(plantLabel + " – ") === 0; })[0]; }
    async function clickMix(plantLabel, segIndex) {
      var g = mixColOf(plantLabel), segs = g.querySelectorAll("rect");
      var seg = segs[Math.min(segIndex || 0, segs.length - 1)];
      seg.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await wait();
    }
    // click the real element under the centre of a specific bar (Actual = series 0, Budget = series 1)
    async function clickPbBar(plantLabel, monthTitle, series) {
      var titles = tips("plant", "pb").map(function (t) { return t.title; });
      var cat = titles.indexOf(plantLabel + " – " + monthTitle);
      var bar = q(PB + ' rect.bar[data-cat="' + cat + '"][data-series="' + series + '"]');
      bar.scrollIntoView({ block: "center", inline: "center" });
      await wait();
      var r = bar.getBoundingClientRect();
      var target = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      var ok = !!target && target.getAttribute("data-sel") === String(cat);
      target.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }));
      await wait();
      window.scrollTo(0, 0);
      return { ok: ok, cat: cat };
    }
    async function clickRow(plantLabel) {
      var b = qa('#page-plant [data-table="perf"] .row-select').filter(function (x) { return x.textContent === plantLabel; })[0];
      if (!b) return false;
      b.click();
      await wait();
      return true;
    }
    function sameEverywhere(plantLabel) {
      var bad = [], pid = IDS[plantLabel];
      if (!(A.state.selections.plant && A.state.selections.plant.value === pid)) bad.push("state");
      if (!shareState().every(function (s) { return s.dimmed === (s.label !== plantLabel); })) bad.push("share");
      var hb = hitFor(plantLabel); if (!hb || hb.getAttribute("aria-pressed") !== "true") bad.push("share aria");
      if (!mixHighlightOk(plantLabel)) bad.push("mix");
      var g = mixColOf(plantLabel); if (!g || g.getAttribute("aria-pressed") !== "true") bad.push("mix aria");
      if (!pbHighlightOk(plantLabel)) bad.push("pb");
      if (perfRows().join() !== plantLabel || !q('#page-plant [data-table="perf"] tr.selectable.active')) bad.push("table");
      if (expectCards("plant", C.kpis(D, f({ plants: [pid] })), PROD_K).length) bad.push("kpis");
      return bad;
    }
    function noneEverywhere() {
      return !A.state.selections.plant && dimmedCount("#page-plant") === 0 && perfRows().length === 4 &&
        expectCards("plant", K0, PROD_K).length === 0 &&
        // only the selection sources (charts, table) – the Plant slicer's "Select all" tile is legitimately pressed
        qa('#page-plant .chart [aria-pressed="true"], #page-plant .tbl [aria-pressed="true"]').length === 0;
    }
    await go("plant");

    // Test A – Production Mix
    check("YA0 Mix columns are buttons (4, one Tab stop each)", mixCols().length === 4 && mixCols().every(function (g) { return g.getAttribute("role") === "button" && g.getAttribute("tabindex") === "0"; }));
    await clickMix("Plant C", 2);
    var yA = sameEverywhere("Plant C");
    check("YA1 click on a Plant C segment selects Plant C in all four visuals; KPIs = Plant C", yA.length === 0, yA.join());
    check("YA1 all Plant C segments active, other plants dimmed (no product filter)", qa(MIX + " rect.bar").every(function (r) {
      var isC = hover(r).title.indexOf("Plant C – ") === 0;
      return r.classList.contains("dimmed") === !isC;
    }) && A.state.f.products.length === 0);
    await clickMix("Plant A", 0);
    check("YA2 clicking a Plant A segment switches the selection to Plant A", sameEverywhere("Plant A").length === 0, sameEverywhere("Plant A").join());
    await clickMix("Plant A", 1);
    check("YA3 clicking Plant A again (another segment) clears the selection", noneEverywhere());

    // Test B – Production vs Budget
    var c1 = await clickPbBar("Plant B", "January 2023", 0);
    check("YB1 click on Plant B Production ACTUAL bar (Jan 2023) hits the plant target and selects Plant B", c1.ok && sameEverywhere("Plant B").length === 0, JSON.stringify(c1) + " " + sameEverywhere("Plant B").join());
    check("YB1 month and series are NOT added as filters (KPIs = full-period Plant B, slicers unchanged)",
      JSON.stringify(A.state.f) === JSON.stringify(C.emptyFilters()) && Object.keys(A.state.selections.plant).sort().join() === "field,value,visual" &&
      A.state.selections.plant.field === "plants" && kpi("plant", "productionActual") === "469K");
    check("YB1 other plants stay visible for comparison (144 bars)", tips("plant", "pb").length === 144 && qa(PB + " rect.bar.dimmed").length === 216);
    var c2 = await clickPbBar("Plant B", "March 2023", 1);
    check("YB2 Plant B BUDGET bar of another month toggles the same plant selection (clears)", c2.ok && noneEverywhere());
    var c3 = await clickPbBar("Plant B", "March 2023", 1);
    var selB1 = JSON.stringify(A.state.selections.plant);
    check("YB3 Plant B Budget bar alone also selects Plant B (same selection as Actual)", c3.ok && sameEverywhere("Plant B").length === 0 &&
      selB1 === JSON.stringify({ visual: "pb", field: "plants", value: "PLANT-B" }), selB1);
    check("YB4 one Tab stop per plant in the dense chart (4 of 144)", qa(PB + ' [role="button"][tabindex="0"]').length === 4 && qa(PB + ' [role="button"]').length === 144);
    var pbKey = qa(PB + ' [role="button"][tabindex="0"]').filter(function (h) { return /^Plant D/.test(h.getAttribute("aria-label")); })[0];
    pbKey.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await wait();
    check("YB5 keyboard (Space) on the Plant D tab stop selects Plant D", sameEverywhere("Plant D").length === 0);
    q('#page-plant .clear-sel').click(); await wait();

    // Test C – table
    await clickRow("Plant B");
    check("YC1 click on table row Plant B selects Plant B everywhere", sameEverywhere("Plant B").length === 0, sameEverywhere("Plant B").join());
    check("YC1 KPI cards = B9 Plant B (469K / 472K / -2.79K / 99.41%), table row = 469,210 | 472,001 | -2,791 | 99.41%",
      [kpi("plant", "productionActual"), kpi("plant", "productionBudget"), kpi("plant", "productionVariance"), kpi("plant", "productionAttainment")].join(" ") === "469K 472K -2.79K 99.41%" &&
      tableData("plant", "perf").rows[0].slice(1).join("|") === "469,210|472,001|-2,791|99.41%");
    await clickRow("Plant B");
    check("YC2 clicking the (now only) Plant B row again clears the selection", noneEverywhere());
    var totalCell = q('#page-plant [data-table="perf"] tfoot td');
    totalCell.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    q('#page-plant [data-table="perf"] tfoot th').dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await wait();
    check("YC3 Total row does not start a selection (not a button, no data-key)", noneEverywhere() && !q('#page-plant [data-table="perf"] tfoot .row-select, #page-plant [data-table="perf"] tfoot [data-key]'));
    var rowTd = qa('#page-plant [data-table="perf"] tr.selectable').filter(function (tr) { return tr.querySelector(".row-select").textContent === "Plant C"; })[0].querySelectorAll("td")[2];
    rowTd.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await wait();
    check("YC4 clicking a value cell of the Plant C row also selects Plant C; table values unchanged", sameEverywhere("Plant C").length === 0 &&
      tableData("plant", "perf").rows[0].slice(1).join("|") === "704,110|707,999|-3,890|99.45%");
    q('#page-plant .clear-sel').click(); await wait();
    check("YC5 table rows are keyboard buttons with accessible names", qa('#page-plant [data-table="perf"] .row-select').length === 4 &&
      qa('#page-plant [data-table="perf"] .row-select').every(function (b) { return b.tagName === "BUTTON" && /activate to select/.test(b.getAttribute("aria-label")); }));

    // Test D – switching between visuals
    var seq = [];
    await clickRow("Plant B"); seq.push(["table→B", sameEverywhere("Plant B")]);
    await clickMix("Plant C", 0); seq.push(["mix→C", sameEverywhere("Plant C")]);
    var cA = await clickPbBar("Plant A", "February 2023", 0); seq.push(["pb→A", sameEverywhere("Plant A").concat(cA.ok ? [] : ["hit"])]);
    await clickShare("Plant A");
    var seqBad = seq.filter(function (s) { return s[1].length; }).map(function (s) { return s[0] + ":" + s[1].join("/"); });
    check("YD1 table B → mix C → chart A: all four visuals always show the same active plant", seqBad.length === 0, seqBad.join("; "));
    check("YD2 clicking Plant A in Production Share % clears the selection made elsewhere", noneEverywhere());

    // Test E – slicer
    await tile("PLANT-A"); await tile("PLANT-B");
    var pbPlants = Array.from(new Set(tips("plant", "pb").map(function (t) { return t.title.split(" – ")[0]; }))).sort().join();
    check("YE1 slicer A+B: every source offers only A and B (share, mix, chart, table)", shareHits().length === 2 && mixCols().length === 2 && pbPlants === "Plant A,Plant B" &&
      perfRows().join() === "Plant A,Plant B" && qa(PB + ' [role="button"][tabindex="0"]').length === 2, pbPlants);
    await clickMix("Plant B", 0);
    check("YE2 selecting Plant B from Mix within the slicer context", sameEverywhere("Plant B").length === 0);
    await tile("PLANT-B");
    check("YE3 slicer change excluding Plant B clears the selection", !A.state.selections.plant && perfRows().join() === "Plant A" &&
      expectCards("plant", C.kpis(D, f({ plants: ["PLANT-A"] })), PROD_K).length === 0);
    q('#page-plant .tile-row button[data-v=""]').click(); await wait();

    // Test F – navigation and Reset
    await clickRow("Plant D");
    await go("sales"); await go("plant");
    check("YF1 selection made in the table survives navigation away and back", sameEverywhere("Plant D").length === 0);
    await clickMix("Plant C", 0);
    A.setFilter("years", [2025]);
    await reset("plant");
    check("YF2 Reset restores slicers, selection and all four visuals", noneEverywhere() && JSON.stringify(A.state.f) === JSON.stringify(C.emptyFilters()));

    // Test G – numbers and regression
    await clickMix("Plant B", 0);
    var tb = tableData("plant", "perf").rows[0];
    check("YG1 Plant B = B9 (469,209.9 / 472,000.5 t)", near(C.kpis(D, f({ plants: ["PLANT-B"] })).productionActual, 469209.9, 0.05) && tb.slice(1, 3).join("|") === "469,210|472,001");
    // the table is cross-filtered to Plant B, so Plant C is chosen from a visual that still shows it
    check("YG2a while Plant B is selected the table offers only the Plant B row (cross-filtered)", !(await clickRow("Plant C")) && perfRows().join() === "Plant B");
    await clickPbBar("Plant C", "April 2023", 0);
    var tc = tableData("plant", "perf").rows[0];
    check("YG2 Plant C = B9 (704,109.5 / 707,999.4 t)", near(C.kpis(D, f({ plants: ["PLANT-C"] })).productionActual, 704109.5, 0.05) && tc.slice(1, 3).join("|") === "704,110|707,999" && kpi("plant", "productionActual") === "704K");
    await go("overview");
    check("YG3 Overview KPIs unaffected by the Plant Analysis selection", [kpi("overview", "salesActual"), kpi("overview", "salesBudget"), kpi("overview", "salesVariance"), kpi("overview", "salesAttainment"),
      kpi("overview", "productionActual"), kpi("overview", "productionBudget"), kpi("overview", "productionVariance"), kpi("overview", "productionAttainment")].join(" ") === "2.43M 2.42M 6.48K 100.27% 2.41M 2.42M -12.9K 99.47%");
    await pick("overview", "Channel", ["Direct B2B"]);
    var pvsY = tableData("overview", "pvs").foot[0];
    check("YG4 business rules unchanged: B2B filters sales KPIs, PvS stays all channels", kpi("overview", "salesActual") === "216K" && kpi("overview", "productionActual") === "2.41M" && pvsY[2] === "2,429,579");
    await reset("overview");
    await go("plant");

    // layout: selecting from table / mix does not move any visual
    var tops = function () { return [SH, MIX, PB, '#page-plant [data-table="perf"]'].map(function (s) { return Math.round(q(s).getBoundingClientRect().top); }).join(); };
    var t0 = tops();
    await clickRow("Plant B"); var t1 = tops();
    await clickMix("Plant D", 0); var t2 = tops();
    check("YH layout (" + window.innerWidth + " px): no visual moves when selecting from table or mix", t0 === t1 && t1 === t2, t0 + " / " + t1 + " / " + t2);
    await reset("plant");

    // ======================= generic helpers for cross-filtering on the other pages
    function hits(page, chartName) { return qa("#page-" + page + ' [data-chart="' + chartName + '"] svg [role="button"]'); }
    function hitByTitle(page, chartName, title) { return hits(page, chartName).filter(function (h) { return hover(h).title === title; })[0]; }
    async function clickChart(page, chartName, title) {
      var h = hitByTitle(page, chartName, title);
      if (!h) return false;
      h.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await wait();
      return true;
    }
    async function clickTableRow(page, table, label) {
      var b = qa("#page-" + page + ' [data-table="' + table + '"] .row-select').filter(function (x) { return x.textContent === label; })[0];
      if (!b) return false;
      b.click();
      await wait();
      return true;
    }
    async function clickMatrixCell(page, table, ym, rowIndex) {
      var cells = qa("#page-" + page + ' [data-table="' + table + '"] td[data-ym="' + ym + '"]');
      var c = cells[rowIndex || 0];
      if (!c) return false;
      c.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await wait();
      return true;
    }
    function selOf(page) { return A.state.selections[page] || null; }
    function selIs(page, field, value) { var s = selOf(page); return !!s && s.field === field && s.value === value; }
    function tableTotal(page, table, col) { var t = tableData(page, table); return t ? t.foot[0][col] : null; }
    function dimmedCats(page, chartName) {
      var cats = {};
      qa("#page-" + page + ' [data-chart="' + chartName + '"] rect.bar.dimmed').forEach(function (r) { cats[r.getAttribute("data-cat")] = 1; });
      return Object.keys(cats).length;
    }
    function catCount(page, chartName) { return hits(page, chartName).length; }
    function cardsOk(page, filters, keys) { return expectCards(page, C.kpis(D, f(filters)), keys).length === 0; }
    function cardsText(page, keys) { return keys.map(function (k) { return kpi(page, k); }).join(" "); }

    // ======================= O. Overview cross-filtering
    section = "O";
    A.reset();
    await go("overview");
    var ALL_K = SALES_K.concat(PROD_K);
    check("O0 Overview sources: 36+36 month columns, 7+7+7 table rows are buttons; selection bar with hint",
      catCount("overview", "sales") === 36 && catCount("overview", "prod") === 36 &&
      qa('#page-overview [data-table="salesView"] .row-select').length === 7 && qa('#page-overview [data-table="prodView"] .row-select').length === 7 &&
      qa('#page-overview [data-table="pvs"] .row-select').length === 7 && /Click a month/.test(txt('#page-overview [data-selection="page"]')));
    var mar24 = hitByTitle("overview", "sales", "March 2024");
    check("O0 tooltip tells what a click selects", /Click to select March 2024/.test(mar24 && JSON.stringify(hover(mar24))));
    await clickChart("overview", "sales", "March 2024");
    var KM = C.kpis(D, f({ years: [2024], months: [3] }));
    var KallMar = C.kpis(D, f({ months: [3] }));
    check("O1 click March 2024 (sales chart) → selection = YEAR+MONTH 2024-03, slicers unchanged", selIs("overview", "ym", 202403) &&
      JSON.stringify(A.state.f) === JSON.stringify(C.emptyFilters()));
    check("O1 KPI cards = March 2024 only (not all Marches)", cardsOk("overview", { years: [2024], months: [3] }, ALL_K) && KM.salesActual !== KallMar.salesActual,
      cardsText("overview", ALL_K));
    check("O1 tables cross-filtered to March 2024", tableTotal("overview", "salesView", 1) === fmtT(KM.salesActual) &&
      tableTotal("overview", "prodView", 1) === fmtT(KM.productionActual) && tableTotal("overview", "pvs", 2) === fmtT(C.total(C.aggSales(D, f({ years: [2024], months: [3] }), { allChannels: true })).a));
    check("O1 both month charts cross-highlighted: 35 of 36 months dimmed, March 2024 solid", dimmedCats("overview", "sales") === 35 && dimmedCats("overview", "prod") === 35 &&
      qa('#page-overview [data-chart="sales"] rect.bar:not(.dimmed)').every(function (r) { return hover(hits("overview", "sales")[+r.getAttribute("data-cat")]).title === "March 2024"; }));
    check("O1 selection bar shows 'March 2024' with Clear selection", /Selected:\s*March 2024/.test(txt('#page-overview [data-selection="page"]')) && !!q('#page-overview .clear-sel'));
    await clickChart("overview", "sales", "March 2024");
    check("O2 second click on March 2024 clears", !selOf("overview") && cardsOk("overview", {}, ALL_K) && dimmedCats("overview", "sales") === 0);
    await clickChart("overview", "prod", "January 2023");
    await clickChart("overview", "sales", "July 2025");
    check("O3 production chart Jan 2023 → sales chart Jul 2025 switches the month", selIs("overview", "ym", 202507) && cardsOk("overview", { years: [2025], months: [7] }, ALL_K) &&
      dimmedCats("overview", "prod") === 35);
    q('#page-overview .clear-sel').click(); await wait();

    // product from Sales View
    await clickTableRow("overview", "salesView", "Premium pellet 15 kg 6 mm");
    var FP = { products: ["P1506"] };
    var spM = C.aggSales(D, f(FP), { key: function (r, c) { return r[c.y] * 100 + r[c.m]; } });
    var stips = tips("overview", "sales");
    check("O4 Sales View row → PRODUCT selection; KPIs = product (466K sales / 470K production)", selIs("overview", "products", "P1506") && cardsOk("overview", FP, ALL_K) &&
      kpi("overview", "salesActual") === "466K" && kpi("overview", "productionActual") === "470K", cardsText("overview", ALL_K));
    check("O4 source table keeps all 7 rows, 6 dimmed; other tables filtered to the product", tableData("overview", "salesView").rows.length === 7 &&
      qa('#page-overview [data-table="salesView"] tr.dimmed-row').length === 6 && tableData("overview", "prodView").rows.length === 1 && tableData("overview", "pvs").rows.length === 1 &&
      tableData("overview", "pvs").foot[0].slice(1).join("|") === "470,257|465,628|4,629|100.99%");
    check("O4 sales chart partial highlight: tooltip 'Sales Actual – <product>' = product's monthly sales", stips.length === 36 && stips.every(function (t, i) {
      var k = 202301 + Math.floor(i / 12) * 100 + (i % 12);
      return t["Sales Actual – Premium pellet 15 kg 6 mm"] === fmtT(spM.has(k) ? spM.get(k).a : 0) + " t";
    }) && qa('#page-overview [data-chart="sales"] rect.bar-hl').length > 0, stips[0] && JSON.stringify(stips[0]));
    await clickTableRow("overview", "salesView", "Premium pellet 15 kg 6 mm");
    check("O5 clicking the same row clears", !selOf("overview") && qa('#page-overview tr.dimmed-row').length === 0);

    // Production View follows its selector
    await pick("overview", "Production View Selector", ["Plant"]);
    await clickTableRow("overview", "prodView", "Plant C");
    var KCo = C.kpis(D, f({ plants: ["PLANT-C"] }));
    check("O6 Production View = Plant: row click selects the PLANT (sales and production of Plant C)", selIs("overview", "plants", "PLANT-C") && cardsOk("overview", { plants: ["PLANT-C"] }, ALL_K) &&
      near(KCo.productionActual, 704109.5, 0.05));
    await pick("overview", "Production View Selector", ["Product"]);
    check("O6 switching the View Selector to Product clears the plant selection made in that table", !selOf("overview"));
    await clickTableRow("overview", "prodView", "Industrial pellet Bulk 8 mm");
    check("O6 Production View = Product: row click selects the PRODUCT", selIs("overview", "products", "IB08"));
    check("O7a while IB08 is selected in Production View, the PvS table is cross-filtered to IB08 only", tableData("overview", "pvs").rows.length === 1 &&
      tableData("overview", "pvs").rows[0][0] === "Industrial pellet Bulk 8 mm" && !(await clickTableRow("overview", "pvs", "Premium pellet Bulk 6 mm")));
    await clickTableRow("overview", "prodView", "Premium pellet Bulk 6 mm");
    check("O7b another row of the source table replaces the selection (IB08 → PB06)", selIs("overview", "products", "PB06"));
    q('#page-overview .clear-sel').click(); await wait();
    await clickTableRow("overview", "pvs", "Premium pellet Bulk 6 mm");
    check("O7 PvS table row selects the product; PvS keeps 7 rows (6 dimmed), Sales View filtered", selIs("overview", "products", "PB06") &&
      tableData("overview", "pvs").rows.length === 7 && qa('#page-overview [data-table="pvs"] tr.dimmed-row').length === 6 && tableData("overview", "salesView").rows.length === 1);
    await clickChart("overview", "sales", "May 2023");
    check("O7 sales chart month replaces a product selection", selIs("overview", "ym", 202305));
    q('#page-overview .clear-sel').click(); await wait();
    ["salesView", "prodView", "pvs"].forEach(function (t) {
      q('#page-overview [data-table="' + t + '"] tfoot td').dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await wait();
    check("O8 Total rows never start a selection", !selOf("overview"));

    // slicers
    await clickChart("overview", "sales", "March 2024");
    await pick("overview", "Year", ["2023"]);
    check("O9 Year slicer 2023 excludes 2024-03 → selection cleared", !selOf("overview") && cardsOk("overview", { years: [2023] }, ALL_K));
    await clickChart("overview", "sales", "June 2023");
    check("O9 selecting a month within the slicer context works", selIs("overview", "ym", 202306) && cardsOk("overview", { years: [2023], months: [6] }, ALL_K));
    await reset("overview");
    await pick("overview", "Channel", ["Direct B2B"]);
    await clickTableRow("overview", "pvs", "Industrial pellet Bulk 6 mm");
    var pvsB2B = tableData("overview", "pvs").rows[0];
    check("O10 Channel slicer B2B + product selection: PvS still all channels (1,353,624 vs 1,380,410)", pvsB2B.slice(1, 3).join("|") === "1,353,624|1,380,410" &&
      cardsOk("overview", { channels: ["B2B"], products: ["IB06"] }, ALL_K), pvsB2B.join(" | "));
    check("O10 production KPIs not affected by the channel", near(C.kpis(D, f({ channels: ["B2B"], products: ["IB06"] })).productionActual, C.kpis(D, f({ products: ["IB06"] })).productionActual, 1e-9));
    await go("sales");
    check("O11 Overview selection is page-scoped: Sales Analysis shows the slicer context only (B2B)", cardsOk("sales", { channels: ["B2B"] }, SALES_K));
    await go("overview");
    check("O11 selection kept when returning to Overview", selIs("overview", "products", "IB06"));
    await reset("overview");
    check("O12 Reset clears slicers and selection", !selOf("overview") && cardsText("overview", ALL_K) === "2.43M 2.42M 6.48K 100.27% 2.41M 2.42M -12.9K 99.47%" && dimmedCats("overview", "sales") === 0);
    var kh = hitByTitle("overview", "prod", "October 2025");
    kh.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await wait();
    check("O13 keyboard: Enter on a month column selects it; 36 Tab stops per month chart", selIs("overview", "ym", 202510) &&
      qa('#page-overview [data-chart="sales"] [role="button"][tabindex="0"]').length === 36);
    await reset("overview");
    await pick("overview", "Plant", ["Plant A"]);
    await pick("overview", "Product", ["Industrial pellet Bulk 6 mm"]);
    check("O14 empty slicer context: no sources, no NaN, 'No data' shown", catCount("overview", "sales") === 0 && noBadText("overview") && qa("#page-overview .chart-empty").length >= 2);
    await reset("overview");

    // ======================= S. Sales Analysis cross-filtering
    section = "S";
    await go("sales");
    await reset("sales");
    check("S0 sources: 36 month columns, 7 view bars, 36 matrix month buttons (108 clickable cells), 7 table rows",
      catCount("sales", "combo") === 36 && catCount("sales", "byView") === 7 && qa('#page-sales [data-table="matrix"] .cell-select').length === 36 &&
      qa('#page-sales [data-table="matrix"] td[data-ym]').length === 108 && qa('#page-sales [data-table="view"] .row-select').length === 7);
    await clickChart("sales", "combo", "October 2025");
    var KO10 = C.kpis(D, f({ years: [2025], months: [10] }));
    var mxO = tableData("sales", "matrix");
    check("S1 combo October 2025 → YEAR+MONTH; KPIs = Oct 2025 (74,932 / 81,592 t as in the V1 screenshot)", selIs("sales", "ym", 202510) && cardsOk("sales", { years: [2025], months: [10] }, SALES_K) &&
      fmtT(KO10.salesActual) === "74,932" && fmtT(KO10.salesBudget) === "81,592", cardsText("sales", SALES_K));
    check("S1 matrix cross-filtered to October 2025 only", mxO.head.slice(1).join() === "October,Total" && mxO.rows.filter(function (r) { return /^\d{4}$/.test(r[0]); }).map(function (r) { return r[0]; }).join() === "2025" &&
      mxO.foot[0][mxO.foot[0].length - 1] === "74,932", mxO.head.join());
    var bvO = tips("sales", "byView");
    check("S1 view bars cross-highlighted with the October 2025 part (tooltip)", bvO.length === 7 && bvO.every(function (t) { return /t$/.test(t["Sales Actual Selected Period – October 2025"] || ""); }) &&
      tableTotal("sales", "view", 1) === "74,932");
    await clickMatrixCell("sales", "matrix", 202510, 1);
    check("S1 clicking the Oct 2025 cell (Budget row) toggles the same selection off", !selOf("sales"));
    await clickMatrixCell("sales", "matrix", 202403, 1);
    check("S2 matrix cell March 2024 → YEAR+MONTH; matrix keeps all cells, other months dimmed", selIs("sales", "ym", 202403) &&
      qa('#page-sales [data-table="matrix"] td.dimmed-cell').length === 105 && qa('#page-sales [data-table="matrix"] td.active-cell').length === 3 && dimmedCats("sales", "combo") === 35);
    q('#page-sales [data-table="matrix"] tfoot td').dispatchEvent(new MouseEvent("click", { bubbles: true }));
    q('#page-sales [data-table="matrix"] tbody td.b').dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await wait();
    check("S3 year-total column and grand-total rows are not selection sources", selIs("sales", "ym", 202403));
    q('#page-sales .clear-sel').click(); await wait();

    // dynamic Sales View: Channel
    await pick("sales", "Sales View Selector", ["Channel"]);
    var B9S = { "Direct B2B": ["B2B", "216,173|217,162|-989|99.54%"], "Distributor / Trader": ["DIST", "1,520,952|1,520,998|-46|100.00%"],
      "Industrial / Utility": ["IND", "638,226|629,769|8,457|101.34%"], "Retail / E-shop": ["RET", "54,228|55,170|-942|98.29%"] };
    var chBad = [];
    for (var chLabel of Object.keys(B9S)) {
      await clickChart("sales", "byView", chLabel);
      var vt = tableData("sales", "view");
      var e9 = B9S[chLabel];
      if (!(selIs("sales", "channels", e9[0]) && cardsOk("sales", { channels: [e9[0]] }, SALES_K) && vt.rows.length === 1 && vt.rows[0].slice(1).join("|") === e9[1] &&
        catCount("sales", "byView") === 4 && dimmedCats("sales", "byView") === 3)) chBad.push(chLabel + ": " + (vt.rows[0] || []).join("|"));
    }
    check("S4 View = Channel: each channel bar selects the CHANNEL; cards and table = B9 (B2B, DIST, IND, RET)", chBad.length === 0, chBad.join("; "));
    check("S4 channel selection never changes production (no production on this page; calc check)", C.kpis(D, f({ channels: ["RET"] })).productionActual === K0.productionActual);
    await clickChart("sales", "byView", "Retail / E-shop");
    check("S4 same channel again clears", !selOf("sales"));
    await clickTableRow("sales", "view", "Industrial / Utility");
    check("S5 table row (Channel view) selects the channel; table keeps 4 rows, 3 dimmed; bars highlighted", selIs("sales", "channels", "IND") &&
      tableData("sales", "view").rows.length === 4 && qa('#page-sales [data-table="view"] tr.dimmed-row').length === 3 && dimmedCats("sales", "byView") === 3);
    var cIND = tips("sales", "combo");
    var indM = C.aggSales(D, f({ channels: ["IND"] }), { key: function (r, c) { return r[c.y] * 100 + r[c.m]; } });
    check("S5 combo partial highlight = IND monthly sales", cIND.every(function (t, i) { var k = 202301 + Math.floor(i / 12) * 100 + (i % 12); return t["Sales Actual – Industrial / Utility"] === fmtT(indM.has(k) ? indM.get(k).a : 0) + " t"; }));
    await pick("sales", "Sales View Selector", ["Product"]);
    check("S6 changing the View Selector clears a selection made in that view", !selOf("sales"));
    await clickChart("sales", "byView", "Premium pellet 15 kg 6 mm");
    check("S6 View = Product: bar selects the PRODUCT (not a channel)", selIs("sales", "products", "P1506") && cardsOk("sales", { products: ["P1506"] }, SALES_K) &&
      tableData("sales", "view").rows[0].slice(1).join("|") === "465,628|472,800|-7,172|98.48%");
    await pick("sales", "Sales View Selector", ["Plant"]);
    await clickTableRow("sales", "view", "Plant B");
    check("S7 View = Plant: table row selects the PLANT", selIs("sales", "plants", "PLANT-B") && cardsOk("sales", { plants: ["PLANT-B"] }, SALES_K));
    // switching between visuals and dimensions
    await clickChart("sales", "combo", "February 2024");
    var s8a = selIs("sales", "ym", 202402);
    await clickChart("sales", "byView", "Plant D");
    var s8b = selIs("sales", "plants", "PLANT-D");
    await clickMatrixCell("sales", "matrix", 202311, 0);
    var s8c = selIs("sales", "ym", 202311) && cardsOk("sales", { years: [2023], months: [11] }, SALES_K);
    check("S8 combo month → plant bar → matrix cell: each replaces the selection", s8a && s8b && s8c);
    var cellBtn = q('#page-sales [data-table="matrix"] td[data-ym="202311"] .cell-select');
    check("S8 matrix month buttons have accessible names", !!cellBtn && /November 2023/.test(cellBtn.getAttribute("aria-label")) && cellBtn.getAttribute("aria-pressed") === "true");
    cellBtn.click(); await wait();
    check("S9 keyboard/button activation on the selected cell clears it", !selOf("sales"));
    await pick("sales", "Sales View Selector", ["Channel"]);
    await clickChart("sales", "byView", "Direct B2B");
    await pick("sales", "Channel", ["Retail / E-shop"]);
    check("S10 Channel slicer RET excludes the selected B2B → selection cleared", !selOf("sales") && cardsOk("sales", { channels: ["RET"] }, SALES_K) && catCount("sales", "byView") === 1);
    var bh = hits("sales", "byView")[0];
    bh.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await wait();
    check("S11 keyboard Enter on a view bar selects it", selIs("sales", "channels", "RET"));
    await reset("sales");
    check("S12 Reset: slicers, selectors and selection back to default", !selOf("sales") && slicerValue("sales", "Sales View Selector") === "Product" &&
      cardsText("sales", SALES_K) === "2.43M 2.42M 6.48K 100.27%" && qa('#page-sales td.dimmed-cell, #page-sales tr.dimmed-row, #page-sales rect.dimmed').length === 0);

    // ======================= R. Production Analysis cross-filtering
    section = "R";
    await go("production");
    function m2Col(label) { var t = tableData("production", "m2"); return t.foot.map(function (r) { return r[r.length - 1]; }); }
    check("R0 sources: 36+36 month columns, 2 × 36 matrix month buttons", catCount("production", "combo") === 36 && catCount("production", "pvs") === 36 &&
      qa('#page-production [data-table="m1"] .cell-select').length === 36 && qa('#page-production [data-table="m2"] .cell-select').length === 36);
    await clickChart("production", "combo", "July 2024");
    var F7 = { years: [2024], months: [7] };
    var sJul = C.total(C.aggSales(D, f(F7), { allChannels: true })).a, pJul = C.kpis(D, f(F7)).productionActual;
    check("R1 Production Actual vs Budget: July 2024 → YEAR+MONTH; KPIs = July 2024", selIs("production", "ym", 202407) && cardsOk("production", F7, PROD_K) && fmtT(pJul) === "49,669", cardsText("production", PROD_K));
    check("R1 matrices cross-filtered to July 2024 (49,669 produced, 68,273 sold, -18,604)", tableData("production", "m1").head.slice(1).join() === "July,Total" &&
      m2Col().join("|") === "49,669|68,273|-18,604", m2Col().join("|"));
    check("R1 period note follows the selection: 'July 2024: … 72.75%'", /^July 2024: Production vs Sales % = 72\.75%/.test(txt('#page-production [data-note="pvsPct"]')) &&
      fmtPct(pJul / sJul) === "72.75%", txt('#page-production [data-note="pvsPct"]'));
    check("R1 both charts cross-highlighted (35 of 36 months dimmed); % panels unchanged", dimmedCats("production", "combo") === 35 && dimmedCats("production", "pvs") === 35 &&
      !!q('#page-production [data-chart="pvs"] path'));
    await clickChart("production", "pvs", "July 2024");
    check("R2 same month clicked in the other chart clears the selection", !selOf("production") && periodNote() === "99.03%");
    await clickMatrixCell("production", "m2", 202501, 2);
    check("R3 PvS matrix cell January 2025 → selection; that matrix keeps all months (others dimmed), the other matrix is filtered",
      selIs("production", "ym", 202501) && qa('#page-production [data-table="m2"] td.dimmed-cell').length === 105 && tableData("production", "m1").head.slice(1).join() === "January,Total");
    check("R3a the filtered matrix offers only the selected month (no December 2023 cell)", !q('#page-production [data-table="m1"] td[data-ym="202312"]'));
    await clickMatrixCell("production", "m2", 202312, 0);
    check("R3 another month in the source matrix switches to December 2023", selIs("production", "ym", 202312) && cardsOk("production", { years: [2023], months: [12] }, PROD_K));
    q('#page-production .clear-sel').click(); await wait();

    // all-channel rule with a channel chosen on another page
    await go("sales");
    await pick("sales", "Channel", ["Direct B2B"]);
    await go("production");
    await clickChart("production", "pvs", "March 2024");
    var F3 = { years: [2024], months: [3] };
    var sMarAll = C.total(C.aggSales(D, f(F3), { allChannels: true })).a, pMar = C.kpis(D, f(F3)).productionActual;
    var tMar = hitByTitle("production", "pvs", "March 2024");
    var tipMar = hover(tMar);
    check("R4 Channel B2B kept elsewhere: Production Actual / Budget unchanged", A.state.f.channels.join() === "B2B" && cardsOk("production", F3, PROD_K));
    check("R4 PvS matrix, bars and % use ALL-channel sales for March 2024", m2Col().join("|") === [fmtT(pMar), fmtT(sMarAll), fmtT(pMar - sMarAll)].join("|") &&
      tipMar["Sales Actual"] === fmtT(sMarAll) + " t" && tipMar["Production vs Sales %"] === fmtPct(pMar / sMarAll) &&
      new RegExp("Production vs Sales % = " + fmtPct(pMar / sMarAll).replace(".", "\\.")).test(txt('#page-production [data-note="pvsPct"]')), m2Col().join("|"));
    await reset("production");

    // product slicer + month selection
    await pick("production", "Product", ["Premium pellet 15 kg 6 mm"]);
    await clickChart("production", "combo", "April 2023");
    var FPA = { products: ["P1506"], years: [2023], months: [4] };
    check("R5 Product slicer + month selection: KPIs and PvS matrix = product in April 2023 (all channels)", cardsOk("production", FPA, PROD_K) &&
      m2Col()[1] === fmtT(C.total(C.aggSales(D, f(FPA), { allChannels: true })).a));
    await pick("production", "Month", ["January"]);
    check("R6 Month slicer January excludes April → selection cleared", !selOf("production") && cardsOk("production", { products: ["P1506"], months: [1] }, PROD_K));
    await reset("production");
    var kp = hitByTitle("production", "pvs", "September 2025");
    kp.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    await wait();
    var hlT = hover(hitByTitle("production", "combo", "September 2025"));
    check("R7 keyboard Space selects September 2025; highlighted tooltip in the other chart", selIs("production", "ym", 202509) && /t$/.test(hlT["Production Actual – September 2025"] || ""), JSON.stringify(hlT));
    var cTop = q('#page-production [data-chart="combo"] svg').getBoundingClientRect().top, vTop = q('#page-production [data-chart="pvs"] svg').getBoundingClientRect().top;
    check("R8 symmetric charts stay aligned with a selection", Math.abs(cTop - vTop) < 1);
    await reset("production");
    check("R9 Reset restores full period (99.03%) and no dimmed months", !selOf("production") && periodNote() === "99.03%" && dimmedCats("production", "pvs") === 0);

    // ======================= Q. Product Analysis cross-filtering
    section = "Q";
    await go("product");
    await reset("product");
    function shareTips() { return tips("product", "share").map(function (t) { return t.title + "=" + t["Plant Production Share %"]; }).join(); }
    check("Q0 sources: 7 product columns in each chart, 4 plant rows, 4 plant share columns", catCount("product", "pb") === 7 && catCount("product", "ps") === 7 &&
      qa('#page-product [data-table="perf"] .row-select').length === 4 && catCount("product", "share") === 4);
    await clickChart("product", "pb", "Premium pellet 15 kg 6 mm");
    var FQ = { products: ["P1506"] };
    var shQ = C.plantShare(D, f(FQ));
    var expShare = Array.from(shQ.keys()).filter(function (k) { return shQ.get(k) !== null; }).sort().map(function (k) { return NAMES[k] + "=" + fmtPct(shQ.get(k)); }).join();
    check("Q1 product column → PRODUCT; KPIs = product (470K / 472K / -1.74K / 99.63%)", selIs("product", "products", "P1506") && cardsOk("product", FQ, PROD_K) &&
      cardsText("product", PROD_K) === "470K 472K -1.74K 99.63%", cardsText("product", PROD_K));
    check("Q1 both product charts highlight the product (6 of 7 dimmed); plant table filtered to the product (total 470,257)", dimmedCats("product", "pb") === 6 && dimmedCats("product", "ps") === 6 &&
      tableTotal("product", "perf", 1) === "470,257");
    check("Q1 Production Share % re-based to the product's output by plant (filter, not highlight)", shareTips() === expShare && qa('#page-product [data-chart="share"] rect.dimmed').length === 0, shareTips());
    await clickChart("product", "ps", "Premium pellet 15 kg 6 mm");
    check("Q2 same product clicked in the other chart clears", !selOf("product") && cardsOk("product", {}, PROD_K));
    await clickChart("product", "ps", "Industrial pellet Bulk 8 mm");
    await clickChart("product", "pb", "Premium pellet Bulk 6 mm");
    check("Q3 product → another product (across charts) replaces the selection", selIs("product", "products", "PB06") && cardsOk("product", { products: ["PB06"] }, PROD_K));
    q('#page-product .clear-sel').click(); await wait();

    await clickTableRow("product", "perf", "Plant C");
    var pcByProd = C.aggProd(D, f({ plants: ["PLANT-C"] }), { key: function (r, c) { return r[c.product]; } });
    var pbC = tips("product", "pb");
    check("Q4 plant row → PLANT; KPIs = Plant C; table keeps 4 rows (3 dimmed)", selIs("product", "plants", "PLANT-C") && cardsOk("product", { plants: ["PLANT-C"] }, PROD_K) &&
      tableData("product", "perf").rows.length === 4 && qa('#page-product [data-table="perf"] tr.dimmed-row').length === 3);
    check("Q4 product charts partially highlighted with Plant C's part (tooltip per product)", pbC.length === 7 && pbC.every(function (t) {
      var id = Object.keys(name).filter(function (k) { return name[k] === t.title; })[0];
      return t["Production Actual – Plant C"] === fmtT(pcByProd.has(id) ? pcByProd.get(id).a : 0) + " t";
    }) && qa('#page-product [data-chart="pb"] rect.bar-hl').length > 0, JSON.stringify(pbC[0]));
    var shC = tips("product", "share");
    check("Q4 share chart highlights Plant C (values unchanged: 12/20/29/39 %)", shC.map(function (t) { return Math.round(num(t["Plant Production Share %"])); }).join() === "12,20,29,39" &&
      qa('#page-product [data-chart="share"] rect.bar.dimmed').length === 3);
    await clickChart("product", "share", "Plant D");
    check("Q5 share column Plant D replaces the selection; aria-pressed on Plant D", selIs("product", "plants", "PLANT-D") &&
      hitByTitle("product", "share", "Plant D").getAttribute("aria-pressed") === "true");
    await clickChart("product", "pb", "Industrial pellet Bulk 6 mm");
    check("Q6 product column replaces a plant selection; share chart now filtered to IB06 plants", selIs("product", "products", "IB06") && catCount("product", "share") >= 1 &&
      qa('#page-product [data-chart="share"] rect.bar.dimmed').length === 0);
    await clickChart("product", "share", hits("product", "share").map(function (h) { return hover(h).title; })[0]);
    check("Q6 a plant column of the filtered share chart replaces the product selection", !!selOf("product") && selOf("product").field === "plants");
    q('#page-product .clear-sel').click(); await wait();
    await clickTableRow("product", "perf", "Plant B");
    check("Q7 Plant B = B9 (469K / 472K / -2.79K / 99.41%); table row 469,210 | 472,001 | -2,791 | 99.41%",
      cardsText("product", PROD_K) === "469K 472K -2.79K 99.41%" && tableData("product", "perf").rows.filter(function (r) { return r[0] === "Plant B"; })[0].slice(1).join("|") === "469,210|472,001|-2,791|99.41%");
    await clickTableRow("product", "perf", "Plant B");
    check("Q7 same row again clears", !selOf("product"));
    await clickChart("product", "pb", "Premium pellet 15 kg 6 mm");
    await pick("product", "Product", ["Industrial pellet Bulk 6 mm"]);
    check("Q8 Product slicer excluding the selected product clears the selection", !selOf("product") && cardsOk("product", { products: ["IB06"] }, PROD_K));
    await reset("product");
    await go("sales"); await pick("sales", "Channel", ["Direct B2B"]); await go("product");
    await clickChart("product", "ps", "Industrial pellet Bulk 6 mm");
    var psI = hover(hitByTitle("product", "ps", "Industrial pellet Bulk 6 mm"));
    check("Q9 Channel B2B elsewhere: Production vs Sales still uses all channels (1,353,624 vs 1,380,410)", psI["Production Actual"] === "1,353,624 t" &&
      psI["Sales Actual"] === "1,380,410 t" && psI["Sales Actual – Industrial pellet Bulk 6 mm"] === "1,380,410 t", JSON.stringify(psI));
    await reset("product");
    var qk = hitByTitle("product", "pb", "Premium pellet Big Bag 6 mm");
    qk.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await wait();
    check("Q10 keyboard Enter on a product column selects it; product columns have accessible names", selIs("product", "products", "PBB06") &&
      /Premium pellet Big Bag 6 mm/.test(qk.getAttribute("aria-label")));
    await go("plant");
    check("Q11 Product Analysis selection does not affect Plant Analysis", !A.state.selections.plant && cardsOk("plant", {}, PROD_K));
    await go("product");
    await reset("product");
    await pick("product", "Plant", ["Plant A"]);
    await pick("product", "Product", ["Industrial pellet Bulk 6 mm"]);
    check("Q12 empty slicer context on Product Analysis: no sources, no NaN", catCount("product", "pb") === 0 && noBadText("product"));
    await reset("product");
    check("Q13 Reset: no selection, nothing dimmed, full-period KPIs", !selOf("product") && cardsOk("product", {}, PROD_K) &&
      qa('#page-product rect.dimmed, #page-product tr.dimmed-row').length === 0);

    // regression of the documented totals after all interactions
    A.reset();
    await go("overview");
    check("Z1 regression: all eight Overview KPIs equal the audited full-period values", cardsText("overview", ALL_K) === "2.43M 2.42M 6.48K 100.27% 2.41M 2.42M -12.9K 99.47%");
    var kz = C.kpis(D, C.emptyFilters());
    check("Z2 regression: exact control totals unchanged", near(kz.salesActual, 2429578.7, 0.05) && near(kz.salesBudget, 2423099.1, 0.05) &&
      near(kz.productionActual, 2406082.3, 0.05) && near(kz.productionBudget, 2419001.0, 0.05));
    // layout: making a selection must not move the first chart or the tables on any page
    var jumps = [];
    var firstSel = { overview: ["sales", "March 2024"], sales: ["byView", "Premium pellet 15 kg 6 mm"], production: ["pvs", "July 2024"], product: ["pb", "Premium pellet 15 kg 6 mm"] };
    for (var pgz of Object.keys(firstSel)) {
      await go(pgz);
      var chartEls = qa("#page-" + pgz + " .chart svg");
      var before = chartEls.map(function (e) { return Math.round(e.getBoundingClientRect().top); }).join();
      await clickChart(pgz, firstSel[pgz][0], firstSel[pgz][1]);
      var after = qa("#page-" + pgz + " .chart svg").map(function (e) { return Math.round(e.getBoundingClientRect().top); }).join();
      if (!selOf(pgz) || before !== after) jumps.push(pgz + ": " + before + " → " + after);
      await reset(pgz);
    }
    check("Z3 layout (" + window.innerWidth + " px): selecting on Overview / Sales / Production / Product moves no chart", jumps.length === 0, jumps.join("; "));

    A.reset();
    await go("overview");
  }

  function finish() {
    var failed = results.filter(function (r) { return !r.pass; });
    var pre = document.createElement("pre");
    pre.id = "fulltest-out";
    pre.style.cssText = "position:fixed;inset:auto 0 0 0;max-height:45vh;overflow:auto;background:#fff;border-top:3px solid " + (failed.length ? "#C00000" : "#A8C9A0") + ";margin:0;padding:10px;font-size:11px;z-index:99";
    pre.textContent = "FULLTEST " + (failed.length ? "FAILED" : "PASSED") + " – " + (results.length - failed.length) + "/" + results.length + "\n" +
      results.map(function (r) { return (r.pass ? "PASS " : "FAIL ") + "[" + r.s + "] " + r.name + (r.detail !== "" ? "  [" + r.detail + "]" : ""); }).join("\n");
    document.body.appendChild(pre);
    document.title = "FULLTEST " + (failed.length ? "FAILED" : "PASSED");
  }
})();
