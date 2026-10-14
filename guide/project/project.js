/* BiG Product Guide — project-specific demos. Uses window.GuideKit from engine.js. */
(function () {
  "use strict";
  var K = window.GuideKit, G = K.G, $ = K.$, $$ = K.$$, esc = K.esc, seg = K.seg, ask = K.ask;

  /* ---------- Access tiers ---------- */
  var tierSeg = $("#tierSeg");
  function showTier(n) { $$("#tiers .tier").forEach(function (t) { t.classList.toggle("on", +t.dataset.level <= n); }); }
  seg(tierSeg, function (b) { showTier(+b.dataset.tier); });
  showTier(1);

  /* ---------- 3. Event lifecycle ---------- */
  var STAGES = {
    draft: { t: "Draft", who: "Admins only", text: "The event is being prepared. Admins add pass types and build tents. Team Leads and volunteers can't see it yet, so nothing half-finished reaches the floor." },
    active: { t: "Active", who: "Everyone with access", text: "The event is live. Team Leads and volunteers can select it in the sidebar, and Box Office, Accommodation and the Dashboard all work against it." },
    archived: { t: "Archived", who: "Admins only", text: "The festival is over. All bookings, tents and records are kept, but the event leaves everyday lists. Events with bookings are archived, never deleted." }
  };
  function showStage(k) { var s = STAGES[k]; $("#stageDetail").innerHTML = "<h4 style='margin:0 0 4px'>" + s.t + "</h4><div class='demo-msg' style='margin-bottom:6px'>Visible to: " + s.who + "</div><p style='margin:0'>" + s.text + "</p>"; }
  seg($("#lifecycle"), function (b) { showStage(b.dataset.stage); });
  showStage("draft");

  /* ---------- 4. Gate simulator ---------- */
  var bookingScreen = function (extra) {
    return '<div class="row"><b>Booking #1042</b><span>Asha Menon</span></div>' +
      '<div class="row"><span>Festival Pass — Asha Menon</span>' + (extra.a || '<span class="badge muted">Not admitted</span>') + "</div>" +
      '<div class="row"><span>Festival Pass — ' + (extra.rn || "<i>details missing</i>") + "</span>" + (extra.b || '<span class="badge warn">Incomplete</span>') + "</div>" +
      '<div class="row"><span>Two-Person Tent</span>' + (extra.t || '<span class="badge muted">No tent yet</span>') + "</div>";
  };
  var SC = {
    qr: [
      { n: "n-arrive", e: [], t: "Attendee arrives", x: "Asha arrives at the gate with the QR code from her ticket email. She bought two festival passes and a two-person tent.", s: '<div class="row"><span>Asha Menon</span><span class="badge info">Has QR code</span></div>' },
      { n: "n-decide", e: ["e-arrive"], t: "Is there a booking?", x: "Yes, she booked in advance, so staff use the fast route.", s: "" },
      { n: "n-scan", e: ["e-scan"], t: "Scan the QR code", x: "Staff scan it on the Registration page. The platform confirms the code is genuine and the booking opens immediately, with no typing and no spelling mistakes.", s: '<div class="row"><span>Scanning…</span><span class="badge ok">Match</span></div>' },
      { n: "n-found", e: ["e-scan-found"], t: "Booking Found", x: "Everyone on the booking is listed, with what's done and what's outstanding.", s: bookingScreen({}) },
      { n: "n-details", e: ["e-found-details"], t: "Complete missing details", x: "Her friend Rahul's details were never filled in. Staff complete them on the Counter Form while he's at the desk.", s: bookingScreen({ rn: "Rahul Verma", b: '<span class="badge muted">Not admitted</span>' }) },
      { n: "n-checkin", e: ["e-details-checkin"], t: "Check In", x: "Staff verify ID and give wristbands in person, then tap Check In for each person. The gate numbers update live.", s: bookingScreen({ rn: "Rahul Verma", a: '<span class="badge ok">Admitted</span>', b: '<span class="badge ok">Admitted</span>' }) },
      { n: "n-tent", e: ["e-checkin-tent"], t: "Allocate Tent", x: "The tent pass is linked to Asha, the suggested match. Only two-person tents with space are offered, and they get TW3.", s: bookingScreen({ rn: "Rahul Verma", a: '<span class="badge ok">Admitted</span>', b: '<span class="badge ok">Admitted</span>', t: '<span class="badge ok">TW3</span>' }) },
      { n: "n-done", e: ["e-tent-done"], t: "Admitted", x: "Done in about a minute. Bookings, Inventory and the Dashboard all reflect it straight away.", s: '<div class="row"><span>Checked In</span><b>+2</b></div><div class="row"><span>Pending Admits</span><b>−2</b></div><div class="row"><span>Tent TW3</span><b>2 / 2</b></div>' }
    ],
    search: [
      { n: "n-arrive", e: [], t: "Attendee arrives", x: "Karan booked online but can't find his QR code.", s: '<div class="row"><span>Karan Shah</span><span class="badge warn">No QR code</span></div>' },
      { n: "n-decide", e: ["e-arrive"], t: "Is there a booking?", x: "Yes, he says he booked, so staff look it up.", s: "" },
      { n: "n-search", e: ["e-search"], t: "Search for the booking", x: "Staff search by name, phone, email or order number. Search only covers the active event, so last year's bookings never get in the way.", s: '<div class="row"><span>Search: “karan”</span><span>1 result</span></div><div class="row"><b>#1043 · Karan Shah</b><span>1 pass</span></div>' },
      { n: "n-found", e: ["e-search-found"], t: "Booking Found", x: "His booking opens with one festival pass. His details are already complete.", s: '<div class="row"><b>Booking #1043</b><span>Karan Shah</span></div><div class="row"><span>Festival Pass — Karan Shah</span><span class="badge muted">Not admitted</span></div>' },
      { n: "n-details", e: ["e-found-details"], t: "Details already complete", x: "Nothing to fill in, so this step is skipped in practice.", s: '<div class="row"><span>Details</span><span class="badge ok">Complete</span></div>' },
      { n: "n-checkin", e: ["e-details-checkin"], t: "Check In", x: "One tap after the ID check. He has no tent pass, so there's no tent step.", s: '<div class="row"><span>Festival Pass — Karan Shah</span><span class="badge ok">Admitted</span></div>' },
      { n: "n-done", e: ["e-checkin-tent", "e-tent-done"], t: "Admitted", x: "Karan is in. The lookup took seconds.", s: '<div class="row"><span>Checked In</span><b>+1</b></div>' }
    ],
    walkup: [
      { n: "n-arrive", e: [], t: "Attendee arrives", x: "Sana turns up without a booking and wants a festival pass.", s: '<div class="row"><span>Sana Khan</span><span class="badge muted">No booking</span></div>' },
      { n: "n-decide", e: ["e-arrive"], t: "Is there a booking?", x: "No, so this is a walk-up.", s: "" },
      { n: "n-spot", e: ["e-spot"], t: "Spot Registration", x: "Staff pick items from the event's pass types and enter Sana's details. The platform assigns an order number automatically.", s: '<div class="row"><span>Festival Pass</span><span>× 1</span></div><div class="row"><span>Buyer</span><span>Sana Khan</span></div><div class="row"><span>Order no.</span><b>#1046 (auto)</b></div>' },
      { n: "n-found", e: ["e-spot-found"], t: "Booking Found", x: "The new booking opens like any other and is counted as a spot registration.", s: '<div class="row"><b>Booking #1046</b><span class="badge info">Spot</span></div><div class="row"><span>Festival Pass — Sana Khan</span><span class="badge muted">Not admitted</span></div>' },
      { n: "n-details", e: ["e-found-details"], t: "Details captured", x: "Her details were entered during Spot Registration, so nothing is missing.", s: '<div class="row"><span>Details</span><span class="badge ok">Complete</span></div>' },
      { n: "n-checkin", e: ["e-details-checkin"], t: "Check In", x: "Checked in after the ID check, like everyone else.", s: '<div class="row"><span>Festival Pass — Sana Khan</span><span class="badge ok">Admitted</span></div>' },
      { n: "n-done", e: ["e-checkin-tent", "e-tent-done"], t: "Admitted", x: "Walk-up to admitted in one flow. Spot Registrations rises by one.", s: '<div class="row"><span>Spot Registrations</span><b>+1</b></div><div class="row"><span>Checked In</span><b>+1</b></div>' }
    ]
  };
  var sc = "qr", si = 0;
  function renderSim() {
    var steps = SC[sc], st = steps[si];
    var path = steps.map(function (x) { return x.n; });
    var seen = steps.slice(0, si).map(function (x) { return x.n; });
    var edges = [].concat.apply([], steps.slice(0, si + 1).map(function (x) { return x.e; }));
    $$(".flow-node").forEach(function (g) {
      g.classList.toggle("active", g.id === st.n);
      g.classList.toggle("done", seen.indexOf(g.id) > -1);
      g.classList.toggle("dim", path.indexOf(g.id) === -1);
    });
    $$(".flow-edge").forEach(function (p) { p.classList.toggle("active", edges.indexOf(p.id) > -1); });
    $("#simStep").textContent = "Step " + (si + 1) + " of " + steps.length;
    $("#simTitle").textContent = st.t;
    $("#simText").textContent = st.x;
    $("#simScreen").innerHTML = st.s || '<div class="row"><span>Staff decision</span><span>—</span></div>';
    $("#simPrev").disabled = si === 0;
    $("#simNext").textContent = si === steps.length - 1 ? "Start again ↺" : "Next →";
    $("#simDots").innerHTML = steps.map(function (_, i) { return '<i class="' + (i <= si ? "on" : "") + '"></i>'; }).join("");
  }
  seg($("#simSeg"), function (b) { sc = b.dataset.sc; si = 0; renderSim(); });
  $("#simPrev").addEventListener("click", function () { if (si > 0) { si--; renderSim(); } });
  $("#simNext").addEventListener("click", function () { si = si === SC[sc].length - 1 ? 0 : si + 1; renderSim(); });
  renderSim();

  /* ---------- Bulk Upload demo ---------- */
  var UP_BASE = [
    { o: "1042", i: "Festival Pass", q: 2, b: "Asha Menon", m: "asha@example.com", r: "ok" },
    { o: "1042", i: "Two-Person Tent", q: 1, b: "Asha Menon", m: "asha@example.com", r: "ok" },
    { o: "1043", i: "Festival Pass", q: 1, b: "Karan Shah", m: "", r: "missing" },
    { o: "1001", i: "Festival Pass", q: 1, b: "Meera Iyer", m: "meera@example.com", r: "dup" },
    { o: "1044", i: "VIP Lounge", q: 1, b: "Dev Patel", m: "dev@example.com", r: "unknown" },
    { o: "1045", i: "Festival Pass", q: 3, b: "Sana Khan", m: "sana@example.com", r: "ok" }
  ];
  var up, checked;
  function upReset() { up = UP_BASE.map(function (x) { return Object.assign({}, x); }); checked = false; upRender(); $("#uploadMsg").textContent = ""; $("#uploadFix").disabled = true; }
  function upRender() {
    $("#uploadRows").innerHTML = up.map(function (x) {
      var res = "", cls = "";
      if (checked) {
        if (x.r === "ok") { res = '<span class="badge ok">Ready</span>' + (x.o === "1042" ? '<span class="badge muted">grouped into #1042</span>' : ""); cls = "okrow"; }
        if (x.r === "missing") { res = '<span class="badge bad">Email missing</span>'; cls = "err"; }
        if (x.r === "dup") { res = '<span class="badge bad">Order already exists</span>'; cls = "err"; }
        if (x.r === "unknown") { res = '<span class="badge warn">Unknown item</span>'; cls = "fix"; }
      } else res = '<span class="badge muted">Not checked</span>';
      return '<tr class="' + cls + '"><td>' + x.o + "</td><td>" + esc(x.i) + '</td><td class="num">' + x.q + "</td><td>" + esc(x.b) + "</td><td>" + (x.m ? esc(x.m) : "<i>—</i>") + "</td><td>" + res + "</td></tr>";
    }).join("");
  }
  function upSummary() {
    var orders = {}, bad = 0, unk = 0;
    up.forEach(function (x) { if (x.r === "ok") orders[x.o] = 1; if (x.r === "missing" || x.r === "dup") bad++; if (x.r === "unknown") unk++; });
    var n = Object.keys(orders).length;
    $("#uploadMsg").textContent = n + " bookings ready" + (unk ? " · " + unk + " unknown item to confirm" : "") + (bad ? " · " + bad + " rows need correcting in the file" : "");
  }
  $("#uploadCheck").addEventListener("click", function () { checked = true; upRender(); upSummary(); $("#uploadFix").disabled = !up.some(function (x) { return x.r === "unknown"; }); });
  $("#uploadFix").addEventListener("click", function () {
    up.forEach(function (x) { if (x.r === "unknown") x.r = "ok"; });
    $("#uploadFix").disabled = true; upRender(); upSummary();
  });
  $("#uploadReset").addEventListener("click", upReset);
  upReset();

  /* ---------- Attendee actions demo ---------- */
  var att;
  function attReset() {
    att = [
      { id: 1, kind: "Festival Pass", name: "Asha Menon", complete: true, admitted: false },
      { id: 2, kind: "Festival Pass", name: "", complete: false, admitted: false },
      { id: 3, kind: "Two-Person Tent", name: "Asha Menon", tent: null }
    ];
  }
  function attRender() {
    $("#attendeeDemo").innerHTML = '<div class="demo-msg" style="margin-bottom:8px"><b>Booking #1042</b> · Asha Menon · <a href="#" id="attResetLink">reset demo</a></div>' + att.map(function (a) {
      var meta, acts;
      if (a.kind === "Festival Pass") {
        meta = '<span class="badge ok">Festival</span>' + (a.complete ? "" : '<span class="badge warn">Incomplete details</span>') + (a.admitted ? '<span class="badge ok">Admitted</span>' : '<span class="badge muted">Not admitted</span>');
        acts = (a.admitted ? "" : '<button class="btn small primary" data-act="checkin" data-id="' + a.id + '">Check In</button>') +
          (a.complete ? '<button class="btn small" data-act="edit" data-id="' + a.id + '">Edit</button>' : '<button class="btn small" data-act="counter" data-id="' + a.id + '">Fill at Counter</button>');
      } else {
        meta = '<span class="badge info">Tent</span>' + (a.tent ? '<span class="badge ok">' + a.tent + "</span>" : '<span class="badge muted">No tent yet</span>');
        acts = a.tent ? '<button class="btn small" data-act="vacate" data-id="' + a.id + '">Vacate</button>' : '<button class="btn small primary" data-act="allocate" data-id="' + a.id + '">Allocate Tent</button>';
      }
      return '<div class="attendee"><div><div class="nm">' + (a.name ? esc(a.name) : "<i>Name not yet given</i>") + " · " + a.kind + '</div><div class="meta">' + meta + '</div></div><div class="acts">' + acts + "</div></div>";
    }).join("");
  }
  var aLog = $("#attendeeLog");
  $("#attendeeDemo").addEventListener("click", function (e) {
    if (e.target.id === "attResetLink") { e.preventDefault(); attReset(); attRender(); aLog.textContent = "Demo reset."; return; }
    var b = e.target.closest("button[data-act]"); if (!b) return;
    var a = att.filter(function (x) { return x.id === +b.dataset.id; })[0];
    var act = b.dataset.act;
    if (act === "checkin") { a.admitted = true; aLog.textContent = "✓ " + (a.name || "Attendee") + " checked in. Gate numbers update everywhere."; attRender(); }
    if (act === "counter") ask("Complete attendee details", "Sample details:<br><b>Rahul Verma</b> · Male · 98xxxxxx10 · rahul@example.com", "Save details").then(function (ok) { if (ok) { a.name = "Rahul Verma"; a.complete = true; aLog.textContent = "Details completed on the Counter Form."; attRender(); } });
    if (act === "edit") ask("Edit attendee details", "Correct a typo, phone number or email for <b>" + esc(a.name) + "</b>. The same form is used, labelled for editing.", "Save changes").then(function (ok) { if (ok) aLog.textContent = "Details updated for " + a.name + "."; });
    if (act === "allocate") ask("Allocate Tent", "Linked festival pass: <b>Asha Menon</b> (suggested match).<br>Vacant two-person tents: <b>TW3</b> (2 places).<br><br>Allocate TW3?", "Allocate TW3").then(function (ok) { if (ok) { a.tent = "TW3"; aLog.textContent = "Tent pass allocated to TW3 and linked to Asha Menon."; attRender(); } });
    if (act === "vacate") ask("Vacate tent place", "Free <b>" + a.tent + "</b> for this tent pass? The place becomes available straight away.", "Vacate").then(function (ok) { if (ok) { aLog.textContent = a.tent + " vacated."; a.tent = null; attRender(); } });
  });
  attReset(); attRender();

  /* ---------- Tent demo ---------- */
  var TYPES = { TW: "Two-Person Tent", FA: "Family Tent" };
  var tents, queue, pick;
  function tentReset() {
    tents = [
      { no: "TW1", type: "TW", cap: 2, occ: [{ n: "Meera", g: "F" }, { n: "Lina", g: "F" }] },
      { no: "TW2", type: "TW", cap: 2, occ: [{ n: "Karan", g: "M" }] },
      { no: "TW3", type: "TW", cap: 2, occ: [] },
      { no: "FA1", type: "FA", cap: 4, occ: [{ n: "Sana", g: "F" }, { n: "Dev", g: "M" }] },
      { no: "FA2", type: "FA", cap: 4, occ: [] }
    ];
    queue = [{ n: "Rahul", g: "M", type: "TW" }, { n: "Priya", g: "F", type: "TW" }, { n: "Neha", g: "F", type: "FA" }, { n: "Arun", g: "M", type: "FA" }];
    pick = null;
  }
  function gLabel(t) { var gs = t.occ.map(function (o) { return o.g; }); if (!gs.length) return "—"; return gs.every(function (g) { return g === gs[0]; }) ? (gs[0] === "M" ? "Male" : "Female") : "Mixed"; }
  function tentRender() {
    var units = tents.length, open = tents.filter(function (t) { return t.occ.length < t.cap; }).length;
    var slots = tents.reduce(function (s, t) { return s + t.cap; }, 0), vac = tents.reduce(function (s, t) { return s + t.cap - t.occ.length; }, 0);
    var empty = tents.filter(function (t) { return !t.occ.length; }).length, full = units - open;
    $("#occCards").innerHTML =
      '<div class="occ-card"><div class="v">' + open + "/" + units + '</div><div class="l">Units open</div></div>' +
      '<div class="occ-card"><div class="v">' + vac + "/" + slots + '</div><div class="l">Places vacant</div></div>' +
      '<div class="occ-card"><div class="v">' + empty + '</div><div class="l">Wholly vacant</div></div>' +
      '<div class="occ-card"><div class="v">' + full + '</div><div class="l">Full</div></div>';
    $("#queue").innerHTML = '<span class="demo-msg" style="align-self:center">Waiting with a tent pass:</span>' + (queue.length ? queue.map(function (p, i) {
      return '<button class="person" data-i="' + i + '" aria-pressed="' + (pick === i) + '">' + esc(p.n) + " · " + (p.g === "M" ? "M" : "F") + " · " + TYPES[p.type] + "</button>";
    }).join("") : '<span class="badge ok">Everyone housed</span>') + ' <button class="btn small" id="tentReset">Reset</button>';
    var sel = pick !== null ? queue[pick] : null;
    $("#tents").innerHTML = tents.map(function (t, ti) {
      var st = t.occ.length === 0 ? "empty" : t.occ.length >= t.cap ? "full" : "partial";
      var slotsHtml = "";
      for (var k = 0; k < t.cap; k++) {
        var o = t.occ[k];
        slotsHtml += o ? '<button class="slot taken" data-t="' + ti + '" data-k="' + k + '" title="Vacate ' + esc(o.n) + '"><span>' + esc(o.n) + " · " + o.g + '</span><span class="x">vacate ✕</span></button>'
          : '<div class="slot">Vacant</div>';
      }
      var can = sel && sel.type === t.type && t.occ.length < t.cap;
      return '<div class="tent ' + st + '"><div class="hd"><span>' + t.no + '</span><span class="badge muted">' + gLabel(t) + "</span></div>" +
        '<div class="demo-msg" style="font-size:12px">' + TYPES[t.type] + " · " + t.occ.length + "/" + t.cap + "</div>" + slotsHtml +
        '<button class="btn small" style="margin-top:8px;width:100%" data-alloc="' + ti + '"' + (can ? "" : " disabled") + ">Allocate</button></div>";
    }).join("");
  }
  var tLog = $("#tentLog");
  $("#tent-demo").parentNode.addEventListener("click", function (e) {
    if (e.target.id === "tentReset") { tentReset(); tentRender(); tLog.textContent = "Demo reset."; return; }
    var p = e.target.closest(".person");
    if (p) { pick = pick === +p.dataset.i ? null : +p.dataset.i; tentRender(); if (pick !== null) tLog.textContent = "Only " + TYPES[queue[pick].type] + " units with space can be chosen for " + queue[pick].n + "."; return; }
    var al = e.target.closest("[data-alloc]");
    if (al && pick !== null) {
      var t = tents[+al.dataset.alloc], who = queue[pick];
      var mixed = t.occ.some(function (o) { return o.g !== who.g; });
      var go = mixed ? ask("Mixed tent", t.no + " already has " + gLabel(t).toLowerCase() + " occupants. Allocating <b>" + esc(who.n) + "</b> makes it mixed. Staff must confirm this deliberately.", "Allocate anyway") : Promise.resolve(true);
      go.then(function (ok) {
        if (!ok) { tLog.textContent = "Allocation cancelled."; return; }
        t.occ.push({ n: who.n, g: who.g }); queue.splice(pick, 1); pick = null;
        tLog.textContent = "✓ " + who.n + " allocated to " + t.no + "."; tentRender();
      });
      return;
    }
    var s = e.target.closest(".slot.taken");
    if (s) {
      var tt = tents[+s.dataset.t], o = tt.occ[+s.dataset.k];
      ask("Vacate occupant", "Remove <b>" + esc(o.n) + "</b> from " + tt.no + "? Their place becomes free immediately.", "Vacate").then(function (ok) {
        if (!ok) return;
        tt.occ.splice(+s.dataset.k, 1); queue.push({ n: o.n, g: o.g, type: tt.type }); pick = null;
        tLog.textContent = o.n + " vacated from " + tt.no + " and back in the waiting list."; tentRender();
      });
    }
  });
  tentReset(); tentRender();

  /* ---------- Attendance demo ---------- */
  var SLOTS = ["Morning", "Afternoon", "Night"];
  var VOLS = ["Ravi", "Anjali", "Tom", "Lina", "Arjun"];
  var attState, attOther;
  function attnReset() {
    attState = { Ravi: [1, 0, 0], Anjali: [1, 1, 0], Tom: [0, 0, 0], Lina: [0, 0, 0], Arjun: [0, 0, 0] };
    attOther = { "Arjun-1": "Box Office" };
    $("#attMsg").textContent = "";
    attnRender();
  }
  function attnRender() {
    $("#attRows").innerHTML = VOLS.map(function (v) {
      return "<tr><td><b>" + v + "</b></td>" + SLOTS.map(function (s, i) {
        var key = v + "-" + i, other = attOther[key], on = attState[v][i];
        var cls = on ? "on" : other ? "other" : "", label = on ? "✓" : other ? "BO" : "";
        var title = other && !on ? "Marked by " + other : on ? "Marked for Operations" : "Not marked";
        return '<td><button class="att-cell ' + cls + '" data-v="' + v + '" data-i="' + i + '" title="' + title + '" aria-label="' + v + " " + s + ": " + title + '">' + label + "</button></td>";
      }).join("") + "</tr>";
    }).join("");
  }
  $("#attRows").addEventListener("click", function (e) {
    var b = e.target.closest(".att-cell"); if (!b) return;
    var v = b.dataset.v, i = +b.dataset.i;
    attState[v][i] = attState[v][i] ? 0 : 1; attnRender();
    $("#attMsg").textContent = "Unsaved changes.";
  });
  $("#attSave").addEventListener("click", function () {
    var conflicts = Object.keys(attOther).filter(function (k) { var p = k.split("-"); return attState[p[0]][+p[1]]; });
    var go = conflicts.length ? ask("Slot already marked", conflicts.map(function (k) { var p = k.split("-"); return "<b>" + p[0] + "</b>'s " + SLOTS[+p[1]] + " slot is already marked by <b>" + attOther[k] + "</b>."; }).join("<br>") +
      "<br><br>Move it to Operations? Box Office will no longer have it.", "Move to Operations") : Promise.resolve(true);
    go.then(function (ok) {
      if (!ok) { conflicts.forEach(function (k) { var p = k.split("-"); attState[p[0]][+p[1]] = 0; }); attnRender(); $("#attMsg").textContent = "Kept with Box Office. Other changes are still unsaved."; return; }
      conflicts.forEach(function (k) { delete attOther[k]; });
      var n = VOLS.reduce(function (s, v) { return s + attState[v].reduce(function (a, b) { return a + b; }, 0); }, 0);
      attnRender(); $("#attMsg").textContent = "✓ Saved. " + n + " slots marked for Operations today.";
    });
  });
  $("#attReset").addEventListener("click", attnReset);
  attnReset();

  /* ---------- Data model diagram (Chapter 1) ---------- */
  var DM = {
    event: { t: "Event", ch: "events", ch_t: "Admin › Events and pass types",
      x: "One festival edition, with a name, dates and a status. Draft is visible to admins only. Active is live for everyone with access. Archived is kept for the record. Everything sold and built belongs to an event.",
      r: "Offers pass types · receives bookings · has tent units" },
    passtype: { t: "Pass Type", ch: "events", ch_t: "Admin › Events and pass types",
      x: "A kind of pass sold for one event, such as Festival Pass or Two-Person Tent. Its category (Festival, Tent or Add-on) decides how the platform treats it. Tent types get a short code that numbers their units.",
      r: "Belongs to one event · every pass is one of these · tent types have tent units" },
    tent: { t: "Tent unit", ch: "accommodation", ch_t: "Accommodation",
      x: "One physical tent, numbered with its type's code (SO1, SO2…) and with a fixed capacity. It belongs to one event and one tent pass type. Its places are filled by tent passes.",
      r: "Built in Accommodation Setup · filled by tent passes · can't shrink below its occupants" },
    booking: { t: "Booking", ch: "box-office", ch_t: "Box Office",
      x: "One order: the buyer's name and contact details, the order number and total, and every pass bought. Bookings arrive through Bulk Upload or are created at the gate with Spot Registration.",
      r: "Belongs to one event · contains festival passes, tent passes and add-ons" },
    festival: { t: "Festival Pass", ch: "box-office", ch_t: "Box Office",
      x: "Admission for one person on a booking: their name, contact details and gender, and whether they've been admitted. Check In at the gate marks it admitted. Each festival pass counts as one attendee.",
      r: "Part of a booking · a kind of pass type · a tent pass can link to it" },
    tentpass: { t: "Tent Pass", ch: "accommodation", ch_t: "Accommodation",
      x: "A place in a tent, bought on a booking. It's linked to the festival pass of the person staying there, even if they bought on a different booking, and allocated to one tent unit. Vacating frees the place.",
      r: "Part of a booking · linked to a festival pass · allocated to a tent unit" },
    role: { t: "Role", ch: "people-access", ch_t: "People, roles and access",
      x: "Each user has one role: Developer, Director, Admin, Team Lead or Volunteer. The role sets the baseline of what they can see and do.",
      r: "Every user has one" },
    user: { t: "User", ch: "users", ch_t: "Admin › Users",
      x: "A person who signs in, with a role, a home department, a date of joining, access grants and an optional photo. Removing someone with history deactivates them instead, so their records stay intact.",
      r: "Has a role · belongs to a department · is given access grants · has attendance records" },
    grant: { t: "Access grant", ch: "people-access", ch_t: "People, roles and access",
      x: "Read, Write or Manage access to one department, on top of the user's home department. Each tier includes the ones below. Team Leads have Manage in their own department automatically.",
      r: "Given to a user · a tier in one department" },
    department: { t: "Department", ch: "departments", ch_t: "Admin › Departments",
      x: "A festival team, such as Box Office or Operations, shared across all events. Team Leads and volunteers belong to it. Attendance is credited to it, and access grants point to it.",
      r: "Has members · receives attendance · access grants point to it" },
    attendance: { t: "Attendance", ch: "my-department", ch_t: "My Department and attendance",
      x: "One record per person, per day, per slot (Morning, Afternoon or Night). It's credited to the department they worked for and marked by a Team Lead. A slot can belong to only one department at a time.",
      r: "For one user · credited to one department · marked by a Team Lead" }
  };
  var FLOWS = {
    all: null,
    selling: { n: ["event", "passtype", "booking", "festival", "tentpass"], e: [1, 2, 4, 5, 6, 9],
      x: "<b>Selling & admission:</b> an event offers pass types. Bookings come in through Bulk Upload or Spot Registration, and each contains passes of those types. At the gate, each festival pass is checked in." },
    accommodation: { n: ["passtype", "tent", "tentpass", "festival"], e: [3, 5, 7, 8],
      x: "<b>Accommodation:</b> each tent pass type gets numbered tent units in Setup. At the gate, a tent pass is linked to its holder's festival pass and allocated a place in a unit of the matching type." },
    workforce: { n: ["user", "department", "attendance"], e: [13, 14, 15],
      x: "<b>Volunteers & attendance:</b> people belong to departments. Team Leads mark attendance per person, day and slot, credited to the department they worked for, so mid-day moves count correctly." },
    access: { n: ["user", "role", "grant", "department"], e: [10, 11, 12, 15],
      x: "<b>Who can do what:</b> a user's role, their home department and any extra access grants (Read, Write, Manage per department) together decide which pages and actions they get." }
  };
  var dmSvg = $(".dm"), dmPanel = $("#dmPanel");
  function dmFlow(k) {
    var f = FLOWS[k];
    dmSvg.classList.toggle("flowing", !!f);
    $$(".dm-node", dmSvg).forEach(function (n) { n.classList.toggle("in", !!f && f.n.indexOf(n.dataset.id) > -1); n.classList.remove("sel"); });
    for (var i = 1; i <= 15; i++) {
      var on = !!f && f.e.indexOf(i) > -1, e = $("#dme" + i), l = $("#dml" + i);
      if (e) e.classList.toggle("on", on);
      if (l) l.classList.toggle("on", on);
    }
    dmPanel.innerHTML = f ? "<p>" + f.x + "</p>" : "<p><b>Everything:</b> click any box to see what it is and how it connects, or pick a flow above to follow it.</p>";
  }
  function dmPick(node) {
    var d = DM[node.dataset.id];
    $$(".dm-node", dmSvg).forEach(function (n) { n.classList.toggle("sel", n === node); });
    dmPanel.innerHTML = "<h4>" + esc(d.t) + "</h4><p>" + esc(d.x) + '</p><div class="rel">' + esc(d.r) + '</div><a class="btn small" href="#' + d.ch + '">' + esc(d.ch_t) + " →</a>";
  }
  seg($("#dmSeg"), function (b) { dmFlow(b.dataset.flow); });
  dmSvg.addEventListener("click", function (e) { var n = e.target.closest(".dm-node"); if (n) dmPick(n); });
  dmSvg.addEventListener("keydown", function (e) {
    var n = e.target.closest(".dm-node");
    if (n && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); dmPick(n); }
  });
  dmFlow("all");

})();
