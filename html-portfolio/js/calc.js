/*
 * Pellet SC Dashboard – calculation layer.
 *
 * Re-implements the V1 Power BI DAX measures over the aggregated Gold-layer export.
 * Sales and production are kept in SEPARATE fact arrays (as in the semantic model) and are
 * never joined row-by-row, so quantities cannot be duplicated.
 *
 * Filter semantics (from the PBIR/TMDL definitions):
 *  - Year, Month, Plant, Product filter all four fact tables (shared dimensions).
 *  - Channel filters ONLY sales actual and sales budget (no relationship to production).
 *  - "All channels" variants ignore the channel filter, as in
 *    [Sales Actual Selected Period All Channels] (REMOVEFILTERS on dim_channel) and the
 *    NoFilter interaction on the Overview "Production vs Sales by Product (All Channel)" table.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PelletCalc = factory();
})(this, function () {
  "use strict";

  // Row layouts produced by tools/export_demo_data.py
  var S = { y: 0, m: 1, plant: 2, product: 3, channel: 4, a: 5, b: 6 };
  var P = { y: 0, m: 1, plant: 2, product: 3, a: 4, b: 5 };

  function emptyFilters() {
    return { years: [], months: [], plants: [], products: [], channels: [] };
  }

  function inSet(list, v) {
    return list.length === 0 || list.indexOf(v) !== -1;
  }

  function salesPass(r, f, ignoreChannel) {
    return inSet(f.years, r[S.y]) && inSet(f.months, r[S.m]) &&
      inSet(f.plants, r[S.plant]) && inSet(f.products, r[S.product]) &&
      (ignoreChannel || inSet(f.channels, r[S.channel]));
  }

  function prodPass(r, f) {
    return inSet(f.years, r[P.y]) && inSet(f.months, r[P.m]) &&
      inSet(f.plants, r[P.plant]) && inSet(f.products, r[P.product]);
  }

  /**
   * Aggregate sales rows. keyFn(row) returns a group key (or "" for a grand total).
   * Returns Map key -> {a: actual t, b: budget t, n: contributing rows}.
   */
  function aggSales(D, f, opts) {
    opts = opts || {};
    var keyFn = opts.key || function () { return ""; };
    var out = new Map();
    var rows = D.sales;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (!salesPass(r, f, !!opts.allChannels)) continue;
      var k = keyFn(r, S);
      var o = out.get(k);
      if (!o) { o = { a: 0, b: 0, n: 0 }; out.set(k, o); }
      o.a += r[S.a]; o.b += r[S.b]; o.n++;
    }
    return out;
  }

  function aggProd(D, f, opts) {
    opts = opts || {};
    var keyFn = opts.key || function () { return ""; };
    var out = new Map();
    var rows = D.production;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (!prodPass(r, f)) continue;
      var k = keyFn(r, P);
      var o = out.get(k);
      if (!o) { o = { a: 0, b: 0, n: 0 }; out.set(k, o); }
      o.a += r[P.a]; o.b += r[P.b]; o.n++;
    }
    return out;
  }

  function total(map) {
    var t = { a: 0, b: 0, n: 0 };
    map.forEach(function (o) { t.a += o.a; t.b += o.b; t.n += o.n; });
    return t;
  }

  // DAX: IF(Budget = 0, BLANK(), DIVIDE(Actual, Budget))  -> null = BLANK
  function attainment(actual, budget) {
    return budget === 0 ? null : actual / budget;
  }

  // DAX: DIVIDE([Production Actual], [Sales Actual])
  function ratio(num, den) {
    return den === 0 ? null : num / den;
  }

  /**
   * KPI card text, identical to the "... KPI Display" measures + formatStringDefinition:
   *   value scaled to K (<1M) or M; format chosen by |value|:
   *   <10K "0.00K", <100K "0.0K", <1M "0K", else "0.00M".
   */
  // Source quantities have 0.1 t precision; sums of them carry floating-point noise
  // (472000.4999999). Rounding to 0.1 t restores the exact decimal value for display.
  function denoise(v) { return Math.round(v * 10) / 10; }

  function kpiDisplay(v) {
    if (v === null || v === undefined || isNaN(v)) return "";
    v = denoise(v);
    var abs = Math.abs(v);
    var scaled, dec, suffix;
    if (abs < 1e6) { scaled = v / 1000; suffix = "K"; dec = abs < 1e4 ? 2 : abs < 1e5 ? 1 : 0; }
    else { scaled = v / 1e6; suffix = "M"; dec = 2; }
    var s = scaled.toFixed(dec);
    if (/^-0(\.0+)?$/.test(s)) s = s.slice(1);
    return s + suffix;
  }

  // Conditional font colour of the Attainment cards (PBIR rules: >=, <).
  function attainmentBand(v) {
    if (v === null || v === undefined) return "none";
    if (v >= 1.1 && v < 2) return "red";
    if (v >= 1.05 && v < 1.1) return "gold";
    if (v >= 0.95 && v < 1.05) return "green";
    if (v >= 0.9 && v < 0.95) return "gold";
    if (v >= 0 && v < 0.9) return "red";
    return "none";
  }

  /** Headline KPIs for the current filter context. */
  function kpis(D, f) {
    var s = total(aggSales(D, f));
    var p = total(aggProd(D, f));
    return {
      salesActual: s.a,
      salesBudget: s.b,
      salesVariance: s.a - s.b,
      salesAttainment: attainment(s.a, s.b),
      productionActual: p.a,
      productionBudget: p.b,
      productionVariance: p.a - p.b,
      productionAttainment: attainment(p.a, p.b)
    };
  }

  /**
   * Share of production by plant within the selected plants
   * (DAX: DIVIDE([Production Actual], CALCULATE([Production Actual], ALLSELECTED(plant_name)))).
   */
  function plantShare(D, f) {
    var byPlant = aggProd(D, f, { key: function (r, c) { return r[c.plant]; } });
    var t = total(byPlant).a;
    var out = new Map();
    byPlant.forEach(function (o, k) { out.set(k, t === 0 ? null : o.a / t); });
    return out;
  }

  return {
    S: S, P: P,
    emptyFilters: emptyFilters,
    aggSales: aggSales,
    aggProd: aggProd,
    total: total,
    attainment: attainment,
    ratio: ratio,
    kpiDisplay: kpiDisplay,
    denoise: denoise,
    attainmentBand: attainmentBand,
    kpis: kpis,
    plantShare: plantShare
  };
});
