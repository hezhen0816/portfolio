/* motion.js — restrained scroll-in motion for the drawing-sheet site.
 *
 * Progressive enhancement: without this script (or with reduced motion) every
 * element is already in its final state. The pre-animation state only exists
 * under html.js-motion, which is set here before the body is painted, so this
 * file is loaded synchronously from <head> (it is tiny and does no DOM work
 * until DOMContentLoaded).
 *
 *  - .sec-head, .path         dimension lines draw in left -> right, once
 *  - .bars, .ba               bars grow from 0, once; numbers count up (<= 700 ms)
 *  - .measure                 key measured numbers count up, once
 *  - .diagram svg, .flow      slow moving dashes on connectors, only while on screen
 */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window) || !window.requestAnimationFrame) return;
  root.classList.add("js-motion");

  var COUNT_MS = 700;
  var FIGURE_SPACE = " ";
  var counters = [];

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  /* ---- count-up -------------------------------------------------------- */
  // Wraps the first number of an element's first numeric text node. The real
  // text stays in the DOM for assistive tech (visually hidden) while an
  // aria-hidden twin shows the counting value; the original node is restored
  // at the end, so the final text is exactly the authored text.
  function prepareCounter(el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var m = /\d+(?:\.\d+)?/.exec(node.nodeValue);
      if (!m) continue;
      var target = parseFloat(m[0]);
      if (!(target > 0)) return null;
      var decimals = (m[0].split(".")[1] || "").length;
      var intLen = m[0].split(".")[0].length;
      var c = {
        node: node, original: node.nodeValue, before: node.nodeValue.slice(0, m.index),
        after: node.nodeValue.slice(m.index + m[0].length), target: target,
        decimals: decimals, intLen: intLen, vis: null, real: null, done: false
      };
      counters.push(c);
      return c;
    }
    return null;
  }

  function format(c, v) {
    var s = v.toFixed(c.decimals);
    var pad = c.intLen - s.split(".")[0].length;
    while (pad-- > 0) s = FIGURE_SPACE + s;   // keep glyph positions steady (tabular figures)
    return s;
  }

  function prime(c) {
    if (c.vis || c.done) return;
    var frag = document.createDocumentFragment();
    var vis = document.createElement("span");
    vis.setAttribute("aria-hidden", "true");
    vis.textContent = c.before + format(c, 0) + c.after;
    var real = document.createElement("span");
    real.className = "visually-hidden";
    real.textContent = c.original;
    frag.appendChild(vis);
    frag.appendChild(real);
    c.node.parentNode.replaceChild(frag, c.node);
    c.vis = vis; c.real = real;
  }

  function finish(c) {
    if (c.done) return;
    c.done = true;
    if (c.vis) {
      c.vis.parentNode.replaceChild(c.node, c.vis);
      c.real.parentNode.removeChild(c.real);
      c.vis = c.real = null;
    }
    c.node.nodeValue = c.original;
  }

  function run(c, delay) {
    if (c.done) return;
    prime(c);
    var start = null;
    function step(now) {
      if (c.done) return;
      if (start === null) start = now + (delay || 0);
      var t = Math.min(1, Math.max(0, (now - start) / COUNT_MS));
      if (t >= 1) { finish(c); return; }
      c.vis.textContent = c.before + format(c, c.target * easeOut(t)) + c.after;
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---- setup ----------------------------------------------------------- */
  function init() {
    // Dimension lines and timeline: CSS transitions keyed on .is-in.
    var once = document.querySelectorAll(".sec-head, .path, .bars, .ba, .measure");

    // Bars: per-row stagger (small) and paired numbers.
    var groups = [];
    Array.prototype.forEach.call(document.querySelectorAll(".bars, .ba"), function (g) {
      var rows = g.querySelectorAll(".bars > li, .ba > div");
      var nums = [];
      Array.prototype.forEach.call(rows, function (row, i) {
        var fill = row.querySelector(".fill");
        if (fill) fill.style.transitionDelay = (i * 60) + "ms";
        var n = row.querySelector(".v, .num");
        var c = n && /\d/.test(n.textContent) && !/[～~–-]/.test(n.textContent) ? prepareCounter(n) : null;
        if (c) nums.push({ c: c, delay: i * 60 });
      });
      g._motionNums = nums;
      groups.push(g);
    });
    Array.prototype.forEach.call(document.querySelectorAll(".measure .val"), function (v) {
      var c = prepareCounter(v);
      if (c) v.closest(".measure")._motionNums = [{ c: c, delay: 0 }];
    });

    // Show zeros right away so a revealed element never flashes its final value first.
    counters.forEach(prime);

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        io.unobserve(el);
        el.classList.add("is-in");
        (el._motionNums || []).forEach(function (n) { run(n.c, n.delay); });
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });
    Array.prototype.forEach.call(once, function (el) { io.observe(el); });

    // Connector flow: SVG lines get a light dash overlay; .flow uses CSS only.
    Array.prototype.forEach.call(document.querySelectorAll(".diagram svg .dg-line, .diagram svg .dg-back"), function (p) {
      var o = p.cloneNode(false);
      o.removeAttribute("marker-end");
      o.removeAttribute("class");
      o.setAttribute("class", "dg-flow");
      o.setAttribute("aria-hidden", "true");
      p.parentNode.insertBefore(o, p.nextSibling);
    });
    var flowIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle("flow-on", e.isIntersecting); });
    });
    Array.prototype.forEach.call(document.querySelectorAll(".diagram, .flow"), function (el) { flowIO.observe(el); });

    // Printing or saving never shows a half-drawn page.
    window.addEventListener("beforeprint", function () {
      counters.forEach(finish);
      Array.prototype.forEach.call(once, function (el) { el.classList.add("is-in"); });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
