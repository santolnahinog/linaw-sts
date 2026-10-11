/* =========================================================
   LINAW: shared data + scoring (used by Tracker and Tools)
   IMPORTANT: all project records are RANDOMLY GENERATED SAMPLES.
   They are not real projects, firms or places.
   ========================================================= */
(() => {
  "use strict";

  /* 17 regions laid out as a tile map. x/y are grid positions. */
  const REGIONS = [
    { code: "I",     name: "Ilocos Region",                       group: "Luzon",    x: 1, y: 0 },
    { code: "CAR",   name: "Cordillera Administrative Region",    group: "Luzon",    x: 2, y: 0 },
    { code: "II",    name: "Cagayan Valley",                      group: "Luzon",    x: 3, y: 0 },
    { code: "III",   name: "Central Luzon",                       group: "Luzon",    x: 2, y: 1 },
    { code: "NCR",   name: "National Capital Region",             group: "Luzon",    x: 2, y: 2 },
    { code: "IV-A",  name: "CALABARZON",                          group: "Luzon",    x: 3, y: 2 },
    { code: "IV-B",  name: "MIMAROPA",                            group: "Luzon",    x: 2, y: 3 },
    { code: "V",     name: "Bicol Region",                        group: "Luzon",    x: 4, y: 3 },
    { code: "VI",    name: "Western Visayas",                     group: "Visayas",  x: 2, y: 4 },
    { code: "VII",   name: "Central Visayas",                     group: "Visayas",  x: 3, y: 4 },
    { code: "VIII",  name: "Eastern Visayas",                     group: "Visayas",  x: 4, y: 4 },
    { code: "IX",    name: "Zamboanga Peninsula",                 group: "Mindanao", x: 2, y: 5 },
    { code: "X",     name: "Northern Mindanao",                   group: "Mindanao", x: 3, y: 5 },
    { code: "XIII",  name: "Caraga",                              group: "Mindanao", x: 4, y: 5 },
    { code: "BARMM", name: "Bangsamoro Autonomous Region",        group: "Mindanao", x: 2, y: 6 },
    { code: "XII",   name: "SOCCSKSARGEN",                        group: "Mindanao", x: 3, y: 6 },
    { code: "XI",    name: "Davao Region",                        group: "Mindanao", x: 4, y: 6 },
  ];

  /* The five warning signs, their weights, and plain-language text. */
  const FLAGS = {
    oneBidder:  { weight: 25, label: "Only one bidder",
      why: "Only one bidder means the price may never have been tested by competition.",
      check: "Find out whether the bid was advertised and who else could have competed." },
    nearBudget: { weight: 15, label: "Winning bid is 99% or more of the budget",
      why: "A winning bid right at the approved budget can mean the price was never negotiated.",
      check: "Compare the winning bid with the approved budget on the bid documents." },
    dominant:   { weight: 25, label: "One contractor wins most nearby contracts",
      why: "Contracts concentrated in a few firms are a classic procurement warning sign.",
      check: "Look up who else won contracts in the same district." },
    noEvidence: { weight: 25, label: "Reported complete, but no photos or can't be found",
      why: "A project marked complete that nobody can see or locate needs a site check.",
      check: "Visit from a public, safe spot and take a dated photo." },
    vague:      { weight: 10, label: "Vague description",
      why: "Without a place, size or purpose, a project is almost impossible to verify.",
      check: "Ask for the full project description and plan details." },
  };
  const KEYS = Object.keys(FLAGS);

  const LEVELS = {
    low:  { label: "Low: nothing stands out yet" },
    mid:  { label: "Worth a closer look" },
    high: { label: "High priority to verify on the ground" },
  };
  const levelOf = (s) => (s >= 55 ? "high" : s >= 25 ? "mid" : "low");

  /* flags: { oneBidder:bool, ... } -> { score, level, hits:[keys] } */
  function assess(f) {
    let score = 0;
    const hits = [];
    for (const k of KEYS) if (f[k]) { score += FLAGS[k].weight; hits.push(k); }
    return { score, level: levelOf(score), hits };
  }

  /* ---------- helpers ---------- */
  const fmtPeso = (m) => (m >= 1000 ? "₱" + (m / 1000).toFixed(2) + "B" : "₱" + m.toFixed(1) + "M");
  const fmtPesoFull = (n) => "₱" + Math.round(n).toLocaleString("en-US");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- seeded random sample generator ---------- */
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const TYPES = [
    ["Riverbank protection wall", "concrete wall", "m"],
    ["Drainage canal", "lined canal", "m"],
    ["Dike rehabilitation", "earth dike", "m"],
    ["Pumping station", "pumping station", "units"],
    ["Slope protection", "slope protection", "m"],
    ["Flood gate", "flood gate", "units"],
    ["Revetment", "stone revetment", "m"],
    ["Culvert", "box culvert", "m"],
  ];

  function generate(seed = 2026) {
    const r = rng(seed);
    const projects = [];
    for (const reg of REGIONS) {
      const prop = 0.1 + r() * 0.52;               // how "risky" this sample region is
      const n = 7 + Math.floor(r() * 5);            // 7 to 11 projects
      const pool = [];
      while (pool.length < 5) {
        const f = "Firm " + String(1 + Math.floor(r() * 60)).padStart(2, "0");
        if (!pool.includes(f)) pool.push(f);
      }
      const weights = [0.3 + prop * 7, 1, 1, 1, 1];
      const wsum = weights.reduce((a, b) => a + b, 0);
      const pick = () => { let x = r() * wsum; for (let i = 0; i < 5; i++) { x -= weights[i]; if (x <= 0) return pool[i]; } return pool[4]; };

      const rows = [];
      for (let i = 0; i < n; i++) {
        const t = TYPES[Math.floor(r() * TYPES.length)];
        const brgy = "Brgy. Sample " + (1 + Math.floor(r() * 30));
        const budgetM = Math.round((6 + r() * r() * 140) * 10) / 10;
        const oneBidder = r() < prop * 0.9;
        const bidders = oneBidder ? 1 : 2 + Math.floor(r() * 4);
        const near = r() < prop * 0.8;
        const ratio = near ? 0.992 + r() * 0.007 : 0.86 + r() * 0.11;
        const sr = r();
        const status = sr < 0.55 ? "Completed" : sr < 0.85 ? "Ongoing" : "Not started";
        const hasEvidence = status === "Completed" ? r() > prop * 0.95 : true;
        const vague = r() < prop * 0.7;
        const size = t[2] === "m" ? 80 + Math.floor(r() * 90) * 10 : 1 + Math.floor(r() * 3);
        rows.push({
          id: reg.code + "-" + String(i + 1).padStart(3, "0"),
          region: reg.code, area: brgy, type: t[0],
          desc: vague ? "Flood control structure (no location or size given)" : `${t[1][0].toUpperCase() + t[1].slice(1)}, ${size} ${t[2]}, ${brgy}`,
          budgetM, bidM: Math.round(budgetM * ratio * 100) / 100, ratio,
          bidders, contractor: pick(), status, hasEvidence, vague,
          year: 2022 + Math.floor(r() * 4),
        });
      }
      // contractor dominance is computed from the region's own sample
      const counts = {};
      rows.forEach((p) => (counts[p.contractor] = (counts[p.contractor] || 0) + 1));
      rows.forEach((p) => {
        const flags = {
          oneBidder: p.bidders === 1,
          nearBudget: p.ratio >= 0.99,
          dominant: counts[p.contractor] / rows.length > 0.5,
          noEvidence: p.status === "Completed" && !p.hasEvidence,
          vague: p.vague,
        };
        p.flags = flags;
        Object.assign(p, assess(flags));
        projects.push(p);
      });
    }
    return projects;
  }

  window.Linaw = { REGIONS, FLAGS, KEYS, LEVELS, levelOf, assess, generate, fmtPeso, fmtPesoFull, esc };
})();
