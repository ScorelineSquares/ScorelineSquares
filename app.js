/* Scoreline Squares — Board-locked app.js
   Contract:
   - 12x12 CSS grid layout (see Superbowl.css)
   - Home team label spans top
   - Away team label spans left
   - Column headers 0-9, Row headers 0-9
   - 100 squares (idx 0..99)
*/

(() => {
  const GRID_SIZE = 10;
  const TOTAL = 100;
  const STORAGE_KEY = "scoreline_squares_v2";

  const gridEl = document.getElementById("grid");
  const formEl = document.getElementById("entryForm");
  const remainingEl = document.getElementById("remaining");
  const summaryEl = document.getElementById("summaryText");

  // simple tooltip
  const tooltip = document.createElement("div");
  tooltip.style.cssText = `
    position:fixed; z-index:9999; background:#111827; color:#fff;
    padding:8px 10px; border-radius:10px; font-size:12px;
    display:none; pointer-events:none; box-shadow:0 10px 24px rgba(0,0,0,.35);
  `;
  document.body.appendChild(tooltip);

  function showTooltip(x, y, html) {
    tooltip.innerHTML = html;
    tooltip.style.left = `${x + 12}px`;
    tooltip.style.top = `${y + 12}px`;
    tooltip.style.display = "block";
  }
  function hideTooltip() {
    tooltip.style.display = "none";
  }

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        sold: {}, // idx -> { username, email }
      };
    } catch {
      return { sold: {} };
    }
  }

  let state = loadState();
  let pinnedIdx = null;

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function squaresRemaining() {
    return TOTAL - Object.keys(state.sold).length;
  }

  function buy(username, email, qty) {
    const available = [...Array(TOTAL).keys()].filter((i) => !state.sold[i]);
    if (qty > available.length) {
      summaryEl.textContent = "Not enough squares left.";
      return;
    }

    // random assignment
    available.sort(() => Math.random() - 0.5);
    const chosen = available.slice(0, qty);

    chosen.forEach((idx) => {
      state.sold[idx] = { username, email };
    });

    save();
    render();

    summaryEl.textContent =
      `Purchased ${qty} square(s): ` +
      chosen.map((i) => `H${i % 10}-A${Math.floor(i / 10)}`).join(", ");
  }

  function clearGrid() {
    gridEl.innerHTML = "";
  }

  // Helper to create a positioned cell
  function addCell({ text = "", className = "cell", row, col, rowSpan, colSpan, datasetIdx }) {
    const el = document.createElement("div");
    el.className = className;
    el.textContent = text;

    el.style.gridRow = rowSpan ? `${row} / span ${rowSpan}` : `${row}`;
    el.style.gridColumn = colSpan ? `${col} / span ${colSpan}` : `${col}`;

    if (datasetIdx !== undefined) el.dataset.idx = String(datasetIdx);

    gridEl.appendChild(el);
    return el;
  }

  function render() {
    clearGrid();

    // Update remaining
    remainingEl.textContent = String(squaresRemaining());

    // Row/col map:
    // Grid rows: 1=home label, 2=col headers, 3-12 squares
    // Grid cols: 1=away label, 2=row headers, 3-12 squares

    // Top-left blanks
    addCell({ className: "cell blank", row: 1, col: 1 });
    addCell({ className: "cell blank", row: 1, col: 2 });
    addCell({ className: "cell blank", row: 2, col: 1 });
    addCell({ className: "cell blank header", row: 2, col: 2, text: "" });

    // HOME label spanning square columns
    addCell({
      text: "HOME TEAM  TBC",
      className: "cell team home",
      row: 1,
      col: 3,
      colSpan: 10
    });

    // AWAY label spanning square rows
    addCell({
      text: "AWAY TEAM  TBC",
      className: "cell team away",
      row: 3,
      col: 1,
      rowSpan: 10
    });

    // Column headers 0-9
    for (let c = 0; c < GRID_SIZE; c++) {
      addCell({
        text: String(c),
        className: "cell header",
        row: 2,
        col: 3 + c
      });
    }

    // Row headers 0-9
    for (let r = 0; r < GRID_SIZE; r++) {
      addCell({
        text: String(r),
        className: "cell header",
        row: 3 + r,
        col: 2
      });
    }

    // Squares 10x10
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const idx = r * 10 + c;
        const entry = state.sold[idx];

        const cell = addCell({
          text: entry ? "" : "",
          className: "cell square" + (entry ? " taken" : "") + (pinnedIdx === idx ? " selected" : ""),
          row: 3 + r,
          col: 3 + c,
          datasetIdx: idx
        });

        // hover tooltip (only if taken)
        cell.addEventListener("mouseenter", (e) => {
          if (!entry) return;
          if (pinnedIdx !== null) return;
          showTooltip(e.clientX, e.clientY, `Buyer: <b>${entry.username}</b>`);
        });
        cell.addEventListener("mouseleave", () => {
          if (pinnedIdx !== null) return;
          hideTooltip();
        });

        // click pin/unpin
        cell.addEventListener("click", (e) => {
          e.stopPropagation();
          if (!entry) return;

          // clear old
          pinnedIdx = (pinnedIdx === idx) ? null : idx;
          hideTooltip();
          render();

          if (pinnedIdx !== null) {
            showTooltip(e.clientX, e.clientY, `Buyer: <b>${entry.username}</b>`);
          }
        });
      }
    }
  }

  // click away to clear pin
  document.addEventListener("click", () => {
    pinnedIdx = null;
    hideTooltip();
    render();
  });

  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(formEl);
    const username = String(fd.get("username") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const qty = Number(fd.get("quantity"));

    if (!username || !email || !Number.isFinite(qty) || qty <= 0) return;

    buy(username, email, qty);
    formEl.reset();
  });

  render();
})();
