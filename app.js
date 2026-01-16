/**
 * Scoreline Squares - app.js (stabilized renderer)
 * Goal of this version:
 * - Always render a full 11x11 grid (corner + 0-9 headers + 100 squares)
 * - Avoid fragile coupling to page layout changes
 * - Auto-size to mobile width to reduce / eliminate horizontal scroll
 * - Keep existing “random assignment” purchase behavior
 */

(() => {
  // -------------------- CONFIG --------------------
  const GRID_SIZE = 10;         // 10x10 playable squares
  const TOTAL = GRID_SIZE * GRID_SIZE; // 100
  const STORAGE_KEY = "scoreline_squares_full_v1";

  // -------------------- DOM HELPERS --------------------
  const $ = (id) => document.getElementById(id);

  const gridEl = $("grid");
  if (!gridEl) return; // nothing to do on pages without the grid

  const remainingEl = $("remaining");
  const summaryEl = $("summaryText");
  const formEl = $("entryForm");

  // Optional (won't break if missing)
  const homeTeamEl = $("homeTeam");
  const awayTeamEl = $("awayTeam");

  // -------------------- STATE --------------------
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

  let state = loadState();

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // -------------------- GRID SIZING (MOBILE-FRIENDLY) --------------------
  // We render 11 columns (corner + 0..9) and 11 rows.
  // We compute a cell size that fits the visible container width.
  function applyGridSizing() {
    // Find the nearest card/frame that contains the grid (so sizing is based on visible width)
    const container =
      gridEl.closest(".board-frame") ||
      gridEl.closest(".card") ||
      gridEl.parentElement ||
      document.body;

    const rect = container.getBoundingClientRect();
    const paddingGuess = 24; // safety buffer for inner padding/borders
    const available = Math.max(240, Math.floor(rect.width - paddingGuess));

    // 11 cells across (corner + 10 headers)
    // clamp so it doesn't get too big on desktop and not too tiny on mobile
    let cell = Math.floor(available / 11);

    // Hard clamps (tweak if you want)
    cell = Math.max(22, Math.min(cell, 44));

    // Force CSS grid sizing via inline styles (no dependency on CSS variables)
    gridEl.style.display = "grid";
    gridEl.style.gridTemplateColumns = `repeat(11, ${cell}px)`;
    gridEl.style.gridTemplateRows = `repeat(11, ${cell}px)`;
    gridEl.style.gap = "6px";
    gridEl.style.width = `${cell * 11 + 6 * 10}px`;  // include gaps (10 gaps between 11 cells)
    gridEl.style.height = `${cell * 11 + 6 * 10}px`;
    gridEl.style.boxSizing = "content-box";
  }

  window.addEventListener("resize", () => {
    applyGridSizing();
    render();
  });

  // -------------------- PURCHASE (RANDOM ASSIGNMENT) --------------------
  function buy(username, email, qty) {
    const sold = state.sold || {};
    const available = [];
    for (let i = 0; i < TOTAL; i++) {
      if (!sold[i]) available.push(i);
    }

    if (qty > available.length) {
      if (summaryEl) summaryEl.textContent = "Not enough squares left.";
      return;
    }

    // shuffle
    available.sort(() => Math.random() - 0.5);
    const chosen = available.slice(0, qty);

    chosen.forEach((idx) => {
      sold[idx] = { username, email, ts: Date.now() };
    });

    state.sold = sold;
    save();

    if (summaryEl) {
      const list = chosen
        .map((i) => `R${Math.floor(i / 10)}C${i % 10}`)
        .join(", ");
      summaryEl.textContent = `Purchased ${qty} square(s): ${list}`;
    }

    render();
  }

  // -------------------- RENDER --------------------
  function render() {
    const sold = state.sold || {};
    const soldCount = Object.keys(sold).length;

    if (remainingEl) remainingEl.textContent = String(TOTAL - soldCount);

    // Clear and rebuild (simple & robust)
    gridEl.innerHTML = "";

    // Build 11x11:
    // r=0 header row, c=0 header col, (0,0) blank corner
    for (let r = 0; r <= GRID_SIZE; r++) {
      for (let c = 0; c <= GRID_SIZE; c++) {
        const cell = document.createElement("div");
        cell.className = "cell";

        // Make them "square" not circles even if CSS changes elsewhere
        cell.style.borderRadius = "8px";
        cell.style.display = "flex";
        cell.style.alignItems = "center";
        cell.style.justifyContent = "center";
        cell.style.userSelect = "none";
        cell.style.fontWeight = "700";

        const isCorner = r === 0 && c === 0;
        const isTopHeader = r === 0 && c > 0;
        const isLeftHeader = c === 0 && r > 0;

        if (isCorner) {
          cell.classList.add("cell-corner");
          cell.textContent = "";
        } else if (isTopHeader) {
          cell.classList.add("cell-header");
          cell.textContent = String(c - 1);
        } else if (isLeftHeader) {
          cell.classList.add("cell-header");
          cell.textContent = String(r - 1);
        } else {
          // playable square
          const idx = (r - 1) * GRID_SIZE + (c - 1);
          cell.classList.add("cell-square");
          cell.dataset.idx = String(idx);

          const entry = sold[idx];
          if (entry) {
            cell.classList.add("taken");
            // Keep it minimal visually (CSS can style .taken)
            // Optional label if you want:
            // cell.textContent = "SOLD";
            cell.title = `Sold to: ${entry.username || "Unknown"}`;
          } else {
            cell.classList.add("open");
            cell.title = "Available";
          }
        }

        gridEl.appendChild(cell);
      }
    }
  }

  // -------------------- EVENTS --------------------
  if (formEl) {
    formEl.addEventListener("submit", (e) => {
      e.preventDefault();

      // Support both name="" and id="" styles
      const username =
        (formEl.username && formEl.username.value) ||
        (formEl.querySelector('input[name="username"]')?.value) ||
        "";
      const email =
        (formEl.email && formEl.email.value) ||
        (formEl.querySelector('input[name="email"]')?.value) ||
        "";
      const qtyRaw =
        (formEl.quantity && formEl.quantity.value) ||
        (formEl.querySelector('input[name="quantity"]')?.value) ||
        (formEl.querySelector('input[name="qty"]')?.value) ||
        (formEl.querySelector('input[name="Squares"]')?.value) ||
        (formEl.querySelector('input[type="number"]')?.value) ||
        "1";

      const qty = Math.max(1, Math.min(TOTAL, Number(qtyRaw)));

      buy(String(username).trim(), String(email).trim(), qty);

      // Optional: clear qty only
      const qtyInput =
        formEl.quantity ||
        formEl.querySelector('input[name="quantity"]') ||
        formEl.querySelector('input[type="number"]');
      if (qtyInput) qtyInput.value = "";
    });
  }

  // -------------------- INIT --------------------
  // (Team labels are in HTML/CSS; we just leave placeholders if present)
  if (homeTeamEl && !homeTeamEl.textContent.trim()) homeTeamEl.textContent = "TBC";
  if (awayTeamEl && !awayTeamEl.textContent.trim()) awayTeamEl.textContent = "TBC";

  applyGridSizing();
  render();
})();
