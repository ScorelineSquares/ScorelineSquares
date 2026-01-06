/* Scoreline Squares (Trial) – Random assignment + SOLD hover/click username tooltip */

(() => {
  const GRID_SIZE = 10;
  const TOTAL_SQUARES = GRID_SIZE * GRID_SIZE;
  const STORAGE_KEY = "scoreline_squares_trial_state_v3";

  // ---- DOM ----
  const gridEl = document.getElementById("grid");
  const formEl = document.getElementById("entryForm");
  const remainingEl = document.getElementById("remaining");
  const summaryEl = document.getElementById("summaryText");
  const yearEl = document.getElementById("year");

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---- State ----
  /** @type {{ sold: Record<number, { username: string, email: string, ts: number }> }} */
  let state = loadState();

  // Tooltip (single floating element)
  const tooltip = document.createElement("div");
  tooltip.style.position = "fixed";
  tooltip.style.zIndex = "9999";
  tooltip.style.maxWidth = "220px";
  tooltip.style.padding = "8px 10px";
  tooltip.style.borderRadius = "10px";
  tooltip.style.border = "1px solid rgba(255,255,255,0.18)";
  tooltip.style.background = "rgba(15, 22, 32, 0.96)";
  tooltip.style.color = "#e9eef6";
  tooltip.style.fontSize = "12px";
  tooltip.style.lineHeight = "1.2";
  tooltip.style.boxShadow = "0 12px 30px rgba(0,0,0,0.45)";
  tooltip.style.backdropFilter = "blur(8px)";
  tooltip.style.display = "none";
  tooltip.style.pointerEvents = "none";
  document.body.appendChild(tooltip);

  let pinnedIndex = null; // when user clicks a SOLD square, keep tooltip open until click elsewhere

  // ---- Helpers ----
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { sold: {} };
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return { sold: {} };
      if (!parsed.sold || typeof parsed.sold !== "object") parsed.sold = {};
      return parsed;
    } catch {
      return { sold: {} };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function availableIndices() {
    const soldKeys = new Set(Object.keys(state.sold).map(Number));
    const avail = [];
    for (let i = 0; i < TOTAL_SQUARES; i++) {
      if (!soldKeys.has(i)) avail.push(i);
    }
    return avail;
  }

  function remainingCount() {
    return TOTAL_SQUARES - Object.keys(state.sold).length;
  }

  function indexToCoords(idx) {
    // row 0-9 (Away), col 0-9 (Home)
    const row = Math.floor(idx / GRID_SIZE);
    const col = idx % GRID_SIZE;
    return { row, col, id: `H${col}-A${row}` };
  }

  function pickRandom(arr, count) {
    // Fisher-Yates shuffle limited
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, count);
  }

  function setSummary(msg) {
    if (summaryEl) summaryEl.textContent = msg;
  }

  // ---- Tooltip ----
  function showTooltipAt(x, y, html) {
    tooltip.innerHTML = html;
    tooltip.style.display = "block";

    // offset + clamp to viewport
    const pad = 12;
    const offset = 14;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Temporarily show to measure size
    const rect = tooltip.getBoundingClientRect();

    let left = x + offset;
    let top = y + offset;

    if (left + rect.width + pad > vw) left = Math.max(pad, x - rect.width - offset);
    if (top + rect.height + pad > vh) top = Math.max(pad, y - rect.height - offset);

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function hideTooltip() {
    tooltip.style.display = "none";
    tooltip.innerHTML = "";
  }

  function tooltipHtml(username) {
    return `<div style="font-weight:800; margin-bottom:4px;">SOLD</div>
            <div style="opacity:0.9;">Buyer: <span style="font-weight:700;">${escapeHtml(
              username
            )}</span></div>
            <div style="opacity:0.7; margin-top:4px;">(Tap/click elsewhere to close)</div>`;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ---- Render ----
  function render() {
    if (!gridEl) return;

    gridEl.innerHTML = "";

    // Build 11x11 with headers (top row + left column)
    // We assume your CSS already styles .cell, .header, .square, .taken etc.
    for (let r = -1; r < GRID_SIZE; r++) {
      for (let c = -1; c < GRID_SIZE; c++) {
        const cell = document.createElement("div");

        if (r === -1 && c === -1) {
          // top-left corner (blank)
          cell.className = "cell header";
          cell.textContent = "";
        } else if (r === -1) {
          // top header 0-9
          cell.className = "cell header";
          cell.textContent = String(c);
        } else if (c === -1) {
          // left header 0-9
          cell.className = "cell header";
          cell.textContent = String(r);
        } else {
          // square
          const idx = r * GRID_SIZE + c;
          const sold = state.sold[idx];

          cell.className = "cell square";
          cell.dataset.index = String(idx);

          if (sold) {
            cell.classList.add("taken");
            // SOLD label
            cell.innerHTML = `<span style="
              font-weight:800;
              letter-spacing:.4px;
              font-size:11px;
              opacity:.95;
            ">SOLD</span>`;

            // Hover (desktop)
            cell.addEventListener("mouseenter", (e) => {
              if (pinnedIndex !== null) return;
              const ev = /** @type {MouseEvent} */ (e);
              showTooltipAt(ev.clientX, ev.clientY, tooltipHtml(sold.username));
            });

            cell.addEventListener("mousemove", (e) => {
              if (pinnedIndex !== null) return;
              const ev = /** @type {MouseEvent} */ (e);
              showTooltipAt(ev.clientX, ev.clientY, tooltipHtml(sold.username));
            });

            cell.addEventListener("mouseleave", () => {
              if (pinnedIndex !== null) return;
              hideTooltip();
            });

            // Click (mobile + desktop)
            cell.addEventListener("click", (e) => {
              e.stopPropagation();
              const idxNum = Number(cell.dataset.index);
              if (pinnedIndex === idxNum) {
                pinnedIndex = null;
                hideTooltip();
                return;
              }
              pinnedIndex = idxNum;
              const rect = cell.getBoundingClientRect();
              showTooltipAt(rect.left + rect.width / 2, rect.top + rect.height / 2, tooltipHtml(sold.username));
            });
          } else {
            // Unsold squares: no click-to-select anymore
            cell.addEventListener("click", () => {
              // optional: small hint (kept silent for now)
            });
          }
        }

        gridEl.appendChild(cell);
      }
    }

    if (remainingEl) remainingEl.textContent = String(remainingCount());
  }

  // ---- Random purchase ----
  function handlePurchase(username, email, qty) {
    const avail = availableIndices();
    if (qty > avail.length) {
      setSummary(`Not enough squares left. Only ${avail.length} remaining.`);
      return;
    }

    const chosen = pickRandom(avail, qty);

    chosen.forEach((idx) => {
      state.sold[idx] = { username, email, ts: Date.now() };
    });

    saveState();

    const ids = chosen.map((idx) => indexToCoords(idx).id).join(", ");
    setSummary(`Assigned (random): ${ids}`);
    render();
  }

  // ---- Events ----
  if (formEl) {
    formEl.addEventListener("submit", (e) => {
      e.preventDefault();

      const username = /** @type {HTMLInputElement} */ (document.getElementById("username"))?.value?.trim();
      const email = /** @type {HTMLInputElement} */ (document.getElementById("email"))?.value?.trim();
      const qtyRaw = /** @type {HTMLInputElement} */ (document.getElementById("quantity"))?.value;

      const qty = Math.max(1, Number.parseInt(qtyRaw || "1", 10) || 1);

      if (!username) return setSummary("Please enter a username.");
      if (!email) return setSummary("Please enter an email.");

      handlePurchase(username, email, qty);
    });
  }

  // Click anywhere else closes a pinned tooltip
  document.addEventListener("click", () => {
    if (pinnedIndex !== null) {
      pinnedIndex = null;
      hideTooltip();
    }
  });

  // Escape closes tooltip
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      pinnedIndex = null;
      hideTooltip();
    }
  });

  // Initial render
  render();
})();
