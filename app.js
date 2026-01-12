/*
  Scoreline Squares - FULL app.js (board-style headers)
  - Random square assignment
  - SOLD squares with hover + click tooltip
  - Clicked SOLD square stays highlighted until click-away
  - Creates a new board when one is fully sold (local only)
*/

(() => {
  const GRID_SIZE = 10;
  const TOTAL = 100;
  const SEASON_LABEL = "Superbowl 2026";
  const STORAGE_KEY = "scoreline_squares_full_v1";

  const gridEl = document.getElementById("grid");
  const formEl = document.getElementById("entryForm");
  const remainingEl = document.getElementById("remaining");
  const summaryEl = document.getElementById("summaryText");

  if (!gridEl) return; // safety if app.js is loaded on other pages

  let pinned = null;

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        nextRef: 1,
        activeId: null,
        boards: []
      };
    } catch {
      return { nextRef: 1, activeId: null, boards: [] };
    }
  }

  let state = loadState();

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function createBoard() {
    const ref = `${SEASON_LABEL} • Board #${String(state.nextRef).padStart(4, "0")}`;
    state.nextRef++;

    const b = {
      id: crypto.randomUUID(),
      ref,
      status: "open",
      sold: {} // idx -> {username,email}
    };

    state.boards.unshift(b);
    state.activeId = b.id;
    save();
    return b;
  }

  function getActiveBoard() {
    let b = state.boards.find(x => x.id === state.activeId);
    if (!b || b.status !== "open") b = createBoard();
    return b;
  }

  // ----- Tooltip -----
  const tooltip = document.createElement("div");
  tooltip.style.cssText = `
    position:fixed;
    z-index:9999;
    background:#111827;
    color:white;
    padding:8px 10px;
    border-radius:10px;
    font-size:12px;
    border:1px solid rgba(255,255,255,.14);
    box-shadow: 0 18px 40px rgba(0,0,0,.45);
    display:none;
    pointer-events:none;
    max-width:240px;
  `;
  document.body.appendChild(tooltip);

  function showTooltip(x, y, html) {
    tooltip.innerHTML = html;
    tooltip.style.left = (x + 12) + "px";
    tooltip.style.top = (y + 12) + "px";
    tooltip.style.display = "block";
  }
  function hideTooltip() {
    tooltip.style.display = "none";
  }

  // ----- Purchase (random squares) -----
  function buy(username, email, qty) {
    const b = getActiveBoard();
    const available = [...Array(TOTAL).keys()].filter(i => !b.sold[i]);

    if (qty > available.length) {
      summaryEl.textContent = "Not enough squares left.";
      return;
    }

    available.sort(() => Math.random() - 0.5);
    const chosen = available.slice(0, qty);

    chosen.forEach(i => {
      b.sold[i] = { username, email };
    });

    // board sold out => mark & create a new board
    if (Object.keys(b.sold).length === TOTAL) {
      b.status = "soldout";
      createBoard();
    }

    save();

    // summary
    summaryEl.textContent =
      `Purchased ${qty} square(s)\nBoard: ${b.ref}\nSquares: ` +
      chosen.map(i => `H${i % 10}-A${Math.floor(i / 10)}`).join(", ");

    render();
  }

  // ----- Render board grid (11x11 with headers) -----
  function render() {
    const b = getActiveBoard();
    gridEl.innerHTML = "";

    if (remainingEl) remainingEl.textContent = TOTAL - Object.keys(b.sold).length;

    // Build 11×11: [corner] + top header 0..9, left header 0..9 + 10×10 squares
    for (let r = -1; r < GRID_SIZE; r++) {
      for (let c = -1; c < GRID_SIZE; c++) {
        const cell = document.createElement("div");

        // Corner
        if (r === -1 && c === -1) {
          cell.className = "cell header corner";
          cell.textContent = "";
        }
        // Top header numbers (HOME axis)
        else if (r === -1) {
          cell.className = "cell header";
          cell.textContent = String(c);
        }
        // Left header numbers (AWAY axis)
        else if (c === -1) {
          cell.className = "cell header";
          cell.textContent = String(r);
        }
        // Squares
        else {
          const idx = r * 10 + c;
          const entry = b.sold[idx];

          cell.className = "cell square";
          cell.dataset.idx = String(idx);

          if (entry) {
            cell.classList.add("taken");
            // text handled via ::after SOLD badge in CSS

            // hover tooltip (only if not pinned)
            cell.addEventListener("mouseenter", (e) => {
              if (pinned !== null) return;
              showTooltip(e.clientX, e.clientY, `Buyer: <b>${entry.username}</b>`);
            });
            cell.addEventListener("mouseleave", () => {
              if (pinned !== null) return;
              hideTooltip();
            });

            // click pin tooltip + highlight until click-away
            cell.addEventListener("click", (e) => {
              e.stopPropagation();

              // clear existing selection
              document
                .querySelectorAll(".cell.square.taken.selected")
                .forEach(el => el.classList.remove("selected"));

              // toggle off if clicking same
              if (pinned === idx) {
                pinned = null;
                hideTooltip();
                return;
              }

              pinned = idx;
              cell.classList.add("selected");

              const rect = cell.getBoundingClientRect();
              showTooltip(
                rect.left + rect.width / 2,
                rect.top,
                `Buyer: <b>${entry.username}</b><br/><span style="color:rgba(255,255,255,.75)">Tap anywhere to close</span>`
              );
            });
          }
        }

        gridEl.appendChild(cell);
      }
    }
  }

  // click-away clears pinned highlight + tooltip
  document.addEventListener("click", () => {
    pinned = null;
    hideTooltip();
    document
      .querySelectorAll(".cell.square.taken.selected")
      .forEach(el => el.classList.remove("selected"));
  });

  // ----- Form -----
  if (formEl) {
    formEl.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = formEl.username.value.trim();
      const email = formEl.email.value.trim();
      const qty = Number(formEl.quantity.value);

      if (!username || !email || !qty || qty < 1) {
        summaryEl.textContent = "Please enter username, email, and quantity (min 1).";
        return;
      }

      buy(username, email, qty);
    });
  }

  // ----- Admin buttons (optional) -----
  const exportBtn = document.getElementById("exportBtn");
  const resetBtn = document.getElementById("resetBtn");

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const b = getActiveBoard();
      const rows = [["board", "idx", "homeDigit", "awayDigit", "username", "email"]];
      Object.entries(b.sold).forEach(([idxStr, entry]) => {
        const idx = Number(idxStr);
        rows.push([
          b.ref,
          String(idx),
          String(idx % 10),
          String(Math.floor(idx / 10)),
          entry.username,
          entry.email
        ]);
      });

      const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "scoreline-squares.csv";
      a.click();

      URL.revokeObjectURL(url);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      state = loadState();
      pinned = null;
      hideTooltip();
      render();
      summaryEl.textContent = "Game reset (local test only).";
    });
  }

  // start
  render();
})();
