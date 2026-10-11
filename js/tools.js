/* =========================================================
   LINAW Tools: tabs, Red Flag Detective, Risk Checker, Report Guide
   Everything runs on the visitor's device. Nothing is sent or stored.
   ========================================================= */
(() => {
  "use strict";
  const L = window.Linaw;
  const { REGIONS, FLAGS, KEYS, esc, LEVELS, levelOf } = L;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  if (!$("#quiz")) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- clipboard helper ---------- */
  async function copyText(text, btn, done = "Copied") {
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; }
    catch {
      const t = document.createElement("textarea");
      t.value = text; t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select();
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      t.remove();
    }
    if (btn) {
      const label = $("span", btn), old = label.textContent;
      label.textContent = ok ? done : "Press Ctrl + C to copy";
      setTimeout(() => (label.textContent = old), 1800);
    }
    return ok;
  }

  /* =========================================================
     TABS
     ========================================================= */
  const IDS = ["detective", "checker", "report"];
  const tabs = $$("[data-tab]");
  function show(id, { scroll = false, push = true } = {}) {
    if (!IDS.includes(id)) id = "detective";
    tabs.forEach((t) => { const on = t.dataset.tab === id; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; });
    IDS.forEach((p) => ($("#" + p).hidden = p !== id));
    if (push) history.replaceState(null, "", "#" + id);
    if (scroll) {
      const y = $(".tabbar").getBoundingClientRect().top + scrollY - 100;
      window.scrollTo({ top: Math.max(0, y), behavior: reduce ? "auto" : "smooth" });
    }
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => show(t.dataset.tab));
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      n.focus(); show(n.dataset.tab);
    });
  });
  window.addEventListener("hashchange", () => show(location.hash.slice(1), { scroll: true, push: false }));

  /* =========================================================
     1. RED FLAG DETECTIVE
     ========================================================= */
  const Q = [
    { topic: "Spotting competition problems",
      rows: [["Project", "Drainage canal"], ["Bidders", "1"], ["Winning bid", "97% of budget"], ["Status", "Ongoing"]],
      q: "Which detail is the strongest warning sign?",
      opts: ["The project type is a drainage canal", "Only one firm bid", "The project is still ongoing", "The winning bid is below the budget"], a: 1,
      why: "With a single bidder there was no competition to test the price. Project type and status say nothing about risk, and a bid below budget is not a flag by itself." },
    { topic: "Verifying a completed project",
      rows: [["Project", "Riverbank protection"], ["Reported status", "Completed"], ["Photos on record", "None"], ["Location", "Brgy. Sample"]],
      q: "You live nearby. What is the best first step?",
      opts: ["Assume it is fine because it says completed", "Look from a public, safe spot and take a dated photo", "Post online that the contractor stole the money", "Wait for someone else to check"], a: 1,
      why: "Evidence comes first. A dated photo from a safe place turns a hunch into something an investigator can use. Accusing people publicly can harm the innocent and weaken a real case.",
      src: "In 2025, DPWH confirmed 421 ghost projects out of about 8,000 inspected." },
    { topic: "Contractor concentration",
      rows: [["District", "Sample District"], ["Projects reviewed", "11"], ["Won by Firm 07", "8 of 11 (73%)"]],
      q: "Why does this pattern matter?",
      opts: ["It proves Firm 07 broke the law", "Concentration reduces competition and can signal favouritism, so it deserves a closer look", "It shows Firm 07 must be the best builder", "It does not matter if the projects get finished"], a: 1,
      why: "A pattern like this is a reason to look closer, not proof of wrongdoing. Reports in 2025 found nearly ₱100 billion in flood control contracts went to just 15 contractors.",
      src: "Philippine Center for Investigative Journalism, via Inquirer" },
    { topic: "Vague descriptions",
      rows: [["Project", "Flood control structure"], ["Location", "Not given"], ["Size", "Not given"], ["Cost", "₱120,000,000"]],
      q: "What is the main problem with this record?",
      opts: ["Nothing, the cost is listed", "It is too vague for anyone to verify what was built", "The cost is too high", "It should say completed"], a: 1,
      why: "Without a place, size or purpose, nobody can check whether the project exists or makes sense. Vague descriptions let spending hide in plain sight.",
      src: "More than ₱350 billion in projects had vague descriptions or near-identical designs (Daily Tribune)." },
    { topic: "Risk is not guilt",
      text: "“This project scored 80 out of 100, so the contractor is guilty.”",
      q: "Is that statement true or false?",
      opts: ["True: a high score proves guilt", "False: a score is a prompt to investigate, and people are presumed innocent until proven guilty"], a: 1,
      why: "A risk reading only shows where to look first. Courts decide guilt. Linaw uses the words risk and verify, never guilty, so a tool for accountability does not become a tool for rumours." },
    { topic: "Copied or templated contracts",
      rows: [["Project A", "Drainage wall, Brgy. Sample 4, ₱48,500,000"], ["Project B", "Drainage wall, Brgy. Sample 9, ₱48,500,000"], ["Description", "Identical wording"]],
      q: "What might this pattern suggest?",
      opts: ["Nothing, costs are always the same", "Copied or templated contracts that deserve a check", "That both projects are finished", "That the budget was too small"], a: 1,
      why: "Reports in 2025 flagged projects with near-identical designs and descriptions as possible templated or ghost contracts. Real projects differ by site, so exact copies are worth checking.",
      src: "Daily Tribune, February 2026" },
    { topic: "Where to report",
      text: "You visit a site where a reported flood wall does not exist.",
      q: "Where should you report it?",
      opts: ["Only in a social media comment", "Directly to the contractor", "Through an official channel, such as the DPWH Transparency Portal, Contact Center ng Bayan (16565) or the Ombudsman", "Nowhere, it is not your job"], a: 2,
      why: "Official channels can investigate and act. Social media posts can spread fast but rarely reach the people with power to verify, and the contractor is the last person to ask.",
      src: "The DPWH Transparency Portal lets users tag a project as ghost, unfinished, defective or duplicate." },
    { topic: "Writing a useful report",
      text: "Four people send reports about the same missing wall.",
      q: "Which report is most useful to investigators?",
      opts: ["“Corruption everywhere!!!”", "“Project IV-A-008, Brgy. Sample 6. On 12 Oct 2026 I photographed the site from the road: only grass, no wall. The record says completed.”", "“Everyone knows who is behind it.”", "“A friend told me something is wrong.”"], a: 1,
      why: "The strong report names the project, place and date, describes exactly what is missing, and has evidence. Investigators can act on facts, not on feelings or rumours." },
  ];
  const TIERS = [
    { min: 0, t: "Just starting", m: "Every expert started here. Reread the explanations, then try again. The warning signs will start to jump out." },
    { min: 4, t: "Sharp eye", m: "You already catch the main signs. A second run will lock in the details." },
    { min: 6, t: "Careful reader", m: "You spot the signs and you know risk is not guilt. You are ready to check a real project." },
    { min: 8, t: "Linaw-ready", m: "A perfect score. You can read a project record, weigh the evidence, and report it responsibly." },
  ];

  const quiz = $("#quiz");
  let qi = 0, score = 0, picks = [], answered = false;

  function renderQ() {
    const q = Q[qi];
    answered = false;
    quiz.innerHTML = `
      <div class="quiz__top"><span>Question ${qi + 1} of ${Q.length}</span><div class="quiz__prog"><i style="width:${(qi / Q.length) * 100}%"></i></div><span>${score} correct</span></div>
      ${q.text
        ? `<div class="scenario scenario--text">${esc(q.text)}</div>`
        : `<div class="scenario"><dl class="rows">${q.rows.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join("")}</dl></div>`}
      <h3>${esc(q.q)}</h3>
      <ul class="opts">${q.opts.map((o, k) => `<li><button type="button" class="opt" data-k="${k}"><kbd>${k + 1}</kbd><span>${esc(o)}</span></button></li>`).join("")}</ul>
      <div id="fb"></div><div class="quiz__actions" id="qa"></div>`;
    requestAnimationFrame(() => { const bar = $(".quiz__prog i", quiz); if (bar) bar.style.width = ((qi + 0.001) / Q.length) * 100 + "%"; });
  }

  function answer(k) {
    if (answered) return;
    answered = true;
    const q = Q[qi], ok = k === q.a;
    picks.push(ok);
    if (ok) score++;
    $$(".opt", quiz).forEach((b, i) => {
      b.disabled = true;
      if (i === q.a) b.classList.add("is-correct");
      else if (i === k) b.classList.add("is-wrong");
      else b.classList.add("is-dim");
    });
    $("#fb", quiz).innerHTML = `<div class="fb ${ok ? "fb--ok" : "fb--no"}"><b>${ok ? "That's right." : "Not quite."}</b><p>${esc(q.why)}</p>${q.src ? `<cite class="src">${esc(q.src)}</cite>` : ""}</div>`;
    $(".quiz__top span:last-child", quiz).textContent = score + " correct";
    $("#qa", quiz).innerHTML = `<button type="button" class="btn btn--primary btn--sm" data-next><span>${qi + 1 < Q.length ? "Next question" : "See my result"}</span></button>`;
    $("[data-next]", quiz).focus({ preventScroll: true });
  }

  function renderResult() {
    const tier = [...TIERS].reverse().find((t) => score >= t.min);
    const pct = Math.round((score / Q.length) * 100);
    quiz.innerHTML = `
      <div class="result">
        <div class="ring" id="ring" style="--p:0"><b>${score}<small>/${Q.length}</small></b></div>
        <div>
          <h3>${tier.t}</h3>
          <p>${tier.m}</p>
          <div class="quiz__actions">
            <button type="button" class="btn btn--primary btn--sm" data-restart><span>Try again</span></button>
            <button type="button" class="btn btn--glass btn--sm" data-goto="checker"><span>Check a project</span></button>
          </div>
        </div>
      </div>
      <ul class="review">${Q.map((q, i) => `<li class="${picks[i] ? "y" : "n"}"><i>${picks[i] ? "✓" : "✕"}</i><span>${esc(q.topic)}</span></li>`).join("")}</ul>`;
    const ring = $("#ring", quiz);
    if (reduce) { ring.style.setProperty("--p", pct); return; }
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min(1, (now - t0) / 1100);
      ring.style.setProperty("--p", (1 - Math.pow(1 - p, 3)) * pct);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  quiz.addEventListener("click", (e) => {
    const opt = e.target.closest(".opt");
    if (opt) return answer(parseInt(opt.dataset.k, 10));
    if (e.target.closest("[data-next]")) { qi++; return qi < Q.length ? renderQ() : renderResult(); }
    if (e.target.closest("[data-restart]")) { qi = 0; score = 0; picks = []; return renderQ(); }
    const g = e.target.closest("[data-goto]");
    if (g) show(g.dataset.goto, { scroll: true });
  });
  document.addEventListener("keydown", (e) => {
    if ($("#detective").hidden || answered || e.target.matches("input, textarea, select")) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4 && $(".opt", quiz) && qi < Q.length) { const b = $$(".opt", quiz)[n - 1]; if (b) b.click(); }
  });
  $("#signs").innerHTML = KEYS.map((k) => `<li><b>${esc(FLAGS[k].label)} <em>+${FLAGS[k].weight}</em></b><span>${esc(FLAGS[k].why)}</span></li>`).join("");
  renderQ();

  /* =========================================================
     2. PROJECT RISK CHECKER
     ========================================================= */
  const regionOptions = `<option value="">Not sure</option>` + REGIONS.map((r) => `<option value="${esc(r.name)}">${esc(r.name)} (${esc(r.code)})</option>`).join("");
  $("#c-region").innerHTML = regionOptions;

  const meter = $("#cmeter"), fill = $(".gauge__fill", meter), needle = $(".gauge__needle", meter);
  let lastSummary = "";

  function readFlags() {
    const budget = parseFloat($("#c-budget").value), bid = parseFloat($("#c-bid").value);
    const bidders = $("#c-bidders").value, share = $("#c-share").value, status = $("#c-status").value, seen = $("#c-seen").value, desc = $("#c-desc").value;
    const priced = budget > 0 && bid > 0;
    const known = {
      oneBidder: bidders !== "",
      nearBudget: priced,
      dominant: share !== "",
      noEvidence: status !== "" && (status !== "Completed" || seen !== ""),
      vague: desc !== "",
    };
    const flags = {
      oneBidder: bidders === "1",
      nearBudget: priced && bid / budget >= 0.99,
      dominant: share === "gt50",
      noEvidence: status === "Completed" && seen === "no",
      vague: desc === "vague",
    };
    return { flags, known, budget, bid, priced };
  }

  function updateChecker() {
    const { flags, known, budget, bid, priced } = readFlags();
    const res = L.assess(flags);
    const checked = KEYS.filter((k) => known[k]).length;

    $("#c-ratio").textContent = priced
      ? `The winning bid is ${((bid / budget) * 100).toFixed(1)}% of the approved budget.${bid / budget >= 0.99 ? " That is within 1% of the budget." : ""}${bid > budget ? " A bid above the budget is unusual, so double-check the numbers." : ""}`
      : "Add both amounts to check how close the winning bid is to the budget.";
    $("#c-checked").textContent = `Signs checked: ${checked} of 5`;
    meter.dataset.level = res.level;
    fill.style.strokeDasharray = `${res.score} 200`;
    fill.style.strokeOpacity = res.score ? 1 : 0;
    needle.style.transform = `rotate(${-90 + res.score * 1.8}deg)`;
    $("#c-score").textContent = res.score;
    $("#c-level").textContent = checked === 0 ? "Enter what you know to begin" : LEVELS[res.level].label;

    $("#c-why").innerHTML = res.hits.length
      ? res.hits.map((k) => `<li><b>${esc(FLAGS[k].label)}.</b> ${esc(FLAGS[k].why)}</li>`).join("")
      : `<li class="is-empty">${checked === 0 ? "Fill in whatever you can find. Anything you leave as Not sure is simply skipped." : "None of the five warning signs showed up in what you entered. That does not mean the project is safe. It only covers five checks."}</li>`;
    $("#c-next").innerHTML = res.hits.map((k) => `<li>${esc(FLAGS[k].check)}</li>`).join("");
    $("#c-next-h").hidden = !res.hits.length;

    const name = $("#c-name").value.trim() || "Unnamed project", region = $("#c-region").value || "Region not given";
    lastSummary = [
      "Linaw risk reading",
      `Project: ${name}`,
      `Region: ${region}`,
      `Score: ${res.score} out of 100 (${LEVELS[res.level].label})`,
      `Signs checked: ${checked} of 5`,
      res.hits.length ? "Warning signs: " + res.hits.map((k) => FLAGS[k].label).join("; ") : "Warning signs: none found in what was entered",
      "Note: a risk reading points to where to look first. It is not proof that anyone did anything wrong.",
    ].join("\n");
  }
  $("#cform").addEventListener("input", updateChecker);
  $("#cform").addEventListener("change", updateChecker);
  $("#cform").addEventListener("reset", () => setTimeout(updateChecker, 0));
  $("#c-copy").addEventListener("click", (e) => copyText(lastSummary, e.currentTarget));
  $("#c-report").addEventListener("click", (e) => {
    e.preventDefault();
    $("#r-proj").value = $("#c-name").value.trim();
    if ($("#c-region").value) $("#r-region").value = $("#c-region").value;
    show("report", { scroll: true });
  });
  updateChecker();

  /* =========================================================
     3. REPORT GUIDE
     ========================================================= */
  $("#r-region").innerHTML = `<option value="">Select a region</option>` + REGIONS.map((r) => `<option value="${esc(r.name)}">${esc(r.name)} (${esc(r.code)})</option>`).join("");
  const today = new Date(), iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  $("#r-date").max = iso(today);
  $("#r-date").value = iso(today);

  const steps = $$(".wstep"), navItems = $$("#wnav li");
  let step = 1;

  function go(n, focus = true) {
    step = n;
    steps.forEach((s) => (s.hidden = Number(s.dataset.step) !== n));
    navItems.forEach((li, i) => { li.classList.toggle("is-done", i + 1 < n); li.classList.toggle("is-now", i + 1 === n); });
    $("#r-back").hidden = n === 1;
    $("#r-next").hidden = n === 4;
    $("span", $("#r-next")).textContent = n === 3 ? "Write my report" : "Continue";
    if (n === 4) $("#draft").textContent = buildDraft();
    if (focus) { const h = $(`.wstep[data-step="${n}"] h3`); h.tabIndex = -1; h.focus({ preventScroll: true }); $("#wizard").scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" }); }
  }

  function validate(n) {
    const set = (id, msg) => { $("#" + id).textContent = msg; return !msg; };
    if (n === 1) return set("e1", $('input[name="rtype"]:checked') ? "" : "Please pick the closest match to continue.");
    if (n === 2) return set("e2", !$("#r-region").value ? "Please choose a region." : !$("#r-city").value.trim() && !$("#r-brgy").value.trim() ? "Add at least a city or a barangay so people can find the place." : "");
    if (n === 3) return set("e3", !$("#r-date").value ? "Please enter the date you saw it." : $("#r-desc").value.trim().length < 20 ? "Please describe what you saw in a little more detail (at least a sentence)." : "");
    return true;
  }

  function buildDraft() {
    const val = (id) => $("#" + id).value.trim();
    const d = new Date($("#r-date").value + "T00:00:00");
    const place = [val("r-brgy"), val("r-city"), $("#r-region").value].filter(Boolean).join(", ");
    return [
      "CONCERN ABOUT A PUBLIC PROJECT",
      "",
      `Date observed: ${d.toLocaleDateString("en-PH", { day: "numeric", month: "long", year: "numeric" })}`,
      `Type of concern: ${$('input[name="rtype"]:checked').value}`,
      `Project: ${val("r-proj") || "Name or ID not known"}`,
      `Location: ${place}`,
      val("r-land") ? `Landmark: ${val("r-land")}` : null,
      "",
      "What I saw:",
      val("r-desc"),
      "",
      `Evidence: ${$("#r-evid").value}`,
      "",
      "I am describing what I observed and I am not accusing any person. Please verify the project on the ground and take the appropriate action.",
      "",
      "Contact details (add if you would like a reply): ",
    ].filter((x) => x !== null).join("\n");
  }

  $("#r-next").addEventListener("click", () => { if (validate(step)) go(step + 1); });
  $("#r-back").addEventListener("click", () => go(step - 1));
  $("#r-copy").addEventListener("click", async (e) => {
    const ok = await copyText($("#draft").textContent, e.currentTarget, "Copied to clipboard");
    $("#e4").textContent = ok ? "" : "Your browser blocked copying. Select the text above and press Ctrl + C.";
  });
  $("#r-dl").addEventListener("click", () => {
    const blob = new Blob([$("#draft").textContent], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "linaw-report-draft.txt";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $("#r-restart").addEventListener("click", () => {
    $$('input[name="rtype"]').forEach((r) => (r.checked = false));
    ["r-city", "r-brgy", "r-land", "r-proj", "r-desc"].forEach((id) => ($("#" + id).value = ""));
    $("#r-region").value = ""; $("#r-date").value = iso(new Date());
    ["e1", "e2", "e3", "e4"].forEach((id) => ($("#" + id).textContent = ""));
    go(1);
  });
  go(1, false);

  /* prefill when arriving from a Tracker sample record */
  const params = new URLSearchParams(location.search);
  if (params.get("sample") === "1") {
    $("#sample-note").hidden = false;
    const reg = REGIONS.find((r) => r.code === params.get("region"));
    if (reg) $("#r-region").value = reg.name;
    if (params.get("project")) $("#r-proj").value = "Sample record " + params.get("project");
  }

  /* ---------- start ---------- */
  show(location.hash.slice(1), { scroll: !!location.hash, push: false });
})();
