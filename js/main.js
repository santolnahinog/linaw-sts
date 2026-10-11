/* =========================================================
   LINAW — main.js
   1. Shared header + footer (edit the menu once, it updates every page)
   2. The Lens (hero)
   3. Focus-in reveals, counters, bars
   4. Glass spotlight
   5. Live risk reader
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. SHARED CHROME ---------- */
  const NAV = [
    { href: "understand.html", label: "Understand" },
    { href: "sts.html", label: "STS lens" },
    { href: "tracker.html", label: "Tracker" },
    { href: "tools.html", label: "Tools" },
    { href: "action.html", label: "Take action" },
    { href: "sources.html", label: "Sources" },
    { href: "team.html", label: "Team" },
  ];

  const LOGO = `<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
    <circle cx="14" cy="14" r="9.5" fill="none" stroke="currentColor" stroke-width="2.4"/>
    <path d="M21.2 21.2 28 28" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <circle cx="14" cy="14" r="3.4" fill="#f6b72b"/></svg>`;

  function renderChrome() {
    const page = location.pathname.split("/").pop() || "index.html";
    const header = $('[data-chrome="header"]');
    if (header) {
      header.className = "site-header";
      header.innerHTML = `
        <a class="skip" href="#main">Skip to content</a>
        <nav class="nav glass" aria-label="Main">
          <a class="brand" href="index.html" aria-label="Linaw home">${LOGO}<span>Linaw</span></a>
          <ul class="nav__links" id="nav-links">
            ${NAV.map((n) => `<li><a href="${n.href}"${page === n.href ? ' aria-current="page"' : ""}>${n.label}</a></li>`).join("")}
          </ul>
          <a class="btn btn--primary btn--sm nav__cta" href="tools.html#detective"><span>Take the quiz</span></a>
          <button class="nav__toggle" aria-expanded="false" aria-controls="nav-links" aria-label="Open menu"><span></span></button>
        </nav>`;

      const toggle = $(".nav__toggle", header);
      const links = $("#nav-links", header);
      const setOpen = (open) => {
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        links.classList.toggle("is-open", open);
      };
      toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
      links.addEventListener("click", (e) => e.target.closest("a") && setOpen(false));
      document.addEventListener("keydown", (e) => e.key === "Escape" && setOpen(false));

      const onScroll = () => header.classList.toggle("is-scrolled", scrollY > 24);
      onScroll();
      addEventListener("scroll", onScroll, { passive: true });
    }

    const footer = $('[data-chrome="footer"]');
    if (footer) {
      footer.className = "site-footer";
      footer.innerHTML = `
        <div class="wrap">
          <div class="footer__grid">
            <div class="footer__brand">
              <a class="brand" href="index.html">${LOGO}<span>Linaw</span></a>
              <p>See where every peso goes. A citizen's toolkit for reading public project data, spotting red flags, and reporting through official channels.</p>
            </div>
            <div>
              <h4>Explore</h4>
              <ul>${NAV.map((n) => `<li><a href="${n.href}">${n.label}</a></li>`).join("")}</ul>
            </div>
            <div>
              <h4>Official tools</h4>
              <ul>
                <li><a href="https://transparency.dpwh.gov.ph" target="_blank" rel="noopener">DPWH Transparency Portal</a></li>
                <li><a href="https://www.foi.gov.ph" target="_blank" rel="noopener">eFOI portal</a></li>
                <li><a href="https://www.transparency.org/en/countries/philippines" target="_blank" rel="noopener">Transparency International</a></li>
              </ul>
            </div>
          </div>
          <p class="footer__legal">A student prototype for the Science, Technology and Society final activity. Sample records on this site are illustrative and do not describe real projects or people. A risk reading is a prompt to look closer, not proof of wrongdoing. Statistics are cited on the Sources page.</p>
        </div>`;
    }
  }

  /* ---------- 2. THE LENS ---------- */
  function initLens() {
    const stage = $("[data-lens]");
    if (!stage) return;
    const lens = $(".lens", stage);
    const spans = $$(".redact", stage);
    const toggle = $("[data-lens-toggle]", stage);
    const hint = $("[data-lens-hint]", stage);
    if (!lens || !spans.length) return;

    const coarse = matchMedia("(pointer: coarse)").matches;
    if (hint) hint.textContent = coarse ? "Drag a finger across the page to clear it." : "Move your cursor over the page to clear it.";

    let r = parseFloat(getComputedStyle(stage).getPropertyValue("--lr")) || 120;
    addEventListener("resize", () => { r = parseFloat(getComputedStyle(stage).getPropertyValue("--lr")) || 120; });

    const center = (el) => { const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; };
    const startBox = stage.getBoundingClientRect();
    const pos = { x: startBox.left - r, y: startBox.top + startBox.height * 0.35 };
    const target = { ...pos };
    let lastMove = -1e9, nextHop = 0, hop = 0, running = false, raf = 0;

    const move = (e) => { target.x = e.clientX; target.y = e.clientY; lastMove = performance.now(); };
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerdown", move);
    stage.addEventListener("pointerleave", () => { lastMove = performance.now() - 1800; });

    function frame(now) {
      raf = requestAnimationFrame(frame);
      const idle = now - lastMove > 3200;
      if (idle && !reduce && now >= nextHop) {
        const c = center(spans[hop % spans.length]);
        target.x = c.x; target.y = c.y;
        hop++; nextHop = now + 2300;
      }
      const k = reduce ? 1 : 0.14;
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;
      const b = stage.getBoundingClientRect();
      lens.style.transform = `translate3d(${pos.x - b.left - r}px, ${pos.y - b.top - r}px, 0)`;
      for (const s of spans) {
        const sb = s.getBoundingClientRect();
        s.style.setProperty("--hx", pos.x - sb.left + "px");
        s.style.setProperty("--hy", pos.y - sb.top + "px");
      }
    }
    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(frame); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    // park the lens on the headline for reduced-motion users, then begin
    if (reduce) { const c = center(spans[0]); pos.x = target.x = c.x; pos.y = target.y = c.y; }
    stage.classList.add("has-lens");
    new IntersectionObserver(([en]) => (en.isIntersecting ? start() : stop()), { threshold: 0.05 }).observe(stage);

    if (toggle) {
      toggle.addEventListener("click", () => {
        const on = stage.classList.toggle("is-clear");
        toggle.setAttribute("aria-pressed", String(on));
        toggle.textContent = on ? "Redact again" : "Clear everything";
      });
    }
  }

  /* ---------- 3. REVEALS, COUNTERS, BARS ---------- */
  const fmt = (n, d) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

  function countUp(el) {
    const to = parseFloat(el.dataset.to);
    const d = parseInt(el.dataset.dec || "0", 10);
    if (reduce) { el.textContent = fmt(to, d); return; }
    const t0 = performance.now(), dur = 1500;
    const ease = (t) => 1 - Math.pow(1 - t, 4);
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = fmt(to * ease(p), d);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  function initReveals() {
    document.documentElement.classList.add("ready");
    const counters = $$("[data-to]");
    if (!reduce) counters.forEach((c) => (c.textContent = fmt(0, parseInt(c.dataset.dec || "0", 10))));

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add("is-in");
        $$("[data-to]", el).forEach(countUp);
        if (el.matches("[data-to]")) countUp(el);
        io.unobserve(el);
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -6% 0px" });
    $$("[data-focus], [data-bars], [data-ledger]").forEach((el) => io.observe(el));
  }

  /* ---------- 4. GLASS SPOTLIGHT ---------- */
  function initSpotlight() {
    let raf = 0;
    document.addEventListener("pointermove", (e) => {
      const g = e.target.closest && e.target.closest(".glass");
      if (!g || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const b = g.getBoundingClientRect();
        g.style.setProperty("--mx", e.clientX - b.left + "px");
        g.style.setProperty("--my", e.clientY - b.top + "px");
      });
    }, { passive: true });
  }

  /* ---------- 5. LIVE RISK READER ---------- */
  function initMeter() {
    const root = $("[data-meter]");
    if (!root) return;
    const flags = $$("[data-weight]", root);
    const fill = $(".gauge__fill", root);
    const needle = $(".gauge__needle", root);
    const score = $("[data-score]", root);
    const level = $("[data-level-text]", root);
    const why = $("[data-reasons]", root);
    const EMPTY = "Tap the signs you can see. Nothing selected means nothing flagged yet, not that a project is safe.";

    function update() {
      const on = flags.filter((f) => f.getAttribute("aria-pressed") === "true");
      const total = on.reduce((s, f) => s + parseInt(f.dataset.weight, 10), 0);
      const lv = total >= 55 ? "high" : total >= 25 ? "mid" : "low";
      root.dataset.level = lv;
      fill.style.strokeDasharray = `${total} 200`;
      fill.style.strokeOpacity = total ? 1 : 0;
      needle.style.transform = `rotate(${-90 + total * 1.8}deg)`;
      score.textContent = total;
      level.textContent = { low: "Low: nothing stands out yet", mid: "Worth a closer look", high: "High priority to verify on the ground" }[lv];
      why.innerHTML = on.length
        ? on.map((f) => `<li>${f.dataset.why}</li>`).join("")
        : `<li class="is-empty">${EMPTY}</li>`;
    }
    flags.forEach((f) => f.addEventListener("click", () => {
      f.setAttribute("aria-pressed", String(f.getAttribute("aria-pressed") !== "true"));
      update();
    }));
    update();
  }

  /* ---------- 6. INNER PAGES: reading progress + section menu ---------- */
  function initInner() {
    if (!$(".page-hero")) return;
    const bar = document.createElement("div");
    bar.className = "progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    let ticking = false;
    const set = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
      if (scrollY < 140) $$('.jump a').forEach((a) => a.classList.remove('is-active'));
      ticking = false;
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(set); } }, { passive: true });
    set();

    const links = $$('.jump a[href^="#"]');
    const map = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.classList.remove("is-active"));
        const a = map.get(en.target.id);
        if (a) a.classList.add("is-active");
      });
    }, { rootMargin: "-35% 0px -60% 0px" });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- boot ---------- */
  renderChrome();
  initLens();
  initReveals();
  initSpotlight();
  initMeter();
  initInner();
})();
