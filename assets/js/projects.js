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

  function apply(id) {
    cards.forEach(function (c) { c.hidden = !(id === "all" || c.getAttribute("data-cat") === id); });
    groups.forEach(function (g) {
      g.hidden = !g.querySelector("[data-cat]:not([hidden])");
    });
    buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-filter") === id)); });
  }

  add("all", "全部");
  cats.forEach(function (c) { add(c.id, c.label); });
  apply("all");

  // a deep link to a category or card should never land on a hidden one
  function fromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    var m = /^cat-(.+)$/.exec(id);
    if (m && cats.some(function (c) { return c.id === m[1]; })) apply("all");
  }
  window.addEventListener("hashchange", fromHash);
})();
