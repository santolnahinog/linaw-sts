/* LINAW Take Action: channel chooser + print */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const out = $("#choose-out");
  if (!out) return;

  const PICKS = {
    portal: { t: "DPWH Transparency Portal", p: "Best when you can name a specific DPWH project. Search it, check the implementing office, contractor, cost and status against what you see on the ground, then use the portal to report suspected irregularities.", a: "https://transparency.dpwh.gov.ph", l: "Open transparency.dpwh.gov.ph" },
    conduct: { t: "Office of the Ombudsman", p: "Best for serious complaints about the conduct of a public official. The Ombudsman acts on complaints filed in any form, so a clear written report with evidence is enough to start.", a: "https://www.ombudsman.gov.ph", l: "Open ombudsman.gov.ph" },
    docs: { t: "eFOI portal", p: "Best when you want to see a document, such as a contract, a report or project records. Executive Order 2 (2016) lets anyone request information from the executive branch.", a: "https://www.foi.gov.ph", l: "Open foi.gov.ph" },
    other: { t: "Contact Center ng Bayan, or 8888", p: "Best for complaints about a government service, or when you are not sure where your concern belongs. Call 16565 or text 0908-881-6565. The Citizens' Complaint Center hotline is 8888. Confirm the numbers on each agency's own website first.", a: "https://contactcenterngbayan.gov.ph", l: "Open contactcenterngbayan.gov.ph" },
  };

  $$("[data-pick]").forEach((b) => b.addEventListener("click", () => {
    $$("[data-pick]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    const k = PICKS[b.dataset.pick];
    out.innerHTML = `<b>${k.t}</b><p>${k.p}</p><a href="${k.a}" target="_blank" rel="noopener">${k.l}</a>`;
  }));
  const pr = $("#print");
  if (pr) pr.addEventListener("click", () => window.print());
})();
