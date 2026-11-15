/*
 * Minimal dependency-free SVG charts styled after the Power BI V1 report.
 * Every chart has a hover tooltip (value + period/category).
 */
(function (root) {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var FONT = "Segoe UI, 'Segoe UI Web', system-ui, -apple-system, Roboto, Arial, sans-serif";
  var AXIS = "#605E5C";
  var GRID = "#C8C6C4";
  // SVG text sizes (readability pass): 11 px where the layout has room; rotated month labels,
  // wrapped product labels and the horizontal bar-chart category labels keep their size because
  // 11 px there would overlap (months at 1024/390 px) or cut long names (bar labels at 390 px).
  var FS = { axis: 11, group: 11, label: 11, value: 11, panelTitle: 11, rotated: 10, wrapped: 10, barCategory: 10.5 };

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function text(parent, x, y, str, attrs) {
    var t = el("text", Object.assign({ x: x, y: y, "font-family": FONT, "font-size": 11, fill: AXIS }, attrs || {}), parent);
    t.textContent = str;
    return t;
  }

  // ---------- tooltip ----------
  var tip;
  function tooltip() {
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "chart-tip";
      tip.setAttribute("role", "status");
      document.body.appendChild(tip);
    }
    return tip;
  }
  function showTip(evt, title, rows) {
    var t = tooltip();
    var h = '<div class="tip-title">' + esc(title) + "</div>";
    rows.forEach(function (r) {
      h += '<div class="tip-row">' + (r.color ? '<span class="tip-key" style="background:' + r.color + '"></span>' : "") +
        '<span class="tip-name">' + esc(r.name) + '</span><span class="tip-val">' + esc(r.value) + "</span></div>";
    });
    t.innerHTML = h;
    t.style.display = "block";
    moveTip(evt);
  }
  function moveTip(evt) {
    if (!tip) return;
    var pad = 14, w = tip.offsetWidth, h = tip.offsetHeight;
    var x = evt.clientX + pad, y = evt.clientY + pad;
    if (x + w > window.innerWidth - 8) x = evt.clientX - w - pad;
    if (y + h > window.innerHeight - 8) y = evt.clientY - h - pad;
    tip.style.left = Math.max(8, x) + "px";
    tip.style.top = Math.max(8, y) + "px";
  }
  function hideTip() { if (tip) tip.style.display = "none"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // ---------- scales ----------
  // Round axis steps (1, 2, 2.5, 5 x 10^k) so tick labels read 0K, 20K, 40K ...
  function niceScale(max, n) {
    if (!(max > 0)) max = 1;
    var raw = max / (n || 4);
    var p = Math.pow(10, Math.floor(Math.log10(raw)));
    var r = raw / p;
    var step = (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * p;
    var top = Math.ceil(max / step - 1e-9) * step;
    var t = [];
    for (var i = 0; i * step <= top + step / 2; i++) t.push(i * step);
    return { max: top, step: step, ticks: t };
  }
  function decimals(x) {
    for (var d = 0; d < 3; d++) if (Math.abs(Math.round(x * Math.pow(10, d)) - x * Math.pow(10, d)) < 1e-6) return d;
    return 2;
  }
  function axisFmt(v, sc) {
    if (sc.max >= 1e6) return (v / 1e6).toFixed(decimals(sc.step / 1e6)) + "M";
    if (sc.max >= 1e3) return (v / 1e3).toFixed(decimals(sc.step / 1e3)) + "K";
    return v.toFixed(decimals(sc.step));
  }
  function pctFmt(v, sc) { return (v * 100).toFixed(decimals(sc.step * 100)) + "%"; }

  function legend(container, items, shape) {
    var lg = document.createElement("div");
    lg.className = "legend";
    items.forEach(function (it) {
      var s = document.createElement("span");
      s.className = "legend-item";
      s.innerHTML = '<span class="legend-key ' + (shape || "dot") + '" style="background:' + it.color + '"></span>' + esc(it.name);
      lg.appendChild(s);
    });
    container.appendChild(lg);
    return lg;
  }

  function empty(container, msg) {
    var d = document.createElement("div");
    d.className = "chart-empty";
    d.textContent = msg || "No data for the current filter selection.";
    container.appendChild(d);
  }

  /**
   * Clustered column chart.
   * opts: categories [{label, group, tip}], series [{name,color,values}], height,
   *       minBand (px per category), rotate (bool), fmt (value -> string),
   *       line {name,color,values,target,targetName,fmt}  -> drawn in its own panel below (no dual axis)
   */
  function columns(container, opts) {
    container.innerHTML = "";
    var cats = opts.categories, series = opts.series;
    legend(container, series.map(function (s) { return { name: s.name, color: s.color }; })
      .concat(opts.line ? [{ name: opts.line.name, color: opts.line.color }] : [])
      .concat(opts.line && opts.line.target != null ? [{ name: opts.line.targetName || "Target", color: "#8A8886" }] : []));
    if (!cats.length) { empty(container); return; }

    var scroll = document.createElement("div");
    scroll.className = "chart-scroll";
    container.appendChild(scroll);

    var availW = Math.max(280, container.clientWidth || 600);
    var left = 46, right = 12, top = 10;
    var minBand = opts.minBand || 14;
    var plotW = Math.max(availW - left - right, cats.length * minBand);
    var band0 = plotW / cats.length;
    // wide bands: horizontal, word-wrapped labels; narrow bands: rotated labels sized to the longest text
    var rotate = opts.rotate !== false && band0 < 64;
    var maxChars = Math.max.apply(null, cats.map(function (c) { return String(c.label).length; }));
    var perLine = Math.max(6, Math.floor(band0 / 5.6));
    var wrapped = cats.map(function (c) {
      var lines = [], cur = "";
      String(c.label).split(" ").forEach(function (w) {
        if (cur && (cur + " " + w).length > perLine) { lines.push(cur); cur = w; } else cur = cur ? cur + " " + w : w;
      });
      if (cur) lines.push(cur);
      return lines;
    });
    var maxLines = Math.max.apply(null, wrapped.map(function (l) { return l.length; }));
    var labelH = rotate ? Math.min(130, maxChars * 5.6 + 12) : 10 + maxLines * 13;
    var groups = cats.some(function (c) { return c.group; });
    var groupH = groups ? 22 : 0;
    var lineLabel = opts.line && opts.line.label ? 16 : 0;
    var lineH = opts.line ? 92 + lineLabel : 0;
    var plotH = (opts.height || 300);
    var W = plotW + left + right;
    var H = top + plotH + (opts.line ? lineH + 8 : 0) + labelH + groupH + 6;
    var svg = el("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": opts.aria || "Column chart" }, scroll);

    var maxV = 0;
    series.forEach(function (s) { s.values.forEach(function (v) { if (v > maxV) maxV = v; }); });
    var sc = niceScale(maxV, 4);
    var yMax = sc.max;
    var y = function (v) { return top + plotH - (v / yMax) * plotH; };

    sc.ticks.forEach(function (t) {
      el("line", { x1: left, x2: left + plotW, y1: y(t), y2: y(t), stroke: GRID, "stroke-dasharray": "1 3", "stroke-width": 1 }, svg);
      text(svg, left - 6, y(t) + 4, axisFmt(t, sc), { "text-anchor": "end", "font-size": FS.axis });
    });

    var band = plotW / cats.length;
    var inner = band * 0.8;
    var barW = inner / series.length;
    var gap = series.length > 1 ? Math.min(1.5, barW * 0.1) : 0;

    // optional line panel
    var lt, ly;
    if (opts.line) {
      lt = top + plotH + 8;
      var vals = opts.line.values.filter(function (v) { return v !== null; });
      var lo = Math.min.apply(null, vals.concat([opts.line.target != null ? opts.line.target : Infinity]));
      var hi = Math.max.apply(null, vals.concat([opts.line.target != null ? opts.line.target : -Infinity]));
      if (!isFinite(lo)) { lo = 0.95; hi = 1.05; }
      // optional minimum span (e.g. 10 percentage points) so small changes are not exaggerated
      if (opts.line.minSpan && hi - lo < opts.line.minSpan) {
        var mid = (hi + lo) / 2;
        lo = mid - opts.line.minSpan / 2; hi = mid + opts.line.minSpan / 2;
      }
      var padv = Math.max((hi - lo) * 0.15, 0.005);
      lo -= padv; hi += padv;
      var lh = lineH - 14 - lineLabel;
      ly = function (v) { return lt + 6 + lineLabel + lh - ((v - lo) / (hi - lo)) * lh; };
      el("rect", { x: left, y: lt, width: plotW, height: lineH, fill: "#FAF9F8" }, svg);
      if (lineLabel) text(svg, left + 6, lt + 12, opts.line.label, { "font-size": FS.panelTitle, fill: "#252423", "font-weight": 600, "class": "line-panel-title" });
      var lsc = niceScale(hi - lo, 3);
      for (var tv = Math.ceil(lo / lsc.step) * lsc.step; tv <= hi + 1e-9; tv += lsc.step) {
        el("line", { x1: left, x2: left + plotW, y1: ly(tv), y2: ly(tv), stroke: GRID, "stroke-dasharray": "1 3" }, svg);
        text(svg, left - 6, ly(tv) + 4, pctFmt(tv, lsc), { "text-anchor": "end", "font-size": FS.axis });
      }
      if (opts.line.target != null) {
        el("line", { x1: left, x2: left + plotW, y1: ly(opts.line.target), y2: ly(opts.line.target), stroke: "#8A8886", "stroke-dasharray": "4 3", "stroke-width": 1.5 }, svg);
      }
      var d = "", pen = false;
      opts.line.values.forEach(function (v, i) {
        if (v === null) { pen = false; return; }
        var cx = left + band * i + band / 2;
        d += (pen ? "L" : "M") + cx.toFixed(1) + " " + ly(v).toFixed(1) + " ";
        pen = true;
      });
      el("path", { d: d, fill: "none", stroke: opts.line.color, "stroke-width": 2, "stroke-linejoin": "round" }, svg);
    }

    var hl = el("rect", { x: 0, y: top, width: band, height: plotH + (opts.line ? lineH + 8 : 0), fill: "#000", opacity: 0, "pointer-events": "none" }, svg);

    cats.forEach(function (c, i) {
      var x0 = left + band * i + (band - inner) / 2;
      series.forEach(function (s, j) {
        var v = s.values[i] || 0;
        var h = Math.max(0, y(0) - y(v));
        // partial cross-highlight: s.hl[i] = value of the selected part (Power BI draws it solid over a dimmed bar)
        var hv = s.hl ? Math.max(0, s.hl[i] || 0) : null;
        var partial = hv !== null && hv < v - 1e-9;
        var dim = isDimmed(opts, i) || partial;
        var bx = x0 + j * barW + gap / 2, bw = Math.max(1, barW - gap);
        el("rect", { x: bx, y: y(v), width: bw, height: h, fill: s.color, "class": "bar" + (dim ? " dimmed" : "") + (opts.onSelect && selectedAt(opts, i) ? " active" : ""), opacity: dim ? DIM : null, "data-cat": i, "data-series": j }, svg);
        if (partial && hv > 0) {
          el("rect", { x: bx, y: y(hv), width: bw, height: Math.max(0, y(0) - y(hv)), fill: s.color, "class": "bar-hl", "data-cat": i, "data-series": j, "pointer-events": "none" }, svg);
        }
      });
      if (opts.line && opts.line.values[i] !== null) {
        el("circle", { cx: left + band * i + band / 2, cy: ly(opts.line.values[i]), r: 2.5, fill: opts.line.color }, svg);
      }
      // labels
      var lx = left + band * i + band / 2, lyy = top + plotH + (opts.line ? lineH + 8 : 0) + 8;
      if (rotate) {
        text(svg, lx + 3, lyy, c.label, { transform: "rotate(-90 " + (lx + 3) + " " + lyy + ")", "text-anchor": "end", "font-size": FS.rotated });
      } else {
        wrapped[i].forEach(function (ln, li) { text(svg, lx, lyy + 8 + li * 13, ln, { "text-anchor": "middle", "font-size": FS.wrapped }); });
      }
      // hover target (bigger than the marks)
      var hit = el("rect", { x: left + band * i, y: top, width: band, height: plotH + (opts.line ? lineH + 8 : 0), fill: "transparent" }, svg);
      hit.addEventListener("mousemove", function (evt) {
        hl.setAttribute("x", left + band * i); hl.setAttribute("opacity", 0.05);
        var rows = series.map(function (s) { return { name: s.name, value: opts.fmt(s.values[i] || 0), color: s.color }; });
        rows = rows.concat(highlightTipRows(opts, series, i));
        if (opts.line) rows.push({ name: opts.line.name, value: opts.line.values[i] === null ? "(Blank)" : opts.line.fmt(opts.line.values[i]), color: opts.line.color });
        if (opts.extraTip) rows = rows.concat(opts.extraTip(i));
        showTip(evt, c.tip || c.label, rows.concat(selectTipRow(opts, i)));
      });
      hit.addEventListener("mouseleave", function () { hl.setAttribute("opacity", 0); hideTip(); });
      makeSelectable(hit, opts, i, c.tip || c.label);
    });

    // group (year) labels with separators
    if (groups) {
      var gy = H - groupH + 2, start = 0;
      for (var i = 1; i <= cats.length; i++) {
        if (i === cats.length || cats[i].group !== cats[start].group) {
          var x1 = left + band * start, x2 = left + band * i;
          text(svg, (x1 + x2) / 2, gy + 12, cats[start].group, { "text-anchor": "middle", "font-size": FS.group, fill: "#252423" });
          if (i < cats.length) el("line", { x1: x2, x2: x2, y1: top + plotH, y2: H - 2, stroke: GRID, "stroke-dasharray": "2 2" }, svg);
          start = i;
        }
      }
    }
    el("line", { x1: left, x2: left + plotW, y1: y(0), y2: y(0), stroke: "#B3B0AD" }, svg);
  }

  /**
   * Horizontal clustered bar chart (e.g. "Sales by Selected View").
   */
  function bars(container, opts) {
    container.innerHTML = "";
    var cats = opts.categories, series = opts.series;
    legend(container, series.map(function (s) { return { name: s.name, color: s.color }; }));
    if (!cats.length) { empty(container); return; }
    var W = Math.max(300, container.clientWidth || 600);
    var labelW = Math.min(190, W * 0.38), right = 16, top = 6;
    var band = opts.band || 40;
    var plotW = W - labelW - right, plotH = band * cats.length;
    var H = top + plotH + 26;
    var svg = el("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": opts.aria || "Bar chart" }, container);
    var maxV = 0;
    series.forEach(function (s) { s.values.forEach(function (v) { if (v > maxV) maxV = v; }); });
    var sc = niceScale(maxV, 4);
    var xMax = sc.max;
    var x = function (v) { return labelW + (v / xMax) * plotW; };
    sc.ticks.forEach(function (t) {
      el("line", { x1: x(t), x2: x(t), y1: top, y2: top + plotH, stroke: GRID, "stroke-dasharray": "1 3" }, svg);
      text(svg, x(t), top + plotH + 16, axisFmt(t, sc), { "text-anchor": "middle", "font-size": FS.axis });
    });
    var inner = band * 0.78, bh = inner / series.length;
    cats.forEach(function (c, i) {
      var y0 = top + band * i + (band - inner) / 2;
      var bars_ = [];
      series.forEach(function (s, j) {
        var v = Math.max(0, s.values[i] || 0);
        var hv = s.hl ? Math.max(0, s.hl[i] || 0) : null;
        var partial = hv !== null && hv < v - 1e-9;
        var dim = isDimmed(opts, i) || partial;
        bars_.push(el("rect", { x: labelW, y: y0 + j * bh + 0.75, width: Math.max(0, x(v) - labelW), height: Math.max(1, bh - 1.5), fill: s.color,
          "class": "bar" + (dim ? " dimmed" : "") + (opts.onSelect && selectedAt(opts, i) ? " active" : ""), opacity: dim ? DIM : null, "data-cat": i, "data-series": j }, svg));
        if (partial && hv > 0) {
          el("rect", { x: labelW, y: y0 + j * bh + 0.75, width: Math.max(0, x(hv) - labelW), height: Math.max(1, bh - 1.5), fill: s.color, "class": "bar-hl", "data-cat": i, "data-series": j, "pointer-events": "none" }, svg);
        }
      });
      text(svg, labelW - 8, top + band * i + band / 2 + 4, c.label, { "text-anchor": "end", "font-size": FS.barCategory });
      var hit = el("rect", { x: 0, y: top + band * i, width: W, height: band, fill: "transparent", "data-hit": i }, svg);
      hit.addEventListener("mousemove", function (evt) {
        showTip(evt, (opts.tipPrefix || "") + c.label, series.map(function (s) { return { name: s.name, value: opts.fmt(s.values[i] || 0), color: s.color }; })
          .concat(highlightTipRows(opts, series, i)).concat(opts.extraTip ? opts.extraTip(i) : []).concat(selectTipRow(opts, i)));
        bars_.forEach(function (b) { b.setAttribute("data-hover", ""); });
      });
      hit.addEventListener("mouseleave", function () { hideTip(); bars_.forEach(function (b) { b.removeAttribute("data-hover"); }); });
      makeSelectable(hit, opts, i, c.label);
    });
  }

  /**
   * 100 % stacked column chart (Production Mix by plant). Legend to the right.
   */
  function stacked100(container, opts) {
    container.innerHTML = "";
    var cats = opts.categories, stacks = opts.stacks;
    if (!cats.length) { empty(container); return; }
    var wrap = document.createElement("div");
    wrap.className = "stack-wrap";
    container.appendChild(wrap);
    var chart = document.createElement("div");
    chart.className = "stack-chart";
    wrap.appendChild(chart);
    var lg = document.createElement("div");
    lg.className = "legend legend-vertical";
    lg.innerHTML = '<div class="legend-title">' + esc(opts.legendTitle || "") + "</div>";
    stacks.forEach(function (s) {
      lg.innerHTML += '<span class="legend-item"><span class="legend-key dot" style="background:' + s.color + '"></span>' + esc(s.name) + "</span>";
    });
    wrap.appendChild(lg);

    var W = Math.max(260, chart.clientWidth || 500);
    var left = 40, right = 8, top = 8, plotH = opts.height || 280;
    var plotW = W - left - right;
    var H = top + plotH + 24;
    var svg = el("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": opts.aria || "100% stacked column chart" }, chart);
    var y = function (p) { return top + plotH - p * plotH; };
    [0, 0.2, 0.4, 0.6, 0.8, 1].forEach(function (t) {
      el("line", { x1: left, x2: left + plotW, y1: y(t), y2: y(t), stroke: GRID, "stroke-dasharray": "1 3" }, svg);
      text(svg, left - 6, y(t) + 4, Math.round(t * 100) + "%", { "text-anchor": "end", "font-size": FS.axis });
    });
    var band = plotW / cats.length, bw = Math.min(band * 0.62, 150);
    cats.forEach(function (c, i) {
      var tot = 0;
      stacks.forEach(function (s) { tot += s.values[i] || 0; });
      var acc = 0, x0 = left + band * i + (band - bw) / 2;
      // one group per column: a click on ANY segment selects the column's category (e.g. the plant)
      var col = el("g", { "class": "stack-col" }, svg);
      var dim = isDimmed(opts, i), act = opts.onSelect && selectedAt(opts, i);
      stacks.forEach(function (s) {
        var v = s.values[i] || 0;
        if (v <= 0 || tot <= 0) return;
        var p = v / tot;
        var r = el("rect", { x: x0, y: y(acc + p), width: bw, height: Math.max(0, y(acc) - y(acc + p) - (acc + p < 0.9999 ? 1 : 0)), fill: s.color, "class": "bar" + (dim ? " dimmed" : "") + (act ? " active" : ""), opacity: dim ? DIM : null, "data-cat": i }, col);
        r.addEventListener("mousemove", function (evt) {
          showTip(evt, c.label + " – " + s.name, [
            { name: "Production Actual", value: opts.fmt(v), color: s.color },
            { name: "Share of plant output", value: (p * 100).toFixed(2) + "%" }
          ].concat(selectTipRow(opts, i)));
        });
        r.addEventListener("mouseleave", hideTip);
        acc += p;
      });
      makeSelectable(col, opts, i, c.label);
      text(svg, left + band * i + band / 2, top + plotH + 16, c.label, { "text-anchor": "middle", "font-size": FS.label });
    });
  }

  /**
   * Simple single-series column chart with data labels (Production Share % by plant).
   */
  function simpleColumns(container, opts) {
    container.innerHTML = "";
    var cats = opts.categories;
    if (!cats.length) { empty(container); return; }
    var W = Math.max(260, container.clientWidth || 500);
    var left = 40, right = 8, top = 22, plotH = opts.height || 220;
    var plotW = W - left - right, H = top + plotH + 24;
    var svg = el("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": opts.aria || "Column chart" }, container);
    var maxV = Math.max.apply(null, opts.values.map(function (v) { return v || 0; }));
    var sc = niceScale(Math.max(maxV, 0.01), 4);
    var yMax = sc.max;
    var y = function (v) { return top + plotH - (v / yMax) * plotH; };
    sc.ticks.forEach(function (t) {
      el("line", { x1: left, x2: left + plotW, y1: y(t), y2: y(t), stroke: GRID, "stroke-dasharray": "1 3" }, svg);
      text(svg, left - 6, y(t) + 4, pctFmt(t, sc), { "text-anchor": "end", "font-size": FS.axis });
    });
    var band = plotW / cats.length, bw = Math.min(band * 0.62, 150);
    cats.forEach(function (c, i) {
      var v = opts.values[i] || 0;
      var x0 = left + band * i + (band - bw) / 2;
      var dim = isDimmed(opts, i);
      var bar = el("rect", { x: x0, y: y(v), width: bw, height: y(0) - y(v), fill: opts.color, "class": "bar" + (dim ? " dimmed" : "") + (opts.onSelect && selectedAt(opts, i) ? " active" : ""), opacity: dim ? DIM : null, "data-cat": i }, svg);
      text(svg, x0 + bw / 2, y(v) - 6, Math.round(v * 100) + "%", { "text-anchor": "middle", "font-size": FS.value, opacity: dim ? 0.55 : null });
      text(svg, left + band * i + band / 2, top + plotH + 16, c.label, { "text-anchor": "middle", "font-size": FS.label });
      var hit = el("rect", { x: left + band * i, y: top - 20, width: band, height: plotH + 20, fill: "transparent", "data-hit": i }, svg);
      hit.addEventListener("mousemove", function (evt) {
        showTip(evt, c.label, [{ name: opts.name, value: (v * 100).toFixed(2) + "%", color: opts.color }].concat(opts.extraTip ? opts.extraTip(i) : [])
          .concat(selectTipRow(opts, i)));
        bar.setAttribute("data-hover", "");
      });
      hit.addEventListener("mouseleave", function () { hideTip(); bar.removeAttribute("data-hover"); });
      makeSelectable(hit, opts, i, c.label);
    });
    el("line", { x1: left, x2: left + plotW, y1: y(0), y2: y(0), stroke: "#B3B0AD" }, svg);
  }

  window.addEventListener("scroll", hideTip, { passive: true });

  // ---------- selection & highlighting (Power BI-style interactions) ----------
  // opts.highlight(i) -> true = highlighted, false = dimmed; omitted = no highlight active.
  // opts.onSelect(i) makes a category clickable (mouse + keyboard); opts.selected = selected index.
  var DIM = 0.3;
  function isDimmed(opts, i) { return typeof opts.highlight === "function" && opts.highlight(i) === false; }
  /*
   * Shared selection behaviour for any chart element (bar hit area, stacked column group, ...).
   * opts.onSelect(i)     – called on click / Enter / Space
   * opts.isSelected(i)   – active state (alternatively opts.selected = index)
   * opts.selectLabel(i)  – accessible name of what is selected (e.g. the plant), defaults to label
   * opts.focusable(i)    – false = clickable but not a separate Tab stop (avoids 144 stops on dense charts)
   */
  function selectedAt(opts, i) {
    return typeof opts.isSelected === "function" ? !!opts.isSelected(i) : opts.selected === i;
  }
  function makeSelectable(target, opts, i, label) {
    if (!opts.onSelect) return;
    var on = selectedAt(opts, i);
    var name = opts.selectLabel ? opts.selectLabel(i) : label;
    var tab = typeof opts.focusable === "function" && !opts.focusable(i) ? "-1" : "0";
    target.setAttribute("tabindex", tab);
    target.setAttribute("role", "button");
    target.setAttribute("data-sel", i);
    target.setAttribute("aria-pressed", on ? "true" : "false");
    target.setAttribute("aria-label", name + (on ? " – selected, activate to clear the selection" : " – activate to select"));
    target.style.cursor = "pointer";
    target.addEventListener("click", function () { hideTip(); opts.onSelect(i); });
    target.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hideTip(); opts.onSelect(i); }
    });
  }
  /** Tooltip rows for the highlighted part, e.g. "Sales Actual – Direct B2B: 6,120 t" (opts.hlName names the selection). */
  function highlightTipRows(opts, series, i) {
    if (!opts.hlName) return [];
    return series.filter(function (s) { return s.hl; }).map(function (s) {
      return { name: s.name + " – " + opts.hlName, value: opts.fmt(s.hl[i] || 0), color: s.color };
    });
  }
  function selectTipRow(opts, i) {
    if (!opts.onSelect) return [];
    var name = opts.selectLabel ? opts.selectLabel(i) : "";
    return [{ name: selectedAt(opts, i) ? "Click to clear the selection" : "Click to select " + name, value: "" }];
  }

  root.PelletCharts = { columns: columns, bars: bars, stacked100: stacked100, simpleColumns: simpleColumns, hideTip: hideTip };
})(this);
