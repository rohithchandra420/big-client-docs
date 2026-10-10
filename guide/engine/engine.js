/*! Alfredoc guide engine v1.1 — generic guide behaviour. Do not edit inside a project:
 *  edit the master copy in Alfredoc kit/guide-engine, then re-copy to each project guide.
 *  Project-specific demos belong in project/project.js (use window.GuideKit). */
(function () {
  "use strict";
  var G = window.GUIDE;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* Generic segmented control: buttons with aria-pressed */
  function seg(container, onPick) {
    container.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || !container.contains(b)) return;
      $$("button", container).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      onPick(b);
    });
  }

  /* Demo modal → Promise<boolean> */
  var modal = $("#modal");
  function ask(title, body, yes) {
    return new Promise(function (resolve) {
      $("#modalTitle").textContent = title;
      $("#modalBody").innerHTML = body;
      $("#modalYes").textContent = yes || "Confirm";
      modal.classList.add("open");
      $("#modalYes").focus();
      function done(v) {
        modal.classList.remove("open");
        $("#modalYes").onclick = $("#modalNo").onclick = null;
        document.removeEventListener("keydown", onKey);
        resolve(v);
      }
      function onKey(e) { if (e.key === "Escape") done(false); }
      $("#modalYes").onclick = function () { done(true); };
      $("#modalNo").onclick = function () { done(false); };
      document.addEventListener("keydown", onKey);
    });
  }

  if (modal) modal.addEventListener("click", function (e) { if (e.target === modal) $("#modalNo").click(); });

  /* ---------- Meta: [data-meta="a.b"] ← GUIDE.meta.a.b ; [data-count-from="list"] ← GUIDE[list].length ---------- */
  $$("[data-meta]").forEach(function (el) {
    var v = el.dataset.meta.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, G.meta);
    if (v != null) el.textContent = v;
  });
  $$("[data-count-from]").forEach(function (el) {
    var list = G[el.dataset.countFrom];
    if (list) { el.dataset.count = list.length; el.textContent = list.length; }
  });

  /* ---------- TOC + Contents ---------- */
  var chapters = $$("section.chapter[data-toc]");
  var toc = $("#toc"), contents = $("#contentsTable");
  chapters.forEach(function (sec) {
    var no = sec.dataset.no, label = sec.dataset.toc;
    var li = document.createElement("li");
    li.innerHTML = '<a href="#' + sec.id + '"><span class="n">' + esc(no) + "</span><span>" + esc(label) + "</span></a>";
    toc.appendChild(li);
    if (sec.id === "contents") return;
    var lead = $(".lead", sec), desc = lead ? lead.textContent : ($("p", sec) ? $("p", sec).textContent : "");
    if (desc.length > 120) desc = desc.slice(0, 117).replace(/\s+\S*$/, "") + "…";
    var tr = document.createElement("tr");
    tr.innerHTML = '<td style="width:56px"><b>' + esc(no || "—") + '</b></td><td style="width:34%"><a href="#' + sec.id + '">' + esc(label) + '</a></td><td style="color:var(--text-2)">' + esc(desc) + "</td>";
    contents.appendChild(tr);
  });

  /* Scrollspy */
  var tocLinks = $$("#toc a");
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      tocLinks.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id); });
    });
  }, { rootMargin: "-20% 0px -70% 0px" });
  chapters.forEach(function (s) { spy.observe(s); });

  /* Progress + back to top */
  var prog = $("#progress"), toTop = $("#toTop");
  function onScroll() {
    var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
    prog.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    toTop.classList.toggle("show", h.scrollTop > 800);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  toTop.addEventListener("click", function () { window.scrollTo({ top: 0 }); });

  /* Mobile nav */
  var menuBtn = $("#menuBtn");
  function setNav(open) { document.body.classList.toggle("nav-open", open); menuBtn.setAttribute("aria-expanded", open); }
  menuBtn.addEventListener("click", function () { setNav(!document.body.classList.contains("nav-open")); });
  $("#scrim").addEventListener("click", function () { setNav(false); });
  $("#sidebar").addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });

  /* Theme + print */
  $("#themeBtn").addEventListener("click", function () {
    var cur = document.documentElement.getAttribute("data-theme");
    var dark = cur ? cur === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    var next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    store.set("guide-theme", next);
  });
  $("#printBtn").addEventListener("click", function () {
    $$("details").forEach(function (d) { d.open = true; });
    window.print();
  });

  /* Flash a chapter heading when navigated to */
  function flash(id) {
    var s = document.getElementById(id);
    if (!s) return;
    var sec = s.closest("section.chapter") || s;
    sec.classList.remove("flash"); void sec.offsetWidth; sec.classList.add("flash");
  }
  window.addEventListener("hashchange", function () { flash(location.hash.slice(1)); });

  /* ---------- Search ---------- */
  var sInput = $("#search"), sRes = $("#searchResults");
  var index = chapters.filter(function (s) { return s.id !== "contents"; }).map(function (s) {
    return { id: s.id, title: s.dataset.toc, text: s.textContent.replace(/\s+/g, " ") };
  });
  function runSearch() {
    var q = sInput.value.trim();
    if (q.length < 2) { sRes.classList.remove("open"); return; }
    var re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    var hits = index.filter(function (x) { return re.test(x.text); }).slice(0, 8);
    if (!hits.length) { sRes.innerHTML = '<div class="sr-empty">No matches for “' + esc(q) + '”.</div>'; sRes.classList.add("open"); return; }
    sRes.innerHTML = hits.map(function (h) {
      var i = h.text.search(re), from = Math.max(0, i - 50);
      var snip = (from ? "…" : "") + h.text.slice(from, i + q.length + 70) + "…";
      var safe = esc(snip).replace(new RegExp(esc(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig"), function (m) { return "<mark>" + m + "</mark>"; });
      return '<a href="#' + h.id + '" role="option"><div class="sr-title">' + esc(h.title) + '</div><div class="sr-snip">' + safe + "</div></a>";
    }).join("");
    sRes.classList.add("open");
  }
  sInput.addEventListener("input", runSearch);
  sInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { var a = $("a", sRes); if (a) a.click(); }
    if (e.key === "Escape") { sRes.classList.remove("open"); sInput.blur(); }
    if (e.key === "ArrowDown") { var f = $("a", sRes); if (f) { e.preventDefault(); f.focus(); } }
  });
  sRes.addEventListener("click", function (e) { if (e.target.closest("a")) { sRes.classList.remove("open"); sInput.value = ""; } });
  document.addEventListener("click", function (e) { if (!e.target.closest(".search-wrap")) sRes.classList.remove("open"); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement.tagName !== "INPUT") { e.preventDefault(); sInput.focus(); }
  });

  /* ---------- Reveal + count-up ---------- */
  var reveal = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      var v = $("[data-count]", en.target);
      if (v && !v.dataset.done) {
        v.dataset.done = 1;
        var end = +v.dataset.count, t0 = null;
        var step = function (t) {
          t0 = t0 || t;
          var p = Math.min(1, (t - t0) / 900);
          v.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
      reveal.unobserve(en.target);
    });
  }, { threshold: 0.15 });
  $$(".reveal").forEach(function (el) { reveal.observe(el); });


  /* ---------- Module map ---------- */
  if ($("#moduleMap") && G.modules) {
    var mm = $("#moduleMap"), md = $("#moduleDetail");
    G.modules.forEach(function (m, i) {
      var b = document.createElement("button");
      b.className = "module-tile"; b.setAttribute("aria-pressed", i === 0 ? "true" : "false"); b.dataset.id = m.id;
      b.innerHTML = '<span class="ic" aria-hidden="true">' + m.icon + '</span><span class="nm">' + esc(m.name) + "</span>";
      mm.appendChild(b);
    });
    function showModule(id) {
      var m = G.modules.filter(function (x) { return x.id === id; })[0];
      md.innerHTML = "<h4>" + m.icon + " " + esc(m.name) + '</h4><div class="who">Used by: ' + esc(m.who) + "</div><p>" + esc(m.summary) +
        '</p><a class="btn small" href="#' + m.section + '">Read the chapter →</a>';
    }
    seg(mm, function (b) { showModule(b.dataset.id); });
    showModule(G.modules[0].id);
  }

  /* ---------- Role explorer + matrix ---------- */
  if (G.roles && G.capabilities) {
  var DEF = G.meta.defaultRole || G.roles[0].id;
  var MARK = { full: "F", scoped: "S", conditional: "G", none: "—" };
  var MARK_ICON = { full: "✓", scoped: "◐", conditional: "?", none: "✕" };
  var roleSeg = $("#roleSeg");
  G.roles.forEach(function (r, i) {
    var b = document.createElement("button");
    b.textContent = r.id; b.title = r.name; b.dataset.role = r.id; b.setAttribute("aria-pressed", r.id === DEF ? "true" : "false");
    roleSeg.appendChild(b);
  });
  function showRole(id) {
    var r = G.roles.filter(function (x) { return x.id === id; })[0];
    $("#roleBlurb").innerHTML = "<b>" + esc(r.name) + " (" + r.id + ")</b>: " + esc(r.blurb);
    $("#capList").innerHTML = G.capabilities.map(function (c) {
      var v = c[id], lv = v[0], note = v[1] || ({ full: "Full access", none: "Not available to this role" }[lv] || "");
      return '<div class="cap lv-' + lv + '"><span class="mk" aria-label="' + lv + '">' + MARK_ICON[lv] + '</span><div><div class="t">' + esc(c.name) + '</div><div class="d">' + esc(note) + "</div></div></div>";
    }).join("");
  }
  seg(roleSeg, function (b) { showRole(b.dataset.role); });
  showRole(DEF);
  /* Appendix C matrix */
  $("#matrixHead").innerHTML = "<tr><th>Feature</th>" + G.roles.map(function (r) { return '<th class="cell" title="' + esc(r.name) + '">' + r.id + "</th>"; }).join("") + "</tr>";
  $("#matrixBody").innerHTML = G.capabilities.map(function (c) {
    return '<tr><td><div class="area">' + esc(c.area) + "</div>" + esc(c.name) + "</td>" + G.roles.map(function (r) {
      var v = c[r.id], note = v[1] || ({ full: "Full access", none: "No access", scoped: "Own area only", conditional: "If granted" }[v[0]]);
      return '<td class="cell"><span class="dot ' + v[0] + '" tabindex="0" title="' + esc(r.id + ": " + note) + '" data-note="' + esc(r.name + " — " + c.name + ": " + note) + '">' + MARK[v[0]] + "</span></td>";
    }).join("") + "</tr>";
  }).join("");
  var mNote = document.createElement("p");
  mNote.className = "demo-msg"; mNote.setAttribute("aria-live", "polite");
  $(".matrix").after(mNote);
  $("#matrixBody").addEventListener("click", function (e) { var d = e.target.closest(".dot"); if (d) mNote.textContent = d.dataset.note; });
  $("#matrixBody").addEventListener("focusin", function (e) { var d = e.target.closest(".dot"); if (d) mNote.textContent = d.dataset.note; });
  }

  /* ---------- Chip filters ---------- */
  function chipFilter(container, options, onPick) {
    container.innerHTML = options.map(function (o, i) { return '<button class="chip" aria-pressed="' + (i === 0) + '" data-v="' + esc(o[0]) + '">' + esc(o[1]) + "</button>"; }).join("");
    seg(container, function (b) { onPick(b.dataset.v); });
  }

  /* ---------- Limitations ---------- */
  if ($("#limList") && G.limitations) {
    var KIND = { design: ["By design", "info"], planned: ["Planned", "warn"], open: ["Not yet planned", "muted"] };
    var renderLims = function (k) {
      $("#limList").innerHTML = G.limitations.filter(function (l) { return k === "all" || l.kind === k; }).map(function (l) {
        return '<div class="lim"><div class="top"><strong>' + esc(l.title) + '</strong><span class="badge muted">' + esc(l.area) + '</span><span class="badge ' + KIND[l.kind][1] + '">' + KIND[l.kind][0] + "</span></div><p>" + esc(l.text) + "</p></div>";
      }).join("");
    };
    if ($("#limFilters")) chipFilter($("#limFilters"), [["all", "All (" + G.limitations.length + ")"], ["planned", "Planned"], ["open", "Not yet planned"], ["design", "By design"]], renderLims);
    renderLims("all");
  }

  /* ---------- Roadmap ---------- */
  if ($("#timeline") && G.roadmap) {
    var STATUS = { shipped: ["Shipped", "ok"], "in-development": ["In development", "info"], planned: ["Planned", "warn"], idea: ["Idea", "idea"] };
    var renderRoadmap = function (k) {
      $("#timeline").innerHTML = G.roadmap.filter(function (r) { return k === "all" || r.status === k; }).map(function (r) {
        return '<div class="tl-item ' + r.status + '"><div class="tl-card"><div class="top"><strong>' + esc(r.title) + "</strong>" +
          (r.priority ? '<span class="badge bad">' + esc(r.priority) + "</span>" : "") + '<span class="badge ' + STATUS[r.status][1] + '">' + STATUS[r.status][0] + '</span><span class="when">' + esc(r.when) + "</span></div><p>" + esc(r.text) + "</p></div></div>";
      }).join("");
    };
    var count = function (s) { return G.roadmap.filter(function (r) { return r.status === s; }).length; };
    if ($("#rmFilters")) chipFilter($("#rmFilters"), [["all", "Everything"], ["shipped", "Shipped (" + count("shipped") + ")"], ["in-development", "In development (" + count("in-development") + ")"], ["planned", "Planned (" + count("planned") + ")"], ["idea", "Ideas (" + count("idea") + ")"]], renderRoadmap);
    renderRoadmap("all");
  }

  /* ---------- Glossary ---------- */
  if ($("#glossary") && G.glossary) {
    var renderGloss = function (q) {
      q = (q || "").toLowerCase();
      var rows = G.glossary.filter(function (g) { return !q || (g[0] + " " + g[1]).toLowerCase().indexOf(q) > -1; });
      $("#glossary").innerHTML = rows.length ? rows.map(function (g) { return "<dt>" + esc(g[0]) + "</dt><dd>" + esc(g[1]) + "</dd>"; }).join("") : "<dt>No match</dt><dd>Try another word.</dd>";
    };
    if ($("#glossFilter")) $("#glossFilter").addEventListener("input", function (e) { renderGloss(e.target.value); });
    renderGloss("");
  }

  /* ---------- Releases (one filter chip per versioned part found in the data) ---------- */
  if ($("#relRows") && G.releases) {
    var apps = G.releases.map(function (r) { return r.app; }).filter(function (a, i, all) { return all.indexOf(a) === i; });
    var APP_BADGE = ["info", "idea", "ok", "warn"];
    var renderRel = function (k) {
      $("#relRows").innerHTML = G.releases.filter(function (r) { return k === "all" || r.app === k; }).map(function (r) {
        return "<tr><td style='white-space:nowrap'>" + esc(r.date) + '</td><td><span class="badge ' + APP_BADGE[apps.indexOf(r.app) % APP_BADGE.length] + '">' + esc(r.app) + "</span></td><td><b>" + esc(r.v) + "</b></td><td>" + esc(r.text) + "</td></tr>";
      }).join("");
    };
    if ($("#relFilters") && apps.length > 1) chipFilter($("#relFilters"), [["all", "All"]].concat(apps.map(function (a) { return [a, a]; })), renderRel);
    renderRel("all");
  }

  /* ---------- Document history ---------- */
  if ($("#histRows") && G.docHistory) {
    $("#histRows").innerHTML = G.docHistory.map(function (h) { return "<tr><td style='white-space:nowrap'>" + esc(h.date) + "</td><td>" + esc(h.through) + "</td><td>" + esc(h.text) + "</td></tr>"; }).join("");
  }

  /* ---------- Screenshot figures ----------
     <figure class="shot" data-shot="name" data-caption="…" [data-views="desktop,phone"]> → img/<name>-<view>.webp,
     view switch, click to zoom */
  var lb = null;
  function zoom(src, alt) {
    if (!lb) {
      lb = document.createElement("div"); lb.className = "lightbox"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-label", "Enlarged screenshot");
      lb.innerHTML = '<img alt=""><button class="icon-btn lb-close" aria-label="Close">✕</button>';
      document.body.appendChild(lb);
      lb.addEventListener("click", function () { lb.classList.remove("open"); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") lb.classList.remove("open"); });
    }
    var im = $("img", lb); im.src = src; im.alt = alt; lb.classList.add("open");
  }
  $$("figure.shot[data-shot]").forEach(function (f) {
    var name = f.dataset.shot, cap = f.dataset.caption || "", views = (f.dataset.views || "desktop,phone").split(",");
    if (window.matchMedia("(max-width: 640px)").matches && views.indexOf("phone") > 0) views = ["phone"].concat(views.filter(function (v) { return v !== "phone"; }));
    var label = { desktop: "Desktop", phone: "Phone" };
    f.innerHTML = '<div class="shot-bar"><figcaption class="shot-cap">' + esc(cap) + "</figcaption>" +
      (views.length > 1 ? '<div class="seg no-print">' + views.map(function (v, i) { return '<button aria-pressed="' + (i === 0) + '" data-v="' + v + '">' + (label[v] || v) + "</button>"; }).join("") + "</div>" : "") +
      '</div><div class="shot-frame"><img loading="lazy" decoding="async" src="img/' + name + "-" + views[0] + '.webp" alt="' + esc(cap) + '"></div>';
    var img = $("img", f), sw = $(".seg", f);
    f.classList.add("v-" + views[0]);
    if (sw) seg(sw, function (b) { views.forEach(function (v) { f.classList.remove("v-" + v); }); f.classList.add("v-" + b.dataset.v); img.src = "img/" + name + "-" + b.dataset.v + ".webp"; });
    img.addEventListener("click", function () { zoom(img.src, img.alt); });
  });

  /* Expose helpers for project demos */
  window.GuideKit = { G: G, $: $, $$: $$, esc: esc, store: store, seg: seg, ask: ask, flash: flash };

  /* Initial hash flash */
  if (location.hash) setTimeout(function () { flash(location.hash.slice(1)); }, 300);
})();
