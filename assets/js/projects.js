/* projects.js — category filter for the project list.
 * Progressive enhancement: without this script every project is visible,
 * grouped under its category heading. */
(function () {
  "use strict";
  var bar = document.getElementById("filters");
  if (!bar) return;
  var groups = Array.prototype.slice.call(document.querySelectorAll(".cat-group"));
  var cards = Array.prototype.slice.call(document.querySelectorAll("[data-cat]"));
  var cats = [];
  groups.forEach(function (g) {
    var id = g.getAttribute("data-group");
    if (id && id !== "featured") cats.push({ id: id, label: g.getAttribute("data-label") });
  });

  function count(id) {
    return cards.filter(function (c) { return id === "all" || c.getAttribute("data-cat") === id; }).length;
  }

  var buttons = [];
  function add(id, label) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.setAttribute("data-filter", id);
    b.setAttribute("aria-pressed", "false");
    b.innerHTML = "";
    b.appendChild(document.createTextNode(label));
    var c = document.createElement("span");
    c.className = "c";
    c.textContent = count(id);
    b.appendChild(c);
    b.addEventListener("click", function () { apply(id); });
    bar.appendChild(b);
    buttons.push(b);
  }

  var details = Array.prototype.slice.call(document.querySelectorAll("details.more-tools"));
  function apply(id) {
    cards.forEach(function (c) { c.hidden = !(id === "all" || c.getAttribute("data-cat") === id); });
    groups.forEach(function (g) {
      g.hidden = !g.querySelector("[data-cat]:not([hidden])");
    });
    // a filtered view should show its matches, so open a collapsed list that holds some
    if (id !== "all") details.forEach(function (d) { if (d.querySelector("[data-cat]:not([hidden])")) d.open = true; });
    buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-filter") === id)); });
  }

  add("all", "全部");
  cats.forEach(function (c) { add(c.id, c.label); });
  apply("all");

  // a deep link to a category or card should never land on a hidden one
  function fromHash(scroll) {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    if (el.closest("[hidden]")) apply("all");
    var d = el.closest("details");
    if (d) d.open = true;
    if (scroll) el.scrollIntoView();
  }
  window.addEventListener("hashchange", function () { fromHash(false); });
  fromHash(false);
})();

/* V2X clip: plays (muted, looping) while visible, unless reduced motion is on.
 * Native controls stay, and a pause by the viewer is respected until they press play again. */
(function () {
  "use strict";
  var clips = document.querySelectorAll(".clip video");
  if (!clips.length) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return;
  Array.prototype.forEach.call(clips, function (v) {
    var byScript = false, userPaused = false;
    v.preload = "metadata";
    v.addEventListener("pause", function () { if (!byScript && !v.ended) userPaused = true; byScript = false; });
    v.addEventListener("play", function () { userPaused = false; });
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { if (!userPaused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
        else if (!v.paused) { byScript = true; v.pause(); }
      });
    }, { threshold: 0.35 }).observe(v);
  });
})();
