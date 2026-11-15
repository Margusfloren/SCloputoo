/*
 * Pellet Supply Chain Management Dashboard – interactive web demonstration of the Power BI V1 report.
 * Static, offline-capable: data comes from data/demo-data.js (aggregated Gold-layer export).
 */
(function () {
  "use strict";

  var D = window.PELLET_DATA;
  var C = window.PelletCalc;
  var CH = window.PelletCharts;

  // Colours taken from the Power BI report definition (PBIR visual.json files)
  var GOLD = "#D6A84B", GREEN = "#A8C9A0", RED = "#C00000", MATRIX_RED = "#EB1F1F", LINE = "#E66C37";
  var PRODUCT_COLORS = {
    "Industrial Bulk 6 mm": "#356F91", "Industrial Bulk 8 mm": "#83B7C2",
    "Premium 15 kg 6 mm": "#3E845C", "Premium 15 kg 8 mm": "#A0AD4D",
    "Premium Big Bag 6 mm": "#765D9C", "Premium Big Bag 8 mm": "#C084A6",
    "Premium Bulk 6 mm": "#C99A46"
  };
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var MON = MONTHS.map(function (m) { return m.slice(0, 3); });
  var REPO = "https://github.com/Margusfloren/SCloputoo";

  var PAGES = [
    { id: "overview", title: "Overview" },
    { id: "sales", title: "Sales Analysis" },
    { id: "production", title: "Production Analysis" },
    { id: "plant", title: "Plant Analysis" },
    { id: "product", title: "Product Analysis" },
    { id: "about", title: "About the Project" }
  ];

  // ---------------------------------------------------------------- state
  var DEFAULT_SEL = { compare: "Budget", prodKpis: [], prodView: "Product", salesKpis: [], salesView: "Product" };
  var state = { page: "overview", f: C.emptyFilters(), sel: Object.assign({}, DEFAULT_SEL) };
  try {
    var saved = JSON.parse(sessionStorage.getItem("pelletDemoState") || "null");
    if (saved && saved.f && saved.sel) { state.f = Object.assign(C.emptyFilters(), saved.f); state.sel = Object.assign({}, DEFAULT_SEL, saved.sel); }
  } catch (e) { /* storage unavailable – start with defaults */ }
  // ---------------------------------------------------------------- visual interactions
  /*
   * Power BI-style interactions, kept in three separate layers:
   *  1. Slicer filters   – state.f: shared by all pages (like the synchronised V1 slicers).
   *  2. Visual selection – state.selections[page] = {visual, field, value}: ONE data point clicked in a chart
   *                        or table row on that page. Page-scoped; never applied to other pages.
   *                        field: "ym" (one year+month, value yyyymm), "plants", "products" or "channels".
   *  3. Interactions     – INTERACTIONS[page]: which visuals are selection sources and what each target does:
   *                          "filter"    → target recalculated with the selection (cross-filter)
   *                          "highlight" → target keeps all data; the selected part is drawn solid and the
   *                                        rest dimmed (cross-highlight; partial bars for other dimensions)
   *                          "none"      → no effect.
   *                        A source visual is never filtered by its own selection (it highlights itself),
   *                        unless sourceTargets says otherwise.
   * The V1 PBIR has no visualInteractions overrides except the Overview Channel slicer → PvS table (NoFilter)
   * and no report-level "filter instead of highlight" setting, so Power BI defaults apply: charts cross-highlight,
   * cards and matrices (which cannot highlight) are cross-filtered. Slicers are not changed by a selection.
   * Production vs Sales always uses all-channel sales (aggSales allChannels), so a channel selection cannot
   * change production values or the Production vs Sales comparison.
   */
  var FIELD_LABEL = {
    plants: function (v) { return plantName[v]; },
    products: function (v) { return productName[v]; },
    channels: function (v) { return channelName[v]; },
    ym: function (v) { return MONTHS[v % 100 - 1] + " " + Math.floor(v / 100); }
  };
  var INTERACTIONS = {
    overview: {
      sources: ["sales", "prod", "salesView", "prodView", "pvs"],
      targets: { kpis: "filter", sales: "highlight", prod: "highlight", salesView: "filter", prodView: "filter", pvs: "filter" }
    },
    sales: {
      sources: ["combo", "byView", "matrix", "view"],
      targets: { kpis: "filter", combo: "highlight", byView: "highlight", matrix: "filter", view: "filter" }
    },
    production: {
      sources: ["combo", "pvs", "m1", "m2"],
      targets: { kpis: "filter", combo: "highlight", pvs: "highlight", m1: "filter", m2: "filter", note: "filter" }
    },
    product: {
      sources: ["pb", "ps", "perf", "share"],
      targets: { kpis: "filter", pb: "highlight", ps: "highlight", perf: "filter", share: "highlight" },
      // a product selection re-bases the plant shares to that product (a % of a highlighted part is not meaningful)
      sourceTargets: { pb: { share: "filter" }, ps: { share: "filter" } }
    },
    plant: {
      field: "plants",
      sources: ["share", "mix", "pb", "perf"],
      targets: { kpis: "filter", perf: "filter", pb: "highlight", mix: "highlight", share: "highlight" },
      sourceTargets: { perf: { perf: "filter" } } // stage-1 behaviour kept: the table filters to the selected row
    }
  };
  state.selections = {};
  function selectionOf(page) { return state.selections[page] || null; }
  function interaction(page, target) {
    var s = selectionOf(page), cfg = INTERACTIONS[page];
    if (!s || !cfg) return "none";
    var over = cfg.sourceTargets && cfg.sourceTargets[s.visual];
    if (over && over[target]) return over[target];
    if (target === s.visual) return "highlight"; // a source never filters itself
    return cfg.targets[target] || "none";
  }
  function applySelection(f, s) {
    var g = Object.assign({}, f);
    if (s.field === "ym") { g.years = [Math.floor(s.value / 100)]; g.months = [s.value % 100]; }
    else g[s.field] = [s.value];
    return g;
  }
  /** Filter context for a target visual: slicer filters, plus the selection when the target is cross-filtered. */
  function contextFor(page, target) {
    return interaction(page, target) === "filter" ? applySelection(state.f, selectionOf(page)) : state.f;
  }
  /** Context of the highlighted part for a cross-highlighted target, or null. */
  function highlightContext(page, target) {
    return interaction(page, target) === "highlight" ? applySelection(state.f, selectionOf(page)) : null;
  }
  /** Selected value to highlight in a target (same-dimension highlight), or null. */
  function highlightFor(page, target, field) {
    var s = selectionOf(page);
    if (interaction(page, target) !== "highlight" || (field && s.field !== field)) return null;
    return s.value;
  }
  /** Same field+value again (from any source visual) clears; another value replaces the selection. */
  function toggleSelection(page, visual, value, field) {
    var cfg = INTERACTIONS[page];
    if (!cfg || cfg.sources.indexOf(visual) === -1) return;
    field = field || cfg.field;
    var cur = selectionOf(page);
    if (cur && cur.field === field && cur.value === value) delete state.selections[page];
    else state.selections[page] = { visual: visual, field: field, value: value };
    refresh();
  }
  function clearSelection(page) { delete state.selections[page]; refresh(); }
  /** Drop a selection whose value is not in the given domain (e.g. the Plant slicer excluded it). */
  function pruneSelection(page, domain) {
    var s = selectionOf(page);
    if (s && domain.indexOf(s.value) === -1) delete state.selections[page];
  }
  /** Values of a field that have data in the slicer context (sales ∪ production). */
  function fieldDomain(f, field, allChannels) {
    var key = field === "ym" ? keyYM : field === "plants" ? keyPlant : field === "products" ? keyProduct : keyChannel;
    var out = Array.from(C.aggSales(D, f, { key: key, allChannels: allChannels }).keys());
    if (field !== "channels") out = out.concat(Array.from(C.aggProd(D, f, { key: key }).keys()));
    return out;
  }
  /** Generic pruning: clear the page selection if the slicers no longer contain it. */
  function pruneToContext(page, allChannels) {
    var s = selectionOf(page);
    if (s) pruneSelection(page, fieldDomain(state.f, s.field, allChannels));
  }
  /** Clear a selection whose source visual now shows another dimension (e.g. a View Selector changed). */
  function pruneSourceField(page, visual, field) {
    var s = selectionOf(page);
    if (s && s.visual === visual && s.field !== field) delete state.selections[page];
  }
  /** Props that make chart category i (or table row key) a selection source. keyOf(i) -> value. */
  function selectable(page, visual, keyOf, field) {
    var s = selectionOf(page);
    field = field || INTERACTIONS[page].field;
    return {
      onSelect: function (i) { toggleSelection(page, visual, keyOf(i), field); },
      isSelected: function (i) { return !!s && s.field === field && s.value === keyOf(i); },
      selectLabel: function (i) { return FIELD_LABEL[field](keyOf(i)); }
    };
  }
  /** Boolean highlight(i) for a same-dimension cross-highlight, or undefined. */
  function highlightProps(page, target, keyOf, field) {
    var h = highlightFor(page, target, field);
    return h !== null ? function (i) { return keyOf(i) === h; } : undefined;
  }
  function selectionBar(root, page, slot, hint) {
    var bar = root.querySelector('[data-selection="' + slot + '"]');
    var s = selectionOf(page);
    if (s) {
      bar.innerHTML = '<span>Selected: <strong>' + esc(FIELD_LABEL[s.field](s.value)) + "</strong> – cards and tables filtered, charts highlighted.</span>" +
        '<button type="button" class="clear-sel">Clear selection</button>';
      bar.querySelector(".clear-sel").onclick = function () { clearSelection(page); };
    } else {
      bar.innerHTML = '<span class="hint">' + esc(hint) + "</span>";
    }
  }

  function persist() {
    try { sessionStorage.setItem("pelletDemoState", JSON.stringify({ f: state.f, sel: state.sel })); } catch (e) { /* ignore */ }
  }

  // ---------------------------------------------------------------- helpers
  function $(sel, root) { return (root || document).querySelector(sel); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmtT(v) {
    if (v === null || v === undefined) return "";
    // Source data has 0.1 t precision: remove floating-point noise first so exact halves
    // (e.g. -942.5, 472,000.5) round the same way as in the Power BI display.
    var r = Math.round(C.denoise(v));
    if (r === 0) r = 0; // avoid "-0"
    return r.toLocaleString("en-US");
  }
  function fmtTt(v) { return fmtT(v) + " t"; }
  function fmtPct(v) { return v === null || v === undefined ? "" : (v * 100).toFixed(2) + "%"; }

  var plantName = {}, productName = {}, channelName = {};
  var plants = [], products = [], channels = [], years = [];
  function productShort(id) { return (productName[id] || id).replace("pellet", "").replace(/\s+/g, " ").trim(); }
  function byName(map) { return function (a, b) { return String(map[a]).localeCompare(String(map[b]), "en"); }; }

  function initDims() {
    D.dims.plants.forEach(function (p) { plantName[p[0]] = p[1]; });
    D.dims.products.forEach(function (p) { productName[p[0]] = p[1]; });
    D.dims.channels.forEach(function (c) { channelName[c[0]] = c[1]; });
    var pl = new Set(), pr = new Set(), ch = new Set(), yr = new Set();
    D.sales.forEach(function (r) { pl.add(r[0 + 2]); pr.add(r[3]); ch.add(r[4]); yr.add(r[0]); });
    D.production.forEach(function (r) { pl.add(r[2]); pr.add(r[3]); yr.add(r[0]); });
    D.dims.plants.forEach(function (p) { pl.add(p[0]); });
    D.dims.products.forEach(function (p) { pr.add(p[0]); });
    D.dims.channels.forEach(function (c) { ch.add(c[0]); });
    plants = Array.from(pl).sort(byName(plantName));
    products = Array.from(pr).sort(byName(productName));
    channels = Array.from(ch).sort(byName(channelName));
    years = Array.from(yr).sort();
    plants.forEach(function (p) { if (!plantName[p]) plantName[p] = p; });
    products.forEach(function (p) { if (!productName[p]) productName[p] = p; });
    channels.forEach(function (c) { if (!channelName[c]) channelName[c] = c; });
  }

  var keyYM = function (r, c) { return r[c.y] * 100 + r[c.m]; };
  var keyPlant = function (r, c) { return r[c.plant]; };
  var keyProduct = function (r, c) { return r[c.product]; };
  var keyChannel = function (r, c) { return r[c.channel]; };

  function sortedKeys() {
    var s = new Set();
    for (var i = 0; i < arguments.length; i++) arguments[i].forEach(function (_, k) { s.add(k); });
    return Array.from(s).sort(function (a, b) { return a - b; });
  }
  function monthCats(keys) {
    return keys.map(function (k) {
      var y = Math.floor(k / 100), m = k % 100;
      return { label: MONTHS[m - 1], group: String(y), tip: MONTHS[m - 1] + " " + y };
    });
  }
  function val(map, k, f) { var o = map.get(k); return o ? o[f] : 0; }

  // ---------------------------------------------------------------- controls
  var openPop = null;
  document.addEventListener("click", function (e) {
    if (openPop && !openPop.contains(e.target)) closePop();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePop(); });
  function closePop() {
    if (!openPop) return;
    $(".slicer-pop", openPop).hidden = true;
    $(".slicer-btn", openPop).setAttribute("aria-expanded", "false");
    openPop = null;
  }

  var controls = []; // controls of the current page, updated on refresh

  /**
   * Power BI-style dropdown slicer.
   * cfg: {label, options:[{v,label}], get():array, set(array), single, theme}
   * Multi-select: empty array = All (no filter).
   */
  function dropdown(cfg) {
    var box = document.createElement("div");
    box.className = "slicer " + (cfg.theme || "");
    var id = "sl-" + Math.random().toString(36).slice(2, 8);
    box.innerHTML = '<div class="slicer-label" id="' + id + '">' + esc(cfg.label) + "</div>" +
      '<button type="button" class="slicer-btn" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="' + id + '">' +
      '<span class="slicer-val"></span><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.3"/></svg></button>' +
      '<div class="slicer-pop" role="listbox" hidden></div>';
    var btn = $(".slicer-btn", box), pop = $(".slicer-pop", box), valEl = $(".slicer-val", box);

    function labelOf(v) { for (var i = 0; i < cfg.options.length; i++) if (cfg.options[i].v === v) return cfg.options[i].label; return v; }
    function renderPop() {
      var cur = cfg.get();
      var hh = "";
      if (!cfg.single) {
        hh += '<label class="opt opt-all"><input type="checkbox" data-all ' + (cur.length === 0 ? "checked" : "") + "> Select all</label>";
      }
      cfg.options.forEach(function (o, i) {
        var on = cfg.single ? cur[0] === o.v : cur.indexOf(o.v) !== -1;
        hh += '<label class="opt"><input type="' + (cfg.single ? "radio" : "checkbox") + '" name="' + id + '" data-i="' + i + '" ' + (on ? "checked" : "") + "> " + esc(o.label) + "</label>";
      });
      pop.innerHTML = hh;
    }
    pop.addEventListener("change", function (e) {
      var t = e.target;
      if (t.hasAttribute("data-all")) { cfg.set([]); }
      else {
        var o = cfg.options[+t.getAttribute("data-i")];
        if (cfg.single) { cfg.set([o.v]); closePop(); }
        else {
          var cur = cfg.get().slice();
          var ix = cur.indexOf(o.v);
          if (ix === -1) cur.push(o.v); else cur.splice(ix, 1);
          if (cur.length === cfg.options.length) cur = [];
          cfg.set(cur);
        }
      }
      if (openPop === box) renderPop();
      refresh();
    });
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (openPop === box) { closePop(); return; }
      closePop();
      renderPop();
      pop.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      openPop = box;
    });
    box.update = function () {
      var cur = cfg.get();
      valEl.textContent = cur.length === 0 ? "All" : cur.length === 1 ? labelOf(cur[0]) : "Multiple selections";
      box.classList.toggle("is-filtered", cur.length > 0 && !cfg.single);
    };
    controls.push(box);
    return box;
  }

  function filterSlicer(key, label, theme) {
    var opts = {
      years: years.map(function (y) { return { v: y, label: String(y) }; }),
      months: MONTHS.map(function (m, i) { return { v: i + 1, label: m }; }),
      plants: plants.map(function (p) { return { v: p, label: plantName[p] }; }),
      products: products.map(function (p) { return { v: p, label: productName[p] }; }),
      channels: channels.map(function (c) { return { v: c, label: channelName[c] }; })
    }[key];
    return dropdown({
      label: label, options: opts, theme: theme,
      get: function () { return state.f[key]; },
      set: function (v) { state.f[key] = v; }
    });
  }

  function selectorSlicer(key, label, options, single, theme) {
    return dropdown({
      label: label, options: options.map(function (o) { return { v: o, label: o }; }), single: single, theme: theme,
      get: function () { var v = state.sel[key]; return Array.isArray(v) ? v : [v]; },
      set: function (v) { state.sel[key] = single ? v[0] : v; }
    });
  }

  function resetButton() {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "reset-btn";
    b.textContent = "Reset filters";
    b.addEventListener("click", function () { resetAll(); });
    return b;
  }
  function resetAll() {
    state.f = C.emptyFilters();
    state.sel = Object.assign({}, DEFAULT_SEL);
    state.selections = {};
    closePop();
    refresh();
  }

  function compareToggle() {
    var box = document.createElement("div");
    box.className = "slicer compare";
    box.innerHTML = '<div class="slicer-label">Compare production with</div><div class="seg" role="radiogroup" aria-label="Compare production with">' +
      '<button type="button" role="radio" data-v="Budget">Budget</button><button type="button" role="radio" data-v="Sales">Sales</button></div>';
    box.addEventListener("click", function (e) {
      var v = e.target.getAttribute && e.target.getAttribute("data-v");
      if (v) { state.sel.compare = v; refresh(); }
    });
    box.update = function () {
      box.querySelectorAll("button").forEach(function (b) {
        var on = b.getAttribute("data-v") === state.sel.compare;
        b.classList.toggle("on", on);
        b.setAttribute("aria-checked", on ? "true" : "false");
      });
    };
    controls.push(box);
    return box;
  }

  function plantTiles() {
    var box = document.createElement("div");
    box.className = "slicer tiles prod";
    var hh = '<div class="slicer-label">Plant</div><div class="tile-row"><button type="button" data-v="">Select all</button>';
    plants.forEach(function (p) { hh += '<button type="button" data-v="' + esc(p) + '">' + esc(plantName[p]) + "</button>"; });
    box.innerHTML = hh + "</div>";
    box.addEventListener("click", function (e) {
      var v = e.target.getAttribute && e.target.getAttribute("data-v");
      if (v === null || v === undefined) return;
      if (v === "") state.f.plants = [];
      else {
        var cur = state.f.plants.slice(), ix = cur.indexOf(v);
        if (ix === -1) cur.push(v); else cur.splice(ix, 1);
        if (cur.length === plants.length) cur = [];
        state.f.plants = cur;
      }
      refresh();
    });
    box.update = function () {
      box.querySelectorAll("button").forEach(function (b) {
        var v = b.getAttribute("data-v");
        var on = v === "" ? state.f.plants.length === 0 : state.f.plants.indexOf(v) !== -1;
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    };
    controls.push(box);
    return box;
  }

  // ---------------------------------------------------------------- KPI cards
  var KPI_DEFS = {
    salesActual: { label: "Sales Actual<br>Selected Period", theme: "sales" },
    salesBudget: { label: "Sales Budget<br>Selected Period", theme: "sales" },
    salesVariance: { label: "Sales Variance<br>Selected Period", theme: "sales" },
    salesAttainment: { label: "Sales Attainment<br>Selected Period", theme: "sales", pct: true },
    productionActual: { label: "Production Actual<br>Selected Period", theme: "prod" },
    productionBudget: { label: "Production Budget<br>Selected Period", theme: "prod" },
    productionVariance: { label: "Production Variance<br>Selected Period", theme: "prod" },
    productionAttainment: { label: "Production Attainment<br>Selected Period", theme: "prod", pct: true }
  };
  function kpiCards(keys) {
    return '<div class="kpi-grid">' + keys.map(function (k) {
      var d = KPI_DEFS[k];
      return '<div class="kpi ' + d.theme + '" data-kpi="' + k + '" tabindex="0"><div class="kpi-value"></div><div class="kpi-label">' + d.label + "</div></div>";
    }).join("") + "</div>";
  }
  function updateKpis(root, k) {
    root.querySelectorAll("[data-kpi]").forEach(function (card) {
      var key = card.getAttribute("data-kpi"), d = KPI_DEFS[key], v = k[key];
      var valEl = $(".kpi-value", card);
      if (d.pct) {
        valEl.textContent = v === null ? "(Blank)" : fmtPct(v);
        valEl.setAttribute("data-band", C.attainmentBand(v));
      } else {
        valEl.textContent = C.kpiDisplay(v);
      }
      card.setAttribute("aria-label", card.textContent.replace(/\s+/g, " ") + ": " + (d.pct ? fmtPct(v) : fmtTt(v)));
      card.onmousemove = function (evt) {
        var rows = d.pct ? [{ name: "Attainment", value: v === null ? "(Blank) – no budget" : fmtPct(v) }]
          : [{ name: "Exact value", value: fmtTt(v) }];
        CH_tip(evt, $(".kpi-label", card).textContent, rows);
      };
      card.onmouseleave = CH.hideTip;
    });
  }
  function CH_tip(evt, title, rows) {
    // reuse the chart tooltip element
    var t = document.querySelector(".chart-tip");
    if (!t) { t = document.createElement("div"); t.className = "chart-tip"; document.body.appendChild(t); }
    t.innerHTML = '<div class="tip-title">' + esc(title) + "</div>" + rows.map(function (r) {
      return '<div class="tip-row"><span class="tip-name">' + esc(r.name) + '</span><span class="tip-val">' + esc(r.value) + "</span></div>";
    }).join("");
    t.style.display = "block";
    var x = evt.clientX + 14, y = evt.clientY + 14;
    if (x + t.offsetWidth > window.innerWidth - 8) x = evt.clientX - t.offsetWidth - 14;
    t.style.left = x + "px"; t.style.top = y + "px";
  }

  // ---------------------------------------------------------------- tables
  /**
   * cfg: {dimLabel, rows:[{label, o}], total:o, cols:[{name, get(o), fmt, red(v)}], theme}
   */
  function dataTable(container, cfg) {
    if (!cfg.rows.length) { container.innerHTML = '<div class="chart-empty">No data for the current filter selection.</div>'; return; }
    var hh = '<div class="table-scroll"><table class="pbi-table ' + cfg.theme + '"><thead><tr><th scope="col">' + esc(cfg.dimLabel) + "</th>";
    cfg.cols.forEach(function (c) { hh += '<th scope="col" class="num">' + esc(c.name) + "</th>"; });
    hh += "</tr></thead><tbody>";
    function cells(o) {
      return cfg.cols.map(function (c) {
        var v = c.get(o);
        var red = c.red && v !== null && c.red(v);
        return '<td class="num' + (red ? " neg" : "") + '">' + esc(c.fmt(v)) + "</td>";
      }).join("");
    }
    var sel = cfg.select; // optional {onSelect(key), isSelected(key), selectLabel(key)} – rows as selection source
    cfg.rows.forEach(function (r) {
      if (sel && r.key !== undefined) {
        var on = sel.isSelected(r.key);
        // cfg.highlightKey: this table is the selection source → other rows dimmed, not removed
        var dimRow = cfg.highlightKey !== undefined && cfg.highlightKey !== null && cfg.highlightKey !== r.key;
        hh += '<tr class="selectable' + (on ? " active" : "") + (dimRow ? " dimmed-row" : "") + '" data-key="' + esc(r.key) + '"><th scope="row">' +
          '<button type="button" class="row-select" aria-pressed="' + on + '" aria-label="' + esc(sel.selectLabel(r.key)) +
          (on ? " – selected, activate to clear the selection" : " – activate to select") + '">' + esc(r.label) + "</button></th>" + cells(r.o) + "</tr>";
      } else {
        hh += '<tr><th scope="row">' + esc(r.label) + "</th>" + cells(r.o) + "</tr>";
      }
    });
    // the Total row is never a selection source
    hh += '</tbody><tfoot><tr><th scope="row">Total</th>' + cells(cfg.total) + "</tr></tfoot></table></div>";
    container.innerHTML = hh;
    container.onclick = sel ? function (e) {
      var tr = e.target.closest && e.target.closest("tr[data-key]");
      if (tr && container.contains(tr)) sel.onSelect(tr.getAttribute("data-key"));
    } : null;
  }

  function sumObjs(list) {
    var t = {};
    list.forEach(function (o) { for (var k in o) t[k] = (t[k] || 0) + o[k]; });
    return t;
  }

  /**
   * Year x month matrix with measures on rows (as the Power BI matrices).
   * byYM: Map yyyymm -> object of base fields; measures: [{name, get(o), red(v)}]
   */
  /*
   * ix (optional): {select: selectable(...) with keyOf = identity (yyyymm), highlight: yyyymm | null}
   * Month cells inside a year are selection sources for that YEAR+MONTH; year totals and the grand-total
   * rows are not. The first measure row of each year carries keyboard buttons (one per month).
   */
  function ymMatrix(container, byYM, measures, theme, redColor, ix) {
    ix = ix || {};
    var keys = Array.from(byYM.keys()).sort(function (a, b) { return a - b; });
    if (!keys.length) { container.innerHTML = '<div class="chart-empty">No data for the current filter selection.</div>'; return; }
    var ys = [], ms = [];
    keys.forEach(function (k) { var y = Math.floor(k / 100), m = k % 100; if (ys.indexOf(y) === -1) ys.push(y); if (ms.indexOf(m) === -1) ms.push(m); });
    ms.sort(function (a, b) { return a - b; });
    var hh = '<div class="table-scroll"><table class="pbi-table matrix ' + theme + '"><thead><tr><th scope="col">Year</th>';
    ms.forEach(function (m) { hh += '<th scope="col" class="num">' + MONTHS[m - 1] + "</th>"; });
    hh += '<th scope="col" class="num">Total</th></tr></thead><tbody>';
    function cell(o, ms_) {
      if (!o) return '<td class="num"></td>';
      var v = ms_.get(o);
      var red = ms_.red && ms_.red(v);
      return '<td class="num"' + (red ? ' style="color:' + redColor + '"' : "") + ">" + esc(fmtT(v)) + "</td>";
    }
    // wrap a month cell as a selection source (and dim it when another month is highlighted)
    function selCell(td, key, withButton) {
      if (!ix.select || !byYM.has(key)) return td;
      var on = ix.select.isSelected(key), dim = ix.highlight != null && ix.highlight !== key;
      var cls = ' sel-cell' + (on ? " active-cell" : "") + (dim ? " dimmed-cell" : "");
      td = td.replace('<td class="num', '<td data-ym="' + key + '" class="num' + cls);
      if (withButton) {
        td = td.replace(/>([^<]*)<\/td>$/, '><button type="button" class="cell-select" aria-pressed="' + on + '" aria-label="' +
          esc(ix.select.selectLabel(key)) + (on ? " – selected, activate to clear the selection" : " – activate to select") + '">$1</button></td>');
      }
      return td;
    }
    ys.forEach(function (y) {
      hh += '<tr class="grp"><th scope="rowgroup" colspan="' + (ms.length + 2) + '">' + y + "</th></tr>";
      var yearObjs = [];
      ms.forEach(function (m) { var o = byYM.get(y * 100 + m); if (o) yearObjs.push(o); });
      var yt = sumObjs(yearObjs);
      measures.forEach(function (me, i) {
        hh += '<tr class="' + (i % 2 ? "band" : "") + '"><th scope="row" class="ind">' + esc(me.name) + "</th>";
        ms.forEach(function (m) { hh += selCell(cell(byYM.get(y * 100 + m), me), y * 100 + m, i === 0 && byYM.has(y * 100 + m)); });
        hh += cell(yt, me).replace('class="num"', 'class="num b"') + "</tr>";
      });
    });
    hh += "</tbody><tfoot>";
    measures.forEach(function (me) {
      hh += '<tr><th scope="row">' + esc(me.name) + "</th>";
      ms.forEach(function (m) {
        var objs = [];
        ys.forEach(function (y) { var o = byYM.get(y * 100 + m); if (o) objs.push(o); });
        hh += cell(objs.length ? sumObjs(objs) : null, me);
      });
      hh += cell(sumObjs(Array.from(byYM.values())), me) + "</tr>";
    });
    container.innerHTML = hh + "</tfoot></table></div>";
    container.onclick = ix.select ? function (e) {
      var td = e.target.closest && e.target.closest("td[data-ym]");
      if (td && container.contains(td)) ix.select.onSelect(+td.getAttribute("data-ym"));
    } : null;
  }

  // column definitions (DAX equivalents)
  var neg = function (v) { return v < 0; };
  var below100 = function (v) { return v !== null && v < 1; };
  var SALES_COLS = {
    "Sales Actual": { name: "Sales Actual", get: function (o) { return o.a; }, fmt: fmtT },
    "Sales Budget": { name: "Sales Budget", get: function (o) { return o.b; }, fmt: fmtT },
    "Sales Variance": { name: "Sales Variance", get: function (o) { return o.a - o.b; }, fmt: fmtT, red: neg },
    "Sales Attainment": { name: "Sales Attainment", get: function (o) { return C.attainment(o.a, o.b); }, fmt: fmtPct, red: below100 }
  };
  var SALES_KPI_OPTIONS = ["Sales Actual", "Sales Budget", "Sales Variance", "Sales Attainment"];
  function prodCols(attainmentRed) {
    return {
      "Production Actual": { name: "Production Actual", get: function (o) { return o.a; }, fmt: fmtT },
      "Production Budget": { name: "Production Budget", get: function (o) { return o.b; }, fmt: fmtT },
      "Production Variance": { name: "Production Variance", get: function (o) { return o.a - o.b; }, fmt: fmtT, red: neg },
      "Production Attainment": { name: "Production Attainment", get: function (o) { return C.attainment(o.a, o.b); }, fmt: fmtPct, red: attainmentRed ? below100 : null }
    };
  }
  var PROD_KPI_OPTIONS = ["Production Actual", "Production Budget", "Production Variance", "Production Attainment"];
  function pick(cols, selected, all) {
    var keys = selected.length ? all.filter(function (k) { return selected.indexOf(k) !== -1; }) : all;
    return keys.map(function (k) { return cols[k]; });
  }

  function dimRows(map, names) {
    return Array.from(map.keys()).filter(function (k) { var o = map.get(k); return o.a !== 0 || o.b !== 0; })
      .sort(function (a, b) { return String(names[a]).localeCompare(String(names[b]), "en"); })
      .map(function (k) { return { key: k, label: names[k], o: map.get(k) }; });
  }

  // ---------------------------------------------------------------- page scaffolding
  function slot(name) { return '<div data-slot="' + name + '"></div>'; }
  function panel(title, body, extraClass) {
    return '<section class="panel ' + (extraClass || "") + '"><h2 class="panel-title">' + title + "</h2>" + body + "</section>";
  }
  function chart(name) { return '<div class="chart" data-chart="' + name + '"></div>'; }
  function tableBox(name) { return '<div class="tbl" data-table="' + name + '"></div>'; }
  function put(root, name, node) { var s = root.querySelector('[data-slot="' + name + '"]'); s.appendChild(node); }
  function channelNote() {
    var sel = state.f.channels.length ? " Your channel selection is kept for the Overview and Sales Analysis pages." : "";
    return '<p class="note">Sales channel filter does not apply on this page: production is not allocated to sales channels, so sales comparisons here use all channels.' + sel + "</p>";
  }

  var pages = {};

  // ---------------------------------------------------------------- shared interaction helpers for pages
  var identity = function (k) { return k; };
  /** Name of the current selection for tooltips of highlighted parts, or undefined. */
  function hlName(page) { var s = selectionOf(page); return s ? FIELD_LABEL[s.field](s.value) : undefined; }
  /** Table as selection source: rows keyed by `field`; when it is the source, other rows are dimmed. */
  function tableSel(page, visual, field) {
    return { select: selectable(page, visual, identity, field), highlightKey: highlightFor(page, visual, field) };
  }
  /** Matrix (year × month) as selection source of YEAR+MONTH. */
  function matrixSel(page, visual) {
    return { select: selectable(page, visual, identity, "ym"), highlight: highlightFor(page, visual, "ym") };
  }
  /** Highlighted values for a chart series: fn(hctx) evaluated in the highlight context, or undefined. */
  function hlSeries(page, target, fn) {
    var h = highlightContext(page, target);
    return h ? fn(h) : undefined;
  }
  function selectionSlot() { return '<div class="selection-bar" data-selection="page"></div>'; }

  // ===== Overview (V1 Dashboard)
  pages.overview = {
    build: function (root) {
      root.innerHTML =
        '<div class="intro"><p><strong>Interactive web version of the Power BI V1 management dashboard.</strong> Explore 2023–2025 sales, production and budget performance with the filters below. All figures are <strong>synthetic</strong> and come from a static, aggregated export of the PostgreSQL Gold layer – this page is not connected live to PostgreSQL or Power BI. <a href="#/about">About the project</a></p></div>' +
        '<div class="top">' + kpiCards(["salesActual", "salesBudget", "salesVariance", "salesAttainment", "productionActual", "productionBudget", "productionVariance", "productionAttainment"]) +
        '<div class="controls">' + slot("filters") + '<div class="controls-row">' + slot("compare") + slot("reset") + "</div>" + selectionSlot() + "</div></div>" +
        '<div class="grid-2">' +
        panel("Sales Actual vs Budget", chart("sales")) +
        panel('<span data-title="prod"></span>', chart("prod") + '<div data-note="prod"></div><div class="selector-row">' + slot("prodsel") + "</div>") +
        "</div>" +
        '<div class="grid-3">' +
        panel("Sales View", tableBox("salesView")) +
        panel("Production View", tableBox("prodView")) +
        panel("Production vs Sales by Product (All Channels)", tableBox("pvs") + '<p class="note small">Uses sales across all channels, regardless of the Channel filter – production is not allocated to sales channels.</p>') +
        "</div>";
      var fs = $('[data-slot="filters"]', root);
      fs.className = "slicers";
      [["years", "Year"], ["months", "Month"], ["plants", "Plant"], ["products", "Product"], ["channels", "Channel"]].forEach(function (x) { fs.appendChild(filterSlicer(x[0], x[1], "sales")); });
      put(root, "compare", compareToggle());
      put(root, "reset", resetButton());
      var ps = $('[data-slot="prodsel"]', root);
      ps.className = "selectors";
      ps.appendChild(selectorSlicer("prodKpis", "Production KPI Selector", PROD_KPI_OPTIONS, false, "plain"));
      ps.appendChild(selectorSlicer("prodView", "Production View Selector", ["Plant", "Product"], true, "plain"));
    },
    update: function (root) {
      var P = "overview", f = state.f;
      var viewPlant = state.sel.prodView === "Plant";
      var prodViewField = viewPlant ? "plants" : "products";
      pruneSourceField(P, "prodView", prodViewField);
      pruneToContext(P, false);
      var name = hlName(P);
      updateKpis(root, C.kpis(D, contextFor(P, "kpis")));

      // Sales Actual vs Budget – source: one YEAR+MONTH
      var sM = C.aggSales(D, f, { key: keyYM });
      var sk = sortedKeys(sM);
      var sH = hlSeries(P, "sales", function (h) { return C.aggSales(D, h, { key: keyYM }); });
      CH.columns($('[data-chart="sales"]', root), Object.assign(selectable(P, "sales", function (i) { return sk[i]; }, "ym"), {
        categories: monthCats(sk), fmt: fmtTt, aria: "Monthly sales actual versus budget", hlName: name,
        series: [
          { name: "Sales Actual", color: GOLD, values: sk.map(function (k) { return val(sM, k, "a"); }), hl: sH && sk.map(function (k) { return val(sH, k, "a"); }) },
          { name: "Sales Budget", color: GREEN, values: sk.map(function (k) { return val(sM, k, "b"); }), hl: sH && sk.map(function (k) { return val(sH, k, "b"); }) }
        ],
        extraTip: function (i) { var a = val(sM, sk[i], "a"), b = val(sM, sk[i], "b"); return [{ name: "Variance", value: fmtTt(a - b) }, { name: "Attainment", value: fmtPct(C.attainment(a, b)) || "(Blank)" }]; }
      }));

      // Production chart – source: one YEAR+MONTH; the Sales option always uses all channels
      var pM = C.aggProd(D, f, { key: keyYM });
      var cmpSales = state.sel.compare === "Sales";
      var cM = cmpSales ? C.aggSales(D, f, { key: keyYM, allChannels: true }) : null;
      var pk = cmpSales ? sortedKeys(pM, cM) : sortedKeys(pM);
      var pH = hlSeries(P, "prod", function (h) { return C.aggProd(D, h, { key: keyYM }); });
      var cH = cmpSales ? hlSeries(P, "prod", function (h) { return C.aggSales(D, h, { key: keyYM, allChannels: true }); }) : null;
      $('[data-title="prod"]', root).textContent = cmpSales ? "Production Actual vs Sales" : "Production Actual vs Budget";
      CH.columns($('[data-chart="prod"]', root), Object.assign(selectable(P, "prod", function (i) { return pk[i]; }, "ym"), {
        categories: monthCats(pk), fmt: fmtTt, aria: "Monthly production comparison", hlName: name,
        series: [
          cmpSales ? { name: "Sales Actual (all channels)", color: GREEN, values: pk.map(function (k) { return val(cM, k, "a"); }), hl: cH && pk.map(function (k) { return val(cH, k, "a"); }) }
            : { name: "Budget", color: GREEN, values: pk.map(function (k) { return val(pM, k, "b"); }), hl: pH && pk.map(function (k) { return val(pH, k, "b"); }) },
          { name: "Production Actual", color: GOLD, values: pk.map(function (k) { return val(pM, k, "a"); }), hl: pH && pk.map(function (k) { return val(pH, k, "a"); }) }
        ],
        extraTip: function (i) {
          var p = val(pM, pk[i], "a");
          return cmpSales ? [{ name: "Production vs Sales", value: fmtTt(p - val(cM, pk[i], "a")) }]
            : [{ name: "Production Variance", value: fmtTt(p - val(pM, pk[i], "b")) }];
        }
      }));
      $('[data-note="prod"]', root).innerHTML = cmpSales ? '<p class="note small">Sales across all channels – the Channel filter is not applied to this comparison.</p>' : "";

      // Sales View – source: PRODUCT
      var sP = C.aggSales(D, contextFor(P, "salesView"), { key: keyProduct });
      dataTable($('[data-table="salesView"]', root), Object.assign(tableSel(P, "salesView", "products"), {
        dimLabel: "Product", theme: "sales", rows: dimRows(sP, productName), total: C.total(sP),
        cols: pick(SALES_COLS, [], SALES_KPI_OPTIONS)
      }));

      // Production View – source: PLANT or PRODUCT (follows the Production View Selector)
      var pV = C.aggProd(D, contextFor(P, "prodView"), { key: viewPlant ? keyPlant : keyProduct });
      dataTable($('[data-table="prodView"]', root), Object.assign(tableSel(P, "prodView", prodViewField), {
        dimLabel: viewPlant ? "Plant" : "Product", theme: "prod",
        rows: dimRows(pV, viewPlant ? plantName : productName), total: C.total(pV),
        cols: pick(prodCols(true), state.sel.prodKpis, PROD_KPI_OPTIONS)
      }));

      // Production vs Sales by Product (all channels) – source: PRODUCT
      var pf = contextFor(P, "pvs");
      var pP = C.aggProd(D, pf, { key: keyProduct });
      var sPall = C.aggSales(D, pf, { key: keyProduct, allChannels: true });
      var keys = Array.from(new Set(Array.from(pP.keys()).concat(Array.from(sPall.keys()))))
        .filter(function (k) { return val(pP, k, "a") !== 0 || val(sPall, k, "a") !== 0; })
        .sort(function (a, b) { return productName[a].localeCompare(productName[b], "en"); });
      var rows = keys.map(function (k) { return { key: k, label: productName[k], o: { p: val(pP, k, "a"), s: val(sPall, k, "a") } }; });
      dataTable($('[data-table="pvs"]', root), Object.assign(tableSel(P, "pvs", "products"), {
        dimLabel: "Product", theme: "accent", rows: rows, total: sumObjs(rows.map(function (r) { return r.o; })),
        cols: [
          { name: "Production Actual", get: function (o) { return o.p; }, fmt: fmtT },
          { name: "Sales Actual", get: function (o) { return o.s; }, fmt: fmtT },
          { name: "Production vs Sales", get: function (o) { return o.p - o.s; }, fmt: fmtT, red: neg },
          { name: "Production vs Sales %", get: function (o) { return C.ratio(o.p, o.s); }, fmt: fmtPct, red: below100 }
        ]
      }));
      selectionBar(root, P, "page", "Click a month in a chart, or a product or plant row in a table, to cross-filter the cards and tables and highlight the charts.");
    }
  };

  // ===== Sales Analysis
  pages.sales = {
    build: function (root) {
      root.innerHTML =
        '<div class="top">' + kpiCards(["salesActual", "salesBudget", "salesVariance", "salesAttainment"]) +
        '<div class="controls">' + slot("filters") + '<div class="controls-row">' + slot("sel") + slot("reset") + "</div>" + selectionSlot() + "</div></div>" +
        '<div class="grid-2">' +
        panel("Sales Actual vs Budget", chart("combo")) +
        panel("Sales by Selected View", chart("byView")) +
        "</div>" +
        '<div class="grid-2 wide-left tables">' +
        panel("Sales Actual vs Budget", tableBox("matrix")) +
        panel("Sales View", tableBox("view")) +
        "</div>";
      var fs = $('[data-slot="filters"]', root);
      fs.className = "slicers";
      [["years", "Year"], ["months", "Month"], ["plants", "Plant"], ["products", "Product"], ["channels", "Channel"]].forEach(function (x) { fs.appendChild(filterSlicer(x[0], x[1], "sales")); });
      var ss = $('[data-slot="sel"]', root);
      ss.className = "selectors";
      ss.appendChild(selectorSlicer("salesKpis", "Sales KPI Selector", SALES_KPI_OPTIONS, false, "sales"));
      ss.appendChild(selectorSlicer("salesView", "Sales View Selector", ["Plant", "Product", "Channel"], true, "sales"));
      put(root, "reset", resetButton());
    },
    update: function (root) {
      var P = "sales", f = state.f;
      var view = state.sel.salesView;
      // the Sales View Selector decides what a click on the bar chart / table selects
      var viewField = view === "Plant" ? "plants" : view === "Channel" ? "channels" : "products";
      pruneSourceField(P, "byView", viewField);
      pruneSourceField(P, "view", viewField);
      pruneToContext(P, false);
      var name = hlName(P);
      updateKpis(root, C.kpis(D, contextFor(P, "kpis")));

      // Sales Actual vs Budget (combo) – source: one YEAR+MONTH. The attainment panel keeps the slicer context.
      var sM = C.aggSales(D, f, { key: keyYM });
      var sk = sortedKeys(sM);
      var sH = hlSeries(P, "combo", function (h) { return C.aggSales(D, h, { key: keyYM }); });
      CH.columns($('[data-chart="combo"]', root), Object.assign(selectable(P, "combo", function (i) { return sk[i]; }, "ym"), {
        categories: monthCats(sk), fmt: fmtTt, aria: "Monthly sales actual versus budget with attainment", hlName: name,
        series: [
          { name: "Sales Actual", color: GOLD, values: sk.map(function (k) { return val(sM, k, "a"); }), hl: sH && sk.map(function (k) { return val(sH, k, "a"); }) },
          { name: "Sales Budget", color: GREEN, values: sk.map(function (k) { return val(sM, k, "b"); }), hl: sH && sk.map(function (k) { return val(sH, k, "b"); }) }
        ],
        line: { name: "Sales Attainment %", color: LINE, target: 1, targetName: "Target 100%", fmt: fmtPct,
          values: sk.map(function (k) { return C.attainment(val(sM, k, "a"), val(sM, k, "b")); }) },
        extraTip: function (i) { return [{ name: "Variance", value: fmtTt(val(sM, sk[i], "a") - val(sM, sk[i], "b")) }]; }
      }));

      // Sales by Selected View – source: PLANT / PRODUCT / CHANNEL (follows the View Selector)
      var keyFn = view === "Plant" ? keyPlant : view === "Channel" ? keyChannel : keyProduct;
      var names = view === "Plant" ? plantName : view === "Channel" ? channelName : productName;
      var sV = C.aggSales(D, f, { key: keyFn });
      var vH = hlSeries(P, "byView", function (h) { return C.aggSales(D, h, { key: keyFn }); });
      var ordered = dimRows(sV, names).sort(function (a, b) { return b.o.a - a.o.a; });
      CH.bars($('[data-chart="byView"]', root), Object.assign(selectable(P, "byView", function (i) { return ordered[i].key; }, viewField), {
        categories: ordered.map(function (r) { return { label: r.label }; }), fmt: fmtTt, aria: "Sales by " + view, hlName: name,
        band: ordered.length > 5 ? 40 : 56,
        series: [
          { name: "Sales Actual Selected Period", color: GOLD, values: ordered.map(function (r) { return r.o.a; }), hl: vH && ordered.map(function (r) { return val(vH, r.key, "a"); }) },
          { name: "Sales Budget Selected Period", color: GREEN, values: ordered.map(function (r) { return r.o.b; }), hl: vH && ordered.map(function (r) { return val(vH, r.key, "b"); }) }
        ],
        extraTip: function (i) { var o = ordered[i].o; return [{ name: "Variance", value: fmtTt(o.a - o.b) }, { name: "Attainment", value: fmtPct(C.attainment(o.a, o.b)) || "(Blank)" }]; }
      }));

      // Year x month matrix – source: one YEAR+MONTH (cells); cross-filtered by other selections
      ymMatrix($('[data-table="matrix"]', root), C.aggSales(D, contextFor(P, "matrix"), { key: keyYM }), [
        { name: "Sales Actual", get: function (o) { return o.a; } },
        { name: "Sales Budget", get: function (o) { return o.b; } },
        { name: "Sales Variance", get: function (o) { return o.a - o.b; }, red: neg }
      ], "sales", MATRIX_RED, matrixSel(P, "matrix"));

      // Sales View table – source: same dimension as the View Selector
      var tV = C.aggSales(D, contextFor(P, "view"), { key: keyFn });
      dataTable($('[data-table="view"]', root), Object.assign(tableSel(P, "view", viewField), {
        dimLabel: view, theme: "sales", rows: dimRows(tV, names), total: C.total(tV),
        cols: pick(SALES_COLS, state.sel.salesKpis, SALES_KPI_OPTIONS)
      }));
      selectionBar(root, P, "page", "Click a month, a " + view.toLowerCase() + " bar, a matrix cell or a table row to cross-filter the cards and tables and highlight the charts.");
    }
  };

  /**
   * Keep side-by-side charts vertically aligned: when two chart panels share a row, give their
   * legends the same height so the plots (and the % panels below them) start at the same y.
   */
  function alignLegends(root) {
    root.querySelectorAll(".grid-2").forEach(function (g) {
      var legends = Array.prototype.filter.call(g.querySelectorAll(".panel > .chart > .legend"), function () { return true; });
      if (legends.length < 2) return;
      legends.forEach(function (l) { l.style.minHeight = ""; });
      var panels = legends.map(function (l) { return l.closest(".panel"); });
      var sideBySide = panels.every(function (p) { return Math.abs(p.offsetTop - panels[0].offsetTop) < 2; });
      if (!sideBySide) return;
      var h = Math.max.apply(null, legends.map(function (l) { return l.offsetHeight; }));
      legends.forEach(function (l) { l.style.minHeight = h + "px"; });
    });
  }

  // ===== Production Analysis
  pages.production = {
    build: function (root) {
      root.innerHTML =
        '<div class="top">' + kpiCards(["productionActual", "productionBudget", "productionVariance", "productionAttainment"]) +
        '<div class="controls">' + slot("filters") + '<div class="controls-row"><div data-note="channel"></div>' + slot("reset") + "</div>" + selectionSlot() + "</div></div>" +
        '<div class="grid-2">' +
        panel("Production Actual vs Budget", chart("combo")) +
        panel("Production vs Sales", chart("pvs") + '<div data-note="pvsPct"></div>') +
        "</div>" +
        '<div class="grid-2 tables">' +
        panel("Production Actual vs Budget", tableBox("m1")) +
        panel("Production Actual vs Sales", tableBox("m2")) +
        "</div>";
      var fs = $('[data-slot="filters"]', root);
      fs.className = "slicers";
      [["years", "Year"], ["months", "Month"], ["plants", "Plant"], ["products", "Product"]].forEach(function (x) { fs.appendChild(filterSlicer(x[0], x[1], "prod")); });
      put(root, "reset", resetButton());
    },
    update: function (root) {
      var P = "production", f = state.f;
      // every visual on this page has months on its axis / columns, so a click selects one YEAR+MONTH
      pruneToContext(P, true);
      var name = hlName(P);
      $('[data-note="channel"]', root).innerHTML = channelNote();
      updateKpis(root, C.kpis(D, contextFor(P, "kpis")));
      var pM = C.aggProd(D, f, { key: keyYM });
      var sM = C.aggSales(D, f, { key: keyYM, allChannels: true });
      var pk = sortedKeys(pM);
      var pH1 = hlSeries(P, "combo", function (h) { return C.aggProd(D, h, { key: keyYM }); });
      CH.columns($('[data-chart="combo"]', root), Object.assign(selectable(P, "combo", function (i) { return pk[i]; }, "ym"), {
        categories: monthCats(pk), fmt: fmtTt, aria: "Monthly production actual versus budget with attainment", hlName: name,
        series: [
          { name: "Production Actual", color: GOLD, values: pk.map(function (k) { return val(pM, k, "a"); }), hl: pH1 && pk.map(function (k) { return val(pH1, k, "a"); }) },
          { name: "Production Budget", color: GREEN, values: pk.map(function (k) { return val(pM, k, "b"); }), hl: pH1 && pk.map(function (k) { return val(pH1, k, "b"); }) }
        ],
        line: { name: "Production Attainment %", label: "Production Attainment %", color: LINE, target: 1, targetName: "Target 100%", fmt: fmtPct,
          values: pk.map(function (k) { return C.attainment(val(pM, k, "a"), val(pM, k, "b")); }) },
        extraTip: function (i) { return [{ name: "Variance", value: fmtTt(val(pM, pk[i], "a") - val(pM, pk[i], "b")) }]; }
      }));
      // Production vs Sales: production facts vs sales of ALL channels (sM built with allChannels above).
      // The % panel uses the same two monthly aggregates as the bars and the matrix below.
      var ck = sortedKeys(pM, sM);
      var pH2 = hlSeries(P, "pvs", function (h) { return C.aggProd(D, h, { key: keyYM }); });
      var sH2 = hlSeries(P, "pvs", function (h) { return C.aggSales(D, h, { key: keyYM, allChannels: true }); });
      CH.columns($('[data-chart="pvs"]', root), Object.assign(selectable(P, "pvs", function (i) { return ck[i]; }, "ym"), {
        categories: monthCats(ck), fmt: fmtTt, aria: "Monthly production versus sales (all channels) with production vs sales %", hlName: name,
        series: [
          { name: "Production Actual", color: GOLD, values: ck.map(function (k) { return val(pM, k, "a"); }), hl: pH2 && ck.map(function (k) { return val(pH2, k, "a"); }) },
          { name: "Sales Actual", color: GREEN, values: ck.map(function (k) { return val(sM, k, "a"); }), hl: sH2 && ck.map(function (k) { return val(sH2, k, "a"); }) }
        ],
        // DAX: DIVIDE([Production Actual], [Sales Actual]) – BLANK when sales = 0
        line: { name: "Production vs Sales %", label: "Production vs Sales %", color: LINE, target: 1, targetName: "100% reference",
          fmt: fmtPct, minSpan: 0.1,
          values: ck.map(function (k) { return C.ratio(val(pM, k, "a"), val(sM, k, "a")); }) },
        extraTip: function (i) { return [{ name: "Production vs Sales", value: fmtTt(val(pM, ck[i], "a") - val(sM, ck[i], "a")) }]; }
      }));
      alignLegends(root);
      // Period ratio from exact totals (not an average of monthly percentages); follows a month selection like a card
      var nf = contextFor(P, "note");
      var pN = C.aggProd(D, nf, { key: keyYM }), sN = C.aggSales(D, nf, { key: keyYM, allChannels: true });
      var pTot = C.total(pN).a, sTot = C.total(sN).a, pvsPeriod = C.ratio(pTot, sTot);
      var nLabel = interaction(P, "note") === "filter" ? FIELD_LABEL[selectionOf(P).field](selectionOf(P).value) : "Selected period";
      $('[data-note="pvsPct"]', root).innerHTML = (pN.size || sN.size) ? '<p class="note small">' + esc(nLabel) + ': Production vs Sales % = <strong data-value="pvsPeriod">' +
        (pvsPeriod === null ? "(Blank)" : fmtPct(pvsPeriod)) + "</strong> (" + fmtT(pTot) + " t produced ÷ " + fmtT(sTot) +
        " t sold, all channels). A volume ratio – not an inventory or stock-coverage measure.</p>" : "";
      // matrices: cross-filtered by a selection made elsewhere, sources of YEAR+MONTH themselves
      ymMatrix($('[data-table="m1"]', root), C.aggProd(D, contextFor(P, "m1"), { key: keyYM }), [
        { name: "Production Actual", get: function (o) { return o.a; } },
        { name: "Production Budget", get: function (o) { return o.b; } },
        { name: "Production Variance", get: function (o) { return o.a - o.b; }, red: neg }
      ], "prod", RED, matrixSel(P, "m1"));
      var m2f = contextFor(P, "m2");
      var pM2 = C.aggProd(D, m2f, { key: keyYM }), sM2 = C.aggSales(D, m2f, { key: keyYM, allChannels: true });
      var comb = new Map();
      sortedKeys(pM2, sM2).forEach(function (k) { comb.set(k, { p: val(pM2, k, "a"), s: val(sM2, k, "a") }); });
      ymMatrix($('[data-table="m2"]', root), comb, [
        { name: "Production Actual", get: function (o) { return o.p; } },
        { name: "Sales Actual", get: function (o) { return o.s; } },
        { name: "Production vs Sales", get: function (o) { return o.p - o.s; }, red: neg }
      ], "prod", RED, matrixSel(P, "m2"));
      selectionBar(root, P, "page", "Click a month in a chart or a matrix cell to cross-filter the cards and matrices and highlight the charts.");
    }
  };

  // ===== Plant Analysis
  pages.plant = {
    build: function (root) {
      root.innerHTML =
        '<div class="top">' + '<div class="kpi-col">' + kpiCards(["productionActual", "productionBudget", "productionVariance", "productionAttainment"]) + slot("tiles") + "</div>" +
        '<div class="controls">' + slot("filters") + '<div class="controls-row"><div data-note="channel"></div>' + slot("reset") + "</div></div></div>" +
        '<div class="grid-2">' +
        panel("Production vs Budget", chart("pb") + '<p class="note small">Monthly production by plant – scroll horizontally to browse the full period.</p>') +
        panel("Production Mix by plant", chart("mix")) +
        "</div>" +
        '<div class="grid-2">' +
        panel("Plant production performance", tableBox("perf")) +
        panel("Production Share % by plant", '<div class="selection-bar" data-selection="share"></div>' + chart("share")) +
        "</div>";
      put(root, "tiles", plantTiles());
      var fs = $('[data-slot="filters"]', root);
      fs.className = "slicers";
      [["years", "Year"], ["months", "Month"], ["products", "Product"]].forEach(function (x) { fs.appendChild(filterSlicer(x[0], x[1], "prod")); });
      put(root, "reset", resetButton());
    },
    update: function (root) {
      var f = state.f; // slicer context (selection-independent)
      // the selectable plants = plants with production in the slicer context (same set in all four visuals)
      var shareNow = C.plantShare(D, f);
      pruneSelection("plant", Array.from(shareNow.keys()).filter(function (k) { return shareNow.get(k) !== null; }));
      var hlShare = highlightFor("plant", "share");
      var sel = selectionOf("plant");
      $('[data-note="channel"]', root).innerHTML = channelNote();
      updateKpis(root, C.kpis(D, contextFor("plant", "kpis")));
      var m = C.aggProd(D, f, { key: function (r, c) { return r[c.y] * 100 + r[c.m] + "|" + r[c.plant]; } });
      var keys = Array.from(m.keys()).sort(function (a, b) {
        var pa = a.split("|"), pb = b.split("|");
        return (+pa[0] - +pb[0]) || plantName[pa[1]].localeCompare(plantName[pb[1]], "en");
      });
      // a click on any bar (any month, Actual or Budget) selects the bar's PLANT – never the month or series
      var pbPlant = function (i) { return keys[i].split("|")[1]; };
      var firstOfPlant = {};
      keys.forEach(function (k, i) { var p = k.split("|")[1]; if (!(p in firstOfPlant)) firstOfPlant[p] = i; });
      CH.columns($('[data-chart="pb"]', root), Object.assign(selectable("plant", "pb", pbPlant), {
        focusable: function (i) { return firstOfPlant[pbPlant(i)] === i; }, // one Tab stop per plant
        highlight: highlightProps("plant", "pb", pbPlant),
        categories: keys.map(function (k) {
          var p = k.split("|"), ym = +p[0], y = Math.floor(ym / 100), mo = ym % 100;
          return { label: plantName[p[1]], group: MON[mo - 1] + " " + y, tip: plantName[p[1]] + " – " + MONTHS[mo - 1] + " " + y };
        }),
        minBand: 16, fmt: fmtTt, aria: "Monthly production versus budget by plant",
        series: [
          { name: "Production Actual", color: GOLD, values: keys.map(function (k) { return m.get(k).a; }) },
          { name: "Production Budget", color: GREEN, values: keys.map(function (k) { return m.get(k).b; }) }
        ],
        extraTip: function (i) { var o = m.get(keys[i]); return [{ name: "Variance", value: fmtTt(o.a - o.b) }, { name: "Attainment", value: fmtPct(C.attainment(o.a, o.b)) || "(Blank)" }]; }
      }));

      var mix = C.aggProd(D, f, { key: function (r, c) { return r[c.plant] + "|" + r[c.product]; } });
      var byPlant = C.aggProd(D, f, { key: keyPlant });
      var pl = dimRows(byPlant, plantName).filter(function (r) { return r.o.a > 0; });
      var prods = products.filter(function (p) { return pl.some(function (r) { return val(mix, r.key + "|" + p, "a") > 0; }); });
      // a click on any product segment selects the column's PLANT (no product filter in this stage)
      var mixPlant = function (i) { return pl[i].key; };
      CH.stacked100($('[data-chart="mix"]', root), Object.assign(selectable("plant", "mix", mixPlant), {
        categories: pl.map(function (r) { return { label: r.label }; }), legendTitle: "Product", fmt: fmtTt,
        aria: "Production mix by plant",
        highlight: highlightProps("plant", "mix", mixPlant),
        stacks: prods.map(function (p) {
          return { name: productShort(p), color: PRODUCT_COLORS[productShort(p)] || "#8A8886", values: pl.map(function (r) { return val(mix, r.key + "|" + p, "a"); }) };
        })
      }));

      // the table is cross-filtered by the selection AND is a selection source (rows; never the Total row)
      var perfMap = C.aggProd(D, contextFor("plant", "perf"), { key: keyPlant });
      dataTable($('[data-table="perf"]', root), {
        dimLabel: "Plant", theme: "prod", rows: dimRows(perfMap, plantName), total: C.total(perfMap),
        cols: pick(prodCols(false), [], PROD_KPI_OPTIONS),
        select: selectable("plant", "perf", function (k) { return k; })
      });
      drawShare($('[data-chart="share"]', root), f, {
        highlight: hlShare,
        selected: sel ? sel.value : null,
        onSelect: function (p) { toggleSelection("plant", "share", p); }
      });
      selectionBar(root, "plant", "share", "Click a plant's column, segment or table row to cross-filter the cards and table and highlight the charts.");
    }
  };

  /**
   * Production Share % by plant. The source chart itself is not filtered by its own selection
   * (as in Power BI), so shares stay relative to the slicer-selected plants (ALLSELECTED).
   * ix (optional): {highlight: plantId, selected: plantId, onSelect(plantId)} – visual interactions.
   */
  function drawShare(container, f, ix) {
    var share = C.plantShare(D, f);
    var byPlant = C.aggProd(D, f, { key: keyPlant });
    var pl = Array.from(share.keys()).filter(function (k) { return share.get(k) !== null; })
      .sort(function (a, b) { return plantName[a].localeCompare(plantName[b], "en"); });
    ix = ix || {};
    CH.simpleColumns(container, {
      categories: pl.map(function (k) { return { label: plantName[k] }; }), values: pl.map(function (k) { return share.get(k); }),
      color: GOLD, name: "Plant Production Share %", aria: "Production share by plant",
      extraTip: function (i) { return [{ name: "Production Actual", value: fmtTt(val(byPlant, pl[i], "a")) }]; },
      highlight: ix.highlight ? function (i) { return pl[i] === ix.highlight; } : undefined,
      selected: ix.selected ? pl.indexOf(ix.selected) : -1,
      onSelect: ix.onSelect ? function (i) { ix.onSelect(pl[i]); } : undefined
    });
  }

  // ===== Product Analysis
  pages.product = {
    build: function (root) {
      root.innerHTML =
        '<div class="top">' + kpiCards(["productionActual", "productionBudget", "productionVariance", "productionAttainment"]) +
        '<div class="controls">' + slot("filters") + '<div class="controls-row"><div data-note="channel"></div>' + slot("reset") + "</div>" + selectionSlot() + "</div></div>" +
        '<div class="grid-2">' +
        panel("Production vs Budget", chart("pb")) +
        panel("Production vs Sales", chart("ps")) +
        "</div>" +
        '<div class="grid-2">' +
        panel("Product performance by plant", tableBox("perf")) +
        panel("Production Share % by plant", chart("share")) +
        "</div>";
      var fs = $('[data-slot="filters"]', root);
      fs.className = "slicers";
      [["years", "Year"], ["months", "Month"], ["plants", "Plant"], ["products", "Product"]].forEach(function (x) { fs.appendChild(filterSlicer(x[0], x[1], "prod")); });
      put(root, "reset", resetButton());
    },
    update: function (root) {
      var P = "product", f = state.f;
      pruneToContext(P, true);
      var name = hlName(P), sel = selectionOf(P);
      $('[data-note="channel"]', root).innerHTML = channelNote();
      updateKpis(root, C.kpis(D, contextFor(P, "kpis")));
      var pP = C.aggProd(D, f, { key: keyProduct });
      var sP = C.aggSales(D, f, { key: keyProduct, allChannels: true });
      var short = {};
      products.forEach(function (p) { short[p] = productShort(p); });

      // Production vs Budget by product – source: PRODUCT
      var pr = dimRows(pP, short);
      var pbH = hlSeries(P, "pb", function (h) { return C.aggProd(D, h, { key: keyProduct }); });
      CH.columns($('[data-chart="pb"]', root), Object.assign(selectable(P, "pb", function (i) { return pr[i].key; }, "products"), {
        categories: pr.map(function (r) { return { label: r.label, tip: productName[r.key] }; }), rotate: true, minBand: 28,
        height: 320, fmt: fmtTt, aria: "Production versus budget by product", hlName: name,
        series: [
          { name: "Production Actual", color: GOLD, values: pr.map(function (r) { return r.o.a; }), hl: pbH && pr.map(function (r) { return val(pbH, r.key, "a"); }) },
          { name: "Production Budget", color: GREEN, values: pr.map(function (r) { return r.o.b; }), hl: pbH && pr.map(function (r) { return val(pbH, r.key, "b"); }) }
        ],
        extraTip: function (i) { var o = pr[i].o; return [{ name: "Variance", value: fmtTt(o.a - o.b) }, { name: "Attainment", value: fmtPct(C.attainment(o.a, o.b)) || "(Blank)" }]; }
      }));

      // Production vs Sales by product (sales of ALL channels) – source: PRODUCT
      var keys = products.filter(function (p) { return val(pP, p, "a") !== 0 || val(sP, p, "a") !== 0; })
        .sort(function (a, b) { return short[a].localeCompare(short[b], "en"); });
      var psP = hlSeries(P, "ps", function (h) { return C.aggProd(D, h, { key: keyProduct }); });
      var psS = hlSeries(P, "ps", function (h) { return C.aggSales(D, h, { key: keyProduct, allChannels: true }); });
      CH.columns($('[data-chart="ps"]', root), Object.assign(selectable(P, "ps", function (i) { return keys[i]; }, "products"), {
        categories: keys.map(function (k) { return { label: short[k], tip: productName[k] }; }), rotate: true, minBand: 28,
        height: 320, fmt: fmtTt, aria: "Production versus sales (all channels) by product", hlName: name,
        series: [
          { name: "Production Actual", color: GOLD, values: keys.map(function (k) { return val(pP, k, "a"); }), hl: psP && keys.map(function (k) { return val(psP, k, "a"); }) },
          { name: "Sales Actual", color: GREEN, values: keys.map(function (k) { return val(sP, k, "a"); }), hl: psS && keys.map(function (k) { return val(psS, k, "a"); }) }
        ],
        extraTip: function (i) { var p = val(pP, keys[i], "a"), s = val(sP, keys[i], "a"); return [{ name: "Production vs Sales", value: fmtTt(p - s) }, { name: "Production vs Sales %", value: fmtPct(C.ratio(p, s)) || "(Blank)" }]; }
      }));

      // Product performance by plant – cross-filtered by a product selection; source: PLANT
      var byPlant = C.aggProd(D, contextFor(P, "perf"), { key: keyPlant });
      dataTable($('[data-table="perf"]', root), Object.assign(tableSel(P, "perf", "plants"), {
        dimLabel: "Plant", theme: "prod", rows: dimRows(byPlant, plantName), total: C.total(byPlant),
        cols: pick(prodCols(false), [], PROD_KPI_OPTIONS)
      }));

      // Production Share % by plant – a product selection FILTERS it (shares of that product's output);
      // a plant selection highlights the plant. Source: PLANT
      var shareMode = interaction(P, "share");
      drawShare($('[data-chart="share"]', root), shareMode === "filter" ? contextFor(P, "share") : f, {
        highlight: highlightFor(P, "share", "plants"),
        selected: sel && sel.field === "plants" ? sel.value : null,
        onSelect: function (p) { toggleSelection(P, "share", p, "plants"); }
      });
      selectionBar(root, P, "page", "Click a product column, a plant row or a plant column to cross-filter the cards and table and highlight the charts.");
    }
  };

  // ===== About
  pages.about = {
    build: function (root) {
      var meta = D ? D.meta : null;
      root.innerHTML = document.getElementById("about-template").innerHTML
        .replace(/\{\{EXPORTED\}\}/g, meta ? esc(meta.exported) : "–")
        .replace(/\{\{REPO\}\}/g, REPO);
    },
    update: function () {}
  };

  // ---------------------------------------------------------------- router
  var main, built = {};
  function currentRoot() { return document.getElementById("page-" + state.page); }

  function navigate(id) {
    if (!pages[id]) id = "overview";
    closePop();
    CH.hideTip();
    state.page = id;
    PAGES.forEach(function (p) {
      var sec = document.getElementById("page-" + p.id);
      sec.hidden = p.id !== id;
      var tab = document.querySelector('[data-tab="' + p.id + '"]');
      tab.classList.toggle("active", p.id === id);
      if (p.id === id) tab.setAttribute("aria-current", "page"); else tab.removeAttribute("aria-current");
    });
    document.title = (id === "overview" ? "" : PAGES.filter(function (p) { return p.id === id; })[0].title + " – ") + "Pellet Supply Chain Dashboard";
    if (!built[id]) {
      controls = [];
      pages[id].build(currentRoot());
      built[id] = controls;
    }
    refresh();
  }

  function refresh() {
    var id = state.page;
    if (!D && id !== "about") return;
    (built[id] || []).forEach(function (c) { c.update(); });
    pages[id].update(currentRoot());
    persist();
  }

  function onHash() {
    var id = (location.hash || "").replace(/^#\/?/, "") || "overview";
    navigate(id);
  }

  var rT;
  window.addEventListener("resize", function () {
    clearTimeout(rT);
    rT = setTimeout(function () { if (state.page !== "about") refresh(); }, 150);
  });

  function boot() {
    main = document.getElementById("main");
    var nav = document.getElementById("tabs");
    PAGES.forEach(function (p) {
      var a = document.createElement("a");
      a.href = "#/" + p.id;
      a.textContent = p.title;
      a.setAttribute("data-tab", p.id);
      nav.appendChild(a);
      var sec = document.createElement("div");
      sec.id = "page-" + p.id;
      sec.className = "page";
      sec.hidden = true;
      main.appendChild(sec);
    });
    if (!D) {
      var warn = document.getElementById("data-missing");
      warn.hidden = false;
      PAGES.forEach(function (p) {
        if (p.id !== "about") document.getElementById("page-" + p.id).innerHTML = warn.outerHTML.replace("hidden", "");
      });
      warn.remove();
      PAGES.forEach(function (p) { if (p.id !== "about") built[p.id] = []; });
      pages.overview.update = pages.sales.update = pages.production.update = pages.plant.update = pages.product.update = function () {};
    } else {
      initDims();
      var ex = document.getElementById("export-date");
      if (ex) ex.textContent = D.meta.exported;
    }
    window.addEventListener("hashchange", onHash);
    onHash();
  }

  // Small API used by the optional self-test (index.html?selftest=1)
  window.PelletApp = {
    state: state, navigate: navigate, refresh: refresh, reset: resetAll,
    setFilter: function (k, v) { state.f[k] = v; refresh(); },
    setSel: function (k, v) { state.sel[k] = v; refresh(); }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
