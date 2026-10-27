// ---------------------------------------------------------------------------
// Participant list: fetch a CSV (Google Sheet or static file), render a
// searchable, sortable table. No external dependencies, no API keys.
// ---------------------------------------------------------------------------
(function () {
  "use strict";

  const cfg = (window.SITE_CONFIG && window.SITE_CONFIG.participants) || {};
  const els = {
    status: document.getElementById("participants-status"),
    table: document.getElementById("participants-table"),
    search: document.getElementById("participant-search"),
    stats: document.getElementById("participant-stats"),
    updated: document.getElementById("participants-updated"),
  };
  if (!els.table) return;

  // --- Source URL -----------------------------------------------------------
  function sourceUrl() {
    if (cfg.csvUrl) return cfg.csvUrl;
    if (cfg.sheetId) {
      const sheet = cfg.sheetName ? `&sheet=${encodeURIComponent(cfg.sheetName)}` : "";
      return `https://docs.google.com/spreadsheets/d/${cfg.sheetId}/gviz/tq?tqx=out:csv&headers=1${sheet}`;
    }
    return cfg.fallbackUrl || "";
  }

  // --- Minimal RFC-4180 CSV parser -----------------------------------------
  function parseCSV(text) {
    const rows = [];
    let row = [], field = "", inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += c;
      } else if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); rows.push(row); row = []; field = "";
      } else field += c;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows.filter(r => r.some(v => v.trim() !== ""));
  }

  // --- Helpers ---------------------------------------------------------------
  const norm = s => String(s || "").trim().toLowerCase();

  // Header names that mean the same thing (all lower-case).
  const ALIASES = { institute: ["institute", "institution", "affiliation"] };
  const headerIndex = (header, key) => {
    for (const k of (ALIASES[key] || [key])) { const i = header.indexOf(k); if (i >= 0) return i; }
    return -1;
  };

  const FLAGS = {
    korea: "🇰🇷", "south korea": "🇰🇷", "republic of korea": "🇰🇷", kr: "🇰🇷", "한국": "🇰🇷", "대한민국": "🇰🇷",
    japan: "🇯🇵", jp: "🇯🇵", "日本": "🇯🇵", "일본": "🇯🇵",
  };
  const flagFor = c => FLAGS[norm(c)] || "";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  function setStatus(msg, isError) {
    els.status.textContent = msg || "";
    els.status.classList.toggle("error", !!isError);
  }

  // --- State -----------------------------------------------------------------
  let columns = [];      // [{key, label, index}]
  let records = [];      // array of arrays aligned with `columns`
  let sortIdx = 0, sortDir = 1;
  let query = "";

  // --- Render ----------------------------------------------------------------
  function render() {
    const q = norm(query);
    let rows = records.filter(r => !q || r.some(v => norm(v).includes(q)));
    rows.sort((a, b) => {
      const x = norm(a[sortIdx]), y = norm(b[sortIdx]);
      return x < y ? -sortDir : x > y ? sortDir : 0;
    });

    const thead = els.table.tHead, tbody = els.table.tBodies[0];
    thead.innerHTML = "<tr><th>#</th>" + columns.map((c, i) =>
      `<th data-i="${i}" aria-sort="${i === sortIdx ? (sortDir > 0 ? "ascending" : "descending") : "none"}">${esc(c.label)}</th>`
    ).join("") + "</tr>";

    const countryIdx = columns.findIndex(c => c.key === "country");
    tbody.innerHTML = rows.map((r, n) =>
      `<tr><td class="num">${n + 1}</td>` + r.map((v, i) => {
        const flag = i === countryIdx ? flagFor(v) : "";
        return `<td>${flag ? `<span class="flag">${flag}</span>` : ""}${esc(v)}</td>`;
      }).join("") + "</tr>"
    ).join("");

    els.table.hidden = false;
    setStatus(rows.length ? "" : (records.length ? "No participants match your search." : "No participants registered yet."));

    // Stats: total + per-country counts
    const total = records.length;
    const byCountry = {};
    if (countryIdx >= 0) records.forEach(r => { const k = String(r[countryIdx]).trim() || "Other"; byCountry[k] = (byCountry[k] || 0) + 1; });
    const pills = [`<span class="pill"><strong>${total}</strong> participant${total === 1 ? "" : "s"}</span>`]
      .concat(Object.entries(byCountry).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
        `<span class="pill">${flagFor(k)} ${esc(k)} <strong>${v}</strong></span>`));
    els.stats.innerHTML = pills.join("");
  }

  // --- Load ------------------------------------------------------------------
  async function fetchCSV(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = parseCSV(await res.text());
    if (rows.length < 1) throw new Error("Empty sheet");
    return rows;
  }

  async function load() {
    const url = sourceUrl();
    if (!url) { setStatus("Participant list is not configured yet.", true); return; }
    setStatus("Loading participant list…");
    try {
      let rows, usedFallback = false;
      try {
        rows = await fetchCSV(url);
      } catch (err) {
        // The Google Sheet is unreachable (not shared yet, offline, ...):
        // fall back to the static CSV bundled with the site, if any.
        if (!cfg.fallbackUrl || cfg.fallbackUrl === url) throw err;
        console.warn("Participant list: primary source failed, using fallback.", err);
        rows = await fetchCSV(cfg.fallbackUrl);
        usedFallback = true;
      }

      const header = rows[0].map(norm);
      const wanted = (cfg.columns && cfg.columns.length ? cfg.columns : rows[0]);
      columns = wanted.map(label => ({ key: norm(label), label, index: headerIndex(header, norm(label)) }))
                      .filter(c => c.index >= 0);
      if (!columns.length) throw new Error("None of the configured columns were found in the sheet header: " + rows[0].join(", "));

      records = rows.slice(1).map(r => columns.map(c => (r[c.index] || "").trim()))
                    .filter(r => r.some(v => v));

      const sIdx = columns.findIndex(c => c.key === norm(cfg.sortBy));
      sortIdx = sIdx >= 0 ? sIdx : 0;
      render();
      els.updated.textContent = (usedFallback ? "Showing the last published list. " : "") +
        "Last updated: " + new Date().toLocaleString("en-GB", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short" }) + " KST";
    } catch (err) {
      console.error("Participant list:", err);
      setStatus("Could not load the participant list. Please try again later.", true);
    }
  }

  // --- Events ----------------------------------------------------------------
  els.search.addEventListener("input", e => { query = e.target.value; render(); });
  els.table.tHead.addEventListener("click", e => {
    const th = e.target.closest("th[data-i]");
    if (!th) return;
    const i = Number(th.dataset.i);
    if (i === sortIdx) sortDir = -sortDir; else { sortIdx = i; sortDir = 1; }
    render();
  });

  load();
})();
