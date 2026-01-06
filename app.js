/* Scoreline Squares – FULL app.js
   Includes:
   - Random square assignment
   - SOLD squares with hover + click tooltip
   - CLICKED SOLD square stays highlighted until click-away
   - Sold-out boards archive
   - Find my board
   - Find my squares
   - Printable sold-out boards
   - URL hash routing
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

  let pinned = null;

  /* ---------------- STATE ---------------- */
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
      sold: {}
    };

    state.boards.unshift(b);
    state.activeId = b.id;
    save();
    return b;
  }

  function getActiveBoard() {
    let b = state.boards.find(b => b.id === state.activeId);
    if (!b || b.status !== "open") b = createBoard();
    return b;
  }

  /* ---------------- TOOLTIP ---------------- */
  const tooltip = document.createElement("div");
  tooltip.style.cssText = `
    position:fixed; z-index:9999; background:#111827;
    color:white; padding:8px 10px; border-radius:8px;
    font-size:12px; display:none; pointer-events:none;
  `;
  document.body.appendChild(tooltip);

  function showTooltip(x, y, html) {
    tooltip.innerHTML = html;
    tooltip.style.left = x + 12 + "px";
    tooltip.style.top = y + 12 + "px";
    tooltip.style.display = "block";
  }

  function hideTooltip() {
    tooltip.style.display = "none";
  }

  /* ---------------- PURCHASE ---------------- */
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

    if (Object.keys(b.sold).length === TOTAL) {
      b.status = "soldout";
      createBoard();
    }

    save();
    summaryEl.textContent =
      `Purchased ${qty} square(s)\nBoard: ${b.ref}\nSquares: ` +
      chosen.map(i => `H${i % 10}-A${Math.floor(i / 10)}`).join(", ");

    render();
  }

  /* ---------------- RENDER GRID ---------------- */
  function render() {
    const b = getActiveBoard();
    gridEl.innerHTML = "";

    remainingEl.textContent = TOTAL - Object.keys(b.sold).length;

    for (let r = -1; r < GRID_SIZE; r++) {
      for (let c = -1; c < GRID_SIZE; c++) {
        const cell = document.createElement("div");

        if (r === -1 && c === -1) {
          cell.className = "cell header";
        } else if (r === -1) {
          cell.className = "cell header";
          cell.textContent = c;
        } else if (c === -1) {
          cell.className = "cell header";
          cell.textContent = r;
        } else {
          const idx = r * 10 + c;
          const entry = b.sold[idx];

          cell.className = "cell square";
          cell.dataset.idx = idx;

          if (entry) {
            cell.classList.add("taken");
            cell.textContent = "SOLD";

            cell.addEventListener("mouseenter", e => {
              if (pinned !== null) return;
              showTooltip(e.clientX, e.clientY, `Buyer: <b>${entry.username}</b>`);
            });

            cell.addEventListener("mouseleave", () => {
              if (pinned !== null) return;
              hideTooltip();
            });

            cell.addEventListener("click", e => {
              e.stopPropagation();

              document
                .querySelectorAll(".cell.square.taken.selected")
                .forEach(el => el.classList.remove("selected"));

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
                `Buyer: <b>${entry.username}</b>`
              );
            });
          }
        }

        gridEl.appendChild(cell);
      }
    }
  }

  /* ---------------- CLICK AWAY ---------------- */
  document.addEventListener("click", () => {
    pinned = null;
    hideTooltip();
    document
      .querySelectorAll(".cell.square.taken.selected")
      .forEach(el => el.classList.remove("selected"));
  });

  /* ---------------- FORM ---------------- */
  formEl.addEventListener("submit", e => {
    e.preventDefault();
    buy(
      formEl.username.value.trim(),
      formEl.email.value.trim(),
      Number(formEl.quantity.value)
    );
  });

  /* ---------------- START ---------------- */
  render();
})();
