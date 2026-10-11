/* =========================================================
   LINAW Tracker: tile map, region detail, project list, dialog
   All data comes from Linaw.generate() and is randomly generated.
   ========================================================= */
(() => {
  "use strict";
  const L = window.Linaw;
  const { REGIONS, FLAGS, KEYS, esc, fmtPeso, LEVELS } = L;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  if (!$("#tilemap")) return;

  const DEFAULT_SEED = 2026;
  let seed = DEFAULT_SEED;
  let projects = [];
  let stats = {};
  const st = { metric: "avg", sel: null, level: "all", q: "", sort: "risk", shown: 12 };

  const METRICS = {
    avg:  { label: "Average risk",        val: (s) => s.avg,        fmt: (v) => String(Math.round(v)),       max: 40 },
    high: { label: "High-risk share",     val: (s) => s.highShare,  fmt: (v) => Math.round(v * 100) + "%",   max: 0.6 },
    one:  { label: "Single-bidder share", val: (s) => s.oneShare,   fmt: (v) => Math.round(v * 100) + "%",   max: 0.6 },
  };
  const RK = { low: "Low", mid: "Worth a look", high: "High" };
  const regionOf = (code) => REGIONS.find((r) => r.code === code);

  /* ---------- data ---------- */
  function compute() {
    stats = {};
    REGIONS.forEach((r) => (stats[r.code] = { n: 0, budget: 0, sum: 0, high: 0, one: 0, flags: {} }));
    projects.forEach((p) => {
      const s = stats[p.region];
      s.n++; s.budget += p.budgetM; s.sum += p.score;
      if (p.level === "high") s.high++;
      if (p.flags.oneBidder) s.one++;
      KEYS.forEach((k) => (s.flags[k] = (s.flags[k] || 0) + (p.flags[k] ? 1 : 0)));
    });
    REGIONS.forEach((r) => { const s = stats[r.code]; s.avg = s.sum / s.n; s.highShare = s.high / s.n; s.oneShare = s.one / s.n; });
  }
  const overall = () => {
    const o = { n: projects.length, budget: 0, sum: 0, high: 0, flags: {} };
    projects.forEach((p) => { o.budget += p.budgetM; o.sum += p.score; if (p.level === "high") o.high++; KEYS.forEach((k) => (o.flags[k] = (o.flags[k] || 0) + (p.flags[k] ? 1 : 0))); });
    o.avg = o.sum / o.n;
    return o;
  };

  /* ---------- colour scale: green > gold > red ---------- */
  const C = [[16, 147, 111], [246, 183, 43], [216, 52, 63]];
  function colorAt(t) {
    t = Math.max(0, Math.min(1, t));
    const seg = t < 0.5 ? 0 : 1, u = t < 0.5 ? t * 2 : (t - 0.5) * 2;
    return C[seg].map((v, i) => Math.round(v + (C[seg + 1][i] - v) * u)).join(",");
  }

  /* ---------- KPIs ---------- */
  function renderKpis() {
    const o = overall();
    $("#k-n").textContent = o.n;
    $("#k-v").textContent = fmtPeso(o.budget);
    $("#k-h").textContent = o.high;
    $("#k-hs").textContent = Math.round((o.high / o.n) * 100) + "% of projects";
    $("#k-a").textContent = Math.round(o.avg);
  }

  /* ---------- tile map ---------- */
  function buildMap() {
    const map = $("#tilemap");
    map.innerHTML = `
      <span class="grp" style="grid-column:1;grid-row:1/5">Luzon</span>
      <span class="grp" style="grid-column:1;grid-row:5/6">Visayas</span>
      <span class="grp" style="grid-column:1;grid-row:6/8">Mindanao</span>`;
    REGIONS.forEach((r) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tile";
      b.dataset.code = r.code;
      b.style.gridColumn = r.x + 1;
      b.style.gridRow = r.y + 1;
      b.innerHTML = `<b>${esc(r.code)}</b><span></span>`;
      b.addEventListener("click", () => selectRegion(st.sel === r.code ? null : r.code));
      map.appendChild(b);
    });
  }
  function paintMap() {
    const m = METRICS[st.metric];
    $$(".tile").forEach((b) => {
      const code = b.dataset.code, s = stats[code], v = m.val(s), r = regionOf(code);
      b.style.setProperty("--c", colorAt(v / m.max));
      $("span", b).textContent = m.fmt(v);
      b.setAttribute("aria-pressed", String(st.sel === code));
      b.setAttribute("aria-label", `${r.name}: ${m.label} ${m.fmt(v)}, ${s.n} sample projects`);
      b.title = `${r.name}\n${m.label}: ${m.fmt(v)}`;
      b.classList.toggle("is-selected", st.sel === code);
    });
  }

  /* ---------- detail panel ---------- */
  function renderDetail() {
    const box = $("#detail");
    const reg = st.sel ? regionOf(st.sel) : null;
    const s = reg ? stats[reg.code] : overall();
    const n = s.n;
    const avg = Math.round(s.avg);
    const list = projects.filter((p) => !reg || p.region === reg.code).sort((a, b) => b.score - a.score).slice(0, 3);
    const regionsTop = REGIONS.map((r) => [r, stats[r.code].avg]).sort((a, b) => b[1] - a[1]).slice(0, 3);

    box.innerHTML = `
      <div class="detail__head">
        <h2>${reg ? esc(reg.name) : "All sample regions"}</h2>
        <span class="chip">${reg ? esc(reg.group) : "Overview"}</span>
      </div>
      <dl class="mini">
        <div><dt>Projects</dt><dd>${n}</dd></div>
        <div><dt>Total value</dt><dd>${fmtPeso(s.budget)}</dd></div>
        <div><dt>Average risk</dt><dd>${avg}</dd></div>
        <div><dt>High risk</dt><dd>${s.high}</dd></div>
      </dl>
      <h3 class="detail__sub">How often each warning sign appears</h3>
      <div class="fbars">
        ${KEYS.map((k) => {
          const c = s.flags[k] || 0, pct = Math.round((c / n) * 100);
          return `<div class="fbar"><span class="fbar__l">${esc(FLAGS[k].label)}</span><span class="fbar__t"><i style="width:${pct}%"></i></span><span class="fbar__v">${pct}%</span></div>`;
        }).join("")}
      </div>
      <h3 class="detail__sub">${reg ? "Highest-risk projects here" : "Highest-risk projects overall"}</h3>
      <ul class="toplist">
        ${list.map((p) => `<li><button type="button" class="top" data-id="${p.id}"><span><b>${esc(p.type)}</b><small>${esc(p.id)}</small></span><span class="rk rk--${p.level}">${p.score}</span></button></li>`).join("")}
      </ul>
      ${reg ? `<button type="button" class="linkbtn" data-clear>Show all regions</button>` : `
        <h3 class="detail__sub">Regions with the highest average in this sample</h3>
        <ul class="toplist">${regionsTop.map(([r, a]) => `<li><button type="button" class="top" data-region="${r.code}"><span><b>${esc(r.name)}</b><small>${esc(r.group)}</small></span><span class="rk rk--${L.levelOf(a)}">${Math.round(a)}</span></button></li>`).join("")}</ul>`}
    `;
  }

  /* ---------- who wins contracts ---------- */
  function renderFirms() {
    const by = {};
    let total = 0;
    projects.forEach((p) => { by[p.contractor] = (by[p.contractor] || 0) + p.budgetM; total += p.budgetM; });
    const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const topShare = top.reduce((a, [, v]) => a + v, 0) / total;
    $("#firms").innerHTML = top.map(([f, v]) => {
      const pct = (v / total) * 100;
      return `<div class="fbar"><span class="fbar__l">${esc(f)}</span><span class="fbar__t"><i style="width:${Math.min(100, pct * 6)}%"></i></span><span class="fbar__v">${pct.toFixed(1)}%</span></div>`;
    }).join("");
    $("#firm-note").textContent = `In this sample, the six largest firms hold ${Math.round(topShare * 100)}% of total value. In the real flood control program, 15 contractors received nearly ₱100 billion of ₱545.64 billion, about 18%.`;
  }

  /* ---------- project list ---------- */
  function filtered() {
    const q = st.q.trim().toLowerCase();
    let list = projects.filter((p) =>
      (!st.sel || p.region === st.sel) &&
      (st.level === "all" || p.level === st.level) &&
      (!q || `${p.id} ${p.type} ${p.contractor} ${p.area} ${regionOf(p.region).name}`.toLowerCase().includes(q)));
    list.sort(st.sort === "cost" ? (a, b) => b.budgetM - a.budgetM : (a, b) => b.score - a.score || b.budgetM - a.budgetM);
    return list;
  }
  function renderList() {
    const all = filtered();
    const part = all.slice(0, st.shown);
    $("#plist").innerHTML = part.length
      ? part.map((p) => `
        <li><button type="button" class="prow" data-id="${p.id}">
          <span class="prow__id">${esc(p.id)}</span>
          <span class="prow__main"><b>${esc(p.type)}</b><small>${esc(p.area)}, ${esc(regionOf(p.region).name)}</small></span>
          <span class="prow__firm">${esc(p.contractor)}</span>
          <span class="prow__cost">${fmtPeso(p.budgetM)}</span>
          <span class="rk rk--${p.level}">${RK[p.level]} ${p.score}</span>
        </button></li>`).join("")
      : `<li class="empty"><b>No projects match.</b><span>Try a different region, risk level or search word.</span></li>`;
    $("#pcount").textContent = `Showing ${part.length} of ${all.length} sample projects`;
    $("#more").hidden = part.length >= all.length;
    $("#rsel").value = st.sel || "";
  }

  /* ---------- dialog ---------- */
  function openProject(id) {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    const reg = regionOf(p.region);
    const hits = p.hits;
    $("#pd-body").innerHTML = `
      <header class="pd__head">
        <div><span class="chip">Sample record</span><h2 id="pd-title">${esc(p.type)}</h2><p class="pd__id">${esc(p.id)}</p></div>
        <button type="button" class="pd__x" data-close aria-label="Close">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </header>

      <div class="pd__score rk-bg--${p.level}">
        <div><b>${p.score}</b><span>out of 100</span></div>
        <p>${esc(LEVELS[p.level].label)}</p>
        <div class="pd__bar"><i style="width:${p.score}%"></i></div>
      </div>

      <dl class="rows rows--dlg">
        <div><dt>Region</dt><dd>${esc(reg.name)}</dd></div>
        <div><dt>Location</dt><dd>${esc(p.area)}</dd></div>
        <div><dt>Contractor</dt><dd>${esc(p.contractor)} (sample)</dd></div>
        <div><dt>Approved budget</dt><dd>${fmtPeso(p.budgetM)}</dd></div>
        <div><dt>Winning bid</dt><dd>${fmtPeso(p.bidM)} (${(p.ratio * 100).toFixed(1)}% of budget)</dd></div>
        <div><dt>Bidders</dt><dd>${p.bidders}</dd></div>
        <div><dt>Reported status</dt><dd>${esc(p.status)}</dd></div>
        <div><dt>Site evidence</dt><dd>${p.status === "Completed" ? (p.hasEvidence ? "Dated photos on record" : "None on record") : "Not applicable yet"}</dd></div>
        <div><dt>Description</dt><dd>${esc(p.desc)}</dd></div>
      </dl>

      <h3 class="detail__sub">Warning signs found</h3>
      ${hits.length ? `<ul class="meter__why pd__list">${hits.map((k) => `<li><b>${esc(FLAGS[k].label)}.</b> ${esc(FLAGS[k].why)}</li>`).join("")}</ul>` : `<p class="pd__none">No warning signs in this record. That does not mean a project is safe, only that nothing stood out in these five checks.</p>`}

      ${hits.length ? `<h3 class="detail__sub">What to check next</h3><ul class="pd__next">${hits.map((k) => `<li>${esc(FLAGS[k].check)}</li>`).join("")}</ul>` : ""}

      <p class="pd__warn">This is a randomly generated sample. It is not a real project, and a risk reading is not proof of wrongdoing.</p>
      <div class="hero__actions">
        <a class="btn btn--primary btn--sm" href="tools.html?project=${encodeURIComponent(p.id)}&region=${encodeURIComponent(p.region)}&sample=1#report"><span>Practise a report</span></a>
        <button type="button" class="btn btn--glass btn--sm" data-close><span>Close</span></button>
      </div>`;
    const dlg = $("#pd");
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
  }

  /* ---------- state changes ---------- */
  function selectRegion(code) { st.sel = code; st.shown = 12; paintMap(); renderDetail(); renderList(); }
  function setMetric(m) {
    st.metric = m;
    $$("[data-metric]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.metric === m)));
    paintMap();
    $("#legend-label").textContent = METRICS[m].label;
  }
  function reshuffle(next) {
    seed = next;
    projects = L.generate(seed);
    compute(); renderKpis(); paintMap(); renderDetail(); renderFirms(); renderList();
    $("#seed").textContent = seed === DEFAULT_SEED ? "Default sample" : "Sample #" + seed;
  }

  /* ---------- wire up ---------- */
  function init() {
    buildMap();
    $("#rsel").innerHTML = `<option value="">All regions</option>` + REGIONS.map((r) => `<option value="${r.code}">${esc(r.name)}</option>`).join("");

    $$("[data-metric]").forEach((b) => b.addEventListener("click", () => setMetric(b.dataset.metric)));
    $("#shuffle").addEventListener("click", () => reshuffle(1 + Math.floor(Math.random() * 99999)));
    $("#reset").addEventListener("click", () => reshuffle(DEFAULT_SEED));
    $("#rsel").addEventListener("change", (e) => selectRegion(e.target.value || null));
    $("#lsel").addEventListener("change", (e) => { st.level = e.target.value; st.shown = 12; renderList(); });
    $("#ssel").addEventListener("change", (e) => { st.sort = e.target.value; renderList(); });
    $("#q").addEventListener("input", (e) => { st.q = e.target.value; st.shown = 12; renderList(); });
    $("#more").addEventListener("click", () => { st.shown += 12; renderList(); });

    document.addEventListener("click", (e) => {
      const row = e.target.closest("[data-id]");
      if (row && !e.target.closest("dialog")) openProject(row.dataset.id);
      const rg = e.target.closest("[data-region]");
      if (rg) { selectRegion(rg.dataset.region); $("#tilemap").scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }
      if (e.target.closest("[data-clear]")) selectRegion(null);
      if (e.target.closest("[data-close]")) $("#pd").close();
    });
    // click on the dark backdrop closes the dialog
    $("#pd").addEventListener("click", (e) => { if (e.target === $("#pd")) $("#pd").close(); });

    reshuffle(DEFAULT_SEED);
    setMetric("avg");
  }
  init();
})();
