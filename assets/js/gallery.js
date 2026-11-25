/* gallery.js — click a photo or screenshot to view it larger in a <dialog>.
 * Previous / next buttons and the arrow keys step through every zoomable image on the page.
 * Progressive enhancement: without this script the images simply stay inline. */
(function () {
  "use strict";
  var zooms = Array.prototype.slice.call(document.querySelectorAll("button.zoom[data-full]"));
  if (!zooms.length || typeof HTMLDialogElement === "undefined") return;

  var dlg = document.createElement("dialog");
  dlg.className = "lightbox";
  dlg.setAttribute("aria-label", "放大檢視");
  var img = document.createElement("img");
  var cap = document.createElement("p");
  function btn(cls, label, text) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.setAttribute("aria-label", label);
    b.textContent = text;
    return b;
  }
  var close = btn("lb-close", "關閉", "關閉");
  var prev = btn("lb-prev", "上一張", "‹");
  var next = btn("lb-next", "下一張", "›");
  dlg.appendChild(close);
  if (zooms.length > 1) { dlg.appendChild(prev); dlg.appendChild(next); }
  dlg.appendChild(img);
  dlg.appendChild(cap);
  document.body.appendChild(dlg);

  var cur = 0, opener = null;
  function show(i) {
    cur = (i + zooms.length) % zooms.length;
    var b = zooms[cur];
    var src = b.querySelector("img");
    img.src = b.getAttribute("data-full");
    img.alt = src ? src.alt : "";
    var fig = b.closest("figure");
    var fc = fig ? fig.querySelector("figcaption") : null;
    cap.textContent = fc ? fc.textContent : "";
  }
  zooms.forEach(function (b, i) {
    b.addEventListener("click", function () { opener = b; show(i); dlg.showModal(); close.focus(); });
  });
  function closeDlg() { dlg.close(); }
  dlg.addEventListener("close", function () { (opener || zooms[cur]).focus(); });
  close.addEventListener("click", closeDlg);
  prev.addEventListener("click", function () { show(cur - 1); });
  next.addEventListener("click", function () { show(cur + 1); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) closeDlg(); });
  dlg.addEventListener("keydown", function (e) {
    if (zooms.length < 2) return;
    if (e.key === "ArrowLeft") { e.preventDefault(); show(cur - 1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); show(cur + 1); }
  });
})();
